import { useEffect, useRef, useCallback } from 'react';

const SCAN_GAP_MS = 80;
const MIN_LENGTH = 10;

export function useScanner(onScan) {
  const buffer = useRef('');
  const lastTime = useRef(0);
  const timer = useRef(null);

  const flush = useCallback(() => {
    const isbn = buffer.current.replace(/[^0-9X]/gi, '');
    if (isbn.length >= MIN_LENGTH) onScan(isbn);
    buffer.current = '';
  }, [onScan]);

  useEffect(() => {
    const onKey = (e) => {
      const active = document.activeElement;
      const tag = active?.tagName?.toLowerCase();
      const isNonScanInput =
        (tag === 'input' || tag === 'textarea') &&
        active?.dataset?.scanner !== 'true';
      if (isNonScanInput) return;

      const now = Date.now();
      const gap = now - lastTime.current;
      lastTime.current = now;

      if (e.key === 'Enter') {
        clearTimeout(timer.current);
        flush();
        return;
      }

      if (gap > SCAN_GAP_MS && buffer.current.length > 0) {
        buffer.current = '';
      }

      if (e.key.length === 1 && /[\dX\-]/i.test(e.key)) {
        buffer.current += e.key;
        clearTimeout(timer.current);
        timer.current = setTimeout(flush, 350);
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(timer.current);
    };
  }, [flush]);
}
