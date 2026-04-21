import { useState, useCallback, useRef } from 'react';
import { useBooks } from './hooks/useBooks';
import { useShelves } from './hooks/useShelves';
import { useScanner } from './hooks/useScanner';
import { fetchBookByISBN } from './services/bookApi';
import { detectGenre } from './services/genreMap';
import { BookGrid } from './components/BookGrid';
import { BookDetail } from './components/BookDetail';
import { ToastContainer } from './components/Toast';
import { ScanInput } from './components/ScanInput';
import { FilterBar } from './components/FilterBar';

let toastId = 0;

export default function App() {
  const { books, addBook, removeBook, updateBook, findByISBN } = useBooks();
  const { shelves, addShelf, updateShelf, removeShelf, findOrCreate } = useShelves();

  const [selected, setSelected] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeShelfId, setActiveShelfId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const scanningRef = useRef(false);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const handleScan = useCallback(async (isbn) => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setIsLoading(true);

    try {
      const existing = findByISBN(isbn);
      if (existing) {
        showToast(`"${existing.title}" ist bereits in deiner Mediathek.`, 'warning');
        return;
      }

      const data = await fetchBookByISBN(isbn);
      if (!data) {
        showToast(`Kein Buch zur ISBN ${isbn} gefunden.`, 'error');
        return;
      }

      // Auto-Kategorisierung
      let shelfIds = [];
      const genre = detectGenre(data.googleCategories ?? []);
      if (genre) {
        const shelf = findOrCreate(genre.label, genre.color);
        shelfIds = [shelf.id];
      }

      addBook({ ...data, shelfIds });
      showToast(`"${data.title}" hinzugefügt.`, 'success');
    } finally {
      setIsLoading(false);
      scanningRef.current = false;
    }
  }, [findByISBN, addBook, showToast, findOrCreate]);

  useScanner(handleScan);

  const filteredBooks = activeShelfId
    ? books.filter((b) => b.shelfIds?.includes(activeShelfId))
    : books;

  // Immer aktuelles Book-Objekt aus State (z.B. nach Cover-Upload oder Regal-Änderung)
  const selectedBook = selected ? books.find((b) => b.id === selected.id) ?? selected : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div>
              <h1 className="text-base font-bold text-stone-900 leading-none">Mediathek</h1>
              <p className="text-xs text-stone-400 leading-none mt-0.5">
                {books.length} {books.length === 1 ? 'Buch' : 'Bücher'}
              </p>
            </div>
          </div>
          <ScanInput onScan={handleScan} isLoading={isLoading} />
        </div>
      </header>

      {/* Filter + View Toggle */}
      <FilterBar
        shelves={shelves}
        books={books}
        activeShelfId={activeShelfId}
        onShelfChange={setActiveShelfId}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddShelf={addShelf}
        onUpdateShelf={updateShelf}
        onRemoveShelf={removeShelf}
      />

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full flex flex-col">
        <BookGrid
          books={filteredBooks}
          shelves={shelves}
          onSelect={setSelected}
          viewMode={viewMode}
        />
      </main>

      {/* Detail modal */}
      {selectedBook && (
        <BookDetail
          book={selectedBook}
          shelves={shelves}
          onClose={() => setSelected(null)}
          onDelete={(id) => {
            removeBook(id);
            setSelected(null);
            showToast('Buch entfernt.', 'info');
          }}
          onUpdateCover={(id, dataUrl) => {
            updateBook(id, { customCover: dataUrl });
            showToast(dataUrl ? 'Cover aktualisiert.' : 'Cover zurückgesetzt.', 'success');
          }}
          onUpdateShelves={(id, shelfIds) => updateBook(id, { shelfIds })}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
