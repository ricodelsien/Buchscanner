import { useState, useRef, useEffect, useCallback } from 'react';
import { CameraScanner } from './CameraScanner';
import { searchBooks } from '../services/bookSearch';

function looksLikeISBN(v) {
  const d = v.replace(/[\s\-]/g, '');
  return /^(97[89])?\d{9}[\dX]$/i.test(d);
}

export function ScanInput({ onScan, isLoading, onAddDirect }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  // Desktop smart-search state
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const submit = () => {
    const isbn = value.replace(/[^0-9X]/gi, '');
    if (isbn.length >= 10) {
      onScan(isbn);
      setValue('');
      setOpen(false);
      setShowDropdown(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') { setShowDropdown(false); setValue(''); }
  };

  const openPanel = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCameraScan = (isbn) => {
    setCameraOpen(false);
    onScan(isbn);
  };

  // Desktop: smart search debounce
  const handleDesktopChange = useCallback((v) => {
    setValue(v);
    clearTimeout(debounceRef.current);

    if (!v.trim() || looksLikeISBN(v)) {
      setShowDropdown(false);
      setSearchResults([]);
      return;
    }

    if (v.trim().length < 2) return;

    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      setShowDropdown(true);
      try {
        const results = await searchBooks(v.trim());
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  }, []);

  const handleAddDirect = useCallback((book) => {
    onAddDirect?.(book);
    setValue('');
    setShowDropdown(false);
    setSearchResults([]);
  }, [onAddDirect]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      {/* Kamera-Scanner Fullscreen */}
      {cameraOpen && (
        <CameraScanner
          onScan={handleCameraScan}
          onClose={() => setCameraOpen(false)}
        />
      )}

      {/* FAB — mobile only (sm:hidden) */}
      <button
        onClick={openPanel}
        disabled={isLoading}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 btn-accent rounded-full shadow-lg flex items-center justify-center transition-colors sm:hidden"
        aria-label="ISBN scannen oder eingeben"
      >
        {isLoading ? <Spinner /> : <BarcodeIcon />}
      </button>

      {/* Bottom sheet — mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-end sm:hidden"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full theme-surface rounded-t-2xl p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-4">
              ISBN hinzufügen
            </h3>

            {/* Kamera-Button */}
            <button
              onClick={() => { setOpen(false); setCameraOpen(true); }}
              className="w-full flex items-center gap-3 bg-stone-900 hover:bg-stone-800 dark:bg-stone-700 dark:hover:bg-stone-600 text-white rounded-xl px-4 py-3.5 mb-3 transition-colors"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">Kamera scannen</span>
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
              <span className="text-xs text-stone-400">oder manuell</span>
              <div className="flex-1 h-px bg-stone-200 dark:bg-stone-700" />
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKey}
                data-scanner="true"
                placeholder="z.B. 9783596512560"
                className="flex-1 border border-stone-300 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
              <button
                onClick={submit}
                disabled={value.replace(/\D/g, '').length < 10}
                className="btn-accent rounded-lg px-5 py-3 text-sm font-medium transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop inline — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-2 relative">
        {isLoading && <Spinner />}
        {/* Kamera-Button Desktop */}
        <button
          onClick={() => setCameraOpen(true)}
          disabled={isLoading}
          title="Kamera scannen"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Smart-search input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => handleDesktopChange(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
            data-scanner="true"
            placeholder="ISBN oder Titel suchen…"
            className="w-64 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm bg-stone-50 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent focus:bg-white dark:focus:bg-stone-800 transition-colors"
          />

          {/* Search dropdown */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 mt-1 w-80 max-h-80 overflow-y-auto theme-surface border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl z-50"
            >
              {searchLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-stone-400 dark:text-stone-500 text-sm">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Suche…
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-5 text-center text-sm text-stone-400 dark:text-stone-500">Keine Ergebnisse</div>
              ) : (
                <ul>
                  {searchResults.map((book, i) => (
                    <li key={book.isbn || i}>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); handleAddDirect(book); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 dark:hover:bg-stone-800 text-left transition-colors"
                      >
                        {/* Cover thumbnail */}
                        <div className="w-9 h-12 rounded bg-stone-100 dark:bg-stone-700 shrink-0 overflow-hidden">
                          {book.coverUrl ? (
                            <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-stone-300 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 dark:text-stone-100 line-clamp-1">{book.title}</p>
                          <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{book.authors?.join(', ')}</p>
                          <p className="text-xs text-stone-400 dark:text-stone-500">{book.year}{book.source ? ` · ${book.source}` : ''}</p>
                        </div>
                        {/* Add icon */}
                        <svg className="w-4 h-4 text-stone-300 dark:text-stone-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <button
          onClick={submit}
          disabled={value.replace(/\D/g, '').length < 10 || isLoading}
          className="btn-accent rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
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
