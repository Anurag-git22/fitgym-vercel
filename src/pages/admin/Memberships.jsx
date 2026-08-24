import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import Card  from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

const PLANS = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'];
const INIT  = { trainee_id: '', plan: 'Monthly', start_date: '', end_date: '', status: 'active' };

export default function AdminMemberships() {
  const [modal,  setModal]  = useState(null);
  const [form,   setForm]   = useState(INIT);
  const [target, setTarget] = useState(null);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState('');

  const { data, loading, refetch } = useSupabaseQuery(() =>
    supabase
      .from('memberships')
      .select('*, trainees(id, profiles(name))')
      .order('created_at', { ascending: false }),
  []);

  const { data: trainees } = useSupabaseQuery(() =>
    supabase.from('trainees').select('id, profiles(name)'),
  []);

  function openAdd() { setForm(INIT); setError(''); setModal('add'); }

  function openEdit(row) {
    setTarget(row);
    setForm({ trainee_id: row.trainee_id, plan: row.plan, start_date: row.start_date, end_date: row.end_date, status: row.status });
    setError(''); setModal('edit');
  }

  async function handleAdd(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: err } = await supabase.from('memberships').insert({
      trainee_id:  form.trainee_id,
      plan:        form.plan,
      start_date:  form.start_date,
      end_date:    form.end_date,
      status:      form.status,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setModal(null); refetch();
  }

  async function handleEdit(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: err } = await supabase.from('memberships').update({
      plan:       form.plan,
      start_date: form.start_date,
      end_date:   form.end_date,
      status:     form.status,
    }).eq('id', target.id);
    setBusy(false);
    if (err) { setError(err.message); return; }
    setModal(null); refetch();
  }

  const columns = [
    { key: 'trainee', label: 'Trainee',    render: (_, r) => r.trainees?.profiles?.name ?? '—' },
    { key: 'plan',    label: 'Plan',       render: v => v },
    { key: 'start_date', label: 'Start',  render: v => v },
    { key: 'end_date',   label: 'End',    render: v => v },
    { key: 'status',     label: 'Status', render: v => <Badge status={v} /> },
    {
      key: 'actions', label: '',
      render: (_, r) => (
        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Memberships</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ New Membership</button>
      </div>

      <Card padding={false}>
        <Table columns={columns} data={data ?? []} loading={loading} emptyMsg="No memberships yet." />
      </Card>

      {/* Add */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="New Membership" size="md">
        <form onSubmit={handleAdd} className="auth-form">
          <div className="form-group">
            <label>Trainee *</label>
            <select required value={form.trainee_id} onChange={e=>setForm(f=>({...f,trainee_id:e.target.value}))}>
              <option value="">— Select trainee —</option>
              {(trainees ?? []).map(t => <option key={t.id} value={t.id}>{t.profiles?.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Plan *</label>
              <select value={form.plan} onChange={e=>setForm(f=>({...f,plan:e.target.value}))}>
                {PLANS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Start Date *</label><input required type="date" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} /></div>
            <div className="form-group"><label>End Date *</label>  <input required type="date" value={form.end_date}   onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} /></div>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Membership" size="md">
        <form onSubmit={handleEdit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Plan *</label>
              <select value={form.plan} onChange={e=>setForm(f=>({...f,plan:e.target.value}))}>
                {PLANS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Start Date</label><input type="date" value={form.start_date} onChange={e=>setForm(f=>({...f,start_date:e.target.value}))} /></div>
            <div className="form-group"><label>End Date</label>  <input type="date" value={form.end_date}   onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} /></div>
          </div>
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
