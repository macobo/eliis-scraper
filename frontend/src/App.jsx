import React, { useState } from 'react';
import DiaryPage from './components/DiaryPage.jsx';
import MapsPage from './components/MapsPage.jsx';

const SHORTCUTS = [
  { heading: 'Päevik' },
  ['↑ / ↓', 'Liigu kannete vahel'],
  ['Enter', 'Ava valitud kande gallerii'],
  ['r', 'Hüppa juhuslikule kandele'],
  ['g', 'Ava juhuslik pilt'],
  { heading: 'Galerii' },
  ['← / →', 'Eelmine / järgmine pilt'],
  ['Esc', 'Sulge galerii'],
];

function ShortcutsPopover({ active }) {
  const [hover, setHover] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span className={`text-xs ml-1 ${active ? 'text-blue-400' : 'text-gray-400'}`}>ⓘ</span>
      {hover && (
        <div className="absolute left-1/2 -translate-x-1/2 top-7 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-72 text-left">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Kiirklahvid</p>
          <table className="w-full text-sm">
            <tbody>
              {SHORTCUTS.map((item, i) =>
                item.heading ? (
                  <tr key={i}>
                    <td colSpan={2} className="pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">{item.heading}</td>
                  </tr>
                ) : (
                  <tr key={item[0]}>
                    <td className="pr-3 py-0.5 font-mono text-gray-800 whitespace-nowrap">{item[0]}</td>
                    <td className="py-0.5 text-gray-500">{item[1]}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function App({ data }) {
  const [tab, setTab] = useState('diary');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex justify-center gap-1 pt-2">
          {[['diary', 'Päevik'], ['maps', 'Kaardid']].map(([id, label]) => (
            <div key={id} className="flex items-center">
              <button
                onClick={() => setTab(id)}
                className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                  tab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                {id === 'diary' && <ShortcutsPopover active={tab === 'diary'} />}
              </button>
            </div>
          ))}
        </div>
      </header>

      {tab === 'diary' && <DiaryPage entries={data.diary_entries} />}
      {tab === 'maps' && <MapsPage maps={data.maps} />}
    </div>
  );
}
