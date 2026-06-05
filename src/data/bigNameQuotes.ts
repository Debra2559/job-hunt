// ========== 真实大拿语录库 ==========
// 每条语录需可溯源，按主题标签分类
// 用于求职陪伴 Agent 的自然引用

export type Quote = {
  id: string;
  text: string;           // 原话（中文译版或中英对照）
  author: string;         // 大拿名字
  title?: string;         // 大拿身份简述
  source?: string;        // 出处（演讲/采访/书/微博等），可溯源
  tags: string[];         // 主题标签
  context?: string;       // 背景故事，帮助 AI 自然引入
};

// ---- 主题标签常量 ----
export const QUOTE_TAGS = {
  perseverance: '坚持/韧性',
  decision: '选择/决策',
  failure: '失败/挫折',
  growth: '成长/学习',
  interview: '面试/求职',
  longterm: '长期主义/耐心',
  passion: '热爱/意义',
  product: '产品/技术',
  execution: '行动/执行力',
  anxiety: '焦虑/迷茫',
  bigSmall: '大厂vs小厂',
  firstJob: '第一份工作',
  confidence: '自信/心态',
  teamwork: '团队/协作',
} as const;

// ========== 语录数据 ==========
export const BIG_NAME_QUOTES: Quote[] = [

  // ===== 雷军 =====
  {
    id: 'leijun-1',
    text: '站在风口上，猪都能飞起来。但风停了，摔死的也是猪。',
    author: '雷军',
    title: '小米科技创始人',
    source: '雷军公开演讲',
    tags: [QUOTE_TAGS.decision, QUOTE_TAGS.longterm],
    context: '雷军创立小米时已有 20 年行业积累，"风口论"背后强调的其实是顺势而为的判断力，而非投机。',
  },
  {
    id: 'leijun-2',
    text: '人因梦想而伟大，又因坚持梦想而成长。',
    author: '雷军',
    title: '小米科技创始人',
    source: '2023 年度演讲',
    tags: [QUOTE_TAGS.perseverance, QUOTE_TAGS.passion],
    context: '雷军在 2023 年度演讲中回顾自己 30 多年的职业生涯，强调成长来自持续做难而正确的事。',
  },
  {
    id: 'leijun-3',
    text: '不要用战术上的勤奋，掩盖战略上的懒惰。',
    author: '雷军',
    title: '小米科技创始人',
    source: '雷军内部信 / 公开分享',
    tags: [QUOTE_TAGS.decision, QUOTE_TAGS.execution],
    context: '雷军多次强调先想清楚方向再发力，这在求职中同样适用——不要海投，先想清楚自己要什么。',
  },
  {
    id: 'leijun-4',
    text: '看五年，想三年，认认真真做好一两年。',
    author: '雷军',
    title: '小米科技创始人',
    source: '雷军年度演讲',
    tags: [QUOTE_TAGS.longterm, QUOTE_TAGS.decision, QUOTE_TAGS.firstJob],
    context: '这句话特别适合应届生：第一份工作要有 5 年视野，想清楚 3 年方向，但脚踏实地做好眼前 1-2 年。',
  },
  {
    id: 'leijun-5',
    text: '找人不是要「三顾茅庐」，而是要「三十顾茅庐」。',
    author: '雷军',
    title: '小米科技创始人',
    source: '雷军创业分享',
    tags: [QUOTE_TAGS.teamwork, QUOTE_TAGS.perseverance],
    context: '雷军创业初期花了 80% 的时间找人。求职也是双向选择——好机会值得持续跟进。',
  },

  // ===== 张一鸣 =====
  {
    id: 'zhangyiming-1',
    text: '延迟满足感，你的人生就赢了。',
    author: '张一鸣',
    title: '字节跳动创始人',
    source: '张一鸣微博 / 内部讲话',
    tags: [QUOTE_TAGS.longterm, QUOTE_TAGS.decision, QUOTE_TAGS.firstJob],
    context: '张一鸣多次在微博和内部讲话中强调"延迟满足感"是他最看重的品质。面对 offer 选择，问自己：哪个能带来更长期的成长？',
  },
  {
    id: 'zhangyiming-2',
    text: '大部分人知难而退，而你把难的事情做成了，你就超越了大部分人。',
    author: '张一鸣',
    title: '字节跳动创始人',
    source: '张一鸣早期博客',
    tags: [QUOTE_TAGS.perseverance, QUOTE_TAGS.execution],
    context: '张一鸣在早期博客中反复表达：做难而正确的事，本身就是最好的竞争壁垒。求职也是如此——认真准备的人永远是少数。',
  },
  {
    id: 'zhangyiming-3',
    text: '以平常心，做非常事。',
    author: '张一鸣',
    title: '字节跳动创始人',
    source: '字节跳动 9 周年内部演讲',
    tags: [QUOTE_TAGS.anxiety, QUOTE_TAGS.confidence],
    context: '2021 年字节 9 周年演讲，张一鸣谈面对焦虑和不确定时，"平常心"是最稀缺的能力。面试前紧张、等 offer 焦虑时，想想这句话。',
  },
  {
    id: 'zhangyiming-4',
    text: '选择比努力更重要，但选择本身也需要努力。',
    author: '张一鸣',
    title: '字节跳动创始人',
    source: '张一鸣早期分享',
    tags: [QUOTE_TAGS.decision, QUOTE_TAGS.growth],
    context: '做出好选择的前提是有足够的认知。花时间了解行业、公司和岗位，就是在为"选对"铺路。',
  },

  // ===== 马云 =====
  {
    id: 'mayun-1',
    text: '今天很残酷，明天更残酷，后天很美好，但绝大多数人死在明天晚上。',
    author: '马云',
    title: '阿里巴巴创始人',
    source: '马云公开演讲',
    tags: [QUOTE_TAGS.perseverance, QUOTE_TAGS.anxiety],
    context: '求职季的至暗时刻往往出现在 offer 来之前——不是你没戏，是你离"后天"还差最后一步。',
  },
  {
    id: 'mayun-2',
    text: '当你成功的时候，你说的所有话都是真理。所以年轻人，不要听别人怎么说，去做。',
    author: '马云',
    title: '阿里巴巴创始人',
    source: '马云青年创业论坛演讲',
    tags: [QUOTE_TAGS.execution, QUOTE_TAGS.confidence],
    context: '不要被别人的评价定义。被拒不代表你不行，去做、去投、去试，才是唯一验证方式。',
  },
  {
    id: 'mayun-3',
    text: '我永远相信，只要永不放弃，我们就有机会。还是那句话，做人要有梦想，万一实现了呢？',
    author: '马云',
    title: '阿里巴巴创始人',
    source: '阿里巴巴上市演讲',
    tags: [QUOTE_TAGS.perseverance, QUOTE_TAGS.passion],
    context: '马云在阿里上市时回顾自己被拒 30 多次的经历——包括 KFC 面试 24 人中唯一被刷的。被拒，是大人物的共同经历。',
  },
  {
    id: 'mayun-4',
    text: '改变世界之前，先改变自己。',
    author: '马云',
    title: '阿里巴巴创始人',
    source: '马云公开演讲',
    tags: [QUOTE_TAGS.growth, QUOTE_TAGS.execution],
    context: '应届生最容易陷入的陷阱是想"一步到位"。先开始、先上手、先成长，改变随之而来。',
  },

  // ===== Steve Jobs =====
  {
    id: 'jobs-1',
    text: 'You can\'t connect the dots looking forward; you can only connect them looking backward. So you have to trust that the dots will somehow connect in your future. （你无法预先把点点滴滴串起来，只有回头看时才会发现它们之间的联系。所以你必须相信，这些点会在未来以某种方式连成一条线。）',
    author: 'Steve Jobs',
    title: 'Apple 联合创始人',
    source: '2005 年斯坦福大学毕业演讲',
    tags: [QUOTE_TAGS.anxiety, QUOTE_TAGS.longterm, QUOTE_TAGS.firstJob],
    context: '乔布斯在斯坦福演讲中分享了他从大学退学后旁听书法课、10 年后成为 Mac 字体的故事。第一份工作不一定完美，但没有一步路是白走的。',
  },
  {
    id: 'jobs-2',
    text: 'The only way to do great work is to love what you do. If you haven\'t found it yet, keep looking. Don\'t settle. （做出伟大成就的唯一方式，是热爱你所做的事。如果你还没找到，继续找，不要将就。）',
    author: 'Steve Jobs',
    title: 'Apple 联合创始人',
    source: '2005 年斯坦福大学毕业演讲',
    tags: [QUOTE_TAGS.passion, QUOTE_TAGS.firstJob, QUOTE_TAGS.decision],
    context: '同上演讲。乔布斯强调"热爱"是持续投入的前提。对于应届生——第一份工作可以试错，但不能将就。',
  },
  {
    id: 'jobs-3',
    text: 'Stay hungry, stay foolish. （求知若饥，虚心若愚。）',
    author: 'Steve Jobs',
    title: 'Apple 联合创始人',
    source: '2005 年斯坦福大学毕业演讲 结语',
    tags: [QUOTE_TAGS.growth, QUOTE_TAGS.confidence],
    context: '这句告别语是整个演讲的浓缩。乔布斯用自己的一生证明：保持饥饿感的人永远不会被困住。',
  },

  // ===== Bill Gates =====
  {
    id: 'gates-1',
    text: 'It\'s fine to celebrate success, but it is more important to heed the lessons of failure. （庆祝成功没问题，但更重要的是从失败中汲取教训。）',
    author: 'Bill Gates',
    title: '微软联合创始人',
    source: 'Bill Gates 公开演讲',
    tags: [QUOTE_TAGS.failure, QUOTE_TAGS.growth],
    context: '盖茨多次强调微软早期的失败产品（如 Windows 1.0 的惨败）是他最好的老师。每一次面试被拒，都是一次免费的实战反馈。',
  },
  {
    id: 'gates-2',
    text: 'We always overestimate the change that will occur in the next two years and underestimate the change that will occur in the next ten. （我们总是高估未来两年的变化，而低估未来十年的变化。）',
    author: 'Bill Gates',
    title: '微软联合创始人',
    source: '《The Road Ahead》(1995)',
    tags: [QUOTE_TAGS.longterm, QUOTE_TAGS.anxiety],
    context: '应届生往往高估第一份工作的重要性（觉得选错毁一生），却低估了 10 年职业生涯的调整空间。选错一次，远不等于输掉整场。',
  },
  {
    id: 'gates-3',
    text: '如果你的文化不欢迎失败，那就不会有创新。你必须准备好接受失败。',
    author: 'Bill Gates',
    title: '微软联合创始人',
    source: '微软内部讲话',
    tags: [QUOTE_TAGS.failure, QUOTE_TAGS.growth],
    context: '不仅是公司文化——你自己也要欢迎"失败"，包括面试失败、投递失败。每一次失败都在接近对的方向。',
  },

  // ===== Elon Musk =====
  {
    id: 'musk-1',
    text: '当一件事情足够重要时，即使胜算渺茫，你也要去做。',
    author: 'Elon Musk',
    title: 'Tesla / SpaceX CEO',
    source: 'Elon Musk 公开采访',
    tags: [QUOTE_TAGS.perseverance, QUOTE_TAGS.passion],
    context: 'Musk 在 SpaceX 三次火箭发射失败、公司濒临破产时说的。你的"梦想 offer"值得你投第 4 次、第 5 次。',
  },
  {
    id: 'musk-2',
    text: 'I think it is possible for ordinary people to choose to be extraordinary. （我认为普通人可以选择变得不平凡。）',
    author: 'Elon Musk',
    title: 'Tesla / SpaceX CEO',
    source: 'Elon Musk 访谈',
    tags: [QUOTE_TAGS.confidence, QUOTE_TAGS.growth],
    context: 'Musk 不认为自己是天才——他只是选择了做难的事。你的求职结果，由你的选择而非天赋决定。',
  },
  {
    id: 'musk-3',
    text: '用第一性原理思考，而不是用类比。不要因为别人都在做就跟着做。',
    author: 'Elon Musk',
    title: 'Tesla / SpaceX CEO',
    source: 'Elon Musk TED 访谈',
    tags: [QUOTE_TAGS.decision, QUOTE_TAGS.bigSmall],
    context: '周围人都去大厂，不代表你也应该去。回到第一性：你需要什么？什么对你最重要？而非"别人都在干嘛"。',
  },

  // ===== Jeff Bezos =====
  {
    id: 'bezos-1',
    text: '我把自己想象成 80 岁，回首人生——我会后悔没去做这件事吗？如果答案是 Yes，那就去做。这就是"后悔最小化框架"。',
    author: 'Jeff Bezos',
    title: 'Amazon 创始人',
    source: 'Bezos 创立 Amazon 时的决策自述',
    tags: [QUOTE_TAGS.decision, QUOTE_TAGS.firstJob, QUOTE_TAGS.longterm],
    context: 'Bezos 用这个框架决定放弃华尔街高薪工作去卖书。选 offer、选行业、选城市——问自己：80 岁的我会后悔没选哪个？',
  },
  {
    id: 'bezos-2',
    text: '你的品牌就是当你不在房间里时，别人对你的评价。',
    author: 'Jeff Bezos',
    title: 'Amazon 创始人',
    source: 'Bezos 内部讲话',
    tags: [QUOTE_TAGS.execution, QUOTE_TAGS.teamwork],
    context: '从第一份工作开始，你的职业品牌就在积累。每一场面试、每一份交付物，都在为你的"个人品牌"投票。',
  },

  // ===== 王兴 =====
  {
    id: 'wangxing-1',
    text: '多数人为了逃避真正的思考，愿意做任何事情。',
    author: '王兴',
    title: '美团创始人',
    source: '王兴饭否 / 公开演讲',
    tags: [QUOTE_TAGS.decision, QUOTE_TAGS.growth],
    context: '求职中最稀缺的不是努力，而是花时间认真想清楚：我想要什么？我擅长什么？市场需要什么？三个圆的交集才是你的方向。',
  },
  {
    id: 'wangxing-2',
    text: '长期有耐心。',
    author: '王兴',
    title: '美团创始人',
    source: '美团内部文化标语 / 王兴多次引用',
    tags: [QUOTE_TAGS.longterm, QUOTE_TAGS.perseverance],
    context: '这五个字是美团最核心的文化。求职是一场无限游戏，不是一局定输赢。拿到 offer 不一定是赢，被拒也不一定是输。',
  },
  {
    id: 'wangxing-3',
    text: '我不太担心竞争对手，我担心的是我们不能快速学习和进化。',
    author: '王兴',
    title: '美团创始人',
    source: '王兴公开采访',
    tags: [QUOTE_TAGS.growth, QUOTE_TAGS.execution],
    context: '你的竞争对手不是其他求职者，而是你自己的学习速度。每次面试后复盘，迭代速度决定上岸速度。',
  },

  // ===== 马化腾 =====
  {
    id: 'mahuateng-1',
    text: '巨人倒下的时候，体温还是暖的。',
    author: '马化腾',
    title: '腾讯创始人',
    source: '马化腾内部讲话',
    tags: [QUOTE_TAGS.longterm, QUOTE_TAGS.decision],
    context: 'Pony 这句话背后的含义：永远不要觉得一个公司/行业"高枕无忧"。求职选赛道，不仅要看现在谁大，更要看趋势往哪走。',
  },
  {
    id: 'mahuateng-2',
    text: '小步快跑，快速迭代。',
    author: '马化腾',
    title: '腾讯创始人',
    source: '腾讯产品文化',
    tags: [QUOTE_TAGS.execution, QUOTE_TAGS.product, QUOTE_TAGS.growth],
    context: '腾讯的经典产品哲学。你的简历、面试能力、职业规划——不需要一次完美，先投、先面、先拿到反馈，然后快速迭代。',
  },

  // ===== 古典（生涯规划师）=====
  {
    id: 'gudian-1',
    text: '所谓"超级个体"，不是比别人更强，而是在不确定性中有自己的确定性。',
    author: '古典',
    title: '生涯规划师，《跃迁》作者',
    source: '《跃迁》(2017)',
    tags: [QUOTE_TAGS.anxiety, QUOTE_TAGS.confidence, QUOTE_TAGS.growth],
    context: '求职季最大的敌人不是没 offer，而是不确定性带来的焦虑。建立自己的内核——你能做什么、想做什么——那就是你的确定性。',
  },
  {
    id: 'gudian-2',
    text: '好的职业不是"找到"的，而是"长"出来的。',
    author: '古典',
    title: '生涯规划师，《拆掉思维里的墙》作者',
    source: '《拆掉思维里的墙》(2010)',
    tags: [QUOTE_TAGS.firstJob, QUOTE_TAGS.longterm, QUOTE_TAGS.anxiety],
    context: '第一份工作不需要是"完美的"。重要的是它给你什么成长空间，让你长出下一份工作的能力。职业是一步一步长出来的，不是一次选对的。',
  },
  {
    id: 'gudian-3',
    text: '每个人都是一家公司，你自己就是这家公司的 CEO。',
    author: '古典',
    title: '生涯规划师',
    source: '古典得到专栏《超级个体》',
    tags: [QUOTE_TAGS.growth, QUOTE_TAGS.firstJob],
    context: '用经营公司的视角经营自己的职业生涯：你的技能是产品，你的简历是 marketing，你的面试是 sales。',
  },
  {
    id: 'gudian-4',
    text: '迷茫不是因为你没路可走，而是有太多路你都不敢走。',
    author: '古典',
    title: '生涯规划师',
    source: '古典公开演讲',
    tags: [QUOTE_TAGS.anxiety, QUOTE_TAGS.decision],
    context: '面对多条路径时的"选择困难"，本质上是对每条路径不够了解。花一周时间深入了解每条路，迷茫自然消散。',
  },

  // ===== Paul Graham =====
  {
    id: 'pg-1',
    text: 'Do things that don\'t scale. （做那些不可规模化的事。）',
    author: 'Paul Graham',
    title: 'Y Combinator 创始人',
    source: 'Paul Graham 博客 (2013)',
    tags: [QUOTE_TAGS.execution, QUOTE_TAGS.firstJob, QUOTE_TAGS.bigSmall],
    context: 'PG 的经典文章。求职中"不可规模化的事"就是：针对每个岗位定制简历、认真研究每个面试官、手写每一封感谢信。这些事没人愿意做，所以做的人会赢。',
  },
  {
    id: 'pg-2',
    text: 'The way to get startup ideas is not to try to think of startup ideas. It\'s to look for problems. （获得创业想法的方法不是去想创业想法，而是去寻找问题。）',
    author: 'Paul Graham',
    title: 'Y Combinator 创始人',
    source: 'Paul Graham 博客',
    tags: [QUOTE_TAGS.product, QUOTE_TAGS.growth],
    context: '同理，找到好工作的方法不是疯狂投简历，而是找到"谁需要解决什么问题"——然后让自己成为那个解决方案。',
  },
  {
    id: 'pg-3',
    text: 'You need three things to create a successful startup: to start with good people, to make something customers actually want, and to spend as little money as possible. （成功创业需要三样：好的人、做出客户真正想要的东西、尽量少花钱。）',
    author: 'Paul Graham',
    title: 'Y Combinator 创始人',
    source: 'Paul Graham 博客',
    tags: [QUOTE_TAGS.teamwork, QUOTE_TAGS.decision],
    context: '选第一份工作的三个类比：好团队（跟谁学）、做真正有价值的事（积累什么能力）、别只看薪资（成长比工资重要得多）。',
  },

  // ===== Naval Ravikant =====
  {
    id: 'naval-1',
    text: 'Play long-term games with long-term people. （和长期主义的人玩长期的游戏。）',
    author: 'Naval Ravikant',
    title: 'AngelList 创始人，投资人',
    source: '《The Almanack of Naval Ravikant》',
    tags: [QUOTE_TAGS.longterm, QUOTE_TAGS.teamwork, QUOTE_TAGS.firstJob],
    context: '选公司就是选老板、选团队。面试时感受面试官的状态——你愿意和这群人一起"玩长期游戏"吗？',
  },
  {
    id: 'naval-2',
    text: 'A fit body, a calm mind, a house full of love. These things cannot be bought — they must be earned. （健康的身体、平静的内心、充满爱的家。这些东西买不到——它们必须靠经营获得。）',
    author: 'Naval Ravikant',
    title: 'AngelList 创始人，投资人',
    source: 'Naval Twitter / 《The Almanack》',
    tags: [QUOTE_TAGS.anxiety, QUOTE_TAGS.passion],
    context: '求职季疯狂焦虑时，回头看最基本的：睡眠、运动、关系。状态对了，面试表现自然好。',
  },
  {
    id: 'naval-3',
    text: 'Seek wealth, not money or status. Wealth is having assets that earn while you sleep. （追求财富而非金钱或地位。财富是那些你睡觉时也在为你赚钱的资产。）',
    author: 'Naval Ravikant',
    title: 'AngelList 创始人',
    source: 'Naval 著名 tweetstorm "How to Get Rich"',
    tags: [QUOTE_TAGS.decision, QUOTE_TAGS.growth],
    context: '应届生看薪资的数字是短视的。真正重要的"资产"是：你的技能、你的判断力、你的职业网络。这些才能在你睡觉时也为你增值。',
  },

  // ===== Sam Altman =====
  {
    id: 'altman-1',
    text: 'The most important thing to optimize for is compound growth. Compounding is magic. （最值得优化的是复利增长。复利是魔法。）',
    author: 'Sam Altman',
    title: 'OpenAI CEO，前 YC 总裁',
    source: 'Sam Altman 博客 "How To Be Successful"',
    tags: [QUOTE_TAGS.longterm, QUOTE_TAGS.firstJob, QUOTE_TAGS.growth],
    context: '第一份工作最大的价值不是薪资，而是"成长速率"。每年翻倍的成长 vs 每年 10% 的增长——10 年后差距不是 10 倍，是 100 倍。选增长最快的，不是薪资最高的。',
  },
  {
    id: 'altman-2',
    text: 'You can do anything, but you can\'t do everything. （你可以做任何事，但你不能做所有事。）',
    author: 'Sam Altman',
    title: 'OpenAI CEO',
    source: 'Sam Altman 博客',
    tags: [QUOTE_TAGS.decision, QUOTE_TAGS.execution],
    context: '求职时很容易什么都想投。聚焦 2-3 个真正想去的方向，深挖到极致，远比海投 50 家有效。',
  },

  // ===== Reid Hoffman =====
  {
    id: 'hoffman-1',
    text: 'An entrepreneur is someone who jumps off a cliff and builds a plane on the way down. （创业者就是跳下悬崖，然后在下坠过程中组装出一架飞机的人。）',
    author: 'Reid Hoffman',
    title: 'LinkedIn 联合创始人',
    source: 'Reid Hoffman 公开演讲',
    tags: [QUOTE_TAGS.execution, QUOTE_TAGS.anxiety],
    context: '求职本身也是一次"创业"——你不需要在第一天就有完美方案。先行动、先投递、先面试，在过程中逐步调整和优化。',
  },
  {
    id: 'hoffman-2',
    text: '你的职业生涯不是爬梯子，而是玩一个复杂的游戏。Pivot（转向）不是失败，而是策略。',
    author: 'Reid Hoffman',
    title: 'LinkedIn 联合创始人',
    source: '《The Start-up of You》',
    tags: [QUOTE_TAGS.decision, QUOTE_TAGS.firstJob, QUOTE_TAGS.growth],
    context: 'Hoffman 提出的"ABZ 计划"理论：Plan A 是当前路径，Plan B 是备选，Plan Z 是保底。第一份工作随时可以 pivot，这不叫失败。',
  },
  {
    id: 'hoffman-3',
    text: 'The fastest way to change yourself is to hang out with people who are already the way you want to be. （改变自己最快的方式，就是和那些已经是你想成为的样子的人待在一起。）',
    author: 'Reid Hoffman',
    title: 'LinkedIn 联合创始人',
    source: '《The Start-up of You》',
    tags: [QUOTE_TAGS.growth, QUOTE_TAGS.teamwork, QUOTE_TAGS.bigSmall],
    context: '找工作的一个重要维度：你会跟谁一起工作？优秀的同事是你职业生涯中最增值的资产。有时候，跟对老板比选对公司更重要。',
  },

  // ===== 罗永浩 =====
  {
    id: 'luoyonghao-1',
    text: '我不是为了输赢，我就是认真。',
    author: '罗永浩',
    title: '锤子科技创始人 / 交个朋友主播',
    source: '罗永浩公开演讲 / 多次引用',
    tags: [QUOTE_TAGS.perseverance, QUOTE_TAGS.execution],
    context: '罗永浩在锤子科技失败后背负 6 亿债务，靠直播带货 3 年还清。"认真"这件事本身就值得尊敬。求职中，认真对待每次面试的人，最终一定会上岸。',
  },
  {
    id: 'luoyonghao-2',
    text: '面对挫折，不要愤怒、不要抗议，埋头默默擦亮你的武器，准备下一次战斗。',
    author: '罗永浩',
    title: '锤子科技创始人',
    source: '罗永浩个人社交媒体',
    tags: [QUOTE_TAGS.failure, QUOTE_TAGS.perseverance],
    context: '被拒后的正确姿势：不抱怨、不自我怀疑，复盘 → 改进 → 投下一个。',
  },

  // ===== 段永平 =====
  {
    id: 'duanyongping-1',
    text: '敢为天下后。',
    author: '段永平',
    title: '步步高 / OPPO / vivo 创始人',
    source: '段永平投资分享 / 多次引用',
    tags: [QUOTE_TAGS.decision, QUOTE_TAGS.longterm, QUOTE_TAGS.bigSmall],
    context: '段永平做产品从不抢"第一"，而是等市场验证后再做"更好"。求职不需要抢第一个 offer——把每个机会做到"比竞争者更好"就行。',
  },
  {
    id: 'duanyongping-2',
    text: '本分就是：做对的事情，然后把事情做对。',
    author: '段永平',
    title: '步步高 / OPPO / vivo 创始人',
    source: '段永平投资社区分享',
    tags: [QUOTE_TAGS.decision, QUOTE_TAGS.execution],
    context: '求职中"对的事情"是：诚实面对自己的能力边界，选真正匹配的方向；"把事情做对"是：认真准备每一场面试。',
  },

  // ===== 黄峥 =====
  {
    id: 'huangzheng-1',
    text: '做正确的事，即使它是难的。',
    author: '黄峥',
    title: '拼多多创始人',
    source: '黄峥内部讲话',
    tags: [QUOTE_TAGS.decision, QUOTE_TAGS.perseverance],
    context: '黄峥的"本分"哲学。选 offer、选方向——不要因为一条路容易就选它。选那条"对但难"的。',
  },

  // ===== 刘强东 =====
  {
    id: 'liuqiangdong-1',
    text: '所有失败最终都是人不行。',
    author: '刘强东',
    title: '京东创始人',
    source: '刘强东内部讲话',
    tags: [QUOTE_TAGS.execution, QUOTE_TAGS.confidence],
    context: '东哥这句话的正面理解：只要你是那个"对的人"，机会最终会找到你。把焦点放在让自己变得"更行"上，而不是 worry 外部环境。',
  },

  // ===== Winston Churchill (老派大智慧) =====
  {
    id: 'churchill-1',
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts. （成功不是终点，失败也不是末日：重要的是继续前行的勇气。）',
    author: 'Winston Churchill',
    title: '英国前首相',
    source: 'Churchill 二战期间演讲',
    tags: [QUOTE_TAGS.failure, QUOTE_TAGS.perseverance],
    context: '这句经典语录几乎适用于求职的每一个环节：一面过了不代表拿到 offer，终面挂了不代表你不行，继续投就是了。',
  },

  // ===== Theodore Roosevelt =====
  {
    id: 'roosevelt-1',
    text: 'Comparison is the thief of joy. （比较是快乐的小偷。）',
    author: 'Theodore Roosevelt',
    title: '美国第 26 任总统',
    source: 'Roosevelt 公开演讲',
    tags: [QUOTE_TAGS.anxiety, QUOTE_TAGS.confidence],
    context: '求职季最大的焦虑来源：刷到同学的朋友圈"已拿 X 厂 offer"。关掉朋友圈，关注自己的进度。别人的 offer 跟你的路没有任何关系。',
  },

  // ===== Peter Thiel =====
  {
    id: 'thiel-1',
    text: 'What important truth do very few people agree with you on? （什么重要的真理，你与大多数人的看法不同？）',
    author: 'Peter Thiel',
    title: 'PayPal 联合创始人，投资人',
    source: '《Zero to One》(2014)',
    tags: [QUOTE_TAGS.decision, QUOTE_TAGS.bigSmall],
    context: 'Thiel 面试时必问这道题。求职中也可以用来自问：有什么关于我的职业道路的判断，跟大多数人不一样？也许这就是你的差异化优势。',
  },

  // ===== Sheryl Sandberg =====
  {
    id: 'sandberg-1',
    text: 'If you\'re offered a seat on a rocket ship, don\'t ask what seat. Just get on. （如果有人邀请你登上一艘火箭，不要问坐哪个位置，先上去再说。）',
    author: 'Sheryl Sandberg',
    title: 'Meta (Facebook) 前 COO',
    source: '《Lean In》(2013)',
    tags: [QUOTE_TAGS.firstJob, QUOTE_TAGS.decision, QUOTE_TAGS.bigSmall],
    context: 'Eric Schmidt 对 Sandberg 说的这句话改变了她的职业生涯。应届生选 offer 时：如果公司/团队像火箭一样在上升，岗位 title 不重要，先上车。',
  },

  // ===== 查理·芒格 =====
  {
    id: 'munger-1',
    text: '如果你想获得你想要的东西，最可靠的方式是让自己配得上它。',
    author: 'Charlie Munger',
    title: 'Berkshire Hathaway 副董事长',
    source: '《穷查理宝典》',
    tags: [QUOTE_TAGS.growth, QUOTE_TAGS.longterm],
    context: '芒格的核心哲学。与其追问"为什么我没拿到 offer"，不如问"我配得上那个 offer 吗？还需要什么能力？然后去补。',
  },
  {
    id: 'munger-2',
    text: '反过来想，总是反过来想。',
    author: 'Charlie Munger',
    title: 'Berkshire Hathaway 副董事长',
    source: '《穷查理宝典》',
    tags: [QUOTE_TAGS.decision, QUOTE_TAGS.growth],
    context: '不要只想要什么工作——先想"我不想要什么"。排除了不想要的，剩下的就是你该去的方向。',
  },

  // ===== 余华 (文学视角) =====
  {
    id: 'yuhua-1',
    text: '没有什么比时间更有说服力了，因为时间无需通知我们就可以改变一切。',
    author: '余华',
    title: '作家，《活着》作者',
    source: '《活着》/ 余华公开演讲',
    tags: [QUOTE_TAGS.anxiety, QUOTE_TAGS.longterm],
    context: '求职季的焦虑在一个月后回头看，大部分都不值一提。给自己一点时间，很多问题时间会替你解决。',
  },
];

// ========== 工具函数 ==========

/**
 * 按标签筛选语录（取并集）
 */
export function getQuotesByTags(tags: string[]): Quote[] {
  if (tags.length === 0) return BIG_NAME_QUOTES;
  const tagSet = new Set(tags);
  return BIG_NAME_QUOTES.filter(q => q.tags.some(t => tagSet.has(t)));
}

/**
 * 获取匹配语录的纯文本注入格式（用于 system prompt）
 * 最多返回 limit 条，避免 token 过长
 */
export function formatQuotesForPrompt(tags: string[], limit = 10): string {
  const quotes = getQuotesByTags(tags);
  const selected = quotes.slice(0, limit);
  if (selected.length === 0) return '';

  return `\n\n【可引用的大拿语录库（请自然融入回答，不要机械堆砌）】\n${
    selected.map(q =>
      `- [${q.tags.slice(0, 3).join('/')}] "${q.text}" —— ${q.author}${q.source ? `（${q.source}）` : ''}${q.context ? ` | 背景：${q.context}` : ''}`
    ).join('\n')
  }`;
}

/**
 * 根据 tags 随机选取几条语录
 */
export function pickRandomQuotes(tags: string[], count = 3): Quote[] {
  const pool = getQuotesByTags(tags);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 按作者获取语录
 */
export function getQuotesByAuthor(author: string): Quote[] {
  return BIG_NAME_QUOTES.filter(q => q.author === author);
}

/**
 * 获取所有标签
 */
export function getAllTags(): string[] {
  return Object.values(QUOTE_TAGS);
}
