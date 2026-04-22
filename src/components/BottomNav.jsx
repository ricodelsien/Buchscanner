/**
 * Mobile Bottom Navigation
 * Zeigt drei Aktionen: Hinzufügen | [Barcode-Scanner] | Einstellungen
 * Verschwindet im Auswahlmodus (SelectionToolbar übernimmt dann den unteren Bereich).
 */
export function BottomNav({ onScanClick, onAddClick, onOpenSettings, isLoading, selectMode }) {
  if (selectMode) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 theme-surface border-t border-stone-200 dark:border-stone-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative h-14 flex items-center">

        {/* Links: Manuell hinzufügen */}
        <button
          onClick={onAddClick}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-stone-500 dark:text-stone-400 hover:text-[var(--accent)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-[0.6rem] font-medium">Hinzufügen</span>
        </button>

        {/* Mitte: Barcode-Scanner (hervorgehoben) */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={onScanClick}
            disabled={isLoading}
            className="absolute -top-5 left-1/2 -translate-x-1/2 w-14 h-14 btn-accent rounded-full shadow-xl flex items-center justify-center border-4 border-[var(--theme-bg)] disabled:opacity-60 transition-transform active:scale-95"
            aria-label="Barcode scannen"
          >
            {isLoading ? <Spinner /> : <BarcodeIcon />}
          </button>
        </div>

        {/* Rechts: Einstellungen */}
        <button
          onClick={onOpenSettings}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-stone-500 dark:text-stone-400 hover:text-[var(--accent)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[0.6rem] font-medium">Einstellungen</span>
        </button>
      </div>
    </nav>
  );
}

function BarcodeIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <rect x="2"  y="4" width="2"   height="16" rx="0.5"/>
      <rect x="6"  y="4" width="1"   height="16" rx="0.5"/>
      <rect x="9"  y="4" width="2.5" height="16" rx="0.5"/>
      <rect x="13" y="4" width="1"   height="16" rx="0.5"/>
      <rect x="16" y="4" width="2"   height="16" rx="0.5"/>
      <rect x="20" y="4" width="1.5" height="16" rx="0.5"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
