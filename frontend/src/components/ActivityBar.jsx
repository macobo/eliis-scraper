import React, { useMemo } from 'react';

const ET_DAYS = ['E', 'T', 'K', 'N', 'R']; // Mon–Fri

export default function ActivityBar({ entries, onDateClick }) {
  const monthGroups = useMemo(() => {
    if (entries.length === 0) return [];

    const dateMap = new Map(entries.map(e => [e.date, e]));
    const dates = [...dateMap.keys()].sort();

    const start = new Date(dates[0]);
    const end = new Date(dates[dates.length - 1]);

    // Align to Monday of the first week
    const cur = new Date(start);
    const dow = start.getDay();
    cur.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));

    // Build weeks (Mon–Fri only)
    const weeks = [];
    while (cur <= end) {
      const week = [];
      for (let d = 0; d < 5; d++) {
        const day = new Date(cur);
        day.setDate(cur.getDate() + d);
        const dateStr = day.toISOString().slice(0, 10);
        week.push({ date: dateStr, entry: dateMap.get(dateStr) ?? null });
      }
      weeks.push(week);
      cur.setDate(cur.getDate() + 7);
    }

    weeks.reverse();

    // Group weeks by month (YYYY-MM of the Monday)
    const groups = [];
    for (const week of weeks) {
      const month = week[0].date.slice(0, 7);
      if (!groups.length || groups[groups.length - 1].month !== month) {
        const d = new Date(week[0].date);
        const label = d.toLocaleDateString('et-EE', { month: 'short', year: '2-digit' });
        groups.push({ month, label, weeks: [] });
      }
      groups[groups.length - 1].weeks.push(week);
    }

    return groups;
  }, [entries]);

  const cellStyle = (day) => {
    if (!day.entry) return {};
    if (day.entry.kid_status === 'present') return {};
    return { backgroundColor: '#e082b1' };
  };

  const cellColor = (day) => {
    if (!day.entry) return 'bg-gray-100';
    if (day.entry.kid_status === 'present') return 'bg-green-400';
    return '';
  };

  if (monthGroups.length === 0) return null;

  return (
    <div className="overflow-x-auto pb-3">
      <div className="flex gap-3 min-w-max">
        {monthGroups.map(({ month, label, weeks }) => (
          <div key={month} className="flex flex-col gap-[3px]">
            <div className="h-4 text-[9px] text-gray-400 whitespace-nowrap">{label}</div>
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => (
                    <div
                      key={di}
                      title={`${ET_DAYS[di]} ${day.date} (${day.entry ? (day.entry.kid_status === 'present' ? 'kohal' : 'puudus') : 'pole infot'})`}
                      onClick={() => day.entry && onDateClick(day.date)}
                      className={`w-3 h-3 rounded-sm ${cellColor(day)} ${day.entry ? 'cursor-pointer hover:opacity-70' : ''}`}
                      style={cellStyle(day)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
