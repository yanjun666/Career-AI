export interface SkillMetric {
  skill: string;
  currentLevel: number; // 0-100
  marketDemand: number; // 0-100
}

export interface CareerPath {
  role: string;
  matchScore: number;
  gapAnalysis: string;
  learningPath: string[];
}

export interface ResumeAnalysisResult {
  overallScore: number;
  summaryFeedback: string;
  skillsAnalysis: SkillMetric[];
  formattingIssues: string[];
  contentStrengths: string[];
  contentWeaknesses: string[];
  optimizedResumeContent: string;
  recommendedPaths: CareerPath[];
}

export interface AnalysisRecord {
  id: string;
  timestamp: number;
  resumeName: string;
  result: ResumeAnalysisResult;
  targetJob?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR',
  HISTORY = 'HISTORY'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isVip: boolean;
  avatarUrl?: string;
  history: AnalysisRecord[];
}

export interface ResumeInput {
  text?: string;
  fileData?: {
    mimeType: string;
    data: string; // base64
  };
}