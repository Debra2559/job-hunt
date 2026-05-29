import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, Flame, Check, Backpack, Target, Package, Award } from 'lucide-react';
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
          className="group inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-card border border-border/70 hover:border-primary/40 hover:bg-accent/40 shadow-sm transition-all"
          aria-label="打开玩家中心"
        >
          <span className="relative w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold">
            {level.level}
            {state.badges.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-foreground text-background text-[8px] font-bold flex items-center justify-center border border-card">
                {state.badges.length}
              </span>
            )}
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-foreground tabular-nums">{state.xp}</span>
            <span className="text-muted-foreground">XP</span>
          </span>
          <Backpack className="w-4 h-4 sm:hidden text-muted-foreground" strokeWidth={2} />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <SheetTitle className="text-base font-semibold flex items-center gap-2">
            <Backpack className="w-4 h-4 text-primary" strokeWidth={2} /> 玩家中心
          </SheetTitle>
        </SheetHeader>

        {/* Player card */}
        <div className="mx-6 mt-5 rounded-2xl bg-card border border-border/70 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                Lv{level.level}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">闯关者</p>
                <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{level.into} / {level.need} XP</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground tabular-nums leading-none">{state.xp}</p>
              <p className="text-[10px] text-muted-foreground mt-1 tracking-wider">TOTAL XP</p>
            </div>
          </div>
          <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${level.pct}%` }} />
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Trophy className="w-3 h-3" strokeWidth={2} />{state.badges.length} 徽章</span>
            <span className="inline-flex items-center gap-1"><Flame className="w-3 h-3" strokeWidth={2} />连签 {state.daily.streak} 天</span>
          </div>
        </div>

        {/* Tabs: 任务 / 道具 / 徽章 */}
        <Tabs defaultValue="daily" className="px-6 pt-5 pb-8">
          <TabsList className="w-full grid grid-cols-3 bg-muted/60 h-9">
            <TabsTrigger value="daily" className="text-xs data-[state=active]:bg-card"><Target className="w-3 h-3 mr-1" strokeWidth={2} />任务</TabsTrigger>
            <TabsTrigger value="items" className="text-xs data-[state=active]:bg-card"><Package className="w-3 h-3 mr-1" strokeWidth={2} />道具</TabsTrigger>
            <TabsTrigger value="badges" className="text-xs data-[state=active]:bg-card"><Award className="w-3 h-3 mr-1" strokeWidth={2} />徽章</TabsTrigger>
          </TabsList>

          {/* 每日任务 */}
          <TabsContent value="daily" className="space-y-2 mt-4">
            {(Object.keys(DAILY_TASKS) as DailyTaskId[]).map(tid => {
              const t = DAILY_TASKS[tid];
              const cur = state.daily.progress[tid] || 0;
              const claimed = state.daily.claimed.includes(tid);
              const reachable = cur >= t.target;
              const pct = Math.min(100, Math.round((cur / t.target) * 100));
              return (
                <div key={tid} className={cn(
                  'flex items-center gap-3 p-3.5 rounded-xl border transition-colors',
                  claimed ? 'bg-muted/40 border-border/50' : 'bg-card border-border/70'
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-sm font-medium', claimed ? 'text-muted-foreground' : 'text-foreground')}>{t.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium tabular-nums">+{t.xp} XP</span>
                      {t.reward && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{ITEMS[t.reward.item].emoji} ×{t.reward.count}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{t.desc}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full transition-all', claimed ? 'bg-muted-foreground/40' : 'bg-primary')} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">{cur}/{t.target}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleClaim(tid)}
                    disabled={!reachable || claimed}
                    className={cn(
                      'shrink-0 h-8 px-3 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1',
                      claimed
                        ? 'bg-transparent text-muted-foreground cursor-default'
                        : reachable
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    {claimed ? <><Check className="w-3 h-3" strokeWidth={2.5} />已领</> : reachable ? '领取' : '进行中'}
                  </button>
                </div>
              );
            })}
          </TabsContent>

          {/* 道具 */}
          <TabsContent value="items" className="mt-4">
            {itemList.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-xs text-muted-foreground">完成每日任务可获得提示道具</p>
              </div>
            ) : (
              <div className="space-y-2">
                {itemList.map(it => (
                  <div key={it.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/70">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl">{it.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{it.name} <span className="text-[11px] font-normal text-muted-foreground tabular-nums">×{it.count}</span></p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{it.desc}</p>
                    </div>
                    <button
                      onClick={() => handleUseItem(it.id)}
                      className="shrink-0 h-8 px-3 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      使用
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 徽章 */}
          <TabsContent value="badges" className="mt-4">
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(BADGES) as BadgeId[]).map(bid => {
                const b = BADGES[bid];
                const owned = state.badges.includes(bid);
                return (
                  <div
                    key={bid}
                    className={cn(
                      'rounded-xl p-3 text-center border transition-all',
                      owned
                        ? 'bg-card border-border/70'
                        : 'bg-muted/30 border-dashed border-border/60'
                    )}
                    title={`${b.name}：${b.desc}`}
                  >
                    <div className={cn('text-2xl leading-none mb-1.5', !owned && 'grayscale opacity-40')}>{b.emoji}</div>
                    <p className={cn('text-[11px] font-semibold leading-tight', owned ? 'text-foreground' : 'text-muted-foreground')}>{b.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight line-clamp-2">{b.desc}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-4 tabular-nums">已获得 {state.badges.length} / {Object.keys(BADGES).length}</p>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
