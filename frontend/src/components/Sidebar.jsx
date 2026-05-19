import React, { useMemo } from 'react';

const ET_MONTHS = [
  'Jaanuar', 'Veebruar', 'Märts', 'Aprill', 'Mai', 'Juuni',
  'Juuli', 'August', 'September', 'Oktoober', 'November', 'Detsember',
];

export default function Sidebar({ entries, activeDate, onJumpTo }) {
  const activeMonth = activeDate?.slice(0, 7);

  const segments = useMemo(() => {
    const map = new Map();
    for (const e of entries) {
      const [year, month] = e.date.split('-');
      const key = `${year}-${month}`;
      if (!map.has(key)) map.set(key, { year, month, count: 0, firstDate: e.date });
      map.get(key).count++;
    }
    return [...map.values()].sort((a, b) => b.year - a.year || b.month - a.month);
  }, [entries]);

  return (
    <div className="fixed right-4 top-0 h-screen z-20 flex flex-col justify-center py-16 gap-px">
      {segments.map(({ year, month, count, firstDate }) => {
        const key = `${year}-${month}`;
        const isActive = key === activeMonth;
        const label = `${ET_MONTHS[parseInt(month) - 1]} ${year}`;
        return (
          <div key={key} className="relative group flex-1 min-h-[2px] w-[32px] flex items-stretch justify-end">
            {/* Invisible wide hit area */}
            <button
              onClick={() => onJumpTo(firstDate)}
              className="absolute inset-0 -right-4 outline-none cursor-pointer"
              aria-label={label}
            />
            {/* Visual bar — grows left on hover/active */}
            <div className={`rounded-full transition-all duration-100 pointer-events-none ${
              isActive
                ? 'w-3 bg-blue-200'
                : 'w-1.5 bg-gray-200 group-hover:w-3 group-hover:bg-gray-400'
            }`} />
            {/* Tooltip */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 bg-white text-gray-700 text-xs px-2 py-1 rounded-md shadow-md border border-gray-100 whitespace-nowrap pointer-events-none">
              {label} <span className="text-gray-400">({count})</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
