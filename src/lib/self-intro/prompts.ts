import type { GenerateSelfIntroInput } from './types';

export function buildSelfIntroPrompt(input: GenerateSelfIntroInput): string {
  return JSON.stringify({
    task: 'Generate directly speakable interview self-introduction scripts.',
    language: 'zh-CN',
    modulePositioning: [
      'This is /career/self-intro 开场白训练室.',
      'Generate scripts the user can directly say, edit, and rehearse.',
      'Do not output interview preparation tips only.',
      'Do not output a question bank.',
    ],
    targetRole: input.workspaceState.targetContext.targetRole,
    targetContext: input.workspaceState.targetContext,
    resumeData: input.workspaceState.resumeData,
    abilitySummary: input.workspaceState.abilitySummary,
    aiSuggestions: input.workspaceState.aiSuggestions,
    sourceEvidence: {
      questData: input.workspaceState.sourceEvidence?.questData
        ? {
            target: input.workspaceState.sourceEvidence.questData.target,
            experiences: input.workspaceState.sourceEvidence.questData.experiences,
            abilities: input.workspaceState.sourceEvidence.questData.abilities,
          }
        : undefined,
      parseWarnings: input.workspaceState.sourceEvidence?.parseWarnings,
    },
    interviewTipsData: input.interviewTipsData,
    jdAnalysisState: input.jdAnalysisState,
    outputSchema: {
      targetRole: 'string',
      scripts: {
        short: '30 秒版本，100-150 中文字',
        medium: '1 分钟版本，220-300 中文字',
        long: '2 分钟版本，400-550 中文字',
      },
      projectScript: {
        experienceTitle: 'string',
        script: 'string',
        followUps: ['string'],
      },
      generationNotes: ['string'],
    },
    constraints: [
      'Return strict JSON only. No markdown. No explanation.',
      'Do not fabricate experience, company, award, metric, sample size, or feedback.',
      'Do not fabricate internships or turn course projects into business internships.',
      'Do not claim leadership unless resumeData or sourceEvidence explicitly says 负责人, 主导, 队长, 统筹, owner, leader, or captain.',
      'Do not write 性格开朗、认真负责、抗压能力强 unless supported by concrete evidence.',
      'If target company is unknown, do not say 贵公司业务 or 我非常了解贵公司.',
      'If the user has no internship, honestly say there is no formal internship and connect course projects/campus/competition/content work to transferable ability.',
      'Each script should answer: 我是谁, 为什么适合这个岗位, 希望面试官继续问我什么.',
      'Use at most two core experiences in the long script; do not read the resume as a list.',
      'projectScript must use compressed STAR: background, task, action, result/deliverable, reflection.',
      'If result data is missing, mention deliverables and suggest what should be supplemented; do not invent numbers.',
      'End the medium/long scripts by naturally pointing to a concrete experience the interviewer can deep dive.',
      'Keep it natural, spoken, beginner-friendly, and interview-ready.',
      'Ground every script in resumeData and targetRole.',
    ],
  });
}
