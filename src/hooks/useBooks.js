import { useState, useCallback } from 'react';

const KEY = 'buchscanner_books';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function persist(books) {
  try {
    localStorage.setItem(KEY, JSON.stringify(books));
  } catch (e) {
    console.warn('localStorage quota exceeded — could not save books', e);
    throw e; // re-throw so callers can show an error
  }
}

export function useBooks() {
  const [books, setBooks] = useState(load);

  const addBook = useCallback((data) => {
    const book = { ...data, id: crypto.randomUUID(), addedAt: Date.now() };
    setBooks((prev) => {
      const next = [book, ...prev];
      persist(next);
      return next;
    });
    return book;
  }, []);

  const removeBook = useCallback((id) => {
    setBooks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const updateBook = useCallback((id, patch) => {
    setBooks((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, ...patch } : b));
      persist(next);
      return next;
    });
  }, []);

  const findByISBN = useCallback(
    (isbn) => books.find((b) => b.isbn === isbn.replace(/[^0-9X]/gi, '')),
    [books]
  );

  return { books, addBook, removeBook, updateBook, findByISBN };
}
