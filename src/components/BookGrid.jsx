import { useState, useRef, useCallback, useEffect } from 'react';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookCard } from './BookCard';
import { BookListRow } from './BookListRow';
import { SelectionToolbar } from './SelectionToolbar';
import { SpineView } from './SpineView';

/* ── Column count per viewMode + container width ──────────────────────────── */
function calcCols(width, mode) {
  if (mode === 'compact') {
    // min 6 always
    if (width < 640) return 6;
    if (width < 900) return 7;
    return 8;
  }
  // grid — min 4 always
  if (width < 640) return 4;
  if (width < 900) return 5;
  return 6;
}

function useContainerCols(ref, viewMode) {
  const [cols, setCols] = useState(viewMode === 'compact' ? 6 : 4);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => setCols(calcCols(entry.contentRect.width, viewMode)));
    obs.observe(el);
    setCols(calcCols(el.offsetWidth, viewMode));
    return () => obs.disconnect();
  }, [ref, viewMode]);
  return cols;
}

/* ── Shelf bar ────────────────────────────────────────────────────────────── */
function ShelfBar() {
  return <div className="shelf-bar" />;
}

/* ── Sortable book card wrapper ───────────────────────────────────────────── */
function SortableBookCard({ book, selectMode, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book.id,
    disabled: selectMode,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
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

/* ── ShelfGrid: groups books into rows, inserts ShelfBar between ──────────── */
function ShelfGrid({ books, cols, gap, viewMode, ...cardProps }) {
  const rows = [];
  for (let i = 0; i < books.length; i += cols) {
    rows.push(books.slice(i, i + cols));
  }

  const colClass = {
    2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4',
    5: 'grid-cols-5', 6: 'grid-cols-6', 7: 'grid-cols-7', 8: 'grid-cols-8',
  }[cols] ?? 'grid-cols-4';

  return (
    <div>
      {rows.map((row, i) => (
        <div key={i}>
          <div className={`grid ${colClass} gap-3 px-4 pt-4`}>
            {row.map((book) => (
              <SortableBookCard
                key={book.id}
                book={book}
                compact={viewMode === 'compact'}
                {...cardProps}
              />
            ))}
            {/* Empty slots to keep shelf width consistent */}
            {Array.from({ length: cols - row.length }).map((_, j) => (
              <div key={`empty-${j}`} />
            ))}
          </div>
          <div className="px-4 mt-3">
            <ShelfBar />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main BookGrid ────────────────────────────────────────────────────────── */
export function BookGrid({
  books, shelves = [], onSelect, viewMode = 'grid',
  onBatchDelete, onBatchAddToShelf, onToggleFavorite, activeDragId,
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [band, setBand] = useState(null);

  const gridRef = useRef(null);
  const dragRef = useRef(null);
  const initialSelRef = useRef(new Set());

  const cols = useContainerCols(gridRef, viewMode);

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
      next.has(bookId) ? next.delete(bookId) : next.add(bookId);
      return next;
    });
  }, []);

  const selectInBand = useCallback((band) => {
    const container = gridRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const cards = container.querySelectorAll('[data-book-id]');
    const next = new Set(initialSelRef.current);
    for (const card of cards) {
      const r = card.getBoundingClientRect();
      const cx1 = r.left - cr.left, cy1 = r.top - cr.top + scrollTop;
      const cx2 = cx1 + r.width,    cy2 = cy1 + r.height;
      if (cx2 > band.sx && cx1 < band.ex && cy2 > band.sy && cy1 < band.ey) {
        next.add(card.dataset.bookId);
      }
    }
    setSelectedIds(next);
  }, []);

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

  const handleTouchMove = useCallback((e) => {
    if (!selectMode) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = el?.closest('[data-book-id]');
    if (card?.dataset.bookId) {
      setSelectedIds((prev) => prev.has(card.dataset.bookId) ? prev : new Set([...prev, card.dataset.bookId]));
    }
  }, [selectMode]);

  const handleBatchDelete = useCallback(() => {
    onBatchDelete?.([...selectedIds]);
    exitSelectMode();
  }, [selectedIds, onBatchDelete, exitSelectMode]);

  const handleBatchShelf = useCallback((shelfId) => {
    onBatchAddToShelf?.([...selectedIds], shelfId);
    exitSelectMode();
  }, [selectedIds, onBatchAddToShelf, exitSelectMode]);

  if (books.length === 0) return <EmptyState />;

  // ── List view ──────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <div className="relative">
        <div className="mx-4 mt-4 theme-surface rounded-xl shadow-sm dark:shadow-stone-950/50 overflow-hidden border border-stone-100 dark:border-stone-800">
          {books.map((book) => (
            <BookListRow
              key={book.id} book={book} shelves={shelves}
              onClick={selectMode ? () => toggleBook(book.id) : onSelect}
              selected={selectedIds.has(book.id)}
              selectMode={selectMode}
              onLongPress={enterSelectMode}
            />
          ))}
        </div>
        {selectMode && (
          <SelectionToolbar
            count={selectedIds.size} total={books.length} shelves={shelves}
            onSelectAll={() => setSelectedIds(new Set(books.map((b) => b.id)))}
            onDeselectAll={() => setSelectedIds(new Set())}
            onDelete={handleBatchDelete} onAddToShelf={handleBatchShelf} onExit={exitSelectMode}
          />
        )}
      </div>
    );
  }

  // ── Spine / bookshelf view ─────────────────────────────────────────────────
  if (viewMode === 'spine') {
    return (
      <div className="relative pt-4" ref={gridRef}>
        <SpineView books={books} onSelect={onSelect} />
      </div>
    );
  }

  // ── Grid / Compact view with real shelves ──────────────────────────────────
  const sharedCardProps = {
    shelves,
    onClick: onSelect,
    selectMode,
    onSelect: toggleBook,
    onLongPress: enterSelectMode,
    onToggleFavorite,
  };

  return (
    <div className="relative">
      <div
        ref={gridRef}
        className="theme-bg min-h-full relative pb-4"
        onMouseDown={handleMouseDown}
        onTouchMove={handleTouchMove}
        style={{ userSelect: selectMode ? 'none' : 'auto' }}
      >
        <SortableContext items={books.map((b) => b.id)} strategy={rectSortingStrategy}>
          <ShelfGrid
            books={books}
            cols={cols}
            viewMode={viewMode}
            {...sharedCardProps}
          />
        </SortableContext>

        {/* Rubber-band selection rectangle */}
        {band && (
          <div
            style={{
              position: 'absolute', left: band.x, top: band.y, width: band.w, height: band.h,
              border: '2px solid var(--accent)',
              backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)',
              pointerEvents: 'none', borderRadius: 4,
            }}
          />
        )}
      </div>

      {selectMode && (
        <SelectionToolbar
          count={selectedIds.size} total={books.length} shelves={shelves}
          onSelectAll={() => setSelectedIds(new Set(books.map((b) => b.id)))}
          onDeselectAll={() => setSelectedIds(new Set())}
          onDelete={handleBatchDelete} onAddToShelf={handleBatchShelf} onExit={exitSelectMode}
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
        Scanne den Barcode eines Buches oder gib die ISBN manuell ein, um deine Schmökerstube zu starten.
      </p>
    </div>
  );
}
