import { useState, useRef } from 'react';
import { COLOR_PRESETS, DEFAULT_COLOR } from '../services/shelfColors';

export function ShelfCreateModal({ onSave, onClose, onDelete, existing }) {
  const [name, setName] = useState(existing?.name ?? '');
  const [color, setColor] = useState(() => {
    if (!existing) return DEFAULT_COLOR;
    // resolve named → hex
    const named = { amber:'#f59e0b', blue:'#3b82f6', rose:'#f43f5e', green:'#22c55e', violet:'#8b5cf6', orange:'#f97316', teal:'#14b8a6', pink:'#ec4899' };
    return named[existing.color] ?? existing.color ?? DEFAULT_COLOR;
  });
  const colorInputRef = useRef(null);

  const save = () => {
    if (!name.trim()) return;
    onSave(name.trim(), color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 theme-surface w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl">
        <div className="p-5">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">
            {existing ? 'Regal bearbeiten' : 'Neues Regal'}
          </h3>

          {/* Name */}
          <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onClose(); }}
            placeholder="z.B. Lieblinge, Roman, Sachbuch…"
            autoFocus
            className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4"
          />

          {/* Color */}
          <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
            Farbe
          </label>

          {/* Preset swatches */}
          <div className="grid grid-cols-8 gap-1.5 mb-3">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center"
                style={{ backgroundColor: c }}
              >
                {color === c && (
                  <svg className="w-3.5 h-3.5 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {/* Custom color wheel */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => colorInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 transition-colors text-xs text-stone-600 dark:text-stone-300"
            >
              <div className="w-5 h-5 rounded-full border-2 border-stone-300 dark:border-stone-600" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} />
              Eigene Farbe
              <input
                ref={colorInputRef}
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="sr-only"
              />
            </button>

            {/* Preview */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 dark:text-stone-500">Vorschau:</span>
              <span
                className="px-3 py-1 rounded-full text-xs font-medium border"
                style={{ backgroundColor: color + '22', color, borderColor: color + '55' }}
              >
                {name || 'Regal'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40"
              style={{ backgroundColor: color }}
            >
              {existing ? 'Speichern' : 'Erstellen'}
            </button>
            {existing && onDelete && (
              <button
                onClick={() => { if (window.confirm(`"${name}" löschen?`)) onDelete(); }}
                className="px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Regal löschen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
