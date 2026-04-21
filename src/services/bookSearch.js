/**
 * Multi-source book search
 * Queries Google Books and Open Library in parallel, merges and deduplicates results.
 * If the query looks like an ISBN, does a direct ISBN lookup instead.
 */

import { fetchBookByISBN } from './bookApi';

// ── Google Books ─────────────────────────────────────────────────────────────

async function searchGoogle(query) {
  // Run two queries in parallel: free text + title-biased
  const urls = [
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=12&printType=books`,
    `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(query)}&maxResults=8&printType=books`,
  ];
  const responses = await Promise.allSettled(urls.map((u) => fetch(u).then((r) => r.json())));

  const seen = new Set();
  const results = [];

  for (const r of responses) {
    if (r.status !== 'fulfilled') continue;
    for (const item of r.value.items ?? []) {
      const info = item.volumeInfo;
      const isbn =
        info.industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier ??
        info.industryIdentifiers?.find((i) => i.type === 'ISBN_10')?.identifier ??
        '';
      const key = isbn || `${info.title}§${(info.authors ?? []).join(',')}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const thumb = info.imageLinks?.thumbnail
        ?.replace('http:', 'https:')
        ?.replace('zoom=1', 'zoom=2')
        ?.replace('&edge=curl', '');

      results.push({
        source: 'Google Books',
        isbn,
        title: info.title ?? '',
        subtitle: info.subtitle ?? '',
        authors: info.authors ?? [],
        year: info.publishedDate?.slice(0, 4) ?? '',
        pages: info.pageCount ?? null,
        publisher: info.publisher ?? '',
        description: info.description ?? '',
        coverUrl: thumb ?? '',
        googleCategories: info.categories ?? [],
      });
    }
  }
  return results;
}

// ── Open Library ─────────────────────────────────────────────────────────────

async function searchOpenLibrary(query) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12&fields=title,subtitle,author_name,first_publish_year,isbn,publisher,number_of_pages_median,cover_i,subject`;
  const data = await fetch(url).then((r) => r.json());

  return (data.docs ?? []).map((doc) => {
    const isbn = doc.isbn?.[0] ?? '';
    const coverId = doc.cover_i;
    const coverUrl = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
      : '';
    return {
      source: 'Open Library',
      isbn,
      title: doc.title ?? '',
      subtitle: doc.subtitle ?? '',
      authors: doc.author_name ?? [],
      year: doc.first_publish_year ? String(doc.first_publish_year) : '',
      pages: doc.number_of_pages_median ?? null,
      publisher: doc.publisher?.[0] ?? '',
      description: '',
      coverUrl,
      googleCategories: doc.subject?.slice(0, 3) ?? [],
    };
  });
}

// ── ISBN detection ────────────────────────────────────────────────────────────

function looksLikeISBN(query) {
  const digits = query.replace(/[\s\-]/g, '');
  return /^(97[89])?\d{9}[\dX]$/i.test(digits);
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function searchBooks(query) {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  // ISBN input → direct lookup (fastest, most accurate)
  if (looksLikeISBN(q)) {
    const book = await fetchBookByISBN(q.replace(/[\s\-]/g, ''));
    if (book) return [{ ...book, coverUrl: book.cover ?? book.coverFallback ?? '', source: 'ISBN' }];
    return [];
  }

  // Parallel text search
  const [googleRes, olRes] = await Promise.allSettled([
    searchGoogle(q),
    searchOpenLibrary(q),
  ]);

  const google = googleRes.status === 'fulfilled' ? googleRes.value : [];
  const ol = olRes.status === 'fulfilled' ? olRes.value : [];

  // Merge: Google first (better metadata), then Open Library for what's missing
  const seenIsbn = new Set();
  const seenTitle = new Set();
  const merged = [];

  for (const book of [...google, ...ol]) {
    // Deduplicate by ISBN, then by normalised title+first-author
    if (book.isbn && seenIsbn.has(book.isbn)) continue;
    const titleKey = `${book.title.toLowerCase().trim()}§${(book.authors[0] ?? '').toLowerCase().trim()}`;
    if (seenTitle.has(titleKey)) continue;

    if (book.isbn) seenIsbn.add(book.isbn);
    seenTitle.add(titleKey);
    merged.push(book);

    if (merged.length >= 15) break;
  }

  return merged;
}
