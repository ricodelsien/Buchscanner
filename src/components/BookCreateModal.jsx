import { useState, useRef } from 'react';

export function BookCreateModal({ onSave, onClose, prefillIsbn = '' }) {
  const [isbn, setIsbn] = useState(prefillIsbn);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState('');
  const [pages, setPages] = useState('');
  const [publisher, setPublisher] = useState('');
  const [description, setDescription] = useState('');
  const [coverData, setCoverData] = useState(null);   // compressed base64
  const [coverUrl, setCoverUrl] = useState('');
  const [coverTab, setCoverTab] = useState('upload'); // 'upload' | 'url'
  const fileRef = useRef(null);

  const handleCoverFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 600;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        setCoverData(canvas.toDataURL('image/jpeg', 0.75));
        setCoverUrl('');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const coverPreview = coverData || (coverUrl.trim() || null);

  const save = () => {
    if (!title.trim()) return;
    const authorList = authors
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    onSave({
      isbn: isbn.replace(/[^0-9X]/gi, ''),
      title: title.trim(),
      subtitle: subtitle.trim(),
      authors: authorList.length ? authorList : ['Unbekannter Autor'],
      year: year.trim(),
      pages: pages ? parseInt(pages, 10) : null,
      publisher: publisher.trim(),
      description: description.trim(),
      customCover: coverData || null,
      cover: coverUrl.trim() || null,
      shelfIds: [],
      googleCategories: [],
    });
  };

  const Field = ({ label, children, half }) => (
    <div className={half ? 'flex-1 min-w-0' : ''}>
      <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );

  const inputCls =
    'w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder-stone-300 dark:placeholder-stone-600';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 bg-white dark:bg-stone-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Buch manuell anlegen</h2>
            {prefillIsbn && (
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                ISBN {prefillIsbn} — nicht in Datenbanken gefunden
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            <svg className="w-4 h-4 text-stone-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Cover */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
              Cover
            </label>
            <div className="flex gap-4 items-start">
              {/* Preview */}
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
              {/* Tabs */}
              <div className="flex-1 min-w-0">
                <div className="flex gap-1 mb-2">
                  {['upload', 'url'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setCoverTab(tab)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        coverTab === tab
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                          : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                      }`}
                    >
                      {tab === 'upload' ? 'Datei' : 'URL'}
                    </button>
                  ))}
                </div>
                {coverTab === 'upload' ? (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2 text-sm text-stone-500 dark:text-stone-400 text-left hover:border-amber-400 transition-colors"
                  >
                    {coverData ? 'Bild ausgewählt ✓' : 'Bild auswählen…'}
                  </button>
                ) : (
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => { setCoverUrl(e.target.value); setCoverData(null); }}
                    placeholder="https://..."
                    className={inputCls}
                  />
                )}
                {coverPreview && (
                  <button
                    onClick={() => { setCoverData(null); setCoverUrl(''); }}
                    className="mt-1 text-xs text-red-400 hover:text-red-600"
                  >
                    Entfernen
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
              </div>
            </div>
          </div>

          {/* Title (required) */}
          <Field label="Titel *">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel des Buches"
              autoFocus
              className={inputCls}
            />
          </Field>

          {/* Subtitle */}
          <Field label="Untertitel">
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="optional"
              className={inputCls}
            />
          </Field>

          {/* Authors */}
          <Field label="Autor(en)">
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder="Mehrere mit Komma trennen"
              className={inputCls}
            />
          </Field>

          {/* Year + Pages side by side */}
          <div className="flex gap-3">
            <Field label="Jahr" half>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                min="1000"
                max="2099"
                className={inputCls}
              />
            </Field>
            <Field label="Seiten" half>
              <input
                type="number"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="320"
                min="1"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Publisher */}
          <Field label="Verlag">
            <input
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="z.B. Fischer Verlag"
              className={inputCls}
            />
          </Field>

          {/* ISBN */}
          <Field label="ISBN">
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="978-3-..."
              className={inputCls}
            />
          </Field>

          {/* Description */}
          <Field label="Klappentext">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung…"
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-stone-100 dark:border-stone-800 flex gap-2 shrink-0">
          <button
            onClick={save}
            disabled={!title.trim()}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 dark:disabled:bg-amber-900/40 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
          >
            Buch speichern
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
