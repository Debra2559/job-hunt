import { callLLM } from '@/lib/llm/llmClient';
import { extractJsonObject } from '@/lib/llm/json';
import type { ResumeData, ResumeItem } from '@/lib/resumeTypes';
import type { ResumeGenerateResult, ResumeQuestData } from '@/lib/resumeQuest';
import type { ResumeTargetContext } from '@/lib/resumeWorkspace';

type WarningModule = ResumeGenerateResult['missingInfoWarnings'][number]['module'];

type LLMPolishItem = {
  title: string;
  bullets: string[];
};

type LLMPolishResult = {
  experience?: LLMPolishItem[];
  projects?: LLMPolishItem[];
  campus?: LLMPolishItem[];
  selfEval?: string;
  missingInfoWarnings?: Array<{
    module: WarningModule;
    issue: string;
    suggestion: string;
  }>;
  generatedHighlights?: string[];
};

const WARNING_MODULES = new Set<WarningModule>(['basic', 'education', 'experience', 'projects', 'skills', 'awards', 'selfEval']);

function buildPrompt(params: {
  resumeData: ResumeData;
  questData: ResumeQuestData;
  targetContext: ResumeTargetContext;
  missingInfoWarnings: ResumeGenerateResult['missingInfoWarnings'];
  generatedHighlights: string[];
}) {
  return JSON.stringify({
    task: 'Polish resume draft bullets and self evaluation for a beginner internship seeker.',
    language: 'zh-CN',
    targetContext: params.targetContext,
    resumeData: params.resumeData,
    questData: params.questData,
    currentMissingInfoWarnings: params.missingInfoWarnings,
    currentGeneratedHighlights: params.generatedHighlights,
    outputSchema: {
      experience: [{ title: 'string', bullets: ['string'] }],
      projects: [{ title: 'string', bullets: ['string'] }],
      campus: [{ title: 'string', bullets: ['string'] }],
      selfEval: 'string',
      missingInfoWarnings: [{ module: 'basic|education|experience|projects|skills|awards|selfEval', issue: 'string', suggestion: 'string' }],
      generatedHighlights: ['string'],
    },
    strictRules: [
      'Return strict JSON only. No markdown. No explanation.',
      'Only replace bullets for existing experience/projects/campus items. Match by exact title.',
      'Only replace selfEval, missingInfoWarnings, and generatedHighlights.',
      'Do not add or delete experiences.',
      'Do not change basic, education, skills, or certs.',
      'Do not fabricate companies, brands, awards, sample sizes, metrics, grades, user counts, rankings, or feedback.',
      'Do not turn a course project into an internship.',
      'Do not describe participation as leadership unless the user explicitly wrote leader, owner, captain, main responsible person, 主导, 负责人, 队长, or 统筹.',
      'Each experience should have 2-4 bullets: 2 for sparse information, 3 for medium information, 4 for rich information.',
      'Use compressed STAR style. Cover background/goal, task/responsibility, method/action, and result/deliverable when evidence exists.',
      'Organize wording differently for project, competition, research, campus, volunteer, and content experiences based on questData.type.',
      'Do not output field-concatenation bullets such as 参与xxx，负责xxx，使用xxx，最终完成xxx.',
      'If a fact is missing, write conservatively and add a missingInfoWarning instead of inventing.',
      'selfEval must be based on education, target role, experiences, skills, and ability evidence.',
      'Do not put city, daysPerWeek, internshipDuration, or baseLocations into selfEval.',
    ],
  });
}

function byTitle(items: ResumeItem[]) {
  return new Map(items.map(item => [item.title, item]));
}

function validBullets(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const bullets = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map(item => item.trim());
  if (bullets.length === 0) return null;
  return bullets.slice(0, 4);
}

function applyPolishedItems(baseItems: ResumeItem[], polishedItems: unknown): ResumeItem[] {
  if (!Array.isArray(polishedItems)) return baseItems;
  const current = byTitle(baseItems);
  const replacements = new Map<string, string[]>();

  polishedItems.forEach(item => {
    if (!item || typeof item !== 'object') return;
    const title = (item as LLMPolishItem).title;
    if (!title || !current.has(title)) return;
    const bullets = validBullets((item as LLMPolishItem).bullets);
    if (!bullets) return;
    replacements.set(title, bullets);
  });

  return baseItems.map(item => ({
    ...item,
    bullets: replacements.get(item.title) || item.bullets,
  }));
}

function parsePolishResult(raw: string): LLMPolishResult {
  const parsed = extractJsonObject(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Resume polish result is not an object.');
  }
  return parsed as LLMPolishResult;
}

function normalizeWarnings(value: unknown, fallback: ResumeGenerateResult['missingInfoWarnings']) {
  if (!Array.isArray(value)) return fallback;
  const warnings = value
    .filter((item): item is ResumeGenerateResult['missingInfoWarnings'][number] => {
      if (!item || typeof item !== 'object') return false;
      const warning = item as ResumeGenerateResult['missingInfoWarnings'][number];
      return WARNING_MODULES.has(warning.module) && typeof warning.issue === 'string' && typeof warning.suggestion === 'string';
    })
    .map(item => ({
      module: item.module,
      issue: item.issue.trim(),
      suggestion: item.suggestion.trim(),
    }))
    .filter(item => item.issue && item.suggestion);
  return warnings.length ? warnings : fallback;
}

function normalizeHighlights(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const highlights = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map(item => item.trim());
  return highlights.length ? highlights : fallback;
}

export async function polishResumeDraftWithAI(params: {
  resumeData: ResumeData;
  questData: ResumeQuestData;
  targetContext: ResumeTargetContext;
  missingInfoWarnings: ResumeGenerateResult['missingInfoWarnings'];
  generatedHighlights: string[];
}): Promise<ResumeGenerateResult> {
  const raw = await callLLM(buildPrompt(params));
  const parsed = parsePolishResult(raw);
  const polishedResume: ResumeData = {
    ...params.resumeData,
    experience: applyPolishedItems(params.resumeData.experience, parsed.experience),
    projects: applyPolishedItems(params.resumeData.projects, parsed.projects),
    campus: applyPolishedItems(params.resumeData.campus, parsed.campus),
    selfEval: typeof parsed.selfEval === 'string' && parsed.selfEval.trim() ? parsed.selfEval.trim() : params.resumeData.selfEval,
  };

  return {
    resumeData: polishedResume,
    generationSummary: '已基于规则草稿进行 AI 润色，优先优化经历 bullet 和自我评价；基础信息、教育背景、技能和证书保持不变。',
    generatedHighlights: normalizeHighlights(parsed.generatedHighlights, params.generatedHighlights),
    missingInfoWarnings: normalizeWarnings(parsed.missingInfoWarnings, params.missingInfoWarnings),
  };
}
