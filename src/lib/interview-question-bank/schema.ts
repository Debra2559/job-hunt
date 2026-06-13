import { extractJsonObject } from '@/lib/llm/json';
import type { InterviewQuestion, InterviewQuestionBankData, QuestionCategory, QuestionCount } from './types';

const CATEGORIES: QuestionCategory[] = [
  'education',
  'motivation',
  'resume_deep_dive',
  'role_business',
  'behavioral',
  'hr_stability',
  'reverse_question',
];

const QUESTION_COUNTS: QuestionCount[] = [5, 10, 15, 20];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function stringArray(value: unknown, min = 1): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.filter(isNonEmptyString).map(item => item.trim());
  return items.length >= min ? items : null;
}

function normalizeDistribution(value: unknown, questions: InterviewQuestion[]) {
  const fallback = CATEGORIES.reduce((acc, category) => {
    acc[category] = questions.filter(question => question.category === category).length;
    return acc;
  }, {} as Record<QuestionCategory, number>);

  if (!value || typeof value !== 'object') return fallback;
  const raw = value as Partial<Record<QuestionCategory, number>>;
  return CATEGORIES.reduce((acc, category) => {
    const count = raw[category];
    acc[category] = typeof count === 'number' && Number.isFinite(count) && count >= 0
      ? Math.floor(count)
      : fallback[category];
    return acc;
  }, {} as Record<QuestionCategory, number>);
}

function normalizeQuestion(value: unknown, index: number): InterviewQuestion | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<InterviewQuestion>;
  if (!raw.category || !CATEGORIES.includes(raw.category)) return null;
  if (!isNonEmptyString(raw.question) || !isNonEmptyString(raw.interviewerIntent) || !isNonEmptyString(raw.sampleAnswer)) return null;
  const answerStrategy = stringArray(raw.answerStrategy);
  const followUps = stringArray(raw.followUps);
  const materialsToPrepare = stringArray(raw.materialsToPrepare);
  if (!answerStrategy || !followUps || !materialsToPrepare) return null;

  return {
    id: isNonEmptyString(raw.id) ? raw.id : `${raw.category}_${index + 1}`,
    category: raw.category,
    question: raw.question.trim(),
    interviewerIntent: raw.interviewerIntent.trim(),
    answerStrategy,
    sampleAnswer: raw.sampleAnswer.trim(),
    followUps: followUps.slice(0, 4),
    materialsToPrepare: materialsToPrepare.slice(0, 3),
  };
}

export function parseQuestionBankLLMResult(raw: string): InterviewQuestionBankData | null {
  try {
    const parsed = extractJsonObject(raw) as Partial<InterviewQuestionBankData>;
    if (!parsed?.targetRole || !Array.isArray(parsed?.questions)) return null;
    const questions = parsed.questions
      .map((question, index) => normalizeQuestion(question, index))
      .filter((question): question is InterviewQuestion => Boolean(question));
    if (!questions.length) return null;

    const questionCount = QUESTION_COUNTS.includes(parsed.questionCount as QuestionCount)
      ? parsed.questionCount as QuestionCount
      : QUESTION_COUNTS.reduce((best, count) => Math.abs(count - questions.length) < Math.abs(best - questions.length) ? count : best, 10 as QuestionCount);

    return {
      targetRole: parsed.targetRole,
      questionCount,
      categoryDistribution: normalizeDistribution(parsed.categoryDistribution, questions),
      questions: questions.slice(0, questionCount),
      generationNotes: stringArray(parsed.generationNotes, 0) || ['LLM 已根据目标岗位和简历内容生成题库。'],
      source: 'llm',
    };
  } catch {
    return null;
  }
}
