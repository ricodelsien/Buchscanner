import { useState, useRef, useCallback } from 'react';

const STATUS_COLORS = {
  want:    '#3b82f6',
  reading: '#f59e0b',
  read:    '#22c55e',
  dropped: '#78716c',
};
const STATUS_LABELS = {
  want:    'Möchte lesen',
  reading: 'Aktuell am Lesen',
  read:    'Gelesen',
  dropped: 'Abgebrochen',
};

export function BookCard({
  book,
  onClick,
  compact = false,
  selectMode = false,
  selected = false,
  onSelect,
  onLongPress,
  onToggleFavorite,
  dragHandleProps = {},
  isDragging = false,
}) {
  const sources = [book.customCover, book.cover, book.coverFallback].filter(Boolean);
  const [srcIndex, setSrcIndex] = useState(0);
  const [heartFlash, setHeartFlash] = useState(false);
  const failed = srcIndex >= sources.length;

  const pressTimer    = useRef(null);
  const pressFired    = useRef(false);
  const pressStartPos = useRef(null);
  const lastTap       = useRef(0);

  const cancelPress = useCallback(() => clearTimeout(pressTimer.current), []);

  const onPointerDown = useCallback((e) => {
    pressFired.current = false;
    pressStartPos.current = { x: e.clientX, y: e.clientY };
    pressTimer.current = setTimeout(() => {
      pressFired.current = true;
      onLongPress?.(book.id);
    }, 450);
  }, [book.id, onLongPress]);

  const onPointerMove = useCallback((e) => {
    if (!pressStartPos.current) return;
    if (
      Math.abs(e.clientX - pressStartPos.current.x) > 8 ||
      Math.abs(e.clientY - pressStartPos.current.y) > 8
    ) cancelPress();
  }, [cancelPress]);

  const handleClick = useCallback(() => {
    if (pressFired.current) { pressFired.current = false; return; }
    const now = Date.now();
    // Doppeltippen → Favorit + Herz-Animation
    if (now - lastTap.current < 280 && onToggleFavorite) {
      lastTap.current = 0;
      setHeartFlash(true);
      onToggleFavorite(book.id);
      setTimeout(() => setHeartFlash(false), 700);
      return;
    }
    lastTap.current = now;
    if (selectMode) { onSelect?.(book.id); return; }
    onClick?.(book);
  }, [book, onClick, selectMode, onSelect, onToggleFavorite]);

  const infoH = compact ? '2.5rem' : '4.25rem';

  return (
    <button
      data-book-id={book.id}
      onClick={handleClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      {...dragHandleProps}
      className={`group flex flex-col w-full rounded-xl overflow-hidden text-left select-none transition-all duration-200 bg-transparent
        ${isDragging ? 'opacity-30 scale-95' : ''}
        ${selected && selectMode ? 'ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--theme-bg)] rounded-xl' : ''}
      `}
    >
      {/* Cover — 2:3 via padding-top trick */}
      <div
        className="relative w-full theme-surface shadow-sm dark:shadow-stone-950/50 rounded-xl overflow-hidden"
        style={{ paddingTop: '150%' }}
      >
        <div className="absolute inset-0">

          {!failed && sources[srcIndex] ? (
            <img
              src={sources[srcIndex]}
              alt={book.title}
              onError={() => setSrcIndex((i) => i + 1)}
              className={`w-full h-full object-cover transition-transform duration-300
                ${!selectMode ? 'group-hover:scale-[1.04]' : ''}`}
            />
          ) : (
            <PlaceholderCover title={book.title} compact={compact} />
          )}

          {/* Selektions-Tönung */}
          {selectMode && selected && (
            <div className="absolute inset-0 bg-[var(--accent)]/20 pointer-events-none" />
          )}

          {/* Lesefortschritt */}
          {book.status === 'reading' && book.pages && (book.currentPage ?? 0) > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/25">
              <div
                className="h-full bg-amber-400"
                style={{ width: `${Math.min(100, ((book.currentPage ?? 0) / book.pages) * 100)}%` }}
              />
            </div>
          )}

          {/* Herz-Animation (Doppeltippen) */}
          {heartFlash && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg className="heart-burst w-20 h-20 text-rose-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          )}

          {/* Favorit-Badge (immer sichtbar wenn gesetzt, oben links) */}
          {book.favorite && !selectMode && (
            <div className="absolute top-1.5 left-1.5">
              <div className="w-5 h-5 rounded-full bg-white/80 dark:bg-stone-900/70 backdrop-blur-sm flex items-center justify-center shadow-sm">
                <svg className="w-2.5 h-2.5 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          )}

          {/* Oben rechts: Auswahl-Kreis ODER Favorit-Button (Desktop) */}
          {selectMode ? (
            <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
              ${selected
                ? 'bg-[var(--accent)] border-[var(--accent)] shadow-sm'
                : 'bg-black/20 border-white/80 backdrop-blur-sm'
              }`}>
              {selected && (
                <svg className="w-3 h-3" fill="none" stroke="var(--accent-fg)" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(book.id); }}
              className={`hidden sm:flex absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/85 dark:bg-stone-900/75 backdrop-blur-sm items-center justify-center shadow-sm transition-all
                ${book.favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              title={book.favorite ? 'Aus Favoriten entfernen' : 'Als Favorit markieren'}
            >
              <svg
                className={`w-3 h-3 transition-colors ${book.favorite ? 'text-rose-500' : 'text-stone-400 group-hover:text-rose-400'}`}
                fill={book.favorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}

          {/* Status-Punkt (unten rechts) */}
          {book.status && (
            <div
              className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full ring-1 ring-white/60 shadow-sm"
              style={{ backgroundColor: STATUS_COLORS[book.status] }}
              title={STATUS_LABELS[book.status]}
            />
          )}
        </div>
      </div>

      {/* Titelbereich — feste Höhe */}
      <div
        className={`${compact ? 'px-0.5 pt-1' : 'px-0.5 pt-1.5'} flex flex-col overflow-hidden`}
        style={{ height: infoH }}
      >
        <p className={`${compact ? 'text-[0.58rem]' : 'text-[0.7rem]'} font-semibold text-stone-800 dark:text-stone-100 leading-tight line-clamp-2`}>
          {book.title}
        </p>
        {!compact && book.authors?.length > 0 && (
          <p className="text-[0.62rem] text-stone-400 dark:text-stone-500 truncate mt-0.5 leading-tight">
            {book.authors[0]}
          </p>
        )}
      </div>
    </button>
  );
}

function PlaceholderCover({ title, compact }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-700 dark:to-stone-800 p-3">
      <svg
        className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} text-stone-300 dark:text-stone-500 mb-1.5 shrink-0`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      {!compact && (
        <p className="text-[0.58rem] text-stone-400 dark:text-stone-500 text-center line-clamp-3 leading-tight">
          {title}
        </p>
      )}
    </div>
  );
}
