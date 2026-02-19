import React, { useState } from 'react';
import { ResumeAnalysisResult, ChatMessage, User } from '../types';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  Tooltip
} from 'recharts';
import { 
  CheckCircle, AlertTriangle, Award, TrendingUp, 
  FileText, MessageSquare, ArrowRight, BookOpen, Target, Lock, Crown
} from 'lucide-react';
import { chatWithCareerCoach } from '../services/geminiService';

interface DashboardProps {
  data: ResumeAnalysisResult;
  onReset: () => void;
  user: User | null;
  onUpgrade: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onReset, user, onUpgrade }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'optimize' | 'career'>('overview');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  const isVip = user?.isVip || false;

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
    const updatedMessages = [...chatMessages, newMessage];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsChatting(true);

    try {
      const history = updatedMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      if (history.length === 1) {
         history[0].parts[0].text = `[Context: Resume Score ${data.overallScore}/100. Strengths: ${data.contentStrengths.join(', ')}. Weaknesses: ${data.contentWeaknesses.join(', ')}] \n\n User Question: ${history[0].parts[0].text}`;
      }

      const reply = await chatWithCareerCoach(history, chatInput);
      setChatMessages(prev => [...prev, { role: 'model', text: reply || "I'm sorry, I couldn't process that right now.", timestamp: Date.now() }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'model', text: "Connection issues. Please try again later.", timestamp: Date.now() }]);
    } finally {
      setIsChatting(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 col-span-1 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
          <h3 className="text-slate-500 font-medium mb-2 uppercase tracking-wider text-xs">Career Score</h3>
          <div className="relative flex items-center justify-center">
             <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle cx="64" cy="64" r="56" stroke={data.overallScore > 80 ? '#10b981' : data.overallScore > 60 ? '#f59e0b' : '#ef4444'} strokeWidth="8" fill="transparent" strokeDasharray={351.86} strokeDashoffset={351.86 - (351.86 * data.overallScore) / 100} className="transition-all duration-1000 ease-out" />
             </svg>
             <span className="absolute text-4xl font-bold text-slate-800">{data.overallScore}</span>
          </div>
          <p className="text-center mt-4 text-sm text-slate-600 px-2 leading-relaxed">{data.summaryFeedback}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 col-span-1 md:col-span-2">
           <h3 className="text-slate-500 font-medium mb-4 uppercase tracking-wider text-xs flex items-center">
             <Target className="w-4 h-4 mr-1" /> Skill Profile & Market Match
           </h3>
           <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.skillsAnalysis}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Current" dataKey="currentLevel" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Radar name="Demand" dataKey="marketDemand" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
           <h4 className="flex items-center text-red-800 font-semibold mb-3">
             <AlertTriangle className="w-5 h-5 mr-2" /> Improvement Areas
           </h4>
           <ul className="space-y-2">
             {data.contentWeaknesses.map((item, i) => (
               <li key={i} className="flex items-start text-sm text-red-700">
                 <span className="mr-2 mt-1">•</span>{item}
               </li>
             ))}
             {data.formattingIssues.map((item, i) => (
               <li key={`fmt-${i}`} className="flex items-start text-sm text-red-700">
                 <span className="mr-2 mt-1">•</span>{item}
               </li>
             ))}
           </ul>
        </div>
        <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
           <h4 className="flex items-center text-green-800 font-semibold mb-3">
             <CheckCircle className="w-5 h-5 mr-2" /> Core Strengths
           </h4>
           <ul className="space-y-2">
             {data.contentStrengths.map((item, i) => (
               <li key={i} className="flex items-start text-sm text-green-700">
                 <span className="mr-2 mt-1">•</span>{item}
               </li>
             ))}
           </ul>
        </div>
      </div>
    </div>
  );

  const renderOptimization = () => (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center">
          <Award className="w-6 h-6 mr-2 text-yellow-500" /> Optimized Resume Content
        </h3>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">STAR Method Applied</span>
      </div>
      <div className="prose prose-slate max-w-none">
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
          {data.optimizedResumeContent}
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button 
          onClick={() => {
            navigator.clipboard.writeText(data.optimizedResumeContent);
            alert("Copied to clipboard!");
          }}
          className="flex items-center space-x-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-xl font-medium transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Copy Optimized Text</span>
        </button>
      </div>
    </div>
  );

  const renderCareer = () => (
    <div className="space-y-6 animate-fade-in">
       <div className="grid grid-cols-1 gap-6">
          {data.recommendedPaths.map((path, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-slate-800">{path.role}</h4>
                <div className="flex items-center">
                  <div className="mr-2 text-xs text-slate-500">Match Score</div>
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${path.matchScore}%` }}></div>
                  </div>
                  <span className="ml-2 text-sm font-bold text-blue-600">{path.matchScore}%</span>
                </div>
              </div>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">{path.gapAnalysis}</p>
              <div>
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Growth Recommendations</h5>
                <div className="flex flex-wrap gap-2">
                  {path.learningPath.map((step, sIdx) => (
                    <span key={sIdx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      <BookOpen className="w-3 h-3 mr-1" /> {step}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
       </div>

       <div className="relative rounded-2xl shadow-sm border border-slate-100 bg-white overflow-hidden">
           <div className={`flex flex-col h-[500px] transition-all duration-300 ${!isVip ? 'blur-sm select-none opacity-50 pointer-events-none' : ''}`}>
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3">
                    AI
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">AI Career Mentor</h4>
                    <p className="text-xs text-slate-500">Deep 1-on-1 consultations</p>
                  </div>
                </div>
                {isVip && <div className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded border border-yellow-200 flex items-center"><Crown className="w-3 h-3 mr-1" /> VIP Access</div>}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center text-slate-400 mt-20">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>I am your dedicated career mentor.<br/>Ask me about interviews, salary negotiations, or career planning.</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' 
                        : 'bg-slate-100 text-slate-800 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                     <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                     </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleChatSubmit} className="p-4 border-t border-slate-100 flex gap-2 bg-white">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask for more advice..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={isChatting}
                />
                <button 
                  type="submit"
                  disabled={isChatting || !chatInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
           </div>

           {!isVip && (
             <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
               <div className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center max-w-sm border border-slate-100 mx-4">
                 <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center mx-auto mb-5">
                   <Lock className="w-8 h-8 text-yellow-600" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 mb-2">Unlock AI Mentor</h3>
                 <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                   Upgrade to PRO to unlock unlimited 1-on-1 career mentor chats,<br/>interview prep, and comprehensive guidance.
                 </p>
                 <button 
                   onClick={onUpgrade}
                   className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold rounded-xl shadow-lg hover:shadow-yellow-500/30 transition-all flex items-center justify-center"
                 >
                   <Crown className="w-5 h-5 mr-2" />
                   Upgrade Now
                 </button>
               </div>
             </div>
           )}
       </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Evaluation Report</h1>
           <p className="text-slate-500 text-sm">Generated in real-time by AI Agent</p>
        </div>
        <button onClick={onReset} className="text-sm text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
          Reset Analysis
        </button>
      </div>

      <div className="flex space-x-1 mb-8 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'optimize', label: 'Resume Optimization', icon: FileText },
          { id: 'career', label: 'Career Path', icon: Target },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center px-6 py-2 rounded-lg text-sm font-semibold transition-all
              ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
            `}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'optimize' && renderOptimization()}
        {activeTab === 'career' && renderCareer()}
      </div>
    </div>
  );
};