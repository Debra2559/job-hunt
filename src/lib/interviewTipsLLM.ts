import { callLLM } from '@/lib/llm/llmClient';
import { extractJsonObject } from '@/lib/llm/json';
import type { InterviewTipsData } from '@/lib/interviewTips';
import type { ResumeWorkspaceState } from '@/lib/resumeWorkspace';

export type InterviewTipsLLMInput = {
  workspace: ResumeWorkspaceState;
  ruleBasedTips: InterviewTipsData;
};

function compactWorkspace(workspace: ResumeWorkspaceState) {
  const { sourceEvidence, ...rest } = workspace;
  return {
    ...rest,
    sourceEvidence: sourceEvidence
      ? {
          questData: sourceEvidence.questData
            ? {
                target: sourceEvidence.questData.target,
                experiences: sourceEvidence.questData.experiences,
                skills: sourceEvidence.questData.skills,
                abilities: sourceEvidence.questData.abilities,
              }
            : undefined,
          rawResumeText: sourceEvidence.rawResumeText?.slice(0, 1200),
          parseWarnings: sourceEvidence.parseWarnings,
        }
      : undefined,
  };
}

function buildInterviewTipsPrompt(input: InterviewTipsLLMInput) {
  return JSON.stringify({
    task: 'Generate interview preparation intelligence for a beginner job seeker.',
    language: 'zh-CN',
    workspace: compactWorkspace(input.workspace),
    ruleBasedTips: input.ruleBasedTips,
    outputSchema: {
      targetRole: 'string',
      roleCategory: input.ruleBasedTips.roleCategory,
      commonFlow: [{ title: 'string', description: 'string' }],
      roundFocus: [{
        title: 'string',
        focus: ['string'],
        questions: ['string'],
        advice: 'string',
      }],
      personalizedRisks: [{
        id: 'string',
        type: 'no_internship|weak_project|unsupported_skill|unclear_result|role_mismatch',
        title: 'string',
        description: 'string',
        likelyQuestions: ['string'],
        preparationAdvice: 'string',
      }],
      roleBasedGuide: {
        roleName: 'string',
        roleCategory: input.ruleBasedTips.roleCategory,
        interviewFocus: ['string'],
        mustPrepare: ['string'],
        likelyQuestions: ['string'],
        resumeRiskQuestions: ['string'],
        beginnerTips: ['string'],
        suggestedExamplesToPrepare: ['string'],
      },
      checklist: [{ title: 'string', items: ['string'] }],
      videoGuide: [{ title: 'string', items: ['string'], avoid: ['string'] }],
      profileSummary: {
        strengths: ['string'],
        risks: ['string'],
      },
    },
    positioning: [
      'This is /career/tips 面试情报站.',
      'Do not write self-introduction scripts.',
      'Do not generate a full question bank.',
      'Tell the user what interview rounds usually test, what resume points are likely to be challenged, what risks exist, and what to prepare.',
    ],
    strictRules: [
      'Return strict JSON only. No markdown. No explanation.',
      'Output must be compatible with the provided InterviewTipsData schema.',
      'Base all content on workspace.resumeData, targetContext, abilitySummary, aiSuggestions, and sourceEvidence summaries.',
      'Do not fabricate company-specific real interview processes. Use wording like 通常可能 when describing rounds.',
      'Do not fabricate companies, roles, awards, data, project results, sample sizes, grades, publication status, or feedback.',
      'Do not turn course projects into internships.',
      'Do not describe participation as leadership unless the user explicitly wrote 负责人, 主导, 队长, 统筹, or equivalent.',
      'If information is insufficient, add concrete preparationAdvice or profileSummary.risks instead of inventing.',
      'personalizedRisks must include 2-4 resume-grounded deep-dive risks when possible.',
      'Each personalized risk should explain why the interviewer asks, likely questions, answer strategy, and risk mitigation.',
      'Checklist items must be concrete actions, not vague encouragement.',
      'Video guide should focus on camera, background, clothing, and speaking state.',
    ],
  });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

function isTipsData(value: unknown): value is InterviewTipsData {
  if (!value || typeof value !== 'object') return false;
  const data = value as InterviewTipsData;
  return Boolean(
    data.targetRole &&
    data.roleCategory &&
    Array.isArray(data.commonFlow) &&
    Array.isArray(data.roundFocus) &&
    Array.isArray(data.personalizedRisks) &&
    data.roleBasedGuide &&
    Array.isArray(data.roleBasedGuide.interviewFocus) &&
    Array.isArray(data.checklist) &&
    Array.isArray(data.videoGuide) &&
    data.profileSummary &&
    isStringArray(data.profileSummary.strengths) &&
    isStringArray(data.profileSummary.risks),
  );
}

export async function generateInterviewTipsWithLLM(
  input: InterviewTipsLLMInput,
): Promise<InterviewTipsData | null> {
  const raw = await callLLM(buildInterviewTipsPrompt(input));
  const parsed = extractJsonObject(raw);
  if (!isTipsData(parsed)) {
    throw new Error('LLM interview tips result is not compatible with InterviewTipsData.');
  }
  return {
    ...input.ruleBasedTips,
    ...parsed,
    roleCategory: input.ruleBasedTips.roleCategory,
    roleBasedGuide: {
      ...input.ruleBasedTips.roleBasedGuide,
      ...parsed.roleBasedGuide,
      roleCategory: input.ruleBasedTips.roleCategory,
    },
  };
}
