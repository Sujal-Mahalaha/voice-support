import { useState, useCallback } from 'react';

const STORAGE_KEY = 'voice_call_history';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export function useCallHistory() {
  const [history, setHistory] = useState(load);

  const addCall = useCallback((entry) => {
    setHistory(prev => {
      const next = [entry, ...prev].slice(0, 50); // keep last 50
      save(next);
      return next;
    });
  }, []);

  const removeCall = useCallback((id) => {
    setHistory(prev => {
      const next = prev.filter(c => c.id !== id);
      save(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    save([]);
    setHistory([]);
  }, []);

  return { history, addCall, removeCall, clearAll };
}
