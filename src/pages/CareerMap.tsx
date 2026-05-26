import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Target, FileSearch, FileText, Lightbulb, Building2, Bot, Sparkles, Send, Scissors, MessageSquare, Mic, Lock, Check, ChevronRight, Map as MapIcon, RotateCcw, FastForward } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useQuestProgress } from '@/hooks/useQuestProgress';
import { useGameProgress, CHAPTER_STAGES, type ItemId, type DailyTaskId } from '@/hooks/useGameProgress';
import { useChapterSkip, type ChapterId, type SkipPayload } from '@/hooks/useChapterSkip';
import ChapterSkipDialog from '@/components/career/ChapterSkipDialog';
import PlayerHub from '@/components/career/PlayerHub';
import { toast } from '@/hooks/use-toast';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';

type StageStatus = 'done' | 'active' | 'available' | 'locked';

type StageDef = {
  id: string;
  title: string;
  desc: string;
  icon: any;
  to?: string;
  comingSoon?: boolean;
  priority?: 'P0' | 'P1';
};

type Chapter = {
  num: string;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  signColor: string;       // 区域牌颜色
  scenery: string[];       // 该区域散落的景物 emoji
  stages: StageDef[];
};

const chapters: Chapter[] = [
  {
    num: '01',
    title: '认识自己',
    subtitle: '搞清楚我是谁、我适合什么',
    emoji: '🧭',
    gradient: 'from-emerald-400 via-teal-400 to-cyan-500',
    signColor: 'from-emerald-500 to-teal-600',
    scenery: ['🌿', '🍄', '🌱', '🦋', '🌸'],
    stages: [
      { id: 'assess', title: '性格 & 能力测评', desc: '8-12 题点选,5-10 分钟', icon: Compass, to: '/career', priority: 'P0' },
      { id: 'recommend', title: '岗位推荐', desc: '基于你的画像智能匹配', icon: Target, to: '/career', priority: 'P0' },
      { id: 'jd', title: '岗位 JD 汇总', desc: '一键跳转查看真实在招岗位', icon: FileSearch, to: '/career', priority: 'P0' },
    ],
  },
  {
    num: '02',
    title: '准备出发',
    subtitle: '梳理经历,打磨简历,弹药上膛',
    emoji: '🎒',
    gradient: 'from-teal-400 via-cyan-400 to-sky-500',
    signColor: 'from-cyan-500 to-sky-600',
    scenery: ['🌲', '🏕️', '🪵', '🐿️', '☘️'],
    stages: [
      { id: 'resume', title: '对话式一键简历', desc: '支持文字 / 图片 / PDF / 语音', icon: FileText, comingSoon: true, priority: 'P0' },
      { id: 'tips', title: '求职小 Tips', desc: '流程 & 细节随时问', icon: Lightbulb, comingSoon: true, priority: 'P0' },
      { id: 'company', title: '了解公司', desc: '业务、文化、最新动态', icon: Building2, comingSoon: true, priority: 'P1' },
      { id: 'agent', title: '训练专属 Agent', desc: '吸收播客 / 社媒 / 书籍经验', icon: Bot, comingSoon: true, priority: 'P0' },
    ],
  },
  {
    num: '03',
    title: '投递闯关',
    subtitle: '让对的机会主动找到你',
    emoji: '🚀',
    gradient: 'from-cyan-400 via-violet-400 to-fuchsia-500',
    signColor: 'from-violet-500 to-fuchsia-600',
    scenery: ['🏯', '🪷', '🌊', '🐠', '⛩️'],
    stages: [
      { id: 'feed', title: '每日机会 Feed', desc: '一键推荐卡片', icon: Sparkles, comingSoon: true, priority: 'P0' },
      { id: 'apply', title: '一键投递', desc: '简历直达 HR 信箱', icon: Send, comingSoon: true, priority: 'P0' },
      { id: 'jd-break', title: 'JD 拆解', desc: '逐条对照你的优势', icon: Scissors, comingSoon: true, priority: 'P1' },
    ],
  },
  {
    num: '04',
    title: '面试通关',
    subtitle: '在镜头前从容做自己',
    emoji: '🎤',
    gradient: 'from-violet-400 via-fuchsia-400 to-rose-500',
    signColor: 'from-fuchsia-500 to-rose-600',
    scenery: ['🏔️', '🦅', '✨', '🌅', '🏰'],
    stages: [
      { id: 'qa', title: '逐字稿 & QA', desc: '高频问题人话版回答', icon: MessageSquare, comingSoon: true, priority: 'P0' },
      { id: 'mock', title: '模拟面试', desc: '语音对练 + 即时反馈', icon: Mic, comingSoon: true, priority: 'P1' },
    ],
  },
];

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
const NODE_X_PATTERN = [22, 50, 78, 50, 22, 78];

export default function CareerMap() {
  const navigate = useNavigate();
  const { completed, markDone, reset } = useQuestProgress();
  const { state: game, level, bumpDaily, claimDaily, useItem, resetGame } = useGameProgress();
  const { skipData, saveSkip, resetSkip } = useChapterSkip();
  const [skipTarget, setSkipTarget] = useState<{ id: ChapterId; title: string; emoji: string } | null>(null);

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
    return `进入「第${['一','二','三','四'][nextRec.ci]}章 · ${nextRec.chapter.title}」`;
  })();
  const recReason = (() => {
    if (!nextRec) return '';
    if (allDoneImplemented) return '后续章节正在打磨中，可先体验敬请期待的预告';
    if (doneCount === 0) return '8-12 题点选 · 5-10 分钟，结束后会生成你的专属职业报告';
    const remain = implementedTotal - doneCount;
    return `当前进度 ${doneCount}/${implementedTotal}，距全部通关还有 ${remain} 关`;
  })();
  const NextIcon = nextRec?.stage.icon;

  const handleResetAll = () => {
    if (confirm('确定要重置闯关进度与所有奖励吗？此操作不可撤销。')) {
      reset(); resetGame(); resetSkip();
    }
  };

  const handleSkipConfirm = (payload: SkipPayload[ChapterId]) => {
    if (!skipTarget) return;
    const stageIds = CHAPTER_STAGES[skipTarget.id] || [];
    stageIds.forEach(id => markDone(id));
    saveSkip(skipTarget.id, payload as any);
    toast({ title: `已跳过「${skipTarget.title}」`, description: '本章关卡已标记完成，可继续推进下一章' });
    setSkipTarget(null);
  };

  const chapterIdOf = (num: string): ChapterId => (`ch${parseInt(num, 10)}` as ChapterId);

  return (
    <div className="map-aurora relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-emerald-50 to-teal-100">
      {/* 远景：山峦 SVG */}
      <svg className="absolute top-0 left-0 right-0 w-full h-[360px] pointer-events-none opacity-60" viewBox="0 0 1200 360" preserveAspectRatio="none">
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

      {/* 浮云装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[8%] left-[6%] text-3xl opacity-50 animate-[float_8s_ease-in-out_infinite]">☁️</div>
        <div className="absolute top-[14%] right-[10%] text-4xl opacity-40 animate-[float_10s_ease-in-out_infinite]" style={{ animationDelay: '1.5s' }}>☁️</div>
        <div className="absolute top-[5%] left-[55%] text-2xl opacity-45 animate-[float_12s_ease-in-out_infinite]" style={{ animationDelay: '3s' }}>☁️</div>
        <div className="absolute top-[3%] right-[35%] text-xl opacity-50">🌤️</div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-white/65 border-b border-white/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/40 shrink-0">
            <img src={aiTeacherAvatar} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-bold flex items-center gap-1.5 leading-tight">
              <span className="aurora-text">求职闯关地图</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 text-white font-semibold tracking-wide">智联 AI</span>
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">从认识自己到拿下 offer，一关一关来</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border/60 shadow-sm">
            <MapIcon className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-semibold tabular-nums text-foreground">{availableCount}/{totalStages}</span>
          </div>
          <PlayerHub state={game} level={level} onUseItem={useItem} onClaim={claimDaily} />
          {(doneCount > 0 || game.xp > 0) && (
            <button
              onClick={handleResetAll}
              className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted"
              title="重置进度"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
        {/* 分章节里程碑进度条 */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1">
              {chapters.map((ch, ci) => {
                const chImpl = ch.stages.filter(s => !s.comingSoon).length;
                const chDone = ch.stages.filter(s => statuses[s.id] === 'done').length;
                const pct = chImpl === 0 ? 0 : Math.round((chDone / chImpl) * 100);
                const isCurrent = activeEntry?.ci === ci;
                return (
                  <div key={ch.num} className="flex-1 min-w-0">
                    <div className={cn('h-1.5 rounded-full overflow-hidden bg-emerald-100/70 relative', isCurrent && 'ring-2 ring-offset-1 ring-emerald-300 ring-offset-background')}>
                      <div className={cn('h-full bg-gradient-to-r transition-all', ch.gradient)} style={{ width: chImpl === 0 ? '0%' : `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
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
              'bg-gradient-to-br text-white shadow-[0_18px_50px_-18px_rgba(16,185,129,0.5)]',
              nextRec.chapter.gradient,
              !nextRec.stage.comingSoon && 'hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer',
              nextRec.stage.comingSoon && 'opacity-90 cursor-not-allowed'
            )}
          >
            <div className="absolute -right-8 -top-8 text-[140px] leading-none opacity-15 select-none pointer-events-none">{nextRec.chapter.emoji}</div>
            <div className="absolute right-4 bottom-3 text-[10px] font-bold tracking-[0.2em] opacity-60 select-none">NEXT STEP</div>
            <div className="relative flex items-start gap-4">
              <div className="shrink-0 relative w-16 h-16 rounded-2xl bg-white/95 text-foreground flex items-center justify-center shadow-lg">
                {NextIcon && <NextIcon className="w-7 h-7" strokeWidth={2.2} />}
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-white text-foreground text-[10px] font-extrabold border border-white shadow-sm">{nextRec.si + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold tracking-[0.18em] opacity-90 uppercase">推荐 · 第{['一','二','三','四'][nextRec.ci]}章 · 第 {nextRec.si + 1} 关</span>
                  {nextRec.stage.priority && (
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-bold', nextRec.stage.priority === 'P0' ? 'bg-white/95 text-rose-600' : 'bg-white/95 text-amber-600')}>{nextRec.stage.priority}</span>
                  )}
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
              {/* 区域木牌（替代原 banner，更游戏化） */}
              <div className="relative flex justify-center mb-6">
                <div className={cn('relative px-5 py-3 rounded-2xl bg-gradient-to-br text-white shadow-[0_10px_25px_-8px_rgba(0,0,0,0.25)] border-2 border-white/70', ch.signColor)}>
                  {/* 牌子两边的圆钉 */}
                  <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/80 shadow" />
                  <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/80 shadow" />
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{ch.emoji}</span>
                    <div className="leading-tight">
                      <p className="text-[10px] font-bold tracking-[0.25em] opacity-90 font-display-aurora">CHAPTER {ch.num}</p>
                      <h2 className="text-base sm:text-lg font-bold font-display-aurora">第{['一','二','三','四'][ci]}章 · {ch.title}</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                    {chImpl > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/25 backdrop-blur text-[10px] font-bold tabular-nums">
                        {chDone}/{chImpl}
                        <span className="w-12 h-1 rounded-full bg-white/30 overflow-hidden inline-block">
                          <span className="block h-full bg-white" style={{ width: `${(chDone / chImpl) * 100}%` }} />
                        </span>
                      </span>
                    )}
                    {chComplete && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/30 backdrop-blur font-bold inline-flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" strokeWidth={3} />通关
                      </span>
                    )}
                    {skipData[chapterIdOf(ch.num)] && !chComplete && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/30 backdrop-blur font-bold inline-flex items-center gap-0.5">
                        <FastForward className="w-2.5 h-2.5" strokeWidth={3} />已跳过
                      </span>
                    )}
                    {!chComplete && chImpl > 0 && (
                      <button
                        onClick={() => setSkipTarget({ id: chapterIdOf(ch.num), title: ch.title, emoji: ch.emoji })}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-foreground text-[10px] font-bold hover:scale-105 active:scale-95 transition-all"
                      >
                        <FastForward className="w-2.5 h-2.5" strokeWidth={2.8} />跳过本章
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 游戏地图区域 */}
              <div className="relative" style={{ height: sectionHeight }}>
                {/* 区域底色（草地/水域感） */}
                <div className="absolute inset-0 rounded-[40px] bg-gradient-to-b from-emerald-100/40 via-teal-50/30 to-cyan-100/40 border border-white/60 backdrop-blur-sm overflow-hidden">
                  {/* 散落的景物 */}
                  {ch.scenery.map((emo, i) => {
                    // 用确定性的伪随机位置
                    const seed = (ci * 13 + i * 37) % 100;
                    const left = 5 + ((seed * 7) % 85);
                    const top = 10 + ((seed * 11) % 80);
                    const size = 18 + ((seed * 3) % 16);
                    return (
                      <span
                        key={i}
                        className="absolute select-none pointer-events-none opacity-70"
                        style={{ left: `${left}%`, top: `${top}%`, fontSize: `${size}px` }}
                      >{emo}</span>
                    );
                  })}
                </div>

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
                  {/* 路径阴影 */}
                  <path d={d} fill="none" stroke="rgba(120, 113, 108, 0.15)" strokeWidth="6" strokeLinecap="round" transform="translate(0.3, 1)" />
                  {/* 路径主体（米白色泥土小径） */}
                  <path d={d} fill="none" stroke={`url(#path-${ch.num})`} strokeWidth="5" strokeLinecap="round" />
                  {/* 虚线点缀（脚印感） */}
                  <path d={d} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1" strokeLinecap="round" strokeDasharray="0.5 3" />
                </svg>

                {/* 关卡节点 */}
                {ch.stages.map((st, si) => {
                  const status = statuses[st.id];
                  const isLocked = status === 'locked';
                  const isDone = status === 'done';
                  const isActive = status === 'active';
                  const Icon = st.icon;
                  const node = nodes[si];
                  const labelLeft = node.x < 50;
                  return (
                    <div
                      key={st.id}
                      className="absolute"
                      style={{
                        left: `${node.x}%`,
                        top: `${node.y}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className={cn('relative flex items-center', labelLeft ? 'flex-row' : 'flex-row-reverse')}>
                        {/* 圆形关卡按钮 */}
                        <button
                          onClick={() => !isLocked && st.to && navigate(st.to)}
                          disabled={isLocked || !st.to}
                          className={cn(
                            'relative w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-full flex items-center justify-center transition-all duration-300 group',
                            isLocked
                              ? 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-400 cursor-not-allowed'
                              : cn('bg-gradient-to-br text-white shadow-[0_8px_20px_-4px_rgba(0,0,0,0.25)] hover:scale-110 hover:-rotate-3 active:scale-95 cursor-pointer', ch.gradient),
                            isActive && 'ring-4 ring-amber-300/80 ring-offset-2 ring-offset-transparent'
                          )}
                          style={!isLocked ? { boxShadow: '0 10px 24px -6px rgba(0,0,0,0.3), inset 0 -3px 0 rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.4)' } : undefined}
                          title={st.title}
                        >
                          {/* 活跃光晕 */}
                          {isActive && (
                            <span className="absolute inset-0 rounded-full bg-amber-300/40 blur-xl -z-10 animate-pulse" />
                          )}
                          {/* 关卡序号徽章 */}
                          <span className={cn(
                            'absolute -top-1.5 -left-1.5 w-7 h-7 rounded-full bg-white text-foreground text-[12px] font-extrabold flex items-center justify-center shadow border-2 border-white font-display-aurora',
                            isLocked && 'opacity-70'
                          )}>
                            {si + 1}
                          </span>
                          {/* 状态徽章 */}
                          {isDone && (
                            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow border-2 border-white">
                              <Check className="w-4 h-4" strokeWidth={3.5} />
                            </span>
                          )}
                          {isActive && (
                            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-400 text-amber-950 shadow border border-white whitespace-nowrap animate-bounce">
                              GO!
                            </span>
                          )}
                          {/* 图标 */}
                          {isLocked
                            ? <Lock className="w-6 h-6" />
                            : <Icon className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow" strokeWidth={2.4} />}
                        </button>

                        {/* 关卡名片 */}
                        <div className={cn(
                          'mx-2 max-w-[150px] sm:max-w-[180px] rounded-xl px-3 py-2 backdrop-blur-md border shadow-sm transition-all',
                          isLocked
                            ? 'bg-white/55 border-white/60 opacity-80'
                            : 'bg-white/90 border-white',
                          labelLeft ? 'text-left' : 'text-right'
                        )}>
                          <p className={cn('text-[12px] sm:text-[13px] font-bold leading-tight font-display-aurora', isLocked ? 'text-muted-foreground' : 'text-foreground')}>
                            {st.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                            {isLocked && !st.comingSoon ? '完成上一关后开启' : st.desc}
                          </p>
                          <div className={cn('flex items-center gap-1 mt-1 flex-wrap', labelLeft ? 'justify-start' : 'justify-end')}>
                            {st.priority && (
                              <span className={cn(
                                'text-[9px] px-1 py-0.5 rounded font-bold',
                                st.priority === 'P0' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                              )}>{st.priority}</span>
                            )}
                            {st.comingSoon && <span className="text-[9px] px-1 py-0.5 rounded font-bold bg-slate-100 text-slate-500">敬请期待</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 章节衔接装饰 */}
              {ci < chapters.length - 1 && (
                <div className="flex justify-center my-4">
                  <div className="flex flex-col items-center gap-1.5 opacity-60">
                    <span className="text-2xl">🏞️</span>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}

        {/* Finale 城堡 */}
        <section className="relative mt-8">
          <div className={cn(
            'relative overflow-hidden rounded-[28px] p-8 text-center border border-white/70 backdrop-blur-xl transition-all',
            doneCount === implementedTotal && implementedTotal > 0
              ? 'bg-gradient-to-br from-amber-200/90 via-rose-200/80 to-violet-200/90 shadow-[0_20px_60px_-15px_rgba(168,85,247,0.45)] scale-[1.02]'
              : 'bg-gradient-to-br from-emerald-100/70 via-cyan-100/60 to-violet-100/70 shadow-[0_14px_40px_-15px_rgba(6,182,212,0.35)] opacity-90'
          )}>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-200/40 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-violet-300/30 blur-3xl pointer-events-none" />
            <div className="text-5xl mb-1">🏰</div>
            <div className="text-4xl mb-2">🏆</div>
            <h3 className="text-xl font-bold font-display-aurora aurora-text">拿下心仪 Offer</h3>
            <p className="text-sm text-foreground/70 mt-2">
              {doneCount === implementedTotal && implementedTotal > 0
                ? '恭喜！已开放的关卡全部通关，继续等待新章节解锁～'
                : '通关后欢迎回来分享你的故事'}
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

      {skipTarget && (
        <ChapterSkipDialog
          open={!!skipTarget}
          onOpenChange={(o) => { if (!o) setSkipTarget(null); }}
          chapterId={skipTarget.id}
          chapterTitle={skipTarget.title}
          chapterEmoji={skipTarget.emoji}
          onConfirm={handleSkipConfirm}
        />
      )}
    </div>
  );
}
