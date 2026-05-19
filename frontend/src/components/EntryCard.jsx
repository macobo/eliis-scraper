import React, { useState } from 'react';

let _isMobile = null;
function useIsMobile() {
  if (_isMobile === null) _isMobile = window.innerWidth < 768;
  return _isMobile;
}

const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.avi', '.mkv']);

function isVideo(url) {
  return VIDEO_EXTS.has(url?.slice(url.lastIndexOf('.')).toLowerCase());
}

function MediaThumb({ m, onClick }) {
  const video = isVideo(m.local_url);
  return (
    <button
      onClick={onClick}
      className="block aspect-square overflow-hidden rounded-md bg-gray-100 hover:opacity-90 transition-opacity w-full"
    >
      <div className="relative w-full h-full">
        <img src={m.local_thumbnail_url} alt={m.title} loading="lazy" className="w-full h-full object-cover" />
        {video && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 rounded-full w-8 h-8 flex items-center justify-center">
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

export const MIN_COL = 200;
export const GAP = 6;

function MediaGrid({ media, onMediaClick }) {
  const [expanded, setExpanded] = useState(false);
  const isMobile = useIsMobile();
  const previewCount = isMobile ? 2 : 8;
  const overflow = media.length - previewCount;
  const visible = expanded || overflow <= 0 ? media : media.slice(0, previewCount);

  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${MIN_COL}px, 1fr))` }}>
      {visible.map((m, i) => {
        const isLast = !expanded && i === previewCount - 1 && overflow > 0;
        return isLast ? (
          <button
            key={i}
            onClick={() => setExpanded(true)}
            className="relative block aspect-square overflow-hidden rounded-md bg-gray-100 w-full"
          >
            <img src={m.local_thumbnail_url} alt={m.title} loading="lazy" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-lg font-semibold">+{overflow}</span>
            </div>
          </button>
        ) : (
          <MediaThumb key={i} m={m} onClick={() => onMediaClick(i)} />
        );
      })}
    </div>
  );
}

export default function EntryCard({ entry, onMediaClick, onFocus }) {
  const { date, content, kid_status, media } = entry;
  const [year, month, day] = date.split('-');

  return (
    <article
      id={`entry-${date}`}
      onClick={onFocus}
      className="mb-10 scroll-mt-[76px] rounded-lg px-3 py-2 -mx-3 data-[focused]:bg-blue-50/30 data-[focused]:[box-shadow:inset_0_0_0_2px_#bfdbfe]"
    >
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-base font-semibold text-gray-800">
          {day}.{month}.{year}
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
          style={{ backgroundColor: kid_status === 'present' ? '#4ade80' : '#e082b1' }}
        >
          {kid_status === 'present' ? 'Kohal' : 'Puudus'}
        </span>
      </div>

      {content && (
        <div
          className="text-sm text-gray-700 leading-relaxed mb-4 [&_h6]:font-semibold [&_h6]:text-gray-800 [&_h6]:mb-1 [&_h6]:mt-3 first:[&_h6]:mt-0"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}

      {media.length > 0 && <MediaGrid media={media} onMediaClick={onMediaClick} />}

      <div className="mt-8 border-b border-gray-100" />
    </article>
  );
}
