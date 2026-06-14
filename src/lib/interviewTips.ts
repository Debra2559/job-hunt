import type { ResumeData, ResumeItem } from '@/lib/resumeTypes';
import type { AISuggestion, ResumeWorkspaceState } from '@/lib/resumeWorkspace';

export type RoleCategory =
  | 'product'
  | 'data'
  | 'operation'
  | 'tech'
  | 'design'
  | 'marketing_business'
  | 'sales_bd'
  | 'hr_admin'
  | 'finance_audit'
  | 'consulting_mt'
  | 'research_ra'
  | 'general';

export type InterviewFlowStep = {
  title: string;
  description: string;
};

export type InterviewRoundFocus = {
  title: string;
  focus: string[];
  questions: string[];
  advice: string;
};

export type PersonalizedInterviewRisk = {
  id: string;
  type: 'no_internship' | 'weak_project' | 'unsupported_skill' | 'unclear_result' | 'role_mismatch';
  title: string;
  description: string;
  likelyQuestions: string[];
  preparationAdvice: string;
};

export type RoleBasedInterviewGuide = {
  roleName: string;
  roleCategory: RoleCategory;
  interviewFocus: string[];
  mustPrepare: string[];
  likelyQuestions: string[];
  resumeRiskQuestions: string[];
  beginnerTips: string[];
  suggestedExamplesToPrepare: string[];
};

export type InterviewChecklistGroup = {
  title: string;
  items: string[];
};

export type VideoInterviewGuide = {
  title: string;
  items: string[];
  avoid?: string[];
};

export type InterviewTipsData = {
  targetRole: string;
  roleCategory: RoleCategory;
  commonFlow: InterviewFlowStep[];
  roundFocus: InterviewRoundFocus[];
  personalizedRisks: PersonalizedInterviewRisk[];
  roleBasedGuide: RoleBasedInterviewGuide;
  checklist: InterviewChecklistGroup[];
  videoGuide: VideoInterviewGuide[];
  profileSummary: {
    strengths: string[];
    risks: string[];
  };
};

const commonFlow: InterviewFlowStep[] = [
  { title: '简历筛选', description: '确认简历和岗位是否匹配，重点看经历、技能和到岗条件。' },
  { title: 'HR 初筛 / 电话沟通', description: '确认到岗时间、实习周期、求职意向和基础沟通。' },
  { title: '业务一面', description: '围绕简历经历、岗位理解和基础能力展开追问。' },
  { title: 'Leader 面 / 业务二面', description: '看思考深度、复盘能力、学习能力和团队适配。' },
  { title: 'HRBP 面 / HR 终面', description: '确认稳定性、动机、价值观、薪资和入职安排。' },
  { title: 'Offer 沟通', description: '沟通薪资、入职时间、实习周期、材料和后续流程。' },
  { title: '入职材料准备', description: '准备身份证明、银行卡、学生证明、三方或实习协议等材料。' },
];

const roundFocus: InterviewRoundFocus[] = [
  {
    title: 'HR 初筛 / 电话沟通',
    focus: ['到岗时间', '实习周期', '是否能线下', '求职意向', '沟通表达', '简历真实性'],
    questions: ['你什么时候可以入职？', '一周可以实习几天？', '为什么想投这个岗位？', '简单介绍一下你自己。'],
    advice: '回答要直接。HR 初筛通常主要确认基础条件和稳定性，表达清楚比讲复杂项目更重要。',
  },
  {
    title: '业务一面',
    focus: ['经历真实性', '岗位基础理解', '岗位相关能力', '结构化表达', '追问承接'],
    questions: ['介绍一下最相关的一段经历。', '你在项目里具体负责什么？', '最后结果如何？', '如果重新做一次，你会怎么优化？'],
    advice: '重点准备简历里的项目、课程作业、竞赛、社团经历。每段经历都要能讲清背景、任务、行动、结果和反思。',
  },
  {
    title: 'Leader 面 / 业务二面',
    focus: ['思考深度', '岗位理解', '学习能力', '复盘能力', '潜力', '团队适配'],
    questions: ['你为什么认为这个岗位适合你？', '你怎么理解这个业务？', '项目里最大的问题是什么？', '给你一个真实业务问题，你会怎么拆解？'],
    advice: 'Leader 面会看思考过程。不要只背项目结果，要能说出为什么、怎么判断、哪里可以优化。',
  },
  {
    title: 'HRBP 面 / HR 终面',
    focus: ['求职动机', '稳定性', '价值观', '沟通风格', '薪资与到岗', '是否接受团队安排'],
    questions: ['你为什么选择我们公司？', '未来职业规划是什么？', '能接受快节奏吗？', '你手里还有其他 offer 吗？'],
    advice: 'HRBP 面要诚实、稳定、表达清楚。不要表现出“随便找一个实习”的感觉。',
  },
];

const genericGuide: Omit<RoleBasedInterviewGuide, 'roleName' | 'roleCategory'> = {
  interviewFocus: ['岗位理解', '经历真实性', '学习能力', '沟通表达', '动机稳定性', '复盘能力'],
  mustPrepare: ['1 分钟自我介绍', '1-2 段最相关经历', '为什么投这个岗位', '对公司和岗位的基本了解', '反问面试官的问题'],
  likelyQuestions: ['你为什么投这个岗位？', '你最相关的一段经历是什么？', '遇到过什么困难？', '你的优势和不足是什么？', '你有什么想问我的？'],
  resumeRiskQuestions: [],
  beginnerTips: ['第一次面试不需要表现得完美，但要讲清楚事实和思考', '不会的问题可以说思路，不要乱编', '简历上写的每一项都要能讲出来'],
  suggestedExamplesToPrepare: ['课程项目', '竞赛经历', '社团活动', '科研或调研项目'],
};

const roleTemplates: Record<RoleCategory, Omit<RoleBasedInterviewGuide, 'roleName' | 'roleCategory'>> = {
  product: {
    interviewFocus: ['用户理解', '需求分析', '竞品分析', '逻辑表达', '数据意识', '沟通协作'],
    mustPrepare: ['一个常用 App 的问题和优化方案', '一段体现用户理解或需求分析的经历', '一个课程/调研/竞品分析项目', '对目标岗位业务的基本理解'],
    likelyQuestions: ['你为什么想做产品经理？', '你理解的产品经理每天在做什么？', '讲一段你最像产品工作的经历。', '如果让你优化一个常用 App，你会怎么做？', '如何判断一个功能是否值得做？'],
    resumeRiskQuestions: [],
    beginnerTips: ['不要只说“喜欢互联网产品”，要讲清楚用户问题和业务场景', '没有产品实习也可以用课程项目、竞品分析、调研报告证明基础能力', '回答尽量围绕用户、场景、问题、方案、结果展开'],
    suggestedExamplesToPrepare: ['课程项目中的用户需求分析', '竞品分析报告', '社团活动中的用户反馈或流程优化', '常用 App 的问题拆解'],
  },
  data: {
    interviewFocus: ['数据清洗', '统计分析', 'SQL / Python', '指标理解', '可视化表达', '业务解释'],
    mustPrepare: ['一个完整的数据分析项目', 'Python / SQL / Excel 的使用场景', '数据清洗过程', '指标含义和结论解释', '一张图表如何支持结论'],
    likelyQuestions: ['你做过哪些数据分析项目？', '如何处理缺失值和异常值？', 'SQL 会到什么程度？', '如何把分析结果讲给业务方？', '如何判断一个指标是否异常？'],
    resumeRiskQuestions: [],
    beginnerTips: ['不要只说会工具，要讲清楚在哪个项目里用过', '面试官更关心你能不能解释数据背后的业务含义', '准备“数据来源—处理过程—分析结果—业务解释”的项目讲述'],
    suggestedExamplesToPrepare: ['数学建模 / 统计建模项目', '问卷分析项目', 'Python 数据清洗作业', '可视化 dashboard 或课程报告'],
  },
  operation: {
    interviewFocus: ['内容策划', '活动执行', '用户触达', '社群维护', '数据复盘', '文案能力'],
    mustPrepare: ['一段内容、活动、社群或用户运营经历', '活动策划和执行细节', '数据复盘意识', '文案或内容作品', '对目标平台用户的理解'],
    likelyQuestions: ['你做过哪些运营相关经历？', '如何策划一次活动？', '如何判断一篇内容效果好不好？', '如何提升社群活跃度？', '如何复盘一次活动？'],
    resumeRiskQuestions: [],
    beginnerTips: ['运营岗位会看执行力和细节意识', '社团、公众号、小红书、校园活动都可以证明能力', '回答时要讲清目标、动作、结果和复盘'],
    suggestedExamplesToPrepare: ['社团活动策划', '公众号 / 小红书运营', '校园大使活动', '社群维护或用户沟通经历'],
  },
  tech: {
    interviewFocus: ['编程基础', '项目实现', '问题排查', '代码能力', '技术学习能力', '工程协作意识'],
    mustPrepare: ['一个能讲清楚的代码项目', '项目技术栈', '自己负责的模块', '遇到的技术问题和解决方式', '基础算法或语言知识'],
    likelyQuestions: ['最完整的技术项目是什么？', '项目里负责哪一部分？', '遇到 bug 怎么排查？', '对这个技术栈的理解是什么？', '重新做一次会怎么优化？'],
    resumeRiskQuestions: [],
    beginnerTips: ['不要只列技术名词，要说清楚项目里怎么用', '不懂的问题可以讲排查思路', '课程项目、比赛项目、个人 demo 都可以作为技术项目'],
    suggestedExamplesToPrepare: ['课程编程作业', 'GitHub 项目', '算法 / 开发竞赛', '实验室代码任务'],
  },
  design: {
    interviewFocus: ['作品集', '设计思路', '用户体验', '审美表达', '工具能力', '沟通协作'],
    mustPrepare: ['1-2 个作品案例', '设计目标和用户问题', '设计过程', '修改前后对比', 'Figma / PS / AI 等工具使用场景'],
    likelyQuestions: ['介绍一个最满意的作品。', '这个设计解决了什么问题？', '为什么这样设计？', '用户反馈不好会怎么调整？', '如何和产品或开发沟通？'],
    resumeRiskQuestions: [],
    beginnerTips: ['不要只展示最终图，要讲清楚设计过程', '作品少也可以准备课程作业、个人作品、临摹改版', '面试官会看思考过程和可修改能力'],
    suggestedExamplesToPrepare: ['课程设计作品', 'App 页面改版', '海报 / 视觉作品', 'Figma 原型'],
  },
  marketing_business: {
    interviewFocus: ['行业理解', '市场分析', '用户洞察', '竞品分析', '商业逻辑', '报告表达'],
    mustPrepare: ['一个市场调研或行业分析项目', '用户画像或竞品分析', '市场规模或商业模式分析', '结构化报告', '对目标行业的基本了解'],
    likelyQuestions: ['你怎么看这个行业？', '做过哪些市场分析？', '如何做竞品分析？', '如何判断一个市场机会？', '如何从用户反馈中提炼结论？'],
    resumeRiskQuestions: [],
    beginnerTips: ['不要只罗列资料，要给出自己的判断', '商赛、调研报告、课程论文可以证明分析能力', '回答时体现结构化分析'],
    suggestedExamplesToPrepare: ['市场调研比赛', '商业计划书', '行业研究课程报告', '竞品分析作业'],
  },
  sales_bd: genericGuide,
  hr_admin: genericGuide,
  finance_audit: genericGuide,
  consulting_mt: genericGuide,
  research_ra: genericGuide,
  general: genericGuide,
};

export function inferRoleCategory(role: string): RoleCategory {
  if (/产品|PM|Product|用户增长|策略产品|商业化产品/i.test(role)) return 'product';
  if (/数据分析|商业分析|BI|Data Analyst|数据科学|建模|统计/i.test(role)) return 'data';
  if (/运营|用户运营|内容运营|活动运营|社群运营|新媒体/i.test(role)) return 'operation';
  if (/前端|后端|开发|软件|算法|测试|工程师|Java|Python|C\+\+|AI 工程/i.test(role)) return 'tech';
  if (/UI|UX|交互|视觉|设计|平面|品牌设计/i.test(role)) return 'design';
  if (/市场|品牌|营销|商业分析|行业研究|增长|Market/i.test(role)) return 'marketing_business';
  if (/销售|商务|BD|客户成功|渠道/i.test(role)) return 'sales_bd';
  if (/HR|人力|招聘|行政|组织发展|员工关系/i.test(role)) return 'hr_admin';
  if (/财务|会计|审计|投研|风控|金融|证券|基金|银行/i.test(role)) return 'finance_audit';
  if (/咨询|管培生|战略|Management Trainee/i.test(role)) return 'consulting_mt';
  if (/科研|研究助理|RA|Research Assistant|实验室|课题/i.test(role)) return 'research_ra';
  return 'general';
}

function itemText(items: ResumeItem[]) {
  return items.map(i => [i.title, i.role, i.period, ...i.bullets].join(' ')).join(' ');
}

function hasEvidenceForSkills(resumeData: ResumeData) {
  const skillText = resumeData.skills.join(' ');
  const experienceText = itemText([...resumeData.projects, ...resumeData.experience, ...resumeData.campus]);
  return /(Python|SQL|Figma|Axure|CAD|SPSS|Tableau|Power BI)/i.test(skillText)
    && !/(Python|SQL|Figma|Axure|CAD|SPSS|Tableau|Power BI)/i.test(experienceText);
}

function hasUnclearProjectResult(resumeData: ResumeData) {
  if (resumeData.projects.length === 0) return false;
  const projectText = itemText(resumeData.projects);
  const hasResultSignal = /(\d+|%|人|份|页|次|天|周|月|完成|产出|交付|上线|发布|获奖|反馈|报告|PPT|原型|作品|数据|提升|增长|优化)/i.test(projectText);
  return !hasResultSignal;
}

function buildPersonalizedRisks(
  resumeData: ResumeData,
  aiSuggestions: AISuggestion[] = [],
): PersonalizedInterviewRisk[] {
  const risks: PersonalizedInterviewRisk[] = [];
  const noInternship = resumeData.experience.length === 0;
  const weakProject = resumeData.projects.length === 0 || resumeData.projects.length < 2;
  const hasCampus = resumeData.campus.length > 0;

  if (noInternship) {
    risks.push({
      id: 'no_internship',
      type: 'no_internship',
      title: '没有正式实习经历',
      description: '面试官未必会因此否定你，但会更关注你是否能从课程项目、竞赛、社团或科研经历中证明岗位相关能力。',
      likelyQuestions: ['你没有实习经历，为什么觉得自己适合这个岗位？', '你做过最接近这个岗位工作的事情是什么？', '如何快速适应真实业务？', '入职后发现很多东西不会，你会怎么学习？'],
      preparationAdvice: '准备一段“迁移能力说明”，把课程项目、竞赛、科研、社团经历和目标岗位能力联系起来。',
    });
  }

  if (hasCampus && weakProject) {
    risks.push({
      id: 'weak_project',
      type: 'weak_project',
      title: '校园经历较多，但项目经历偏少',
      description: '校园经历可以证明组织协调、执行推进和沟通能力，但业务面可能追问你的专业能力。',
      likelyQuestions: ['这段社团经历和目标岗位有什么关系？', '你负责的工作有没有结果？', '如何证明你具备岗位需要的专业能力？', '除了校园活动，还有没有课程项目或调研经历？'],
      preparationAdvice: '把校园经历转成组织协调、执行推进、沟通协作能力，同时准备一段更贴近岗位的课程项目或调研经历。',
    });
  }

  if (hasEvidenceForSkills(resumeData)) {
    risks.push({
      id: 'unsupported_skill',
      type: 'unsupported_skill',
      title: '技能有，但缺少使用场景',
      description: '你填写了强工具技能，但经历里缺少具体使用场景。面试官可能追问你在哪个项目里用过、熟练到什么程度。',
      likelyQuestions: ['你说你会 Python，具体用它做过什么？', 'SQL 会到什么程度？', 'Figma / Axure 做过什么原型？', '这个技能是课程学过，还是项目里用过？'],
      preparationAdvice: '为每个核心技能准备一个真实使用场景，课程项目、竞赛、科研、社团活动都可以。',
    });
  }

  if (hasUnclearProjectResult(resumeData) || aiSuggestions.some(s => s.type === '信息完整度' || s.type === '量化建议')) {
    risks.push({
      id: 'unclear_result',
      type: 'unclear_result',
      title: '项目结果或交付物不够清楚',
      description: '项目结果不清楚时，面试官容易追问“最后产出了什么”。',
      likelyQuestions: ['这个项目最后结果是什么？', '你们交付了什么？', '有没有数据、反馈或老师评价？', '怎么判断这个项目做得好不好？'],
      preparationAdvice: '补充报告页数、PPT 页数、团队人数、问卷数量、活动人数、作品数量、展示结果、课程反馈等真实信息。',
    });
  }

  if (aiSuggestions.some(s => s.type === '岗位匹配')) {
    risks.push({
      id: 'role_mismatch',
      type: 'role_mismatch',
      title: '岗位匹配关系不够明显',
      description: '你的简历内容和目标岗位之间的联系还不够明显，面试中可能会被追问“为什么投这个岗位”。',
      likelyQuestions: ['为什么选择这个岗位？', '过往经历和这个岗位有什么关系？', '对这个岗位的日常工作了解多少？', '还有哪些能力需要补？'],
      preparationAdvice: '准备一段“岗位动机 + 经历迁移”说明，把目标岗位能力和已有经历连接起来。',
    });
  }

  return risks;
}

export function buildInterviewTipsData(workspace: ResumeWorkspaceState): InterviewTipsData {
  const { targetContext, resumeData } = workspace;
  const aiSuggestions = workspace.aiSuggestions ?? [];
  const roleCategory = inferRoleCategory(targetContext.targetRole);
  const template = roleTemplates[roleCategory] || genericGuide;
  const personalizedRisks = buildPersonalizedRisks(resumeData, aiSuggestions);
  const roleBasedGuide: RoleBasedInterviewGuide = {
    roleName: targetContext.targetRole,
    roleCategory,
    ...template,
    resumeRiskQuestions: personalizedRisks.flatMap(r => r.likelyQuestions).slice(0, 6),
  };

  const strengths: string[] = [];
  const risks: string[] = [];
  if (resumeData.projects.length > 0) strengths.push('有项目经历，可以作为业务面重点讲述素材');
  if (resumeData.experience.length > 0) strengths.push('有实习/工作经历，可以证明真实业务接触');
  if (resumeData.campus.length > 0) strengths.push('有校园经历，可迁移为组织协调、执行推进和沟通能力');
  if (resumeData.skills.length > 0) strengths.push(`已填写技能：${resumeData.skills.slice(0, 5).join('、')}`);
  if (resumeData.experience.length === 0) risks.push('暂时没有正式实习经历，需要准备迁移能力说明');
  if (resumeData.projects.length === 0) risks.push('项目经历较少，需要补充课程、竞赛、调研或个人作品素材');
  if (aiSuggestions.length > 0) risks.push('简历工作台已有 AI 建议，建议优先处理高优先级问题');

  return {
    targetRole: targetContext.targetRole,
    roleCategory,
    commonFlow,
    roundFocus,
    personalizedRisks,
    roleBasedGuide,
    profileSummary: {
      strengths: strengths.length ? strengths : ['当前简历素材较少，建议先准备 1-2 段最能证明岗位能力的经历'],
      risks: risks.length ? risks : ['暂无明显高风险项，重点把简历上每一项讲清楚'],
    },
    checklist: [
      {
        title: '面试前一天',
        items: ['确认面试时间和会议链接', '看一遍岗位 JD', '看一遍自己的简历', '准备 1 分钟自我介绍', '准备 1 段最重要项目经历', '准备 3 个岗位相关问题', '准备反问面试官的问题', '测试摄像头、麦克风和网络', '准备纸笔或文档记录'],
      },
      {
        title: '面试当天',
        items: ['提前 10 分钟进入会议', '电脑充电', '关闭无关通知', '保持背景干净', '简历和 JD 放在旁边', '回答问题先说结论，再补充例子', '听不清问题时礼貌确认'],
      },
      {
        title: '面试结束后',
        items: ['记录被问到的问题', '记录答得不好的地方', '记录面试官提到的业务信息', '更新逐字稿和 QA', '为下一轮面试补齐缺口'],
      },
    ],
    videoGuide: [
      { title: '摄像头', items: ['摄像头与眼睛基本平齐', '不要仰拍', '不要过度靠近屏幕', '保证面部清晰', '光线从正前方或侧前方来'] },
      { title: '背景', items: ['背景干净', '不要有杂物', '不要用夸张虚拟背景', '宿舍环境可以，但要尽量整洁'] },
      { title: '穿着', items: ['实习面试不需要过度正式，但要干净利落', '可以穿衬衫、针织衫、简洁上衣', '西装外套可选'], avoid: ['睡衣', '过于花哨的衣服', '过于随意的上衣'] },
      { title: '表达状态', items: ['语速不要太快', '回答前可以停 1-2 秒组织语言', '不要一直低头念稿', '不懂的问题可以说明思考过程', '被追问时先回到事实和逻辑'] },
    ],
  };
}
