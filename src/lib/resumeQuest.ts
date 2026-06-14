import { emptyResume, type ResumeData, type ResumeItem } from '@/lib/resumeTypes';
import type { ResumeRoleContext } from '@/lib/resumeRoleContext';
import { generateResumeSuggestions } from '@/lib/resumeSuggestions';
import type { ResumeWorkspaceState, AbilityItem, AISuggestion, SkillGroup } from '@/lib/resumeWorkspace';

export const RESUME_QUEST_DRAFT_KEY = 'resumeQuestDraft';

export type ExperienceType =
  | 'internship'
  | 'project'
  | 'competition'
  | 'research'
  | 'campus'
  | 'volunteer'
  | 'content'
  | 'none';

export type QuestExperience = {
  id: string;
  type: Exclude<ExperienceType, 'none'>;
  title: string;
  organization?: string;
  role?: string;
  time?: string;
  teamSize?: string;
  background?: string;
  actions?: string;
  methods?: string[];
  tools?: string[];
  deliverables?: string[];
  result?: string;
  proof?: string;
  competitionType?: string;
  rawText?: string;
  awardLevel?: string;
  researchStatus?: string;
  advisor?: string;
  platform?: string;
  link?: string;
  publicationStatus?: string;
};

export type QuestAbility = {
  name: string;
  score: number;
  evidence: string[];
  resumeExpression: string;
  improvementTip: string;
};

export type SkillDisplayAdvice = {
  skill: string;
  level: 'recommended' | 'optional' | 'not_suggested';
  reason: string;
};

export type ResumeQuestData = {
  basicInfo: {
    name: string;
    email: string;
    phone: string;
    city?: string;
    daysPerWeek?: string;
    internshipDuration?: string;
    baseLocations?: string[];
    links?: string[];
  };
  education: Array<{
    id: string;
    school: string;
    degree: string;
    major: string;
    startYear: string;
    endYear: string;
    gpa?: string;
    courses?: string[];
    honors?: string[];
    scholarshipOrRanking?: string;
  }>;
  target: {
    targetRole: string;
    inferredRoleCategory?: string;
    targetCompanies?: string[];
    customCompanies?: string[];
    targetCities?: string[];
    requiredAbilities?: string[];
    resumeFocus?: string;
  };
  selectedExperienceTypes: ExperienceType[];
  uncertainExperienceText?: string;
  experiences: QuestExperience[];
  skills: {
    selected: string[];
    custom: string[];
    evidenceMap?: Record<string, string[]>;
    displayAdvice?: SkillDisplayAdvice[];
  };
  certificates: string[];
  abilities: QuestAbility[];
};

export type CompanyGroup = {
  title: string;
  companies: string[];
};

export type ResumeGenerateResult = {
  resumeData: ResumeData;
  generationSummary: string;
  generatedHighlights: string[];
  missingInfoWarnings: Array<{
    module: 'basic' | 'education' | 'experience' | 'projects' | 'skills' | 'awards' | 'selfEval';
    issue: string;
    suggestion: string;
  }>;
};

export const EXPERIENCE_META: Record<ExperienceType, { title: string; desc: string }> = {
  internship: { title: '实习 / 兼职 / 校园大使', desc: '公司实习、门店兼职、家教、助教、助研、校园推广都算' },
  project: { title: '课程作业 / 小组项目', desc: '课程报告、PPT 展示、调研作业、编程作业、课程设计、毕设都算' },
  competition: { title: '比赛经历', desc: '大创、挑战杯、互联网+、数模、统计大赛、CAD 比赛、电路设计大赛、商赛、市场营销大赛等都算' },
  research: { title: '科研 / 论文', desc: '老师课题、文献综述、实验记录、数据处理、课程论文、毕业论文都算' },
  campus: { title: '社团 / 学生会 / 班委', desc: '活动策划、社团招新、宣传、社群官号运营、班级事务都算' },
  volunteer: { title: '志愿活动 / 社会实践', desc: '志愿服务、支教、调研实践、公益活动都算' },
  content: { title: '内容 / 作品 / 账号', desc: '公众号、小红书、视频号、B站、作品集、GitHub、设计作品都算' },
  none: { title: '暂时想不起来', desc: '先跳过，后面也能生成基础版简历' },
};

export const SKILL_GROUPS: SkillGroup[] = [
  { title: '办公协作', skills: ['PPT', 'Word', 'Excel', '飞书', 'Notion', 'Obsidian', '在线文档'] },
  { title: '数据分析', skills: ['Python', 'SQL', 'SPSS', 'R', 'Stata', 'Excel 数据透视表', 'Tableau', 'Power BI'] },
  { title: '产品工具', skills: ['Axure', '墨刀', 'Figma', 'XMind', 'Visio', 'ProcessOn'] },
  { title: '设计与内容', skills: ['PS', 'Canva', '剪映', '小红书排版', '公众号编辑'] },
  { title: '工程技术', skills: ['CAD', 'SolidWorks', 'MATLAB', 'Proteus', 'Arduino', 'C / C++', 'Java'] },
  { title: '科研工具', skills: ['Zotero', 'EndNote', 'NVivo', 'ArcGIS', 'QGIS'] },
  { title: '语言能力', skills: ['英语', '粤语', '日语', '韩语'] },
];

const ROLE_CONTEXT_MAP: Record<string, { requiredAbilities: string[]; resumeFocus: string }> = {
  产品: {
    requiredAbilities: ['用户理解', '需求梳理', '竞品分析', '数据意识', '沟通协作'],
    resumeFocus: '优先挖掘课程项目、调研报告、竞赛和社团活动中能体现用户理解、需求拆解和产品分析的经历。',
  },
  数据: {
    requiredAbilities: ['Python / SQL / Excel', '统计分析', '数据清洗', '数据可视化', '业务理解'],
    resumeFocus: '优先突出数据来源、分析方法、工具使用、可视化结果和业务结论。',
  },
  运营: {
    requiredAbilities: ['内容策划', '活动执行', '用户运营', '数据复盘', '社群沟通'],
    resumeFocus: '优先突出内容、活动、用户反馈、增长复盘和执行落地能力。',
  },
  技术: {
    requiredAbilities: ['编程基础', '工程实现', '问题排查', '技术学习', '协作开发'],
    resumeFocus: '优先突出项目实现、技术栈、功能模块、问题解决和代码产出。',
  },
  设计: {
    requiredAbilities: ['用户体验', '视觉表达', '设计工具', '作品集', '沟通协作'],
    resumeFocus: '优先突出设计目标、调研过程、方案迭代、工具使用和作品交付。',
  },
  市场: {
    requiredAbilities: ['市场调研', '消费者洞察', '竞品分析', '品牌传播', '数据复盘'],
    resumeFocus: '优先突出市场分析、用户画像、传播方案、活动效果和复盘结论。',
  },
  销售: {
    requiredAbilities: ['客户沟通', '需求识别', '商务推进', '关系维护', '结果意识'],
    resumeFocus: '优先突出沟通对象、推进过程、转化结果和客户反馈。',
  },
  职能: {
    requiredAbilities: ['沟通协调', '流程意识', '信息整理', '执行力', '细节可靠'],
    resumeFocus: '优先突出流程推进、信息整理、跨方协作和稳定交付。',
  },
  金融: {
    requiredAbilities: ['Excel', '财务分析', '行业研究', '风险意识', '严谨性'],
    resumeFocus: '优先突出数据处理、行业研究、财务分析、风险判断和结论表达。',
  },
  咨询: {
    requiredAbilities: ['结构化分析', '商业判断', '表达汇报', '研究能力', '问题拆解'],
    resumeFocus: '优先突出问题拆解、资料研究、框架分析、PPT 汇报和结论建议。',
  },
  科研: {
    requiredAbilities: ['文献整理', '科研分析', '实验记录', '逻辑表达', '工具使用'],
    resumeFocus: '优先突出研究问题、方法工具、实验过程、数据结果和论文产出。',
  },
  通用: {
    requiredAbilities: ['学习能力', '沟通表达', '结构化思考', '执行力', '结果意识'],
    resumeFocus: '优先整理真实经历，并补足动作、方法、结果和量化信息。',
  },
};

export function inferRoleCategory(targetRole: string): string {
  const role = targetRole.trim();
  if (/产品|PM|prd|需求|用户体验/i.test(role)) return '产品';
  if (/数据|分析|算法|BI|SQL|Python|模型|统计/i.test(role)) return '数据';
  if (/运营|社群|内容|活动|用户增长|新媒体/i.test(role)) return '运营';
  if (/开发|前端|后端|测试|软件|工程师|Java|C\+\+|嵌入式|运维/i.test(role)) return '技术';
  if (/设计|UI|UX|视觉|交互|平面/i.test(role)) return '设计';
  if (/市场|品牌|营销|媒介|公关|投放/i.test(role)) return '市场';
  if (/销售|客户|商务|BD|渠道/i.test(role)) return '销售';
  if (/人力|HR|行政|财务|法务|采购|供应链|管培/i.test(role)) return '职能';
  if (/金融|投行|证券|基金|银行|风控|量化|行业研究/i.test(role)) return '金融';
  if (/咨询|战略|商业分析|BA/i.test(role)) return '咨询';
  if (/科研|研究|实验|助研|论文|课题/i.test(role)) return '科研';
  return '通用';
}

export function getRoleContextFromTarget(targetRole: string) {
  const inferredRoleCategory = inferRoleCategory(targetRole);
  const context = ROLE_CONTEXT_MAP[inferredRoleCategory] || ROLE_CONTEXT_MAP.通用;
  return {
    inferredRoleCategory,
    requiredAbilities: context.requiredAbilities,
    resumeFocus: context.resumeFocus,
  };
}

export function getRecommendedCompanies(targetRole: string): CompanyGroup[] {
  const category = inferRoleCategory(targetRole);
  if (category === '产品') {
    return [
      { title: '互联网 / 平台', companies: ['字节跳动', '腾讯', '阿里巴巴', '美团', '快手', '百度', '小红书', 'B站'] },
      { title: '游戏 / 内容', companies: ['米哈游', '网易游戏', '腾讯游戏', '莉莉丝', '叠纸', '鹰角网络'] },
      { title: 'AI / 工具', companies: ['MiniMax', '月之暗面', '智谱 AI', '商汤', '百度智能云', '火山引擎'] },
      { title: '电商 / 本地生活', companies: ['淘宝天猫', '京东', '拼多多', '美团', '饿了么', '得物'] },
    ];
  }
  if (category === '数据') {
    return [
      { title: '互联网 / 数据平台', companies: ['字节跳动', '腾讯', '美团', '阿里巴巴', '快手', '百度', '小红书'] },
      { title: '金融 / 风控', companies: ['招商银行', '平安', '蚂蚁集团', '微众银行', '同花顺', '东方财富'] },
      { title: '咨询 / 商业分析', companies: ['麦肯锡', 'BCG', '贝恩', '艾瑞咨询', '尼尔森', '益普索'] },
    ];
  }
  if (category === '运营') {
    return [
      { title: '内容平台', companies: ['小红书', 'B站', '抖音', '快手', '微博', '知乎'] },
      { title: '电商 / 本地生活', companies: ['淘宝天猫', '京东', '拼多多', '美团', '得物'] },
      { title: '游戏 / 社区', companies: ['米哈游', '网易游戏', '腾讯游戏', 'TapTap'] },
    ];
  }
  return [
    { title: '热门公司', companies: ['字节跳动', '腾讯', '阿里巴巴', '美团', '百度', '小红书', '京东', '网易', '米哈游', '快手'] },
  ];
}

export function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function createEmptyQuestData(roleContext?: ResumeRoleContext | null): ResumeQuestData {
  const year = String(new Date().getFullYear());
  const roleTarget = roleContext?.targetRole || '';
  const inferred = roleContext
    ? {
        inferredRoleCategory: roleContext.roleCategory,
        requiredAbilities: roleContext.requiredAbilities,
        resumeFocus: roleContext.resumeFocus,
      }
    : getRoleContextFromTarget(roleTarget);
  return {
    basicInfo: { name: '', email: '', phone: '', baseLocations: [], links: [] },
    education: [{
      id: createId('edu'),
      school: '',
      degree: '',
      major: '',
      startYear: String(Number(year) - 4),
      endYear: year,
      courses: [],
      honors: [],
    }],
    target: {
      targetRole: roleTarget,
      inferredRoleCategory: inferred.inferredRoleCategory,
      targetCompanies: [],
      customCompanies: [],
      requiredAbilities: inferred.requiredAbilities || [],
      resumeFocus: inferred.resumeFocus || '',
      targetCities: [],
    },
    selectedExperienceTypes: [],
    uncertainExperienceText: '',
    experiences: [],
    skills: { selected: [], custom: [], evidenceMap: {}, displayAdvice: [] },
    certificates: [],
    abilities: [],
  };
}

function allQuestSkills(data: ResumeQuestData) {
  return Array.from(new Set([...(data.skills.selected || []), ...(data.skills.custom || [])])).filter(Boolean);
}

export function generateSkillDisplayAdvice(data: ResumeQuestData): SkillDisplayAdvice[] {
  const skills = allQuestSkills(data);
  const allText = data.experiences.map(textOfExperience).join(' ');
  const roleText = `${data.target.targetRole} ${data.target.inferredRoleCategory || ''}`;
  const roleRelevantPatterns: Record<string, RegExp> = {
    product: /产品|用户|需求|竞品|调研|原型|Axure|Figma|XMind|墨刀|PPT|Excel/i,
    data: /数据|分析|Python|SQL|SPSS|R|Stata|Excel|Tableau|Power BI|统计|模型/i,
    operation: /运营|内容|社群|活动|用户|小红书|公众号|剪映|Canva|文案/i,
    tech: /技术|开发|工程|Java|C|Python|MATLAB|Arduino|CAD|SolidWorks/i,
    design: /设计|Figma|PS|Canva|视觉|交互|UI|UX/i,
  };
  const rolePattern = /数据|分析/.test(roleText) ? roleRelevantPatterns.data
    : /运营|内容|社群|活动/.test(roleText) ? roleRelevantPatterns.operation
      : /技术|开发|工程|前端|后端/.test(roleText) ? roleRelevantPatterns.tech
        : /设计|UI|UX|视觉/.test(roleText) ? roleRelevantPatterns.design
          : roleRelevantPatterns.product;

  return skills.map(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hasExperienceEvidence = new RegExp(escaped, 'i').test(allText);
    const evidenceCount = data.skills.evidenceMap?.[skill]?.filter(Boolean).length || 0;
    const isRoleRelevant = rolePattern.test(skill);
    if ((hasExperienceEvidence || evidenceCount > 0) && isRoleRelevant) {
      return { skill, level: 'recommended', reason: '该技能与目标岗位相关，并且已有经历或用户补充证据支撑。' };
    }
    if (hasExperienceEvidence || evidenceCount > 0 || isRoleRelevant) {
      return { skill, level: 'optional', reason: hasExperienceEvidence || evidenceCount > 0 ? '已有一定使用证据，可在经历里补充具体场景后展示。' : '与目标岗位相关，但还缺少经历支撑。' };
    }
    return { skill, level: 'not_suggested', reason: '当前缺少目标岗位相关性和经历证据，建议先不作为简历重点展示。' };
  });
}

export function createExperience(type: Exclude<ExperienceType, 'none'>): QuestExperience {
  return {
    id: createId(type),
    type,
    title: '',
    organization: '',
    role: '',
    time: '',
    teamSize: '',
    methods: [],
    tools: [],
    deliverables: [],
    actions: '',
    result: '',
  };
}

function textOfExperience(exp: QuestExperience) {
  return [
    EXPERIENCE_META[exp.type].title,
    exp.title,
    exp.organization,
    exp.role,
    exp.actions,
    exp.result,
    exp.methods?.join(' '),
    exp.tools?.join(' '),
    exp.deliverables?.join(' '),
  ].filter(Boolean).join(' ');
}

export function buildAbilitiesFromQuestData(data: ResumeQuestData): QuestAbility[] {
  const allText = data.experiences.map(textOfExperience).join(' ');
  const abilities: QuestAbility[] = [];
  const add = (name: string, score: number, evidence: string[], expression: string, tip: string) => {
    if (evidence.length > 0) abilities.push({ name, score, evidence, resumeExpression: expression, improvementTip: tip });
  };
  const hasType = (type: ExperienceType) => data.experiences.some(exp => exp.type === type);
  const titles = (types: ExperienceType[]) => data.experiences.filter(exp => types.includes(exp.type)).map(exp => exp.title || EXPERIENCE_META[exp.type].title).slice(0, 3);

  add('信息整理', hasType('project') || hasType('research') ? 4 : 2, titles(['project', 'research']), '具备资料收集、信息归纳和结构化表达能力', '补充报告页数、资料来源或展示反馈会更有说服力。');
  add('表达汇报', /PPT|展示|汇报|路演|报告/.test(allText) ? 4 : 2, titles(['project', 'competition', 'campus']), '能够将复杂信息整理成报告、PPT 或展示内容', '补充展示场景、听众人数或老师反馈。');
  add('数据分析', /数据|问卷|Python|SQL|SPSS|Excel|统计|模型|可视化/.test(allText + allQuestSkills(data).join(' ')) ? 4 : 2, titles(['project', 'competition', 'research']), '具备基础数据处理、分析和结果解释能力', '如果选择了 Python / SQL / SPSS，请补充真实使用场景。');
  add('项目推进', hasType('competition') || hasType('campus') || hasType('internship') ? 4 : 2, titles(['competition', 'campus', 'internship']), '能够在团队任务中承担分工并推进交付', '补充团队人数、周期、分工和最终交付物。');
  add('沟通协作', hasType('campus') || hasType('volunteer') || hasType('internship') ? 4 : 2, titles(['campus', 'volunteer', 'internship']), '具备跨成员沟通、协调执行和现场推进能力', '补充沟通对象、人数和结果反馈。');
  add('内容运营', hasType('content') ? 4 : 2, titles(['content']), '具备选题、内容制作、发布和复盘意识', '补充发布篇数、持续周期、互动或阅读数据。');

  allQuestSkills(data).forEach(skill => {
    const hasEvidence = new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(allText);
    if (!hasEvidence && ['Python', 'SQL', 'SPSS', 'Figma', 'Axure', 'CAD', 'MATLAB'].includes(skill)) {
      abilities.push({
        name: `${skill} 使用可信度`,
        score: 2,
        evidence: [`你选择了 ${skill}，但经历中还没有具体使用场景`],
        resumeExpression: `掌握 ${skill} 基础能力`,
        improvementTip: `补充一次使用 ${skill} 完成课程作业、比赛、科研或作品的经历。`,
      });
    }
  });

  return abilities.slice(0, 8);
}

function filled(value?: string | string[]) {
  return Array.isArray(value) ? value.filter(Boolean).length > 0 : Boolean(value?.trim());
}

function displayAward(exp: QuestExperience) {
  if (!exp.awardLevel || ['完成作品但未获奖', '结果待公布', '不记得'].includes(exp.awardLevel)) return '';
  return exp.awardLevel === '其他' ? exp.proof || '其他成果' : exp.awardLevel;
}

function getExperienceWarning(exp: QuestExperience): ResumeGenerateResult['missingInfoWarnings'][number] | null {
  const name = exp.title || exp.organization || exp.platform || EXPERIENCE_META[exp.type].title;
  const issue = `「${name}」信息还不够生成可靠简历经历`;
  const suggestion = exp.rawText
    ? '你已经写了原话，请继续补充主题、你的职责、交付物或结果后再写入简历。'
    : '请至少补充这是什么、你负责什么、交付了什么或结果是什么。';

  if (exp.type === 'project') {
    const count = [exp.title, exp.actions, exp.deliverables, exp.result].filter(filled).length;
    return count >= 2 ? null : { module: 'projects', issue, suggestion };
  }
  if (exp.type === 'competition') {
    const ok = (filled(exp.title) || filled(exp.organization))
      && (filled(exp.role) || filled(exp.actions))
      && (filled(exp.deliverables) || filled(exp.awardLevel) || filled(exp.result));
    return ok ? null : { module: 'projects', issue, suggestion: '比赛经历建议补充比赛/项目名称、你的角色或工作内容、最终交付物/奖项/结果。' };
  }
  if (exp.type === 'research') {
    const count = [exp.title, exp.actions, exp.deliverables, exp.researchStatus || exp.publicationStatus].filter(filled).length;
    return count >= 2 ? null : { module: 'projects', issue, suggestion: '科研经历建议补充研究题目、你做的工作、产出或当前状态。' };
  }
  if (exp.type === 'campus' || exp.type === 'volunteer') {
    const ok = (filled(exp.organization) || filled(exp.title)) && filled(exp.actions);
    return ok ? null : { module: 'experience', issue, suggestion: '校园/志愿经历建议补充组织或活动名称，以及你具体负责的工作。' };
  }
  if (exp.type === 'internship') {
    const ok = (filled(exp.organization) || filled(exp.title)) && filled(exp.actions);
    return ok ? null : { module: 'experience', issue, suggestion: '实习/兼职经历建议补充公司或组织名称，以及你具体做过的工作。' };
  }
  if (exp.type === 'content') {
    const count = [exp.platform || exp.title, exp.actions, exp.deliverables, exp.result].filter(filled).length;
    return count >= 2 ? null : { module: 'projects', issue, suggestion: '内容作品建议补充平台/作品名称、你做的内容、交付物或数据结果。' };
  }
  return null;
}

function compactText(text?: string, max = 64) {
  const value = text?.trim();
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function joinParts(parts: Array<string | undefined>, fallback = '相关工作') {
  return parts.map(part => part?.trim()).filter(Boolean).join('、') || fallback;
}

function buildDraftBullets(exp: QuestExperience): string[] {
  const methods = joinParts([...(exp.methods || []), ...(exp.tools || [])], '');
  const deliverables = joinParts(exp.deliverables || [], '');
  const actions = compactText(exp.actions, 72);
  const result = compactText(exp.result, 72);
  const role = exp.role || actions;
  const bullets: string[] = [];

  if (exp.type === 'project' || exp.type === 'content') {
    const name = exp.title || exp.platform || '相关项目';
    bullets.push(`参与${name}，负责${role || '资料整理与任务执行'}${methods ? `，使用${methods}` : ''}${deliverables || result ? `，最终完成${deliverables || result}` : ''}`);
  } else if (exp.type === 'competition') {
    const name = exp.organization || exp.title || '相关比赛';
    bullets.push(`参与${name}，负责${role || '团队分工任务'}${methods ? `，使用${methods}` : ''}${deliverables ? `，完成${deliverables}` : ''}`);
    const award = displayAward(exp);
    if (award) bullets.push(`比赛结果：${award}`);
    else if (result) bullets.push(result);
  } else if (exp.type === 'research') {
    const name = exp.title || '相关研究';
    bullets.push(`围绕${name}开展研究，负责${role || '文献、数据或分析相关工作'}${methods ? `，使用${methods}` : ''}${deliverables || result ? `，产出${deliverables || result}` : ''}`);
    const status = exp.researchStatus || exp.publicationStatus;
    if (status) bullets.push(`研究状态：${status}`);
  } else if (exp.type === 'campus' || exp.type === 'volunteer') {
    const org = exp.organization || exp.title || '相关组织';
    bullets.push(`在${org}${exp.role ? `担任${exp.role}` : ''}，负责${exp.title && exp.organization ? `${exp.title}中的` : ''}${actions || '活动执行与协作'}${result ? `，完成${result}` : ''}`);
  } else if (exp.type === 'internship') {
    const org = exp.organization || exp.title || '相关组织';
    bullets.push(`在${org}${exp.role ? `担任${exp.role}` : ''}，负责${actions || '日常业务支持'}${methods ? `，使用${methods}` : ''}${deliverables || result ? `，完成${deliverables || result}` : ''}`);
  }

  return bullets.filter(Boolean);
}

function toDraftResumeItem(exp: QuestExperience): ResumeItem {
  return {
    title: exp.platform || exp.organization || exp.title || EXPERIENCE_META[exp.type].title,
    role: exp.role || exp.title || '',
    period: exp.time || '',
    bullets: buildDraftBullets(exp),
  };
}

export function generateResumeDraftFromQuestData(questData: ResumeQuestData): ResumeGenerateResult {
  const data = { ...questData, abilities: questData.abilities?.length ? questData.abilities : buildAbilitiesFromQuestData(questData) };
  const resume = emptyResume();
  const missingInfoWarnings: ResumeGenerateResult['missingInfoWarnings'] = [];
  const generatedHighlights: string[] = [];

  if (!data.basicInfo.name?.trim()) missingInfoWarnings.push({ module: 'basic', issue: '缺少姓名', suggestion: '请补充姓名，简历顶部需要展示。' });
  if (!data.basicInfo.email?.trim()) missingInfoWarnings.push({ module: 'basic', issue: '缺少邮箱', suggestion: '请补充常用邮箱，方便 HR 联系。' });
  if (!data.basicInfo.phone?.trim()) missingInfoWarnings.push({ module: 'basic', issue: '缺少电话', suggestion: '请补充手机号，方便 HR 联系。' });

  resume.basic = {
    name: data.basicInfo.name,
    email: data.basicInfo.email,
    phone: data.basicInfo.phone,
    city: data.basicInfo.city || '',
    availability: {
      daysPerWeek: data.basicInfo.daysPerWeek || '',
      internshipDuration: data.basicInfo.internshipDuration || '',
      baseLocations: data.basicInfo.baseLocations || [],
    },
    links: data.basicInfo.links || [],
    targetRole: data.target.targetRole,
  };

  const availability = [
    data.basicInfo.city && `当前城市：${data.basicInfo.city}`,
    data.basicInfo.daysPerWeek && `每周可实习：${data.basicInfo.daysPerWeek}`,
    data.basicInfo.internshipDuration && `可持续：${data.basicInfo.internshipDuration}`,
    data.basicInfo.baseLocations?.length ? `可接受 base：${data.basicInfo.baseLocations.join('、')}` : '',
    data.basicInfo.links?.length ? `补充链接：${data.basicInfo.links.join('、')}` : '',
  ].filter(Boolean).join('；');

  resume.education = data.education
    .filter(edu => edu.school || edu.degree || edu.major || edu.startYear || edu.endYear)
    .map(edu => ({
      school: edu.school,
      degree: `${edu.degree}${edu.major ? ` · ${edu.major}` : ''}`,
      period: `${edu.startYear || '待补充'} - ${edu.endYear || '待补充'}`,
      gpa: edu.gpa || '',
      extra: [
      edu.courses?.length ? `课程：${edu.courses.join('、')}` : '',
      edu.honors?.length ? `荣誉：${edu.honors.join('、')}` : '',
      edu.scholarshipOrRanking || '',
    ].filter(Boolean).join('；'),
  }));
  if (resume.education.length > 0) generatedHighlights.push(`已生成 ${resume.education.length} 段教育背景`);
  if (resume.education.length === 0) missingInfoWarnings.push({ module: 'education', issue: '缺少教育背景', suggestion: '请至少补充学校、学历、专业和时间。' });

  data.experiences.forEach(exp => {
    const warning = getExperienceWarning(exp);
    if (warning) {
      missingInfoWarnings.push(warning);
      return;
    }
    const item = toDraftResumeItem(exp);
    if (exp.type === 'internship') resume.experience.push(item);
    else if (exp.type === 'campus' || exp.type === 'volunteer') resume.campus.push(item);
    else if (exp.type === 'content' && /社团|学生会|班级|校园|活动/.test([exp.organization, exp.title, exp.actions].filter(Boolean).join(' '))) resume.campus.push(item);
    else resume.projects.push(item);
  });
  if (resume.experience.length > 0) generatedHighlights.push(`已生成 ${resume.experience.length} 段实习 / 工作经历`);
  if (resume.projects.length > 0) generatedHighlights.push(`已生成 ${resume.projects.length} 段项目 / 比赛 / 科研经历`);
  if (resume.campus.length > 0) generatedHighlights.push(`已生成 ${resume.campus.length} 段校园 / 志愿经历`);

  const awardsFromCompetitions = data.experiences
    .filter(exp => exp.type === 'competition' && exp.awardLevel && !['完成作品但未获奖', '结果待公布', '不记得'].includes(exp.awardLevel))
    .map(exp => `${exp.title || exp.organization || '比赛'}：${exp.awardLevel === '其他' ? exp.proof || '其他成果' : exp.awardLevel}`);
  const educationHonors = data.education.flatMap(edu => edu.honors || []);
  const skillAdvice = generateSkillDisplayAdvice(data);
  const displaySkills = skillAdvice
    .filter(item => item.level !== 'not_suggested')
    .map(item => item.skill);
  resume.skills = Array.from(new Set(displaySkills.length ? displaySkills : allQuestSkills(data)));
  resume.certs = Array.from(new Set([...data.certificates, ...educationHonors, ...awardsFromCompetitions]));
  if (resume.skills.length > 0) generatedHighlights.push(`已整理 ${resume.skills.length} 项技能`);
  if (resume.certs.length > 0) generatedHighlights.push(`已整理 ${resume.certs.length} 项证书 / 奖项`);
  if (resume.skills.length === 0) missingInfoWarnings.push({ module: 'skills', issue: '缺少技能信息', suggestion: '建议补充真实使用过的工具或能力，例如 Excel、PPT、Python、Figma 等。' });

  const selfEvalParts = [
    data.abilities.length ? data.abilities.slice(0, 3).map(a => a.resumeExpression).join('；') : '',
    availability,
  ].filter(Boolean);
  resume.selfEval = selfEvalParts.length
    ? selfEvalParts.join('；')
    : '待补充：个人优势、能力证据和求职动机';
  if (!data.abilities.length) missingInfoWarnings.push({ module: 'selfEval', issue: '能力证据较少', suggestion: '建议补充至少一段课程项目、比赛、科研或校园经历，系统才能提炼更可信的自我评价。' });

  const totalItems = resume.experience.length + resume.projects.length + resume.campus.length;
  const generationSummary = totalItems > 0
    ? `已基于你的填写内容生成一版岗位定向简历草稿，包含 ${resume.education.length} 段教育背景、${totalItems} 段经历、${resume.skills.length} 项技能。`
    : `已基于基础信息和教育背景生成基础版简历草稿。当前经历素材还不足，建议补充项目、比赛、实习或校园经历后再优化。`;

  return {
    resumeData: resume,
    generationSummary,
    generatedHighlights: generatedHighlights.length ? generatedHighlights : ['已生成基础信息和教育背景草稿'],
    missingInfoWarnings,
  };
}

export function questDataToResumeData(data: ResumeQuestData): ResumeData {
  return generateResumeDraftFromQuestData(data).resumeData;
}

function warningsToAISuggestions(warnings: ResumeGenerateResult['missingInfoWarnings']): AISuggestion[] {
  return warnings.map((warning, index) => ({
    id: `quest_warning_${index}`,
    type: warning.module === 'skills' ? '技能可信度' : '信息完整度',
    severity: warning.module === 'basic' || warning.module === 'education' ? 'high' : 'medium',
    section: warning.module,
    problem: warning.issue,
    suggestion: warning.suggestion,
  }));
}

export function questDataToWorkspaceState(
  data: ResumeQuestData,
  roleContext?: ResumeRoleContext | null,
  generateResultOverride?: ResumeGenerateResult,
): ResumeWorkspaceState {
  const abilities = buildAbilitiesFromQuestData(data);
  const roleDerived = getRoleContextFromTarget(data.target.targetRole);
  const targetContext: ResumeRoleContext = {
    targetRole: data.target.targetRole || '通用校招岗位',
    roleCategory: data.target.inferredRoleCategory || roleDerived.inferredRoleCategory || '通用',
    matchReason: roleContext?.targetRole === data.target.targetRole ? roleContext.matchReason : '用户从 0 创建简历时确认的目标岗位。',
    requiredAbilities: data.target.requiredAbilities?.length ? data.target.requiredAbilities : roleDerived.requiredAbilities,
    preferredExperienceSignals: roleContext?.targetRole === data.target.targetRole ? roleContext.preferredExperienceSignals : ['课程项目', '竞赛经历', '社团活动', '个人作品'],
    resumeFocus: data.target.resumeFocus || roleDerived.resumeFocus,
  };
  const generateResult = generateResultOverride || generateResumeDraftFromQuestData({ ...data, abilities });
  const resumeData = generateResult.resumeData;
  const abilitySummary: AbilityItem[] = abilities.map(item => ({
    name: item.name,
    evidence: `${item.evidence.join('、')}。${item.improvementTip}`,
  }));
  return {
    source: 'quest',
    targetContext,
    resumeData,
    skillGroups: SKILL_GROUPS.map(group => ({ title: group.title, skills: group.skills.filter(skill => data.skills.selected.includes(skill)) })).filter(group => group.skills.length > 0),
    abilitySummary,
    aiSuggestions: [
      ...warningsToAISuggestions(generateResult.missingInfoWarnings),
      ...generateResumeSuggestions(resumeData, targetContext, 'quest'),
    ],
    sourceEvidence: {
      questData: data,
    },
    createdAt: new Date().toISOString(),
  };
}
