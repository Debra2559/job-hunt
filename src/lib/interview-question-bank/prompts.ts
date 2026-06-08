import type { GenerateQuestionBankInput } from './types';

export function buildQuestionBankPrompt(input: GenerateQuestionBankInput): string {
  return JSON.stringify({
    task: 'Generate an interview question bank.',
    targetRole: input.workspaceState.targetContext.targetRole,
    questionCount: input.questionCount,
    resumeData: input.workspaceState.resumeData,
    interviewTipsData: input.interviewTipsData,
    jdAnalysisState: input.jdAnalysisState,
    constraints: ['Questions must be grounded in resume and target role', 'Do not fabricate experience'],
  });
}
