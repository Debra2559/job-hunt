export function extractJsonObject(raw: string): unknown {
  const text = raw.trim();
  if (!text) throw new Error('LLM returned empty content.');

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1]?.trim() || text.replace(/^json\s*/i, '').trim());

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start < 0 || end <= start) {
      throw new Error('LLM response does not contain a JSON object.');
    }
    const sliced = candidate.slice(start, end + 1);
    try {
      return JSON.parse(sliced);
    } catch (error) {
      throw new Error(`Failed to parse LLM JSON response: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }
}
