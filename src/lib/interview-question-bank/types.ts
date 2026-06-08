import type { InterviewTipsData } from '@/lib/interviewTips';
import type { ResumeWorkspaceState } from '@/lib/resumeWorkspace';
import type { JDAnalysisState } from '@/lib/self-intro/types';

export type GenerationMode = 'rules' | 'llm' | 'auto';
export type QuestionCount = 5 | 10 | 15 | 20;

export type QuestionCategory =
  | 'education'
  | 'motivation'
  | 'resume_deep_dive'
  | 'role_business'
  | 'behavioral'
  | 'hr_stability'
  | 'reverse_question';

export type InterviewQuestion = {
  id: string;
  category: QuestionCategory;
  question: string;
  interviewerIntent: string;
  answerStrategy: string[];
  sampleAnswer: string;
  followUps: string[];
  materialsToPrepare: string[];
};

export type InterviewQuestionBankData = {
  targetRole: string;
  questionCount: QuestionCount;
  categoryDistribution: Record<QuestionCategory, number>;
  questions: InterviewQuestion[];
  generationNotes: string[];
  source: 'rules' | 'llm' | 'fallback';
};

export type GenerateQuestionBankInput = {
  workspaceState: ResumeWorkspaceState;
  interviewTipsData?: InterviewTipsData;
  jdAnalysisState?: JDAnalysisState;
  questionCount: QuestionCount;
  mode?: GenerationMode;
};
