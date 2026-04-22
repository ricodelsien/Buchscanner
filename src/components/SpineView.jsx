import { useState, useRef, useCallback, useEffect } from 'react';

// ── Constants ──────────────────────────────────────────────────────────────────
const SPINE_HEIGHT = 188;   // px — vertical book height
const LYING_H      = 34;    // px — lying book height
const DIVIDER_W    = 13;    // px — shelf divider width
const GAP          = 3;     // px — gap between elements
const LYING_MIN_W  = 55;    // px — min width for a lying book filler
const LYING_MAX_W  = 110;   // px — max width for a lying book filler
const PAD_H        = 32;    // px — left+right padding of container

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Deterministic color from a book's identity */
function spineColor(book) {
  let h = 0;
  const s = book.id || book.isbn || book.title || '';
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  const hue = Math.abs(h) % 360;
  const sat = 32 + (Math.abs(h >> 4) % 28);
  const lit = 27 + (Math.abs(h >> 8) % 18);
  return `hsl(${hue},${sat}%,${lit}%)`;
}

/** Width variant: 34 / 44 / 56 px */
function spineWidth(book) {
  let h = 0;
  const s = book.id || book.title || '';
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return [34, 44, 56][Math.abs(h >> 2) % 3];
}

/** Seeded pseudo-RNG (Park-Miller) */
function makeRng(seed) {
  let s = Math.max(1, Math.abs(seed) % 2147483646);
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/**
 * Builds shelf rows from the book list.
 * Each row is an array of elements:
 *   { type: 'spine',   book, id }
 *   { type: 'divider', id }
 *   { type: 'lying',   book, width, id }
 */
function buildShelfRows(books, containerWidth) {
  const usable = Math.max(200, containerWidth - PAD_H);
  const rng = makeRng(books.length * 31 + Math.round(containerWidth));

  const rows = [];
  let row = [];
  let rowW = 0;           // current cumulative width (incl. gaps)
  let spinesSinceDivider = 0;
  let nextDivider = 3 + Math.floor(rng() * 4); // insert divider after 3–6 spines

  const flushRow = (lyingBook = null, lyingW = 0) => {
    if (lyingBook) {
      row.push({ type: 'lying', book: lyingBook, width: lyingW, id: `lying-${rows.length}` });
    }
    rows.push(row);
    row = [];
    rowW = 0;
    spinesSinceDivider = 0;
    nextDivider = 3 + Math.floor(rng() * 4);
  };

  const tryLying = (rowIdx) => {
    const remaining = usable - rowW - GAP;
    if (remaining >= LYING_MIN_W) {
      const lyingW = Math.min(remaining, LYING_MAX_W);
      const idx = Math.floor(rng() * books.length);
      return { book: books[idx], width: lyingW };
    }
    return null;
  };

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const w = spineWidth(book);
    const neededForSpine = rowW === 0 ? w : GAP + w;

    // Would this spine overflow the row?
    if (row.length > 0 && rowW + neededForSpine > usable) {
      const lying = tryLying(rows.length);
      flushRow(lying?.book, lying?.width);
      // Start fresh row with this spine
      row.push({ type: 'spine', book, id: book.id });
      rowW = w;
      spinesSinceDivider = 1;
      continue;
    }

    // Insert a divider if it's time and there's room for divider + this spine
    if (spinesSinceDivider >= nextDivider && row.length > 0) {
      const neededWithDiv = GAP + DIVIDER_W + GAP + w;
      if (rowW + neededWithDiv <= usable) {
        row.push({ type: 'divider', id: `div-${i}-${rows.length}` });
        rowW += GAP + DIVIDER_W;
        spinesSinceDivider = 0;
        nextDivider = 3 + Math.floor(rng() * 4);
      }
    }

    // Add spine
    const addW = rowW === 0 ? w : GAP + w;
    row.push({ type: 'spine', book, id: book.id });
    rowW += addW;
    spinesSinceDivider++;
  }

  // Flush last row
  if (row.length > 0) {
    const lying = tryLying(rows.length);
    flushRow(lying?.book, lying?.width);
  }

  return rows;
}

// ── Components ────────────────────────────────────────────────────────────────

function SpineBook({ book, isJumping, onClick }) {
  const color = spineColor(book);
  const width = spineWidth(book);
  const fontSize = width <= 36 ? '0.58rem' : width <= 44 ? '0.63rem' : '0.68rem';

  return (
    <button
      data-book-id={book.id}
      onClick={() => onClick(book)}
      title={`${book.title}${book.authors?.length ? ' — ' + book.authors[0] : ''}`}
      className={`book-spine${isJumping ? ' spine-jump' : ''}`}
      style={{ width, height: SPINE_HEIGHT, backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      <span style={{
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
        transform: 'rotate(180deg)',
        color: 'rgba(255,255,255,0.92)',
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.03em',
        lineHeight: 1.2,
        textShadow: '0 1px 4px rgba(0,0,0,0.45)',
        maxHeight: SPINE_HEIGHT - 20,
        overflow: 'hidden',
        WebkitLineClamp: 1,
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        padding: '0 3px',
        userSelect: 'none',
      }}>
        {book.title}
      </span>

      {book.status && <StatusDot status={book.status} />}
    </button>
  );
}

function ShelfDivider() {
  return (
    <div
      aria-hidden
      style={{
        width: DIVIDER_W,
        height: SPINE_HEIGHT,
        flexShrink: 0,
        borderRadius: '2px 2px 0 0',
        background: `linear-gradient(
          to right,
          color-mix(in srgb, var(--shelf-face) 75%, black 25%) 0%,
          var(--shelf-top) 25%,
          color-mix(in srgb, var(--shelf-top) 85%, white 15%) 50%,
          var(--shelf-top) 75%,
          color-mix(in srgb, var(--shelf-face) 75%, black 25%) 100%
        )`,
        boxShadow: '2px 0 8px rgba(0,0,0,0.3), -2px 0 8px rgba(0,0,0,0.15)',
      }}
    />
  );
}

function LyingBook({ book, width, onClick }) {
  const color = spineColor(book);
  const [hovered, setHovered] = useState(false);

  return (
    <button
      data-book-id={book.id}
      onClick={() => onClick(book)}
      title={`${book.title} (liegend)`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width,
        height: LYING_H,
        flexShrink: 0,
        backgroundColor: color,
        borderRadius: '2px 2px 0 0',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 8,
        paddingRight: 8,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        transition: 'filter 0.15s ease, transform 0.15s ease',
        filter: hovered ? 'brightness(1.2)' : 'brightness(1)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* Page stack effect on the right */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 8,
        background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 3px)',
        borderLeft: '1px solid rgba(0,0,0,0.15)',
      }} />
      {/* Top highlight */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '2px 2px 0 0',
      }} />
      <span style={{
        fontSize: '0.6rem',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.9)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textShadow: '0 1px 3px rgba(0,0,0,0.4)',
        userSelect: 'none',
        maxWidth: width - 24,
      }}>
        {book.title}
      </span>
    </button>
  );
}

const STATUS_COLORS = { want: '#60a5fa', reading: '#fbbf24', read: '#4ade80', dropped: '#a8a29e' };

function StatusDot({ status }) {
  return (
    <div style={{
      position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
      width: 6, height: 6, borderRadius: '50%',
      backgroundColor: STATUS_COLORS[status] ?? '#888',
      boxShadow: '0 0 4px rgba(0,0,0,0.4)',
    }} />
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function SpineView({ books, onSelect }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [jumpingId, setJumpingId] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setContainerWidth(e.contentRect.width));
    obs.observe(el);
    setContainerWidth(el.offsetWidth);
    return () => obs.disconnect();
  }, []);

  const handleClick = useCallback((book) => {
    setJumpingId(book.id);
    setTimeout(() => { setJumpingId(null); onSelect(book); }, 260);
  }, [onSelect]);

  const rows = buildShelfRows(books, containerWidth);

  if (books.length === 0) return null;

  return (
    <div ref={containerRef} className="w-full pb-4">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx}>
          {/* Row of elements — align to bottom so lying books sit on the shelf */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: GAP,
              padding: `16px 16px 0`,
            }}
          >
            {row.map((el) => {
              if (el.type === 'spine') {
                return (
                  <SpineBook
                    key={el.id}
                    book={el.book}
                    isJumping={jumpingId === el.book.id}
                    onClick={handleClick}
                  />
                );
              }
              if (el.type === 'divider') {
                return <ShelfDivider key={el.id} />;
              }
              if (el.type === 'lying') {
                return (
                  <LyingBook
                    key={el.id}
                    book={el.book}
                    width={el.width}
                    onClick={handleClick}
                  />
                );
              }
              return null;
            })}
          </div>
          {/* Shelf bar below each row */}
          <div className="mx-4">
            <div className="shelf-bar" />
          </div>
        </div>
      ))}
    </div>
  );
}
