import { useState, useCallback, useRef } from 'react';
import {
  DndContext, DragOverlay, MouseSensor,
  useSensor, useSensors, pointerWithin,
} from '@dnd-kit/core';
import { useBooks }    from './hooks/useBooks';
import { useShelves }  from './hooks/useShelves';
import { useScanner }  from './hooks/useScanner';
import { useProfile }  from './hooks/useProfile';
import { useDarkMode } from './hooks/useDarkMode';
import { useTheme }    from './hooks/useTheme';
import { fetchBookByISBN } from './services/bookApi';
import { detectGenre }    from './services/genreMap';
import { BookGrid }        from './components/BookGrid';
import { BookDetail }      from './components/BookDetail';
import { ToastContainer }  from './components/Toast';
import { ScanInput }       from './components/ScanInput';
import { FilterBar }       from './components/FilterBar';
import { Sidebar }         from './components/Sidebar';
import { BottomNav }       from './components/BottomNav';
import { ProfileSetup }    from './components/ProfileSetup';
import { StorageNotice }   from './components/StorageNotice';
import { SettingsModal }   from './components/SettingsModal';
import { BookCreateModal } from './components/BookCreateModal';
import { BookCard }        from './components/BookCard';
import { CameraScanner }   from './components/CameraScanner';

let toastId = 0;

/** Einheitliches Filter-Objekt für Sidebar + FilterBar */
function applyFilter(books, filter, search) {
  let result = books;
  if (filter.type === 'status')    result = result.filter((b) => b.status === filter.value);
  if (filter.type === 'favorites') result = result.filter((b) => b.favorite);
  if (filter.type === 'shelf')     result = result.filter((b) => b.shelfIds?.includes(filter.value));
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (b) => b.title?.toLowerCase().includes(q) || b.authors?.some((a) => a.toLowerCase().includes(q))
    );
  }
  return result;
}

export default function App() {
  const { books, addBook, removeBook, updateBook, findByISBN, reorderBooks } = useBooks();
  const { shelves, addShelf, updateShelf, removeShelf, findOrCreate }         = useShelves();
  const { profile, saveProfile, hasProfile }                                  = useProfile();
  const { dark, toggle: toggleDark }                                          = useDarkMode();
  const { theme, setTheme, accent, setAccent }                               = useTheme();

  const [selected,        setSelected]        = useState(null);
  const [toasts,          setToasts]          = useState([]);
  const [isLoading,       setIsLoading]       = useState(false);
  const [activeFilter,    setActiveFilter]    = useState({ type: 'all' });
  const [viewMode,        setViewMode]        = useState('grid');
  const [search,          setSearch]          = useState('');
  const [selectMode,      setSelectMode]      = useState(false);   // für BottomNav-Ausblendung
  const [cameraOpen,      setCameraOpen]      = useState(false);   // mobiler Scanner
  const [showProfileSetup, setShowProfileSetup] = useState(!hasProfile);
  const [editProfile,     setEditProfile]     = useState(false);
  const [showSettings,    setShowSettings]    = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createISBN,      setCreateISBN]      = useState('');
  const [editBook,        setEditBook]        = useState(null);
  const [activeDragId,    setActiveDragId]    = useState(null);

  const scanInputRef = useRef(null);
  const scanningRef  = useRef(false);

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
      if (existing) {
        showToast(`„${existing.title}" ist bereits in deiner Sammlung.`, 'warning');
        return;
      }
      const data = await fetchBookByISBN(isbn);
      if (!data) {
        showToast(`ISBN ${isbn} nicht gefunden — bitte manuell eintragen.`, 'warning');
        setCreateISBN(isbn);
        setShowCreateModal(true);
        return;
      }
      let shelfIds = [];
      const genre = detectGenre(data.googleCategories ?? []);
      if (genre) { const shelf = findOrCreate(genre.label, genre.color); shelfIds = [shelf.id]; }
      addBook({ ...data, shelfIds });
      showToast(`„${data.title}" hinzugefügt.`, 'success');
    } finally {
      setIsLoading(false);
      scanningRef.current = false;
    }
  }, [findByISBN, addBook, showToast, findOrCreate]);

  useScanner(handleScan);

  const handleDirectAdd = useCallback((data) => {
    const existing = data.isbn ? findByISBN(data.isbn) : null;
    if (existing) { showToast(`„${existing.title}" ist bereits in deiner Sammlung.`, 'warning'); return; }
    let shelfIds = [];
    const genre = detectGenre(data.googleCategories ?? []);
    if (genre) { const shelf = findOrCreate(genre.label, genre.color); shelfIds = [shelf.id]; }
    addBook({
      title:           data.title,
      subtitle:        data.subtitle        ?? '',
      authors:         data.authors         ?? [],
      isbn:            data.isbn            ?? '',
      year:            data.year            ?? '',
      pages:           data.pages           ?? null,
      publisher:       data.publisher       ?? '',
      description:     data.description     ?? '',
      cover:           data.coverUrl ?? data.cover ?? '',
      googleCategories: data.googleCategories ?? [],
      shelfIds,
    });
    showToast(`„${data.title}" hinzugefügt.`, 'success');
  }, [findByISBN, addBook, showToast, findOrCreate]);

  const handleManualCreate = useCallback((data) => {
    addBook({ ...data, id: undefined });
    showToast(`„${data.title}" hinzugefügt.`, 'success');
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
    showToast(`${ids.length} ${ids.length === 1 ? 'Buch' : 'Bücher'} in „${shelf?.name ?? 'Regal'}" verschoben.`, 'success');
  }, [books, shelves, updateBook, showToast]);

  const handleEditSave = useCallback((data) => {
    if (!editBook) return;
    updateBook(editBook.id, data);
    showToast('Änderungen gespeichert.', 'success');
    setEditBook(null);
  }, [editBook, updateBook, showToast]);

  const handleImport = useCallback((importedBooks) => {
    let added = 0;
    importedBooks.forEach((b) => {
      if (!b.isbn || findByISBN(b.isbn)) return;
      addBook({ ...b, id: undefined });
      added++;
    });
    showToast(`${added} ${added === 1 ? 'Buch' : 'Bücher'} importiert.`, 'success');
  }, [addBook, findByISBN, showToast]);

  const handleDragStart = useCallback(({ active }) => setActiveDragId(active.id), []);
  const handleDragEnd   = useCallback(({ active, over }) => {
    setActiveDragId(null);
    if (!over) return;
    const overId = String(over.id);
    if (overId.startsWith('shelf-')) {
      const shelfId = overId.replace('shelf-', '');
      const book = books.find((b) => b.id === active.id);
      if (!book) return;
      const cur = book.shelfIds ?? [];
      if (cur.includes(shelfId)) { showToast('Buch ist bereits in diesem Regal.', 'info'); return; }
      updateBook(active.id, { shelfIds: [...cur, shelfId] });
      const shelf = shelves.find((s) => s.id === shelfId);
      showToast(`In „${shelf?.name ?? 'Regal'}" eingeordnet.`, 'success');
    } else if (active.id !== over.id) {
      reorderBooks(active.id, over.id);
    }
  }, [books, shelves, updateBook, reorderBooks, showToast]);

  // Mobiler Scan-Button (BottomNav)
  const handleMobileScan = useCallback(() => setCameraOpen(true), []);
  const handleMobileCameraScan = useCallback((isbn) => {
    setCameraOpen(false);
    handleScan(isbn);
  }, [handleScan]);

  const filteredBooks  = applyFilter(books, activeFilter, search);
  const selectedBook   = selected ? books.find((b) => b.id === selected.id) ?? selected : null;
  const activeDragBook = activeDragId ? books.find((b) => b.id === activeDragId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col theme-bg overflow-hidden">

        {/* ── Modals ─────────────────────────────────────────────────────── */}
        {(showProfileSetup || editProfile) && (
          <ProfileSetup
            existing={editProfile ? profile : null}
            onSave={(p) => {
              saveProfile(p);
              setShowProfileSetup(false);
              setEditProfile(false);
              showToast(`Willkommen, ${p.name}!`, 'success');
            }}
          />
        )}
        {showCreateModal && (
          <BookCreateModal
            prefillIsbn={createISBN}
            onSave={handleManualCreate}
            onClose={() => { setShowCreateModal(false); setCreateISBN(''); }}
          />
        )}
        {editBook && (
          <BookCreateModal
            existing={editBook}
            onSave={handleEditSave}
            onClose={() => setEditBook(null)}
          />
        )}
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
            accent={accent}
            onSetAccent={setAccent}
          />
        )}

        {/* Mobiler Kamera-Scanner (direkt, ohne Sheet) */}
        {cameraOpen && (
          <CameraScanner
            onScan={handleMobileCameraScan}
            onClose={() => setCameraOpen(false)}
          />
        )}

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="shrink-0 sticky top-0 z-20 theme-surface-2 border-b border-stone-200 dark:border-stone-800 shadow-sm">
          <div className="h-12 flex items-center justify-between gap-3 px-4">

            {/* Mobile: App-Name */}
            <div className="md:hidden flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shadow-sm shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-sm font-bold text-stone-900 dark:text-stone-100 leading-none">
                Schmökerstube
              </h1>
            </div>

            {/* Desktop: Platzhalter (Sidebar zeigt Branding) */}
            <div className="hidden md:block" />

            {/* Rechte Seite: Desktop-ScanInput + Buch-anlegen */}
            <div className="flex items-center gap-1.5">
              <ScanInput
                ref={scanInputRef}
                onScan={handleScan}
                isLoading={isLoading}
                onAddDirect={handleDirectAdd}
              />
              {/* Manuell anlegen (Desktop) */}
              <button
                onClick={() => { setCreateISBN(''); setShowCreateModal(true); }}
                className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Buch manuell eintragen"
              >
                <svg className="w-4.5 h-4.5 w-[1.125rem] h-[1.125rem]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {/* Dunkel-Modus + Einstellungen (Desktop, da Sidebar diese nicht hat auf kleinen Desktops) */}
              <button
                onClick={toggleDark}
                className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title={dark ? 'Heller Modus' : 'Dunkler Modus'}
              >
                {dark ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Einstellungen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-row overflow-hidden">

          {/* Desktop-Sidebar */}
          <Sidebar
            books={books}
            shelves={shelves}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onAddShelf={addShelf}
            onUpdateShelf={updateShelf}
            onRemoveShelf={removeShelf}
            onOpenSettings={() => setShowSettings(true)}
            dark={dark}
            onToggleDark={toggleDark}
            isDragging={activeDragId !== null}
            profile={profile}
          />

          {/* Inhaltsspalte */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">

            <FilterBar
              shelves={shelves}
              books={books}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onAddShelf={addShelf}
              onUpdateShelf={updateShelf}
              onRemoveShelf={removeShelf}
              search={search}
              onSearch={setSearch}
              isDragging={activeDragId !== null}
            />

            <StorageNotice />

            {/* Buchgitter — scrollt eigenständig; auf Mobile Abstand für BottomNav */}
            <main className="flex-1 overflow-y-auto overscroll-contain flex flex-col pb-nav md:pb-0">
              <BookGrid
                books={filteredBooks}
                shelves={shelves}
                onSelect={setSelected}
                viewMode={viewMode}
                onBatchDelete={handleBatchDelete}
                onBatchAddToShelf={handleBatchAddToShelf}
                onToggleFavorite={(id) => updateBook(id, { favorite: !books.find((b) => b.id === id)?.favorite })}
                activeDragId={activeDragId}
                onSelectModeChange={setSelectMode}
              />
            </main>
          </div>
        </div>

        {/* ── Buchdetail ─────────────────────────────────────────────────── */}
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

        {/* ── Mobile Bottom Navigation ────────────────────────────────────── */}
        <BottomNav
          onScanClick={handleMobileScan}
          onAddClick={() => { setCreateISBN(''); setShowCreateModal(true); }}
          onOpenSettings={() => setShowSettings(true)}
          isLoading={isLoading}
          selectMode={selectMode}
        />

        <ToastContainer toasts={toasts} />
      </div>

      {/* DragOverlay — zeigt Vorschau beim Ziehen */}
      <DragOverlay dropAnimation={null}>
        {activeDragBook ? (
          <div className="w-28 opacity-90 rotate-2 shadow-2xl pointer-events-none">
            <BookCard
              book={activeDragBook}
              onClick={() => {}}
              compact={viewMode === 'compact'}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
