import { extractJsonObject } from '@/lib/llm/json';
import type { SelfIntroData } from './types';

export function parseSelfIntroLLMResult(raw: string): SelfIntroData | null {
  try {
    const parsed = extractJsonObject(raw) as Partial<SelfIntroData>;
    if (!parsed?.targetRole || !parsed?.scripts?.short || !parsed?.scripts?.medium || !parsed?.scripts?.long) return null;
    return parsed as SelfIntroData;
  } catch {
    return null;
  }
}
