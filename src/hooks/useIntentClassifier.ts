import { useMemo } from 'react';

/**
 * Intent classifier for the Companion Agent.
 * Hybrid approach: keyword rules first, LLM fallback when confidence is low.
 */

export type IntentType = 'practical' | 'emotional' | 'mixed' | 'unknown';

export type IntentResult = {
  intent: IntentType;
  confidence: number;       // 0-1
  moodTags: string[];       // matched emotion/scenario tags
  practicalScore: number;   // raw keyword match count for practical
  emotionalScore: number;   // raw keyword match count for emotional
};

// ---- Practical keywords (resume, interview, strategy, etc.) ----
const PRACTICAL_KEYWORDS: Array<{ word: string; weight: number }> = [
  { word: '简历', weight: 1 },
  { word: '面试', weight: 1 },
  { word: '投递', weight: 1 },
  { word: '笔试', weight: 1 },
  { word: '薪资', weight: 1 },
  { word: 'offer', weight: 1 },
  { word: '谈薪', weight: 1 },
  { word: '群面', weight: 1 },
  { word: '内推', weight: 1 },
  { word: '自我介绍', weight: 1 },
  { word: '反问', weight: 1 },
  { word: '网申', weight: 1 },
  { word: '笔试', weight: 1 },
  { word: '技术面', weight: 1 },
  { word: 'HR面', weight: 1 },
  { word: '终面', weight: 1 },
  { word: '实习', weight: 0.5 },
  { word: '项目', weight: 0.5 },
  { word: '技能', weight: 0.5 },
  { word: '作品集', weight: 0.5 },
  { word: '准备', weight: 0.3 },
  { word: '选offer', weight: 1 },
  { word: '比较offer', weight: 1 },
  { word: '怎么选', weight: 0.7 },
  { word: '选哪个', weight: 0.7 },
  { word: '大厂', weight: 0.5 },
  { word: '小厂', weight: 0.5 },
  { word: '秋招', weight: 0.5 },
  { word: '春招', weight: 0.5 },
  { word: '社招', weight: 0.5 },
  { word: '转正', weight: 0.5 },
  { word: '背调', weight: 0.7 },
  { word: '签约', weight: 0.7 },
  { word: '三方', weight: 0.7 },
];

// ---- Emotional keywords (rejection, anxiety, confusion, etc.) ----
const EMOTIONAL_KEYWORDS: Array<{ word: string; weight: number }> = [
  { word: '被拒', weight: 1 },
  { word: '焦虑', weight: 1 },
  { word: '迷茫', weight: 1 },
  { word: '崩溃', weight: 1 },
  { word: '丧', weight: 1 },
  { word: '放弃', weight: 1 },
  { word: '没戏', weight: 1 },
  { word: '太难', weight: 0.7 },
  { word: '不知道怎么办', weight: 1 },
  { word: '是不是不适合', weight: 1 },
  { word: '怀疑自己', weight: 1 },
  { word: '坚持不下去', weight: 1 },
  { word: '想哭', weight: 1 },
  { word: '抑郁', weight: 1 },
  { word: '绝望', weight: 1 },
  { word: '躺平', weight: 0.7 },
  { word: '卷不动', weight: 1 },
  { word: '心态崩', weight: 1 },
  { word: '没信心', weight: 1 },
  { word: '被打击', weight: 1 },
  { word: '低人一等', weight: 1 },
  { word: '不如别人', weight: 1 },
  { word: '别人都拿到了', weight: 1 },
  { word: '就我没有', weight: 1 },
  { word: '选错了', weight: 0.7 },
  { word: '后悔', weight: 0.7 },
  { word: '害怕', weight: 0.7 },
  { word: '慌', weight: 0.7 },
  { word: '失眠', weight: 0.7 },
  { word: '压力', weight: 0.5 },
  { word: '怎么办', weight: 0.5 },
  { word: '好难', weight: 0.7 },
];

/**
 * Map intent to relevant quote mood tags for the backend
 */
function intentToMoodTags(practicalScore: number, emotionalScore: number): string[] {
  const tags: string[] = [];

  if (emotionalScore >= 2) {
    tags.push('焦虑/迷茫', '坚持/韧性', '失败/挫折');
  } else if (emotionalScore >= 1) {
    tags.push('焦虑/迷茫', '坚持/韧性');
  }

  if (practicalScore >= 2) {
    tags.push('选择/决策', '行动/执行力', '成长/学习');
  } else if (practicalScore >= 1) {
    tags.push('行动/执行力');
  }

  // Always include some core tags
  tags.push('长期主义', '第一份工作');

  return tags;
}

/**
 * Classify user input into practical / emotional / mixed / unknown.
 * Returns intent type, confidence score, and relevant mood tags for the backend.
 *
 * @param input - The user's raw text input
 * @returns IntentResult with classification details
 */
export function classifyIntent(input: string): IntentResult {
  const normalized = input.toLowerCase().trim();

  let practicalScore = 0;
  let emotionalScore = 0;

  for (const kw of PRACTICAL_KEYWORDS) {
    if (normalized.includes(kw.word)) {
      practicalScore += kw.weight;
    }
  }

  for (const kw of EMOTIONAL_KEYWORDS) {
    if (normalized.includes(kw.word)) {
      emotionalScore += kw.weight;
    }
  }

  // Determine intent
  let intent: IntentType;
  let confidence: number;

  if (practicalScore >= 1.5 && emotionalScore >= 1.5) {
    intent = 'mixed';
    confidence = Math.min(0.9, (practicalScore + emotionalScore) / 6);
  } else if (practicalScore >= 1.5) {
    intent = 'practical';
    confidence = Math.min(0.95, practicalScore / 4);
  } else if (emotionalScore >= 1.5) {
    intent = 'emotional';
    confidence = Math.min(0.95, emotionalScore / 4);
  } else if (practicalScore > 0 || emotionalScore > 0) {
    // Low signal: pick the stronger side but mark as low confidence
    intent = practicalScore >= emotionalScore ? 'practical' : 'emotional';
    confidence = Math.max(0.1, Math.max(practicalScore, emotionalScore) / 5);
  } else {
    intent = 'unknown';
    confidence = 0;
  }

  const moodTags = intentToMoodTags(practicalScore, emotionalScore);

  return { intent, confidence, moodTags, practicalScore, emotionalScore };
}

/**
 * React hook wrapper around classifyIntent with memoization.
 */
export function useIntentClassifier(input: string): IntentResult {
  return useMemo(() => classifyIntent(input), [input]);
}

/**
 * Determine if the result should fallback to backend LLM classification.
 * True when confidence is too low for reliable routing.
 */
export function needsLLMFallback(result: IntentResult): boolean {
  return result.intent === 'unknown' || result.confidence < 0.3;
}
