import { useCallback, useEffect, useState } from 'react';
import { ASSISTANT_BY_ID, type Assistant } from '@/data/assistants';

const LS_KEY = 'career:assistant:claimed:v1';
const EVT = 'career:assistant:changed';

function readClaimed(): string | null {
  try { return localStorage.getItem(LS_KEY); } catch { return null; }
}

export function useAssistant() {
  const [id, setId] = useState<string | null>(readClaimed);

  useEffect(() => {
    const onChange = () => setId(readClaimed());
    window.addEventListener(EVT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const claim = useCallback((newId: string) => {
    try {
      localStorage.setItem(LS_KEY, newId);
      window.dispatchEvent(new Event(EVT));
    } catch {}
  }, []);

  const release = useCallback(() => {
    try {
      localStorage.removeItem(LS_KEY);
      window.dispatchEvent(new Event(EVT));
    } catch {}
  }, []);

  const assistant: Assistant | null = id ? (ASSISTANT_BY_ID[id] || null) : null;
  return { assistant, claim, release };
}
