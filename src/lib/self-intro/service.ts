import { callLLM } from '@/lib/llm/llmClient';
import { buildSelfIntroPrompt } from './prompts';
import { generateSelfIntroByRules } from './rules';
import { parseSelfIntroLLMResult } from './schema';
import type { GenerateSelfIntroInput, SelfIntroData } from './types';

export async function generateSelfIntro(input: GenerateSelfIntroInput): Promise<SelfIntroData> {
  if (input.mode === 'rules') return generateSelfIntroByRules(input);

  try {
    const raw = await callLLM(buildSelfIntroPrompt(input));
    const parsed = parseSelfIntroLLMResult(raw);
    if (parsed) return { ...parsed, source: 'llm' };
  } catch {
    // LLM is intentionally optional. Rules keep the page usable.
  }

  return { ...generateSelfIntroByRules(input), source: 'fallback' };
}
