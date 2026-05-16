export type ParsedOption = { label: string; emoji?: string };

// Heuristic: skip lines that look like a question/prompt rather than an option
const looksLikeQuestion = (text: string) =>
  text.length > 35 ||
  /[?？]/.test(text) ||
  /[:：]\s*$/.test(text) ||
  /[:：].*[\u4e00-\u9fa5]/.test(text) ||
  /(想法是|打算|请选择|你目前|你的)/.test(text);

const stripEmoji = (text: string) =>
  text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();

/**
 * Parse numbered/lettered options from an AI message for interactive buttons.
 * Filters out lines that look like questions, headings, or prompts.
 */
export function parseOptions(content: string): ParsedOption[] {
  const options: ParsedOption[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    let match = trimmed.match(/^([A-Z])[.）、]\s*\*{0,2}(.+?)\*{0,2}$/);
    if (!match) {
      match = trimmed.match(/^\d+[.）、]\s*\*{0,2}(.+?)\*{0,2}$/);
      if (match) {
        const text = stripEmoji(match[1].replace(/\*{1,2}/g, '').trim());
        if (looksLikeQuestion(text)) continue;
        if (text.length > 2 && text.length <= 35) {
          options.push({ label: text });
        }
        continue;
      }
    }
    if (match && match.length >= 3) {
      const text = stripEmoji(match[2].replace(/\*{1,2}/g, '').trim());
      if (looksLikeQuestion(text)) continue;
      if (text.length > 2 && text.length <= 40) {
        options.push({ label: text });
      }
    }
  }

  if (options.length === 0) {
    const inlinePattern = /[「""]([^「""」]{2,25})[」""]/g;
    let inlineMatch: RegExpExecArray | null;
    const candidates: string[] = [];
    while ((inlineMatch = inlinePattern.exec(content)) !== null) {
      candidates.push(inlineMatch[1]);
    }
    if (candidates.length >= 2) {
      candidates.forEach((c) => options.push({ label: c }));
    }
  }

  return options;
}
