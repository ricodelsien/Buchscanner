import { useState } from 'react';

const ALL_GENRES = [
  'Romane', 'Krimi & Thriller', 'Science Fiction & Fantasy',
  'Kinder- & Jugendbuch', 'Biografie', 'Geschichte', 'Ratgeber',
  'Sachbuch', 'Philosophie', 'Psychologie', 'Liebesromane',
  'Horror', 'Comics & Manga', 'Kochen', 'Wirtschaft', 'Kunst & Design',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 3 && h < 12) return 'Guten Morgen';
  if (h >= 12 && h < 18) return 'Guten Tag';
  return 'Guten Abend';
}

export function ProfileSetup({ onSave, existing }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(existing?.name ?? '');
  const [genres, setGenres] = useState(existing?.favoriteGenres ?? []);

  const toggleGenre = (g) =>
    setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);

  const finish = () => onSave({ name: name.trim(), favoriteGenres: genres });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="theme-surface rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Step indicator */}
        <div className="flex gap-1 p-4 pb-0">
          {[0, 1].map((i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${step >= i ? 'bg-amber-500' : 'bg-stone-200 dark:bg-stone-700'}`} />
          ))}
        </div>

        <div className="p-6">
          {/* Step 0: Name */}
          {step === 0 && (
            <div>
              <div className="text-center mb-6">
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
                  {getGreeting()}!
                </p>
                <p className="text-stone-500 dark:text-stone-400 text-sm">
                  Willkommen in deiner Mediathek.
                </p>
              </div>

              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                Wie heißt du?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(1)}
                placeholder="Dein Name…"
                autoFocus
                className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4"
              />
              <button
                onClick={() => setStep(1)}
                disabled={!name.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 dark:disabled:bg-amber-900/40 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
              >
                Weiter
              </button>
            </div>
          )}

          {/* Step 1: Genres */}
          {step === 1 && (
            <div>
              <div className="mb-4">
                <p className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
                  Hallo, {name}!
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Wofür interessierst du dich? <span className="text-stone-400">(optional)</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mb-5 max-h-52 overflow-y-auto">
                {ALL_GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => toggleGenre(g)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      genres.includes(g)
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-600 hover:border-amber-400'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={finish}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
                >
                  Loslegen
                </button>
                <button
                  onClick={finish}
                  className="px-4 py-3 text-sm text-stone-400 dark:text-stone-500 hover:text-stone-600 transition-colors"
                >
                  Überspringen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
