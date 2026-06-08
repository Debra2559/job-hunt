import type { GenerateSelfIntroInput } from './types';

export function buildSelfIntroPrompt(input: GenerateSelfIntroInput): string {
  return JSON.stringify({
    task: 'Generate self introduction scripts for interview preparation.',
    targetRole: input.workspaceState.targetContext.targetRole,
    resumeData: input.workspaceState.resumeData,
    interviewTipsData: input.interviewTipsData,
    jdAnalysisState: input.jdAnalysisState,
    constraints: ['Do not fabricate experience', 'Keep it natural and interview-friendly'],
  });
}
