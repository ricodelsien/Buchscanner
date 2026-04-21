import { useState, useRef } from 'react';

export function ScanInput({ onScan, isLoading }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
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

  return (
    <>
      {/* Mobile FAB */}
      <button
        onClick={openPanel}
        disabled={isLoading}
        className="sm:hidden fixed bottom-6 right-6 z-30 w-14 h-14 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label="ISBN scannen oder eingeben"
      >
        {isLoading ? (
          <Spinner />
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5V16m-8 0h.01M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2M4 12v4m0 4h4" />
          </svg>
        )}
      </button>

      {/* Mobile overlay input */}
      {open && (
        <div className="sm:hidden fixed inset-0 z-40 bg-black/40 flex items-end" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full bg-white rounded-t-2xl p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-stone-900 mb-4">
              ISBN scannen oder eingeben
            </h3>
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

      {/* Desktop inline input */}
      <div className="hidden sm:flex items-center gap-2">
        {isLoading && <Spinner className="text-stone-400" />}
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

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
