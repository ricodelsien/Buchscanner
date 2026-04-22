import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { resolveHex } from '../services/shelfColors';
import { ShelfCreateModal } from './ShelfCreateModal';

// Smart list definitions (order matters)
const SMART_LISTS = [
  { type: 'all',    label: 'Alle Bücher',   icon: 'library' },
  { type: 'status', value: 'reading', label: 'Lese gerade',  icon: 'reading' },
  { type: 'status', value: 'want',    label: 'Möchte lesen', icon: 'bookmark' },
  { type: 'status', value: 'read',    label: 'Gelesen',      icon: 'check' },
  { type: 'status', value: 'dropped', label: 'Abgebrochen',  icon: 'x' },
  { type: 'favorites', label: 'Favoriten', icon: 'heart' },
];

function filterMatches(filter, active) {
  if (filter.type !== active.type) return false;
  if ('value' in filter) return filter.value === active.value;
  return true;
}

function countFor(filter, books) {
  if (filter.type === 'all')       return books.length;
  if (filter.type === 'status')    return books.filter((b) => b.status === filter.value).length;
  if (filter.type === 'favorites') return books.filter((b) => b.favorite).length;
  if (filter.type === 'shelf')     return books.filter((b) => b.shelfIds?.includes(filter.value)).length;
  return 0;
}

function ListIcon({ icon }) {
  const cls = 'w-4 h-4 shrink-0';
  if (icon === 'library') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  );
  if (icon === 'reading') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
  if (icon === 'bookmark') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
  if (icon === 'check') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  if (icon === 'x') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  if (icon === 'heart') return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
  return null;
}

function SmartListItem({ item, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 text-left
        ${active
          ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
          : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-200'
        }`}
    >
      <span className={active ? 'text-[var(--accent)]' : 'text-stone-400 dark:text-stone-500'}>
        <ListIcon icon={item.icon} />
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      {count > 0 && (
        <span className={`text-xs font-semibold tabular-nums ${active ? 'text-[var(--accent)]/70' : 'text-stone-400 dark:text-stone-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function DroppableShelfRow({ shelf, active, count, isDragging, onClick, onEdit }) {
  const { setNodeRef, isOver } = useDroppable({ id: `shelf-${shelf.id}` });
  const hex = resolveHex(shelf.color) ?? '#888';

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-0.5 rounded-lg transition-all duration-150
        ${isDragging && isOver ? 'ring-2 ring-offset-1 ring-[var(--accent)] bg-[var(--accent)]/10' : ''}`}
    >
      <button
        onClick={onClick}
        className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-l-lg text-sm font-medium text-left transition-all duration-150
          ${active
            ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-200'
          }`}
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10"
          style={{ backgroundColor: hex }}
        />
        <span className="flex-1 truncate">{shelf.name}</span>
        {count > 0 && (
          <span className={`text-xs font-semibold tabular-nums ${active ? 'text-[var(--accent)]/70' : 'text-stone-400 dark:text-stone-500'}`}>
            {count}
          </span>
        )}
      </button>
      <button
        onClick={onEdit}
        className={`p-2 rounded-r-lg transition-all duration-150 opacity-0 group-hover:opacity-100
          ${active
            ? 'bg-[var(--accent)]/15 text-[var(--accent)]/60 hover:text-[var(--accent)]'
            : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60'
          }`}
        title="Regal bearbeiten"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}

export function Sidebar({
  books, shelves, activeFilter, onFilterChange,
  onAddShelf, onUpdateShelf, onRemoveShelf,
  onOpenSettings, dark, onToggleDark, isDragging,
  profile,
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingShelf, setEditingShelf] = useState(null);

  const handleCreate = (name, color) => { onAddShelf(name, color); setShowCreateModal(false); };
  const handleEdit   = (name, color) => { if (!editingShelf) return; onUpdateShelf(editingShelf.id, { name, color }); setEditingShelf(null); };
  const handleDelete = () => {
    if (!editingShelf) return;
    onRemoveShelf(editingShelf.id);
    if (activeFilter.type === 'shelf' && activeFilter.value === editingShelf.id) {
      onFilterChange({ type: 'all' });
    }
    setEditingShelf(null);
  };

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 theme-surface-2 border-r border-stone-200 dark:border-stone-800 overflow-y-auto">
      {/* App branding */}
      <div className="px-4 py-5 flex items-center gap-3 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-stone-900 dark:text-stone-100 leading-tight truncate">
            {profile?.name ? profile.name : 'Schmökerstube'}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500 leading-tight">
            {books.length} {books.length === 1 ? 'Buch' : 'Bücher'}
          </p>
        </div>
      </div>

      {/* Smart lists */}
      <nav className="px-2 py-3">
        <p className="px-3 pb-1 text-[0.6rem] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
          Sammlungen
        </p>
        <div className="space-y-0.5">
          {SMART_LISTS.map((item) => (
            <SmartListItem
              key={item.type + (item.value ?? '')}
              item={item}
              active={filterMatches(item, activeFilter)}
              count={countFor(item, books)}
              onClick={() => onFilterChange(item)}
            />
          ))}
        </div>
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-stone-200/60 dark:border-stone-800/60" />

      {/* Custom shelves */}
      <nav className="px-2 py-3 flex-1 group">
        <p className="px-3 pb-1 text-[0.6rem] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
          Regale
        </p>
        <div className="space-y-0.5">
          {shelves.map((shelf) => (
            <DroppableShelfRow
              key={shelf.id}
              shelf={shelf}
              active={activeFilter.type === 'shelf' && activeFilter.value === shelf.id}
              count={countFor({ type: 'shelf', value: shelf.id }, books)}
              isDragging={isDragging}
              onClick={() => onFilterChange(
                activeFilter.type === 'shelf' && activeFilter.value === shelf.id
                  ? { type: 'all' }
                  : { type: 'shelf', value: shelf.id }
              )}
              onEdit={() => setEditingShelf(shelf)}
            />
          ))}
        </div>
        {/* Add shelf */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-all duration-150 mt-1"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-xs font-medium">Regal hinzufügen</span>
        </button>
      </nav>

      {/* Bottom: dark mode + settings */}
      <div className="px-3 py-3 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center gap-1.5">
        <button
          onClick={onToggleDark}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-200/70 dark:hover:bg-stone-700/60 transition-colors"
          title={dark ? 'Hell-Modus' : 'Dunkel-Modus'}
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
          onClick={onOpenSettings}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-stone-500 dark:text-stone-400 hover:bg-stone-200/70 dark:hover:bg-stone-700/60 transition-colors"
          title="Einstellungen"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {showCreateModal && (
        <ShelfCreateModal onSave={handleCreate} onClose={() => setShowCreateModal(false)} />
      )}
      {editingShelf && (
        <ShelfCreateModal
          existing={editingShelf}
          onSave={handleEdit}
          onClose={() => setEditingShelf(null)}
          onDelete={handleDelete}
        />
      )}
    </aside>
  );
}
