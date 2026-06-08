import { inferRoleCategory } from '@/lib/interviewTips';
import type { ResumeItem } from '@/lib/resumeTypes';
import type {
  GenerateQuestionBankInput,
  InterviewQuestion,
  InterviewQuestionBankData,
  QuestionCategory,
  QuestionCount,
} from './types';

const EMPTY_DISTRIBUTION: Record<QuestionCategory, number> = {
  education: 0,
  motivation: 0,
  resume_deep_dive: 0,
  role_business: 0,
  behavioral: 0,
  hr_stability: 0,
  reverse_question: 0,
};

const DISTRIBUTIONS: Record<QuestionCount, Record<QuestionCategory, number>> = {
  5: { ...EMPTY_DISTRIBUTION, motivation: 1, resume_deep_dive: 2, role_business: 1, behavioral: 1 },
  10: { ...EMPTY_DISTRIBUTION, education: 1, motivation: 2, resume_deep_dive: 3, role_business: 2, behavioral: 1, reverse_question: 1 },
  15: { ...EMPTY_DISTRIBUTION, education: 2, motivation: 2, resume_deep_dive: 4, role_business: 3, behavioral: 2, hr_stability: 1, reverse_question: 1 },
  20: { ...EMPTY_DISTRIBUTION, education: 2, motivation: 3, resume_deep_dive: 5, role_business: 4, behavioral: 3, hr_stability: 2, reverse_question: 1 },
};

function textOf(item: ResumeItem) {
  return [item.title, item.role, item.period, ...item.bullets].filter(Boolean).join(' ');
}

function q(
  category: QuestionCategory,
  question: string,
  interviewerIntent: string,
  answerStrategy: string[],
  sampleAnswer: string,
  followUps: string[],
  materialsToPrepare: string[],
): Omit<InterviewQuestion, 'id'> {
  return { category, question, interviewerIntent, answerStrategy, sampleAnswer, followUps, materialsToPrepare };
}

function resumeQuestions(items: ResumeItem[], targetRole: string): Omit<InterviewQuestion, 'id'>[] {
  const source = items.length ? items : [{ title: '你简历里最相关的一段经历', role: '', period: '', bullets: [] }];
  return source.flatMap(item => {
    const title = item.title || '这段经历';
    return [
      q('resume_deep_dive', `你在「${title}」里具体负责什么？`, '确认经历真实性和个人贡献边界。', ['先说项目背景', '明确自己的任务', '说清楚动作和结果', '不要把团队成果全部说成个人成果'], `我会先介绍${title}的背景，再说明我负责的具体部分、使用的方法和最后交付物。`, ['这个项目最后产出了什么？', '你遇到的最大困难是什么？'], ['项目背景', '个人任务', '交付物或结果证据']),
      q('resume_deep_dive', `「${title}」和${targetRole}有什么关系？`, '判断用户能否把经历迁移到岗位能力。', ['提炼岗位能力', '对应经历中的动作', '承认差距并说明补齐计划'], `这段经历不能简单等同于正式实习，但其中的信息整理、问题拆解和推进协作能力，可以迁移到${targetRole}。`, ['如果重新做一次会怎么优化？'], ['岗位能力要求', '经历中的对应证据']),
    ];
  });
}

function roleBusinessQuestions(targetRole: string) {
  const category = inferRoleCategory(targetRole);
  if (category === 'product') {
    return [
      q('role_business', '如果让你优化一个常用 App，你会怎么做？', '考察用户理解、问题拆解和产品判断。', ['选择具体场景', '说明用户问题', '提出方案', '说明验证方式'], '我会先选一个高频场景，观察用户卡点，再从影响面和实现成本判断优化优先级。', ['如何判断功能是否值得做？'], ['常用 App 案例', '竞品截图或分析']),
      q('role_business', '你如何做竞品分析？', '考察结构化分析能力。', ['明确分析目标', '选竞品', '拆维度', '输出结论'], '我会先明确分析目的，再从目标用户、核心流程、功能差异和数据表现几个维度对比。', ['分析完怎么落到产品建议？'], ['竞品清单', '分析维度']),
    ];
  }
  if (category === 'data') {
    return [
      q('role_business', '你如何分析一个指标下降的问题？', '考察数据分析思路和业务解释能力。', ['确认指标口径', '拆维度', '排查异常', '给出业务解释'], '我会先确认指标定义，再按时间、渠道、用户分层拆解，最后结合业务动作判断原因。', ['如果数据缺失怎么办？'], ['指标口径', '拆解维度']),
      q('role_business', '你如何把数据分析结果讲给业务方？', '考察表达和业务沟通。', ['先说结论', '解释证据', '给建议', '说明限制'], '我会先讲结论和影响，再展示关键数据证据，最后给出可执行建议。', ['业务方不认可怎么办？'], ['图表', '结论摘要']),
    ];
  }
  if (category === 'operation') {
    return [
      q('role_business', '如果让你策划一次拉新活动，你会怎么做？', '考察活动策划和复盘意识。', ['明确目标人群', '设计触达方式', '规划执行', '设定指标'], '我会先明确活动目标和人群，再设计内容、渠道和节奏，最后用报名数、转化率等指标复盘。', ['预算很少怎么办？'], ['活动案例', '复盘指标']),
      q('role_business', '如何判断一篇内容效果好不好？', '考察内容运营指标意识。', ['看目标', '看阅读互动', '看转化', '看复盘'], '我会根据内容目标判断，如果是种草看互动和收藏，如果是转化看点击和报名。', ['内容效果差怎么优化？'], ['内容案例', '数据指标']),
    ];
  }
  if (category === 'tech') {
    return [
      q('role_business', '介绍一个你做过的技术项目。', '考察项目真实性和技术表达。', ['讲业务目标', '讲技术栈', '讲自己模块', '讲问题排查'], '我会先说明项目目标和技术栈，再聚焦我负责的模块以及遇到的问题。', ['遇到 bug 怎么排查？'], ['项目仓库', '技术栈说明']),
      q('role_business', '你如何学习一个新技术？', '考察学习能力。', ['看官方文档', '做最小 demo', '查问题', '复盘沉淀'], '我通常会先跑通最小 demo，再带着问题查文档和实践。', ['学过但没用过怎么办？'], ['学习记录', 'demo']),
    ];
  }
  return [
    q('role_business', '你理解这个岗位每天做什么？', '考察岗位理解。', ['说日常任务', '说核心能力', '结合自己经历'], `我理解${targetRole}需要先理解业务目标，再完成具体任务并和团队协作。`, ['这个岗位最需要什么能力？'], ['岗位 JD', '公司业务信息']),
    q('role_business', '如果让你入职第一周快速上手，你会怎么做？', '考察学习和适应能力。', ['了解业务', '梳理任务', '主动请教', '形成反馈'], '我会先了解团队目标和历史材料，再确认任务优先级，遇到问题及时反馈。', ['遇到不会的问题怎么办？'], ['入职学习计划']),
  ];
}

function pool(input: GenerateQuestionBankInput): Record<QuestionCategory, Omit<InterviewQuestion, 'id'>[]> {
  const { resumeData, targetContext } = input.workspaceState;
  const targetRole = targetContext.targetRole;
  const resumeItems = [...resumeData.projects, ...resumeData.experience, ...resumeData.campus];
  return {
    education: [
      q('education', '你为什么选择这个专业？', '看专业选择和自我认知。', ['真实说明选择原因', '连接岗位能力', '不要硬凑'], '我选择这个专业主要是因为它训练了我的基础分析和学习能力，这些能力可以迁移到目标岗位。', ['你的专业和岗位有什么关系？'], ['专业课程', '课程项目']),
      q('education', '你在学校里最有收获的一门课是什么？', '看学习能力和总结能力。', ['讲课程内容', '讲具体收获', '讲应用场景'], '我最有收获的是一门需要完成项目或报告的课程，它让我练习了资料整理、分析和表达。', ['这门课有什么项目产出？'], ['课程作业', '报告']),
    ],
    motivation: [
      q('motivation', `你为什么想投${targetRole}？`, '看求职动机是否稳定。', ['说岗位理解', '说自身匹配', '说学习期待'], `我投${targetRole}不是因为随便找实习，而是因为我希望把已有经历中的能力用于真实业务。`, ['为什么不投其他岗位？'], ['岗位理解', '匹配经历']),
      q('motivation', '你怎么理解这个岗位？', '看是否做过基础功课。', ['说日常工作', '说核心能力', '说自己差距'], `我理解这个岗位需要完成具体任务，也要理解业务目标并持续复盘。`, ['这个岗位最大的挑战是什么？'], ['JD', '岗位职责']),
      q('motivation', '你的未来职业规划是什么？', '看稳定性和方向感。', ['保持真实', '短期聚焦学习', '长期方向不要太虚'], '短期我希望先在实习中建立真实业务理解，长期再根据实践确定更具体的发展方向。', ['如果不适合怎么办？'], ['职业目标']),
    ],
    resume_deep_dive: resumeQuestions(resumeItems, targetRole),
    role_business: roleBusinessQuestions(targetRole),
    behavioral: [
      q('behavioral', '你遇到过最大的困难是什么？', '看抗压和解决问题能力。', ['讲背景', '讲困难', '讲动作', '讲结果和复盘'], '我会选择真实经历，重点说明我如何拆解问题、寻求资源并复盘。', ['现在再做会怎么处理？'], ['困难案例']),
      q('behavioral', '你有过团队分歧吗？怎么处理？', '看沟通协作。', ['先承认分歧', '说沟通方式', '说结果'], '我会先确认分歧来自目标、信息还是方案，再推动大家回到共同目标。', ['如果对方不配合怎么办？'], ['团队经历']),
      q('behavioral', '你有什么缺点？', '看自我认知。', ['选真实但可改善的问题', '说明改进动作'], '我有时会在不熟悉任务前期花较多时间确认方向，现在会通过提前列问题和及时反馈来改善。', ['这个缺点影响过项目吗？'], ['改进例子']),
    ],
    hr_stability: [
      q('hr_stability', '你什么时候可以入职？', '确认基础条件。', ['直接回答日期', '说明每周天数', '说明可持续多久'], '我可以根据课程安排尽快入职，并保证稳定的实习时间。', ['一周可以几天？'], ['课程表', '可入职时间']),
      q('hr_stability', '你现在还有其他 offer 吗？', '看求职进度和稳定性。', ['诚实说明', '强调当前岗位意愿'], '我会如实说明当前进度，同时表达对这个岗位的优先关注。', ['如果两个 offer 怎么选？'], ['求职进度']),
    ],
    reverse_question: [
      q('reverse_question', '这个岗位实习生主要会负责哪些具体工作？', '通过反问确认工作内容。', ['问具体任务', '问评价标准', '问学习目标'], '这是一个适合反问面试官的问题，不需要自己回答。', ['团队目前最希望实习生解决什么问题？'], ['反问清单']),
      q('reverse_question', '如果能加入团队，前一个月最重要的学习目标是什么？', '体现学习意愿。', ['关注上手路径', '关注团队期待'], '这是反问问题，用来了解入职后的学习重点。', ['表现好的实习生通常有什么特点？'], ['反问清单']),
    ],
  };
}

export function generateQuestionBankByRules(input: GenerateQuestionBankInput): InterviewQuestionBankData {
  const distribution = DISTRIBUTIONS[input.questionCount];
  const questionPool = pool(input);
  const questions: InterviewQuestion[] = [];

  (Object.keys(distribution) as QuestionCategory[]).forEach(category => {
    const candidates = questionPool[category];
    const count = distribution[category];
    for (let i = 0; i < count; i += 1) {
      const base = candidates[i % candidates.length];
      questions.push({ ...base, id: `${category}_${i + 1}_${questions.length + 1}` });
    }
  });

  return {
    targetRole: input.workspaceState.targetContext.targetRole,
    questionCount: input.questionCount,
    categoryDistribution: distribution,
    questions: questions.slice(0, input.questionCount),
    generationNotes: ['规则版题库已根据目标岗位、简历经历和题型比例生成。', '参考回答只提供表达方向，不应背诵或虚构经历。'],
    source: 'rules',
  };
}
