import type { GenerateQuestionBankInput, QuestionCategory, QuestionCount } from './types';

const CATEGORY_DISTRIBUTIONS: Record<QuestionCount, Record<QuestionCategory, number>> = {
  5: {
    education: 0,
    motivation: 1,
    resume_deep_dive: 2,
    role_business: 1,
    behavioral: 1,
    hr_stability: 0,
    reverse_question: 0,
  },
  10: {
    education: 1,
    motivation: 2,
    resume_deep_dive: 3,
    role_business: 2,
    behavioral: 1,
    hr_stability: 0,
    reverse_question: 1,
  },
  15: {
    education: 2,
    motivation: 2,
    resume_deep_dive: 4,
    role_business: 3,
    behavioral: 2,
    hr_stability: 1,
    reverse_question: 1,
  },
  20: {
    education: 2,
    motivation: 3,
    resume_deep_dive: 5,
    role_business: 4,
    behavioral: 3,
    hr_stability: 2,
    reverse_question: 1,
  },
};

function compactWorkspace(input: GenerateQuestionBankInput) {
  const { workspaceState } = input;
  const sourceEvidence = workspaceState.sourceEvidence;
  return {
    source: workspaceState.source,
    targetContext: workspaceState.targetContext,
    resumeData: workspaceState.resumeData,
    abilitySummary: workspaceState.abilitySummary,
    aiSuggestions: workspaceState.aiSuggestions,
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

export function buildQuestionBankPrompt(input: GenerateQuestionBankInput): string {
  const distribution = CATEGORY_DISTRIBUTIONS[input.questionCount];
  return JSON.stringify({
    task: 'Generate a structured interview QA question bank for a beginner job seeker.',
    language: 'zh-CN',
    modulePositioning: [
      'This is /career/interview-question-bank 面试 QA 题库站.',
      'Do not output interview tips only.',
      'Do not output self-introduction scripts.',
      'Output concrete questions, interviewer intent, answer strategy, sample answer, follow-ups, and materials to prepare.',
    ],
    targetRole: input.workspaceState.targetContext.targetRole,
    questionCount: input.questionCount,
    expectedCategoryDistribution: distribution,
    workspace: compactWorkspace(input),
    interviewTipsData: input.interviewTipsData,
    jdAnalysisState: input.jdAnalysisState,
    outputSchema: {
      targetRole: 'string',
      questionCount: input.questionCount,
      categoryDistribution: {
        education: 'number',
        motivation: 'number',
        resume_deep_dive: 'number',
        role_business: 'number',
        behavioral: 'number',
        hr_stability: 'number',
        reverse_question: 'number',
      },
      questions: [{
        id: 'string',
        category: 'education|motivation|resume_deep_dive|role_business|behavioral|hr_stability|reverse_question',
        question: 'string',
        interviewerIntent: 'string',
        answerStrategy: ['string'],
        sampleAnswer: 'string',
        followUps: ['string'],
        materialsToPrepare: ['string'],
      }],
      generationNotes: ['string'],
    },
    categoryRules: {
      education: [
        'Ask about major choice, useful courses, GPA/ranking/scholarship if present, and how education connects to target role.',
        'Strategy should connect courses/projects/skills to the target role. If major is not directly related, explain transferable ability.',
      ],
      motivation: [
        'Ask why this role, how the user understands the role, and how existing experience connects to the role.',
        'Do not say 贵公司业务 if target company is unknown.',
      ],
      resume_deep_dive: [
        'This is the core category. Bind each question to a real resume item from experience/projects/campus.',
        'Select 2-5 likely deep-dive experiences when available.',
        'Answer strategy must follow STAR: background/scene, task, action/method/tool, result/deliverable/reflection.',
        'If no data/result exists, guide the user to discuss deliverables and reflection. Do not invent metrics.',
      ],
      role_business: [
        'Generate role-specific business or role-understanding questions based on targetRole.',
        'For product: user needs, competitor analysis, feature priority, product metrics.',
        'For operation: user segmentation, content strategy, campaign design, data review.',
        'For data: metric definition, SQL/Python/Excel usage, data cleaning, business explanation.',
        'For general roles: problem decomposition, business learning, teamwork.',
        'Do not fabricate company-specific business data.',
      ],
      behavioral: [
        'Ask about difficulty, team disagreement, proactive ownership, and failure review.',
        'Remind the user to choose real experiences and answer with STAR.',
      ],
      hr_stability: [
        'Ask about available start date, days per week, duration, location, career plan, and role fit.',
        'Use resumeData.basic.availability if present. If missing, tell the user to confirm before interview.',
      ],
      reverse_question: [
        'Generate questions the user can ask the interviewer.',
        'Questions must be concrete and role-related.',
      ],
    },
    constraints: [
      'Return strict JSON only. No markdown. No explanation.',
      'Output must be compatible with the existing InterviewQuestionBankData schema.',
      'questions.length must match questionCount unless the resume is extremely sparse.',
      'categoryDistribution should match expectedCategoryDistribution as closely as possible.',
      'Every question must include category, question, interviewerIntent, answerStrategy, sampleAnswer, followUps, and materialsToPrepare.',
      'followUps must contain 2-4 realistic follow-up questions.',
      'materialsToPrepare must contain 1-3 concrete materials.',
      'sampleAnswer should be natural spoken Chinese, concise, grounded in real resume content, and useful for a beginner.',
      'Do not fabricate internships, companies, roles, awards, data, sample sizes, project impact, target company interview process, publication status, or feedback.',
      'Do not turn course assignments into business projects.',
      'Do not describe participation as leadership unless the user explicitly wrote 负责人, 主导, 队长, 统筹, owner, leader, or captain.',
      'Do not write tools as 熟练掌握 unless there is usage evidence in resumeData or sourceEvidence.',
      'If the user has no formal internship, it is acceptable to say so and connect course/campus/competition/content work to transferable ability.',
      'If information is insufficient, mention what to prepare in answerStrategy or materialsToPrepare instead of inventing.',
    ],
  });
}
