import { useState } from 'react';

export function BookCard({ book, onClick, compact = false }) {
  const sources = [book.customCover, book.cover, book.coverFallback].filter(Boolean);
  const [srcIndex, setSrcIndex] = useState(0);
  const failed = srcIndex >= sources.length;

  return (
    <button
      onClick={() => onClick(book)}
      className="group flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden text-left"
    >
      <div className="relative aspect-[2/3] bg-stone-100 overflow-hidden">
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
      </div>
      <div className={`${compact ? 'p-2' : 'p-3'} flex flex-col gap-0.5 flex-1`}>
        <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-stone-900 line-clamp-2 leading-tight`}>
          {book.title}
        </p>
        {!compact && (
          <p className="text-xs text-stone-500 truncate">{book.authors?.join(', ')}</p>
        )}
        {!compact && book.year && (
          <p className="text-xs text-stone-400 mt-auto pt-1">{book.year}</p>
        )}
      </div>
    </button>
  );
}

function PlaceholderCover({ title }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 p-4">
      <svg
        className="w-10 h-10 text-stone-400 mb-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
      <p className="text-xs text-stone-500 text-center line-clamp-3 leading-tight">
        {title}
      </p>
    </div>
  );
}
