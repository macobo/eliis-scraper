import React, { useState } from 'react';

function MapRow({ map, even }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        onClick={() => setOpen(o => !o)}
        className={`cursor-pointer hover:brightness-95 ${open ? '' : 'border-b border-gray-200'} ${even ? 'bg-gray-50' : 'bg-white'}`}
      >
        <td className="py-3 px-4 w-full">
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
            <span className={`text-gray-400 text-sm leading-none transition-transform inline-block ${open ? 'rotate-90' : ''}`}>›</span>
            {map.title}
          </div>
        </td>
        <td className="py-3 px-4 text-sm text-gray-500 whitespace-nowrap align-top">{map.date}</td>
      </tr>
      {open && (
        <tr className="border-b border-gray-200">
          <td colSpan={2} className="p-0">
            <div
              className="map-content overflow-x-auto text-sm text-gray-700 bg-gray-100 p-4 min-w-full"
              dangerouslySetInnerHTML={{ __html: map.content }}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export default function MapsPage({ maps }) {
  const sorted = [...maps].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400">Kaarte pole.</p>
      ) : (
        <table className="w-full border border-gray-200 rounded-xl overflow-hidden bg-white">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="py-2 px-4">Pealkiri</th>
              <th className="py-2 px-4">Kuupäev</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((map, i) => (
              <MapRow key={`${map.title}-${map.date}`} map={map} even={i % 2 === 1} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
