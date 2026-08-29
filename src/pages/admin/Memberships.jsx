import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import Card       from '../../components/ui/Card';
import Table      from '../../components/ui/Table';
import Modal      from '../../components/ui/Modal';
import Badge      from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { Search } from 'lucide-react';
import { Pagination } from '../admin/Payments';

const PAGE_SIZE = 10;

const INIT = { trainee_id: '', plan_id: '', plan: '', start_date: '', end_date: '', status: 'active', price: '' };

/* Calculate end date from start date + duration in months */
function calcEndDate(startDate, durationMonths) {
  if (!startDate || !durationMonths) return '';
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + durationMonths);
  d.setDate(d.getDate() - 1); // end on last day of period
  return d.toISOString().slice(0, 10);
}

function currency(n) {
  return `₹${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

export default function AdminMemberships() {
  const [modal,  setModal]  = useState(null);
  const [form,   setForm]   = useState(INIT);
  const [target, setTarget] = useState(null);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState('');
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(1);

  /* Fetch memberships */
  const { data, loading, refetch } = useSupabaseQuery(() =>
    supabase
      .from('memberships')
      .select('*, trainees(id, profiles(name))')
      .order('created_at', { ascending: false }),
  []);

  /* Fetch plan definitions from Supabase */
  const { data: plans, refetch: refetchPlans } = useSupabaseQuery(() =>
    supabase
      .from('membership_plans')
      .select('*')
      .order('duration_months', { ascending: true }),
  []);

  /* Fetch trainees */
  const { data: trainees } = useSupabaseQuery(() =>
    supabase.from('trainees').select('id, profiles(name)'), []);

  /* When plan or start_date changes → auto-calculate end date and price */
  useEffect(() => {
    if (!form.plan_id || !form.start_date || !plans) return;
    const selected = plans.find(p => p.id === form.plan_id);
    if (!selected) return;
    const endDate = calcEndDate(form.start_date, selected.duration_months);
    setForm(f => ({
      ...f,
      plan:     selected.name,
      end_date: endDate,
      price:    selected.price,
    }));
  }, [form.plan_id, form.start_date, plans]);

  /* ── Handlers ─────────────────────────────────────────────── */
  function openAdd() {
    const today = new Date().toISOString().slice(0, 10);
    setForm({ ...INIT, start_date: today });
    setError(''); setModal('add');
  }

  function openEdit(row) {
    setTarget(row);
    const plan = plans?.find(p => p.name === row.plan);
    setForm({
      trainee_id: row.trainee_id,
      plan_id:    plan?.id ?? '',
      plan:       row.plan,
      start_date: row.start_date,
      end_date:   row.end_date,
      status:     row.status,
      price:      plan?.price ?? '',
    });
    setError(''); setModal('edit');
  }

  function openManagePlans() { setModal('plans'); }

  async function handleAdd(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: err } = await supabase.from('memberships').insert({
      trainee_id: form.trainee_id,
      plan:       form.plan,
      start_date: form.start_date,
      end_date:   form.end_date,
      status:     form.status,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    // Auto-create a pending payment
    if (form.price) {
      const { data: mem } = await supabase
        .from('memberships')
        .select('id')
        .eq('trainee_id', form.trainee_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (mem) {
        await supabase.from('payments').insert({
          trainee_id:     form.trainee_id,
          membership_id:  mem.id,
          amount:         form.price,
          payment_date:   form.start_date,
          payment_status: 'pending',
        });
      }
    }
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

  /* ── Table columns ────────────────────────────────────────── */
  const columns = [
    { key: 'trainee',    label: 'Trainee', render: (_, r) => r.trainees?.profiles?.name ?? '—' },
    { key: 'plan',       label: 'Plan',    render: v => v, hideOnMobile: true },
    {
      key: 'price', label: 'Price',
      render: (_, r) => {
        const plan = plans?.find(p => p.name === r.plan);
        return plan ? currency(plan.price) : '—';
      },
      hideOnMobile: true,
    },
    { key: 'start_date', label: 'Start',  render: v => v, hideOnMobile: true },
    { key: 'end_date',   label: 'End',    render: v => v, hideOnMobile: true },
    { key: 'status',     label: 'Status', render: v => <Badge status={v} /> },
    {
      key: 'actions', label: '',
      hideOnMobile: true,
      render: (_, r) => (
        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Memberships</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={openManagePlans}>⚙ Manage Plans</button>
          <button className="btn btn-primary"   onClick={openAdd}>+ New Membership</button>
        </div>
      </div>

      {/* Search */}
      <div className="table-search-wrap" style={{ marginBottom: '1rem' }}>
        <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search by trainee name or plan…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="table-search-input"
        />
      </div>

      {(() => {
        const filtered = (data ?? []).filter(r => {
          if (!search.trim()) return true;
          const q = search.toLowerCase();
          return r.trainees?.profiles?.name?.toLowerCase().includes(q) || r.plan?.toLowerCase().includes(q);
        });
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
        return (
          <Card padding={false}>
            <Table columns={columns} data={paginated} loading={loading} emptyMsg="No memberships yet." />
            <Pagination page={page} totalPages={totalPages} onChange={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
          </Card>
        );
      })()}

      {/* ── Add Membership ──────────────────────────────────── */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="New Membership" size="md">
        <form onSubmit={handleAdd} className="auth-form">
          <div className="form-group">
            <label>Trainee *</label>
            <select required value={form.trainee_id} onChange={e => setForm(f => ({ ...f, trainee_id: e.target.value }))}>
              <option value="">— Select trainee —</option>
              {(trainees ?? []).map(t => <option key={t.id} value={t.id}>{t.profiles?.name}</option>)}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Plan *</label>
              <select required value={form.plan_id} onChange={e => setForm(f => ({ ...f, plan_id: e.target.value }))}>
                <option value="">— Select plan —</option>
                {(plans ?? []).filter(p => p.is_active).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Price display */}
          {form.price && (
            <div className="membership-price-banner">
              <span>Plan Price</span>
              <span className="membership-price-val">{currency(form.price)}</span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input required type="date" value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>End Date <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(auto-calculated)</span></label>
              <input type="date" value={form.end_date} readOnly
                style={{ opacity: 0.7, cursor: 'not-allowed' }} />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy || !form.end_date}>
              {busy ? 'Saving…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Membership ─────────────────────────────────── */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Membership" size="md">
        <form onSubmit={handleEdit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Plan *</label>
              <select value={form.plan_id} onChange={e => setForm(f => ({ ...f, plan_id: e.target.value }))}>
                <option value="">— Select plan —</option>
                {(plans ?? []).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {form.price && (
            <div className="membership-price-banner">
              <span>Plan Price</span>
              <span className="membership-price-val">{currency(form.price)}</span>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>End Date <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>(auto-calculated)</span></label>
              <input type="date" value={form.end_date} readOnly
                style={{ opacity: 0.7, cursor: 'not-allowed' }} />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      {/* ── Manage Plans ────────────────────────────────────── */}
      <Modal open={modal === 'plans'} onClose={() => setModal(null)} title="Manage Membership Plans" size="md">
        <ManagePlans plans={plans ?? []} onUpdate={refetchPlans} />
      </Modal>
    </div>
  );
}

/* ── Manage Plans sub-component ─────────────────────────────── */
function ManagePlans({ plans, onUpdate }) {
  const [editId,  setEditId]  = useState(null);
  const [editVal, setEditVal] = useState({});
  const [busy,    setBusy]    = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', duration_months: '', price: '' });
  const [adding,  setAdding]  = useState(false);

  async function saveEdit(id) {
    setBusy(true);
    await supabase.from('membership_plans').update({
      name:             editVal.name,
      duration_months:  parseInt(editVal.duration_months),
      price:            parseFloat(editVal.price),
      is_active:        editVal.is_active,
    }).eq('id', id);
    setBusy(false);
    setEditId(null);
    onUpdate();
  }

  async function addPlan(e) {
    e.preventDefault(); setBusy(true);
    await supabase.from('membership_plans').insert({
      name:            newPlan.name,
      duration_months: parseInt(newPlan.duration_months),
      price:           parseFloat(newPlan.price),
      is_active:       true,
    });
    setBusy(false);
    setNewPlan({ name: '', duration_months: '', price: '' });
    setAdding(false);
    onUpdate();
  }

  return (
    <div className="auth-form">
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 0 }}>
        Edit plan names, durations, and prices. Changes apply to new memberships only.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        {plans.map(p => (
          <div key={p.id} className="plan-manage-row">
            {editId === p.id ? (
              <>
                <input
                  value={editVal.name}
                  onChange={e => setEditVal(v => ({ ...v, name: e.target.value }))}
                  style={{ flex: 2 }}
                  className="plan-manage-input"
                  placeholder="Plan name"
                />
                <input
                  type="number"
                  value={editVal.duration_months}
                  onChange={e => setEditVal(v => ({ ...v, duration_months: e.target.value }))}
                  style={{ flex: 1 }}
                  className="plan-manage-input"
                  placeholder="Months"
                />
                <input
                  type="number"
                  value={editVal.price}
                  onChange={e => setEditVal(v => ({ ...v, price: e.target.value }))}
                  style={{ flex: 1 }}
                  className="plan-manage-input"
                  placeholder="Price ₹"
                />
                <select
                  value={editVal.is_active ? 'true' : 'false'}
                  onChange={e => setEditVal(v => ({ ...v, is_active: e.target.value === 'true' }))}
                  className="plan-manage-input"
                  style={{ flex: 1 }}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <button className="btn btn-primary btn-sm" onClick={() => saveEdit(p.id)} disabled={busy}>Save</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditId(null)}>✕</button>
              </>
            ) : (
              <>
                <span style={{ flex: 2, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span>
                <span style={{ flex: 1, color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.duration_months} mo</span>
                <span style={{ flex: 1, fontWeight: 700, color: 'var(--primary)' }}>₹{Number(p.price).toLocaleString('en-IN')}</span>
                <Badge status={p.is_active ? 'active' : 'inactive'} />
                <button className="btn btn-secondary btn-sm" onClick={() => {
                  setEditId(p.id);
                  setEditVal({ name: p.name, duration_months: p.duration_months, price: p.price, is_active: p.is_active });
                }}>Edit</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add new plan */}
      {adding ? (
        <form onSubmit={addPlan} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 2, minWidth: 120 }}>
            <label>Plan Name</label>
            <input required value={newPlan.name} onChange={e => setNewPlan(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Bi-Annual" />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 80 }}>
            <label>Months</label>
            <input required type="number" min="1" value={newPlan.duration_months} onChange={e => setNewPlan(f => ({ ...f, duration_months: e.target.value }))} placeholder="6" />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 100 }}>
            <label>Price (₹)</label>
            <input required type="number" min="0" step="0.01" value={newPlan.price} onChange={e => setNewPlan(f => ({ ...f, price: e.target.value }))} placeholder="4999" />
          </div>
          <div className="form-actions" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Adding…' : 'Add Plan'}</button>
          </div>
        </form>
      ) : (
        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setAdding(true)}>
          + Add New Plan
        </button>
      )}
    </div>
  );
}
