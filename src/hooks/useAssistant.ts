import { useCallback, useEffect, useState } from 'react';
import { ASSISTANT_BY_ID, ASSISTANTS, type Assistant } from '@/data/assistants';

const LS_CLAIMED = 'career:assistant:claimed:v3';
const LS_ACTIVE = 'career:assistant:active:v1';
const EVT = 'career:assistant:changed';

function readClaimed(): string[] {
  try {
    const raw = localStorage.getItem(LS_CLAIMED);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}

function writeClaimed(ids: string[]) {
  try { localStorage.setItem(LS_CLAIMED, JSON.stringify(ids)); } catch {}
}

function readActive(): string | null {
  try { return localStorage.getItem(LS_ACTIVE); } catch { return null; }
}

function writeActive(id: string | null) {
  try {
    if (id) localStorage.setItem(LS_ACTIVE, id);
    else localStorage.removeItem(LS_ACTIVE);
  } catch {}
}

export function useAssistant() {
  const [ids, setIds] = useState<string[]>(readClaimed);
  const [activeId, setActiveId] = useState<string | null>(readActive);

  useEffect(() => {
    const onChange = () => {
      setIds(readClaimed());
      setActiveId(readActive());
    };
    window.addEventListener(EVT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  // Claim: add if not present (no longer toggles — always adds)
  const claim = useCallback((id: string) => {
    setIds(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      writeClaimed(next);
      // Auto-set as active when first claimed
      if (!readActive()) {
        writeActive(id);
        setActiveId(id);
      }
      window.dispatchEvent(new Event(EVT));
      return next;
    });
  }, []);

  // Release a single assistant
  const release = useCallback((id: string) => {
    setIds(prev => {
      const next = prev.filter(x => x !== id);
      writeClaimed(next);
      if (readActive() === id) {
        const newActive = next[0] ?? null;
        writeActive(newActive);
        setActiveId(newActive);
      }
      window.dispatchEvent(new Event(EVT));
      return next;
    });
  }, []);

  // Release all
  const releaseAll = useCallback(() => {
    writeClaimed([]);
    writeActive(null);
    setIds([]);
    setActiveId(null);
    window.dispatchEvent(new Event(EVT));
  }, []);

  // Set active assistant
  const setActive = useCallback((id: string | null) => {
    writeActive(id);
    setActiveId(id);
    window.dispatchEvent(new Event(EVT));
  }, []);

  const isClaimed = useCallback((id: string) => ids.includes(id), [ids]);

  // All claimed assistants
  const assistants: Assistant[] = ids.map(id => ASSISTANT_BY_ID[id]).filter(Boolean);

  // Active assistant: use activeId, fallback to first claimed, fallback to null
  const assistant: Assistant | null =
    (activeId ? ASSISTANT_BY_ID[activeId] ?? null : null) ||
    assistants[0] ||
    null;

  return { assistant, assistants, ids, activeId, claim, release, releaseAll, setActive, isClaimed };
}
