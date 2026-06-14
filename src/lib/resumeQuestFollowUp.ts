import type { QuestExperience } from '@/lib/resumeQuest';

export type StructuredExperienceType = QuestExperience['type'];

export type ExperienceFieldSchemaItem = {
  fieldKey: keyof QuestExperience & string;
  label: string;
  inputType: 'input' | 'textarea' | 'select' | 'tags';
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

export type FollowUpPromptResult = {
  introText: string;
  fieldHints: Array<{
    fieldKey: string;
    hint: string;
    example?: string;
  }>;
  source: 'rules' | 'llm' | 'fallback';
};

const COMMON_OPTIONS = {
  competitionTypes: ['创新创业', '市场调研', '数学建模', '工科设计', '专业竞赛', '其他'],
  awardLevels: ['国家级奖项', '省级奖项', '校级奖项', '院级奖项', '入围', '完成作品但未获奖', '结果待公布', '不记得', '其他'],
  researchStatuses: ['未发表', '课程论文', '毕业论文', '投稿中', '已发表', '会议展示', '专利 / 软著'],
};

export const EXPERIENCE_FIELD_SCHEMAS: Record<StructuredExperienceType, ExperienceFieldSchemaItem[]> = {
  internship: [
    { fieldKey: 'organization', label: '公司 / 组织', inputType: 'input', required: true, placeholder: '例如 XX 公司、学院办公室、校内项目组' },
    { fieldKey: 'role', label: '岗位名称', inputType: 'input', required: true, placeholder: '例如 产品实习生、助教、校园大使' },
    { fieldKey: 'time', label: '时间', inputType: 'input', placeholder: '例如 2024.03 - 2024.06' },
    { fieldKey: 'actions', label: '日常做什么', inputType: 'textarea', required: true },
    { fieldKey: 'tools', label: '使用工具 / 方法', inputType: 'tags' },
    { fieldKey: 'deliverables', label: '完成任务 / 交付物', inputType: 'tags', required: true },
    { fieldKey: 'result', label: '结果或反馈', inputType: 'textarea' },
  ],
  project: [
    { fieldKey: 'title', label: '项目名称', inputType: 'input', required: true, placeholder: '例如 咖啡品牌竞品分析' },
    { fieldKey: 'organization', label: '所属课程', inputType: 'input', placeholder: '例如 市场营销、用户研究方法' },
    { fieldKey: 'teamSize', label: '团队人数', inputType: 'input', placeholder: '例如 4 人小组 / 个人完成' },
    { fieldKey: 'role', label: '我的职责', inputType: 'input', required: true, placeholder: '例如 资料整理、数据分析、PPT 汇报' },
    { fieldKey: 'actions', label: '我做了什么', inputType: 'textarea', required: true },
    { fieldKey: 'methods', label: '工具方法', inputType: 'tags' },
    { fieldKey: 'deliverables', label: '最终交付物', inputType: 'tags', required: true },
    { fieldKey: 'result', label: '结果反馈', inputType: 'textarea' },
  ],
  competition: [
    { fieldKey: 'organization', label: '比赛名称', inputType: 'input', required: true },
    { fieldKey: 'competitionType', label: '比赛类型', inputType: 'select', options: COMMON_OPTIONS.competitionTypes },
    { fieldKey: 'title', label: '项目主题', inputType: 'input', required: true },
    { fieldKey: 'teamSize', label: '团队人数', inputType: 'input' },
    { fieldKey: 'role', label: '我的角色', inputType: 'input', required: true },
    { fieldKey: 'actions', label: '我做了什么', inputType: 'textarea', required: true },
    { fieldKey: 'methods', label: '方法工具', inputType: 'tags' },
    { fieldKey: 'deliverables', label: '最终交付物', inputType: 'tags', required: true },
    { fieldKey: 'awardLevel', label: '比赛结果', inputType: 'select', options: COMMON_OPTIONS.awardLevels },
    { fieldKey: 'proof', label: '补充证明 / 自定义结果', inputType: 'input' },
  ],
  research: [
    { fieldKey: 'title', label: '研究题目', inputType: 'input', required: true },
    { fieldKey: 'organization', label: '所属课程 / 实验室', inputType: 'input' },
    { fieldKey: 'advisor', label: '指导老师', inputType: 'input' },
    { fieldKey: 'background', label: '研究方向', inputType: 'input' },
    { fieldKey: 'role', label: '我的职责', inputType: 'input', required: true },
    { fieldKey: 'actions', label: '我做了什么', inputType: 'textarea', required: true },
    { fieldKey: 'methods', label: '方法工具', inputType: 'tags' },
    { fieldKey: 'deliverables', label: '产出', inputType: 'tags', required: true },
    { fieldKey: 'researchStatus', label: '状态', inputType: 'select', options: COMMON_OPTIONS.researchStatuses },
  ],
  campus: [
    { fieldKey: 'organization', label: '组织名称', inputType: 'input', required: true },
    { fieldKey: 'role', label: '角色', inputType: 'input', required: true },
    { fieldKey: 'title', label: '活动 / 事务名称', inputType: 'input', required: true },
    { fieldKey: 'time', label: '时间', inputType: 'input' },
    { fieldKey: 'actions', label: '我负责什么', inputType: 'textarea', required: true },
    { fieldKey: 'tools', label: '职责标签 / 工具', inputType: 'tags' },
    { fieldKey: 'deliverables', label: '交付物', inputType: 'tags', required: true },
    { fieldKey: 'result', label: '结果', inputType: 'textarea' },
  ],
  volunteer: [
    { fieldKey: 'title', label: '活动 / 实践名称', inputType: 'input', required: true },
    { fieldKey: 'organization', label: '所属组织 / 服务对象', inputType: 'input' },
    { fieldKey: 'role', label: '我的角色', inputType: 'input', required: true },
    { fieldKey: 'time', label: '时间', inputType: 'input' },
    { fieldKey: 'actions', label: '我做了什么', inputType: 'textarea', required: true },
    { fieldKey: 'tools', label: '职责标签 / 工具', inputType: 'tags' },
    { fieldKey: 'deliverables', label: '交付物', inputType: 'tags', required: true },
    { fieldKey: 'result', label: '结果或反馈', inputType: 'textarea' },
  ],
  content: [
    { fieldKey: 'platform', label: '平台 / 作品载体', inputType: 'input', required: true, placeholder: '例如 小红书、B站、公众号、GitHub、作品集' },
    { fieldKey: 'title', label: '内容主题 / 作品名称', inputType: 'input', required: true },
    { fieldKey: 'role', label: '持续时间 / 发布频率', inputType: 'input' },
    { fieldKey: 'actions', label: '我负责什么', inputType: 'textarea', required: true },
    { fieldKey: 'tools', label: '工具 / 内容动作', inputType: 'tags' },
    { fieldKey: 'deliverables', label: '发布内容 / 作品交付', inputType: 'tags', required: true },
    { fieldKey: 'result', label: '结果', inputType: 'textarea' },
    { fieldKey: 'link', label: '作品链接', inputType: 'input' },
  ],
};

const FALLBACK_PROMPTS: Record<StructuredExperienceType, FollowUpPromptResult> = {
  project: {
    introText: '你提到的内容可以先按课程项目整理。课程作业、课堂展示、课程报告都可以成为简历素材，关键是补充主题、你的职责和最终交付物。',
    source: 'fallback',
    fieldHints: [
      { fieldKey: 'title', hint: '这次作业或展示可以叫什么名字？', example: '例如“咖啡品牌竞品分析”' },
      { fieldKey: 'organization', hint: '这是哪门课或哪个课堂场景？' },
      { fieldKey: 'teamSize', hint: '是个人完成还是小组完成？几个人？' },
      { fieldKey: 'role', hint: '你负责资料、PPT、报告、数据、代码还是汇报？' },
      { fieldKey: 'actions', hint: '用大白话写你做了什么。' },
      { fieldKey: 'methods', hint: '有没有用到 Excel、PPT、问卷、竞品分析、Python 等？' },
      { fieldKey: 'deliverables', hint: '最后交了 PPT、报告、代码、问卷还是课堂展示？' },
      { fieldKey: 'result', hint: '有没有页数、展示时长、课程成绩、老师反馈？' },
    ],
  },
  competition: {
    introText: '比赛经历不只看获奖。先把比赛名称、你的分工、交付物和结果补清楚，没获奖也能写成真实经历。',
    source: 'fallback',
    fieldHints: [
      { fieldKey: 'organization', hint: '比赛名称是什么？' },
      { fieldKey: 'competitionType', hint: '是大创、挑战杯、数模、统计、CAD、电路、结构、商赛还是其他？' },
      { fieldKey: 'title', hint: '你们做的项目主题是什么？' },
      { fieldKey: 'deliverables', hint: '你们最后交了什么？' },
      { fieldKey: 'role', hint: '你负责调研、数据、PPT、路演、建模、代码还是设计？' },
      { fieldKey: 'actions', hint: '具体写你做过的动作，不用夸大成负责人。' },
      { fieldKey: 'awardLevel', hint: '有没有获奖、入围、完成作品或结果待公布？' },
    ],
  },
  research: {
    introText: '科研经历可以来自课程论文、毕业论文、老师课题或实验室。重点是研究主题、你负责的部分、方法工具和当前状态。',
    source: 'fallback',
    fieldHints: [
      { fieldKey: 'title', hint: '研究主题是什么？' },
      { fieldKey: 'organization', hint: '来自课程论文、毕业论文、老师课题还是实验室？' },
      { fieldKey: 'advisor', hint: '是否有指导老师？没有可以跳过。' },
      { fieldKey: 'role', hint: '你负责文献、数据、实验、代码、图表还是论文撰写？' },
      { fieldKey: 'methods', hint: '用到了哪些方法或工具？' },
      { fieldKey: 'deliverables', hint: '产出了论文、报告、数据集、图表还是汇报 PPT？' },
      { fieldKey: 'researchStatus', hint: '当前状态是未发表、投稿中、已发表，还是课程论文 / 毕业论文？' },
    ],
  },
  campus: {
    introText: '校园经历可以按组织、角色、活动、职责和结果来整理。你不一定要是负责人，真实参与的执行动作也有价值。',
    source: 'fallback',
    fieldHints: [
      { fieldKey: 'organization', hint: '是哪个组织？' },
      { fieldKey: 'role', hint: '你是什么角色？' },
      { fieldKey: 'title', hint: '参与了什么活动或事务？' },
      { fieldKey: 'actions', hint: '你负责宣传、策划、执行、招新、社群还是复盘？' },
      { fieldKey: 'deliverables', hint: '产出了推文、海报、活动方案、报名表还是现场物料？' },
      { fieldKey: 'result', hint: '有没有活动人数、推文、海报、现场反馈等结果？' },
    ],
  },
  internship: {
    introText: '实习或兼职经历先按组织、岗位、日常动作、工具和交付结果来补充。重点写你真实完成了什么任务。',
    source: 'fallback',
    fieldHints: [
      { fieldKey: 'organization', hint: '在哪家公司或组织？' },
      { fieldKey: 'role', hint: '岗位名称是什么？' },
      { fieldKey: 'actions', hint: '日常做什么？' },
      { fieldKey: 'tools', hint: '用了哪些工具？' },
      { fieldKey: 'deliverables', hint: '最后完成了什么任务？' },
      { fieldKey: 'result', hint: '有没有数量、反馈、效率提升或交付记录？' },
    ],
  },
  volunteer: {
    introText: '志愿或社会实践经历可以从活动名称、服务对象、职责、时长和反馈来整理。',
    source: 'fallback',
    fieldHints: [
      { fieldKey: 'title', hint: '活动名称是什么？' },
      { fieldKey: 'organization', hint: '服务对象是谁？' },
      { fieldKey: 'role', hint: '你是什么角色？' },
      { fieldKey: 'actions', hint: '你负责什么？' },
      { fieldKey: 'deliverables', hint: '有没有完成记录、物料、报告或服务内容？' },
      { fieldKey: 'result', hint: '有没有人数、时长或反馈？' },
    ],
  },
  content: {
    introText: '内容或作品经历可以按平台、主题、制作动作、发布内容和数据结果来整理。没有爆款数据也可以写持续产出。',
    source: 'fallback',
    fieldHints: [
      { fieldKey: 'platform', hint: '是哪个平台或作品？' },
      { fieldKey: 'title', hint: '内容主题是什么？' },
      { fieldKey: 'actions', hint: '你负责选题、文案、排版、剪辑、发布还是数据复盘？' },
      { fieldKey: 'deliverables', hint: '发布了哪些内容或交付了什么作品？' },
      { fieldKey: 'result', hint: '有没有发布篇数、阅读、点赞、粉丝或作品链接？' },
      { fieldKey: 'link', hint: '如果有公开链接，可以贴在这里。' },
    ],
  },
};

export function getExperienceFieldSchema(experienceType: StructuredExperienceType) {
  return EXPERIENCE_FIELD_SCHEMAS[experienceType];
}

export function inferExperienceTypesFromRawText(rawText: string): StructuredExperienceType[] {
  const text = rawText.trim();
  const candidates: StructuredExperienceType[] = [];
  const push = (type: StructuredExperienceType, pattern: RegExp) => {
    if (pattern.test(text) && !candidates.includes(type)) candidates.push(type);
  };
  push('internship', /实习|兼职|公司|岗位|助教|助研|校园大使|门店|工作/);
  push('project', /课程|课堂|作业|小组|项目|报告|PPT|展示|调研|编程|毕设/);
  push('competition', /比赛|竞赛|大创|挑战杯|互联网\+|数模|建模|商赛|CAD|电路|结构|获奖|入围/);
  push('research', /科研|论文|课题|实验|文献|投稿|发表|实验室|老师/);
  push('campus', /社团|学生会|班委|组织|招新|活动|宣传|社群|班级/);
  push('volunteer', /志愿|公益|支教|社会实践|服务|社区/);
  push('content', /小红书|公众号|视频|B站|作品|作品集|GitHub|账号|剪辑|发布/);
  return candidates.length ? candidates : ['project'];
}

function sanitizePromptResult(result: FollowUpPromptResult | null, fieldSchema: ExperienceFieldSchemaItem[]): FollowUpPromptResult | null {
  if (!result || typeof result.introText !== 'string' || !Array.isArray(result.fieldHints)) return null;
  const allowed: Set<string> = new Set(fieldSchema.map(field => field.fieldKey as string));
  const fieldHints = result.fieldHints
    .filter((item): item is { fieldKey: string; hint: string; example?: string } =>
      typeof item.fieldKey === 'string' && allowed.has(item.fieldKey) && typeof item.hint === 'string'
    )
    .map(item => ({ fieldKey: item.fieldKey as ExperienceFieldSchemaItem['fieldKey'], hint: item.hint, example: item.example }));
  if (!fieldHints.length) return null;
  return { introText: result.introText, fieldHints, source: result.source === 'llm' ? 'llm' : 'rules' };
}

export async function generateFollowUpPromptWithAI(params: {
  rawText: string;
  experienceType: StructuredExperienceType;
  fieldSchema: ExperienceFieldSchemaItem[];
}): Promise<FollowUpPromptResult | null> {
  void params;
  // 后续接 ch2-toolkit 的 resume-quest-follow-up mode。
  // Prompt 约束：
  // 1. 只根据 rawText 和 experienceType 生成字段填写提示。
  // 2. 不新增字段，fieldKey 必须来自传入 fieldSchema。
  // 3. 不生成简历 bullet，不虚构用户没有提供的事实。
  // 4. 输出严格 JSON：{ introText, fieldHints: [{ fieldKey, hint, example? }], source: "llm" }。
  return null;
}

export async function generateFollowUpPrompt(params: {
  rawText?: string;
  experienceType: StructuredExperienceType;
}): Promise<FollowUpPromptResult> {
  const fieldSchema = getExperienceFieldSchema(params.experienceType);
  if (params.rawText?.trim()) {
    const aiResult = await generateFollowUpPromptWithAI({
      rawText: params.rawText,
      experienceType: params.experienceType,
      fieldSchema,
    });
    const sanitized = sanitizePromptResult(aiResult, fieldSchema);
    if (sanitized) return sanitized;
  }
  const fallback = FALLBACK_PROMPTS[params.experienceType];
  return sanitizePromptResult(fallback, fieldSchema) || { ...fallback, source: 'fallback' };
}
