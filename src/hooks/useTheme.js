import { useState, useEffect } from 'react';

const KEY = 'buchscanner_theme';

export const THEMES = [
  {
    id: 'bernstein',
    name: 'Bernstein',
    description: 'Warm & gemütlich',
    light: { bg: '#fafaf9', surface: '#ffffff', surface2: '#f5f5f4', accent: '#d97706', accentHover: '#b45309', accentFg: '#ffffff' },
    dark:  { bg: '#0c0a09', surface: '#1c1917', surface2: '#231f1d', accent: '#f59e0b', accentHover: '#d97706', accentFg: '#000000' },
    swatch: { bg: '#fafaf9', surface: '#ffffff', accent: '#d97706' },
  },
  {
    id: 'schiefer',
    name: 'Schiefer',
    description: 'Kühl & modern',
    light: { bg: '#f1f5f9', surface: '#ffffff', surface2: '#e2e8f0', accent: '#4f46e5', accentHover: '#3730a3', accentFg: '#ffffff' },
    dark:  { bg: '#0f172a', surface: '#1e293b', surface2: '#263348', accent: '#818cf8', accentHover: '#6366f1', accentFg: '#ffffff' },
    swatch: { bg: '#f1f5f9', surface: '#ffffff', accent: '#4f46e5' },
  },
  {
    id: 'sepia',
    name: 'Sepia',
    description: 'Papier & Bücher',
    light: { bg: '#fdf7ed', surface: '#fefcf5', surface2: '#f0e5cf', accent: '#b45309', accentHover: '#92400e', accentFg: '#ffffff' },
    dark:  { bg: '#1a1410', surface: '#26200e', surface2: '#352b14', accent: '#fb923c', accentHover: '#ea580c', accentFg: '#ffffff' },
    swatch: { bg: '#fdf7ed', surface: '#fefcf5', accent: '#b45309' },
  },
  {
    id: 'nacht',
    name: 'Nacht',
    description: 'Tiefes Schwarz',
    light: { bg: '#f9fafb', surface: '#ffffff', surface2: '#f3f4f6', accent: '#6d28d9', accentHover: '#5b21b6', accentFg: '#ffffff' },
    dark:  { bg: '#050505', surface: '#111110', surface2: '#1c1c1a', accent: '#a78bfa', accentHover: '#8b5cf6', accentFg: '#ffffff' },
    swatch: { bg: '#111110', surface: '#1c1c1a', accent: '#a78bfa' },
  },
];

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

function applyTheme(themeId) {
  const theme = getTheme(themeId);
  const isDark = document.documentElement.classList.contains('dark');
  const colors = isDark ? theme.dark : theme.light;
  const el = document.documentElement;
  el.setAttribute('data-theme', themeId);
  el.style.setProperty('--theme-bg', colors.bg);
  el.style.setProperty('--theme-surface', colors.surface);
  el.style.setProperty('--theme-surface-2', colors.surface2);
  el.style.setProperty('--accent', colors.accent);
  el.style.setProperty('--accent-hover', colors.accentHover);
  el.style.setProperty('--accent-fg', colors.accentFg);
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem(KEY) ?? 'bernstein');

  const setTheme = (id) => {
    setThemeState(id);
    localStorage.setItem(KEY, id);
  };

  useEffect(() => {
    applyTheme(theme);
    const observer = new MutationObserver(() => applyTheme(theme));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [theme]);

  return { theme, setTheme };
}
