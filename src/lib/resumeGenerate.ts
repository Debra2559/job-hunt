import { normalizeResume, type ResumeData } from '@/lib/resumeTypes';
import { callLLM } from '@/lib/llm/llmClient';
import { extractJsonObject } from '@/lib/llm/json';

export async function generateStructuredResume(input: string): Promise<ResumeData> {
  const raw = await callLLM(input);
  const parsed = extractJsonObject(raw);
  return normalizeResume(parsed);
}
