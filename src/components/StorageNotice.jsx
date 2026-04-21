import { useState } from 'react';

const KEY = 'buchscanner_storage_notice_seen';

export function StorageNotice() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(KEY));

  const dismiss = () => {
    localStorage.setItem(KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="sm:hidden mx-4 mt-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-3 flex gap-3 items-start">
      <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Daten werden lokal gespeichert</p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
          Deine Bücher bleiben nur auf diesem Gerät. Nutze Export (Einstellungen) für ein Backup.
        </p>
      </div>
      <button onClick={dismiss} className="shrink-0 text-amber-500 hover:text-amber-700 dark:text-amber-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
