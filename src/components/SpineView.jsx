import { useState, useRef, useCallback, useEffect } from 'react';

/** Deterministic color from a book's ID/title */
function spineColor(book) {
  let h = 0;
  const s = book.id || book.isbn || book.title || '';
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  const hue = Math.abs(h) % 360;
  const sat = 32 + (Math.abs(h >> 4) % 28);   // 32–60%
  const lit = 27 + (Math.abs(h >> 8) % 18);   // 27–45%
  return `hsl(${hue},${sat}%,${lit}%)`;
}

/** Width variant based on book hash: 34 / 44 / 56px */
function spineWidth(book) {
  let h = 0;
  const s = book.id || book.title || '';
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return [34, 44, 56][Math.abs(h >> 2) % 3];
}

const SPINE_HEIGHT = 188; // px — height of each book spine
const SHELF_H = 22;       // px — height of the shelf bar

/** Groups books into rows by cumulative width */
function groupIntoRows(books, containerWidth, gap = 2) {
  const rows = [];
  let currentRow = [];
  let currentWidth = 0;
  const paddingH = 32; // spine-shelf-container padding (16px each side)
  const usable = Math.max(200, containerWidth - paddingH);

  for (const book of books) {
    const w = spineWidth(book);
    if (currentRow.length > 0 && currentWidth + gap + w > usable) {
      rows.push(currentRow);
      currentRow = [book];
      currentWidth = w;
    } else {
      currentRow.push(book);
      currentWidth += (currentRow.length > 1 ? gap : 0) + w;
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);
  return rows;
}

export function SpineView({ books, onSelect }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [jumpingId, setJumpingId] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(el);
    setContainerWidth(el.offsetWidth);
    return () => observer.disconnect();
  }, []);

  const handleClick = useCallback((book) => {
    setJumpingId(book.id);
    setTimeout(() => {
      setJumpingId(null);
      onSelect(book);
    }, 260);
  }, [onSelect]);

  const rows = groupIntoRows(books, containerWidth);

  if (books.length === 0) return null;

  return (
    <div ref={containerRef} className="w-full pb-4">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx}>
          {/* Books in this row */}
          <div className="spine-shelf-container" style={{ flexWrap: 'nowrap', gap: 2 }}>
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
          <div className="shelf-bar" />
        </div>
      ))}
    </div>
  );
}

function SpineBook({ book, isJumping, onClick }) {
  const color = spineColor(book);
  const width = spineWidth(book);

  return (
    <button
      data-book-id={book.id}
      onClick={() => onClick(book)}
      title={`${book.title}${book.authors?.length ? ' — ' + book.authors[0] : ''}`}
      className={`book-spine${isJumping ? ' spine-jump' : ''}`}
      style={{
        width,
        height: SPINE_HEIGHT,
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Spine text — rotated bottom-to-top */}
      <span
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)',
          color: 'rgba(255,255,255,0.92)',
          fontSize: width <= 36 ? '0.6rem' : width <= 44 ? '0.65rem' : '0.7rem',
          fontWeight: 600,
          letterSpacing: '0.04em',
          lineHeight: 1.25,
          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
          maxHeight: SPINE_HEIGHT - 16,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          padding: '0 4px',
          userSelect: 'none',
        }}
      >
        {book.title}
      </span>

      {/* Status dot */}
      {book.status && (
        <StatusDot status={book.status} />
      )}
    </button>
  );
}

const STATUS_COLORS = { want: '#60a5fa', reading: '#fbbf24', read: '#4ade80', dropped: '#a8a29e' };

function StatusDot({ status }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 6,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: STATUS_COLORS[status] ?? '#888',
        boxShadow: '0 0 4px rgba(0,0,0,0.4)',
      }}
    />
  );
}
