import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { chipStyle, resolveHex } from '../services/shelfColors';
import { ShelfCreateModal } from './ShelfCreateModal';

const STATUS_CHIPS = [
  { type: 'all',                       label: 'Alle' },
  { type: 'status', value: 'reading',  label: 'Lese gerade' },
  { type: 'status', value: 'want',     label: 'Wunschliste' },
  { type: 'status', value: 'read',     label: 'Gelesen' },
  { type: 'status', value: 'dropped',  label: 'Abgebrochen' },
  { type: 'favorites',                 label: 'Favoriten' },
];

function filterMatches(chip, active) {
  if (chip.type !== active.type) return false;
  if ('value' in chip) return chip.value === active.value;
  return true;
}

export function FilterBar({
  shelves, books,
  activeFilter = { type: 'all' }, onFilterChange,
  viewMode, onViewModeChange,
  onAddShelf, onUpdateShelf, onRemoveShelf,
  search, onSearch,
  isDragging,
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingShelf, setEditingShelf] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const countFor = (chip) => {
    if (chip.type === 'all')       return books.length;
    if (chip.type === 'status')    return books.filter((b) => b.status === chip.value).length;
    if (chip.type === 'favorites') return books.filter((b) => b.favorite).length;
    if (chip.type === 'shelf')     return books.filter((b) => b.shelfIds?.includes(chip.value)).length;
    return 0;
  };

  const handleCreate = (name, color) => { onAddShelf(name, color); setShowCreateModal(false); };
  const handleEdit   = (name, color) => {
    if (!editingShelf) return;
    onUpdateShelf(editingShelf.id, { name, color });
    setEditingShelf(null);
  };
  const handleDelete = () => {
    if (!editingShelf) return;
    onRemoveShelf(editingShelf.id);
    if (activeFilter.type === 'shelf' && activeFilter.value === editingShelf.id) onFilterChange({ type: 'all' });
    setEditingShelf(null);
  };

  return (
    <div className="theme-surface-2 border-b border-stone-200 dark:border-stone-800 shrink-0">

      {/* ── Mobile: eine Zeile Chips + View-Toggle + Suche-Icon ── */}
      <div className="md:hidden flex items-center gap-0 h-10">

        {/* Scrollbare Chips */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none min-w-0 px-3">

          {STATUS_CHIPS.map((chip) => {
            const active = filterMatches(chip, activeFilter);
            const count  = countFor(chip);
            return (
              <button
                key={chip.type + (chip.value ?? '')}
                onClick={() => onFilterChange(chip)}
                className={`shrink-0 flex items-center gap-1 px-2.5 h-6 rounded-full text-[0.7rem] font-medium transition-all
                  ${active
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
              >
                {chip.label}
                {count > 0 && (
                  <span className={`text-[0.6rem] tabular-nums ${active ? 'opacity-70' : 'opacity-60'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Regal-Chips (mobile) */}
          {shelves.map((shelf) => (
            <DroppableShelfChip
              key={shelf.id}
              shelf={shelf}
              isActive={activeFilter.type === 'shelf' && activeFilter.value === shelf.id}
              bookCount={countFor({ type: 'shelf', value: shelf.id })}
              isDragging={isDragging}
              onShelfChange={(id) => onFilterChange(
                activeFilter.type === 'shelf' && activeFilter.value === id
                  ? { type: 'all' }
                  : { type: 'shelf', value: id }
              )}
              onEdit={() => setEditingShelf(shelf)}
            />
          ))}

          {/* Regal anlegen */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-dashed border-stone-300 dark:border-stone-600 text-stone-400 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            title="Regal anlegen"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Rechts: Suche-Icon + View-Toggle */}
        <div className="shrink-0 flex items-center gap-1 pr-2 pl-1 border-l border-stone-200 dark:border-stone-700">
          <button
            onClick={() => setSearchOpen((o) => !o)}
            className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
              searchOpen || search
                ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
            }`}
            title="Suche"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>
      </div>

      {/* Mobile Suchfeld (klappbar) */}
      {(searchOpen || search) && (
        <div className="md:hidden px-3 pb-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              autoFocus
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Titel oder Autor suchen…"
              className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:placeholder-stone-500"
            />
            {search && (
              <button onClick={() => { onSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Desktop: Suche + View-Toggle ── */}
      <div className="hidden md:flex items-center gap-3 px-4 h-11">
        {search !== undefined && (
          <div className="flex-1 relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Titel oder Autor suchen…"
              className="w-full pl-9 pr-8 py-1.5 text-sm rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 dark:placeholder-stone-500"
            />
            {search && (
              <button onClick={() => onSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="ml-auto">
          <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>
      </div>

      {showCreateModal && <ShelfCreateModal onSave={handleCreate} onClose={() => setShowCreateModal(false)} />}
      {editingShelf && (
        <ShelfCreateModal
          existing={editingShelf}
          onSave={handleEdit}
          onClose={() => setEditingShelf(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

/** Regal-Chip als DnD-Droppable (für mobile) */
function DroppableShelfChip({ shelf, isActive, bookCount, isDragging, onShelfChange, onEdit }) {
  const { setNodeRef, isOver } = useDroppable({ id: `shelf-${shelf.id}` });
  const hex = resolveHex(shelf.color);
  const style = chipStyle(hex, isActive || (isDragging && isOver));

  return (
    <div ref={setNodeRef} className="shrink-0 flex items-center gap-0.5">
      <button
        onClick={() => onShelfChange(shelf.id)}
        style={{
          ...style,
          transform: isOver && isDragging ? 'scale(1.06)' : undefined,
          transition: 'transform 0.15s',
        }}
        className="flex items-center gap-1 pl-2.5 pr-1.5 h-6 rounded-l-full text-[0.7rem] font-medium border transition-all"
      >
        {shelf.name}
        {bookCount > 0 && <span className="text-[0.6rem] opacity-60">{bookCount}</span>}
      </button>
      <button
        onClick={onEdit}
        style={style}
        className="px-1 h-6 rounded-r-full text-xs border-y border-r transition-all"
        title="Regal bearbeiten"
      >
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}

function ViewToggle({ viewMode, onViewModeChange }) {
  return (
    <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
      {[
        { mode: 'grid',    icon: <GridIcon /> },
        { mode: 'compact', icon: <CompactIcon /> },
        { mode: 'list',    icon: <ListIcon /> },
      ].map(({ mode, icon }) => (
        <button
          key={mode}
          onClick={() => onViewModeChange(mode)}
          className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
            viewMode === mode
              ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-stone-100'
              : 'text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300'
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

function GridIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2}/>
      <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2}/>
      <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2}/>
      <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={2}/>
    </svg>
  );
}
function CompactIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2"   y="2"   width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="9.5" y="2"   width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="17"  y="2"   width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="2"   y="9.5" width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="9.5" y="9.5" width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="17"  y="9.5" width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="2"   y="17"  width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="9.5" y="17"  width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="17"  y="17"  width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
    </svg>
  );
}
function ListIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

