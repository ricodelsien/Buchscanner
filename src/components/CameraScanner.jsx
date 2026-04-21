import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.CODE_128,
]);
hints.set(DecodeHintType.TRY_HARDER, true);

export function CameraScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader(hints);
    readerRef.current = reader;

    reader
      .decodeFromConstraints(
        {
          video: {
            facingMode: 'environment', // Rückkamera auf Mobil
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText().replace(/[^0-9X]/gi, '');
            if (text.length >= 10 && scanning) {
              setScanning(false);
              onScan(text);
              onClose();
            }
          }
          // err ist normal wenn kein Barcode im Frame ist
        }
      )
      .catch((e) => {
        if (e?.name === 'NotAllowedError') {
          setError('Kamerazugriff verweigert. Bitte Berechtigung in den Einstellungen erlauben.');
        } else if (e?.name === 'NotFoundError') {
          setError('Keine Kamera gefunden.');
        } else {
          setError('Kamera konnte nicht gestartet werden.');
        }
      });

    return () => {
      BrowserMultiFormatReader.releaseAllStreams();
    };
  }, [onScan, onClose, scanning]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <p className="text-white text-sm font-medium">Barcode scannen</p>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Kamera */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center gap-4">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
            <p className="text-white text-sm">{error}</p>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-amber-500 rounded-lg text-white text-sm font-medium"
            >
              Schliessen
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Viewfinder */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-72 h-40">
                {/* Dunkle Maske */}
                <div className="absolute inset-0 rounded-lg" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)' }} />
                {/* Ecken */}
                <Corner pos="top-0 left-0" />
                <Corner pos="top-0 right-0" rotate />
                <Corner pos="bottom-0 left-0" flipY />
                <Corner pos="bottom-0 right-0" rotate flipY />
                {/* Scan-Linie */}
                <div className="absolute inset-x-2 top-1/2 h-0.5 bg-amber-400/80 animate-pulse" />
              </div>
            </div>
            <p className="absolute bottom-8 left-0 right-0 text-center text-white/70 text-xs">
              Barcode auf dem Buchrücken in den Rahmen halten
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Corner({ pos, rotate, flipY }) {
  return (
    <div
      className={`absolute ${pos} w-6 h-6`}
      style={{
        transform: `${rotate ? 'scaleX(-1)' : ''} ${flipY ? 'scaleY(-1)' : ''}`,
      }}
    >
      <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-400" />
      <div className="absolute top-0 left-0 h-full w-0.5 bg-amber-400" />
    </div>
  );
}
