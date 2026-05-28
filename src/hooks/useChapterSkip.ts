import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'quest:skip:v1';

export type ChapterId = 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ch6' | 'ch7';

export type Ch1SkipData = {
  positions: string[];    // 倾向岗位
  cities?: string[];      // 期望城市
  note?: string;          // 补充说明
};

export type Ch2SkipData = {
  resumeHighlights: string; // 简历亮点要点
};

export type Ch3SkipData = {
  targetCompanies: string;
};

export type SkipPayload = {
  ch1?: Ch1SkipData;
  ch2?: Ch2SkipData;
  ch3?: Ch3SkipData;
  ch4?: Record<string, never>;
  ch5?: Record<string, never>;
  ch6?: Record<string, never>;
  ch7?: Record<string, never>;
};


function read(): SkipPayload {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

function write(p: SkipPayload) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

export function useChapterSkip() {
  const [data, setData] = useState<SkipPayload>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setData(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const saveSkip = useCallback(<K extends ChapterId>(ch: K, payload: NonNullable<SkipPayload[K]>) => {
    setData(prev => {
      const next = { ...prev, [ch]: payload } as SkipPayload;
      write(next);
      return next;
    });
  }, []);

  const resetSkip = useCallback(() => {
    write({});
    setData({});
  }, []);

  return { skipData: data, saveSkip, resetSkip };
}
