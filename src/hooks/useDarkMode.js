import { useState, useEffect } from 'react';

const KEY = 'buchscanner_darkmode';

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem(KEY);
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(KEY, dark);
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}
