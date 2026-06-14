import { callLLM } from '@/lib/llm/llmClient';
import { buildQuestionBankPrompt } from './prompts';
import { generateQuestionBankByRules } from './rules';
import { parseQuestionBankLLMResult } from './schema';
import type { GenerateQuestionBankInput, InterviewQuestionBankData } from './types';

export async function generateQuestionBank(input: GenerateQuestionBankInput): Promise<InterviewQuestionBankData> {
  if (input.mode === 'rules') return generateQuestionBankByRules(input);

  try {
    const raw = await callLLM(buildQuestionBankPrompt(input));
    const parsed = parseQuestionBankLLMResult(raw);
    if (parsed) return { ...parsed, source: 'llm' };
  } catch {
    // LLM is intentionally optional. Rules keep the page usable.
  }

  return { ...generateQuestionBankByRules(input), source: 'fallback' };
}
