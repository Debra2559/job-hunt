import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, MapPin, DollarSign, Target, Check, AlertCircle,
  ExternalLink, Loader2, Send, ShieldCheck, Rocket, Heart,
  Building2, RefreshCw, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { streamCh2 } from '@/lib/ch2Stream';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { useGameProgress } from '@/hooks/useGameProgress';
import { SELECTED_JOBS_LS_KEY } from './CareerRecommend';

// ========== Types ==========
type PickedJob = { title: string; category?: string; skills?: string[] };

type JobCard = {
  id: string;
  title: string;
  company: string;
  city: string;
  salary: string;
  matchReason: string;
  strengths: string[];
  gap: string;
  platform: string;
  matchScore: number;
};

type UserProfile = {
  targetRole: string;
  jdKeywords: string[];
  resumeSummary: string;
  companyPreference: string | null;
  preferredCity: string | null;
  salaryExpectation: string | null;
};

// ========== LocalStorage ==========
const FEED_CARDS_LS = 'career:feed:cards:v2';
const FEED_PROFILE_LS = 'career:feed:profile:v2';
const FEED_COUNT_LS = 'career:feed:daily_count:v2';
const FEED_FAVORITES_LS = 'career:feed:favorites:v1';
const DAILY_LIMIT = 20;
const CARDS_PER_PAGE = 20; // Show all 20 at once

// ========== Helpers ==========
function readSelectedJobs(): PickedJob[] {
  try {
    const raw = localStorage.getItem(SELECTED_JOBS_LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function getResumeSummary(): string {
  try {
    const keys = Object.keys(localStorage).filter(k => k.includes('resume'));
    return keys.length > 0 ? '简历已生成，包含项目经历与技能详情' : '';
  } catch { return ''; }
}

function getJDKeywords(): string[] {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('career:jd:insight:'));
  const allKeywords: string[] = [];
  keys.forEach(k => {
    try {
      const data = JSON.parse(localStorage.getItem(k) || '{}');
      if (data.keywords) allKeywords.push(...data.keywords);
      if (data.skills) allKeywords.push(...data.skills);
    } catch {}
  });
  return [...new Set(allKeywords)].slice(0, 15);
}

// Load profile from localStorage
function loadProfile(): UserProfile {
  try {
    const cached = localStorage.getItem(FEED_PROFILE_LS);
    if (cached) {
      const p = JSON.parse(cached);
      if (p.preferredCity || p.salaryExpectation) return p;
    }
  } catch {}
  const jobs = readSelectedJobs();
  return {
    targetRole: jobs[0]?.title || '',
    jdKeywords: getJDKeywords(),
    resumeSummary: getResumeSummary(),
    companyPreference: null,
    preferredCity: null,
    salaryExpectation: null,
  };
}

// Save profile to localStorage
function saveProfile(p: UserProfile) {
  try { localStorage.setItem(FEED_PROFILE_LS, JSON.stringify(p)); } catch {}
}

// Load cards from localStorage
function loadCards(): JobCard[] {
  try {
    const cached = localStorage.getItem(FEED_CARDS_LS);
    return cached ? JSON.parse(cached) : [];
  } catch { return []; }
}

function saveCards(cards: JobCard[]) {
  try { localStorage.setItem(FEED_CARDS_LS, JSON.stringify(cards)); } catch {}
}

// Platform colors
const PLATFORM_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  'Boss直聘': { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: '💼' },
  '拉勾': { bg: 'bg-green-50', text: 'text-green-700', icon: '🌱' },
  '猎聘': { bg: 'bg-amber-50', text: 'text-amber-700', icon: '🎯' },
  'LinkedIn': { bg: 'bg-blue-50', text: 'text-blue-700', icon: '🔗' },
  '智联招聘': { bg: 'bg-orange-50', text: 'text-orange-700', icon: '🔶' },
  '应届生求职网': { bg: 'bg-purple-50', text: 'text-purple-700', icon: '🎓' },
};

// ========== Mock card generator (20 fully-detailed cards) ==========
function buildMockCards(p: UserProfile, excludeTitles: string[] = []): JobCard[] {
  const city = p.preferredCity || '北京';
  const role = p.targetRole || '产品经理';

  const allCards: JobCard[] = [
    {
      id: '', title: `${role}实习生`, company: '字节跳动', city, salary: '15-25K·15薪',
      matchReason: `${role}方向与你的技能高度匹配，字节跳动该业务线2026校招HC充足，往年实习转正率超70%`, strengths: [`${role}相关项目实战经验`, '熟悉主流工具链和工作流'], gap: '需准备算法或业务笔试，建议提前刷近两年真题', platform: 'Boss直聘', matchScore: 92,
    },
    {
      id: '', title: `校招-${role}`, company: '美团', city, salary: '14-24K·15薪',
      matchReason: '美团到店/到家业务线急招应届生，该岗位直接参与核心业务迭代，成长曲线陡峭', strengths: ['过往实习经历与岗位高度对口', '对O2O行业有深入理解'], gap: '系统设计基础较弱，建议补充高并发场景知识', platform: '拉勾', matchScore: 88,
    },
    {
      id: '', title: `${role}培训生`, company: '腾讯', city, salary: '13-22K·14薪',
      matchReason: '腾讯该方向培训生项目以轮岗+导师制著称，适合想在多个业务线探索的应届生', strengths: ['综合素质突出，沟通表达清晰', '有跨团队协作经验'], gap: '竞争激烈，报录比约1:50，需要突出的项目展示', platform: 'Boss直聘', matchScore: 85,
    },
    {
      id: '', title: `${role}助理`, company: '小红书', city, salary: '12-20K·14薪',
      matchReason: '小红书社区/电商双引擎驱动，该岗位直接汇报给业务负责人，新人成长空间大', strengths: ['对内容社区有敏锐洞察', '有个人作品/项目展示'], gap: '需深入了解小红书社区生态和内容策略', platform: '猎聘', matchScore: 83,
    },
    {
      id: '', title: `应届${role}岗`, company: '阿里巴巴', city, salary: '14-25K·16薪',
      matchReason: '阿里2026届校招该方向HC较去年增加15%，技术栈与你所学高度匹配', strengths: ['技术基础扎实，有完整项目经验', '沟通表达和文档能力强'], gap: '阿里重视价值观匹配，建议提前了解「六脉神剑」', platform: '智联招聘', matchScore: 80,
    },
    {
      id: '', title: `${role}（国际化）`, company: 'Shopee', city: '深圳', salary: '18-30K·13薪',
      matchReason: 'Shopee跨境业务持续扩张，对英语好的应届生有明确培养路径和海外轮岗机会', strengths: ['英语读写流利', '适应跨文化和远程协作'], gap: '需要全英文面试准备，建议做2-3次模拟面试', platform: 'LinkedIn', matchScore: 78,
    },
    {
      id: '', title: `${role}管培生`, company: '京东', city, salary: '13-20K·15薪',
      matchReason: '京东管培生项目是业内公认的黄埔军校，前3个月集中培训后双向选择定岗', strengths: ['领导力潜质突出', '逻辑清晰，结构化思维强'], gap: '需通过群面+多轮单面，建议提前练习case分析', platform: 'Boss直聘', matchScore: 76,
    },
    {
      id: '', title: `${role}（2026校招）`, company: '拼多多', city: '上海', salary: '16-28K·15薪',
      matchReason: '拼多多Temu业务增长迅猛，该岗位深度参与从0到1的项目，表现优异可快速晋升', strengths: ['抗压能力强，执行力突出', '结果导向，擅长目标拆解'], gap: '工作节奏快、强度大，需做好心理预期管理', platform: '拉勾', matchScore: 74,
    },
    {
      id: '', title: `${role}（AIGC方向）`, company: '百度', city, salary: '16-26K·15薪',
      matchReason: '百度文心一言生态扩张，需要大量懂AI工具链的应届生参与产品落地和商业化', strengths: ['对AI产品有深度使用和理解', '有技术背景能快速上手工具链'], gap: 'AIGC领域变化快，需持续跟进最新模型和应用', platform: 'Boss直聘', matchScore: 72,
    },
    {
      id: '', title: `${role}专员`, company: '网易', city: '杭州', salary: '13-22K·14薪',
      matchReason: '网易该业务线稳定盈利，工作生活平衡好，适合想在稳健环境中成长的应届生', strengths: ['审美和品味在线', '对产品细节有追求'], gap: '业务创新节奏偏慢，不适合追求极速成长的同学', platform: '猎聘', matchScore: 71,
    },
    {
      id: '', title: `校招${role}`, company: '快手', city, salary: '14-24K·15薪',
      matchReason: '快手商业化团队扩招，该岗位直接参与亿级用户产品的变现策略设计与落地', strengths: ['数据敏感度高', '对短视频/直播生态熟悉'], gap: '商业化经验不足，需快速学习广告系统与竞价逻辑', platform: 'Boss直聘', matchScore: 69,
    },
    {
      id: '', title: `${role}暑期实习生`, company: '微软', city: '苏州', salary: '25-35K·12薪',
      matchReason: '微软中国该团队技术氛围好，实习转正率高，适合想去外企发展的候选人', strengths: ['英语能力突出', '算法/数据结构基础扎实'], gap: '面试难度较高，需准备系统设计和白板编程', platform: 'LinkedIn', matchScore: 68,
    },
    {
      id: '', title: `初级${role}`, company: '滴滴', city, salary: '12-20K·14薪',
      matchReason: '滴滴出行核心交易平台团队招人，该岗位接触千万级QPS系统，技术挑战大', strengths: ['对出行/交通行业有兴趣', '工程化思维好，代码质量高'], gap: '需补充高并发系统设计知识，建议学习分布式基础', platform: '拉勾', matchScore: 67,
    },
    {
      id: '', title: `${role}（增长方向）`, company: 'B站', city: '上海', salary: '12-20K·14薪',
      matchReason: 'B站用户增长团队招应届生，参与Z世代最活跃社区的增长策略制定与执行', strengths: ['对B站文化和用户画像熟悉', '创意能力和数据分析能力并重'], gap: '增长方法论需系统学习，建议先读《增长黑客》和《海盗指标》', platform: 'Boss直聘', matchScore: 66,
    },
    {
      id: '', title: `${role}培训生（金融科技）`, company: '蚂蚁集团', city: '杭州', salary: '15-26K·16薪',
      matchReason: '蚂蚁数字金融线招应届培训生，涉及支付、信贷、理财等核心场景的产品设计', strengths: ['金融+互联网复合背景', '逻辑严谨，对合规有基本认知'], gap: '金融业务知识需快速补齐，建议提前了解支付清结算流程', platform: '智联招聘', matchScore: 65,
    },
    {
      id: '', title: `${role}`, company: '米哈游', city: '上海', salary: '14-25K·14薪',
      matchReason: '米哈游崩坏/原神团队招人，适合对游戏和二次元文化有热情的候选人', strengths: ['对ACG文化有深刻理解', '有游戏相关项目或分析作品'], gap: '游戏行业竞争激烈，需展示对游戏品类的深度思考', platform: 'Boss直聘', matchScore: 64,
    },
    {
      id: '', title: `${role}（电商方向）`, company: '抖音电商', city: '上海', salary: '15-26K·15薪',
      matchReason: '抖音电商是字节增长最快的业务线，该岗位参与从选品到履约的全链路产品设计', strengths: ['对电商和直播带货有深入观察', '数据分析能力在线，能用数据驱动决策'], gap: '电商知识体系需建立，建议系统学习供应链和物流基础', platform: 'Boss直聘', matchScore: 63,
    },
    {
      id: '', title: `${role}助理`, company: '得物', city: '上海', salary: '12-19K·14薪',
      matchReason: '得物潮流电商增速快，该岗位贴近年轻消费人群，工作中充满新鲜感和创造力', strengths: ['对潮牌/球鞋/潮流文化有了解', '年轻化审美，与目标用户同频'], gap: '公司规模偏小，流程和体系不如大厂完善，需主动驱动', platform: '猎聘', matchScore: 62,
    },
    {
      id: '', title: `校招-${role}`, company: '华为', city: '深圳', salary: '15-25K·14薪',
      matchReason: '华为消费者BG招应届生，技术栈硬核，适合想在技术方向长期深耕的候选人', strengths: ['学习能力强，能快速上手新技术', '对技术有持续热情，有开源贡献'], gap: '面试流程长（机考+技术面+综面），建议提前1个月系统准备', platform: 'Boss直聘', matchScore: 60,
    },
    {
      id: '', title: `${role}（SaaS方向）`, company: '飞书', city, salary: '15-25K·15薪',
      matchReason: '飞书是字节ToB核心产品，适合对SaaS和企业服务有兴趣的应届生，赛道前景好', strengths: ['具备ToB产品思维', '有良好的文档撰写和方案演示能力'], gap: 'SaaS行业需要长期积累和耐心，短期不会有爆发式成长', platform: 'Boss直聘', matchScore: 58,
    },
  ];

  return allCards
    .filter(c => !excludeTitles.includes(c.title))
    .slice(0, 20)
    .map((c, i) => ({ ...c, id: `mock-${Date.now()}-${i}` }));
}

// ========== Determine initial step ==========
function getInitialStep(profile: UserProfile, cards: JobCard[]): 'city' | 'salary' | 'feed' {
  if (cards.length > 0) return 'feed';
  if (profile.preferredCity && profile.salaryExpectation) return 'feed';
  if (profile.preferredCity) return 'salary';
  return 'city';
}

// ========== Main Component ==========
export default function CareerFeed() {
  const { markDone, completed } = useQuestProgress();
  const { onStageCompleted } = useGameProgress();

  // ---- State ----
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [cards, setCards] = useState<JobCard[]>(loadCards);
  const [dailyCount, setDailyCount] = useState<number>(() => {
    try {
      const today = new Date().toDateString();
      const data = JSON.parse(localStorage.getItem(FEED_COUNT_LS) || '{}');
      return data.date === today ? data.count : 0;
    } catch { return 0; }
  });
  const [step, setStep] = useState<'city' | 'salary' | 'loading' | 'feed'>(() =>
    getInitialStep(profile, cards)
  );
  const [chatInput, setChatInput] = useState('');
  const stepVal = getInitialStep(profile, cards);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>(() => {
    if (stepVal === 'city') {
      return [{
        role: 'assistant',
        content: `嗨！我看到你想找 **${profile.targetRole || '工作'}** 方向的机会。先告诉我——你打算在哪个城市找工作呀？可以说具体城市，也可以说「长三角」「不限城市」都行～`,
      }];
    }
    if (stepVal === 'salary') {
      return [{
        role: 'assistant',
        content: `好的，${profile.preferredCity}！那大概期望月薪在什么范围？（比如 15-20K，或者「市场价就行」也没问题）`,
      }];
    }
    return [];
  });
  const [loadingCards, setLoadingCards] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isAtLimit, setIsAtLimit] = useState(dailyCount >= DAILY_LIMIT);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(FEED_FAVORITES_LS);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const generatingRef = useRef(false); // prevent double-generation

  // ---- Persist side effects ----
  useEffect(() => { saveProfile(profile); }, [profile]);
  useEffect(() => { saveCards(cards); }, [cards]);
  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem(FEED_COUNT_LS, JSON.stringify({ date: today, count: dailyCount }));
  }, [dailyCount]);
  useEffect(() => {
    localStorage.setItem(FEED_FAVORITES_LS, JSON.stringify([...favorites]));
  }, [favorites]);

  const toggleFavorite = (cardId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };
  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);
  useEffect(() => {
    if (step === 'feed' && !completed.includes('feed')) {
      markDone('feed');
      onStageCompleted('feed');
    }
  }, [step, completed, markDone, onStageCompleted]);

  // ---- Auto-generate on mount if profile complete but no cards ----
  useEffect(() => {
    if (stepVal === 'feed' && cards.length === 0 && !generatingRef.current) {
      doGenerateCards();
    }
    // If step is 'feed' but cards is empty (shouldn't happen unless API failed before),
    // fall back to 'city' after a brief moment so user isn't stuck
    if (stepVal === 'feed' && cards.length === 0) {
      const timer = setTimeout(() => {
        if (!generatingRef.current && cards.length === 0) {
          setStep('city');
          setChatMessages([{
            role: 'assistant',
            content: `嗨！我看到你想找 **${profile.targetRole || '工作'}** 方向的机会。先告诉我——你打算在哪个城市找工作呀？`,
          }]);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========== Generate cards ==========
  const doGenerateCards = async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setLoadingCards(true);
    setStep('loading');

    // Read the absolute latest profile from localStorage
    const p = loadProfile();

    const prompt = `你是一个专业的职位推荐引擎。根据以下用户画像，生成 ${CARDS_PER_PAGE} 个真实的招聘职位推荐。

用户画像：
- 目标岗位：${p.targetRole || '互联网校招'}
- 技能关键词：${p.jdKeywords.join('、') || '未指定'}
- 简历概要：${p.resumeSummary || '应届生'}
- 公司偏好：${p.companyPreference || '不限'}
- 期望城市：${p.preferredCity || '不限'}
- 期望薪资：${p.salaryExpectation || '市场价'}

要求：
1. 职位必须来自中国互联网招聘市场真实存在的公司
2. 薪资和城市必须合理
3. 每个职位包含匹配理由、优势对照、差距提示
4. 按匹配度从高到低排列（matchScore 80-95 为高分）

请严格输出 JSON 数组（不要markdown代码块，只输出纯JSON）：
[
  {
    "title": "职位名称",
    "company": "公司名称",
    "city": "城市",
    "salary": "薪资范围",
    "matchReason": "1-2句为什么适合该用户",
    "strengths": ["用户优势1", "用户优势2"],
    "gap": "主要差距提示",
    "platform": "Boss直聘",
    "matchScore": 90
  }
]`;

    let fullResponse = '';

    try {
      // 10s timeout — don't let the API hang forever
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('请求超时，请检查网络')), 10000);
        streamCh2({
          mode: 'assistant',
          input: prompt,
          systemPrompt: '你是一个专业的职位推荐引擎。只输出JSON数组，不要说任何其他话。',
          history: [{ role: 'user', content: `帮我推荐${p.targetRole}职位` }],
          onDelta: (chunk) => { fullResponse += chunk; },
          onDone: () => { clearTimeout(timer); resolve(); },
          onError: (e) => { clearTimeout(timer); reject(new Error(e)); },
        });
      });

      // Parse JSON — try multiple strategies
      let jsonStr = fullResponse.trim();
      // Strip markdown code fences if present
      const codeFence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeFence) jsonStr = codeFence[1].trim();
      // Try to extract array
      const arrayMatch = jsonStr.match(/(\[[\s\S]*\])/);
      if (arrayMatch) jsonStr = arrayMatch[1];

      const parsed: any[] = JSON.parse(jsonStr);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('AI 返回的职位列表为空');
      }

      const newCards: JobCard[] = parsed.map((item, i) => ({
        id: `feed-${Date.now()}-${i}`,
        title: item.title || '未命名职位',
        company: item.company || '知名企业',
        city: item.city || p.preferredCity || '全国',
        salary: item.salary || '面议',
        matchReason: item.matchReason || '与你的画像匹配',
        strengths: Array.isArray(item.strengths) ? item.strengths.slice(0, 2) : ['技能匹配'],
        gap: item.gap || '无明显差距',
        platform: item.platform || 'Boss直聘',
        matchScore: typeof item.matchScore === 'number' ? item.matchScore : Math.floor(85 - i * 3),
      }));

      setCards(newCards);
      setDailyCount(prev => Math.min(prev + newCards.length, DAILY_LIMIT));
      setStep('feed');
      toast({ title: `已为你找到 ${newCards.length} 个匹配职位`, description: '按匹配度从高到低排列' });
    } catch (e: any) {
      console.error('generateCards failed, using fallback:', e?.message);
      const fallbackCards = buildMockCards(p);
      setCards(fallbackCards);
      setDailyCount(prev => Math.min(prev + fallbackCards.length, DAILY_LIMIT));
      setStep('feed');
      toast({
        title: `已为你找到 ${fallbackCards.length} 个匹配职位`,
        description: '（使用推荐模板，联网后可获取最新实时职位）',
      });
    } finally {
      setLoadingCards(false);
      generatingRef.current = false;
    }
  };

  // ========== Load more ==========
  const loadMore = async () => {
    if (loadingMore || isAtLimit) return;

    if (dailyCount >= DAILY_LIMIT) {
      setIsAtLimit(true);
      toast({ title: '今日已达限额', description: `每天 ${DAILY_LIMIT} 条免费推荐，升级会员解锁无限刷` });
      return;
    }

    setLoadingMore(true);
    const p = loadProfile();
    const excludeList = cards.map(c => `${c.company}的${c.title}`).join('、');

    let fullResponse = '';

    try {
      await new Promise<void>((resolve, reject) => {
        streamCh2({
          mode: 'assistant',
          input: `继续推荐${p.targetRole}职位。已推荐过的不要重复：${excludeList}`,
          systemPrompt: '你是一个职位推荐引擎。只输出JSON数组。',
          history: [],
          onDelta: (chunk) => { fullResponse += chunk; },
          onDone: () => resolve(),
          onError: (e) => reject(new Error(e)),
        });
      });

      let jsonStr = fullResponse.trim();
      const codeFence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeFence) jsonStr = codeFence[1].trim();
      const arrayMatch = jsonStr.match(/(\[[\s\S]*\])/);
      if (arrayMatch) jsonStr = arrayMatch[1];

      const parsed: any[] = JSON.parse(jsonStr);

      const moreCards: JobCard[] = parsed.map((item, i) => ({
        id: `feed-${Date.now()}-${i}`,
        title: item.title || '未命名职位',
        company: item.company || '知名企业',
        city: item.city || p.preferredCity || '全国',
        salary: item.salary || '面议',
        matchReason: item.matchReason || '与你的画像匹配',
        strengths: Array.isArray(item.strengths) ? item.strengths.slice(0, 2) : ['技能匹配'],
        gap: item.gap || '无明显差距',
        platform: item.platform || 'Boss直聘',
        matchScore: typeof item.matchScore === 'number' ? item.matchScore : Math.max(50, 75 - cards.length - i),
      }));

      setCards(prev => [...prev, ...moreCards]);
      const newCount = dailyCount + moreCards.length;
      setDailyCount(newCount);

      if (newCount >= DAILY_LIMIT) {
        setIsAtLimit(true);
        toast({ title: '🎉 今日已达限额', description: `已为你推荐 ${DAILY_LIMIT} 条职位，明天再来刷吧` });
      }
    } catch (e: any) {
      console.error('loadMore failed, using fallback:', e?.message);
      // Fallback: more mock cards, excluding existing ones
      const excludeTitles = cards.map(c => c.title);
      const moreCards = buildMockCards(p, excludeTitles).slice(0, CARDS_PER_PAGE);
      if (moreCards.length === 0) {
        setIsAtLimit(true);
        toast({ title: '没有更多职位了', description: '明天会有新的推荐' });
        setLoadingMore(false);
        return;
      }

      setCards(prev => [...prev, ...moreCards]);
      const newCount = dailyCount + moreCards.length;
      setDailyCount(newCount);
      if (newCount >= DAILY_LIMIT) {
        setIsAtLimit(true);
        toast({ title: '🎉 今日已达限额', description: `已为你推荐 ${DAILY_LIMIT} 条职位，明天再来刷吧` });
      }
    } finally {
      setLoadingMore(false);
    }
  };

  // ========== Infinite scroll ==========
  useEffect(() => {
    if (step !== 'feed') return;
    const el = scrollRef.current;
    if (!el) return;
    const sentinel = el.querySelector('[data-feed-sentinel]');
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !isAtLimit) {
          loadMore();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [step, loadingMore, isAtLimit, cards.length]);

  // ========== Chat handler — explicit, no side-effect-driven transitions ==========
  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');

    // Add user message
    const userMsg = { role: 'user' as const, content: text };
    setChatMessages(prev => [...prev, userMsg]);

    if (step === 'city') {
      // Save city, transition to salary
      const updated: UserProfile = { ...profile, preferredCity: text };
      setProfile(updated);
      saveProfile(updated);
      setStep('salary');
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `好的，${text}！那大概期望月薪在什么范围？（比如 15-20K，或者「市场价就行」也没问题）`,
      }]);
      return;
    }

    if (step === 'salary') {
      // Save salary, trigger card generation
      const updated: UserProfile = { ...profile, salaryExpectation: text };
      setProfile(updated);
      saveProfile(updated);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `收到！画像已齐全——${profile.targetRole || '校招'} · ${profile.preferredCity} · ${text}。正在扫描全网的匹配职位…`,
      }]);
      // Small delay to let user see the confirmation before loading screen
      setTimeout(() => doGenerateCards(), 600);
      return;
    }
  };

  // ========== Reset ==========
  const resetFeed = () => {
    generatingRef.current = false;
    setCards([]);
    setIsAtLimit(false);
    setProfile(p => ({ ...p, preferredCity: null, salaryExpectation: null }));
    saveProfile({ ...profile, preferredCity: null, salaryExpectation: null });
    setStep('city');
    setChatMessages([{
      role: 'assistant',
      content: `好的，重新开始！你想在哪个城市找工作呀？`,
    }]);
    localStorage.removeItem(FEED_CARDS_LS);
  };

  // ========== Render ==========
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#faf9f7] via-white to-[#f7f6f1]">
      {/* Ambient decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[8%] -left-20 w-80 h-80 rounded-full bg-violet-100/20 blur-3xl" />
        <div className="absolute bottom-[12%] -right-16 w-72 h-72 rounded-full bg-emerald-100/20 blur-3xl" />
        <div className="absolute top-[45%] left-[25%] w-60 h-60 rounded-full bg-amber-100/15 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[#faf9f7]/85 border-b border-stone-200/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link
            to="/career/map"
            className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold leading-tight text-foreground">每日机会 Feed</h1>
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-semibold">
                <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
                第三章·投递闯关
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {profile.targetRole
                ? `🎯 ${profile.targetRole} · ${profile.preferredCity || '城市待定'} · ${profile.salaryExpectation || '薪资待定'}`
                : '基于你的画像，每日推荐匹配职位'}
            </p>
          </div>
          {step === 'feed' && cards.length > 0 && (
            <button
              onClick={resetFeed}
              className="shrink-0 px-2.5 py-1.5 rounded-full bg-white border border-stone-200 text-[11px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> 重设
            </button>
          )}
        </div>
      </header>

      <main className="relative max-w-3xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        {/* ===== Setup chat (city / salary) ===== */}
        {(step === 'city' || step === 'salary') && (
          <div className="rounded-3xl bg-white border border-stone-200 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">完善画像，获取精准推荐</p>
                  <p className="text-[11px] text-muted-foreground">
                    已知：{profile.targetRole || '?'} · 技能：{profile.jdKeywords.slice(0, 3).join('、') || '待确认'}
                  </p>
                </div>
              </div>
            </div>
            <div ref={chatScrollRef} className="px-4 py-4 h-[300px] overflow-y-auto space-y-3">
              {chatMessages.map((m, i) => (
                <div key={i} className={cn('flex gap-2.5', m.role === 'user' ? 'flex-row-reverse' : '')}>
                  <div className={cn(
                    'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    m.role === 'user' ? 'bg-gradient-to-br from-sky-400 to-blue-500' : 'bg-gradient-to-br from-violet-500 to-purple-600',
                  )}>
                    {m.role === 'user'
                      ? <span className="text-white text-[10px] font-bold">YOU</span>
                      : <Sparkles className="w-4 h-4 text-white" />
                    }
                  </div>
                  <div className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100'
                      : 'bg-white border border-stone-200/80 shadow-sm',
                  )}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/50">
              <div className="flex items-end gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChat();
                    }
                  }}
                  disabled={loadingCards}
                  placeholder={step === 'city' ? '输入城市名，如「上海」「长三角」…' : '输入薪资范围，如「15-20K」…'}
                  className="flex-1 h-10 px-3.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-50"
                />
                <Button
                  onClick={() => sendChat()}
                  disabled={loadingCards || !chatInput.trim()}
                  size="icon"
                  className="shrink-0 rounded-xl h-10 w-10 bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0 shadow-md disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Loading ===== */}
        {step === 'loading' && (
          <div className="rounded-3xl bg-white border border-stone-200 p-12 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
            </div>
            <h2 className="font-bold text-lg text-foreground mb-2">正在扫描匹配职位…</h2>
            <p className="text-sm text-muted-foreground">
              基于 {profile.targetRole} · {profile.preferredCity} · {profile.salaryExpectation} 的画像
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-4">
              {['Boss直聘', '拉勾', '猎聘', 'LinkedIn', '智联招聘'].map(p => (
                <span key={p} className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                  {PLATFORM_COLORS[p]?.icon} {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ===== Feed ===== */}
        {step === 'feed' && cards.length > 0 && (
          <div ref={scrollRef} className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[13px] font-semibold text-foreground">
                为你找到 <span className="text-violet-600">{cards.length}</span> 个匹配职位
              </p>
              <p className="text-[11px] text-muted-foreground">
                按匹配度从高到低排列
              </p>
            </div>

            {cards.map(card => {
              const plat = PLATFORM_COLORS[card.platform] || PLATFORM_COLORS['Boss直聘'];
              return (
                <div key={card.id} className="rounded-2xl bg-white border border-stone-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden">
                  <div className="px-5 py-3 bg-gradient-to-r from-violet-50/60 to-purple-50/60 border-b border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Building2 className="w-4 h-4 text-violet-500 shrink-0" />
                      <span className="text-[13px] font-semibold text-foreground truncate">{card.company}</span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0', plat.bg, plat.text)}>
                        {plat.icon} {card.platform}
                      </span>
                    </div>
                    {/* Match score + favorite — always side by side, never overlap */}
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <div className="flex items-center gap-1.5">
                        <div className="relative w-8 h-8 shrink-0">
                          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="14" className="stroke-stone-200" strokeWidth="3" fill="none" />
                            <circle cx="18" cy="18" r="14"
                              className={cn('stroke-current transition-all duration-700',
                                card.matchScore >= 80 ? 'text-emerald-500' : card.matchScore >= 65 ? 'text-amber-500' : 'text-rose-400')}
                              strokeWidth="3" strokeLinecap="round" fill="none"
                              strokeDasharray={2 * Math.PI * 14}
                              strokeDashoffset={2 * Math.PI * 14 * (1 - card.matchScore / 100)}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">{card.matchScore}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground hidden sm:inline">匹配度</span>
                      </div>
                      {/* Favorite button — always beside score, never covers it */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(card.id); }}
                        className={cn(
                          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all',
                          favorites.has(card.id)
                            ? 'bg-rose-50 text-rose-500 border border-rose-200'
                            : 'text-muted-foreground/60 border border-transparent hover:border-rose-200 hover:text-rose-400 hover:bg-rose-50/50',
                        )}
                        title={favorites.has(card.id) ? '取消收藏' : '收藏职位'}
                      >
                        <Heart className={cn('w-4 h-4 transition-all', favorites.has(card.id) && 'fill-current scale-110')} />
                      </button>
                    </div>
                  </div>
                  <div className="p-5 space-y-3.5">
                    <div>
                      <h3 className="font-bold text-base text-foreground leading-tight">{card.title}</h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                          <MapPin className="w-3 h-3 text-violet-400" />{card.city}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                          <DollarSign className="w-3 h-3 text-emerald-400" />{card.salary}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-violet-50/50 border border-violet-100 p-3">
                      <div className="flex items-start gap-2">
                        <Target className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                        <p className="text-[13px] text-foreground/80 leading-relaxed">{card.matchReason}</p>
                      </div>
                    </div>
                    {card.strengths.map((s, si) => (
                      <div key={si} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-[13px] text-foreground/75">{s}</span>
                      </div>
                    ))}
                    {card.gap && card.gap !== '无明显差距' && (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-[12px] text-muted-foreground">{card.gap}</span>
                      </div>
                    )}
                    <Button size="sm" className="rounded-xl h-8 text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90 shadow-sm">
                      <ExternalLink className="w-3 h-3 mr-1" />去{card.platform}查看
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Footer */}
            <div className="rounded-2xl bg-stone-50 border border-stone-200 p-5 text-center mt-2">
              <p className="text-[13px] text-muted-foreground">
                已为你推荐 <span className="font-bold text-foreground">{cards.length}</span> 个匹配职位
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                想调整城市或薪资？点右上角「重设」即可
              </p>
            </div>
          </div>
        )}

        {/* ===== Empty feed ===== */}
        {step === 'feed' && cards.length === 0 && (
          <div className="rounded-3xl bg-white border border-stone-200 p-10 text-center shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)]">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="font-bold text-lg text-foreground mb-2">还没有推荐</h3>
            <p className="text-[13px] text-muted-foreground mb-5">先完善城市和薪资期望，立刻给你推荐</p>
            <Button
              onClick={() => {
                setStep('city');
                setChatMessages([{ role: 'assistant', content: '你打算在哪个城市找工作呀？' }]);
              }}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold"
            >
              开始设置
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
