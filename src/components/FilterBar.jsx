import { useState, useRef } from 'react';
import { SHELF_COLORS, getColor, DEFAULT_COLOR } from '../services/shelfColors';

export function FilterBar({ shelves, books, activeShelfId, onShelfChange, viewMode, onViewModeChange, onAddShelf, onUpdateShelf, onRemoveShelf, search, onSearch, favoritesOnly, onToggleFavorites }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(DEFAULT_COLOR);
  const inputRef = useRef(null);

  const bookCount = (shelfId) =>
    shelfId ? books.filter((b) => b.shelfIds?.includes(shelfId)).length : books.length;

  const startCreate = () => {
    setCreating(true);
    setNewName('');
    setNewColor(DEFAULT_COLOR);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const confirmCreate = () => {
    const name = newName.trim();
    if (name) onAddShelf(name, newColor);
    setCreating(false);
    setNewName('');
  };

  const startEdit = (shelf) => {
    setEditingId(shelf.id);
    setEditName(shelf.name);
    setEditColor(shelf.color);
  };

  const confirmEdit = () => {
    if (editName.trim()) onUpdateShelf(editingId, { name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  return (
    <div className="bg-white border-b border-stone-200">
      {/* Chips row */}
      <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none">
        {/* Alle */}
        <button
          onClick={() => onShelfChange(null)}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            activeShelfId === null
              ? 'bg-stone-900 text-white border-stone-900'
              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
          }`}
        >
          Alle
          <span className={`text-xs ${activeShelfId === null ? 'text-white/70' : 'text-stone-400'}`}>
            {books.length}
          </span>
        </button>

        {/* Shelf chips */}
        {shelves.map((shelf) => {
          const c = getColor(shelf.color);
          const isActive = activeShelfId === shelf.id;
          return (
            <div key={shelf.id} className="shrink-0 flex items-center gap-0.5">
              <button
                onClick={() => onShelfChange(isActive ? null : shelf.id)}
                className={`flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-l-full text-xs font-medium border transition-colors ${
                  isActive ? c.active : `${c.chip} hover:opacity-80`
                }`}
              >
                {shelf.name}
                <span className={`text-xs ${isActive ? 'opacity-70' : 'opacity-60'}`}>
                  {bookCount(shelf.id)}
                </span>
              </button>
              <button
                onClick={() => startEdit(shelf)}
                className={`px-1.5 py-1.5 rounded-r-full text-xs border-y border-r transition-colors ${
                  isActive ? `${c.active} border-transparent` : `${c.chip} hover:opacity-80`
                }`}
                title="Regal bearbeiten"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          );
        })}

        {/* Neues Regal */}
        {creating ? (
          <div className="shrink-0 flex items-center gap-1.5 border border-stone-300 rounded-full px-2 py-1 bg-white">
            <div className="flex gap-0.5">
              {SHELF_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setNewColor(c.id)}
                  className={`w-3.5 h-3.5 rounded-full ${c.dot} ${newColor === c.id ? 'ring-2 ring-offset-1 ring-stone-400' : ''}`}
                />
              ))}
            </div>
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmCreate(); if (e.key === 'Escape') setCreating(false); }}
              placeholder="Name…"
              className="w-24 text-xs outline-none"
            />
            <button onClick={confirmCreate} className="text-stone-500 hover:text-stone-900">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button onClick={() => setCreating(false)} className="text-stone-400 hover:text-stone-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={startCreate}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-dashed border-stone-300 text-stone-400 hover:border-stone-500 hover:text-stone-600 transition-colors"
            title="Regal hinzufügen"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}

        {/* Favoriten-Filter */}
        <button
          onClick={onToggleFavorites}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            favoritesOnly
              ? 'bg-rose-500 text-white border-rose-500'
              : 'text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-400'
          }`}
          title="Nur Favoriten"
        >
          <svg className="w-3 h-3" fill={favoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Spacer + View toggle (rechts) */}
        <div className="flex-1" />
        <div className="shrink-0 flex items-center gap-0.5 bg-stone-100 rounded-lg p-0.5">
          {[
            { mode: 'grid', icon: <GridIcon /> },
            { mode: 'compact', icon: <CompactIcon /> },
            { mode: 'list', icon: <ListIcon /> },
          ].map(({ mode, icon }) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                viewMode === mode ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      {(search !== undefined) && (
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

      {/* Inline Edit Modal */}
      {editingId && (
        <EditShelfModal
          name={editName}
          color={editColor}
          onNameChange={setEditName}
          onColorChange={setEditColor}
          onSave={confirmEdit}
          onDelete={() => {
            onRemoveShelf(editingId);
            if (activeShelfId === editingId) onShelfChange(null);
            setEditingId(null);
          }}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

function EditShelfModal({ name, color, onNameChange, onColorChange, onSave, onDelete, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-stone-900 mb-4">Regal bearbeiten</h3>
        <div className="flex gap-2 mb-4">
          {SHELF_COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => onColorChange(c.id)}
              className={`w-6 h-6 rounded-full ${c.dot} ${color === c.id ? 'ring-2 ring-offset-2 ring-stone-500 scale-110' : ''} transition-transform`}
            />
          ))}
        </div>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onClose(); }}
          autoFocus
          className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onSave} className="flex-1 bg-stone-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-stone-800 transition-colors">
            Speichern
          </button>
          <button onClick={onDelete} className="px-4 py-2.5 text-red-500 hover:text-red-700 text-sm font-medium transition-colors">
            Löschen
          </button>
        </div>
      </div>
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
