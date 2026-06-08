import type { ResumeData } from '@/lib/resumeTypes';
import type { ResumeRoleContext } from '@/lib/resumeRoleContext';

export const RESUME_WORKSPACE_STORAGE_KEY = 'resumeWorkspaceState';

export type ResumeTargetContext = ResumeRoleContext;

export type SkillGroup = {
  title: string;
  skills: string[];
};

export type AbilityItem = {
  name: string;
  evidence: string;
};

export type AISuggestion = {
  id: string;
  type: '岗位匹配' | '信息完整度' | '技能可信度' | '表达专业度' | '真实性风险' | '量化建议';
  severity: 'high' | 'medium' | 'low';
  section: string;
  problem: string;
  suggestion: string;
  suggestedRewrite?: string;
};

export type ResumeWorkspaceState = {
  source: 'quest' | 'upload';
  targetContext: ResumeTargetContext;
  resumeData: ResumeData;
  skillGroups?: SkillGroup[];
  abilitySummary?: AbilityItem[];
  aiSuggestions?: AISuggestion[];
  createdAt: string;
};

export function saveResumeWorkspaceState(state: ResumeWorkspaceState) {
  localStorage.setItem(RESUME_WORKSPACE_STORAGE_KEY, JSON.stringify(state));
}

export function readResumeWorkspaceState(): ResumeWorkspaceState | null {
  try {
    const raw = localStorage.getItem(RESUME_WORKSPACE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.resumeData || !parsed?.targetContext) return null;
    return parsed as ResumeWorkspaceState;
  } catch {
    return null;
  }
}
