import { THEMES } from '../hooks/useTheme';

export function SettingsModal({ books, onImport, onClose, onEditProfile, dark, onToggleDark, theme, onSetTheme }) {
  const handleExport = () => {
    const json = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), books }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mediathek-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const importedBooks = data.books ?? (Array.isArray(data) ? data : []);
        onImport(importedBooks);
        onClose();
      } catch {
        alert('Ungültige JSON-Datei.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 theme-surface w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl">
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Einstellungen</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            {/* Theme picker */}
            <div className="px-1 pb-1">
              <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">Design</p>
              <div className="grid grid-cols-4 gap-2">
                {THEMES.map((t) => {
                  const active = theme === t.id;
                  const colors = dark ? t.dark : t.light;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onSetTheme(t.id)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                        active
                          ? 'border-amber-500 shadow-md scale-105'
                          : 'border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500'
                      }`}
                      title={t.name}
                    >
                      {/* Mini preview */}
                      <div className="h-14 flex flex-col" style={{ backgroundColor: colors.bg }}>
                        {/* Fake header bar */}
                        <div className="h-4 flex items-center px-1.5 gap-1" style={{ backgroundColor: colors.surface2 }}>
                          <div className="w-2 h-1 rounded-sm" style={{ backgroundColor: t.swatch[2] }} />
                        </div>
                        {/* Fake cards */}
                        <div className="flex-1 p-1 flex gap-1">
                          {[0, 1].map((i) => (
                            <div key={i} className="flex-1 rounded-sm" style={{ backgroundColor: colors.surface }} />
                          ))}
                        </div>
                      </div>
                      {/* Theme name */}
                      <div className="px-1 py-1 bg-white dark:bg-stone-800 text-center">
                        <p className="text-[10px] font-semibold text-stone-700 dark:text-stone-200 leading-none">{t.name}</p>
                      </div>
                      {/* Active checkmark */}
                      {active && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-stone-100 dark:border-stone-800 my-1" />

            {/* Dark Mode */}
            <button onClick={onToggleDark} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-left">
              <svg className="w-5 h-5 text-stone-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="text-sm font-medium text-stone-800 dark:text-stone-200 flex-1">Dark Mode</span>
              <div className={`w-10 h-6 rounded-full transition-colors ${dark ? 'bg-amber-500' : 'bg-stone-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${dark ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </button>

            {/* Profil */}
            <button onClick={() => { onEditProfile(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-left">
              <svg className="w-5 h-5 text-stone-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium text-stone-800 dark:text-stone-200">Profil bearbeiten</span>
            </button>

            <div className="border-t border-stone-100 dark:border-stone-800 pt-2 mt-2">
              <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-1 mb-2">Daten</p>

              {/* Export */}
              <button onClick={handleExport} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-left">
                <svg className="w-5 h-5 text-stone-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Bibliothek exportieren</p>
                  <p className="text-xs text-stone-400">{books.length} Bücher als JSON</p>
                </div>
              </button>

              {/* Import */}
              <label className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors cursor-pointer">
                <svg className="w-5 h-5 text-stone-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Bibliothek importieren</p>
                  <p className="text-xs text-stone-400">JSON-Datei einspielen</p>
                </div>
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
