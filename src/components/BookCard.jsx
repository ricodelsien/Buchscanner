import { useState, useRef, useCallback } from 'react';
import { resolveHex } from '../services/shelfColors';

const STATUS_COLORS = { want: '#3b82f6', reading: '#f59e0b', read: '#22c55e', dropped: '#78716c' };
const STATUS_LABELS = { want: 'Möchte lesen', reading: 'Lese gerade', read: 'Gelesen', dropped: 'Abgebrochen' };

export function BookCard({ book, shelves = [], onClick, compact = false, selectMode = false, selected = false, onSelect, onLongPress, onToggleFavorite, dragHandleProps = {}, isDragging = false }) {
  const sources = [book.customCover, book.cover, book.coverFallback].filter(Boolean);
  const [srcIndex, setSrcIndex] = useState(0);
  const failed = srcIndex >= sources.length;

  // Long-press detection
  const pressTimer = useRef(null);
  const pressFired = useRef(false);
  const pressStartPos = useRef(null);

  // Double-tap detection (mobile favorite)
  const lastTap = useRef(0);

  const cancelPress = () => {
    clearTimeout(pressTimer.current);
  };

  const onPointerDown = useCallback((e) => {
    pressFired.current = false;
    pressStartPos.current = { x: e.clientX, y: e.clientY };
    pressTimer.current = setTimeout(() => {
      pressFired.current = true;
      onLongPress?.(book.id);
    }, 500);
  }, [book.id, onLongPress]);

  const onPointerMove = useCallback((e) => {
    if (!pressStartPos.current) return;
    const dx = Math.abs(e.clientX - pressStartPos.current.x);
    const dy = Math.abs(e.clientY - pressStartPos.current.y);
    if (dx > 8 || dy > 8) cancelPress();
  }, []);

  const onPointerUp = useCallback(() => {
    cancelPress();
  }, []);

  const handleClick = useCallback((e) => {
    if (pressFired.current) { pressFired.current = false; return; }

    // Double-tap → toggle favorite (mobile)
    const now = Date.now();
    if (now - lastTap.current < 300 && onToggleFavorite) {
      lastTap.current = 0;
      onToggleFavorite(book.id);
      return;
    }
    lastTap.current = now;

    // Select mode → toggle
    if (selectMode) {
      onSelect?.(book.id);
      return;
    }
    onClick(book);
  }, [book, onClick, selectMode, onSelect, onToggleFavorite]);

  // Shelf accent stripe color
  const primaryShelf = shelves.find((s) => book.shelfIds?.includes(s.id));
  const stripeColor = primaryShelf ? resolveHex(primaryShelf.color) : null;

  return (
    <button
      data-book-id={book.id}
      onClick={handleClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={cancelPress}
      {...dragHandleProps}
      className={`group flex flex-col theme-surface rounded-lg border transition-all duration-200 overflow-hidden text-left select-none
        ${isDragging ? 'opacity-40 scale-95' : ''}
        ${selected
          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)] ring-opacity-60 shadow-lg'
          : 'border-stone-100 dark:border-stone-700/60 shadow-[0_2px_8px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_28px_rgba(0,0,0,0.65)] hover:-translate-y-0.5'
        }`}
    >
      {/* Cover area */}
      <div className="relative aspect-[2/3] bg-stone-100 dark:bg-stone-700 overflow-hidden rounded-t-lg">
        {!failed && sources[srcIndex] ? (
          <img
            src={sources[srcIndex]}
            alt={book.title}
            onError={() => setSrcIndex((i) => i + 1)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <PlaceholderCover title={book.title} />
        )}

        {/* Status dot — top left */}
        {book.status && (
          <div
            className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-white/50"
            style={{ backgroundColor: STATUS_COLORS[book.status] }}
            title={STATUS_LABELS[book.status]}
          />
        )}

        {/* Favorite — always visible when set; hover button on desktop */}
        {book.favorite && (
          <div className="sm:hidden absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/90 dark:bg-stone-900/80 flex items-center justify-center shadow-sm">
            <svg className="w-3 h-3 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        )}
        {/* Hover-Favorit-Button — nur Desktop */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(book.id); }}
          className={`hidden sm:flex absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 dark:bg-stone-900/80 items-center justify-center shadow-sm transition-opacity
            ${book.favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          title={book.favorite ? 'Favorit entfernen' : 'Favorisieren'}
        >
          <svg className={`w-3.5 h-3.5 transition-colors ${book.favorite ? 'text-rose-500' : 'text-stone-400 group-hover:text-rose-400'}`}
            fill={book.favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Reading progress bar at bottom of cover */}
        {book.status === 'reading' && book.pages && book.currentPage > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
            <div className="h-full bg-amber-400" style={{ width: `${Math.min(100, (book.currentPage / book.pages) * 100)}%` }} />
          </div>
        )}

        {/* Selection overlay */}
        {selectMode && (
          <div className={`absolute inset-0 flex items-center justify-center transition-colors
            ${selected ? 'bg-[var(--accent)]/20' : 'bg-transparent'}`}>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
              ${selected ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-white/70 dark:bg-stone-900/70 border-stone-300 dark:border-stone-500'}`}>
              {selected && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="var(--accent-fg)" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Shelf accent stripe */}
      <div
        className="h-1 w-full transition-colors duration-200"
        style={stripeColor
          ? { backgroundColor: stripeColor }
          : { background: 'linear-gradient(to bottom, rgb(231 229 228), rgb(214 211 208))' }}
      />

      {/* Metadata — fixed height for uniform card sizes */}
      <div
        className={`${compact ? 'p-2' : 'p-3'} flex flex-col overflow-hidden`}
        style={{ height: compact ? '3rem' : '5.5rem' }}
      >
        <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-stone-900 dark:text-stone-100 line-clamp-2 leading-tight`}>
          {book.title}
        </p>
        {!compact && (
          <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
            {book.authors?.join(', ')}
          </p>
        )}
        {!compact && (
          <div className="mt-auto">
            {book.rating > 0 ? (
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <svg key={s} className={`w-3 h-3 ${s <= book.rating ? 'text-amber-400' : 'text-stone-200 dark:text-stone-600'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
            ) : book.year ? (
              <p className="text-xs text-stone-400 dark:text-stone-500">{book.year}</p>
            ) : null}
          </div>
        )}
      </div>
    </button>
  );
}

function PlaceholderCover({ title }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-700 dark:to-stone-800 p-4">
      <svg className="w-10 h-10 text-stone-300 dark:text-stone-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <p className="text-xs text-stone-400 dark:text-stone-500 text-center line-clamp-3 leading-tight">{title}</p>
    </div>
  );
}
