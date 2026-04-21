import { BookCard } from './BookCard';

export function BookGrid({ books, onSelect }) {
  if (books.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} onClick={onSelect} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-24 px-6 text-center">
      <svg
        className="w-16 h-16 text-stone-300 mb-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
        />
      </svg>
      <h2 className="text-xl font-semibold text-stone-400 mb-2">
        Noch keine Bücher
      </h2>
      <p className="text-stone-400 text-sm max-w-xs">
        Scanne den Barcode eines Buches oder gib die ISBN manuell ein, um deine
        Mediathek zu starten.
      </p>
    </div>
  );
}
