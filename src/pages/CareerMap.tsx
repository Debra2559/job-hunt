import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Brain, Crosshair, Newspaper, PenLine, Lightbulb, Building2, BotMessageSquare, Rocket, MailPlus, ScissorsLineDashed, MessagesSquare, Mic, Lock, Check, ChevronRight, Map as MapIcon, RotateCcw, FastForward, ChevronsRight, Briefcase, CalendarCheck2, Handshake, GraduationCap, Users, Presentation, ShieldCheck, TrendingUp, Coins, GitBranch, Trophy, Sparkles, Palette, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { useQuestProgress } from '@/hooks/useQuestProgress';
import { useGameProgress, CHAPTER_STAGES, type ItemId, type DailyTaskId } from '@/hooks/useGameProgress';
import { useChapterSkip, type ChapterId, type SkipPayload } from '@/hooks/useChapterSkip';
import ChapterSkipDialog from '@/components/career/ChapterSkipDialog';
import PlayerHub from '@/components/career/PlayerHub';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';

type StageStatus = 'done' | 'active' | 'available' | 'locked';

type StageDef = {
  id: string;
  title: string;
  desc: string;
  icon: any;
  emoji: string;          // 每关的专属可爱图标
  to?: string;
  comingSoon?: boolean;
  priority?: 'P0' | 'P1';
};

type Chapter = {
  num: string;
  title: string;
  subtitle: string;
  emoji: string;
  // 章节主题色（柔和马卡龙）
  nodeBg: string;         // 节点圆盘渐变
  nodeHalo: string;       // 节点光晕色
  ribbon: string;         // ribbon 渐变
  ribbonShadow: string;   // ribbon 投影颜色
  scenery: string[];      // 该区域散落的景物 emoji
  stages: StageDef[];
};

// 统一克制配色：全部章节共用 emerald + stone 主题，靠 emoji / 编号区分章节身份
const U_NODE_BG = 'from-emerald-600 to-emerald-800';
const U_HALO = 'bg-emerald-200/55';
const U_RIBBON = 'from-emerald-700 to-emerald-900';
const U_RIBBON_SHADOW = 'shadow-emerald-900/10';

const chapters: Chapter[] = [
  {
    num: '01', title: '认识自己', subtitle: '搞清楚我是谁、我适合什么', emoji: '🧭',
    nodeBg: U_NODE_BG, nodeHalo: U_HALO, ribbon: U_RIBBON, ribbonShadow: U_RIBBON_SHADOW,
    scenery: ['🌿', '🍄', '🌱', '🦋', '🌸'],
    stages: [
      { id: 'assess', title: '性格 & 能力测评', desc: '8-12 题点选,5-10 分钟', icon: Brain, emoji: '🧠', to: '/career', priority: 'P0' },
      { id: 'recommend', title: '岗位推荐', desc: '基于报告挑选感兴趣方向', icon: Crosshair, emoji: '🎯', to: '/career/recommend', priority: 'P0' },
      { id: 'jd', title: '岗位 JD 汇总', desc: 'AI 汇集真实在招与项目要求', icon: Newspaper, emoji: '🔍', to: '/career/jd', priority: 'P0' },
      { id: 'claim_assistant', title: '认领专属助理', desc: '按岗位匹配一位 AI 学长', icon: BotMessageSquare, emoji: '🤖', to: '/career/assistants', priority: 'P0' },
    ],
  },
  {
    num: '02', title: '准备出发', subtitle: '梳理经历,打磨简历,弹药上膛', emoji: '🎒',
    nodeBg: U_NODE_BG, nodeHalo: U_HALO, ribbon: U_RIBBON, ribbonShadow: U_RIBBON_SHADOW,
    scenery: ['🌲', '🏕️', '🪵', '🐿️', '☘️'],
    stages: [
      { id: 'resume', title: '对话式一键简历', desc: '支持文字 / 图片 / PDF / 语音', icon: PenLine, emoji: '📝', to: '/career/resume', priority: 'P0' },
      { id: 'tips', title: '求职小 Tips', desc: '流程 & 细节随时问', icon: Lightbulb, emoji: '💡', to: '/career/tips', priority: 'P0' },
      { id: 'company', title: '了解公司', desc: '业务、文化、最新动态', icon: Building2, emoji: '🏢', to: '/career/company', priority: 'P1' },
    ],
  },
  {
    num: '03', title: '投递闯关', subtitle: '让对的机会主动找到你', emoji: '🚀',
    nodeBg: U_NODE_BG, nodeHalo: U_HALO, ribbon: U_RIBBON, ribbonShadow: U_RIBBON_SHADOW,
    scenery: ['🏯', '🪷', '🌊', '🐠', '⛩️'],
    stages: [
      { id: 'feed', title: '每日机会 Feed', desc: '一键推荐卡片', icon: Rocket, emoji: '✨', comingSoon: true, priority: 'P0' },
      { id: 'apply', title: '一键投递', desc: '简历直达 HR 信箱', icon: MailPlus, emoji: '📮', comingSoon: true, priority: 'P0' },
      { id: 'jd-break', title: 'JD 拆解', desc: '逐条对照你的优势', icon: ScissorsLineDashed, emoji: '✂️', comingSoon: true, priority: 'P1' },
    ],
  },
  {
    num: '04', title: '面试通关', subtitle: '在镜头前从容做自己', emoji: '👑',
    nodeBg: U_NODE_BG, nodeHalo: U_HALO, ribbon: U_RIBBON, ribbonShadow: U_RIBBON_SHADOW,
    scenery: ['🏔️', '🦅', '✨', '🌅', '🏰'],
    stages: [
      { id: 'qa', title: '逐字稿 & QA', desc: '高频问题人话版回答', icon: MessagesSquare, emoji: '💬', comingSoon: true, priority: 'P0' },
      { id: 'mock', title: '模拟面试', desc: '语音对练 + 即时反馈', icon: Mic, emoji: '🎤', comingSoon: true, priority: 'P1' },
    ],
  },
  {
    num: '05', title: '入职适应', subtitle: 'Offer 不是终点,是新故事的开始', emoji: '🌅',
    nodeBg: U_NODE_BG, nodeHalo: U_HALO, ribbon: U_RIBBON, ribbonShadow: U_RIBBON_SHADOW,
    scenery: ['🌻', '☀️', '🍞', '🪴', '📋'],
    stages: [
      { id: 'onboard-prep', title: '背调 & 入职准备', desc: '材料清单、社保转移、报到流程', icon: Briefcase, emoji: '💼', comingSoon: true, priority: 'P0' },
      { id: 'plan-90', title: '30 / 60 / 90 天计划', desc: 'AI 帮你拟定上手节奏与里程碑', icon: CalendarCheck2, emoji: '📅', comingSoon: true, priority: 'P0' },
      { id: 'first-week', title: '第一周破冰', desc: 'leader / 同事 / 上下游 自我介绍', icon: Handshake, emoji: '🤝', comingSoon: true, priority: 'P1' },
      { id: 'probation', title: '转正答辩', desc: '复盘亮点、STAR/金字塔输出', icon: GraduationCap, emoji: '🎓', comingSoon: true, priority: 'P0' },
    ],
  },
  {
    num: '06', title: '职场文化生存', subtitle: '把规则摸清,把自己保护好', emoji: '🛡️',
    nodeBg: U_NODE_BG, nodeHalo: U_HALO, ribbon: U_RIBBON, ribbonShadow: U_RIBBON_SHADOW,
    scenery: ['📚', '🫧', '🌙', '🪞', '🗝️'],
    stages: [
      { id: 'communication', title: '沟通礼仪 & 汇报', desc: '邮件、IM、周报的人话模板', icon: MessagesSquare, emoji: '✉️', comingSoon: true, priority: 'P0' },
      { id: 'collab', title: '跨部门协作', desc: '推不动事情时该怎么办', icon: Users, emoji: '👥', comingSoon: true, priority: 'P0' },
      { id: 'meeting', title: '高效会议', desc: '开会发言、控场、纪要的套路', icon: Presentation, emoji: '🗣️', comingSoon: true, priority: 'P1' },
      { id: 'anti-pua', title: '反 PUA 自保', desc: '识别 PUA 话术,保护自己的边界', icon: ShieldCheck, emoji: '🛡️', comingSoon: true, priority: 'P0' },
    ],
  },
  {
    num: '07', title: '长期成长', subtitle: '从打工人到自己的 CEO', emoji: '🌳',
    nodeBg: U_NODE_BG, nodeHalo: U_HALO, ribbon: U_RIBBON, ribbonShadow: U_RIBBON_SHADOW,
    scenery: ['🌳', '🪙', '🧭', '🍀', '🌟'],
    stages: [
      { id: 'review', title: '绩效面谈 & OKR', desc: '把价值讲清楚,把目标对齐准', icon: TrendingUp, emoji: '📈', comingSoon: true, priority: 'P0' },
      { id: 'negotiate', title: '加薪 & 跳槽谈薪', desc: '基于市场行情的话术与底牌', icon: Coins, emoji: '💰', comingSoon: true, priority: 'P0' },
      { id: 'pathing', title: 'M / P 双通道', desc: '管理线还是专业线,怎么选路', icon: GitBranch, emoji: '🧭', comingSoon: true, priority: 'P1' },
    ],
  },
];

type RomanceStyleId = 'oriental' | 'garden' | 'sunset' | 'moonlit';

type RomanceStyle = {
  id: RomanceStyleId;
  label: string;
  emoji: string;
  hint: string;
};

const ROMANCE_STYLES: RomanceStyle[] = [
  { id: 'oriental', label: '仙鹤水波', emoji: '🕊️', hint: '青蓝、流云、东方仙气' },
  { id: 'garden', label: '花园晨光', emoji: '🌸', hint: '薄荷、花枝、玻璃花房' },
  { id: 'sunset', label: '麦田暮光', emoji: '🌾', hint: '鎏金、雾光、温柔落日' },
  { id: 'moonlit', label: '月夜剪影', emoji: '🌙', hint: '深靛、湖面、安静星光' },
];

const CHAPTER_GRADIENTS_BY_STYLE: Record<RomanceStyleId, string[]> = {
  oriental: [
    'linear-gradient(135deg, #63cdda 0%, #74b9ff 55%, #b388ff 100%)',
    'linear-gradient(135deg, #7dd3fc 0%, #5eead4 50%, #c4b5fd 100%)',
    'linear-gradient(135deg, #60a5fa 0%, #38bdf8 48%, #818cf8 100%)',
    'linear-gradient(135deg, #22d3ee 0%, #2dd4bf 42%, #a78bfa 100%)',
    'linear-gradient(135deg, #5eead4 0%, #60a5fa 52%, #f0abfc 100%)',
    'linear-gradient(135deg, #67e8f9 0%, #93c5fd 50%, #c084fc 100%)',
    'linear-gradient(135deg, #38bdf8 0%, #2dd4bf 52%, #c4b5fd 100%)',
  ],
  garden: [
    'linear-gradient(135deg, #86efac 0%, #bae6fd 52%, #f9a8d4 100%)',
    'linear-gradient(135deg, #a7f3d0 0%, #bfdbfe 45%, #fbcfe8 100%)',
    'linear-gradient(135deg, #bbf7d0 0%, #a5f3fc 48%, #ddd6fe 100%)',
    'linear-gradient(135deg, #6ee7b7 0%, #93c5fd 50%, #f9a8d4 100%)',
    'linear-gradient(135deg, #f9a8d4 0%, #fde68a 45%, #a7f3d0 100%)',
    'linear-gradient(135deg, #c4b5fd 0%, #93c5fd 45%, #86efac 100%)',
    'linear-gradient(135deg, #fbcfe8 0%, #bfdbfe 48%, #a7f3d0 100%)',
  ],
  sunset: [
    'linear-gradient(135deg, #f9a8d4 0%, #fde68a 55%, #fdba74 100%)',
    'linear-gradient(135deg, #fbcfe8 0%, #fed7aa 45%, #fde68a 100%)',
    'linear-gradient(135deg, #fdba74 0%, #fcd34d 48%, #f9a8d4 100%)',
    'linear-gradient(135deg, #fb7185 0%, #fdba74 45%, #fde68a 100%)',
    'linear-gradient(135deg, #f97316 0%, #fbbf24 42%, #f9a8d4 100%)',
    'linear-gradient(135deg, #fca5a5 0%, #fde68a 48%, #fdba74 100%)',
    'linear-gradient(135deg, #fcd34d 0%, #fb7185 52%, #c4b5fd 100%)',
  ],
  moonlit: [
    'linear-gradient(135deg, #818cf8 0%, #60a5fa 42%, #f9a8d4 100%)',
    'linear-gradient(135deg, #6366f1 0%, #38bdf8 48%, #a78bfa 100%)',
    'linear-gradient(135deg, #312e81 0%, #60a5fa 52%, #c084fc 100%)',
    'linear-gradient(135deg, #4338ca 0%, #7dd3fc 45%, #f9a8d4 100%)',
    'linear-gradient(135deg, #1d4ed8 0%, #818cf8 48%, #f0abfc 100%)',
    'linear-gradient(135deg, #3730a3 0%, #60a5fa 45%, #fbcfe8 100%)',
    'linear-gradient(135deg, #4f46e5 0%, #38bdf8 45%, #f9a8d4 100%)',
  ],
};

const STYLE_PREVIEW_BG: Record<RomanceStyleId, string> = {
  oriental:
    'radial-gradient(circle at 20% 20%, rgba(125,211,252,0.55) 0%, rgba(125,211,252,0) 55%), radial-gradient(circle at 80% 30%, rgba(167,243,208,0.55) 0%, rgba(167,243,208,0) 55%), linear-gradient(160deg, #f0f9ff 0%, #ecfeff 45%, #f5f3ff 100%)',
  garden:
    'radial-gradient(circle at 25% 20%, rgba(187,247,208,0.7) 0%, rgba(187,247,208,0) 55%), radial-gradient(circle at 80% 25%, rgba(251,207,232,0.6) 0%, rgba(251,207,232,0) 55%), linear-gradient(160deg, #f0fdf4 0%, #fdf2f8 55%, #faf5ff 100%)',
  sunset:
    'radial-gradient(circle at 20% 25%, rgba(254,215,170,0.7) 0%, rgba(254,215,170,0) 55%), radial-gradient(circle at 80% 30%, rgba(251,207,232,0.6) 0%, rgba(251,207,232,0) 55%), linear-gradient(160deg, #fff7ed 0%, #fef3c7 40%, #fce7f3 100%)',
  moonlit:
    'radial-gradient(circle at 25% 25%, rgba(129,140,248,0.55) 0%, rgba(129,140,248,0) 55%), radial-gradient(circle at 78% 28%, rgba(167,139,250,0.45) 0%, rgba(167,139,250,0) 55%), linear-gradient(160deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
};




function computeStatuses(completed: Set<string>): Record<string, StageStatus> {
  const flat = chapters.flatMap(c => c.stages);
  const result: Record<string, StageStatus> = {};
  let unlockedNext = true;
  for (const st of flat) {
    if (st.comingSoon) { result[st.id] = 'locked'; continue; }
    if (completed.has(st.id)) {
      result[st.id] = 'done';
    } else if (unlockedNext) {
      result[st.id] = 'active';
      unlockedNext = false;
    } else {
      result[st.id] = 'locked';
    }
  }
  return result;
}

// 每关在区域内的 x 偏移百分比（蜿蜒路径的节点 x 坐标）
// 移动端：左右交替（童话地图风）；桌面端：蜿蜒
const NODE_X_PATTERN_MOBILE = [72, 28, 72, 28, 72, 28];
const NODE_X_PATTERN_DESKTOP = [22, 50, 78, 50, 22, 78];
function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setM(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return m;
}


export default function CareerMap() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const NODE_X_PATTERN = isMobile ? NODE_X_PATTERN_MOBILE : NODE_X_PATTERN_DESKTOP;
  const { completed, markDone, reset } = useQuestProgress();
  const { state: game, level, bumpDaily, claimDaily, useItem, resetGame } = useGameProgress();
  const { skipData, saveSkip, resetSkip } = useChapterSkip();
  const [skipQueue, setSkipQueue] = useState<Array<{ id: ChapterId; title: string; emoji: string }> | null>(null);
  // 跳过完成后的回调（标记 stage / 跳转）
  const [skipAfter, setSkipAfter] = useState<null | (() => void)>(null);
  const [stageSkipTarget, setStageSkipTarget] = useState<{ stageId: string; stageTitle: string; ci: number; si: number } | null>(null);

  useEffect(() => { bumpDaily('open_map'); }, [bumpDaily]);

  const statuses = useMemo(() => computeStatuses(new Set(completed)), [completed]);

  const allStages = chapters.flatMap(c => c.stages);
  const implementedTotal = allStages.filter(s => !s.comingSoon).length;
  const doneCount = allStages.filter(s => statuses[s.id] === 'done').length;
  const availableCount = allStages.filter(s => statuses[s.id] !== 'locked').length;
  const totalStages = allStages.length;
  const progressPct = implementedTotal > 0 ? Math.round((doneCount / implementedTotal) * 100) : 0;

  const allFlat = chapters.flatMap((c, ci) => c.stages.map((s, si) => ({ stage: s, chapter: c, ci, si })));
  const activeEntry = allFlat.find(e => statuses[e.stage.id] === 'active');
  const firstSoonEntry = allFlat.find(e => e.stage.comingSoon);
  const allDoneImplemented = implementedTotal > 0 && doneCount === implementedTotal;
  const nextRec = activeEntry || (allDoneImplemented ? firstSoonEntry : null);
  const nextDoneInChapter = nextRec ? nextRec.chapter.stages.filter(s => statuses[s.id] === 'done').length : 0;
  const nextImplInChapter = nextRec ? nextRec.chapter.stages.filter(s => !s.comingSoon).length : 0;

  const recHeadline = (() => {
    if (!nextRec) return '准备好开始你的求职旅程了';
    if (allDoneImplemented) return '已开放关卡全部通关，先看看后续内容';
    if (doneCount === 0) return '从这里出发，认识真正的自己';
    if (nextDoneInChapter > 0 && nextDoneInChapter < nextImplInChapter) return `继续推进「${nextRec.chapter.title}」`;
    return `进入「第${['一','二','三','四','五','六','七'][nextRec.ci]}章 · ${nextRec.chapter.title}」`;
  })();
  const recReason = (() => {
    if (!nextRec) return '';
    if (allDoneImplemented) return '后续章节正在打磨中，可先体验敬请期待的预告';
    if (doneCount === 0) return '8-12 题点选 · 5-10 分钟，结束后会生成你的专属职业报告';
    const remain = implementedTotal - doneCount;
    return `当前进度 ${doneCount}/${implementedTotal}，距全部通关还有 ${remain} 关`;
  })();
  

  const handleResetAll = () => {
    if (confirm('确定要重置闯关进度与所有奖励吗？此操作不可撤销。')) {
      reset(); resetGame(); resetSkip();
    }
  };

  const chapterIdOf = (num: string): ChapterId => (`ch${parseInt(num, 10)}` as ChapterId);

  // 章节是否已通关（所有非"敬请期待"关卡完成）
  const isChapterComplete = (chId: ChapterId) => {
    const ch = chapters.find(c => chapterIdOf(c.num) === chId);
    if (!ch) return false;
    const impl = ch.stages.filter(s => !s.comingSoon);
    return impl.length > 0 && impl.every(s => completed.includes(s.id));
  };

  // 章节是否需要补材料（未通关 && 还没保存过 skip 材料 && 在 SkipPayload 中有 form）
  const NEED_MATERIAL: Record<string, boolean> = { ch1: true, ch2: true, ch3: true };
  const chapterNeedsMaterial = (chId: ChapterId) =>
    !!NEED_MATERIAL[chId] && !skipData[chId] && !isChapterComplete(chId);

  // 构建跳过队列：includeTarget=true 时把目标章节也加入末尾
  const buildSkipQueue = (targetChId: ChapterId, includeTarget: boolean) => {
    const targetIdx = chapters.findIndex(c => chapterIdOf(c.num) === targetChId);
    if (targetIdx < 0) return [];
    const queue: Array<{ id: ChapterId; title: string; emoji: string }> = [];
    for (let i = 0; i < targetIdx; i++) {
      const c = chapters[i];
      const id = chapterIdOf(c.num);
      if (chapterNeedsMaterial(id)) {
        queue.push({ id, title: c.title, emoji: c.emoji });
      }
    }
    if (includeTarget) {
      const c = chapters[targetIdx];
      const id = chapterIdOf(c.num);
      if (chapterNeedsMaterial(id) || isChapterComplete(id) === false) {
        // 目标章节如果还没完成，且有 form，则收集；没 form 也加入以走"无需材料"步骤
        if (NEED_MATERIAL[id] && !skipData[id]) {
          queue.push({ id, title: c.title, emoji: c.emoji });
        }
      }
    }
    return queue;
  };

  // 点击"跳过本章 N"
  const requestSkipChapter = (chId: ChapterId, title: string, emoji: string) => {
    const queue = buildSkipQueue(chId, true);
    // 至少把目标章节本身也展示一次（即便没 form 也给 confirmation）
    const finalQueue = queue.length > 0 ? queue : [{ id: chId, title, emoji }];
    setSkipQueue(finalQueue);
    setSkipAfter(() => () => {
      const stageIds = CHAPTER_STAGES[chId] || [];
      stageIds.forEach(id => markDone(id));
      toast({ title: `已跳过「${title}」`, description: '本章关卡已标记完成，可继续推进下一章' });
    });
  };

  // 直接跳到指定关卡：把它之前所有未完成的关卡（含敬请期待）标记完成，支持跨章节
  const stagesToSkipBefore = (stageId: string) => {
    const flat = chapters.flatMap(c => c.stages);
    const idx = flat.findIndex(s => s.id === stageId);
    if (idx < 0) return [] as string[];
    return flat.slice(0, idx).filter(s => !completed.includes(s.id)).map(s => s.id);
  };

  const runStageSkip = () => {
    if (!stageSkipTarget) return;
    const ids = stagesToSkipBefore(stageSkipTarget.stageId);
    ids.forEach(id => markDone(id));
    const targetStage = chapters.flatMap(c => c.stages).find(s => s.id === stageSkipTarget.stageId);
    if (targetStage?.comingSoon && !completed.includes(targetStage.id)) {
      markDone(targetStage.id);
    }
    const chaptersCrossed = new Set(
      chapters.flatMap(c => c.stages.filter(s => ids.includes(s.id)).map(() => c.num))
    ).size;
    toast({
      title: `已跳到「${stageSkipTarget.stageTitle}」`,
      description: chaptersCrossed > 1
        ? `跨越 ${chaptersCrossed} 个章节，跳过了 ${ids.length} 关`
        : `跳过了前面 ${ids.length} 关`,
    });
    setStageSkipTarget(null);
    if (targetStage?.to) navigate(targetStage.to);
  };

  const confirmStageSkip = () => {
    if (!stageSkipTarget) return;
    // 目标关卡所在章节
    const targetCh = chapters.find(c => c.stages.some(s => s.id === stageSkipTarget.stageId));
    if (!targetCh) { runStageSkip(); return; }
    const targetChId = chapterIdOf(targetCh.num);
    // 收集前置章节（不含目标章节本身）
    const queue = buildSkipQueue(targetChId, false);
    if (queue.length === 0) {
      runStageSkip();
      return;
    }
    // 关闭 AlertDialog，弹出材料向导
    const pending = stageSkipTarget;
    setStageSkipTarget(null);
    setSkipQueue(queue);
    setSkipAfter(() => () => {
      // 恢复 target 上下文执行 stage skip
      setStageSkipTarget(pending);
      // 用微任务确保 state 更新后执行
      setTimeout(() => {
        const ids = stagesToSkipBefore(pending.stageId);
        ids.forEach(id => markDone(id));
        const targetStage = chapters.flatMap(c => c.stages).find(s => s.id === pending.stageId);
        if (targetStage?.comingSoon && !completed.includes(targetStage.id)) markDone(targetStage.id);
        toast({ title: `已跳到「${pending.stageTitle}」`, description: `已跳过前面 ${ids.length} 关` });
        setStageSkipTarget(null);
        if (targetStage?.to) navigate(targetStage.to);
      }, 0);
    });
  };

  const handleSkipWizardConfirm = (results: Partial<SkipPayload>) => {
    (Object.keys(results) as ChapterId[]).forEach(chId => {
      const payload = (results as any)[chId];
      saveSkip(chId, payload);
      // 同时标记该章节所有关卡为完成
      const stageIds = CHAPTER_STAGES[chId] || [];
      stageIds.forEach(id => markDone(id));
    });
    const after = skipAfter;
    setSkipQueue(null);
    setSkipAfter(null);
    if (after) after();
  };

  const [selectedStyles, setSelectedStyles] = useState<RomanceStyleId[]>(['oriental', 'garden']);
  const [stylePanelOpen, setStylePanelOpen] = useState(false);
  const activeStyles = selectedStyles.length ? selectedStyles : ['oriental'];

  const ribbonCss = useMemo(() => {
    return Object.fromEntries(
      chapters.map((ch, ci) => {
        const styleId = activeStyles[ci % activeStyles.length];
        const gradients = CHAPTER_GRADIENTS_BY_STYLE[styleId];
        return [ch.num, gradients[ci % gradients.length]];
      }),
    ) as Record<string, string>;
  }, [activeStyles]);

  const romanticBg = useMemo(() => {
    const layers = [
      'radial-gradient(circle at 15% 18%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 24%)',
      'linear-gradient(180deg, #f8fbff 0%, #eef6ff 18%, #e9f5f1 36%, #f6efff 68%, #fff8f1 100%)',
    ];

    if (activeStyles.includes('oriental')) layers.unshift('radial-gradient(circle at 18% 12%, rgba(110,231,183,0.22) 0%, rgba(110,231,183,0) 28%)', 'radial-gradient(circle at 82% 28%, rgba(125,211,252,0.26) 0%, rgba(125,211,252,0) 26%)');
    if (activeStyles.includes('garden')) layers.unshift('radial-gradient(circle at 80% 16%, rgba(244,114,182,0.18) 0%, rgba(244,114,182,0) 24%)', 'radial-gradient(circle at 50% 40%, rgba(187,247,208,0.20) 0%, rgba(187,247,208,0) 30%)');
    if (activeStyles.includes('sunset')) layers.unshift('radial-gradient(circle at 40% 76%, rgba(251,191,36,0.20) 0%, rgba(251,191,36,0) 30%)');
    if (activeStyles.includes('moonlit')) layers.unshift('radial-gradient(circle at 86% 72%, rgba(129,140,248,0.20) 0%, rgba(129,140,248,0) 28%)');

    return layers.join(', ');
  }, [activeStyles]);

  const toggleStyle = (styleId: RomanceStyleId) => {
    setSelectedStyles((prev) => {
      if (prev.includes(styleId)) {
        return prev.length === 1 ? prev : prev.filter((id) => id !== styleId);
      }
      return [...prev, styleId];
    });
  };

  return (
    <div className="map-aurora relative min-h-screen overflow-hidden text-slate-900" style={{ backgroundImage: romanticBg }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-[8%] w-[360px] h-[360px] rounded-full bg-cyan-200/35 blur-[110px]" />
        <div className="absolute top-[12%] right-[6%] w-[320px] h-[320px] rounded-full bg-fuchsia-200/30 blur-[110px]" />
        <div className="absolute top-[46%] left-1/2 -translate-x-1/2 w-[560px] h-[220px] rounded-full bg-emerald-100/45 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[8%] w-[360px] h-[360px] rounded-full bg-amber-100/40 blur-[120px]" />
      </div>

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.22]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.7) 0.8px, transparent 0.8px), radial-gradient(rgba(255,255,255,0.45) 0.6px, transparent 0.6px)',
          backgroundSize: '26px 26px, 52px 52px',
          backgroundPosition: '0 0, 13px 13px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 92%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 92%)',
        }}
      />


      {/* 远景山脊（柔和淡彩剪影） */}
      <svg className="hidden sm:block absolute top-0 left-0 right-0 w-full h-[360px] pointer-events-none opacity-50" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mt1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fce7f3" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mt2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#cffafe" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,260 L120,160 L240,220 L380,120 L520,200 L660,140 L820,210 L960,150 L1100,220 L1200,180 L1200,360 L0,360 Z" fill="url(#mt2)" />
        <path d="M0,300 L160,230 L320,280 L460,210 L620,270 L780,220 L940,290 L1080,240 L1200,280 L1200,360 L0,360 Z" fill="url(#mt1)" />
      </svg>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-white/70 border-b border-white/60 shadow-[0_8px_24px_-16px_rgba(148,163,184,0.35)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center bg-gradient-to-br from-cyan-300 to-fuchsia-300 shadow-[0_8px_20px_-6px_rgba(165,180,252,0.55)]">
            <Compass className="w-5 h-5 text-white" strokeWidth={2.6} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-bold flex items-center gap-2 leading-tight text-slate-800 tracking-wide">
              <span className="truncate">求职闯关地图</span>
              <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-md bg-fuchsia-100/80 text-fuchsia-600 font-medium tracking-wide shrink-0 border border-fuchsia-200">AI 辅助</span>
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block font-pixel tracking-[0.25em] uppercase mt-0.5">QUEST · ZERO TO OFFER</p>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/70 text-slate-600 border border-white shadow-[inset_0_0_12px_rgba(255,255,255,0.6)]">
            <MapIcon className="w-3 h-3" />
            <span className="font-pixel text-[9px] tabular-nums">{availableCount}/{totalStages}</span>
          </div>

          <PlayerHub state={game} level={level} onUseItem={useItem} onClaim={claimDaily} />
        </div>
        {/* 分章节里程碑进度条 */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-2.5 pt-5">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <div
                className="absolute -top-5 z-10 pointer-events-none transition-[left] duration-700 ease-out"
                style={{ left: `calc(${progressPct}% - 14px)` }}
              >
                <div className="relative flex flex-col items-center">
                  <div className="mb-0.5 px-1.5 py-0.5 rounded-full bg-white/90 shadow-[0_2px_8px_rgba(165,180,252,0.45)] border border-white text-[9px] font-extrabold text-fuchsia-500 tabular-nums whitespace-nowrap leading-none">
                    {progressPct}%
                  </div>
                  <div
                    className="text-[18px] leading-none drop-shadow-[0_2px_6px_rgba(165,180,252,0.55)] animate-[mascot-walk_1.2s_ease-in-out_infinite]"
                    aria-hidden
                  >
                    {progressPct >= 100 ? '🏆' : progressPct >= 75 ? '🏃' : progressPct >= 25 ? '🚶' : '🐣'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {chapters.map((ch, ci) => {
                  const chImpl = ch.stages.filter(s => !s.comingSoon).length;
                  const chDone = ch.stages.filter(s => statuses[s.id] === 'done').length;
                  const pct = chImpl === 0 ? 0 : Math.round((chDone / chImpl) * 100);
                  const isCurrent = activeEntry?.ci === ci;
                  return (
                    <div key={ch.num} className="flex-1 min-w-0">
                      <div
                        className={cn(
                          'relative h-2 rounded-full overflow-hidden border border-white/80 bg-white/50',
                          isCurrent && 'border-fuchsia-300 shadow-[0_0_10px_rgba(232,121,249,0.35)]',
                        )}
                      >
                        <div
                          className="h-full transition-all"
                          style={{
                            width: chImpl === 0 ? '0%' : `${pct}%`,
                            backgroundImage: ribbonCss[ch.num],
                            boxShadow: '0 0 8px rgba(255,255,255,0.55) inset',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <span className="font-pixel text-[8px] text-slate-500 tabular-nums shrink-0">{doneCount}/{implementedTotal}</span>
          </div>
        </div>
      </header>

      {/* 下一步推荐 */}
      {nextRec && (
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-6">
          <button
            onClick={() => !nextRec.stage.comingSoon && nextRec.stage.to && navigate(nextRec.stage.to)}
            disabled={nextRec.stage.comingSoon || !nextRec.stage.to}
            className={cn(
              'group relative w-full text-left rounded-3xl p-[1.5px] overflow-hidden transition-all duration-300',
              !nextRec.stage.comingSoon && 'hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer',
              nextRec.stage.comingSoon && 'opacity-90 cursor-not-allowed',
            )}
            style={{ backgroundImage: ribbonCss[nextRec.chapter.num] || ribbonCss['01'] }}
          >
            <div
              className="relative rounded-[22px] p-5 overflow-hidden bg-white/80 backdrop-blur-xl"
              style={{
                backgroundImage: `${ribbonCss[nextRec.chapter.num] || ribbonCss['01']}, linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.92))`,
                backgroundBlendMode: 'soft-light, normal',
                boxShadow: '0 20px 60px -22px rgba(165,180,252,0.55), inset 0 1px 0 rgba(255,255,255,0.7)',
              }}
            >
              <div className="absolute -right-8 -top-8 text-[140px] leading-none opacity-[0.10] select-none pointer-events-none">{nextRec.chapter.emoji}</div>
              <div className="absolute right-4 bottom-3 font-pixel text-[8px] tracking-[0.25em] text-slate-500 select-none">▶ NEXT QUEST</div>
              <div className="relative flex items-start gap-4">
                <div
                  className="shrink-0 relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_10px_24px_-8px_rgba(165,180,252,0.55)]"
                  style={{ backgroundImage: ribbonCss[nextRec.chapter.num] || ribbonCss['01'] }}
                >
                  <nextRec.stage.icon className="w-8 h-8 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]" strokeWidth={2.4} />
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-amber-300 text-amber-900 text-[10px] font-extrabold border-2 border-white shadow">{nextRec.si + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase font-pixel">CH.{nextRec.chapter.num} · STAGE {nextRec.si + 1}</span>
                    {nextRec.stage.comingSoon && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-500 border border-slate-200">敬请期待</span>}
                  </div>
                  <h2 className="text-lg font-extrabold mt-1.5 leading-tight text-slate-800">{recHeadline}</h2>
                  <p className="text-sm font-semibold text-slate-700 mt-1">下一关：{nextRec.stage.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{recReason || nextRec.stage.desc}</p>
                  {!nextRec.stage.comingSoon && nextRec.stage.to && (
                    <div
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-xs font-extrabold shadow-[0_8px_20px_-6px_rgba(165,180,252,0.55)] group-hover:gap-2.5 transition-all"
                      style={{ backgroundImage: ribbonCss[nextRec.chapter.num] || ribbonCss['01'] }}
                    >
                      {doneCount === 0 ? '立即出发' : '继续闯关'}
                      <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ============ 游戏地图主体 ============ */}
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {chapters.map((ch, ci) => {
          const chDone = ch.stages.filter(s => statuses[s.id] === 'done').length;
          const chImpl = ch.stages.filter(s => !s.comingSoon).length;
          const chComplete = chImpl > 0 && chDone === chImpl;
          const NODE_GAP = 150;
          const sectionHeight = ch.stages.length * NODE_GAP + 60;
          const nodes = ch.stages.map((_, i) => ({
            x: NODE_X_PATTERN[i % NODE_X_PATTERN.length],
            y: 60 + i * NODE_GAP,
          }));

          let d = `M ${nodes[0].x} ${nodes[0].y}`;
          for (let i = 1; i < nodes.length; i++) {
            const p0 = nodes[i - 1], p1 = nodes[i];
            const cy = (p0.y + p1.y) / 2;
            d += ` C ${p0.x} ${cy}, ${p1.x} ${cy}, ${p1.x} ${p1.y}`;
          }

          return (
            <section key={ch.num} className="relative animate-fade-in" style={{ animationDelay: `${ci * 80}ms` }}>
              {/* 章节 Banner —— 游戏关卡 banner 风格 */}
              <div className="relative flex justify-center mb-2">
                <div
                  className="relative inline-flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full text-white"
                  style={{
                    backgroundImage: ribbonCss[ch.num],
                    boxShadow: '0 10px 28px -10px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08) inset, 0 0 24px rgba(255,255,255,0.08)',
                  }}
                >
                  <span className="w-8 h-8 rounded-full bg-white/30 ring-1 ring-white/60 text-white flex items-center justify-center text-lg shrink-0">
                    {ch.emoji}
                  </span>
                  <div className="leading-tight">
                    <p className="font-pixel text-[8px] tracking-[0.22em] text-white/80">CH.{ch.num}</p>
                    <h2 className="text-sm sm:text-base font-bold font-display-aurora drop-shadow-[0_1px_0_rgba(0,0,0,0.4)]">
                      第{['一','二','三','四','五','六','七'][ci]}章 · {ch.title}
                    </h2>
                  </div>
                  {chComplete && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 font-bold inline-flex items-center gap-0.5 shadow">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />通关
                    </span>
                  )}
                </div>
              </div>

              {/* 副标题 + 操作 */}
              <div className="flex items-center justify-center gap-2 flex-wrap mb-5">
                <p className="text-[12px] text-slate-500">{ch.subtitle}</p>
                {chImpl > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/70 backdrop-blur border border-white text-[10px] font-bold tabular-nums text-slate-600">
                    {chDone}/{chImpl}
                    <span className="w-10 h-1 rounded-full bg-slate-200 overflow-hidden inline-block">
                      <span className="block h-full" style={{ width: `${(chDone / chImpl) * 100}%`, backgroundImage: ribbonCss[ch.num] }} />
                    </span>
                  </span>
                )}
                {skipData[chapterIdOf(ch.num)] && !chComplete && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-bold inline-flex items-center gap-0.5">
                    <FastForward className="w-2.5 h-2.5" strokeWidth={3} />已跳过
                  </span>
                )}
                {!chComplete && (
                  <button
                    onClick={() => requestSkipChapter(chapterIdOf(ch.num), ch.title, ch.emoji)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/70 text-slate-600 text-[10px] font-bold hover:bg-white hover:scale-105 active:scale-95 transition-all border border-white whitespace-nowrap"
                  >
                    <FastForward className="w-2.5 h-2.5" strokeWidth={2.8} />跳过本章
                  </button>
                )}
              </div>

              {/* 游戏地图区域 */}
              <div className="relative" style={{ height: sectionHeight }}>
                {/* 散落的景物 —— 暗色画布上保持低饱和 */}
                {(isMobile ? ch.scenery.slice(0, 2) : ch.scenery).map((emo, i) => {
                  const seed = (ci * 13 + i * 37) % 100;
                  const left = 5 + ((seed * 7) % 85);
                  const top = 10 + ((seed * 11) % 80);
                  const size = isMobile ? 16 + ((seed * 2) % 8) : 18 + ((seed * 3) % 16);
                  return (
                    <span
                      key={i}
                      className="absolute select-none pointer-events-none opacity-25 sm:opacity-35"
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        fontSize: `${size}px`,
                        filter: 'grayscale(0.4) drop-shadow(0 0 6px rgba(255,255,255,0.15))',
                      }}
                    >{emo}</span>
                  );
                })}

                {/* 蜿蜒小径 —— 霓虹能量线 */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox={`0 0 100 ${sectionHeight}`}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id={`path-${ch.num}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5eead4" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.85" />
                    </linearGradient>
                    <filter id={`glow-${ch.num}`} x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="1.4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {/* 外层柔光 */}
                  <path d={d} fill="none" stroke="rgba(94, 234, 212, 0.18)" strokeWidth="9" strokeLinecap="round" />
                  {/* 主线条 */}
                  <path d={d} fill="none" stroke={`url(#path-${ch.num})`} strokeWidth="2.5" strokeLinecap="round" filter={`url(#glow-${ch.num})`} />
                  {/* 流动的能量碎片 */}
                  <path d={d} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="1" strokeLinecap="round" className="path-energy" />
                </svg>

                {/* 关卡节点 */}
                {ch.stages.map((st, si) => {
                  const status = statuses[st.id];
                  const isLocked = status === 'locked';
                  const isDone = status === 'done';
                  const isActive = status === 'active';
                  const node = nodes[si];
                  const labelLeft = node.x < 50;
                  return (
                    <div
                      key={st.id}
                      className="absolute"
                      style={{ left: `${node.x}%`, top: `${node.y}px`, transform: 'translate(-50%, -50%)' }}
                    >
                      <div className={cn('relative flex items-center', labelLeft ? 'flex-row' : 'flex-row-reverse')}>
                        <div className="relative shrink-0">
                          {/* active 节点：霓虹光晕 + 旋转金环 */}
                          {isActive && (
                            <>
                              <span className="absolute -inset-4 rounded-full blur-2xl animate-pulse bg-emerald-400/40" />
                              <span className="node-ring-shine" />
                              <span className="sparkle absolute -top-2 -right-2 text-[14px] select-none" aria-hidden>✨</span>
                              <span className="sparkle absolute -bottom-1 -left-2 text-[12px] select-none" style={{ animationDelay: '0.8s' }} aria-hidden>⭐</span>
                            </>
                          )}
                          {/* 底座阴影 */}
                          <span className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-14 h-2 rounded-full bg-black/60 blur-md" />

                          <button
                            onClick={() => !isLocked && st.to && navigate(st.to)}
                            disabled={isLocked || !st.to}
                            className={cn(
                              'relative w-[68px] h-[68px] sm:w-[84px] sm:h-[84px] rounded-full flex items-center justify-center transition-all duration-300',
                              'border-[3px]',
                              isLocked
                                ? 'border-white/80 bg-gradient-to-br from-slate-100 to-slate-200 cursor-not-allowed'
                                : cn('border-white/85 bg-gradient-to-br hover:scale-110 hover:-rotate-6 active:scale-95 cursor-pointer', ch.nodeBg),
                              isActive && 'ring-[3px] ring-amber-300 ring-offset-2 ring-offset-white',
                            )}
                            style={{
                              boxShadow: isLocked
                                ? 'inset 0 2px 0 rgba(255,255,255,0.5), 0 6px 14px -4px rgba(148,163,184,0.35)'
                                : '0 14px 30px -8px rgba(148,163,184,0.45), inset 0 -5px 0 rgba(0,0,0,0.18), inset 0 3px 0 rgba(255,255,255,0.55), 0 0 22px rgba(165,180,252,0.25)',
                            }}
                            title={st.title}
                          >
                            {!isLocked && (
                              <span className="absolute top-1.5 left-3 w-5 h-3 rounded-full bg-white/70 blur-[2px] rotate-[-20deg] pointer-events-none" />
                            )}
                            {isLocked ? (
                              <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" strokeWidth={2.4} />
                            ) : (
                              <st.icon
                                className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
                                strokeWidth={2.2}
                              />
                            )}
                            {/* 序号徽章 */}
                            <span className={cn(
                              'absolute -top-2 -left-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-fuchsia-500 text-[11px] sm:text-[12px] font-extrabold flex items-center justify-center shadow border-2 border-fuchsia-200 font-pixel',
                              isLocked && 'opacity-70 text-slate-400 border-slate-200',
                            )}>
                              {si + 1}
                            </span>
                            {isDone && (
                              <span className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-400 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.4)] border-2 border-white">
                                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={3.5} />
                              </span>
                            )}
                            {isActive && (
                              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-300 text-amber-900 shadow-[0_4px_14px_rgba(251,191,36,0.5)] border-2 border-white whitespace-nowrap animate-bounce font-pixel tracking-wider">
                                GO!
                              </span>
                            )}
                          </button>
                        </div>

                        {/* 关卡名片 —— 柔和浅色玻璃 */}
                        <div className={cn(
                          'mx-2 sm:mx-2.5 w-[44vw] max-w-[180px] sm:w-[200px] rounded-2xl px-3 py-2 backdrop-blur-md border transition-all',
                          isLocked
                            ? 'bg-white/55 border-white/70'
                            : isActive
                              ? 'bg-white/85 border-fuchsia-200 shadow-[0_8px_24px_-10px_rgba(232,121,249,0.45)]'
                              : 'bg-white/75 border-white',
                          labelLeft ? 'text-left' : 'text-right',
                        )}>
                          <p className={cn(
                            'text-[12px] sm:text-[13px] font-bold leading-snug font-display-aurora break-words',
                            isLocked ? 'text-slate-400' : 'text-slate-800',
                          )}>
                            {st.title}
                          </p>
                          <p className="text-[10px] text-slate-500 leading-snug mt-0.5 break-words">
                            {isLocked && !st.comingSoon ? '完成上一关后开启' : st.desc}
                          </p>
                          <div className={cn('flex items-center gap-1 mt-1 flex-wrap', labelLeft ? 'justify-start' : 'justify-end')}>
                            {st.comingSoon && <span className="text-[9px] px-1 py-0.5 rounded font-bold bg-slate-100 text-slate-500 border border-slate-200">敬请期待</span>}
                          </div>
                          {isLocked && (
                            <button
                              onClick={() => setStageSkipTarget({ stageId: st.id, stageTitle: st.title, ci, si })}
                              className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                              style={{ backgroundImage: ribbonCss[ch.num] }}
                            >
                              <ChevronsRight className="w-3 h-3" strokeWidth={3} />
                              {st.comingSoon ? '跳过到这关' : '跳到这关'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 章节衔接装饰 */}
              {ci < chapters.length - 1 && ci !== 3 && (
                <div className="flex justify-center my-2">
                  <div className="flex items-center gap-1.5 opacity-60">
                    <span className="w-1 h-1 rounded-full bg-emerald-400/40" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                    <span className="w-1 h-1 rounded-full bg-emerald-400/40" />
                  </div>
                </div>
              )}

              {/* Offer 里程碑 */}
              {ci === 3 && (
                <div className="relative my-8 animate-fade-in">
                  <div
                    className={cn(
                      'relative overflow-hidden rounded-[28px] p-6 sm:p-8 text-center border backdrop-blur-xl transition-all',
                      doneCount >= 9
                        ? 'bg-white/80 border-amber-200 shadow-[0_20px_60px_-24px_rgba(251,191,36,0.55)]'
                        : 'bg-white/70 border-white',
                    )}
                  >
                    <div className="absolute inset-0 pointer-events-none opacity-60">
                      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-amber-200/40 blur-3xl" />
                    </div>
                    <div className="relative inline-flex items-center justify-center mb-3">
                      <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-[0_12px_28px_-8px_rgba(251,191,36,0.55)]">
                        <Trophy className="w-10 h-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]" strokeWidth={2.4} />
                      </div>
                    </div>
                    <p className="text-[10px] font-bold tracking-[0.35em] text-amber-500 mb-1 font-pixel">MILESTONE · OFFER GET</p>
                    <h3 className="text-xl sm:text-2xl font-bold font-display-aurora text-slate-800">拿下心仪 Offer</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                      恭喜走完求职路。<span className="font-semibold text-slate-700">Offer 不是终点，是新故事的起点</span>——接下来还有入职、文化、长期成长在等你。
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-[11px] font-semibold text-amber-700">
                      <ChevronsRight className="w-3 h-3" strokeWidth={3} />
                      新征程开启
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}

        {/* 系列终点 */}
        <section className="relative mt-10">
          <div className="relative overflow-hidden rounded-[28px] p-8 text-center border border-white bg-white/75 backdrop-blur-xl shadow-[0_20px_60px_-24px_rgba(165,180,252,0.45)]">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-emerald-200/35 blur-3xl" />
            </div>
            <div className="relative text-5xl mb-1">🏰</div>
            <div className="relative text-3xl mb-2">🌳</div>
            <h3 className="relative text-xl font-bold font-display-aurora text-slate-800">成为更好的自己</h3>
            <p className="relative text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
              {doneCount === implementedTotal && implementedTotal > 0
                ? '已开放的关卡全部通关 后续章节正在打磨中，敬请期待'
                : '从认识自己到长期成长，一关一关，慢慢来。'}
            </p>
          </div>
        </section>

        {/* Mobile reset */}
        {(doneCount > 0 || game.xp > 0) && (
          <div className="sm:hidden flex justify-center pt-6">
            <button
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs text-slate-500 hover:text-slate-800 bg-white/70 border border-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置闯关进度
            </button>
          </div>
        )}
      </div>

      {skipQueue && (
        <ChapterSkipDialog
          open={!!skipQueue}
          onOpenChange={(o) => { if (!o) { setSkipQueue(null); setSkipAfter(null); } }}
          chapters={skipQueue}
          onConfirm={handleSkipWizardConfirm}
        />
      )}

      <AlertDialog open={!!stageSkipTarget} onOpenChange={(o) => { if (!o) setStageSkipTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ChevronsRight className="w-5 h-5 text-emerald-500" />
              直接跳到「{stageSkipTarget?.stageTitle}」？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              将会把前面 <b className="text-foreground">{stageSkipTarget ? stagesToSkipBefore(stageSkipTarget.stageId).length : 0}</b> 关标记为完成，并直接进入这一关。
              {stageSkipTarget && (() => {
                const tCh = chapters.find(c => c.stages.some(s => s.id === stageSkipTarget.stageId));
                const q = tCh ? buildSkipQueue(chapterIdOf(tCh.num), false) : [];
                return q.length > 0 ? (
                  <>
                    <br />
                    <span className="text-emerald-700">下一步将依次补齐 {q.length} 个前置章节的关键材料（{q.map(x => x.title).join(' / ')}），AI 会用它们驱动后续关卡。</span>
                  </>
                ) : null;
              })()}
              <br />
              <span className="text-amber-600">注意：跳过的关卡不会获得通关 XP 与首通奖励。</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>再想想</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStageSkip} className="bg-emerald-700 hover:bg-emerald-800 text-white">
              确认跳过
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 浮动风格按钮 */}
      <button
        onClick={() => setStylePanelOpen(true)}
        className="fixed z-40 bottom-5 left-5 group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white/85 backdrop-blur-xl border border-white/60 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.45)] hover:shadow-[0_14px_40px_-10px_rgba(236,72,153,0.55)] hover:-translate-y-0.5 transition-all"
        aria-label="切换浪漫风格"
      >
        <span
          className="relative w-7 h-7 rounded-full flex items-center justify-center text-white shadow-inner"
          style={{
            backgroundImage:
              'conic-gradient(from 210deg, #7dd3fc, #c4b5fd, #f9a8d4, #fde68a, #6ee7b7, #7dd3fc)',
          }}
        >
          <Palette className="w-3.5 h-3.5 drop-shadow" strokeWidth={2.5} />
        </span>
        <span className="text-[12px] font-bold tracking-wide text-slate-700">
          风格 <span className="text-slate-400 font-medium">·</span>{' '}
          <span className="tabular-nums text-fuchsia-600">{selectedStyles.length}</span>
          <span className="text-slate-400">/{ROMANCE_STYLES.length}</span>
        </span>
      </button>

      {/* 风格预览面板 */}
      <Dialog open={stylePanelOpen} onOpenChange={setStylePanelOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-0 bg-gradient-to-br from-white via-slate-50 to-fuchsia-50/50">
          <div className="px-6 pt-6 pb-2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-fuchsia-500" />
                选择你的浪漫风格
                <span className="ml-auto text-[11px] font-medium text-slate-500">
                  支持多选 · 已选 <b className="text-fuchsia-600 tabular-nums">{selectedStyles.length}</b>
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                点击卡片预览效果，多选会自动融合背景与章节飘带配色。
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-6 pb-6 max-h-[70vh] overflow-y-auto">
            {ROMANCE_STYLES.map((style) => {
              const selected = selectedStyles.includes(style.id);
              const grads = CHAPTER_GRADIENTS_BY_STYLE[style.id];
              const previewBg = STYLE_PREVIEW_BG[style.id];
              return (
                <button
                  key={style.id}
                  onClick={() => toggleStyle(style.id)}
                  className={cn(
                    'group relative text-left rounded-2xl overflow-hidden transition-all duration-300 border-2',
                    selected
                      ? 'border-fuchsia-400 shadow-[0_18px_40px_-16px_rgba(236,72,153,0.55)] -translate-y-0.5'
                      : 'border-white/80 hover:border-fuchsia-200 hover:-translate-y-0.5 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.15)]',
                  )}
                >
                  {/* 预览舞台 */}
                  <div
                    className="relative h-36 overflow-hidden"
                    style={{ backgroundImage: previewBg }}
                  >
                    {/* 山脊剪影 */}
                    <svg className="absolute bottom-0 left-0 right-0 w-full h-16 opacity-70" viewBox="0 0 200 60" preserveAspectRatio="none">
                      <path d="M0,40 L30,22 L60,32 L100,14 L140,28 L180,18 L200,30 L200,60 L0,60 Z" fill="rgba(255,255,255,0.45)" />
                      <path d="M0,48 L40,34 L80,42 L120,28 L160,40 L200,32 L200,60 L0,60 Z" fill="rgba(255,255,255,0.7)" />
                    </svg>
                    {/* 飘带 swatch */}
                    <div className="absolute top-3 left-3 right-3 flex flex-col gap-1.5">
                      <div className="h-2 rounded-full" style={{ backgroundImage: grads[0], boxShadow: 'inset 0 0 6px rgba(255,255,255,0.5)' }} />
                      <div className="h-2 rounded-full w-3/4" style={{ backgroundImage: grads[2], boxShadow: 'inset 0 0 6px rgba(255,255,255,0.5)' }} />
                    </div>
                    {/* 节点示例 */}
                    <div className="absolute bottom-3 left-6 flex items-center gap-2">
                      <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 ring-2 ring-white/80 shadow-[0_6px_14px_-4px_rgba(16,185,129,0.6)] flex items-center justify-center text-white">
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </div>
                      <div className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white" style={{ backgroundImage: grads[1] }}>
                        CH.01
                      </div>
                    </div>
                    {/* emoji 装饰 */}
                    <div className="absolute bottom-2 right-3 text-2xl drop-shadow-sm">
                      {style.emoji}
                    </div>
                    {/* 选中徽标 */}
                    {selected && (
                      <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-fuchsia-500 text-white flex items-center justify-center shadow-lg ring-2 ring-white animate-scale-in">
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  {/* 文案 */}
                  <div className="px-3.5 py-2.5 bg-white/95 backdrop-blur flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                        <span>{style.label}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{style.hint}</div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 text-[10px] font-bold px-2 py-1 rounded-full transition-colors',
                        selected
                          ? 'bg-fuchsia-100 text-fuchsia-700'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-fuchsia-50 group-hover:text-fuchsia-600',
                      )}
                    >
                      {selected ? '已选' : '点击应用'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-6 pb-5 pt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>至少保留 1 个风格 · 多选会融合渐变</span>
            <button
              onClick={() => setStylePanelOpen(false)}
              className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-bold shadow hover:bg-slate-800 transition-colors"
            >
              完成
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
