import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import Card       from '../../components/ui/Card';
import Table      from '../../components/ui/Table';
import Modal      from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

const INIT = { trainee_id: '', weight: '', notes: '', recorded_date: new Date().toISOString().slice(0, 10), measurements: '' };

export default function TrainerProgress() {
  const { profile } = useAuth();

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
      .from('progress')
      .select('*, trainees(profiles(name))')
      .in('trainee_id', traineeIds)
      .order('recorded_date', { ascending: false });
  }, [traineeIds.join(',')]);

  const [modal,  setModal]  = useState(null);
  const [form,   setForm]   = useState(INIT);
  const [target, setTarget] = useState(null);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState('');
  const [filterTid, setFilterTid] = useState('all');

  function openAdd() { setForm(INIT); setError(''); setModal('add'); }

  function openEdit(row) {
    setTarget(row);
    setForm({
      trainee_id:    row.trainee_id,
      weight:        row.weight ?? '',
      notes:         row.notes  ?? '',
      recorded_date: row.recorded_date,
      measurements:  row.measurements ? JSON.stringify(row.measurements) : '',
    });
    setError(''); setModal('edit');
  }

  function parseMeasurements(str) {
    if (!str.trim()) return null;
    try { return JSON.parse(str); } catch { return { raw: str }; }
  }

  async function handleAdd(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: err } = await supabase.from('progress').insert({
      trainee_id:    form.trainee_id,
      weight:        form.weight   ? parseFloat(form.weight)  : null,
      notes:         form.notes    || null,
      recorded_date: form.recorded_date,
      measurements:  parseMeasurements(form.measurements),
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setModal(null); refetch();
  }

  async function handleEdit(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: err } = await supabase.from('progress').update({
      weight:        form.weight   ? parseFloat(form.weight)  : null,
      notes:         form.notes    || null,
      recorded_date: form.recorded_date,
      measurements:  parseMeasurements(form.measurements),
    }).eq('id', target.id);
    setBusy(false);
    if (err) { setError(err.message); return; }
    setModal(null); refetch();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this progress entry?')) return;
    await supabase.from('progress').delete().eq('id', id);
    refetch();
  }

  const filtered = filterTid === 'all'
    ? (data ?? [])
    : (data ?? []).filter(p => p.trainee_id === filterTid);

  const columns = [
    { key: 'trainee',       label: 'Trainee',  render: (_, r) => r.trainees?.profiles?.name ?? '—' },
    { key: 'recorded_date', label: 'Date' },
    { key: 'weight',        label: 'Weight',   render: v => v ? `${v} kg` : '—' },
    { key: 'notes',         label: 'Notes',    render: v => v ? (v.length > 40 ? v.slice(0, 40) + '…' : v) : '—', hideOnMobile: true },
    {
      key: 'actions', label: '',
      hideOnMobile: true,
      render: (_, r) => (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>
          <button className="btn btn-danger btn-sm"    onClick={() => handleDelete(r.id)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Progress</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Entry</button>
      </div>

      {/* Filter by trainee */}
      <div style={{ marginBottom: '1rem' }}>
        <div className="tab-row">
          <button className={`tab-btn${filterTid === 'all' ? ' tab-btn--active' : ''}`} onClick={() => setFilterTid('all')}>All</button>
          {(myTrainees ?? []).map(t => (
            <button key={t.id} className={`tab-btn${filterTid === t.id ? ' tab-btn--active' : ''}`} onClick={() => setFilterTid(t.id)}>
              {t.profiles?.name}
            </button>
          ))}
        </div>
      </div>

      <Card padding={false}>
        {!loading && filtered.length === 0
          ? <EmptyState icon="📈" title="No progress entries" action={<button className="btn btn-primary" onClick={openAdd}>Add Entry</button>} />
          : <Table columns={columns} data={filtered} loading={loading} />
        }
      </Card>

      {/* Add */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Add Progress Entry" size="md">
        <form onSubmit={handleAdd} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Trainee *</label>
              <select required value={form.trainee_id} onChange={e => setForm(f => ({ ...f, trainee_id: e.target.value }))}>
                <option value="">— Select —</option>
                {(myTrainees ?? []).map(t => <option key={t.id} value={t.id}>{t.profiles?.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input required type="date" value={form.recorded_date} onChange={e => setForm(f => ({ ...f, recorded_date: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" step="0.1" min="0" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Measurements (JSON or free text)</label>
              <input placeholder='e.g. {"chest":"100cm","waist":"80cm"}' value={form.measurements} onChange={e => setForm(f => ({ ...f, measurements: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Add Entry'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Progress Entry" size="md">
        <form onSubmit={handleEdit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input required type="date" value={form.recorded_date} onChange={e => setForm(f => ({ ...f, recorded_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" step="0.1" min="0" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Measurements</label>
            <input value={form.measurements} onChange={e => setForm(f => ({ ...f, measurements: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
