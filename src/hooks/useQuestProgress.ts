import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'quest:completed:v1';

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export function useQuestProgress() {
  const [completed, setCompleted] = useState<string[]>(() => read());

  // Cross-tab / cross-page sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCompleted(read());
    };
    const onFocus = () => setCompleted(read());
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const markDone = useCallback((id: string) => {
    setCompleted((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      write(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    write([]);
    setCompleted([]);
  }, []);

  const isDone = useCallback((id: string) => completed.includes(id), [completed]);

  return { completed, markDone, reset, isDone };
}
