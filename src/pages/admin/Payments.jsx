import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import Card  from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

function currency(n) { return `₹${Number(n ?? 0).toFixed(2)}`; }

const INIT = { trainee_id: '', membership_id: '', amount: '', payment_date: new Date().toISOString().slice(0,10), payment_status: 'pending' };

export default function AdminPayments() {
  const [modal,  setModal]  = useState(null);
  const [form,   setForm]   = useState(INIT);
  const [target, setTarget] = useState(null);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState('');
  const [filter, setFilter] = useState('all');

  const { data, loading, refetch } = useSupabaseQuery(() =>
    supabase
      .from('payments')
      .select('*, trainees(id, profiles(name, email)), memberships(plan)')
      .order('payment_date', { ascending: false }),
  []);

  const { data: trainees } = useSupabaseQuery(() =>
    supabase.from('trainees').select('id, profiles(name)'), []);

  const { data: memberships } = useSupabaseQuery(() =>
    supabase.from('memberships').select('id, plan, trainees(profiles(name))'), []);

  function openAdd() { setForm(INIT); setError(''); setModal('add'); }

  function openEdit(row) {
    setTarget(row);
    setForm({ trainee_id: row.trainee_id, membership_id: row.membership_id ?? '', amount: row.amount, payment_date: row.payment_date, payment_status: row.payment_status });
    setError(''); setModal('edit');
  }

  async function handleAdd(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: err } = await supabase.from('payments').insert({
      trainee_id:     form.trainee_id,
      membership_id:  form.membership_id || null,
      amount:         parseFloat(form.amount),
      payment_date:   form.payment_date,
      payment_status: form.payment_status,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setModal(null); refetch();
  }

  async function handleEdit(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: err } = await supabase.from('payments').update({
      amount:         parseFloat(form.amount),
      payment_date:   form.payment_date,
      payment_status: form.payment_status,
      membership_id:  form.membership_id || null,
    }).eq('id', target.id);
    setBusy(false);
    if (err) { setError(err.message); return; }
    setModal(null); refetch();
  }

  const filtered = (data ?? []).filter(p =>
    filter === 'all' ? true : p.payment_status === filter
  );

  const columns = [
    {
      key: 'trainee', label: 'Trainee / Member',
      render: (_, r) => {
        const name  = r.trainees?.profiles?.name;
        const email = r.trainees?.profiles?.email;
        return (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {name ?? email ?? '—'}
            </div>
            {name && email && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{email}</div>
            )}
          </div>
        );
      }
    },
    { key: 'memberships', label: 'Plan',   render: (_, r) => r.memberships?.plan ?? '—' },
    { key: 'amount',      label: 'Amount', render: v => currency(v) },
    { key: 'payment_date',   label: 'Payment Date', render: v => v },
    { key: 'payment_status', label: 'Status',       render: v => <Badge status={v} /> },
    {
      key: 'actions', label: '',
      render: (_, r) => <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Payments</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Record Payment</button>
      </div>

      {/* Filter tabs */}
      <div className="tab-row" style={{ marginBottom: '1rem' }}>
        {['all','paid','pending','failed'].map(f => (
          <button
            key={f}
            className={`tab-btn${filter === f ? ' tab-btn--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <Card padding={false}>
        <Table columns={columns} data={filtered} loading={loading} emptyMsg="No payments." />
      </Card>

      {/* Add */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Record Payment" size="md">
        <form onSubmit={handleAdd} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Trainee *</label>
              <select required value={form.trainee_id} onChange={e=>setForm(f=>({...f,trainee_id:e.target.value}))}>
                <option value="">— Select —</option>
                {(trainees ?? []).map(t => <option key={t.id} value={t.id}>{t.profiles?.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Membership</label>
              <select value={form.membership_id} onChange={e=>setForm(f=>({...f,membership_id:e.target.value}))}>
                <option value="">— None —</option>
                {(memberships ?? []).map(m => <option key={m.id} value={m.id}>{m.trainees?.profiles?.name} – {m.plan}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Amount *</label><input required type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} /></div>
            <div className="form-group"><label>Date *</label>  <input required type="date" value={form.payment_date} onChange={e=>setForm(f=>({...f,payment_date:e.target.value}))} /></div>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.payment_status} onChange={e=>setForm(f=>({...f,payment_status:e.target.value}))}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Record'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Payment" size="md">
        <form onSubmit={handleEdit} className="auth-form">
          <div className="form-row">
            <div className="form-group"><label>Amount *</label><input required type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} /></div>
            <div className="form-group"><label>Date *</label>  <input required type="date" value={form.payment_date} onChange={e=>setForm(f=>({...f,payment_date:e.target.value}))} /></div>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.payment_status} onChange={e=>setForm(f=>({...f,payment_status:e.target.value}))}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
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
