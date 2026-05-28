import { useCallback, useEffect, useMemo, useState } from 'react';
import { fireFireworks } from '@/components/Fireworks';

const STORAGE_KEY = 'quest:game:v1';

// ============== Types ==============
export type ItemId = 'hint_scroll' | 'reroll_token' | 'focus_potion';
export type BadgeId =
  | 'first_step'
  | 'chapter_1_clear'
  | 'chapter_2_clear'
  | 'chapter_3_clear'
  | 'chapter_4_clear'
  | 'daily_streak_3'
  | 'daily_streak_7';

export type DailyTaskId = 'open_map' | 'complete_stage' | 'ask_career';

type DailyState = {
  date: string; // YYYY-MM-DD
  progress: Partial<Record<DailyTaskId, number>>;
  claimed: DailyTaskId[];
  // 连续签到（每天至少打开地图就 +1）
  streak: number;
  lastActiveDate?: string;
};

type GameState = {
  xp: number;
  badges: BadgeId[];
  items: Partial<Record<ItemId, number>>;
  daily: DailyState;
  // 已奖励过的章节，避免重复发奖
  chapterAwarded: string[];
  // 已奖励过的关卡（首次完成奖励）
  stageAwarded: string[];
};

// ============== Catalogs ==============
export const ITEMS: Record<ItemId, { name: string; emoji: string; desc: string }> = {
  hint_scroll: { name: 'AI 提示锦囊', emoji: '📜', desc: '卡壳时使用，获得一条破题思路' },
  reroll_token: { name: '重抽令牌', emoji: '🎲', desc: '不满意当前推荐？换一批岗位' },
  focus_potion: { name: '专注药水', emoji: '🧪', desc: '让 AI 用更长的思考输出一次深度回答' },
};

export const BADGES: Record<BadgeId, { name: string; emoji: string; desc: string }> = {
  first_step: { name: '出发吧', emoji: '🌱', desc: '完成第一关' },
  chapter_1_clear: { name: '自我认知大师', emoji: '🧭', desc: '通关第一章 · 认识自己' },
  chapter_2_clear: { name: '简历操盘手', emoji: '🎒', desc: '通关第二章 · 准备出发' },
  chapter_3_clear: { name: '投递特工', emoji: '🚀', desc: '通关第三章 · 投递闯关' },
  chapter_4_clear: { name: '面试王者', emoji: '🎤', desc: '通关第四章 · 面试通关' },
  daily_streak_3: { name: '三日连签', emoji: '🔥', desc: '连续 3 天打开地图' },
  daily_streak_7: { name: '七日连签', emoji: '⚡', desc: '连续 7 天打开地图' },
};

export const DAILY_TASKS: Record<DailyTaskId, { name: string; desc: string; target: number; xp: number; reward?: { item: ItemId; count: number } }> = {
  open_map: { name: '打开闯关地图', desc: '每日签到，了解新进展', target: 1, xp: 20 },
  complete_stage: { name: '完成一关', desc: '今日通关任意一关', target: 1, xp: 50, reward: { item: 'hint_scroll', count: 1 } },
  ask_career: { name: '与职业 AI 对话 3 轮', desc: '保持思考的节奏', target: 3, xp: 30, reward: { item: 'focus_potion', count: 1 } },
};

// 关卡 → 所属章节（用于章节通关判定）
export const CHAPTER_STAGES: Record<string, string[]> = {
  ch1: ['assess', 'recommend', 'jd'],
  ch2: ['resume', 'tips', 'company'],
  ch3: ['feed', 'apply', 'jd-break'],
  ch4: ['qa', 'mock'],
};

const CHAPTER_BADGE: Record<string, BadgeId> = {
  ch1: 'chapter_1_clear',
  ch2: 'chapter_2_clear',
  ch3: 'chapter_3_clear',
  ch4: 'chapter_4_clear',
};

// ============== Helpers ==============
const today = () => new Date().toISOString().slice(0, 10);

function emptyDaily(): DailyState {
  return { date: today(), progress: {}, claimed: [], streak: 0 };
}

function defaultState(): GameState {
  return { xp: 0, badges: [], items: {}, daily: emptyDaily(), chapterAwarded: [], stageAwarded: [] };
}

function read(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

function write(s: GameState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export function xpToLevel(xp: number) {
  // Lv 1 starts at 0, every level needs lv*100 more XP (1→100, 2→300, 3→600...)
  let level = 1;
  let remain = xp;
  while (remain >= level * 100) {
    remain -= level * 100;
    level += 1;
  }
  const need = level * 100;
  return { level, into: remain, need, pct: Math.round((remain / need) * 100) };
}

// ============== Hook ==============
export function useGameProgress() {
  const [state, setState] = useState<GameState>(() => read());

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Reset daily if date changed; also update streak
  useEffect(() => {
    setState(prev => {
      const d = today();
      if (prev.daily.date === d) return prev;
      const last = prev.daily.lastActiveDate;
      let streak = prev.daily.streak;
      if (last) {
        const lastDate = new Date(last);
        const todayDate = new Date(d);
        const diffDays = Math.round((+todayDate - +lastDate) / 86400000);
        if (diffDays === 1) streak = streak; // 还没访问，等 open_map 触发再 +1
        else if (diffDays > 1) streak = 0;
      }
      const next = { ...prev, daily: { date: d, progress: {}, claimed: [], streak, lastActiveDate: last } };
      write(next);
      return next;
    });
  }, []);

  const persist = useCallback((updater: (s: GameState) => GameState) => {
    setState(prev => {
      const next = updater(prev);
      write(next);
      return next;
    });
  }, []);

  const addXp = useCallback((amount: number) => {
    persist(s => ({ ...s, xp: s.xp + amount }));
  }, [persist]);

  const addItem = useCallback((id: ItemId, count = 1) => {
    persist(s => ({ ...s, items: { ...s.items, [id]: (s.items[id] || 0) + count } }));
  }, [persist]);

  const useItem = useCallback((id: ItemId) => {
    let used = false;
    persist(s => {
      const cur = s.items[id] || 0;
      if (cur <= 0) return s;
      used = true;
      return { ...s, items: { ...s.items, [id]: cur - 1 } };
    });
    return used;
  }, [persist]);

  const unlockBadge = useCallback((id: BadgeId) => {
    persist(s => s.badges.includes(id) ? s : { ...s, badges: [...s.badges, id], xp: s.xp + 100 });
  }, [persist]);

  // 关卡首次完成奖励 + daily 进度推进
  const onStageCompleted = useCallback((stageId: string) => {
    persist(s => {
      if (s.stageAwarded.includes(stageId)) return s;
      const stageAwarded = [...s.stageAwarded, stageId];
      let xp = s.xp + 60;
      let badges = s.badges;
      if (!badges.includes('first_step')) {
        badges = [...badges, 'first_step'];
        xp += 100;
      }
      // 章节通关判定
      const chapterAwarded = [...s.chapterAwarded];
      let chapterCleared: string | null = null;
      for (const [chId, stages] of Object.entries(CHAPTER_STAGES)) {
        if (chapterAwarded.includes(chId)) continue;
        const allDone = stages.every(id => stageAwarded.includes(id));
        if (allDone) {
          chapterAwarded.push(chId);
          chapterCleared = chId;
          xp += 250;
          const bId = CHAPTER_BADGE[chId];
          if (bId && !badges.includes(bId)) badges = [...badges, bId];
        }
      }
      // 烟花庆祝（延迟到下一帧，避免在 setState 期间触发副作用）
      setTimeout(() => {
        if (chapterCleared) {
          const badgeId = CHAPTER_BADGE[chapterCleared];
          fireFireworks({ intensity: 'mega', message: `${BADGES[badgeId].name} · 章节通关！` });
        } else {
          fireFireworks({ intensity: 'normal', message: '关卡通关 +60 XP' });
        }
      }, 0);
      // daily 任务推进
      const dp = { ...s.daily.progress };
      dp.complete_stage = Math.min((dp.complete_stage || 0) + 1, DAILY_TASKS.complete_stage.target);
      return { ...s, xp, badges, stageAwarded, chapterAwarded, daily: { ...s.daily, progress: dp } };
    });
  }, [persist]);

  // 由各页面调用，推进 daily 进度
  const bumpDaily = useCallback((task: DailyTaskId, by = 1) => {
    persist(s => {
      const target = DAILY_TASKS[task].target;
      const cur = s.daily.progress[task] || 0;
      if (cur >= target) return s;
      const dp = { ...s.daily.progress, [task]: Math.min(cur + by, target) };
      // open_map 同时维护签到 streak
      let streak = s.daily.streak;
      let lastActiveDate = s.daily.lastActiveDate;
      let badges = s.badges;
      let xp = s.xp;
      if (task === 'open_map' && s.daily.lastActiveDate !== s.daily.date) {
        lastActiveDate = s.daily.date;
        streak = streak + 1;
        if (streak >= 3 && !badges.includes('daily_streak_3')) { badges = [...badges, 'daily_streak_3']; xp += 100; }
        if (streak >= 7 && !badges.includes('daily_streak_7')) { badges = [...badges, 'daily_streak_7']; xp += 200; }
      }
      return { ...s, xp, badges, daily: { ...s.daily, progress: dp, streak, lastActiveDate } };
    });
  }, [persist]);

  const claimDaily = useCallback((task: DailyTaskId) => {
    persist(s => {
      if (s.daily.claimed.includes(task)) return s;
      const cur = s.daily.progress[task] || 0;
      if (cur < DAILY_TASKS[task].target) return s;
      const t = DAILY_TASKS[task];
      const items = { ...s.items };
      if (t.reward) items[t.reward.item] = (items[t.reward.item] || 0) + t.reward.count;
      return {
        ...s,
        xp: s.xp + t.xp,
        items,
        daily: { ...s.daily, claimed: [...s.daily.claimed, task] },
      };
    });
  }, [persist]);

  const resetGame = useCallback(() => {
    write(defaultState());
    setState(defaultState());
  }, []);

  const level = useMemo(() => xpToLevel(state.xp), [state.xp]);

  return {
    state,
    level,
    addXp,
    addItem,
    useItem,
    unlockBadge,
    onStageCompleted,
    bumpDaily,
    claimDaily,
    resetGame,
  };
}
