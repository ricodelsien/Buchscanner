export const SHELF_COLORS = [
  { id: 'amber',  chip: 'bg-amber-100 text-amber-800 border-amber-200',   dot: 'bg-amber-500',   active: 'bg-amber-500 text-white border-amber-500' },
  { id: 'blue',   chip: 'bg-blue-100 text-blue-800 border-blue-200',      dot: 'bg-blue-500',    active: 'bg-blue-500 text-white border-blue-500' },
  { id: 'rose',   chip: 'bg-rose-100 text-rose-800 border-rose-200',      dot: 'bg-rose-500',    active: 'bg-rose-500 text-white border-rose-500' },
  { id: 'green',  chip: 'bg-green-100 text-green-800 border-green-200',   dot: 'bg-green-500',   active: 'bg-green-500 text-white border-green-500' },
  { id: 'violet', chip: 'bg-violet-100 text-violet-800 border-violet-200', dot: 'bg-violet-500', active: 'bg-violet-500 text-white border-violet-500' },
  { id: 'orange', chip: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500', active: 'bg-orange-500 text-white border-orange-500' },
  { id: 'teal',   chip: 'bg-teal-100 text-teal-800 border-teal-200',      dot: 'bg-teal-500',    active: 'bg-teal-500 text-white border-teal-500' },
  { id: 'pink',   chip: 'bg-pink-100 text-pink-800 border-pink-200',      dot: 'bg-pink-500',    active: 'bg-pink-500 text-white border-pink-500' },
];

export const DEFAULT_COLOR = 'amber';

export function getColor(colorId) {
  return SHELF_COLORS.find((c) => c.id === colorId) ?? SHELF_COLORS[0];
}
