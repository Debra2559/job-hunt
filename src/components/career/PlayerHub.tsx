import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, Flame, Zap, Gift, Sparkle, Check, Backpack } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BADGES, DAILY_TASKS, ITEMS, type BadgeId, type DailyTaskId, type ItemId } from '@/hooks/useGameProgress';
import { toast } from '@/hooks/use-toast';

type Props = {
  state: ReturnType<typeof import('@/hooks/useGameProgress').useGameProgress>['state'];
  level: { level: number; into: number; need: number; pct: number };
  onUseItem: (id: ItemId) => boolean | void;
  onClaim: (id: DailyTaskId) => void;
};

export default function PlayerHub({ state, level, onUseItem, onClaim }: Props) {
  const itemList = (Object.keys(ITEMS) as ItemId[])
    .map(id => ({ id, count: state.items[id] || 0, ...ITEMS[id] }))
    .filter(x => x.count > 0);

  const handleUseItem = (id: ItemId) => {
    const used = onUseItem(id);
    if (used) toast({ title: `已使用 ${ITEMS[id].emoji} ${ITEMS[id].name}`, description: ITEMS[id].desc });
  };

  const handleClaim = (task: DailyTaskId) => {
    onClaim(task);
    const t = DAILY_TASKS[task];
    toast({
      title: `+${t.xp} XP${t.reward ? ` · +${t.reward.count} ${ITEMS[t.reward.item].emoji}` : ''}`,
      description: `完成「${t.name}」`,
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          className="group relative inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-violet-500 text-white shadow-[0_6px_18px_-6px_rgba(244,114,182,0.6)] hover:scale-[1.03] active:scale-95 transition-all"
          aria-label="打开玩家中心"
        >
          <span className="relative w-8 h-8 rounded-full bg-white text-foreground flex items-center justify-center text-[11px] font-extrabold shadow-inner">
            Lv{level.level}
            {state.badges.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center border border-white">
                {state.badges.length}
              </span>
            )}
          </span>
          <span className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-[10px] font-bold tracking-wider opacity-90">PLAYER</span>
            <span className="text-[11px] font-semibold tabular-nums">{state.xp} XP</span>
          </span>
          <Backpack className="w-4 h-4 sm:hidden" strokeWidth={2.4} />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-base font-bold flex items-center gap-2">
            <Backpack className="w-4 h-4 text-emerald-500" /> 玩家中心
          </SheetTitle>
        </SheetHeader>

        {/* Player card */}
        <div className="mx-5 rounded-3xl bg-gradient-to-br from-amber-100 via-rose-50 to-violet-100 border border-white/80 p-4 shadow-[0_10px_30px_-12px_rgba(244,114,182,0.3)]">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-white flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5" strokeWidth={2.4} />
              <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-white text-foreground text-[10px] font-extrabold border border-border/60 shadow-sm">Lv {level.level}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">闯关者 Lv {level.level}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">{level.into}/{level.need} XP</span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-white/70 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all" style={{ width: `${level.pct}%` }} />
              </div>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-500" />{state.badges.length} 徽章</span>
                <span className="inline-flex items-center gap-1"><Flame className="w-3 h-3 text-rose-500" />连签 {state.daily.streak}</span>
                <span>累计 {state.xp} XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: 任务 / 道具 / 徽章 */}
        <Tabs defaultValue="daily" className="px-5 pt-4 pb-8">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="daily" className="text-xs"><Sparkle className="w-3 h-3 mr-1" />每日任务</TabsTrigger>
            <TabsTrigger value="items" className="text-xs"><Gift className="w-3 h-3 mr-1" />道具</TabsTrigger>
            <TabsTrigger value="badges" className="text-xs"><Trophy className="w-3 h-3 mr-1" />徽章</TabsTrigger>
          </TabsList>

          {/* 每日任务 */}
          <TabsContent value="daily" className="space-y-2 mt-3">
            {(Object.keys(DAILY_TASKS) as DailyTaskId[]).map(tid => {
              const t = DAILY_TASKS[tid];
              const cur = state.daily.progress[tid] || 0;
              const claimed = state.daily.claimed.includes(tid);
              const reachable = cur >= t.target;
              const pct = Math.min(100, Math.round((cur / t.target) * 100));
              return (
                <div key={tid} className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl border transition-colors',
                  claimed ? 'bg-emerald-50/70 border-emerald-200' : reachable ? 'bg-amber-50/80 border-amber-200' : 'bg-background border-border/60'
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{t.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 font-bold">+{t.xp}</span>
                      {t.reward && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 font-bold">{ITEMS[t.reward.item].emoji}×{t.reward.count}</span>
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
          </TabsContent>

          {/* 道具 */}
          <TabsContent value="items" className="mt-3">
            {itemList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">完成每日任务可获得提示道具</p>
            ) : (
              <div className="space-y-2">
                {itemList.map(it => (
                  <div key={it.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border/60">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-amber-100 flex items-center justify-center text-2xl">{it.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{it.name} <span className="text-[11px] font-normal text-muted-foreground">×{it.count}</span></p>
                      <p className="text-[11px] text-muted-foreground">{it.desc}</p>
                    </div>
                    <button
                      onClick={() => handleUseItem(it.id)}
                      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 text-white shadow-sm hover:scale-105 active:scale-95"
                    >
                      使用
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 徽章 */}
          <TabsContent value="badges" className="mt-3">
            <div className="grid grid-cols-3 gap-2.5">
              {(Object.keys(BADGES) as BadgeId[]).map(bid => {
                const b = BADGES[bid];
                const owned = state.badges.includes(bid);
                return (
                  <div
                    key={bid}
                    className={cn(
                      'relative rounded-2xl p-2.5 text-center border transition-all',
                      owned
                        ? 'bg-gradient-to-br from-amber-50 to-rose-50 border-amber-200 shadow-sm'
                        : 'bg-muted/40 border-dashed border-border/70 opacity-60'
                    )}
                    title={`${b.name}：${b.desc}`}
                  >
                    <div className={cn('text-2xl leading-none mb-1', !owned && 'grayscale')}>{b.emoji}</div>
                    <p className={cn('text-[11px] font-bold leading-tight', owned ? 'text-foreground' : 'text-muted-foreground')}>{b.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">{b.desc}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-3">已获得 {state.badges.length} / {Object.keys(BADGES).length}</p>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
