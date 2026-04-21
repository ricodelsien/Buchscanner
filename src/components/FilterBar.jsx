import { useState } from 'react';
import { chipStyle, resolveHex, DEFAULT_COLOR } from '../services/shelfColors';
import { ShelfCreateModal } from './ShelfCreateModal';

export function FilterBar({ shelves, books, activeShelfId, onShelfChange, viewMode, onViewModeChange, onAddShelf, onUpdateShelf, onRemoveShelf, search, onSearch, favoritesOnly, onToggleFavorites }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingShelf, setEditingShelf] = useState(null); // full shelf object

  const bookCount = (shelfId) =>
    shelfId ? books.filter((b) => b.shelfIds?.includes(shelfId)).length : books.length;

  const handleCreate = (name, color) => {
    onAddShelf(name, color);
    setShowCreateModal(false);
  };

  const handleEdit = (name, color) => {
    if (!editingShelf) return;
    onUpdateShelf(editingShelf.id, { name, color });
    setEditingShelf(null);
  };

  const handleDelete = () => {
    if (!editingShelf) return;
    onRemoveShelf(editingShelf.id);
    if (activeShelfId === editingShelf.id) onShelfChange(null);
    setEditingShelf(null);
  };

  return (
    <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
      {/* Chips row */}
      <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none">
        {/* Alle */}
        <button
          onClick={() => onShelfChange(null)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            activeShelfId === null
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border-stone-900 dark:border-stone-100'
              : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500'
          }`}
        >
          Alle
          <span className={`text-xs ${activeShelfId === null ? 'opacity-70' : 'text-stone-400 dark:text-stone-500'}`}>
            {books.length}
          </span>
        </button>

        {/* Shelf chips */}
        {shelves.map((shelf) => {
          const hex = resolveHex(shelf.color);
          const isActive = activeShelfId === shelf.id;
          const style = chipStyle(hex, isActive);
          return (
            <div key={shelf.id} className="shrink-0 flex items-center gap-0.5">
              <button
                onClick={() => onShelfChange(isActive ? null : shelf.id)}
                style={style}
                className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-l-full text-xs font-medium border transition-all hover:brightness-105"
              >
                {shelf.name}
                <span className="text-xs opacity-60">{bookCount(shelf.id)}</span>
              </button>
              <button
                onClick={() => setEditingShelf(shelf)}
                style={style}
                className="px-1.5 py-1.5 rounded-r-full text-xs border-y border-r transition-all hover:brightness-105"
                title="Regal bearbeiten"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          );
        })}

        {/* Add shelf button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-dashed border-stone-300 dark:border-stone-600 text-stone-400 dark:text-stone-500 hover:border-amber-400 dark:hover:border-amber-500 hover:text-amber-500 transition-colors"
          title="Regal hinzufügen"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Favorites filter */}
        <button
          onClick={onToggleFavorites}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            favoritesOnly
              ? 'bg-rose-500 text-white border-rose-500'
              : 'text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600'
          }`}
          title="Nur Favoriten"
        >
          <svg className="w-3 h-3" fill={favoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Spacer + View toggle */}
        <div className="flex-1" />
        <div className="shrink-0 flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
          {[
            { mode: 'grid', icon: <GridIcon /> },
            { mode: 'compact', icon: <CompactIcon /> },
            { mode: 'list', icon: <ListIcon /> },
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
      </div>

      {/* Search */}
      {search !== undefined && (
        <div className="px-4 pb-2.5">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Titel oder Autor suchen…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-stone-50 dark:placeholder-stone-500"
            />
            {search && (
              <button onClick={() => onSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create shelf modal */}
      {showCreateModal && (
        <ShelfCreateModal
          onSave={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit shelf modal */}
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
      <rect x="2" y="2" width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="9.5" y="2" width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="17" y="2" width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="2" y="9.5" width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="9.5" y="9.5" width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="17" y="9.5" width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="2" y="17" width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="9.5" y="17" width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
      <rect x="17" y="17" width="4.5" height="4.5" rx="0.5" strokeWidth={2}/>
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
