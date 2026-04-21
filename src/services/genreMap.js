// Ordered lookup: first match wins. Keywords are checked against
// the full lowercased Google Books categories string.
const GENRE_MAP = [
  { keywords: ['juvenile fiction', "children's fiction", 'picture book'], label: 'Kinder- & Jugendbuch', color: 'green' },
  { keywords: ['young adult', 'teen fiction'], label: 'Kinder- & Jugendbuch', color: 'green' },
  { keywords: ['science fiction'], label: 'Science Fiction & Fantasy', color: 'violet' },
  { keywords: ['fantasy', 'magic'], label: 'Science Fiction & Fantasy', color: 'violet' },
  { keywords: ['horror', 'ghost', 'supernatural', 'vampire'], label: 'Horror', color: 'rose' },
  { keywords: ['thriller', 'suspense'], label: 'Krimi & Thriller', color: 'blue' },
  { keywords: ['mystery', 'crime', 'detective'], label: 'Krimi & Thriller', color: 'blue' },
  { keywords: ['romance', 'love story', 'romantic'], label: 'Liebesromane', color: 'pink' },
  { keywords: ['biography', 'autobiography', 'memoir'], label: 'Biografie', color: 'orange' },
  { keywords: ['history', 'historical'], label: 'Geschichte', color: 'orange' },
  { keywords: ['philosophy', 'ethics'], label: 'Philosophie', color: 'teal' },
  { keywords: ['psychology', 'mental health', 'psychotherapy'], label: 'Psychologie', color: 'teal' },
  { keywords: ['self-help', 'personal development', 'motivation', 'productivity'], label: 'Ratgeber', color: 'amber' },
  { keywords: ['business', 'economics', 'management', 'finance', 'marketing'], label: 'Wirtschaft', color: 'amber' },
  { keywords: ['cooking', 'food', 'baking', 'cuisine'], label: 'Kochen', color: 'orange' },
  { keywords: ['travel', 'guide', 'tourism'], label: 'Reise', color: 'teal' },
  { keywords: ['art', 'photography', 'design', 'painting'], label: 'Kunst & Design', color: 'pink' },
  { keywords: ['comics', 'graphic novel', 'manga'], label: 'Comics & Manga', color: 'violet' },
  { keywords: ['science', 'technology', 'physics', 'biology', 'computing'], label: 'Sachbuch', color: 'blue' },
  { keywords: ['religion', 'spirituality', 'faith'], label: 'Religion & Spiritualität', color: 'teal' },
  { keywords: ['humor', 'comedy', 'satire'], label: 'Humor', color: 'amber' },
  { keywords: ['fiction', 'literary', 'novel'], label: 'Romane', color: 'amber' },
];

/**
 * Maps Google Books category strings to a German shelf name.
 * @param {string[]} categories – e.g. ["Fiction / Literary", "Juvenile Fiction"]
 * @returns {{ label: string, color: string } | null}
 */
export function detectGenre(categories = []) {
  if (!categories.length) return null;
  const text = categories.join(' ').toLowerCase();
  for (const { keywords, label, color } of GENRE_MAP) {
    if (keywords.some((k) => text.includes(k))) {
      return { label, color };
    }
  }
  return null;
}
