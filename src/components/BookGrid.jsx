import { useState, useRef, useCallback } from 'react';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookCard } from './BookCard';
import { BookListRow } from './BookListRow';
import { SelectionToolbar } from './SelectionToolbar';

const GRID_COLS = {
  grid:    'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  compact: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',
};

/** Sortable wrapper around BookCard */
function SortableBookCard({ book, selectMode, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: book.id, disabled: selectMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <BookCard
        book={book}
        selectMode={selectMode}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
        {...props}
      />
    </div>
  );
}

export function BookGrid({ books, shelves = [], onSelect, viewMode = 'grid', onBatchDelete, onBatchAddToShelf, onToggleFavorite, activeDragId }) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [band, setBand] = useState(null);

  const gridRef = useRef(null);
  const dragRef = useRef(null);
  const initialSelRef = useRef(new Set());

  const enterSelectMode = useCallback((bookId) => {
    setSelectMode(true);
    setSelectedIds(new Set([bookId]));
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setBand(null);
  }, []);

  const toggleBook = useCallback((bookId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  }, []);

  // Rubber-band: compute which cards intersect the band rect
  const selectInBand = useCallback((band) => {
    const container = gridRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const cards = container.querySelectorAll('[data-book-id]');
    const next = new Set(initialSelRef.current);
    for (const card of cards) {
      const r = card.getBoundingClientRect();
      const cx1 = r.left - cr.left;
      const cy1 = r.top - cr.top + scrollTop;
      const cx2 = cx1 + r.width;
      const cy2 = cy1 + r.height;
      if (cx2 > band.sx && cx1 < band.ex && cy2 > band.sy && cy1 < band.ey) {
        next.add(card.dataset.bookId);
      }
    }
    setSelectedIds(next);
  }, []);

  // Start rubber-band on empty grid area (desktop)
  const handleMouseDown = useCallback((e) => {
    if (!selectMode || e.button !== 0) return;
    if (e.target.closest('[data-book-id]')) return;
    e.preventDefault();
    const container = gridRef.current;
    const cr = container.getBoundingClientRect();
    const sx = e.clientX - cr.left;
    const sy = e.clientY - cr.top + container.scrollTop;
    dragRef.current = { sx, sy, cr };
    initialSelRef.current = new Set(selectedIds);

    const onMove = (e) => {
      if (!dragRef.current) return;
      const { sx, sy, cr } = dragRef.current;
      const ex = Math.max(0, Math.min(e.clientX - cr.left, cr.width));
      const ey = e.clientY - cr.top + container.scrollTop;
      const rect = {
        x: Math.min(sx, ex), y: Math.min(sy, ey),
        w: Math.abs(ex - sx), h: Math.abs(ey - sy),
        sx: Math.min(sx, ex), sy: Math.min(sy, ey),
        ex: Math.max(sx, ex), ey: Math.max(sy, ey),
      };
      setBand(rect);
      selectInBand(rect);
    };

    const onUp = () => {
      dragRef.current = null;
      setBand(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [selectMode, selectedIds, selectInBand]);

  // Touch-drag selection (mobile: drag over cards to select)
  const handleTouchMove = useCallback((e) => {
    if (!selectMode) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = el?.closest('[data-book-id]');
    if (card?.dataset.bookId) {
      setSelectedIds((prev) => {
        if (prev.has(card.dataset.bookId)) return prev;
        return new Set([...prev, card.dataset.bookId]);
      });
    }
  }, [selectMode]);

  // Batch operations
  const handleBatchDelete = useCallback(() => {
    onBatchDelete?.([...selectedIds]);
    exitSelectMode();
  }, [selectedIds, onBatchDelete, exitSelectMode]);

  const handleBatchShelf = useCallback((shelfId) => {
    onBatchAddToShelf?.([...selectedIds], shelfId);
    exitSelectMode();
  }, [selectedIds, onBatchAddToShelf, exitSelectMode]);

  if (books.length === 0) return <EmptyState />;

  if (viewMode === 'list') {
    return (
      <div className="relative">
        <div className="mx-4 mt-4 theme-surface rounded-xl shadow-sm dark:shadow-stone-950/50 overflow-hidden border border-stone-100 dark:border-stone-800">
          {books.map((book) => (
            <BookListRow
              key={book.id}
              book={book}
              shelves={shelves}
              onClick={selectMode ? () => toggleBook(book.id) : onSelect}
              selected={selectedIds.has(book.id)}
              selectMode={selectMode}
              onLongPress={enterSelectMode}
            />
          ))}
        </div>
        {selectMode && (
          <SelectionToolbar
            count={selectedIds.size}
            total={books.length}
            shelves={shelves}
            onSelectAll={() => setSelectedIds(new Set(books.map((b) => b.id)))}
            onDeselectAll={() => setSelectedIds(new Set())}
            onDelete={handleBatchDelete}
            onAddToShelf={handleBatchShelf}
            onExit={exitSelectMode}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={gridRef}
        className="p-4 theme-bg min-h-full relative"
        onMouseDown={handleMouseDown}
        onTouchMove={handleTouchMove}
        style={{ userSelect: selectMode ? 'none' : 'auto' }}
      >
        <SortableContext items={books.map((b) => b.id)} strategy={rectSortingStrategy}>
          <div className={`grid ${GRID_COLS[viewMode] ?? GRID_COLS.grid} gap-3`}>
            {books.map((book) => (
              <SortableBookCard
                key={book.id}
                book={book}
                shelves={shelves}
                onClick={onSelect}
                compact={viewMode === 'compact'}
                selectMode={selectMode}
                selected={selectedIds.has(book.id)}
                onSelect={toggleBook}
                onLongPress={enterSelectMode}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </SortableContext>

        {/* Rubber-band selection rectangle */}
        {band && (
          <div
            style={{
              position: 'absolute',
              left: band.x,
              top: band.y,
              width: band.w,
              height: band.h,
              border: '2px solid var(--accent)',
              backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              pointerEvents: 'none',
              borderRadius: 4,
            }}
          />
        )}
      </div>

      {/* Selection toolbar */}
      {selectMode && (
        <SelectionToolbar
          count={selectedIds.size}
          total={books.length}
          shelves={shelves}
          onSelectAll={() => setSelectedIds(new Set(books.map((b) => b.id)))}
          onDeselectAll={() => setSelectedIds(new Set())}
          onDelete={handleBatchDelete}
          onAddToShelf={handleBatchShelf}
          onExit={exitSelectMode}
        />
      )}
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
