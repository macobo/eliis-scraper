import React, { useEffect, useCallback } from 'react';

const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.avi', '.mkv']);
function isVideo(url) {
  return VIDEO_EXTS.has(url?.slice(url.lastIndexOf('.')).toLowerCase());
}

function ChevronLeft() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );
}

export default function MediaModal({ media, index, date, onClose, onNavigate }) {
  const item = media[index];
  const total = media.length;
  const [year, month, day] = date.split('-');

  const prev = useCallback(() => { if (index > 0) onNavigate(index - 1); }, [index, onNavigate]);
  const next = useCallback(() => { if (index < total - 1) onNavigate(index + 1); }, [index, total, onNavigate]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-3 text-sm text-gray-300 shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <span className="font-medium text-white">{day}.{month}.{year}</span>
        <span className="text-gray-400">
          {index + 1} / {total}
          {item.title && <span className="ml-3 text-gray-500">{item.title}</span>}
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-lg leading-none">
          ✕
        </button>
      </div>

      {/* Media + nav */}
      <div
        className="flex-1 flex items-center justify-center relative min-h-0 px-16"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={prev}
          disabled={index === 0}
          className="absolute left-4 text-white disabled:opacity-20 hover:text-gray-300 transition-colors"
        >
          <ChevronLeft />
        </button>

        {isVideo(item.local_url) ? (
          <video
            key={item.local_url}
            src={item.local_url}
            controls
            loop
            className="max-h-full max-w-full rounded"
          />
        ) : (
          <img
            key={item.local_url}
            src={item.local_url}
            alt={item.title}
            className="max-h-full max-w-full object-contain rounded"
          />
        )}

        <button
          onClick={next}
          disabled={index === total - 1}
          className="absolute right-4 text-white disabled:opacity-20 hover:text-gray-300 transition-colors"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Bottom padding */}
      <div className="h-6 shrink-0" />
    </div>
  );
}
