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

  return null;
}

function openLibraryCover(isbn) {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}
