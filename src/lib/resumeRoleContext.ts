import { SELECTED_JOBS_LS_KEY } from '@/pages/CareerRecommend';

export type ResumeRoleContext = {
  targetRole: string;
  roleCategory: string;
  matchReason: string;
  requiredAbilities: string[];
  preferredExperienceSignals: string[];
  resumeFocus: string;
};

type StoredJob = {
  title?: string;
  category?: string;
  skills?: string[];
  reasons?: string[];
  path?: string;
  salary?: string;
  outlook?: string;
  match?: number;
};

export type SelectedJobInput = {
  title: string;
  category?: string;
  skills?: string[];
  reasons?: string[];
  path?: string;
  salary?: string;
  outlook?: string;
  match?: number;
};

const roleAbilityMap: Record<string, Omit<ResumeRoleContext, 'targetRole'>> = {
  product: {
    roleCategory: '产品',
    matchReason: '该方向重视信息整理、用户问题拆解、表达汇报和跨角色协作。',
    requiredAbilities: ['用户理解', '竞品分析', '需求梳理', '数据意识', '沟通协作'],
    preferredExperienceSignals: ['课程项目', '调研报告', '竞赛经历', '社团活动', '内容运营', '个人作品'],
    resumeFocus: '优先挖掘能体现用户理解、需求分析、产品判断和推动落地的经历。',
  },
  data: {
    roleCategory: '数据',
    matchReason: '该方向重视结构化分析、数据处理、业务理解和结果表达。',
    requiredAbilities: ['SQL', 'Excel', 'Python', '统计分析', '数据可视化', '业务理解'],
    preferredExperienceSignals: ['数据分析项目', '数学建模', '统计建模竞赛', '科研论文', '编程作业'],
    resumeFocus: '优先突出数据来源、分析方法、指标设计、可视化结果和业务结论。',
  },
  frontend: {
    roleCategory: '研发',
    matchReason: '该方向重视工程实现、组件化能力、交互还原和问题排查。',
    requiredAbilities: ['HTML/CSS', 'JavaScript', 'React', 'TypeScript', '组件化', '调试能力'],
    preferredExperienceSignals: ['Web 项目', '课程大作业', '开源项目', '个人作品', '实习开发经历'],
    resumeFocus: '优先突出技术栈、负责模块、工程复杂度、性能体验和上线结果。',
  },
  operation: {
    roleCategory: '运营',
    matchReason: '该方向重视用户触达、内容策划、活动执行和数据复盘。',
    requiredAbilities: ['内容策划', '用户运营', '活动执行', '数据复盘', '社群沟通'],
    preferredExperienceSignals: ['社团运营', '新媒体账号', '活动策划', '校园推广', '内容作品'],
    resumeFocus: '优先突出用户增长、内容效果、活动数据、复盘优化和协作推进。',
  },
  marketing: {
    roleCategory: '市场',
    matchReason: '该方向重视市场理解、消费者洞察、传播策划和商业表达。',
    requiredAbilities: ['市场调研', '消费者画像', '竞品分析', '品牌传播', '数据复盘'],
    preferredExperienceSignals: ['调研项目', '商业竞赛', '品牌策划', '社媒运营', '活动推广'],
    resumeFocus: '优先突出市场定位、消费者洞察、竞争格局、传播方案和结果量化。',
  },
  design: {
    roleCategory: '设计',
    matchReason: '该方向重视审美判断、用户体验、工具熟练度和作品表达。',
    requiredAbilities: ['Figma', '用户体验', '交互设计', '视觉表达', '作品集'],
    preferredExperienceSignals: ['设计作品', '课程项目', '产品原型', 'UI 改版', '用户调研'],
    resumeFocus: '优先突出设计目标、用户问题、设计方案、工具能力和作品结果。',
  },
  hr: {
    roleCategory: 'HR',
    matchReason: '该方向重视沟通协调、流程意识、组织理解和人际敏感度。',
    requiredAbilities: ['沟通协调', '招聘流程', '组织理解', '执行力', '信息整理'],
    preferredExperienceSignals: ['学生组织', '社团管理', '活动协调', '招聘协助', '行政支持'],
    resumeFocus: '优先突出沟通对象、流程推进、组织协调、结果交付和细节可靠性。',
  },
  finance: {
    roleCategory: '财务/金融',
    matchReason: '该方向重视数字敏感度、严谨性、研究能力和风险意识。',
    requiredAbilities: ['Excel', '财务分析', '行业研究', '数据处理', '风险意识'],
    preferredExperienceSignals: ['财务课程项目', '行业研究', '商赛', '实习经历', '数据分析作业'],
    resumeFocus: '优先突出分析框架、数据依据、结论判断、模型方法和严谨交付。',
  },
  general: {
    roleCategory: '通用',
    matchReason: '你已设定目标岗位，简历会围绕该方向筛选和表达经历。',
    requiredAbilities: ['学习能力', '沟通表达', '结构化思考', '执行力', '结果意识'],
    preferredExperienceSignals: ['课程项目', '实习经历', '竞赛经历', '社团活动', '个人作品'],
    resumeFocus: '优先选择与目标岗位更相关的经历，并补足动作、方法、结果和量化信息。',
  },
};

function inferRoleKey(title: string, category?: string) {
  const text = `${title} ${category || ''}`.toLowerCase();
  if (/产品|pm|product/.test(text)) return 'product';
  if (/数据|分析|data|sql|bi/.test(text)) return 'data';
  if (/前端|react|web|frontend|开发|工程师/.test(text)) return 'frontend';
  if (/运营|operation|用户增长|内容/.test(text)) return 'operation';
  if (/市场|营销|品牌|marketing/.test(text)) return 'marketing';
  if (/设计|ui|ux|交互|视觉/.test(text)) return 'design';
  if (/hr|人力|招聘|组织/.test(text)) return 'hr';
  if (/财务|金融|投行|证券|会计|finance/.test(text)) return 'finance';
  return 'general';
}

export function buildResumeRoleContext(job?: StoredJob | null): ResumeRoleContext | null {
  const targetRole = job?.title?.trim();
  if (!targetRole) return null;
  const preset = roleAbilityMap[inferRoleKey(targetRole, job?.category)];
  const skills = Array.isArray(job?.skills) ? job.skills.filter(Boolean) : [];
  const reasons = Array.isArray(job?.reasons) ? job.reasons.filter(Boolean) : [];

  return {
    targetRole,
    roleCategory: job?.category || preset.roleCategory,
    matchReason: reasons[0] || preset.matchReason,
    requiredAbilities: skills.length > 0 ? Array.from(new Set([...skills.slice(0, 6), ...preset.requiredAbilities])).slice(0, 8) : preset.requiredAbilities,
    preferredExperienceSignals: preset.preferredExperienceSignals,
    resumeFocus: preset.resumeFocus,
  };
}

export function readResumeRoleContext(): ResumeRoleContext | null {
  try {
    const raw = localStorage.getItem(SELECTED_JOBS_LS_KEY);
    if (!raw) return null;
    const jobs = JSON.parse(raw);
    if (!Array.isArray(jobs)) return null;
    return buildResumeRoleContext(jobs[0]);
  } catch {
    return null;
  }
}

export function writeSelectedJobContext(input: SelectedJobInput) {
  const title = input.title.trim();
  if (!title) return;

  const payload: StoredJob[] = [{
    title,
    category: input.category || '自定义',
    skills: input.skills || [],
    reasons: input.reasons?.length ? input.reasons : ['你确认的主目标岗位'],
    path: input.path || '',
    salary: input.salary || '—',
    outlook: input.outlook || '—',
    match: input.match || 80,
  }];

  localStorage.setItem(SELECTED_JOBS_LS_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event('storage'));
}

export function formatRoleContextForPrompt(ctx: ResumeRoleContext | null) {
  if (!ctx) return '目标岗位：未设置。请生成一份通用校招简历，并保留可补充项。';
  return [
    `目标岗位：${ctx.targetRole}`,
    `岗位大类：${ctx.roleCategory}`,
    `匹配原因：${ctx.matchReason}`,
    `核心能力要求：${ctx.requiredAbilities.join('、')}`,
    `优先挖掘经历信号：${ctx.preferredExperienceSignals.join('、')}`,
    `简历生成策略：${ctx.resumeFocus}`,
  ].join('\n');
}
