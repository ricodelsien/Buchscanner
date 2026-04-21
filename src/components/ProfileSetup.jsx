import { useState } from 'react';

const ALL_GENRES = [
  'Romane', 'Krimi & Thriller', 'Science Fiction & Fantasy',
  'Kinder- & Jugendbuch', 'Biografie', 'Geschichte', 'Ratgeber',
  'Sachbuch', 'Philosophie', 'Psychologie', 'Liebesromane',
  'Horror', 'Comics & Manga', 'Kochen', 'Wirtschaft', 'Kunst & Design',
];

export function ProfileSetup({ onSave, existing }) {
  const [name, setName] = useState(existing?.name ?? '');
  const [genres, setGenres] = useState(existing?.favoriteGenres ?? []);

  const toggleGenre = (g) =>
    setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);

  const save = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), favoriteGenres: genres });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              {existing ? 'Profil bearbeiten' : 'Willkommen!'}
            </h2>
            {!existing && (
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
                Wie sollen wir dich nennen?
              </p>
            )}
          </div>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="Dein Name…"
            autoFocus
            className="w-full border border-stone-300 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 mb-5"
          />

          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
            Lieblingsgenres (optional)
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {ALL_GENRES.map((g) => (
              <button
                key={g}
                onClick={() => toggleGenre(g)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  genres.includes(g)
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-600 hover:border-stone-400'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <button
            onClick={save}
            disabled={!name.trim()}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
          >
            {existing ? 'Speichern' : 'Loslegen'}
          </button>
        </div>
      </div>
    </div>
  );
}
