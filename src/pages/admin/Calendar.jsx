import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Calendar from '../../components/ui/Calendar';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { Plus, Edit2, Trash2, Dumbbell, CalendarX, Star } from 'lucide-react';

const EVENT_TYPES = [
  { value: 'gym_event', label: 'Gym Event', color: 'cyan', icon: Star },
  { value: 'holiday', label: 'Holiday', color: 'rose', icon: CalendarX },
  { value: 'special_session', label: 'Special Session', color: 'purple', icon: Dumbbell },
  { value: 'maintenance', label: 'Maintenance', color: 'amber', icon: CalendarX },
];

const TRAINING_COLOR = 'emerald';
const EXPIRY_COLOR = 'rose';

const INIT_FORM = { title: '', event_date: '', event_time: '', description: '', event_type: 'gym_event' };

export default function AdminCalendar() {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(INIT_FORM);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('calendar');

  const { data: events, loading: eventsLoading, refetch: refetchEvents } = useSupabaseQuery(() =>
    supabase.from('events').select('*').order('event_date', { ascending: true }),
  []);

  const { data: workouts, loading: workoutsLoading } = useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('workouts')
      .select('id, name, created_at, trainee_id, trainees(id, profiles(name))');
    if (error) throw error;
    return { data, error: null };
  }, []);

  const { data: memberships, loading: membershipsLoading } = useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('memberships')
      .select('id, plan, end_date, status, trainee_id, trainees(id, profiles(name))')
      .eq('status', 'active');
    if (error) throw error;
    return { data, error: null };
  }, []);

  const calendarEvents = useMemo(() => {
    const list = [];
    (events ?? []).forEach(ev => {
      list.push({
        id: ev.id,
        title: ev.title,
        event_date: ev.event_date,
        event_time: ev.event_time,
        description: ev.description,
        event_type: ev.event_type,
        type: 'gym_event',
      });
    });
    (workouts ?? []).forEach(w => {
      const date = w.created_at?.slice(0, 10);
      if (!date) return;
      list.push({
        id: w.id,
        title: `Training: ${w.name}`,
        event_date: date,
        event_time: null,
        description: `Trainee: ${w.trainees?.profiles?.name ?? 'Unknown'}`,
        event_type: 'training',
        type: 'training',
      });
    });
    (memberships ?? []).forEach(m => {
      if (!m.end_date) return;
      list.push({
        id: m.id,
        title: `Membership Expiring: ${m.plan}`,
        event_date: m.end_date,
        event_time: null,
        description: `Trainee: ${m.trainees?.profiles?.name ?? 'Unknown'}`,
        event_type: 'expiry',
        type: 'expiry',
      });
    });
    return list.sort((a, b) => (a.event_date ?? '').localeCompare(b.event_date ?? ''));
  }, [events, workouts, memberships]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return calendarEvents.filter(ev => ev.event_date === selectedDate);
  }, [calendarEvents, selectedDate]);

  function openAdd() {
    setTarget(null);
    setForm({ ...INIT_FORM, event_date: selectedDate || new Date().toISOString().slice(0, 10) });
    setError('');
    setModal('add');
  }

  function openEdit(ev) {
    setTarget(ev);
    setForm({
      title: ev.title,
      event_date: ev.event_date,
      event_time: ev.event_time || '',
      description: ev.description || '',
      event_type: ev.event_type || 'gym_event',
    });
    setError('');
    setModal('edit');
  }

  function openDelete(ev) {
    setTarget(ev);
    setError('');
    setModal('delete');
  }

  async function handleAdd(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: err } = await supabase.from('events').insert({
      title: form.title,
      event_date: form.event_date,
      event_time: form.event_time || null,
      description: form.description || null,
      event_type: form.event_type,
      created_by: profile.id,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setModal(null);
    refetchEvents();
  }

  async function handleEdit(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: err } = await supabase.from('events').update({
      title: form.title,
      event_date: form.event_date,
      event_time: form.event_time || null,
      description: form.description || null,
      event_type: form.event_type,
    }).eq('id', target.id);
    setBusy(false);
    if (err) { setError(err.message); return; }
    setModal(null);
    refetchEvents();
  }

  async function handleDelete() {
    setBusy(true);
    const { error: err } = await supabase.from('events').delete().eq('id', target.id);
    setBusy(false);
    if (!err) setModal(null);
    refetchEvents();
  }

  const loading = eventsLoading || workoutsLoading || membershipsLoading;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Gym Calendar</h2>
          <p className="page-header-subtitle">Training sessions, membership expiries, and gym events</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} />
          <span>Add Event</span>
        </button>
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
                  {ev.type === 'gym_event' && (
                    <div className="calendar-event-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(ev)}><Edit2 size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => openDelete(ev)}><Trash2 size={13} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Add Event Modal */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Add Gym Event" size="md">
        <form onSubmit={handleAdd} className="auth-form">
          <div className="form-group">
            <label>Event Title *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Zumba Night" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input type="date" required value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" value={form.event_time} onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Event Type *</label>
            <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}>
              {EVENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional details..." rows={3} style={{ resize: 'vertical' }} />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Add Event'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Event Modal */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Gym Event" size="md">
        <form onSubmit={handleEdit} className="auth-form">
          <div className="form-group">
            <label>Event Title *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input type="date" required value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" value={form.event_time} onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Event Type *</label>
            <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}>
              {EVENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Delete Event" size="sm">
        <p style={{ marginTop: 0, color: 'var(--text-secondary)' }}>
          Are you sure you want to delete <strong>"{target?.title}"</strong>? This action cannot be undone.
        </p>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete Event'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
