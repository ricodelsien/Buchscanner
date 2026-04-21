const GOOGLE_BOOKS = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY = 'https://openlibrary.org/api/books';

export async function fetchBookByISBN(isbn) {
  const clean = isbn.replace(/[^0-9X]/gi, '');

  // Google Books (primary)
  try {
    const res = await fetch(`${GOOGLE_BOOKS}?q=isbn:${clean}`);
    const data = await res.json();
    if (data.totalItems > 0 && data.items?.[0]) {
      const info = data.items[0].volumeInfo;
      const googleCover = info.imageLinks?.thumbnail
        ?.replace('http:', 'https:')
        ?.replace('zoom=1', 'zoom=3')
        ?.replace('&edge=curl', '');
      return {
        isbn: clean,
        title: info.title || 'Unbekannter Titel',
        subtitle: info.subtitle || '',
        authors: info.authors || ['Unbekannter Autor'],
        year: info.publishedDate?.slice(0, 4) || '',
        pages: info.pageCount || null,
        description: info.description || '',
        publisher: info.publisher || '',
        cover: openLibraryCover(clean),
        coverFallback: googleCover || null,
        language: info.language || '',
        googleCategories: info.categories || [],
      };
    }
  } catch {
    // fall through to Open Library
  }

  // Open Library (fallback)
  try {
    const res = await fetch(
      `${OPEN_LIBRARY}?bibkeys=ISBN:${clean}&format=json&jscmd=data`
    );
    const data = await res.json();
    const book = data[`ISBN:${clean}`];
    if (book) {
      return {
        isbn: clean,
        title: book.title || 'Unbekannter Titel',
        subtitle: book.subtitle || '',
        authors: book.authors?.map((a) => a.name) || ['Unbekannter Autor'],
        year: book.publish_date?.slice(-4) || '',
        pages: book.number_of_pages || null,
        description: book.excerpts?.[0]?.text || '',
        publisher: book.publishers?.[0]?.name || '',
        cover: book.cover?.large || openLibraryCover(clean),
        language: '',
      };
    }
  } catch {
    // both APIs failed
  }

  // Deutsche Nationalbibliothek — good coverage of German-language books
  try {
    const res = await fetch(
      `https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&query=isbn%3D${clean}&recordSchema=oai_dc&maximumRecords=1`
    );
    const text = await res.text();

    const extract = (tag) =>
      text.match(new RegExp(`<dc:${tag}[^>]*>([^<]+)<\\/dc:${tag}>`))?.[1]?.trim() || '';
    const extractAll = (tag) =>
      [...text.matchAll(new RegExp(`<dc:${tag}[^>]*>([^<]+)<\\/dc:${tag}>`, 'g'))]
        .map((m) => m[1].trim())
        .filter(Boolean);

    const title = extract('title');
    if (title) {
      const formatRaw = extract('format');
      const pages = parseInt(formatRaw.match(/(\d+)\s*S/)?.[1]) || null;
      const dateRaw = extract('date');
      const year = dateRaw.match(/\d{4}/)?.[0] || '';
      return {
        isbn: clean,
        title,
        subtitle: '',
        authors: extractAll('creator').length ? extractAll('creator') : ['Unbekannter Autor'],
        year,
        pages,
        description: extract('description'),
        publisher: extract('publisher'),
        cover: openLibraryCover(clean),
        coverFallback: null,
        language: 'de',
        googleCategories: [],
      };
    }
  } catch {
    // DNB CORS or network error — fall through
  }

  return null;
}

function openLibraryCover(isbn) {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}
