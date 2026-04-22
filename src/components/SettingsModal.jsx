import { THEMES, ACCENT_PRESETS } from '../hooks/useTheme';

export function SettingsModal({
  books, onImport, onClose, onEditProfile,
  dark, onToggleDark,
  theme, onSetTheme,
  accent, onSetAccent,
}) {
  const handleExport = () => {
    const json = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), books }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `mediathek-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
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
      } catch { alert('Ungültige JSON-Datei.'); }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 theme-surface w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">

        {/* Handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
        </div>

        <div className="px-5 pt-4 pb-6 space-y-5 max-h-[85vh] overflow-y-auto">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Einstellungen</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Design ────────────────────────────────────────────────────────── */}
          <section>
            <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Design</p>

            {/* Theme tiles — 2 columns */}
            <div className="grid grid-cols-2 gap-2.5">
              {THEMES.map((t) => {
                const active = theme === t.id;
                const preview = dark ? t.dark : t.light;

                return (
                  <button
                    key={t.id}
                    onClick={() => onSetTheme(t.id)}
                    title={t.description}
                    className="relative rounded-2xl overflow-hidden transition-all duration-200 text-left"
                    style={{
                      boxShadow: active
                        ? `0 0 0 2.5px ${preview.accent}, 0 4px 16px rgba(0,0,0,0.15)`
                        : '0 0 0 1.5px rgba(0,0,0,0.08)',
                      transform: active ? 'scale(1.025)' : 'scale(1)',
                    }}
                  >
                    {/* Preview area */}
                    <div className="h-24 flex flex-col" style={{ backgroundColor: preview.bg }}>
                      {/* Mini filter bar */}
                      <div className="flex items-center gap-1 px-2 pt-2 pb-1">
                        <div className="h-2 w-10 rounded-full" style={{ backgroundColor: preview.accent, opacity: 0.9 }} />
                        <div className="h-2 w-6 rounded-full" style={{ backgroundColor: preview.surface2 }} />
                        <div className="h-2 w-6 rounded-full" style={{ backgroundColor: preview.surface2 }} />
                      </div>
                      {/* Mini book grid */}
                      <div className="flex-1 px-2 pb-1 grid grid-cols-4 gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="rounded"
                            style={{
                              backgroundColor: preview.surface,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                              paddingTop: '130%',
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Name row */}
                    <div
                      className="px-3 py-2 flex items-center justify-between"
                      style={{ backgroundColor: preview.surface2 }}
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold leading-none truncate" style={{ color: preview.accent }}>
                          {t.name}
                        </p>
                      </div>
                      {active && (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 ml-1"
                          style={{ backgroundColor: preview.accent }}
                        >
                          <svg className="w-2.5 h-2.5" fill="none" stroke={preview.accentFg} strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Accent colour overrides */}
            <div className="mt-4">
              <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2.5">Akzentfarbe</p>
              <div className="flex flex-wrap gap-2">
                {ACCENT_PRESETS.map((a) => {
                  const isActive = accent === a.id;
                  const color    = a.hex ?? 'var(--accent)';
                  return (
                    <button
                      key={a.id}
                      onClick={() => onSetAccent(a.id)}
                      title={a.label}
                      className="relative flex items-center justify-center transition-transform"
                      style={{ transform: isActive ? 'scale(1.18)' : 'scale(1)' }}
                    >
                      <div
                        className="w-7 h-7 rounded-full"
                        style={{
                          backgroundColor: color,
                          boxShadow: isActive
                            ? `0 0 0 2px var(--theme-surface), 0 0 0 4px ${color}`
                            : '0 1px 3px rgba(0,0,0,0.2)',
                          border: a.hex ? 'none' : '2px dashed rgba(0,0,0,0.25)',
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="border-t border-stone-100 dark:border-stone-800" />

          {/* ── Dark Mode ──────────────────────────────────────────────────────── */}
          <section className="space-y-2">
            <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Darstellung</p>

            <button
              onClick={onToggleDark}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left"
            >
              <svg className="w-5 h-5 text-stone-500 dark:text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="text-sm font-medium text-stone-800 dark:text-stone-200 flex-1">Dark Mode</span>
              <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${dark ? 'bg-[var(--accent)]' : 'bg-stone-200 dark:bg-stone-700'}`}>
                <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform duration-200 shadow-sm ${dark ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>

            <button
              onClick={() => { onEditProfile(); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left"
            >
              <svg className="w-5 h-5 text-stone-500 dark:text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium text-stone-800 dark:text-stone-200 flex-1">Profil bearbeiten</span>
              <svg className="w-4 h-4 text-stone-300 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </section>

          <div className="border-t border-stone-100 dark:border-stone-800" />

          {/* ── Daten ─────────────────────────────────────────────────────────── */}
          <section className="space-y-2">
            <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">Daten</p>

            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-left"
            >
              <svg className="w-5 h-5 text-stone-500 dark:text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <div>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Bibliothek exportieren</p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{books.length} {books.length === 1 ? 'Buch' : 'Bücher'} als JSON</p>
              </div>
            </button>

            <label className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer">
              <svg className="w-5 h-5 text-stone-500 dark:text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <div>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">Bibliothek importieren</p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">JSON-Datei einspielen</p>
              </div>
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </section>

        </div>
      </div>
    </div>
  );
}
