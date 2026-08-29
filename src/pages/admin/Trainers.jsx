import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { UserCheck, UserPlus, Search, Edit2, Power } from 'lucide-react';
import { Pagination } from '../admin/Payments';

const PAGE_SIZE = 10;

const INIT = { name: '', email: '', password: '', phone: '', specialization: '', joining_date: '' };

export default function AdminTrainers() {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(INIT);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: trainers, loading, refetch } = useSupabaseQuery(() =>
    supabase
      .from('trainers')
      .select('id, specialization, joining_date, profiles(id, name, email, phone, account_status)')
      .order('created_at', { ascending: false }),
  []);

  const filteredTrainers = useMemo(() => {
    if (!trainers) return [];
    if (!search.trim()) return trainers;
    const q = search.toLowerCase();
    return trainers.filter(t =>
      t.profiles?.name?.toLowerCase().includes(q) ||
      t.profiles?.email?.toLowerCase().includes(q) ||
      t.specialization?.toLowerCase().includes(q)
    );
  }, [trainers, search]);

  const totalPages = Math.max(1, Math.ceil(filteredTrainers.length / PAGE_SIZE));
  const paginated  = filteredTrainers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* ── Handlers ─────────────────────────────────────────────── */
  function openAdd() { setForm(INIT); setError(''); setModal('add'); }

  function openEdit(row) {
    setTarget(row);
    setForm({
      name:           row.profiles.name,
      email:          row.profiles.email,
      password:       '',
      phone:          row.profiles.phone ?? '',
      specialization: row.specialization ?? '',
      joining_date:   row.joining_date ?? '',
    });
    setError('');
    setModal('edit');
  }

  function openDelete(row) { setTarget(row); setModal('delete'); }

  async function handleAdd(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      // 1. Create auth user
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options:  { data: { name: form.name, role: 'trainer' } },
      });
      if (authErr) throw authErr;

      const uid = authData.user?.id;
      if (!uid) throw new Error('User creation failed — no user id returned.');

      // 2. Manually create profile row (trigger was removed)
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id:             uid,
        name:           form.name,
        email:          form.email,
        phone:          form.phone || null,
        role:           'trainer',
        account_status: 'active',
      });
      if (profileErr) throw profileErr;

      // 3. Create trainer row
      const { error: trainerErr } = await supabase.from('trainers').insert({
        profile_id:     uid,
        specialization: form.specialization || null,
        joining_date:   form.joining_date   || null,
      });
      if (trainerErr) throw trainerErr;

      setModal(null);
      refetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ name: form.name, phone: form.phone || null })
        .eq('id', target.profiles.id);
      if (profErr) throw profErr;

      const { error: trErr } = await supabase
        .from('trainers')
        .update({ specialization: form.specialization || null, joining_date: form.joining_date || null })
        .eq('id', target.id);
      if (trErr) throw trErr;

      setModal(null);
      refetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleStatus() {
    setBusy(true);
    const next = target.profiles.account_status === 'active' ? 'inactive' : 'active';
    const { error: err } = await supabase
      .from('profiles')
      .update({ account_status: next })
      .eq('id', target.profiles.id);
    setBusy(false);
    if (!err) { setModal(null); refetch(); }
  }

  /* ── Table columns ────────────────────────────────────────── */
  const columns = [
    {
      key: 'name',
      label: 'Trainer',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--purple), var(--primary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>
            {r.profiles?.name?.[0]?.toUpperCase() ?? 'T'}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.profiles?.name ?? '—'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.profiles?.email ?? ''}</div>
          </div>
        </div>
      )
    },
    { key: 'specialization', label: 'Specialization', render: v => <span style={{ color: 'var(--cyan)', fontWeight: 500 }}>{v ?? 'General Fitness'}</span> },
    { key: 'phone', label: 'Contact Phone', render: (_, r) => r.profiles?.phone || '—', hideOnMobile: true },
    { key: 'joining_date', label: 'Joined Date', render: v => v ?? '—', hideOnMobile: true },
    { key: 'status', label: 'Status', render: (_, r) => <Badge status={r.profiles?.account_status} /> },
    {
      key: 'actions', label: '',
      hideOnMobile: true,
      render: (_, r) => (
        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>
            <Edit2 size={13} />
            <span>Edit</span>
          </button>
          <button
            className={r.profiles?.account_status === 'active' ? 'btn btn-danger btn-sm' : 'btn btn-success btn-sm'}
            onClick={() => openDelete(r)}
          >
            <Power size={13} />
            <span>{r.profiles?.account_status === 'active' ? 'Deactivate' : 'Activate'}</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Trainers Management</h2>
          <p className="page-header-subtitle">Manage personal trainers, specializations, and access credentials</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <UserPlus size={16} />
          <span>Add Trainer</span>
        </button>
      </div>

      <Card padding={false}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search trainers by name, email, or discipline..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        {trainers?.length === 0 && !loading ? (
          <EmptyState
            icon={<UserCheck size={36} />}
            title="No trainers found"
            message="Onboard your first gym trainer to start assigning members and workouts."
            action={<button className="btn btn-primary" onClick={openAdd}><UserPlus size={16} /><span>Add Trainer</span></button>}
          />
        ) : (
          <>
            <Table columns={columns} data={paginated} loading={loading} emptyMsg="No trainers match your search criteria." />
            <Pagination page={page} totalPages={totalPages} onChange={setPage} total={filteredTrainers.length} pageSize={PAGE_SIZE} />
          </>
        )}
      </Card>

      {/* Add Modal */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Onboard New Trainer" size="md">
        <form onSubmit={handleAdd} className="auth-form">
          <div className="form-row">
            <div className="form-group"><label>Full Name *</label><input required placeholder="" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
            <div className="form-group"><label>Email Address *</label><input required type="email" placeholder="trainer@fitgym.net" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Password *</label><input required type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} /></div>
            <div className="form-group"><label>Phone Number</label><input placeholder="+91 00000 00000" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Specialization</label><input placeholder="e.g. Strength & Conditioning" value={form.specialization} onChange={e=>setForm(f=>({...f,specialization:e.target.value}))} /></div>
            <div className="form-group"><label>Joining Date</label><input type="date" value={form.joining_date} onChange={e=>setForm(f=>({...f,joining_date:e.target.value}))} /></div>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Onboard Trainer'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Trainer Details" size="md">
        <form onSubmit={handleEdit} className="auth-form">
          <div className="form-row">
            <div className="form-group"><label>Full Name *</label><input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
            <div className="form-group"><label>Phone Number</label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Specialization</label><input value={form.specialization} onChange={e=>setForm(f=>({...f,specialization:e.target.value}))} /></div>
            <div className="form-group"><label>Joining Date</label><input type="date" value={form.joining_date} onChange={e=>setForm(f=>({...f,joining_date:e.target.value}))} /></div>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Updating…' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      {/* Deactivate/Activate Modal */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Update Account Access" size="sm">
        <p style={{ marginTop: 0, color: 'var(--text-secondary)' }}>
          {target?.profiles?.account_status === 'active'
            ? `Deactivate access for trainer "${target?.profiles?.name}"? They will temporarily lose access to their portal.`
            : `Reactivate portal access for trainer "${target?.profiles?.name}"?`}
        </p>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
          <button
            className={target?.profiles?.account_status === 'active' ? 'btn btn-danger' : 'btn btn-success'}
            onClick={handleToggleStatus}
            disabled={busy}
          >
            {busy ? 'Updating…' : target?.profiles?.account_status === 'active' ? 'Confirm Deactivate' : 'Confirm Activate'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
