// Named colors map to hex for backward compat
const NAMED_TO_HEX = {
  amber:  '#f59e0b',
  blue:   '#3b82f6',
  rose:   '#f43f5e',
  green:  '#22c55e',
  violet: '#8b5cf6',
  orange: '#f97316',
  teal:   '#14b8a6',
  pink:   '#ec4899',
};

/** Predefined swatches for the color picker */
export const COLOR_PRESETS = [
  '#f59e0b', '#ef4444', '#f97316', '#84cc16',
  '#22c55e', '#14b8a6', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#f43f5e', '#a16207',
  '#0f766e', '#1d4ed8', '#7c3aed', '#be185d',
];

export const DEFAULT_COLOR = '#f59e0b';

/** Resolve named color or passthrough hex */
export function resolveHex(color) {
  return NAMED_TO_HEX[color] ?? color ?? DEFAULT_COLOR;
}

/** Generate inline chip styles from a hex color */
export function chipStyle(hex, active = false) {
  if (active) {
    return { backgroundColor: hex, color: '#fff', borderColor: hex };
  }
  return {
    backgroundColor: hex + '22',
    color: hex,
    borderColor: hex + '55',
  };
}

// Legacy support — some components still use getColor()
export function getColor(colorId) {
  const hex = resolveHex(colorId);
  return {
    chip: '',
    dot: '',
    active: '',
    hex,
    chipStyle: (active) => chipStyle(hex, active),
  };
}
