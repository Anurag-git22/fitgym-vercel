import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function Calendar({ events = [], selectedDate, onSelectDate, highlightedDates = [] }) {
  const [viewMonth, setViewMonth] = useState(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const daysInMonth = useMemo(() => {
    const date = new Date(viewMonth.year, viewMonth.month + 1, 0);
    return date.getDate();
  }, [viewMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(viewMonth.year, viewMonth.month, 1).getDay();
  }, [viewMonth]);

  const eventDates = useMemo(() => {
    const map = new Map();
    (events ?? []).forEach(ev => {
      const key = ev.event_date ?? ev.date;
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    });
    return map;
  }, [events]);

  function prevMonth() {
    setViewMonth(prev => {
      let m = prev.month - 1;
      let y = prev.year;
      if (m < 0) { m = 11; y--; }
      return { year: y, month: m };
    });
  }

  function nextMonth() {
    setViewMonth(prev => {
      let m = prev.month + 1;
      let y = prev.year;
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
  }

  function goToToday() {
    const now = new Date();
    setViewMonth({ year: now.getFullYear(), month: now.getMonth() });
  }

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="calendar-cell calendar-cell--empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = eventDates.get(dateStr) ?? [];
    const isSelected = selectedDate === dateStr;
    const isToday = dateStr === new Date().toISOString().slice(0, 10);
    const isHighlighted = highlightedDates.includes(dateStr);

    cells.push(
      <button
        key={d}
        type="button"
        className={[
          'calendar-cell',
          isSelected ? 'calendar-cell--selected' : '',
          isToday ? 'calendar-cell--today' : '',
          isHighlighted ? 'calendar-cell--highlighted' : '',
          dayEvents.length > 0 ? 'calendar-cell--has-events' : '',
        ].filter(Boolean).join(' ') || undefined}
        onClick={() => onSelectDate?.(dateStr)}
      >
        <span className="calendar-cell-day">{d}</span>
        {dayEvents.length > 0 && (
          <span className="calendar-cell-dots">
            {dayEvents.slice(0, 3).map((ev, idx) => (
              <span key={idx} className={`calendar-dot calendar-dot--${ev.event_type ?? ev.type ?? 'gym_event'}`} />
            ))}
            {dayEvents.length > 3 && <span className="calendar-cell-more">+{dayEvents.length - 3}</span>}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button type="button" className="calendar-nav-btn" onClick={prevMonth} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <div className="calendar-title-wrap">
          <h3 className="calendar-title">
            {MONTHS[viewMonth.month]} {viewMonth.year}
          </h3>
          <button type="button" className="calendar-today-btn" onClick={goToToday}>Today</button>
        </div>
        <button type="button" className="calendar-nav-btn" onClick={nextMonth} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="calendar-weekdays">
        {DAYS.map(d => (
          <div key={d} className="calendar-weekday">{d}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells}
      </div>
    </div>
  );
}
