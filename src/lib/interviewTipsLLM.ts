import type { InterviewTipsData } from '@/lib/interviewTips';
import type { ResumeWorkspaceState } from '@/lib/resumeWorkspace';

export type InterviewTipsLLMInput = {
  workspace: ResumeWorkspaceState;
  ruleBasedTips: InterviewTipsData;
};

export async function generateInterviewTipsWithLLM(
  _input: InterviewTipsLLMInput,
): Promise<InterviewTipsData | null> {
  // LLM integration is intentionally isolated here.
  // Future implementation can call ch2-toolkit with an interview-tips mode.
  return null;
}
