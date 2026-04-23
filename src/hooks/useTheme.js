import { useState, useEffect } from 'react';

const KEY        = 'buchscanner_theme';
const ACCENT_KEY = 'buchscanner_accent';

// ── Curated themes ────────────────────────────────────────────────────────────
export const THEMES = [
  {
    id: 'papier',
    name: 'Papier',
    description: 'Warm wie ein aufgeschlagenes Buch',
    light: {
      bg: '#F7F4EE', surface: '#FEFCF8', surface2: '#EDE8DC',
      accent: '#B45309', accentHover: '#92400E', accentFg: '#FFFBEB',
      shelfTop: '#C49A3C', shelfFace: '#A67C2E', shelfShadow: 'rgba(0,0,0,0.30)',
    },
    dark: {
      bg: '#1E1A13', surface: '#27221A', surface2: '#322C22',
      accent: '#F59E0B', accentHover: '#D97706', accentFg: '#1A1200',
      shelfTop: '#3A2810', shelfFace: '#28190A', shelfShadow: 'rgba(0,0,0,0.70)',
    },
    swatch: { bg: '#F7F4EE', surface: '#FEFCF8', accent: '#B45309' },
  },
  {
    id: 'nacht',
    name: 'Nacht',
    description: 'OLED-schwarz für störungsfreies Lesen',
    light: {
      bg: '#F3F4F6', surface: '#FFFFFF', surface2: '#E5E7EB',
      accent: '#2563EB', accentHover: '#1D4ED8', accentFg: '#FFFFFF',
      shelfTop: '#9CA3AF', shelfFace: '#6B7280', shelfShadow: 'rgba(0,0,0,0.18)',
    },
    dark: {
      bg: '#000000', surface: '#0F0F0F', surface2: '#1C1C1C',
      accent: '#3B82F6', accentHover: '#2563EB', accentFg: '#EFF6FF',
      shelfTop: '#1C1C1C', shelfFace: '#111111', shelfShadow: 'rgba(0,0,0,0.90)',
    },
    swatch: { bg: '#0F0F0F', surface: '#1C1C1C', accent: '#3B82F6' },
  },
  {
    id: 'smaragd',
    name: 'Smaragd',
    description: 'Tief und ruhig wie ein Wald',
    light: {
      bg: '#F1F8F4', surface: '#FFFFFF', surface2: '#DFF0E6',
      accent: '#166534', accentHover: '#14532D', accentFg: '#F0FDF4',
      shelfTop: '#587A56', shelfFace: '#3E5E3C', shelfShadow: 'rgba(0,0,0,0.25)',
    },
    dark: {
      bg: '#050E08', surface: '#0B1E11', surface2: '#112B18',
      accent: '#4ADE80', accentHover: '#22C55E', accentFg: '#011A09',
      shelfTop: '#152E1C', shelfFace: '#0A1E11', shelfShadow: 'rgba(0,0,0,0.80)',
    },
    swatch: { bg: '#F1F8F4', surface: '#FFFFFF', accent: '#166534' },
  },
  {
    id: 'daemmerung',
    name: 'Dämmerung',
    description: 'Tiefes Violett für lange Lesenächte',
    light: {
      bg: '#F6F2FF', surface: '#FFFFFF', surface2: '#EBE0FF',
      accent: '#5B21B6', accentHover: '#4C1D95', accentFg: '#FFFFFF',
      shelfTop: '#6A5C8C', shelfFace: '#524A72', shelfShadow: 'rgba(0,0,0,0.22)',
    },
    dark: {
      bg: '#08051A', surface: '#110D28', surface2: '#1C1538',
      accent: '#C4B5FD', accentHover: '#A78BFA', accentFg: '#08051A',
      shelfTop: '#1F1640', shelfFace: '#140F2E', shelfShadow: 'rgba(0,0,0,0.85)',
    },
    swatch: { bg: '#08051A', surface: '#1C1538', accent: '#C4B5FD' },
  },
];

// ── Preset accent overrides ───────────────────────────────────────────────────
// Each entry: [accent, accentHover, accentFg]
export const ACCENT_PRESETS = [
  { id: 'default', label: 'Standard',  hex: null },                                   // uses theme default
  { id: 'blue',    label: 'Blau',      hex: '#2563EB', hover: '#1D4ED8', fg: '#EFF6FF' },
  { id: 'teal',    label: 'Petrol',    hex: '#0D9488', hover: '#0F766E', fg: '#F0FDFA' },
  { id: 'green',   label: 'Grün',      hex: '#16A34A', hover: '#15803D', fg: '#F0FDF4' },
  { id: 'amber',   label: 'Amber',     hex: '#D97706', hover: '#B45309', fg: '#FFFBEB' },
  { id: 'red',     label: 'Rot',       hex: '#DC2626', hover: '#B91C1C', fg: '#FEF2F2' },
  { id: 'rose',    label: 'Rose',      hex: '#E11D48', hover: '#BE123C', fg: '#FFF1F2' },
  { id: 'violet',  label: 'Violett',   hex: '#7C3AED', hover: '#6D28D9', fg: '#F5F3FF' },
  { id: 'indigo',  label: 'Indigo',    hex: '#4F46E5', hover: '#4338CA', fg: '#EEF2FF' },
  { id: 'slate',   label: 'Schiefer',  hex: '#475569', hover: '#334155', fg: '#F8FAFC' },
];

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

function applyTheme(themeId, accentOverride = null) {
  const theme  = getTheme(themeId);
  const isDark = document.documentElement.classList.contains('dark');
  const colors = isDark ? theme.dark : theme.light;
  const el     = document.documentElement;
  el.setAttribute('data-theme', themeId);
  el.style.setProperty('--theme-bg',        colors.bg);
  el.style.setProperty('--theme-surface',   colors.surface);
  el.style.setProperty('--theme-surface-2', colors.surface2);
  // Apply accent — override wins if set
  if (accentOverride) {
    el.style.setProperty('--accent',       accentOverride.hex);
    el.style.setProperty('--accent-hover', accentOverride.hover);
    el.style.setProperty('--accent-fg',    accentOverride.fg);
  } else {
    el.style.setProperty('--accent',       colors.accent);
    el.style.setProperty('--accent-hover', colors.accentHover);
    el.style.setProperty('--accent-fg',    colors.accentFg);
  }
  el.style.setProperty('--shelf-top',    colors.shelfTop);
  el.style.setProperty('--shelf-face',   colors.shelfFace);
  el.style.setProperty('--shelf-shadow', colors.shelfShadow);
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem(KEY) ?? 'papier');
  const [accent, setAccentState] = useState(() => localStorage.getItem(ACCENT_KEY) ?? 'default');

  const setTheme = (id) => {
    setThemeState(id);
    localStorage.setItem(KEY, id);
  };

  const setAccent = (id) => {
    setAccentState(id);
    localStorage.setItem(ACCENT_KEY, id);
  };

  const accentOverride = ACCENT_PRESETS.find((a) => a.id === accent && a.hex) ?? null;

  useEffect(() => {
    applyTheme(theme, accentOverride);
    const observer = new MutationObserver(() => applyTheme(theme, accentOverride));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [theme, accent]); // eslint-disable-line react-hooks/exhaustive-deps

  return { theme, setTheme, accent, setAccent };
}
