import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, BrainCircuit, Crosshair, Newspaper, PenLine, Lightbulb, Building2, BotMessageSquare, Rocket, MailPlus, ScissorsLineDashed, MessagesSquare, Mic, Lock, Check, ChevronRight, Map as MapIcon, RotateCcw, FastForward, ChevronsRight, Briefcase, CalendarCheck2, Handshake, GraduationCap, Users, Presentation, ShieldCheck, TrendingUp, Coins, GitBranch, Trophy, Sparkles } from 'lucide-react';
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
      { id: 'assess', title: '性格 & 能力测评', desc: '8-12 题点选,5-10 分钟', icon: BrainCircuit, emoji: '🧠', to: '/career', priority: 'P0' },
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

// 统一 ribbon 渐变（深墨绿，避免生产 purge）
const UNIFIED_RIBBON_CSS = 'linear-gradient(135deg, #047857 0%, #064e3b 100%)';
const RIBBON_CSS: Record<string, string> = {
  '01': UNIFIED_RIBBON_CSS, '02': UNIFIED_RIBBON_CSS, '03': UNIFIED_RIBBON_CSS,
  '04': UNIFIED_RIBBON_CSS, '05': UNIFIED_RIBBON_CSS, '06': UNIFIED_RIBBON_CSS,
  '07': UNIFIED_RIBBON_CSS,
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



  return (
    <div className="map-aurora relative min-h-screen overflow-hidden bg-[#f7f6f1]">
      {/* 远景：山峦 SVG（桌面端，移动端为了简洁隐藏） */}
      <svg className="hidden sm:block absolute top-0 left-0 right-0 w-full h-[360px] pointer-events-none opacity-60" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mt1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="mt2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path d="M0,260 L120,160 L240,220 L380,120 L520,200 L660,140 L820,210 L960,150 L1100,220 L1200,180 L1200,360 L0,360 Z" fill="url(#mt1)" />
        <path d="M0,300 L160,230 L320,280 L460,210 L620,270 L780,220 L940,290 L1080,240 L1200,280 L1200,360 L0,360 Z" fill="url(#mt2)" />
      </svg>

      {/* 移动端：极淡的中性光斑（去鲜艳色） */}
      <div className="sm:hidden absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] -left-10 w-48 h-48 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute top-[55%] -right-12 w-56 h-56 rounded-full bg-stone-200/50 blur-3xl" />
        <div className="absolute bottom-[8%] -left-8 w-48 h-48 rounded-full bg-emerald-50/60 blur-3xl" />
      </div>


      {/* 浮云装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[8%] left-[6%] text-2xl opacity-30 animate-[float_8s_ease-in-out_infinite]">☁️</div>
        <div className="absolute top-[14%] right-[10%] text-3xl opacity-25 animate-[float_10s_ease-in-out_infinite]" style={{ animationDelay: '1.5s' }}>☁️</div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[#f7f6f1]/85 border-b border-stone-200/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center bg-emerald-700 shadow-sm">
            <Compass className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-semibold flex items-center gap-2 leading-tight text-foreground">
              <span className="truncate">求职闯关地图</span>
              <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium tracking-wide shrink-0 border border-emerald-100">AI 辅助</span>
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">从认识自己到拿下 offer，一关一关来</p>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border/60 shadow-sm">
            <MapIcon className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-semibold tabular-nums text-foreground">{availableCount}/{totalStages}</span>
          </div>
          {/* 认领助理入口已并入第一章关卡 */}
          <PlayerHub state={game} level={level} onUseItem={useItem} onClaim={claimDaily} />
          {/* 重置按钮已隐藏 */}
        </div>
        {/* 分章节里程碑进度条 */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-2.5 pt-5">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              {/* 走在进度条上的小伙伴 */}
              <div
                className="absolute -top-5 z-10 pointer-events-none transition-[left] duration-700 ease-out"
                style={{ left: `calc(${progressPct}% - 14px)` }}
              >
                <div className="relative flex flex-col items-center">
                  {/* 气泡：百分比 */}
                  <div className="mb-0.5 px-1.5 py-0.5 rounded-full bg-white shadow-md border border-emerald-200 text-[9px] font-extrabold text-emerald-600 tabular-nums whitespace-nowrap leading-none">
                    {progressPct}%
                  </div>
                  {/* 走路的小角色 */}
                  <div
                    className="text-[18px] leading-none drop-shadow-[0_2px_3px_rgba(16,185,129,0.45)] animate-[mascot-walk_1.2s_ease-in-out_infinite]"
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
                      <div className={cn('h-2 rounded-full overflow-hidden bg-emerald-100/70 relative', isCurrent && 'ring-2 ring-offset-1 ring-emerald-300 ring-offset-background')}>
                        <div className="h-full transition-all" style={{ width: chImpl === 0 ? '0%' : `${pct}%`, backgroundImage: RIBBON_CSS[ch.num] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground tabular-nums shrink-0">{doneCount}/{implementedTotal} · {progressPct}%</span>
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
              'group relative w-full text-left rounded-3xl p-5 overflow-hidden transition-all duration-300',
              'text-white shadow-[0_18px_50px_-18px_rgba(16,185,129,0.5)]',
              !nextRec.stage.comingSoon && 'hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer',
              nextRec.stage.comingSoon && 'opacity-90 cursor-not-allowed'
            )}
            style={{ backgroundImage: RIBBON_CSS[nextRec.chapter.num] || RIBBON_CSS['01'] }}
          >
            <div className="absolute -right-8 -top-8 text-[140px] leading-none opacity-15 select-none pointer-events-none">{nextRec.chapter.emoji}</div>
            <div className="absolute right-4 bottom-3 text-[10px] font-bold tracking-[0.2em] opacity-60 select-none">NEXT STEP</div>
            <div className="relative flex items-start gap-4">
              <div className="shrink-0 relative w-16 h-16 rounded-2xl bg-white/95 flex items-center justify-center shadow-lg">
                <nextRec.stage.icon className="w-8 h-8 text-foreground/90" strokeWidth={2.2} />
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-white text-foreground text-[10px] font-extrabold border border-white shadow-sm">{nextRec.si + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold tracking-[0.18em] opacity-90 uppercase">推荐 · 第{['一','二','三','四','五','六','七'][nextRec.ci]}章 · 第 {nextRec.si + 1} 关</span>
                  {nextRec.stage.comingSoon && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-white/25 backdrop-blur">敬请期待</span>}
                </div>
                <h2 className="text-lg font-extrabold mt-1.5 leading-tight">{recHeadline}</h2>
                <p className="text-sm font-bold opacity-95 mt-1">下一关：{nextRec.stage.title}</p>
                <p className="text-xs opacity-90 mt-1 leading-relaxed">{recReason || nextRec.stage.desc}</p>
                {!nextRec.stage.comingSoon && nextRec.stage.to && (
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-foreground text-xs font-bold shadow-sm group-hover:gap-2.5 transition-all">
                    {doneCount === 0 ? '立即出发' : '继续闯关'}
                    <ChevronRight className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>
                )}
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
          // 节点高度间距
          const NODE_GAP = 150; // px
          const sectionHeight = ch.stages.length * NODE_GAP + 60;
          const nodes = ch.stages.map((_, i) => ({
            x: NODE_X_PATTERN[i % NODE_X_PATTERN.length],
            y: 60 + i * NODE_GAP,
          }));

          // 构建蜿蜒路径 d
          let d = `M ${nodes[0].x} ${nodes[0].y}`;
          for (let i = 1; i < nodes.length; i++) {
            const p0 = nodes[i - 1], p1 = nodes[i];
            const cy = (p0.y + p1.y) / 2;
            d += ` C ${p0.x} ${cy}, ${p1.x} ${cy}, ${p1.x} ${p1.y}`;
          }

          return (
            <section key={ch.num} className="relative animate-fade-in" style={{ animationDelay: `${ci * 80}ms` }}>
              {/* 章节 Ribbon 飘带 */}
              <div className="relative flex justify-center mb-2">
                <div
                  className={cn(
                    'relative inline-flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full text-white shadow-lg',
                    ch.ribbonShadow
                  )}
                  style={{ backgroundImage: RIBBON_CSS[ch.num] }}
                >
                  {/* 左圆章 */}
                  <span className="w-8 h-8 rounded-full bg-white/95 text-foreground flex items-center justify-center text-lg shadow-inner shrink-0">
                    {ch.emoji}
                  </span>
                  <div className="leading-tight">
                    <p className="text-[9px] font-bold tracking-[0.25em] opacity-90 font-display-aurora">CHAPTER {ch.num}</p>
                    <h2 className="text-sm sm:text-base font-bold font-display-aurora">第{['一','二','三','四','五','六','七'][ci]}章 · {ch.title}</h2>
                  </div>
                  {chComplete && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/30 backdrop-blur font-bold inline-flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />通关
                    </span>
                  )}
                </div>
              </div>

              {/* 副标题 + 操作 */}
              <div className="flex items-center justify-center gap-2 flex-wrap mb-5">
                <p className="text-[12px] text-muted-foreground">{ch.subtitle}</p>
                {chImpl > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/70 backdrop-blur border border-white text-[10px] font-bold tabular-nums text-foreground shadow-sm">
                    {chDone}/{chImpl}
                    <span className="w-10 h-1 rounded-full bg-muted overflow-hidden inline-block">
                      <span className="block h-full" style={{ width: `${(chDone / chImpl) * 100}%`, backgroundImage: RIBBON_CSS[ch.num] }} />
                    </span>
                  </span>
                )}
                {skipData[chapterIdOf(ch.num)] && !chComplete && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold inline-flex items-center gap-0.5">
                    <FastForward className="w-2.5 h-2.5" strokeWidth={3} />已跳过
                  </span>
                )}
                {!chComplete && (
                  <button
                    onClick={() => requestSkipChapter(chapterIdOf(ch.num), ch.title, ch.emoji)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-foreground text-[10px] font-bold hover:scale-105 active:scale-95 transition-all border border-border/40 shadow-sm whitespace-nowrap"
                  >
                    <FastForward className="w-2.5 h-2.5" strokeWidth={2.8} />跳过本章
                  </button>
                )}
              </div>

              {/* 游戏地图区域（无外框，散落景物 + 蜿蜒小径 + 节点） */}
              <div className="relative" style={{ height: sectionHeight }}>
                {/* 散落的景物（移动端只保留 2 个，避免拥挤） */}
                {(isMobile ? ch.scenery.slice(0, 2) : ch.scenery).map((emo, i) => {
                  const seed = (ci * 13 + i * 37) % 100;
                  const left = 5 + ((seed * 7) % 85);
                  const top = 10 + ((seed * 11) % 80);
                  const size = isMobile ? 16 + ((seed * 2) % 8) : 18 + ((seed * 3) % 16);
                  return (
                    <span
                      key={i}
                      className="absolute select-none pointer-events-none opacity-40 sm:opacity-60"
                      style={{ left: `${left}%`, top: `${top}%`, fontSize: `${size}px` }}
                    >{emo}</span>
                  );
                })}


                {/* 蜿蜒小径 SVG */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox={`0 0 100 ${sectionHeight}`}
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id={`path-${ch.num}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#fef3c7" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>
                  <path d={d} fill="none" stroke="rgba(120, 113, 108, 0.18)" strokeWidth="6" strokeLinecap="round" transform="translate(0.3, 1)" />
                  <path d={d} fill="none" stroke={`url(#path-${ch.num})`} strokeWidth="5" strokeLinecap="round" />
                  <path d={d} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round" strokeDasharray="0.5 3" />
                </svg>

                {/* 关卡节点 */}
                {ch.stages.map((st, si) => {
                  const status = statuses[st.id];
                  const isLocked = status === 'locked';
                  const isDone = status === 'done';
                  const isActive = status === 'active';
                  const node = nodes[si];
                  const labelLeft = node.x < 50; // 节点在左侧时，名片放在右边（labelLeft 指名片在左侧的位置）
                  return (
                    <div
                      key={st.id}
                      className="absolute"
                      style={{ left: `${node.x}%`, top: `${node.y}px`, transform: 'translate(-50%, -50%)' }}
                    >
                      <div className={cn('relative flex items-center', labelLeft ? 'flex-row' : 'flex-row-reverse')}>
                        {/* 软糖式 emoji 节点 */}
                        <div className="relative shrink-0">
                          {/* 外层光晕（active） */}
                          {isActive && (
                            <span className={cn('absolute -inset-3 rounded-full blur-2xl animate-pulse', ch.nodeHalo)} />
                          )}
                          {/* 节点底座阴影（悬浮感） */}
                          <span className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-14 h-2 rounded-full bg-black/15 blur-md" />
                          <button
                            onClick={() => !isLocked && st.to && navigate(st.to)}
                            disabled={isLocked || !st.to}
                            className={cn(
                              'relative w-[68px] h-[68px] sm:w-[84px] sm:h-[84px] rounded-full flex items-center justify-center transition-all duration-300',
                              'border-[5px] border-white',
                              isLocked
                                ? 'bg-gradient-to-br from-slate-100 to-slate-200 cursor-not-allowed'
                                : cn('bg-gradient-to-br hover:scale-110 hover:-rotate-6 active:scale-95 cursor-pointer', ch.nodeBg),
                              isActive && 'ring-[3px] ring-amber-300/90 ring-offset-2 ring-offset-transparent'
                            )}
                            style={{
                              boxShadow: isLocked
                                ? '0 6px 14px -4px rgba(0,0,0,0.15)'
                                : '0 12px 28px -6px rgba(0,0,0,0.28), inset 0 -4px 0 rgba(0,0,0,0.10), inset 0 3px 0 rgba(255,255,255,0.7)',
                            }}
                            title={st.title}
                          >
                            {/* 高光 */}
                            {!isLocked && (
                              <span className="absolute top-1.5 left-3 w-5 h-3 rounded-full bg-white/70 blur-[2px] rotate-[-20deg] pointer-events-none" />
                            )}
                            {/* 内容图标 / lock */}
                            {isLocked ? (
                              <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" strokeWidth={2.4} />
                            ) : (
                              <st.icon
                                className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]"
                                strokeWidth={2.2}
                              />
                            )}
                            {/* 序号徽章 */}
                            <span className={cn(
                              'absolute -top-2 -left-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white text-foreground text-[11px] sm:text-[12px] font-extrabold flex items-center justify-center shadow border-2 border-white font-display-aurora',
                              isLocked && 'opacity-70'
                            )}>
                              {si + 1}
                            </span>
                            {/* 完成 */}
                            {isDone && (
                              <span className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow border-2 border-white">
                                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={3.5} />
                              </span>
                            )}
                            {/* GO 标签 */}
                            {isActive && (
                              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950 shadow border-2 border-white whitespace-nowrap animate-bounce">
                                GO!
                              </span>
                            )}
                          </button>
                        </div>

                        {/* 关卡名片 */}
                        <div className={cn(
                          'mx-2 sm:mx-2.5 w-[44vw] max-w-[180px] sm:w-[200px] rounded-2xl px-3 py-2 backdrop-blur-md border transition-all',
                          isLocked
                            ? 'bg-white/35 border-white/40 shadow-[0_4px_12px_-3px_rgba(0,0,0,0.05)]'
                            : isActive
                              ? 'bg-white/85 border-white shadow-[0_8px_20px_-4px_rgba(16,185,129,0.25)]'
                              : 'bg-white/70 border-white/60 shadow-[0_4px_12px_-3px_rgba(0,0,0,0.08)]',
                          labelLeft ? 'text-left' : 'text-right'
                        )}>
                          <p className={cn('text-[12px] sm:text-[13px] font-bold leading-snug font-display-aurora break-words', isLocked ? 'text-muted-foreground' : 'text-foreground')}>
                            {st.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 break-words">
                            {isLocked && !st.comingSoon ? '完成上一关后开启' : st.desc}
                          </p>
                          <div className={cn('flex items-center gap-1 mt-1 flex-wrap', labelLeft ? 'justify-start' : 'justify-end')}>
                            {st.comingSoon && <span className="text-[9px] px-1 py-0.5 rounded font-bold bg-slate-100 text-slate-500">敬请期待</span>}
                          </div>
                          {isLocked && (
                            <button
                              onClick={() => setStageSkipTarget({ stageId: st.id, stageTitle: st.title, ci, si })}
                              className={cn(
                                'mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm hover:scale-105 active:scale-95 transition-all bg-gradient-to-r whitespace-nowrap',
                                ch.ribbon,
                              )}
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
                  <div className="flex items-center gap-1.5 opacity-50">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span className="w-2 h-2 rounded-full bg-violet-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                    <span className="w-1 h-1 rounded-full bg-rose-400" />
                  </div>
                </div>
              )}

              {/* 🎉 Offer 里程碑（Ch4 之后、Ch5 之前注入） */}
              {ci === 3 && (
                <div className="relative my-8 animate-fade-in">
                  <div className={cn(
                    'relative overflow-hidden rounded-[28px] p-6 sm:p-8 text-center border border-white/70 backdrop-blur-xl transition-all',
                    doneCount >= 9
                      ? 'bg-gradient-to-br from-amber-200/90 via-rose-200/85 to-violet-200/90 shadow-[0_20px_60px_-15px_rgba(168,85,247,0.45)]'
                      : 'bg-gradient-to-br from-amber-100/70 via-rose-100/60 to-violet-100/70 shadow-[0_14px_40px_-15px_rgba(244,114,182,0.3)] opacity-95'
                  )}>
                    <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-amber-200/50 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-violet-300/40 blur-3xl pointer-events-none" />
                    <div className="absolute top-3 right-4 flex gap-1 pointer-events-none">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                      <Sparkles className="w-3 h-3 text-rose-400 animate-pulse" style={{ animationDelay: '0.6s' }} />
                    </div>
                    <div className="relative inline-flex items-center justify-center mb-3">
                      <div className="absolute inset-0 bg-amber-300/40 rounded-full blur-2xl" />
                      <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-300 to-rose-400 flex items-center justify-center shadow-xl border-4 border-white">
                        <Trophy className="w-10 h-10 text-white drop-shadow-md" strokeWidth={2.2} />
                      </div>
                    </div>
                    <p className="text-[10px] font-bold tracking-[0.3em] text-rose-500/80 mb-1 font-display-aurora">MILESTONE · OFFER GET</p>
                    <h3 className="text-xl sm:text-2xl font-bold font-display-aurora aurora-text">拿下心仪 Offer 🎉</h3>
                    <p className="text-xs sm:text-sm text-foreground/70 mt-2 max-w-sm mx-auto leading-relaxed">
                      恭喜走完求职路。<span className="font-bold text-foreground">Offer 不是终点，是新故事的起点</span>——接下来还有入职、文化、长期成长在等你。
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur border border-white text-[11px] font-bold text-rose-600">
                      <ChevronsRight className="w-3 h-3" strokeWidth={3} />
                      新征程开启
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}


        {/* 系列终点：成为更好的自己 */}
        <section className="relative mt-10">
          <div className="relative overflow-hidden rounded-[28px] p-8 text-center border border-white/70 backdrop-blur-xl bg-gradient-to-br from-emerald-100/70 via-cyan-100/60 to-violet-100/70 shadow-[0_14px_40px_-15px_rgba(6,182,212,0.35)]">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-violet-300/30 blur-3xl pointer-events-none" />
            <div className="text-5xl mb-1">🏰</div>
            <div className="text-3xl mb-2">🌳✨</div>
            <h3 className="text-xl font-bold font-display-aurora aurora-text">成为更好的自己</h3>
            <p className="text-sm text-foreground/70 mt-2 max-w-sm mx-auto leading-relaxed">
              {doneCount === implementedTotal && implementedTotal > 0
                ? '已开放的关卡全部通关 🎊 后续章节正在打磨中，敬请期待～'
                : '从认识自己到长期成长，一关一关，慢慢来。'}
            </p>
          </div>
        </section>


        {/* Mobile reset */}
        {(doneCount > 0 || game.xp > 0) && (
          <div className="sm:hidden flex justify-center pt-6">
            <button
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs text-muted-foreground hover:text-foreground bg-card border border-border/60"
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
            <AlertDialogAction onClick={confirmStageSkip} className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 text-white">
              确认跳过
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
