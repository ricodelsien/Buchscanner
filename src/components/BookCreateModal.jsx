import { useState, useRef, useEffect, useCallback } from 'react';
import { searchBooks } from '../services/bookSearch';

function compressImage(dataUrl, cb) {
  const img = new Image();
  img.onload = () => {
    const MAX = 600;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    cb(canvas.toDataURL('image/jpeg', 0.75));
  };
  img.src = dataUrl;
}

export function BookCreateModal({ onSave, onClose, prefillIsbn = '', existing = null }) {
  const isEdit = Boolean(existing);

  // Form state — initialise from existing book if editing
  const [isbn, setIsbn] = useState(existing?.isbn ?? prefillIsbn);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [subtitle, setSubtitle] = useState(existing?.subtitle ?? '');
  const [authors, setAuthors] = useState(existing?.authors?.join(', ') ?? '');
  const [year, setYear] = useState(existing?.year ?? '');
  const [pages, setPages] = useState(existing?.pages ?? '');
  const [publisher, setPublisher] = useState(existing?.publisher ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [coverData, setCoverData] = useState(existing?.customCover ?? null);
  const [coverUrl, setCoverUrl] = useState(existing?.cover ?? '');
  const [coverTab, setCoverTab] = useState('upload');

  // Search state
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const debounceRef = useRef(null);
  const fileRef = useRef(null);

  const runSearch = useCallback(async (q) => {
    if (q.length < 2) { setSearchResults([]); setSearchDone(false); return; }
    setSearching(true);
    setSearchDone(false);
    try {
      const results = await searchBooks(q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
      setSearchDone(true);
    }
  }, []);

  const handleQueryChange = (val) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 300);
  };

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const applyResult = (r) => {
    setTitle(r.title);
    setSubtitle(r.subtitle);
    setAuthors(r.authors.join(', '));
    setYear(r.year);
    setPages(r.pages ?? '');
    setPublisher(r.publisher);
    setDescription(r.description);
    if (r.isbn) setIsbn(r.isbn);
    if (r.coverUrl) { setCoverUrl(r.coverUrl); setCoverData(null); setCoverTab('url'); }
    setSearchResults([]);
    setQuery('');
    setSearchDone(false);
  };

  const handleCoverFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      compressImage(ev.target.result, (compressed) => {
        setCoverData(compressed);
        setCoverUrl('');
      });
    };
    reader.readAsDataURL(file);
  };

  const coverPreview = coverData || coverUrl || null;

  const save = () => {
    if (!title.trim()) return;
    const authorList = authors.split(',').map((a) => a.trim()).filter(Boolean);
    onSave({
      ...(existing ?? {}),
      isbn: isbn.replace(/[^0-9X]/gi, ''),
      title: title.trim(),
      subtitle: subtitle.trim(),
      authors: authorList.length ? authorList : ['Unbekannter Autor'],
      year: String(year).trim(),
      pages: pages ? parseInt(pages, 10) : null,
      publisher: publisher.trim(),
      description: description.trim(),
      customCover: coverData ?? existing?.customCover ?? null,
      cover: coverUrl.trim() || existing?.cover || null,
      shelfIds: existing?.shelfIds ?? [],
      googleCategories: existing?.googleCategories ?? [],
    });
  };

  const inputCls =
    'w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-stone-300 dark:placeholder-stone-600';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 theme-surface w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              {isEdit ? 'Buch bearbeiten' : 'Buch anlegen'}
            </h2>
            {!isEdit && prefillIsbn && (
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                ISBN {prefillIsbn} — nicht gefunden, bitte manuell ergänzen
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
            <svg className="w-4 h-4 text-stone-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Search — Titel/Autor suchen */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Titel, Autor oder ISBN
              </label>
              <span className="text-[10px] text-stone-400 dark:text-stone-500">Google Books + Open Library</span>
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="z.B. Der Prozess, Kafka, 9783…"
                className={`${inputCls} pl-9 pr-8`}
              />
              {searching && (
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </div>

            {/* Results dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-1 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden shadow-lg max-h-72 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => applyResult(r)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-left border-b border-stone-100 dark:border-stone-800 last:border-0 transition-colors"
                  >
                    {/* Cover thumbnail */}
                    <div className="shrink-0 w-9 h-12 rounded overflow-hidden bg-stone-100 dark:bg-stone-800">
                      {r.coverUrl ? (
                        <img src={r.coverUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 dark:text-stone-100 leading-tight truncate">{r.title}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                        {r.authors.join(', ')}
                        {r.year ? <span className="text-stone-400 dark:text-stone-500"> · {r.year}</span> : ''}
                        {r.publisher ? <span className="text-stone-400 dark:text-stone-500"> · {r.publisher}</span> : ''}
                      </p>
                    </div>
                    {/* Add icon */}
                    <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
            {searchDone && searchResults.length === 0 && query.length >= 2 && (
              <p className="mt-1.5 text-xs text-stone-400 dark:text-stone-500 px-1">
                Nichts gefunden — bitte manuell ausfüllen oder Suche verfeinern.
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800" />
            <span className="text-xs text-stone-400 dark:text-stone-500">Felder</span>
            <div className="flex-1 h-px bg-stone-100 dark:bg-stone-800" />
          </div>

          {/* Cover */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">Cover</label>
            <div className="flex gap-4 items-start">
              <div
                className="shrink-0 w-16 aspect-[2/3] rounded-lg border-2 border-dashed border-stone-200 dark:border-stone-700 overflow-hidden bg-stone-50 dark:bg-stone-800 flex items-center justify-center cursor-pointer"
                onClick={() => coverTab === 'upload' && fileRef.current?.click()}
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-6 h-6 text-stone-300 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex gap-1 mb-2">
                  {['upload', 'url'].map((tab) => (
                    <button key={tab} onClick={() => setCoverTab(tab)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${coverTab === tab ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}>
                      {tab === 'upload' ? 'Datei' : 'URL'}
                    </button>
                  ))}
                </div>
                {coverTab === 'upload' ? (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-500 dark:text-stone-400 text-left hover:border-amber-400 transition-colors">
                    {coverData ? 'Bild ausgewählt ✓' : 'Bild auswählen…'}
                  </button>
                ) : (
                  <input type="url" value={coverUrl} onChange={(e) => { setCoverUrl(e.target.value); setCoverData(null); }}
                    placeholder="https://..." className={inputCls} />
                )}
                {coverPreview && (
                  <button onClick={() => { setCoverData(null); setCoverUrl(''); }}
                    className="mt-1 text-xs text-red-400 hover:text-red-600">Entfernen</button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Titel *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel des Buches" autoFocus={isEdit} className={inputCls} />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Untertitel</label>
            <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
              placeholder="optional" className={inputCls} />
          </div>

          {/* Authors */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Autor(en)</label>
            <input type="text" value={authors} onChange={(e) => setAuthors(e.target.value)}
              placeholder="Mehrere mit Komma trennen" className={inputCls} />
          </div>

          {/* Year + Pages */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Jahr</label>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
                placeholder="2024" min="1000" max="2099" className={inputCls} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Seiten</label>
              <input type="number" value={pages} onChange={(e) => setPages(e.target.value)}
                placeholder="320" min="1" className={inputCls} />
            </div>
          </div>

          {/* Publisher */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Verlag</label>
            <input type="text" value={publisher} onChange={(e) => setPublisher(e.target.value)}
              placeholder="z.B. Fischer Verlag" className={inputCls} />
          </div>

          {/* ISBN */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">ISBN</label>
            <input type="text" value={isbn} onChange={(e) => setIsbn(e.target.value)}
              placeholder="978-3-…" className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">Klappentext</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung…" rows={3} className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-stone-100 dark:border-stone-800 flex gap-2 shrink-0">
          <button onClick={save} disabled={!title.trim()}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 dark:disabled:bg-amber-900/40 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
            {isEdit ? 'Änderungen speichern' : 'Buch speichern'}
          </button>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
