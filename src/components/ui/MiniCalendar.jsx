import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISO(iso) {
  const [y, m, d] = (iso || '').split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

/**
 * MiniCalendar — visual date picker. Parent owns the selected ISO date.
 */
export default function MiniCalendar({ value, onChange }) {
  const selected = parseISO(value);
  const year = selected.getFullYear();
  const month = selected.getMonth();

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < startPad; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(year, month, d));
    return out;
  }, [year, month]);

  const todayIso = toISODate(new Date());
  const selectedIso = value || toISODate(selected);
  const label = selected.toLocaleDateString([], { month: 'long', year: 'numeric' });

  function shiftMonth(delta) {
    const next = new Date(year, month + delta, Math.min(selected.getDate(), 28));
    onChange(toISODate(next));
  }

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-nav">
        <button type="button" className="mini-calendar-nav-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          <ChevronLeft size={16} />
        </button>
        <span className="mini-calendar-label">{label}</span>
        <button type="button" className="mini-calendar-nav-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="mini-calendar-weekdays">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mini-calendar-grid">
        {cells.map((d, i) => {
          if (!d) return <span key={`e-${i}`} className="mini-calendar-cell mini-calendar-cell--empty" />;
          const iso = toISODate(d);
          const isToday = iso === todayIso;
          const isSelected = iso === selectedIso;
          return (
            <button
              key={iso}
              type="button"
              className={[
                'mini-calendar-cell',
                isToday ? 'mini-calendar-cell--today' : '',
                isSelected ? 'mini-calendar-cell--selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onChange(iso)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
