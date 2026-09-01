import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Calendar from '../../components/ui/Calendar';
import EmptyState from '../../components/ui/EmptyState';
import { Dumbbell, CalendarX, Star } from 'lucide-react';

export default function TraineeCalendar() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(null);

  const { data: trainee } = useSupabaseQuery(() =>
    supabase.from('trainees').select('id').eq('profile_id', profile.id).single(),
  [profile.id]);

  const traineeId = trainee?.id;

  const { data: workouts, loading: workoutsLoading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: [], error: null });
    return supabase.from('workouts').select('id, name, created_at').eq('trainee_id', traineeId);
  }, [traineeId]);

  const { data: membership, loading: membershipLoading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: null, error: null });
    return supabase.from('memberships').select('id, plan, end_date, status').eq('trainee_id', traineeId).eq('status', 'active').maybeSingle();
  }, [traineeId]);

  const { data: events, loading: eventsLoading } = useSupabaseQuery(() =>
    supabase.from('events').select('*').order('event_date', { ascending: true }),
  []);

  const calendarEvents = useMemo(() => {
    const list = [];
    (events ?? []).forEach(ev => {
      list.push({ id: ev.id, title: ev.title, event_date: ev.event_date, event_time: ev.event_time, description: ev.description, event_type: ev.event_type, type: 'gym_event' });
    });
    (workouts ?? []).forEach(w => {
      const date = w.created_at?.slice(0, 10);
      if (!date) return;
      list.push({ id: w.id, title: `Training: ${w.name}`, event_date: date, event_time: null, description: '', event_type: 'training', type: 'training' });
    });
    if (membership?.end_date) {
      list.push({ id: membership.id, title: `Membership Expiring: ${membership.plan}`, event_date: membership.end_date, event_time: null, description: `Your ${membership.plan} membership ends soon`, event_type: 'expiry', type: 'expiry' });
    }
    return list.sort((a, b) => (a.event_date ?? '').localeCompare(b.event_date ?? ''));
  }, [events, workouts, membership]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return calendarEvents.filter(ev => ev.event_date === selectedDate);
  }, [calendarEvents, selectedDate]);

  const loading = workoutsLoading || membershipLoading || eventsLoading;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>My Calendar</h2>
          <p className="page-header-subtitle">Your training sessions, membership expiry, and gym events</p>
        </div>
      </div>

      <div className="calendar-layout">
        <Card className="calendar-main-card">
          {loading ? (
            <div className="spinner" style={{ margin: '2rem auto' }} />
          ) : (
            <Calendar
              events={calendarEvents}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          )}

          <div className="calendar-legend">
            <div className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--gym_event" /> Gym Event</div>
            <div className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--holiday" /> Holiday</div>
            <div className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--special_session" /> Special Session</div>
            <div className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--maintenance" /> Maintenance</div>
            <div className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--training" /> Training</div>
            <div className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--expiry" /> Membership Expiry</div>
          </div>
        </Card>

        <Card title={selectedDate ? `Events on ${selectedDate}` : 'Upcoming Events'} className="calendar-side-card">
          {selectedDate && (
            <button className="btn btn-secondary btn-sm" style={{ marginBottom: '0.75rem' }} onClick={() => setSelectedDate(null)}>
              Clear selection
            </button>
          )}
          {loading ? (
            <div className="spinner" style={{ margin: '2rem auto' }} />
          ) : selectedEvents.length === 0 ? (
            <EmptyState
              icon="📅"
              title={selectedDate ? 'No events on this date' : 'No upcoming events'}
              message={selectedDate ? 'There are no training sessions, expiries, or events on this date.' : 'Select a date on the calendar to view events.'}
            />
          ) : (
            <div className="calendar-events-list">
              <div className="calendar-events-title">
                {selectedDate ? `Events (${selectedEvents.length})` : 'Upcoming Events'}
              </div>
              {selectedEvents.map(ev => (
                <div key={ev.id} className="calendar-event-item">
                  <span className={`calendar-event-dot calendar-event-dot--${ev.event_type ?? ev.type}`} />
                  <div className="calendar-event-content">
                    <div className="calendar-event-title">{ev.title}</div>
                    <div className="calendar-event-meta">
                      {ev.event_date}
                      {ev.event_time && ` · ${ev.event_time}`}
                      {ev.description && ` · ${ev.description}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
