import { useState, useEffect } from 'react';

const KEY = 'buchscanner_theme';

export const THEMES = [
  {
    id: 'bernstein',
    name: 'Bernstein',
    description: 'Warm & gemütlich',
    light: { bg: '#fafaf9', surface: '#ffffff', surface2: '#f5f5f4' },
    dark:  { bg: '#0c0a09', surface: '#1c1917', surface2: '#231f1d' },
    swatch: ['#fafaf9', '#ffffff', '#f59e0b'],
  },
  {
    id: 'schiefer',
    name: 'Schiefer',
    description: 'Kühl & modern',
    light: { bg: '#f8fafc', surface: '#ffffff', surface2: '#f1f5f9' },
    dark:  { bg: '#0f172a', surface: '#1e293b', surface2: '#263348' },
    swatch: ['#f1f5f9', '#ffffff', '#6366f1'],
  },
  {
    id: 'sepia',
    name: 'Sepia',
    description: 'Papier & Bücher',
    light: { bg: '#fdf7ed', surface: '#fefcf5', surface2: '#f0e5cf' },
    dark:  { bg: '#1a1410', surface: '#261e14', surface2: '#35291a' },
    swatch: ['#fdf7ed', '#fefcf5', '#b45309'],
  },
  {
    id: 'nacht',
    name: 'Nacht',
    description: 'Tiefes Schwarz',
    light: { bg: '#fafaf9', surface: '#ffffff', surface2: '#f5f5f4' },
    dark:  { bg: '#020202', surface: '#0e0e0d', surface2: '#1a1a19' },
    swatch: ['#111110', '#0e0e0d', '#f59e0b'],
  },
];

function applyTheme(themeId) {
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const isDark = document.documentElement.classList.contains('dark');
  const colors = isDark ? theme.dark : theme.light;
  const root = document.documentElement;
  root.setAttribute('data-theme', themeId);
  root.style.setProperty('--theme-bg', colors.bg);
  root.style.setProperty('--theme-surface', colors.surface);
  root.style.setProperty('--theme-surface-2', colors.surface2);
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem(KEY) ?? 'bernstein');

  const setTheme = (id) => {
    setThemeState(id);
    localStorage.setItem(KEY, id);
  };

  // Re-apply whenever theme or dark mode changes
  useEffect(() => {
    applyTheme(theme);
    // Watch for dark class changes (toggled independently)
    const observer = new MutationObserver(() => applyTheme(theme));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [theme]);

  return { theme, setTheme };
}
