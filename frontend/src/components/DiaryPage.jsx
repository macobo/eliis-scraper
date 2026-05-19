import React, { useState, useEffect, useRef } from 'react';
import ActivityBar from './ActivityBar.jsx';
import Sidebar from './Sidebar.jsx';
import EntryCard from './EntryCard.jsx';
import MediaModal from './MediaModal.jsx';

export default function DiaryPage({ entries }) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [modalState, setModalState] = useState(null); // { entryIndex, mediaIndex }
  const focusedIndexRef = useRef(0);
  const modalStateRef = useRef(null);
  const isProgrammaticScroll = useRef(false);

  const activeDate = entries[focusedIndex]?.date ?? null;

  useEffect(() => { modalStateRef.current = modalState; }, [modalState]);

  // Apply focus ring directly to DOM — no React re-render for the entry cards
  const applyFocus = (idx) => {
    document.querySelector('[data-focused]')?.removeAttribute('data-focused');
    const entry = entries[idx];
    if (entry) document.getElementById(`entry-${entry.date}`)?.setAttribute('data-focused', '');
    focusedIndexRef.current = idx;
    setFocusedIndex(idx);
  };

  const programmaticScrollTo = (idx) => {
    const entry = entries[idx];
    if (!entry) return;
    isProgrammaticScroll.current = true;
    document.getElementById(`entry-${entry.date}`)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    requestAnimationFrame(() => { isProgrammaticScroll.current = false; });
  };

  // Update focus on manual scroll — first entry with title visible in viewport
  useEffect(() => {
    if (entries.length === 0) return;
    let rafId = null;
    const onScroll = () => {
      if (isProgrammaticScroll.current) return;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const idx = entries.findIndex(e => {
          const el = document.getElementById(`entry-${e.date}`);
          if (!el) return false;
          const { top } = el.getBoundingClientRect();
          return top >= 64 && top < window.innerHeight;
        });
        if (idx !== -1) applyFocus(idx);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [entries]);

  // Keyboard navigation — registered once
  useEffect(() => {
    if (entries.length === 0) return;
    applyFocus(0);

    const onKey = (e) => {
      if (modalStateRef.current) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(entries.length - 1, focusedIndexRef.current + 1);
        applyFocus(next);
        programmaticScrollTo(next);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(0, focusedIndexRef.current - 1);
        applyFocus(prev);
        programmaticScrollTo(prev);
      } else if (e.key === 'Enter') {
        const entry = entries[focusedIndexRef.current];
        if (entry?.media.length > 0) setModalState({ entryIndex: focusedIndexRef.current, mediaIndex: 0 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [entries]);

  const jumpTo = (date) => {
    const idx = entries.findIndex(e => e.date === date);
    if (idx !== -1) {
      applyFocus(idx);
      isProgrammaticScroll.current = true;
      document.getElementById(`entry-${date}`)?.scrollIntoView({ behavior: 'instant', block: 'start' });
      requestAnimationFrame(() => { isProgrammaticScroll.current = false; });
    }
  };

  const modalEntry = modalState ? entries[modalState.entryIndex] : null;

  return (
    <div className="max-w-full px-6 py-6">
      <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4">
        <ActivityBar entries={entries} onDateClick={jumpTo} />
      </div>
      <Sidebar entries={entries} activeDate={activeDate} onJumpTo={jumpTo} />
      <div className="pr-16">
        {entries.length === 0 ? (
          <p className="text-gray-400 text-sm">Kandeid pole.</p>
        ) : (
          entries.map((entry, i) => (
            <EntryCard
              key={entry.date}
              entry={entry}

              onMediaClick={(mediaIndex) => setModalState({ entryIndex: i, mediaIndex })}
              onFocus={() => applyFocus(i)}
            />
          ))
        )}
      </div>

      {modalEntry && (
        <MediaModal
          media={modalEntry.media}
          index={modalState.mediaIndex}
          date={modalEntry.date}
          onClose={() => setModalState(null)}
          onNavigate={(mediaIndex) => setModalState(s => ({ ...s, mediaIndex }))}
        />
      )}
    </div>
  );
}
