import { useState, useEffect, useRef } from 'react';
import { getColor } from '../services/shelfColors';

export function BookDetail({ book, onClose, onDelete, onUpdateCover, shelves = [], onUpdateShelves }) {
  const sources = [book.customCover, book.cover, book.coverFallback].filter(Boolean);
  const [srcIndex, setSrcIndex] = useState(0);
  const imgFailed = srcIndex >= sources.length;
  const fileInputRef = useRef(null);

  // Reset srcIndex wenn sich das Buch ändert (z.B. nach Cover-Upload)
  useEffect(() => { setSrcIndex(0); }, [book.id, book.customCover]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpdateCover(book.id, ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  if (!book) return null;

  const hasCover = !imgFailed && sources[srcIndex];

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 transition-colors"
          aria-label="Schliessen"
        >
          <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex gap-5 p-6 pb-4">
          {/* Cover + Upload */}
          <div className="shrink-0 w-24 sm:w-32">
            <div className="relative group">
              {hasCover ? (
                <img
                  src={sources[srcIndex]}
                  alt={book.title}
                  onError={() => setSrcIndex((i) => i + 1)}
                  className="w-full rounded-lg shadow-md object-cover"
                />
              ) : (
                <div className="w-full aspect-[2/3] rounded-lg bg-stone-100 flex flex-col items-center justify-center gap-2">
                  <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}

              {/* Upload-Overlay beim Hover (oder immer sichtbar wenn kein Cover) */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`absolute inset-0 rounded-lg flex flex-col items-center justify-center gap-1 transition-opacity
                  ${hasCover
                    ? 'bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100'
                    : 'bg-amber-50 border-2 border-dashed border-amber-300 opacity-100'
                  }`}
                title="Cover hochladen"
              >
                <svg className={`w-5 h-5 ${hasCover ? 'text-white' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className={`text-xs font-medium ${hasCover ? 'text-white' : 'text-amber-600'}`}>
                  {hasCover ? 'Ändern' : 'Hochladen'}
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>

            {/* Eigenes Cover entfernen */}
            {book.customCover && (
              <button
                onClick={() => onUpdateCover(book.id, null)}
                className="mt-1.5 w-full text-xs text-stone-400 hover:text-red-500 transition-colors text-center"
              >
                Zurücksetzen
              </button>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pr-8">
            <h2 className="text-lg font-bold text-stone-900 leading-tight mb-1">
              {book.title}
            </h2>
            {book.subtitle && (
              <p className="text-sm text-stone-500 mb-2">{book.subtitle}</p>
            )}
            <p className="text-sm font-medium text-amber-700">
              {book.authors?.join(', ')}
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-stone-500">
              {book.year && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {book.year}
                </span>
              )}
              {book.pages && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {book.pages} Seiten
                </span>
              )}
              {book.publisher && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {book.publisher}
                </span>
              )}
            </div>

            <p className="text-xs text-stone-400 mt-1 font-mono">
              ISBN {book.isbn}
            </p>
          </div>
        </div>

        {/* Description */}
        {book.description && (
          <div className="px-6 pb-4">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Klappentext
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed line-clamp-3">
              {book.description.replace(/<[^>]+>/g, '')}
            </p>
          </div>
        )}

        {/* Regale */}
        {shelves.length > 0 && (
          <div className="px-6 pb-4">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Regale
            </h3>
            <div className="flex flex-wrap gap-2">
              {shelves.map((shelf) => {
                const checked = book.shelfIds?.includes(shelf.id) ?? false;
                const c = getColor(shelf.color);
                const toggle = () => {
                  const current = book.shelfIds ?? [];
                  const next = checked
                    ? current.filter((id) => id !== shelf.id)
                    : [...current, shelf.id];
                  onUpdateShelves(book.id, next);
                };
                return (
                  <button
                    key={shelf.id}
                    onClick={toggle}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      checked ? c.active : `${c.chip} opacity-50 hover:opacity-100`
                    }`}
                  >
                    {checked && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {shelf.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between">
          <p className="text-xs text-stone-400">
            Hinzugefügt {new Date(book.addedAt).toLocaleDateString('de-DE')}
          </p>
          <button
            onClick={() => { onDelete(book.id); onClose(); }}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Aus Mediathek entfernen
          </button>
        </div>
      </div>
    </div>
  );
}
