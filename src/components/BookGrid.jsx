import { BookCard } from './BookCard';
import { BookListRow } from './BookListRow';

const GRID_COLS = {
  grid:    'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  compact: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',
};

export function BookGrid({ books, shelves = [], onSelect, viewMode = 'grid' }) {
  if (books.length === 0) return <EmptyState />;

  if (viewMode === 'list') {
    return (
      <div className="mx-4 mt-4 theme-surface rounded-xl shadow-sm dark:shadow-stone-950/50 overflow-hidden border border-stone-100 dark:border-stone-800">
        {books.map((book) => (
          <BookListRow key={book.id} book={book} shelves={shelves} onClick={onSelect} />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 theme-bg min-h-full">
      <div className={`grid ${GRID_COLS[viewMode] ?? GRID_COLS.grid} gap-3`}>
        {books.map((book) => (
          <BookCard key={book.id} book={book} onClick={onSelect} compact={viewMode === 'compact'} />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-24 px-6 text-center">
      <svg className="w-16 h-16 text-stone-300 dark:text-stone-700 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
      <h2 className="text-xl font-semibold text-stone-400 dark:text-stone-500 mb-2">Noch keine Bücher</h2>
      <p className="text-stone-400 dark:text-stone-500 text-sm max-w-xs">
        Scanne den Barcode eines Buches oder gib die ISBN manuell ein, um deine Mediathek zu starten.
      </p>
    </div>
  );
}
