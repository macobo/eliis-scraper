import React, { useState } from 'react';
import DiaryPage from './components/DiaryPage.jsx';
import MapsPage from './components/MapsPage.jsx';

export default function App({ data }) {
  const [tab, setTab] = useState('diary');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex justify-center gap-1 pt-2">
          {[['diary', 'Päevik'], ['maps', 'Kaardid']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'diary' && <DiaryPage entries={data.diary_entries} />}
      {tab === 'maps' && <MapsPage maps={data.maps} />}
    </div>
  );
}
