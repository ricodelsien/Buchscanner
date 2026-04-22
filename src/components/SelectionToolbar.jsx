import { useState } from 'react';
import { resolveHex } from '../services/shelfColors';

export function SelectionToolbar({ count, total, shelves, onSelectAll, onDeselectAll, onDelete, onAddToShelf, onExit }) {
  const [shelfOpen, setShelfOpen] = useState(false);
  const allSelected = count === total && total > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Regalauswahl-Picker */}
      {shelfOpen && (
        <div className="mx-4 mb-2 theme-surface rounded-2xl shadow-2xl border border-stone-100 dark:border-stone-800 overflow-hidden max-h-52 overflow-y-auto">
          <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-4 pt-3 pb-1">
            Regal zuweisen
          </p>
          {shelves.map((s) => {
            const hex = resolveHex(s.color);
            return (
              <button
                key={s.id}
                onClick={() => { onAddToShelf(s.id); setShelfOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors text-left"
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10" style={{ backgroundColor: hex }} />
                <span className="text-sm text-stone-800 dark:text-stone-200">{s.name}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShelfOpen(false)}
            className="w-full px-4 py-2.5 text-sm text-stone-400 hover:text-stone-600 text-center border-t border-stone-100 dark:border-stone-800"
          >
            Abbrechen
          </button>
        </div>
      )}

      {/* Haupt-Toolbar */}
      <div className="theme-surface border-t border-stone-200 dark:border-stone-800 shadow-2xl px-4 pt-3 pb-safe flex items-center gap-3">
        {/* Alle auswählen */}
        <button
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
          style={allSelected
            ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }
            : { borderColor: 'var(--accent)', backgroundColor: 'transparent' }}
          title={allSelected ? 'Auswahl aufheben' : 'Alle auswählen'}
        >
          {allSelected && (
            <svg className="w-3.5 h-3.5" fill="none" stroke="var(--accent-fg)" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <span className="text-sm font-medium text-stone-700 dark:text-stone-300 flex-1 truncate">
          {count === 0 ? 'Nichts ausgewählt' : `${count} ${count === 1 ? 'Buch' : 'Bücher'} ausgewählt`}
        </span>

        {/* Aktionen */}
        <div className="flex items-center gap-2 shrink-0">
          {shelves.length > 0 && (
            <button
              onClick={() => setShelfOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Regal
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={count === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Löschen
          </button>
          <button
            onClick={onExit}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            title="Auswahl beenden"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
