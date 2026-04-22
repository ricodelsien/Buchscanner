import { useState, useEffect } from 'react';

const KEY = 'buchscanner_theme';

export const THEMES = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Klares Tageslicht — immer hell',
    forcedLight: true,
    light: {
      bg: '#f5f4f0', surface: '#ffffff', surface2: '#edeae3',
      accent: '#1d4ed8', accentHover: '#1e40af', accentFg: '#ffffff',
      shelfTop: '#d4a853', shelfFace: '#b8893a', shelfShadow: 'rgba(0,0,0,0.28)',
    },
    // Same as light — forcedLight ignores dark mode
    dark: {
      bg: '#f5f4f0', surface: '#ffffff', surface2: '#edeae3',
      accent: '#1d4ed8', accentHover: '#1e40af', accentFg: '#ffffff',
      shelfTop: '#d4a853', shelfFace: '#b8893a', shelfShadow: 'rgba(0,0,0,0.28)',
    },
    swatch: { bg: '#f5f4f0', surface: '#ffffff', accent: '#1d4ed8' },
  },
  {
    id: 'intensiv',
    name: 'Intensiv',
    description: 'Dramatisch & kontraststark',
    light: {
      bg: '#fffbf0', surface: '#ffffff', surface2: '#fef3c7',
      accent: '#1e3a8a', accentHover: '#1e40af', accentFg: '#ffffff',
      shelfTop: '#8b6020', shelfFace: '#6f4c18', shelfShadow: 'rgba(0,0,0,0.4)',
    },
    dark: {
      bg: '#060402', surface: '#110d06', surface2: '#1c160c',
      accent: '#fbbf24', accentHover: '#f59e0b', accentFg: '#0a0700',
      shelfTop: '#2a1a06', shelfFace: '#1a1004', shelfShadow: 'rgba(0,0,0,0.75)',
    },
    swatch: { bg: '#060402', surface: '#110d06', accent: '#fbbf24' },
  },
  {
    id: 'gemuetlich',
    name: 'Gemütlich',
    description: 'Warm wie ein Lesezimmer',
    light: {
      bg: '#fef8e8', surface: '#fffcf2', surface2: '#f5e9c8',
      accent: '#78350f', accentHover: '#6b2c0b', accentFg: '#fef3c7',
      shelfTop: '#9b6b3a', shelfFace: '#7d5028', shelfShadow: 'rgba(0,0,0,0.35)',
    },
    dark: {
      bg: '#130900', surface: '#1f1100', surface2: '#2c1800',
      accent: '#fbbf24', accentHover: '#f59e0b', accentFg: '#130900',
      shelfTop: '#4a2c10', shelfFace: '#311c08', shelfShadow: 'rgba(0,0,0,0.65)',
    },
    swatch: { bg: '#fef8e8', surface: '#fffcf2', accent: '#78350f' },
  },
  {
    id: 'modern-lib',
    name: 'Moderne Bibliothek',
    description: 'Sichtbeton & Stahl',
    light: {
      bg: '#e6e6e4', surface: '#f0f0ee', surface2: '#d4d4d0',
      accent: '#0f766e', accentHover: '#0d9488', accentFg: '#ffffff',
      shelfTop: '#9e9e9c', shelfFace: '#828280', shelfShadow: 'rgba(0,0,0,0.22)',
    },
    dark: {
      bg: '#181818', surface: '#222222', surface2: '#2c2c2c',
      accent: '#2dd4bf', accentHover: '#14b8a6', accentFg: '#0a1a18',
      shelfTop: '#383838', shelfFace: '#282828', shelfShadow: 'rgba(0,0,0,0.55)',
    },
    swatch: { bg: '#e6e6e4', surface: '#f0f0ee', accent: '#0f766e' },
  },
];

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

function applyTheme(themeId, forcedLight = false) {
  const theme = getTheme(themeId);
  const isDark = !forcedLight && document.documentElement.classList.contains('dark');
  const colors = isDark ? theme.dark : theme.light;
  const el = document.documentElement;
  el.setAttribute('data-theme', themeId);
  el.style.setProperty('--theme-bg',        colors.bg);
  el.style.setProperty('--theme-surface',   colors.surface);
  el.style.setProperty('--theme-surface-2', colors.surface2);
  el.style.setProperty('--accent',          colors.accent);
  el.style.setProperty('--accent-hover',    colors.accentHover);
  el.style.setProperty('--accent-fg',       colors.accentFg);
  el.style.setProperty('--shelf-top',       colors.shelfTop);
  el.style.setProperty('--shelf-face',      colors.shelfFace);
  el.style.setProperty('--shelf-shadow',    colors.shelfShadow);
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem(KEY) ?? 'standard');

  const setTheme = (id) => {
    setThemeState(id);
    localStorage.setItem(KEY, id);
  };

  useEffect(() => {
    const t = getTheme(theme);

    if (t.forcedLight) {
      // Remove dark class and keep it removed as long as this theme is active
      document.documentElement.classList.remove('dark');
      applyTheme(theme, true);

      const observer = new MutationObserver(() => {
        if (document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.remove('dark');
        }
        applyTheme(theme, true);
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }

    applyTheme(theme, false);
    const observer = new MutationObserver(() => applyTheme(theme, false));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [theme]);

  return { theme, setTheme };
}
