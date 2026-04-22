import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { CameraScanner } from './CameraScanner';
import { searchBooks } from '../services/bookSearch';

function looksLikeISBN(v) {
  const d = v.replace(/[\s\-]/g, '');
  return /^(97[89])?\d{9}[\dX]$/i.test(d);
}

/**
 * ScanInput — Desktop-Komponente (ISBN-Eingabe + Titelsuche + Kamera)
 * Auf Mobile: Kamera wird über BottomNav gesteuert (ref.openCamera)
 */
export const ScanInput = forwardRef(function ScanInput({ onScan, isLoading, onAddDirect }, ref) {
  const [value, setValue] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const inputRef    = useRef(null);
  const dropdownRef = useRef(null);

  // Externes Triggern der Kamera (z.B. von BottomNav)
  useImperativeHandle(ref, () => ({
    openCamera: () => setCameraOpen(true),
  }));

  const submit = () => {
    const isbn = value.replace(/[^0-9X]/gi, '');
    if (isbn.length >= 10) {
      onScan(isbn);
      setValue('');
      setShowDropdown(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') { setShowDropdown(false); setValue(''); }
  };

  const handleCameraScan = (isbn) => {
    setCameraOpen(false);
    onScan(isbn);
  };

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

  useEffect(() => {
    const handler = (e) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      {cameraOpen && (
        <CameraScanner onScan={handleCameraScan} onClose={() => setCameraOpen(false)} />
      )}

      {/* Desktop: Kamera-Button + Suchfeld + Hinzufügen */}
      <div className="hidden sm:flex items-center gap-2 relative">
        {isLoading && <Spinner />}

        <button
          onClick={() => setCameraOpen(true)}
          disabled={isLoading}
          title="Barcode scannen"
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

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
            className="w-56 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/50 transition-colors"
          />

          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 mt-1 w-80 max-h-80 overflow-y-auto theme-surface border border-stone-200 dark:border-stone-700 rounded-xl shadow-xl z-50"
            >
              {searchLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-stone-400 text-sm">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Suche…
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-5 text-center text-sm text-stone-400">Keine Ergebnisse</div>
              ) : (
                <ul>
                  {searchResults.map((book, i) => (
                    <li key={book.isbn || i}>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); handleAddDirect(book); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 dark:hover:bg-stone-800 text-left transition-colors"
                      >
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
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 dark:text-stone-100 line-clamp-1">{book.title}</p>
                          <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{book.authors?.join(', ')}</p>
                          <p className="text-xs text-stone-400">{book.year}{book.source ? ` · ${book.source}` : ''}</p>
                        </div>
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
});

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
