import { useState, useEffect, useRef } from 'react';
import { chipStyle, resolveHex } from '../services/shelfColors';

export function BookDetail({ book, onClose, onDelete, onUpdateCover, onUpdate, shelves = [], onUpdateShelves }) {
  const sources = [book.customCover, book.cover, book.coverFallback].filter(Boolean);
  const [srcIndex, setSrcIndex] = useState(0);
  const imgFailed = srcIndex >= sources.length;
  const fileInputRef = useRef(null);
  const [notes, setNotes] = useState(book.notes ?? '');
  const [editingNotes, setEditingNotes] = useState(false);

  useEffect(() => { setSrcIndex(0); }, [book.id, book.customCover]);
  useEffect(() => { setNotes(book.notes ?? ''); }, [book.id, book.notes]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected after an error
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 600px on the longest side to keep localStorage size small
        const MAX = 600;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          onUpdateCover(book.id, canvas.toDataURL('image/jpeg', 0.75));
        } catch (err) {
          alert('Cover konnte nicht gespeichert werden — Speicher voll.');
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const setRating = (r) => onUpdate(book.id, { rating: r === book.rating ? 0 : r });
  const toggleFavorite = () => onUpdate(book.id, { favorite: !book.favorite });
  const saveNotes = () => { onUpdate(book.id, { notes }); setEditingNotes(false); };

  const share = async () => {
    const text = `${book.title}${book.authors?.length ? ' von ' + book.authors.join(', ') : ''}`;
    if (navigator.share) {
      try { await navigator.share({ title: book.title, text, url: window.location.href }); } catch (_) {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('In die Zwischenablage kopiert!');
    }
  };

  if (!book) return null;
  const hasCover = !imgFailed && sources[srcIndex];

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 bg-white dark:bg-stone-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Action bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0">
          <button onClick={toggleFavorite} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${book.favorite ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 border-rose-200' : 'text-stone-400 dark:text-stone-500 border-stone-200 dark:border-stone-700 hover:border-stone-400'}`}>
            <svg className="w-3.5 h-3.5" fill={book.favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {book.favorite ? 'Favorit' : 'Favorit'}
          </button>

          <div className="flex items-center gap-1">
            <button onClick={share} className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors" title="Empfehlen">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
              <svg className="w-4 h-4 text-stone-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex gap-5 p-5 pb-3">
          {/* Cover */}
          <div className="shrink-0 w-24 sm:w-32">
            <div className="relative group">
              {hasCover ? (
                <img src={sources[srcIndex]} alt={book.title} onError={() => setSrcIndex((i) => i + 1)} className="w-full rounded-lg shadow-md object-cover" />
              ) : (
                <div className="w-full aspect-[2/3] rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
              <button onClick={() => fileInputRef.current?.click()} className={`absolute inset-0 rounded-lg flex flex-col items-center justify-center gap-1 transition-opacity ${hasCover ? 'opacity-0 group-hover:opacity-100 bg-black/40' : 'opacity-100 border-2 border-dashed border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20'}`} title="Cover hochladen">
                <svg className={`w-5 h-5 ${hasCover ? 'text-white' : 'text-amber-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className={`text-xs font-medium ${hasCover ? 'text-white' : 'text-amber-600'}`}>{hasCover ? 'Ändern' : 'Hochladen'}</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </div>
            {book.customCover && (
              <button onClick={() => onUpdateCover(book.id, null)} className="mt-1 w-full text-xs text-stone-400 hover:text-red-500 transition-colors text-center">
                Zurücksetzen
              </button>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 leading-tight mb-0.5">{book.title}</h2>
            {book.subtitle && <p className="text-sm text-stone-500 dark:text-stone-400 mb-1">{book.subtitle}</p>}
            <p className="text-sm font-medium text-amber-700 dark:text-amber-500">{book.authors?.join(', ')}</p>

            {/* Rating */}
            <div className="flex gap-0.5 mt-2 mb-2">
              {[1,2,3,4,5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="transition-transform hover:scale-110">
                  <svg className={`w-5 h-5 ${star <= (book.rating ?? 0) ? 'text-amber-400' : 'text-stone-200 dark:text-stone-700'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
              {book.year && <span>{book.year}</span>}
              {book.pages && <span>{book.pages} S.</span>}
              {book.publisher && <span className="truncate max-w-[120px]">{book.publisher}</span>}
            </div>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 font-mono">ISBN {book.isbn}</p>
          </div>
        </div>

        {/* Klappentext */}
        {book.description && (
          <div className="px-5 pb-3">
            <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1.5">Klappentext</p>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-3">
              {book.description.replace(/<[^>]+>/g, '')}
            </p>
          </div>
        )}

        {/* Regale */}
        {shelves.length > 0 && (
          <div className="px-5 pb-3">
            <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1.5">Regale</p>
            <div className="flex flex-wrap gap-1.5">
              {shelves.map((shelf) => {
                const checked = book.shelfIds?.includes(shelf.id) ?? false;
                const hex = resolveHex(shelf.color);
                const style = chipStyle(hex, checked);
                return (
                  <button
                    key={shelf.id}
                    onClick={() => {
                      const cur = book.shelfIds ?? [];
                      onUpdateShelves(book.id, checked ? cur.filter((id) => id !== shelf.id) : [...cur, shelf.id]);
                    }}
                    style={style}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-all ${!checked && 'opacity-50 hover:opacity-100'}`}
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

        {/* Notizen */}
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Meine Notizen</p>
            {!editingNotes && (
              <button onClick={() => setEditingNotes(true)} className="text-xs text-amber-600 dark:text-amber-500 hover:underline">
                {book.notes ? 'Bearbeiten' : 'Hinzufügen'}
              </button>
            )}
          </div>
          {editingNotes ? (
            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                autoFocus
                placeholder="Gedanken, Zitate, Erinnerungen…"
                className="w-full text-sm border border-stone-300 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={saveNotes} className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-amber-600">Speichern</button>
                <button onClick={() => { setNotes(book.notes ?? ''); setEditingNotes(false); }} className="text-xs text-stone-400 px-3 py-1.5 hover:text-stone-600">Abbrechen</button>
              </div>
            </div>
          ) : book.notes ? (
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">{book.notes}</p>
          ) : (
            <p className="text-sm text-stone-300 dark:text-stone-600 italic">Noch keine Notizen</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <p className="text-xs text-stone-400 dark:text-stone-500">Hinzugefügt {new Date(book.addedAt).toLocaleDateString('de-DE')}</p>
          <button onClick={() => { onDelete(book.id); onClose(); }} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Entfernen
          </button>
        </div>
      </div>
    </div>
  );
}
