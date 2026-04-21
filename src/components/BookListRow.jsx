import { useState } from 'react';
import { getColor } from '../services/shelfColors';

export function BookListRow({ book, shelves = [], onClick }) {
  const sources = [book.customCover, book.cover, book.coverFallback].filter(Boolean);
  const [srcIndex, setSrcIndex] = useState(0);
  const failed = srcIndex >= sources.length;
  const bookShelves = shelves.filter((s) => book.shelfIds?.includes(s.id));

  return (
    <button
      onClick={() => onClick(book)}
      className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-stone-50 border-b border-stone-100 last:border-0 text-left w-full transition-colors"
    >
      {/* Cover */}
      <div className="shrink-0 w-10 h-14 rounded overflow-hidden bg-stone-100">
        {!failed && sources[srcIndex] ? (
          <img
            src={sources[srcIndex]}
            alt={book.title}
            onError={() => setSrcIndex((i) => i + 1)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-5 h-5 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-900 truncate">{book.title}</p>
        <p className="text-xs text-stone-500 truncate">{book.authors?.join(', ')}</p>
        {book.year && <p className="text-xs text-stone-400">{book.year}</p>}
      </div>

      {/* Shelf tags */}
      {bookShelves.length > 0 && (
        <div className="shrink-0 flex flex-wrap gap-1 justify-end max-w-[120px]">
          {bookShelves.slice(0, 2).map((s) => {
            const c = getColor(s.color);
            return (
              <span key={s.id} className={`text-xs px-2 py-0.5 rounded-full border ${c.chip}`}>
                {s.name}
              </span>
            );
          })}
          {bookShelves.length > 2 && (
            <span className="text-xs text-stone-400">+{bookShelves.length - 2}</span>
          )}
        </div>
      )}

      <svg className="w-4 h-4 text-stone-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
