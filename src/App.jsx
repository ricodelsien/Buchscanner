import { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import { useBooks } from './hooks/useBooks';
import { useShelves } from './hooks/useShelves';
import { useScanner } from './hooks/useScanner';
import { useProfile } from './hooks/useProfile';
import { useDarkMode } from './hooks/useDarkMode';
import { useTheme } from './hooks/useTheme';
import { fetchBookByISBN } from './services/bookApi';
import { detectGenre } from './services/genreMap';
import { searchBooks } from './services/bookSearch';
import { BookGrid } from './components/BookGrid';
import { BookDetail } from './components/BookDetail';
import { ToastContainer } from './components/Toast';
import { ScanInput } from './components/ScanInput';
import { FilterBar } from './components/FilterBar';
import { ProfileSetup } from './components/ProfileSetup';
import { StorageNotice } from './components/StorageNotice';
import { SettingsModal } from './components/SettingsModal';
import { BookCreateModal } from './components/BookCreateModal';
import { BookCard } from './components/BookCard';

let toastId = 0;

export default function App() {
  const { books, addBook, removeBook, updateBook, findByISBN, reorderBooks } = useBooks();
  const { shelves, addShelf, updateShelf, removeShelf, findOrCreate } = useShelves();
  const { profile, saveProfile, hasProfile } = useProfile();
  const { dark, toggle: toggleDark } = useDarkMode();
  const { theme, setTheme } = useTheme();

  const [selected, setSelected] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeShelfId, setActiveShelfId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(!hasProfile);
  const [editProfile, setEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createISBN, setCreateISBN] = useState('');
  const [editBook, setEditBook] = useState(null);
  const [activeDragId, setActiveDragId] = useState(null);
  const scanningRef = useRef(false);

  // DnD sensors — mouse only, 10px distance threshold
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } })
  );

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
      if (existing) { showToast(`"${existing.title}" ist bereits in deiner Mediathek.`, 'warning'); return; }
      const data = await fetchBookByISBN(isbn);
      if (!data) {
        showToast(`ISBN ${isbn} nicht gefunden — bitte manuell anlegen.`, 'warning');
        setCreateISBN(isbn);
        setShowCreateModal(true);
        return;
      }
      let shelfIds = [];
      const genre = detectGenre(data.googleCategories ?? []);
      if (genre) { const shelf = findOrCreate(genre.label, genre.color); shelfIds = [shelf.id]; }
      addBook({ ...data, shelfIds });
      showToast(`"${data.title}" hinzugefügt.`, 'success');
    } finally {
      setIsLoading(false);
      scanningRef.current = false;
    }
  }, [findByISBN, addBook, showToast, findOrCreate]);

  useScanner(handleScan);

  /** Add a book from search results (ScanInput smart search or BookCreateModal) */
  const handleDirectAdd = useCallback((data) => {
    const existing = data.isbn ? findByISBN(data.isbn) : null;
    if (existing) { showToast(`"${existing.title}" ist bereits in deiner Mediathek.`, 'warning'); return; }
    let shelfIds = [];
    const genre = detectGenre(data.googleCategories ?? []);
    if (genre) { const shelf = findOrCreate(genre.label, genre.color); shelfIds = [shelf.id]; }
    addBook({
      title: data.title,
      subtitle: data.subtitle ?? '',
      authors: data.authors ?? [],
      isbn: data.isbn ?? '',
      year: data.year ?? '',
      pages: data.pages ?? null,
      publisher: data.publisher ?? '',
      description: data.description ?? '',
      cover: data.coverUrl ?? data.cover ?? '',
      googleCategories: data.googleCategories ?? [],
      shelfIds,
    });
    showToast(`"${data.title}" hinzugefügt.`, 'success');
  }, [findByISBN, addBook, showToast, findOrCreate]);

  const handleManualCreate = useCallback((data) => {
    addBook({ ...data, id: undefined });
    showToast(`"${data.title}" hinzugefügt.`, 'success');
    setShowCreateModal(false);
    setCreateISBN('');
  }, [addBook, showToast]);

  const handleBatchDelete = useCallback((ids) => {
    ids.forEach((id) => removeBook(id));
    showToast(`${ids.length} ${ids.length === 1 ? 'Buch' : 'Bücher'} entfernt.`, 'info');
  }, [removeBook, showToast]);

  const handleBatchAddToShelf = useCallback((ids, shelfId) => {
    ids.forEach((id) => {
      const book = books.find((b) => b.id === id);
      if (!book) return;
      const cur = book.shelfIds ?? [];
      if (!cur.includes(shelfId)) updateBook(id, { shelfIds: [...cur, shelfId] });
    });
    const shelf = shelves.find((s) => s.id === shelfId);
    showToast(`${ids.length} Bücher zu "${shelf?.name ?? 'Regal'}" hinzugefügt.`, 'success');
  }, [books, shelves, updateBook, showToast]);

  const handleEditSave = useCallback((data) => {
    if (!editBook) return;
    updateBook(editBook.id, data);
    showToast('Buch aktualisiert.', 'success');
    setEditBook(null);
  }, [editBook, updateBook, showToast]);

  const handleImport = useCallback((importedBooks) => {
    let added = 0;
    importedBooks.forEach((b) => {
      if (!b.isbn || findByISBN(b.isbn)) return;
      addBook({ ...b, id: undefined });
      added++;
    });
    showToast(`${added} Bücher importiert.`, 'success');
  }, [addBook, findByISBN, showToast]);

  // DnD handlers
  const handleDragStart = useCallback(({ active }) => {
    setActiveDragId(active.id);
  }, []);

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveDragId(null);
    if (!over) return;
    const overId = String(over.id);
    if (overId.startsWith('shelf-')) {
      // Drop onto shelf chip → assign book to that shelf
      const shelfId = overId.replace('shelf-', '');
      const book = books.find((b) => b.id === active.id);
      if (!book) return;
      const cur = book.shelfIds ?? [];
      if (cur.includes(shelfId)) {
        showToast('Buch ist bereits in diesem Regal.', 'info');
        return;
      }
      updateBook(active.id, { shelfIds: [...cur, shelfId] });
      const shelf = shelves.find((s) => s.id === shelfId);
      showToast(`Buch zu "${shelf?.name ?? 'Regal'}" hinzugefügt.`, 'success');
    } else if (active.id !== over.id) {
      // Drop onto another book → reorder
      reorderBooks(active.id, over.id);
    }
  }, [books, shelves, updateBook, reorderBooks, showToast]);

  // Filtering
  const filteredBooks = books
    .filter((b) => !activeShelfId || b.shelfIds?.includes(activeShelfId))
    .filter((b) => !favoritesOnly || b.favorite)
    .filter((b) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return b.title?.toLowerCase().includes(q) || b.authors?.some((a) => a.toLowerCase().includes(q));
    });

  const selectedBook = selected ? books.find((b) => b.id === selected.id) ?? selected : null;
  const activeDragBook = activeDragId ? books.find((b) => b.id === activeDragId) : null;

  function getTimeGreeting() {
    const h = new Date().getHours();
    if (h >= 3 && h < 12) return 'Guten Morgen';
    if (h >= 12 && h < 18) return 'Guten Tag';
    return 'Guten Abend';
  }

  const greeting = profile?.name
    ? `${getTimeGreeting()}, ${profile.name}`
    : 'Mediathek';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col theme-bg overflow-hidden">

        {/* Profile setup (first launch) */}
        {(showProfileSetup || editProfile) && (
          <ProfileSetup
            existing={editProfile ? profile : null}
            onSave={(p) => { saveProfile(p); setShowProfileSetup(false); setEditProfile(false); showToast(`Willkommen, ${p.name}!`, 'success'); }}
          />
        )}

        {/* Manual book creation */}
        {showCreateModal && (
          <BookCreateModal
            prefillIsbn={createISBN}
            onSave={handleManualCreate}
            onClose={() => { setShowCreateModal(false); setCreateISBN(''); }}
          />
        )}

        {/* Edit existing book */}
        {editBook && (
          <BookCreateModal
            existing={editBook}
            onSave={handleEditSave}
            onClose={() => setEditBook(null)}
          />
        )}

        {/* Settings */}
        {showSettings && (
          <SettingsModal
            books={books}
            onImport={handleImport}
            onClose={() => setShowSettings(false)}
            onEditProfile={() => setEditProfile(true)}
            dark={dark}
            onToggleDark={toggleDark}
            theme={theme}
            onSetTheme={setTheme}
          />
        )}

        {/* Header */}
        <header className="sticky top-0 z-20 theme-surface-2 border-b border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <div>
                <h1 className="text-base font-bold text-stone-900 dark:text-stone-100 leading-none">{greeting}</h1>
                <p className="text-xs text-stone-400 dark:text-stone-500 leading-none mt-0.5">
                  {books.length} {books.length === 1 ? 'Buch' : 'Bücher'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ScanInput onScan={handleScan} isLoading={isLoading} onAddDirect={handleDirectAdd} />
              {/* Manual book entry */}
              <button
                onClick={() => { setCreateISBN(''); setShowCreateModal(true); }}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Buch manuell anlegen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button onClick={() => setShowSettings(true)} className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors" title="Einstellungen">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Filter + View */}
        <FilterBar
          shelves={shelves} books={books}
          activeShelfId={activeShelfId} onShelfChange={setActiveShelfId}
          viewMode={viewMode} onViewModeChange={setViewMode}
          onAddShelf={addShelf} onUpdateShelf={updateShelf} onRemoveShelf={removeShelf}
          search={search} onSearch={setSearch}
          favoritesOnly={favoritesOnly} onToggleFavorites={() => setFavoritesOnly((f) => !f)}
          isDragging={activeDragId !== null}
        />

        {/* Mobile localStorage notice */}
        <StorageNotice />

        {/* Books — scrolls independently */}
        <main className="flex-1 overflow-y-auto overscroll-contain max-w-7xl mx-auto w-full flex flex-col">
          <BookGrid
            books={filteredBooks}
            shelves={shelves}
            onSelect={setSelected}
            viewMode={viewMode}
            onBatchDelete={handleBatchDelete}
            onBatchAddToShelf={handleBatchAddToShelf}
            onToggleFavorite={(id) => updateBook(id, { favorite: !books.find((b) => b.id === id)?.favorite })}
            activeDragId={activeDragId}
          />
        </main>

        {/* Detail */}
        {selectedBook && (
          <BookDetail
            book={selectedBook}
            shelves={shelves}
            onClose={() => setSelected(null)}
            onDelete={(id) => { removeBook(id); setSelected(null); showToast('Buch entfernt.', 'info'); }}
            onUpdateCover={(id, url) => { updateBook(id, { customCover: url }); showToast(url ? 'Cover aktualisiert.' : 'Cover zurückgesetzt.', 'success'); }}
            onUpdate={(id, patch) => updateBook(id, patch)}
            onUpdateShelves={(id, shelfIds) => updateBook(id, { shelfIds })}
            onEdit={(book) => { setSelected(null); setEditBook(book); }}
          />
        )}

        <ToastContainer toasts={toasts} />
      </div>

      {/* DragOverlay — shows a preview card while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeDragBook ? (
          <div className="w-32 opacity-90 rotate-2 shadow-2xl pointer-events-none">
            <BookCard
              book={activeDragBook}
              shelves={shelves}
              onClick={() => {}}
              compact={viewMode === 'compact'}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
