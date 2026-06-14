import type { InterviewTipsData } from '@/lib/interviewTips';
import type { ResumeWorkspaceState } from '@/lib/resumeWorkspace';

export type GenerationMode = 'rules' | 'llm' | 'auto';

export type JDAnalysisState = {
  jobTitle?: string;
  companyName?: string;
  jdText?: string;
  keyResponsibilities?: string[];
  requiredSkills?: string[];
  preferredSkills?: string[];
  businessKeywords?: string[];
  roleKeywords?: string[];
  seniority?: string;
  interviewFocus?: string[];
};

export type SelfIntroData = {
  targetRole: string;
  scripts: {
    short: string;
    medium: string;
    long: string;
  };
  projectScript?: {
    experienceTitle: string;
    script: string;
    followUps: string[];
  };
  generationNotes: string[];
  source: 'rules' | 'llm' | 'fallback';
};

export type GenerateSelfIntroInput = {
  workspaceState: ResumeWorkspaceState;
  interviewTipsData?: InterviewTipsData;
  jdAnalysisState?: JDAnalysisState;
  mode?: GenerationMode;
};
