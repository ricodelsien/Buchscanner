import { useState, useRef } from 'react';
import { CameraScanner } from './CameraScanner';

export function ScanInput({ onScan, isLoading }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const inputRef = useRef(null);

  const submit = () => {
    const isbn = value.replace(/[^0-9X]/gi, '');
    if (isbn.length >= 10) {
      onScan(isbn);
      setValue('');
      setOpen(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') submit();
  };

  const openPanel = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCameraScan = (isbn) => {
    setCameraOpen(false);
    onScan(isbn);
  };

  return (
    <>
      {/* Kamera-Scanner Fullscreen */}
      {cameraOpen && (
        <CameraScanner
          onScan={handleCameraScan}
          onClose={() => setCameraOpen(false)}
        />
      )}

      {/* FAB — sichtbar auf allen Bildschirmgrößen */}
      <button
        onClick={openPanel}
        disabled={isLoading}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label="ISBN scannen oder eingeben"
      >
        {isLoading ? <Spinner /> : <BarcodeIcon />}
      </button>

      {/* Bottom sheet — funktioniert auf Desktop und Mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-end"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full theme-surface rounded-t-2xl p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-stone-900 mb-4">
              ISBN hinzufügen
            </h3>

            {/* Kamera-Button */}
            <button
              onClick={() => { setOpen(false); setCameraOpen(true); }}
              className="w-full flex items-center gap-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-4 py-3.5 mb-3 transition-colors"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">Kamera scannen</span>
            </button>

            {/* Trennlinie */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs text-stone-400">oder manuell</span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            {/* Manuelle Eingabe */}
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKey}
                data-scanner="true"
                placeholder="z.B. 9783596512560"
                className="flex-1 border border-stone-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
              <button
                onClick={submit}
                disabled={value.replace(/\D/g, '').length < 10}
                className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-white rounded-lg px-5 py-3 text-sm font-medium transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop inline */}
      <div className="hidden sm:flex items-center gap-2">
        {isLoading && <Spinner />}
        {/* Kamera-Button Desktop */}
        <button
          onClick={() => setCameraOpen(true)}
          disabled={isLoading}
          title="Kamera scannen"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          data-scanner="true"
          placeholder="ISBN scannen oder eingeben..."
          className="w-64 border border-stone-200 rounded-lg px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:bg-white transition-colors"
        />
        <button
          onClick={submit}
          disabled={value.replace(/\D/g, '').length < 10 || isLoading}
          className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
        >
          Hinzufügen
        </button>
      </div>
    </>
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
    <svg className="w-5 h-5 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
