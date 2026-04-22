import { useState, useRef, useCallback, useEffect } from 'react';

// ── Curated deep-tone spine color palette ──────────────────────────────────────
const SPINE_PALETTE = [
  '#7B1D1D', '#991B1B', '#9F1239', '#881337',
  '#1B4332', '#1B5E3C', '#14532D', '#065F46',
  '#1A3A5C', '#1E3A8A', '#1E40AF', '#164E63',
  '#3B0764', '#4C1D95', '#581C87', '#6B21A8',
  '#451A03', '#7C2D12', '#78350F', '#92400E',
  '#1C1917', '#374151', '#1F2937', '#111827',
  '#134E4A', '#0F3460', '#3D1A78', '#701A75',
];

// ── Height & width variants ────────────────────────────────────────────────────
const HEIGHTS = [148, 165, 180, 196];  // 4 levels
const WIDTHS  = [24,  32,  42,  54];   // 4 levels

const GAP   = 2;   // px between spines
const PAD_H = 32;  // container left+right padding

// ── Deterministic hash from a string ──────────────────────────────────────────
function djb2(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return h >>> 0; // unsigned
}

function bookHash(book) {
  return djb2(book.id ?? book.isbn ?? book.title ?? String(Math.random()));
}

function spineColor(book) {
  return SPINE_PALETTE[bookHash(book) % SPINE_PALETTE.length];
}

function spineHeight(book) {
  return HEIGHTS[(bookHash(book) >> 3) % HEIGHTS.length];
}

function spineWidth(book) {
  return WIDTHS[(bookHash(book) >> 6) % WIDTHS.length];
}

// ── Slightly lighter/darker tint for 3-D edge effects ─────────────────────────
function lighten(hex, amount = 40) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (n >> 16) + amount);
  const g = Math.min(255, ((n >> 8) & 0xff) + amount);
  const b = Math.min(255, (n & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}
function darken(hex, amount = 30) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

// ── Build shelf rows ───────────────────────────────────────────────────────────
function buildRows(books, containerWidth) {
  const usable = Math.max(200, containerWidth - PAD_H);
  const rows = [];
  let row = [];
  let rowW = 0;

  for (const book of books) {
    const w = spineWidth(book);
    const needed = row.length === 0 ? w : GAP + w;
    if (row.length > 0 && rowW + needed > usable) {
      rows.push(row);
      row = [book];
      rowW = w;
    } else {
      row.push(book);
      rowW += needed;
    }
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

// ── Status dot colors ──────────────────────────────────────────────────────────
const STATUS_COLORS = {
  want: '#60a5fa', reading: '#fbbf24', read: '#4ade80', dropped: '#a8a29e',
};

// ── SpineBook ─────────────────────────────────────────────────────────────────
function SpineBook({ book, isJumping, onClick }) {
  const color  = spineColor(book);
  const width  = spineWidth(book);
  const height = spineHeight(book);
  const fontSize = width <= 26 ? '0.52rem' : width <= 36 ? '0.58rem' : width <= 44 ? '0.64rem' : '0.7rem';
  const leftEdge  = lighten(color, 55);
  const rightEdge = darken(color, 35);

  return (
    <button
      data-book-id={book.id}
      onClick={() => onClick(book)}
      title={`${book.title}${book.authors?.length ? ' — ' + book.authors[0] : ''}`}
      className={`book-spine${isJumping ? ' spine-jump' : ''}`}
      style={{
        width,
        height,
        flexShrink: 0,
        position: 'relative',
        background: `linear-gradient(
          to right,
          ${leftEdge} 0%,
          ${color} 12%,
          ${color} 82%,
          ${darken(color, 18)} 90%,
          ${rightEdge} 100%
        )`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '2px 2px 0 0',
      }}
    >
      {/* Page-stack right edge */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 5,
        background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, rgba(0,0,0,0.06) 1px, rgba(0,0,0,0.06) 2px)',
        borderLeft: `1px solid ${darken(color, 50)}`,
        pointerEvents: 'none',
      }} />

      {/* Top highlight */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'rgba(255,255,255,0.28)',
        borderRadius: '2px 2px 0 0',
        pointerEvents: 'none',
      }} />

      {/* Title text */}
      <span style={{
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
        transform: 'rotate(180deg)',
        color: 'rgba(255,255,255,0.95)',
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.02em',
        lineHeight: 1.15,
        textShadow: '0 1px 6px rgba(0,0,0,0.6)',
        maxHeight: height - 24,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 1,
        WebkitBoxOrient: 'vertical',
        padding: '0 2px',
        userSelect: 'none',
        flex: 1,
        textAlign: 'center',
      }}>
        {book.title}
      </span>

      {/* Status dot */}
      {book.status && (
        <div style={{
          position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)',
          width: 5, height: 5, borderRadius: '50%',
          backgroundColor: STATUS_COLORS[book.status] ?? '#888',
          boxShadow: '0 0 3px rgba(0,0,0,0.5)',
          flexShrink: 0,
        }} />
      )}
    </button>
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

  const rows = buildRows(books, containerWidth);

  if (books.length === 0) return null;

  return (
    <div ref={containerRef} className="w-full pb-8">
      {rows.map((row, rowIdx) => {
        const rowHeight = Math.max(...row.map(spineHeight));
        return (
          <div key={rowIdx} className="mb-0">
            {/* Books row — aligned to bottom */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: GAP,
                padding: `20px 16px 0`,
                minHeight: rowHeight + 20,
              }}
            >
              {row.map((book) => (
                <SpineBook
                  key={book.id}
                  book={book}
                  isJumping={jumpingId === book.id}
                  onClick={handleClick}
                />
              ))}
            </div>
            {/* Shelf bar */}
            <div style={{ padding: '0 16px' }}>
              <div className="shelf-bar" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
