export type ParsedOption = { label: string; emoji?: string };

export type FilterReason =
  | 'too-long'
  | 'has-question-mark'
  | 'ends-with-colon'
  | 'colon-followed-by-chinese'
  | 'prompt-keyword'
  | 'too-short'
  | 'exceeds-max-length'
  | 'no-pattern-match';

export type ParseDebugEntry = {
  line: string;
  reason: FilterReason;
  detail?: string;
};

// Detect dev mode in both Vite (browser) and Node/Vitest environments
const isDev = (() => {
  try {
    // @ts-ignore - import.meta.env exists in Vite
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) return true;
  } catch {
    /* noop */
  }
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') return true;
  return false;
})();

// Return the reason a line looks like a question/prompt rather than an option, or null.
function questionReason(text: string): FilterReason | null {
  if (text.length > 200) return 'too-long';
  if (/[?？]$/.test(text)) return 'has-question-mark';
  if (/[:：]\s*$/.test(text)) return 'ends-with-colon';
  if (/(请选择以下|你目前的想法是|你的想法是是什么|请回答)/.test(text)) return 'prompt-keyword';
  return null;
}

const stripEmoji = (text: string) =>
  text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();

const REASON_LABEL: Record<FilterReason, string> = {
  'too-long': '行内文本超过 35 字',
  'has-question-mark': '包含问号',
  'ends-with-colon': '以冒号结尾（问题/提示语）',
  'colon-followed-by-chinese': '冒号后含中文（提示语）',
  'prompt-keyword': '命中提示语关键词（如 想法是/你目前）',
  'too-short': '解析后少于 2 个字符',
  'exceeds-max-length': '解析后超过最大长度',
  'no-pattern-match': '未匹配任何编号/字母选项模式',
};

function logFiltered(entries: ParseDebugEntry[]) {
  if (!isDev || entries.length === 0) return;
  // eslint-disable-next-line no-console
  console.groupCollapsed(`[parseOptions] 过滤了 ${entries.length} 行`);
  entries.forEach((e) => {
    // eslint-disable-next-line no-console
    console.log(`✕ ${REASON_LABEL[e.reason]}${e.detail ? ` · ${e.detail}` : ''}\n  → ${e.line}`);
  });
  // eslint-disable-next-line no-console
  console.groupEnd();
}

/**
 * Parse numbered/lettered options from an AI message for interactive buttons.
 * Filters out lines that look like questions, headings, or prompts.
 *
 * In development, emits a collapsed console group listing every filtered line and reason.
 * Pass `collectDebug: true` to also return the entries for inspection/tests.
 */
export function parseOptions(
  content: string,
  opts?: { collectDebug?: boolean }
): ParsedOption[] & { debug?: ParseDebugEntry[] } {
  const options: ParsedOption[] = [];
  const debug: ParseDebugEntry[] = [];
  const lines = content.split('\n');

  const pushFiltered = (line: string, reason: FilterReason, detail?: string) => {
    debug.push({ line, reason, detail });
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    let match = trimmed.match(/^([A-Z])[.）、]\s*\*{0,2}(.+?)\*{0,2}$/);
    let captured: string | null = null;
    let maxLen = 40;

    if (match && match.length >= 3) {
      captured = stripEmoji(match[2].replace(/\*{1,2}/g, '').trim());
      maxLen = 40;
    } else {
      match = trimmed.match(/^\d+[.）、]\s*\*{0,2}(.+?)\*{0,2}$/);
      if (match) {
        captured = stripEmoji(match[1].replace(/\*{1,2}/g, '').trim());
        maxLen = 35;
      }
    }

    if (captured === null) {
      // Only flag prose lines that look like they were *meant* to be options
      // (avoid spamming for empty/heading/markdown lines)
      if (/^[\d一二三四五六七八九十A-Z]/.test(trimmed)) {
        pushFiltered(trimmed, 'no-pattern-match');
      }
      continue;
    }

    const reason = questionReason(captured);
    if (reason) {
      pushFiltered(trimmed, reason, `提取: "${captured}"`);
      continue;
    }
    if (captured.length < 2) {
      pushFiltered(trimmed, 'too-short', `提取: "${captured}"`);
      continue;
    }
    if (captured.length > maxLen) {
      pushFiltered(trimmed, 'exceeds-max-length', `${captured.length} > ${maxLen}`);
      continue;
    }
    options.push({ label: captured });
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

  logFiltered(debug);

  const result = options as ParsedOption[] & { debug?: ParseDebugEntry[] };
  if (opts?.collectDebug) result.debug = debug;
  return result;
}
