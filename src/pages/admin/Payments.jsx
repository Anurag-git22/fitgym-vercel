import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import Card  from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Search, Download } from 'lucide-react';

function currency(n) { return `₹${Number(n ?? 0).toFixed(2)}`; }

const INIT = { trainee_id: '', membership_id: '', amount: '', payment_date: new Date().toISOString().slice(0,10), payment_status: 'pending' };
const PAGE_SIZE = 10;

/* ── CSV export helper ───────────────────────────────────────── */
function exportCSV(data) {
  const headers = ['Trainee', 'Email', 'Plan', 'Amount', 'Date', 'Status'];
  const rows = data.map(p => [
    p.trainees?.profiles?.name  ?? '',
    p.trainees?.profiles?.email ?? '',
    p.memberships?.plan         ?? '',
    Number(p.amount ?? 0).toFixed(2),
    p.payment_date              ?? '',
    p.payment_status            ?? '',
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `fitgym_payments_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPayments() {
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(INIT);
  const [target,  setTarget]  = useState(null);
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);

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

  /* Filter + Search */
  const filtered = useMemo(() => {
    let rows = data ?? [];
    if (filter !== 'all') rows = rows.filter(p => p.payment_status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(p =>
        p.trainees?.profiles?.name?.toLowerCase().includes(q)  ||
        p.trainees?.profiles?.email?.toLowerCase().includes(q) ||
        p.memberships?.plan?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [data, filter, search]);

  /* Pagination */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when filter/search changes
  const handleFilter = (f) => { setFilter(f); setPage(1); };
  const handleSearch = (v) => { setSearch(v);  setPage(1); };

  const columns = [
    {
      key: 'trainee', label: 'Trainee / Member',
      render: (_, r) => {
        const name  = r.trainees?.profiles?.name;
        const email = r.trainees?.profiles?.email;
        return (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{name ?? email ?? '—'}</div>
            {name && email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{email}</div>}
          </div>
        );
      }
    },
    { key: 'memberships',    label: 'Plan',         render: (_, r) => r.memberships?.plan ?? '—' },
    { key: 'amount',         label: 'Amount',       render: v => currency(v) },
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => exportCSV(filtered)} title="Export to CSV">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={openAdd}>+ Record Payment</button>
        </div>
      </div>

      {/* Filter tabs + Search */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div className="tab-row">
          {['all','paid','pending','failed'].map(f => (
            <button key={f} className={`tab-btn${filter === f ? ' tab-btn--active' : ''}`} onClick={() => handleFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="table-search-wrap">
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by name, email or plan…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="table-search-input"
          />
        </div>
      </div>

      <Card padding={false}>
        <Table columns={columns} data={paginated} loading={loading} emptyMsg="No payments found." />
        <Pagination page={page} totalPages={totalPages} onChange={setPage} total={filtered.length} pageSize={PAGE_SIZE} />
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
            <div className="form-group"><label>Date *</label><input required type="date" value={form.payment_date} onChange={e=>setForm(f=>({...f,payment_date:e.target.value}))} /></div>
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
            <div className="form-group"><label>Date *</label><input required type="date" value={form.payment_date} onChange={e=>setForm(f=>({...f,payment_date:e.target.value}))} /></div>
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

/* ── Reusable Pagination component ──────────────────────────── */
export function Pagination({ page, totalPages, onChange, total, pageSize }) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);
  return (
    <div className="pagination-wrap">
      <span className="pagination-info">{start}–{end} of {total}</span>
      <div className="pagination-btns">
        <button className="pagination-btn" onClick={() => onChange(1)}      disabled={page === 1}>«</button>
        <button className="pagination-btn" onClick={() => onChange(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p;
          if (totalPages <= 5)      p = i + 1;
          else if (page <= 3)       p = i + 1;
          else if (page >= totalPages - 2) p = totalPages - 4 + i;
          else                      p = page - 2 + i;
          return (
            <button key={p} className={`pagination-btn${page === p ? ' pagination-btn--active' : ''}`} onClick={() => onChange(p)}>{p}</button>
          );
        })}
        <button className="pagination-btn" onClick={() => onChange(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
        <button className="pagination-btn" onClick={() => onChange(totalPages)} disabled={page === totalPages}>»</button>
      </div>
    </div>
  );
}
