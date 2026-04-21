import { useState, useCallback } from 'react';
import { DEFAULT_COLOR } from '../services/shelfColors';

const KEY = 'buchscanner_shelves';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function persist(shelves) {
  localStorage.setItem(KEY, JSON.stringify(shelves));
}

export function useShelves() {
  const [shelves, setShelves] = useState(load);

  const addShelf = useCallback((name, color = DEFAULT_COLOR) => {
    const shelf = { id: crypto.randomUUID(), name, color, createdAt: Date.now() };
    setShelves((prev) => {
      const next = [...prev, shelf];
      persist(next);
      return next;
    });
    return shelf;
  }, []);

  const updateShelf = useCallback((id, patch) => {
    setShelves((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, ...patch } : s));
      persist(next);
      return next;
    });
  }, []);

  const removeShelf = useCallback((id) => {
    setShelves((prev) => {
      const next = prev.filter((s) => s.id !== id);
      persist(next);
      return next;
    });
  }, []);

  /** Find by name (case-insensitive) or create if not found. */
  const findOrCreate = useCallback(
    (name, color) => {
      const existing = load().find((s) => s.name.toLowerCase() === name.toLowerCase());
      if (existing) return existing;
      const shelf = { id: crypto.randomUUID(), name, color: color ?? DEFAULT_COLOR, createdAt: Date.now() };
      setShelves((prev) => {
        const next = [...prev, shelf];
        persist(next);
        return next;
      });
      return shelf;
    },
    []
  );

  return { shelves, addShelf, updateShelf, removeShelf, findOrCreate };
}
