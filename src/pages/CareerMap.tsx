import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Target, FileSearch, FileText, Lightbulb, Building2, Bot, Sparkles, Send, Scissors, MessageSquare, Mic, Lock, Check, ChevronRight, Map as MapIcon, RotateCcw, Flame, Trophy, Gift, Sparkle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useQuestProgress } from '@/hooks/useQuestProgress';
import { useGameProgress, BADGES, ITEMS, DAILY_TASKS, type DailyTaskId, type BadgeId, type ItemId } from '@/hooks/useGameProgress';
import { toast } from '@/hooks/use-toast';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';

type StageStatus = 'done' | 'active' | 'available' | 'locked';

type StageDef = {
  id: string;
  title: string;
  desc: string;
  icon: any;
  to?: string;            // implemented route
  comingSoon?: boolean;   // 敬请期待，永远锁定，不参与解锁逻辑
  priority?: 'P0' | 'P1';
};

type Chapter = {
  num: string;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  ring: string;
  stages: StageDef[];
};

const chapters: Chapter[] = [
  {
    num: '01',
    title: '认识自己',
    subtitle: '搞清楚我是谁、我适合什么',
    emoji: '🧭',
    gradient: 'from-emerald-400 via-teal-400 to-cyan-500',
    ring: 'ring-emerald-200',
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
    ring: 'ring-cyan-200',
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
    ring: 'ring-violet-200',
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
    ring: 'ring-fuchsia-200',
    stages: [
      { id: 'qa', title: '逐字稿 & QA', desc: '高频问题人话版回答', icon: MessageSquare, comingSoon: true, priority: 'P0' },
      { id: 'mock', title: '模拟面试', desc: '语音对练 + 即时反馈', icon: Mic, comingSoon: true, priority: 'P1' },
    ],
  },
];

// 顺序解锁：上一关完成后，下一关才会从 locked → active
function computeStatuses(completed: Set<string>): Record<string, StageStatus> {
  const flat = chapters.flatMap(c => c.stages);
  const result: Record<string, StageStatus> = {};
  let unlockedNext = true; // 第一个未完成的实现关卡获得 active
  for (const st of flat) {
    if (st.comingSoon) {
      result[st.id] = 'locked';
      continue;
    }
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

export default function CareerMap() {
  const navigate = useNavigate();
  const { completed, reset } = useQuestProgress();
  const { state: game, level, bumpDaily, claimDaily, useItem, resetGame } = useGameProgress();

  // 打开地图自动推进每日签到
  useEffect(() => { bumpDaily('open_map'); }, [bumpDaily]);

  const statuses = useMemo(() => computeStatuses(new Set(completed)), [completed]);

  const allStages = chapters.flatMap(c => c.stages);
  const implementedTotal = allStages.filter(s => !s.comingSoon).length;
  const doneCount = allStages.filter(s => statuses[s.id] === 'done').length;
  const availableCount = allStages.filter(s => statuses[s.id] !== 'locked').length;
  const totalStages = allStages.length;
  const progressPct = implementedTotal > 0 ? Math.round((doneCount / implementedTotal) * 100) : 0;

  // ====== 下一步推荐 ======
  // 1) 优先推荐 active 关卡（顺序解锁里下一个该做的实现关）
  // 2) 否则若全部实现关已完成，引导到第一个 comingSoon 的关卡（敬请期待）
  // 3) 没有任何关卡：null
  const allFlat = chapters.flatMap((c, ci) => c.stages.map((s, si) => ({ stage: s, chapter: c, ci, si })));
  const activeEntry = allFlat.find(e => statuses[e.stage.id] === 'active');
  const firstSoonEntry = allFlat.find(e => e.stage.comingSoon);
  const allDoneImplemented = implementedTotal > 0 && doneCount === implementedTotal;
  const nextRec = activeEntry || (allDoneImplemented ? firstSoonEntry : null);
  const nextDoneInChapter = nextRec
    ? nextRec.chapter.stages.filter(s => statuses[s.id] === 'done').length
    : 0;
  const nextImplInChapter = nextRec
    ? nextRec.chapter.stages.filter(s => !s.comingSoon).length
    : 0;

  // 智能文案
  const recHeadline = (() => {
    if (!nextRec) return '准备好开始你的求职旅程了';
    if (allDoneImplemented) return '已开放关卡全部通关，先看看后续内容';
    if (doneCount === 0) return '从这里出发，认识真正的自己';
    if (nextDoneInChapter > 0 && nextDoneInChapter < nextImplInChapter) return `继续推进「${nextRec.chapter.title}」，离通关只差几步`;
    return `进入「第${['一','二','三','四'][nextRec.ci]}章 · ${nextRec.chapter.title}」`;
  })();
  const recReason = (() => {
    if (!nextRec) return '';
    if (allDoneImplemented) return '后续章节正在打磨中，可先体验敬请期待的预告';
    if (doneCount === 0) return '8-12 题点选 · 5-10 分钟，结束后会生成你的专属职业报告';
    const remain = implementedTotal - doneCount;
    return `当前进度 ${doneCount}/${implementedTotal}，距全部开放关卡通关还有 ${remain} 关`;
  })();
  const NextIcon = nextRec?.stage.icon;

  const itemList = (Object.keys(ITEMS) as ItemId[])
    .map(id => ({ id, count: game.items[id] || 0, ...ITEMS[id] }))
    .filter(x => x.count > 0);

  const handleUseItem = (id: ItemId) => {
    if (useItem(id)) {
      toast({ title: `已使用 ${ITEMS[id].emoji} ${ITEMS[id].name}`, description: ITEMS[id].desc });
    }
  };

  const handleClaim = (task: DailyTaskId) => {
    claimDaily(task);
    const t = DAILY_TASKS[task];
    toast({
      title: `+${t.xp} XP${t.reward ? ` · +${t.reward.count} ${ITEMS[t.reward.item].emoji}` : ''}`,
      description: `完成「${t.name}」`,
    });
  };

  const handleResetAll = () => {
    if (confirm('确定要重置闯关进度与所有奖励吗？此操作不可撤销。')) {
      reset();
      resetGame();
    }
  };

  return (
    <div className="map-aurora relative min-h-screen overflow-hidden bg-gradient-to-b from-emerald-50/60 via-cyan-50/40 to-violet-50/50">
      {/* Aurora animated blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="aurora-blob aurora-blob-1 -top-32 -left-20 w-[420px] h-[420px] bg-emerald-300/50" />
        <div className="aurora-blob aurora-blob-2 top-[20%] -right-24 w-[480px] h-[480px] bg-cyan-300/45" />
        <div className="aurora-blob aurora-blob-3 top-[55%] left-[10%] w-[520px] h-[520px] bg-violet-300/40" />
        <div className="aurora-blob aurora-blob-1 bottom-[5%] right-[5%] w-[420px] h-[420px] bg-fuchsia-300/35" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-2xl bg-white/55 border-b border-white/40">

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/40 shrink-0">
            <img src={aiTeacherAvatar} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold flex items-center gap-1.5">
              <span className="aurora-text">求职闯关地图</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 text-white font-semibold tracking-wide">智联 AI</span>
            </h1>
            <p className="text-xs text-muted-foreground">从认识自己到拿下 offer，一关一关来</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/60 shadow-sm">
            <MapIcon className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">{availableCount}/{totalStages}</span>
            <span className="text-[11px] text-muted-foreground">已开放</span>
          </div>
          {(doneCount > 0 || game.xp > 0) && (
            <button
              onClick={handleResetAll}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="重置进度"
            >
              <RotateCcw className="w-3 h-3" />
              重置
            </button>
          )}
        </div>
        {/* 分章节里程碑进度条 */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1">
              {chapters.map((ch, ci) => {
                const chImpl = ch.stages.filter(s => !s.comingSoon).length;
                const chDone = ch.stages.filter(s => statuses[s.id] === 'done').length;
                const pct = chImpl === 0 ? 0 : Math.round((chDone / chImpl) * 100);
                const isCurrent = activeEntry?.ci === ci;
                return (
                  <div key={ch.num} className="flex-1 min-w-0">
                    <div className={cn(
                      'h-1.5 rounded-full overflow-hidden bg-emerald-100/70 relative',
                      isCurrent && 'ring-2 ring-offset-1 ring-emerald-300 ring-offset-background'
                    )}>
                      <div
                        className={cn('h-full bg-gradient-to-r transition-all', ch.gradient)}
                        style={{ width: chImpl === 0 ? '0%' : `${pct}%` }}
                      />
                    </div>
                    <div className="hidden sm:flex justify-between mt-0.5 px-0.5">
                      <span className={cn('text-[9px] font-bold tracking-wider', isCurrent ? 'text-foreground' : 'text-muted-foreground')}>
                        CH{ch.num}
                      </span>
                      <span className="text-[9px] tabular-nums text-muted-foreground">{chImpl === 0 ? '—' : `${chDone}/${chImpl}`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground tabular-nums shrink-0">
              {doneCount}/{implementedTotal} · {progressPct}%
            </span>
          </div>
        </div>
      </header>

      {/* 下一步推荐 */}
      {nextRec && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
          <button
            onClick={() => !nextRec.stage.comingSoon && nextRec.stage.to && navigate(nextRec.stage.to)}
            disabled={nextRec.stage.comingSoon || !nextRec.stage.to}
            className={cn(
              'group relative w-full text-left rounded-3xl p-5 sm:p-6 overflow-hidden transition-all duration-300',
              'bg-gradient-to-br text-white shadow-[0_18px_50px_-18px_rgba(16,185,129,0.5)]',
              nextRec.chapter.gradient,
              !nextRec.stage.comingSoon && 'hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-18px_rgba(16,185,129,0.6)] active:scale-[0.99] cursor-pointer',
              nextRec.stage.comingSoon && 'opacity-90 cursor-not-allowed'
            )}
          >
            {/* 背景装饰 */}
            <div className="absolute -right-8 -top-8 text-[160px] leading-none opacity-15 select-none pointer-events-none">{nextRec.chapter.emoji}</div>
            <div className="absolute right-4 bottom-3 text-[10px] font-bold tracking-[0.2em] opacity-60 select-none pointer-events-none">NEXT STEP</div>

            <div className="relative flex items-start gap-4">
              {/* 图标徽章 */}
              <div className="shrink-0 relative w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-2xl bg-white/95 text-foreground flex items-center justify-center shadow-lg">
                {NextIcon && <NextIcon className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.2} style={{ color: 'currentColor' }} />}
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-white text-foreground text-[10px] font-extrabold border border-white shadow-sm">
                  {nextRec.si + 1}
                </span>
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold tracking-[0.18em] opacity-90 uppercase">
                    推荐 · 第{['一','二','三','四'][nextRec.ci]}章 · 第 {nextRec.si + 1} 关
                  </span>
                  {nextRec.stage.priority && (
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-md font-bold',
                      nextRec.stage.priority === 'P0' ? 'bg-white/95 text-rose-600' : 'bg-white/95 text-amber-600'
                    )}>
                      {nextRec.stage.priority}
                    </span>
                  )}
                  {nextRec.stage.comingSoon && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-white/25 backdrop-blur">敬请期待</span>
                  )}
                  {nextImplInChapter > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-white/20 backdrop-blur tabular-nums">
                      章节 {nextDoneInChapter}/{nextImplInChapter}
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold mt-1.5 leading-tight">{recHeadline}</h2>
                <p className="text-sm font-bold opacity-95 mt-1">
                  下一关：{nextRec.stage.title}
                </p>
                <p className="text-xs sm:text-[13px] opacity-90 mt-1 leading-relaxed">
                  {recReason || nextRec.stage.desc}
                </p>
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


      {/* 玩家信息条：等级 / XP / 徽章数 / 道具 / 连签 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        <div className="rounded-3xl bg-gradient-to-br from-amber-100 via-rose-50 to-violet-100 border border-white/80 p-4 sm:p-5 shadow-[0_10px_30px_-12px_rgba(244,114,182,0.3)]">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-white flex items-center justify-center shadow-md">
              <Zap className="w-6 h-6" strokeWidth={2.4} />
              <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-white text-foreground text-[10px] font-extrabold border border-border/60 shadow-sm">Lv {level.level}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">闯关者 Lv {level.level}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">{level.into} / {level.need} XP</span>
                <span className="text-[11px] text-muted-foreground">· 累计 {game.xp} XP</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-white/70 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all" style={{ width: `${level.pct}%` }} />
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1 text-[11px] shrink-0">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 text-foreground font-semibold">
                <Trophy className="w-3 h-3 text-amber-500" /> {game.badges.length} 枚徽章
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 text-foreground font-semibold">
                <Flame className="w-3 h-3 text-rose-500" /> 连签 {game.daily.streak} 天
              </div>
            </div>
          </div>

          {/* 道具栏 */}
          <div className="mt-4 pt-3 border-t border-white/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider inline-flex items-center gap-1">
                <Gift className="w-3 h-3" /> 我的道具
              </span>
              <span className="text-[10px] text-muted-foreground sm:hidden">徽章 {game.badges.length} · 连签 {game.daily.streak}</span>
            </div>
            {itemList.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">完成每日任务可获得提示道具</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {itemList.map(it => (
                  <button
                    key={it.id}
                    onClick={() => handleUseItem(it.id)}
                    className="group inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-full bg-white/90 border border-white text-[12px] font-semibold text-foreground hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                    title={it.desc}
                  >
                    <span className="text-base leading-none">{it.emoji}</span>
                    <span>{it.name}</span>
                    <span className="text-[10px] text-muted-foreground">×{it.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 每日任务 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5">
        <div className="rounded-3xl bg-card/80 backdrop-blur border border-border/60 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground inline-flex items-center gap-1.5">
              <Sparkle className="w-4 h-4 text-emerald-500" />
              每日任务
              <span className="text-[10px] font-medium text-muted-foreground">· 每天 00:00 刷新</span>
            </h3>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {game.daily.claimed.length}/{(Object.keys(DAILY_TASKS) as DailyTaskId[]).length}
            </span>
          </div>
          <div className="space-y-2">
            {(Object.keys(DAILY_TASKS) as DailyTaskId[]).map(tid => {
              const t = DAILY_TASKS[tid];
              const cur = game.daily.progress[tid] || 0;
              const claimed = game.daily.claimed.includes(tid);
              const reachable = cur >= t.target;
              const pct = Math.min(100, Math.round((cur / t.target) * 100));
              return (
                <div key={tid} className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl border transition-colors',
                  claimed ? 'bg-emerald-50/70 border-emerald-200' : reachable ? 'bg-amber-50/80 border-amber-200' : 'bg-background border-border/60'
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{t.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 font-bold">+{t.xp} XP</span>
                      {t.reward && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 font-bold inline-flex items-center gap-0.5">
                          {ITEMS[t.reward.item].emoji} ×{t.reward.count}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full transition-all', claimed ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-rose-400')} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">{cur}/{t.target}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleClaim(tid)}
                    disabled={!reachable || claimed}
                    className={cn(
                      'shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all',
                      claimed
                        ? 'bg-emerald-100 text-emerald-700 cursor-default inline-flex items-center gap-1'
                        : reachable
                          ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-white shadow-sm hover:scale-105 active:scale-95'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    {claimed ? <><Check className="w-3 h-3" strokeWidth={3} />已领</> : reachable ? '领取' : '进行中'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 徽章墙 */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5">
        <div className="rounded-3xl bg-card/80 backdrop-blur border border-border/60 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground inline-flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              徽章墙
            </h3>
            <span className="text-[11px] text-muted-foreground tabular-nums">{game.badges.length}/{Object.keys(BADGES).length}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {(Object.keys(BADGES) as BadgeId[]).map(bid => {
              const b = BADGES[bid];
              const owned = game.badges.includes(bid);
              return (
                <div
                  key={bid}
                  className={cn(
                    'group relative rounded-2xl p-2.5 text-center border transition-all',
                    owned
                      ? 'bg-gradient-to-br from-amber-50 to-rose-50 border-amber-200 shadow-sm hover:-translate-y-0.5'
                      : 'bg-muted/40 border-dashed border-border/70 opacity-60'
                  )}
                  title={`${b.name}：${b.desc}`}
                >
                  <div className={cn('text-2xl sm:text-3xl leading-none mb-1', !owned && 'grayscale')}>{b.emoji}</div>
                  <p className={cn('text-[11px] font-bold leading-tight', owned ? 'text-foreground' : 'text-muted-foreground')}>{b.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-16 sm:space-y-20">
        {chapters.map((ch, ci) => {
          const chDone = ch.stages.filter(s => statuses[s.id] === 'done').length;
          const chImpl = ch.stages.filter(s => !s.comingSoon).length;
          const chComplete = chImpl > 0 && chDone === chImpl;
          return (
          <section key={ch.num} className="relative animate-fade-in" style={{ animationDelay: `${ci * 80}ms` }}>
            {/* Chapter banner */}
            <div className="relative mb-8 sm:mb-10">
              <div className={cn('relative overflow-hidden rounded-[28px] p-6 sm:p-7 bg-gradient-to-br text-white', ch.gradient)}
                style={{ boxShadow: '0 24px 60px -20px rgba(16,185,129,0.45), inset 0 1px 0 rgba(255,255,255,0.4)' }}
              >
                {/* glass highlights */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -right-8 -top-10 text-[150px] sm:text-[170px] leading-none opacity-25 select-none rotate-12">{ch.emoji}</div>
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 text-[90px] sm:text-[110px] leading-none font-black opacity-[0.12] select-none tracking-tighter font-display-aurora">{ch.num}</div>
                {/* corner sparkle */}
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold tracking-[0.25em] opacity-90 font-display-aurora">CHAPTER {ch.num}</p>
                    {chComplete && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/30 backdrop-blur font-semibold inline-flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" strokeWidth={3} /> 通关
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-[28px] font-bold mt-1.5 tracking-tight font-display-aurora">第{['一','二','三','四'][ci]}章 · {ch.title}</h2>
                  <p className="text-sm sm:text-base opacity-95 mt-1.5">{ch.subtitle}</p>
                  {chImpl > 0 && (
                    <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/25 backdrop-blur text-[11px] font-semibold">
                      <span className="tabular-nums">{chDone}/{chImpl}</span>
                      <div className="w-20 h-1 rounded-full bg-white/30 overflow-hidden">
                        <div className="h-full bg-white transition-all" style={{ width: `${(chDone / chImpl) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stage winding path */}
            <div className="relative">
              {/* Decorative SVG winding path */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
                viewBox={`0 0 100 ${ch.stages.length * 100}`}
              >
                <defs>
                  <linearGradient id={`grad-${ch.num}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                {/* build a smooth winding curve through nodes */}
                {(() => {
                  const n = ch.stages.length;
                  const pts = ch.stages.map((_, i) => ({
                    x: i % 2 === 0 ? 22 : 78,
                    y: i * 100 + 50,
                  }));
                  let d = `M ${pts[0].x} ${pts[0].y}`;
                  for (let i = 1; i < n; i++) {
                    const p0 = pts[i - 1], p1 = pts[i];
                    const cx1 = p0.x, cy1 = (p0.y + p1.y) / 2;
                    const cx2 = p1.x, cy2 = (p0.y + p1.y) / 2;
                    d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
                  }
                  return (
                    <>
                      <path d={d} fill="none" stroke={`url(#grad-${ch.num})`} strokeWidth="1.2" strokeLinecap="round" />
                      <path d={d} fill="none" stroke={`url(#grad-${ch.num})`} strokeWidth="0.6" strokeLinecap="round" className="path-flow" opacity="0.9" />
                    </>
                  );
                })()}
              </svg>

              <div className="relative space-y-6 sm:space-y-7">
                {ch.stages.map((st, si) => {
                  const isLeft = si % 2 === 0;
                  const status = statuses[st.id];
                  const isLocked = status === 'locked';
                  const isDone = status === 'done';
                  const isActive = status === 'active';
                  const Icon = st.icon;
                  return (
                    <div key={st.id} className={cn('flex', isLeft ? 'justify-start' : 'justify-end')}>
                      <button
                        onClick={() => !isLocked && st.to && navigate(st.to)}
                        disabled={isLocked || !st.to}
                        className={cn(
                          'group relative w-[88%] sm:w-[76%] text-left rounded-[22px] p-4 sm:p-5 transition-all duration-300 flex items-center gap-4 backdrop-blur-xl',
                          isLocked
                            ? 'bg-white/40 border border-dashed border-white/60 opacity-75 cursor-not-allowed'
                            : 'bg-white/75 border border-white/80 shadow-[0_10px_30px_-12px_rgba(16,185,129,0.35)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-12px_rgba(6,182,212,0.45)] hover:bg-white/95 active:scale-[0.99]',
                          isActive && 'ring-2 ring-emerald-300/80 ring-offset-2 ring-offset-transparent'
                        )}
                      >
                        {/* glow ring on active */}
                        {isActive && (
                          <div className="absolute -inset-px rounded-[22px] bg-gradient-to-r from-emerald-400/30 via-cyan-400/30 to-violet-400/30 blur-md -z-10" />
                        )}

                        {/* Stage icon node */}
                        <div
                          className={cn(
                            'shrink-0 relative w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-2xl flex items-center justify-center text-white',
                            isLocked ? 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-400' : cn('bg-gradient-to-br shadow-lg', ch.gradient),
                            isActive && 'node-pulse'
                          )}
                        >
                          {isLocked
                            ? <Lock className="w-5 h-5" />
                            : isDone
                              ? <Check className="w-7 h-7" strokeWidth={2.6} />
                              : <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.2} />}
                          {!isLocked && (
                            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white text-foreground text-[11px] font-extrabold flex items-center justify-center shadow border border-white font-display-aurora">
                              {si + 1}
                            </span>
                          )}
                        </div>

                        {/* Body */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className={cn('text-sm sm:text-base font-bold font-display-aurora', isLocked ? 'text-muted-foreground' : 'text-foreground')}>
                              {st.title}
                            </h3>
                            {st.priority && (
                              <span className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded-md font-bold',
                                st.priority === 'P0' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                              )}>
                                {st.priority}
                              </span>
                            )}
                            {st.comingSoon && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-500">敬请期待</span>
                            )}
                            {isDone && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-700 inline-flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" strokeWidth={3} /> 已通关
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 text-white shadow-sm">
                                进行中
                              </span>
                            )}
                            {isLocked && !st.comingSoon && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-500">未解锁</span>
                            )}
                          </div>
                          <p className={cn('text-xs sm:text-[13px] mt-1 leading-relaxed', isLocked ? 'text-muted-foreground/80' : 'text-muted-foreground')}>
                            {isLocked && !st.comingSoon ? '完成上一关后开启' : st.desc}
                          </p>
                        </div>

                        {/* Arrow */}
                        {!isLocked && (
                          <ChevronRight className="shrink-0 w-5 h-5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connector to next chapter — aurora dots */}
            {ci < chapters.length - 1 && (
              <div className="flex justify-center mt-12 sm:mt-14">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-px h-10 bg-gradient-to-b from-emerald-300 via-cyan-300 to-violet-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
                </div>
              </div>
            )}
          </section>
        );})}

        {/* Finale */}
        <section className="relative">
          <div className={cn(
            'relative overflow-hidden rounded-[28px] p-8 text-center border border-white/70 backdrop-blur-xl transition-all',
            doneCount === implementedTotal && implementedTotal > 0
              ? 'bg-gradient-to-br from-emerald-200/90 via-cyan-200/80 to-violet-200/90 shadow-[0_20px_60px_-15px_rgba(168,85,247,0.45)] scale-[1.02]'
              : 'bg-gradient-to-br from-emerald-100/70 via-cyan-100/60 to-violet-100/70 shadow-[0_14px_40px_-15px_rgba(6,182,212,0.35)] opacity-90'
          )}>
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-200/40 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-violet-300/30 blur-3xl pointer-events-none" />
            <div className="text-5xl mb-3 drop-shadow-sm">🏆</div>
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
          <div className="sm:hidden flex justify-center pt-2">
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
    </div>
  );
}
