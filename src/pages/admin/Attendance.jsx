import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import Card  from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Search } from 'lucide-react';
import { Pagination } from './Payments';

function today() { return new Date().toISOString().slice(0, 10); }

const PAGE_SIZE = 10;

export default function AdminAttendance() {
  const [dateFilter, setDateFilter] = useState(today());
  const [modal,  setModal]  = useState(null);
  const [form,   setForm]   = useState({ trainee_id: '', date: today(), status: 'present', check_in_time: '' });
  const [target, setTarget] = useState(null);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState('');
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(1);

  const { data, loading, refetch } = useSupabaseQuery(() =>
    supabase
      .from('attendance')
      .select('*, trainees(id, profiles(name))')
      .eq('date', dateFilter)
      .order('created_at', { ascending: false }),
  [dateFilter]);

  const { data: trainees } = useSupabaseQuery(() =>
    supabase.from('trainees').select('id, profiles(name)'), []);

  function openAdd() {
    const now = new Date().toTimeString().slice(0, 5); // HH:MM
    setForm({ trainee_id: '', date: dateFilter, status: 'present', check_in_time: now });
    setError(''); setModal('add');
  }

  function openEdit(row) {
    setTarget(row);
    // Extract only the time part (HH:MM) from the stored timestamptz
    const timeOnly = row.check_in_time
      ? new Date(row.check_in_time).toTimeString().slice(0, 5)
      : '';
    setForm({ trainee_id: row.trainee_id, date: row.date, status: row.status, check_in_time: timeOnly });
    setError(''); setModal('edit');
  }

  // Combine date + time into a full ISO timestamp for Supabase
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

  const columns = [
    { key: 'trainee', label: 'Trainee',        render: (_, r) => r.trainees?.profiles?.name ?? '—' },
    { key: 'date',    label: 'Date',            render: v => v },
    { key: 'status',  label: 'Status',          render: v => <Badge status={v} /> },
    { key: 'check_in_time', label: 'Check-in', render: v => v ? new Date(v).toLocaleTimeString() : '—' },
    {
      key: 'actions', label: '',
      render: (_, r) => <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>,
    },
  ];

  const present = (data ?? []).filter(r => r.status === 'present').length;
  const absent  = (data ?? []).filter(r => r.status === 'absent').length;

  /* Search + pagination */
  const filtered = useMemo(() => {
    if (!search.trim()) return data ?? [];
    const q = search.toLowerCase();
    return (data ?? []).filter(r =>
      r.trainees?.profiles?.name?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="page-header">
        <h2>Attendance</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Mark Attendance</button>
      </div>

      {/* Date filter + search + summary */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem', display: 'block' }}>Filter by date</label>
            <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }}
              style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1.5px solid #d1d5db', fontSize: '0.9rem' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', paddingBottom: '2px' }}>
            <span className="badge badge--green">Present: {present}</span>
            <span className="badge badge--red">Absent: {absent}</span>
          </div>
        </div>
        <div className="table-search-wrap">
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by trainee name…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="table-search-input"
          />
        </div>
      </div>

      <Card padding={false}>
        <Table columns={columns} data={paginated} loading={loading} emptyMsg="No attendance records for this date." />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
      </Card>

      {/* Add */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Mark Attendance" size="sm">
        <form onSubmit={handleAdd} className="auth-form">
          <div className="form-group">
            <label>Trainee *</label>
            <select required value={form.trainee_id} onChange={e=>setForm(f=>({...f,trainee_id:e.target.value}))}>
              <option value="">— Select —</option>
              {(trainees ?? []).map(t => <option key={t.id} value={t.id}>{t.profiles?.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Date *</label><input required type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Check-in Time</label><input type="time" value={form.check_in_time} onChange={e=>setForm(f=>({...f,check_in_time:e.target.value}))} /></div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Mark'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Attendance" size="sm">
        <form onSubmit={handleEdit} className="auth-form">
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div className="form-group"><label>Check-in Time</label><input type="time" value={form.check_in_time} onChange={e=>setForm(f=>({...f,check_in_time:e.target.value}))} /></div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
