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

// ── DNB (Deutsche Nationalbibliothek) ────────────────────────────────────────

const NS_DC = 'http://purl.org/dc/elements/1.1/';
function dcGet(el, tag) {
  return el.getElementsByTagNameNS(NS_DC, tag)[0]?.textContent?.trim() ?? '';
}
function dcGetAll(el, tag) {
  return Array.from(el.getElementsByTagNameNS(NS_DC, tag)).map((n) => n.textContent.trim());
}

async function searchDNB(query) {
  const cql = `tit any "${query}" OR per any "${query}"`;
  const url = `https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&query=${encodeURIComponent(cql)}&recordSchema=oai_dc&maximumRecords=10`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  const records = doc.querySelectorAll('recordData');
  return Array.from(records).flatMap((rec) => {
    const title = dcGet(rec, 'title');
    if (!title) return [];
    const creators = dcGetAll(rec, 'creator');
    const date = dcGet(rec, 'date');
    const publisher = dcGet(rec, 'publisher');
    const identifiers = dcGetAll(rec, 'identifier');
    const isbn = identifiers
      .map((id) => id.replace(/[\s\-]/g, ''))
      .find((id) => /^(97[89])?\d{9}[\dX]$/i.test(id)) ?? '';
    return [{
      source: 'DNB',
      isbn,
      title,
      subtitle: '',
      authors: creators,
      year: date?.slice(0, 4) ?? '',
      pages: null,
      publisher,
      description: dcGet(rec, 'description'),
      coverUrl: isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : '',
      googleCategories: [],
    }];
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

  // Parallel text search across 3 sources
  const [googleRes, olRes, dnbRes] = await Promise.allSettled([
    searchGoogle(q),
    searchOpenLibrary(q),
    searchDNB(q),
  ]);

  const google = googleRes.status === 'fulfilled' ? googleRes.value : [];
  const ol     = olRes.status    === 'fulfilled' ? olRes.value    : [];
  const dnb    = dnbRes.status   === 'fulfilled' ? dnbRes.value   : [];

  // Merge: Google first (better metadata), then Open Library for what's missing
  const seenIsbn = new Set();
  const seenTitle = new Set();
  const merged = [];

  for (const book of [...google, ...ol, ...dnb]) {
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
