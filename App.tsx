import React, { useState, useRef, useEffect } from 'react';
import { analyzeResume } from './services/geminiService';
import { Dashboard } from './components/Dashboard';
import { AppState, ResumeAnalysisResult, User, ResumeInput, AnalysisRecord } from './types';
import { UploadCloud, FileText, Briefcase, Sparkles, Loader2, Cpu, User as UserIcon, LogOut, Crown, Check, X, File as FileIcon, Image as ImageIcon, History, ChevronRight, Calendar, Zap, MessageSquare, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  
  const [resumeText, setResumeText] = useState('');
  const [resumeFile, setResumeFile] = useState<{name: string, type: string, data: string} | null>(null);
  const [jobDesc, setJobDesc] = useState('');
  
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('app_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;
    const newUser: User = {
      id: Date.now().toString(),
      name: loginEmail.split('@')[0],
      email: loginEmail,
      isVip: false,
      history: []
    };
    setUser(newUser);
    localStorage.setItem('app_user', JSON.stringify(newUser));
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('app_user');
    setAppState(AppState.IDLE);
    resetApp();
  };

  const handleUpgradeVip = () => {
    if (!user) {
      setShowVipModal(false);
      setShowLoginModal(true);
      return;
    }
    const upgradedUser = { ...user, isVip: true };
    setUser(upgradedUser);
    localStorage.setItem('app_user', JSON.stringify(upgradedUser));
    setShowVipModal(false);
  };

  const saveToHistory = (result: ResumeAnalysisResult, resumeName: string, targetJob?: string) => {
    if (!user) return;
    
    const newRecord: AnalysisRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      resumeName,
      result,
      targetJob
    };

    const updatedUser = {
      ...user,
      history: [newRecord, ...user.history].slice(0, 20)
    };
    
    setUser(updatedUser);
    localStorage.setItem('app_user', JSON.stringify(updatedUser));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      alert("File size cannot exceed 4MB");
      return;
    }

    if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
       try {
         const arrayBuffer = await file.arrayBuffer();
         // @ts-ignore
         const result = await mammoth.extractRawText({ arrayBuffer });
         setResumeText(result.value);
         setInputMode('text');
         return;
       } catch (err) {
         console.error("Word parsing failed", err);
         alert("Word document parsing failed, please try copying the text directly.");
         return;
       }
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      setResumeFile({
        name: file.name,
        type: file.type,
        data: base64
      });
      setInputMode('file');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleAnalyze = async () => {
    if (inputMode === 'text' && !resumeText.trim()) return;
    if (inputMode === 'file' && !resumeFile) return;

    setAppState(AppState.ANALYZING);
    setErrorMsg('');

    try {
      const input: ResumeInput = {};
      let resumeName = "Text Input";
      
      if (inputMode === 'text') {
        input.text = resumeText;
      } else if (resumeFile) {
        input.fileData = {
          mimeType: resumeFile.type,
          data: resumeFile.data
        };
        resumeName = resumeFile.name;
      }

      const result = await analyzeResume(input, jobDesc);
      setAnalysisResult(result);
      saveToHistory(result, resumeName, jobDesc);
      setAppState(AppState.RESULTS);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Something went wrong during analysis. Please check your connection or try again later.");
      setAppState(AppState.ERROR);
    }
  };

  const viewRecord = (record: AnalysisRecord) => {
    setAnalysisResult(record.result);
    setAppState(AppState.RESULTS);
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setAnalysisResult(null);
    setResumeText('');
    setResumeFile(null);
    setJobDesc('');
  };

  const renderHeader = () => (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={resetApp}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Cpu className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-800 tracking-tight">Career AI Pro</span>
        </div>
        <div className="flex items-center space-x-4">
           {user ? (
             <div className="flex items-center space-x-4">
               <button 
                onClick={() => setAppState(AppState.HISTORY)}
                className={`text-sm font-medium flex items-center ${appState === AppState.HISTORY ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
               >
                 <History className="w-4 h-4 mr-1" /> History
               </button>
               <div className="h-4 w-px bg-slate-200"></div>
               <div className="flex items-center space-x-3">
                 <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-700 flex items-center">
                      {user.name}
                      {user.isVip && <Crown className="w-3 h-3 ml-1 text-yellow-500 fill-current" />}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{user.isVip ? 'PRO Member' : 'Free User'}</span>
                 </div>
                 <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                   <LogOut className="w-4 h-4" />
                 </button>
               </div>
             </div>
           ) : (
             <button onClick={() => setShowLoginModal(true)} className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-1.5 rounded-full transition-colors">
               Login / Sign Up
             </button>
           )}
        </div>
      </div>
    </header>
  );

  const renderHistory = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center">
          <History className="w-6 h-6 mr-2 text-blue-500" /> Evaluation History
        </h2>
        <button onClick={resetApp} className="text-sm text-blue-600 hover:underline">
          Back to Home
        </button>
      </div>

      {!user?.history || user.history.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <History className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800 mb-2">No history records found</h3>
          <p className="text-slate-500 mb-6">Upload your first resume to start the analysis!</p>
          <button onClick={resetApp} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium">Get Started</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {user.history.map((record) => (
            <div 
              key={record.id} 
              onClick={() => viewRecord(record)}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{record.resumeName}</h4>
                  <div className="flex items-center text-xs text-slate-400 space-x-3 mt-1">
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date(record.timestamp).toLocaleDateString()}</span>
                    {record.targetJob && <span className="flex items-center"><Briefcase className="w-3 h-3 mr-1" /> {record.targetJob}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600">Score: {record.result.overallScore}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Overall Score</div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderVipModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
       <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden relative animate-fade-in-up shadow-2xl">
          <button onClick={() => setShowVipModal(false)} className="absolute top-4 right-4 z-20 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1 transition-all">
            <X className="w-6 h-6" />
          </button>
          <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 p-10 text-white text-center relative overflow-hidden">
             {/* Decorative element */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
             <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full -ml-12 -mb-12 blur-xl"></div>
             
             <div className="relative z-10">
               <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-yellow-500/20 animate-bounce">
                 <Crown className="w-10 h-10 text-indigo-900 fill-current" />
               </div>
               <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Upgrade to PRO</h2>
               <p className="text-blue-100 font-medium">Take your career to the next level with exclusive features</p>
             </div>
          </div>
          <div className="p-8 md:p-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <div className="flex items-start">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mr-4 shrink-0">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Unlimited Chat</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">24/7 access to your AI Mentor without any limits.</p>
                  </div>
               </div>
               <div className="flex items-start">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mr-4 shrink-0">
                    <Zap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Advanced Analysis</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Deep-dive insights powered by higher-tier AI models.</p>
                  </div>
               </div>
               <div className="flex items-start">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mr-4 shrink-0">
                    <History className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Full History</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Save and compare up to 50 resume evaluations.</p>
                  </div>
               </div>
               <div className="flex items-start">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mr-4 shrink-0">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Priority Support</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Get your questions answered first by our tech team.</p>
                  </div>
               </div>
             </div>
             <button 
               onClick={handleUpgradeVip}
               className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl hover:shadow-indigo-500/10 active:scale-[0.98] flex items-center justify-center group"
             >
               <span>Unlock Everything Now</span>
               <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
             </button>
             <p className="text-center text-[10px] text-slate-400 mt-4">Simulated payment experience for demonstration purposes.</p>
          </div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {renderHeader()}

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {appState === AppState.HISTORY && renderHistory()}
        
        {appState === AppState.IDLE && (
          <div className="w-full max-w-3xl animate-fade-in-up">
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                Boost Your Career with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Next-Gen Multimodal</span> Intelligence
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Supports Word, PDF, and Images. Uncover your professional potential with precise scoring, content optimization, and personalized career planning.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="flex border-b border-slate-100">
                 <button 
                   onClick={() => setInputMode('text')}
                   className={`flex-1 py-4 text-sm font-medium flex items-center justify-center transition-colors ${inputMode === 'text' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   <FileText className="w-4 h-4 mr-2" /> Paste Resume Text
                 </button>
                 <button 
                   onClick={() => setInputMode('file')}
                   className={`flex-1 py-4 text-sm font-medium flex items-center justify-center transition-colors ${inputMode === 'file' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   <UploadCloud className="w-4 h-4 mr-2" /> Upload Resume File
                 </button>
              </div>

              <div className="p-8 space-y-6">
                {inputMode === 'text' ? (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Resume Content
                    </label>
                    <textarea 
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm leading-relaxed resize-none placeholder-slate-400"
                      placeholder="Paste your resume content here..."
                    ></textarea>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Upload File (Word / PDF / Image)
                    </label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className={`
                        w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all
                        ${resumeFile ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/30'}
                      `}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept=".pdf,.docx,.doc,image/png,image/jpeg,image/jpg"
                        onChange={handleFileChange}
                      />
                      {resumeFile ? (
                         <div className="text-center">
                            {resumeFile.type.includes('image') ? (
                              <ImageIcon className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                            ) : (
                              <FileIcon className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                            )}
                            <p className="font-medium text-slate-700">{resumeFile.name}</p>
                            <p className="text-xs text-slate-400 mt-1">Click to change file</p>
                         </div>
                      ) : (
                        <div className="text-center text-slate-400">
                          <UploadCloud className="w-10 h-10 mx-auto mb-2 opacity-50" />
                          <p className="font-medium text-slate-600">Click or drag to upload</p>
                          <p className="text-xs mt-1">Supports .docx, .pdf, .jpg, .png</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    <Briefcase className="w-4 h-4 mr-2 text-indigo-500" />
                    Target Job Description (Optional)
                  </label>
                  <textarea 
                    value={jobDesc}
                    onChange={(e) => setJobDesc(e.target.value)}
                    className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm leading-relaxed resize-none placeholder-slate-400"
                    placeholder="Paste the job description you're applying for to get specific analysis..."
                  ></textarea>
                </div>

                <button 
                  onClick={handleAnalyze}
                  disabled={(inputMode === 'text' && !resumeText.trim()) || (inputMode === 'file' && !resumeFile)}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start AI Evaluation
                </button>
              </div>
            </div>
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">Multi-Format Support</h3>
                <p className="text-sm text-slate-500">Automatically parse various file types to extract core experience and skills.</p>
              </div>
              <div className="p-4">
                 <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">History Management</h3>
                <p className="text-sm text-slate-500">Save multiple reports to track your optimization progress over time.</p>
              </div>
              <div className="p-4">
                 <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">Job Matching</h3>
                <p className="text-sm text-slate-500">Targeted keyword optimization based on specific job personas.</p>
              </div>
            </div>
          </div>
        )}

        {appState === AppState.RESULTS && analysisResult && (
          <Dashboard 
            data={analysisResult} 
            onReset={resetApp} 
            user={user}
            onUpgrade={() => setShowVipModal(true)}
          />
        )}

        {(appState === AppState.ANALYZING) && (
          <div className="flex flex-col items-center justify-center text-center animate-fade-in">
             <div className="relative mb-8">
               <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
               <Loader2 className="w-16 h-16 text-blue-600 animate-spin relative z-10" />
             </div>
             <h2 className="text-2xl font-bold text-slate-800 mb-2">Analyzing your profile...</h2>
             <p className="text-slate-500 max-w-md">Extracting key points and matching market demands. Please wait a moment.</p>
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="text-center animate-fade-in max-w-md">
             <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
               <Sparkles className="w-8 h-8 rotate-45" />
             </div>
             <h2 className="text-xl font-bold text-slate-800 mb-2">Evaluation Failed</h2>
             <p className="text-slate-500 mb-6">{errorMsg}</p>
             <button 
               onClick={resetApp}
               className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
             >
               Try Again
             </button>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
         <div className="max-w-5xl mx-auto px-4 text-center text-slate-400 text-sm">
           <p>© 2024 Career AI Pro. Powered by Advanced AI Technologies.</p>
         </div>
      </footer>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl p-8 w-full max-w-sm relative animate-fade-in-up shadow-2xl">
              <button onClick={() => setShowLoginModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Welcome</h2>
                <p className="text-slate-500 text-sm">Log in to save your career evaluation reports</p>
              </div>
              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="example@email.com"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Login / Sign Up
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-4">
                  By logging in, you agree to our Terms and Privacy Policy
                </p>
              </form>
           </div>
        </div>
      )}

      {showVipModal && renderVipModal()}
    </div>
  );
};

export default App;