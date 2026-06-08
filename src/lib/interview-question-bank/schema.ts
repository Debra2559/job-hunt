import type { InterviewQuestionBankData } from './types';

export function parseQuestionBankLLMResult(raw: string): InterviewQuestionBankData | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.targetRole || !Array.isArray(parsed?.questions)) return null;
    return parsed as InterviewQuestionBankData;
  } catch {
    return null;
  }
}
