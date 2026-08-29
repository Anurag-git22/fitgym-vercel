import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import Card  from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

function today() { return new Date().toISOString().slice(0, 10); }

export default function TrainerAttendance() {
  const { profile } = useAuth();
  const [dateFilter, setDateFilter] = useState(today());
  const [modal,  setModal]  = useState(null);
  const [form,   setForm]   = useState({ trainee_id: '', date: today(), status: 'present', check_in_time: '' });
  const [target, setTarget] = useState(null);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState('');

  const { data: trainer } = useSupabaseQuery(() =>
    supabase.from('trainers').select('id').eq('profile_id', profile.id).single(),
  [profile.id]);

  const trainerId = trainer?.id;

  const { data: myTrainees } = useSupabaseQuery(() => {
    if (!trainerId) return Promise.resolve({ data: [], error: null });
    return supabase.from('trainees').select('id, profiles(name)').eq('trainer_id', trainerId);
  }, [trainerId]);

  const traineeIds = (myTrainees ?? []).map(t => t.id);

  const { data, loading, refetch } = useSupabaseQuery(() => {
    if (!traineeIds.length) return Promise.resolve({ data: [], error: null });
    return supabase
      .from('attendance')
      .select('*, trainees(profiles(name))')
      .in('trainee_id', traineeIds)
      .eq('date', dateFilter)
      .order('created_at', { ascending: false });
  }, [traineeIds.join(','), dateFilter]);

  function openAdd() {
    const now = new Date().toTimeString().slice(0, 5);
    setForm({ trainee_id: '', date: dateFilter, status: 'present', check_in_time: now });
    setError(''); setModal('add');
  }

  function openEdit(row) {
    setTarget(row);
    const timeOnly = row.check_in_time
      ? new Date(row.check_in_time).toTimeString().slice(0, 5)
      : '';
    setForm({ trainee_id: row.trainee_id, date: row.date, status: row.status, check_in_time: timeOnly });
    setError(''); setModal('edit');
  }

  function buildTimestamp(date, time) {
    if (!time) return null;
    return `${date}T${time}:00`;
  }

  async function handleAdd(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: err } = await supabase.from('attendance').upsert({
      trainee_id:    form.trainee_id,
      date:          form.date,
      status:        form.status,
      check_in_time: buildTimestamp(form.date, form.check_in_time),
    }, { onConflict: 'trainee_id,date' });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setModal(null); refetch();
  }

  async function handleEdit(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: err } = await supabase.from('attendance').update({
      status:        form.status,
      check_in_time: buildTimestamp(target.date, form.check_in_time),
    }).eq('id', target.id);
    setBusy(false);
    if (err) { setError(err.message); return; }
    setModal(null); refetch();
  }

  /* Quick mark-all-present */
  async function markAllPresent() {
    if (!traineeIds.length) return;
    const rows = traineeIds.map(id => ({
      trainee_id: id,
      date:       dateFilter,
      status:     'present',
    }));
    await supabase.from('attendance').upsert(rows, { onConflict: 'trainee_id,date' });
    refetch();
  }

  const present = (data ?? []).filter(r => r.status === 'present').length;
  const absent  = (data ?? []).filter(r => r.status === 'absent').length;

  const columns = [
    { key: 'trainee',        label: 'Trainee',   render: (_, r) => r.trainees?.profiles?.name ?? '—' },
    { key: 'status',         label: 'Status',    render: v => <Badge status={v} /> },
    { key: 'check_in_time',  label: 'Check-in',  render: v => v ? new Date(v).toLocaleTimeString() : '—', hideOnMobile: true },
    {
      key: 'actions', label: '',
      hideOnMobile: true,
      render: (_, r) => <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Attendance</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={markAllPresent}>✓ Mark All Present</button>
          <button className="btn btn-primary"   onClick={openAdd}>+ Mark Attendance</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Date</label>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: '0.9rem' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge badge--green">Present: {present}</span>
          <span className="badge badge--red">Absent: {absent}</span>
          <span className="badge badge--gray">Total trainees: {traineeIds.length}</span>
        </div>
      </div>

      <Card padding={false}>
        <Table columns={columns} data={data ?? []} loading={loading} emptyMsg="No attendance records for this date." />
      </Card>

      {/* Add */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Mark Attendance" size="sm">
        <form onSubmit={handleAdd} className="auth-form">
          <div className="form-group">
            <label>Trainee *</label>
            <select required value={form.trainee_id} onChange={e => setForm(f => ({ ...f, trainee_id: e.target.value }))}>
              <option value="">— Select —</option>
              {(myTrainees ?? []).map(t => <option key={t.id} value={t.id}>{t.profiles?.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Check-in Time</label>
            <input type="time" value={form.check_in_time} onChange={e => setForm(f => ({ ...f, check_in_time: e.target.value }))} />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Mark'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Attendance" size="sm">
        <form onSubmit={handleEdit} className="auth-form">
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div className="form-group">
            <label>Check-in Time</label>
            <input type="time" value={form.check_in_time} onChange={e => setForm(f => ({ ...f, check_in_time: e.target.value }))} />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
