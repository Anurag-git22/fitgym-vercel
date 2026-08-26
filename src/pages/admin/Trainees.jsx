import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { Users, UserPlus, Search, Edit2, Power } from 'lucide-react';

const INIT = { name: '', email: '', password: '', phone: '', date_of_birth: '', trainer_id: '' };

export default function AdminTrainees() {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(INIT);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const { data: trainees, loading, refetch } = useSupabaseQuery(() =>
    supabase
      .from('trainees')
      .select('id, date_of_birth, profiles(id,name,email,phone,account_status), trainers(id,profiles(name))')
      .order('created_at', { ascending: false }),
  []);

  const { data: trainers } = useSupabaseQuery(() =>
    supabase.from('trainers').select('id, profiles(name)'),
  []);

  const filteredTrainees = useMemo(() => {
    if (!trainees) return [];
    if (!search.trim()) return trainees;
    const q = search.toLowerCase();
    return trainees.filter(t =>
      t.profiles?.name?.toLowerCase().includes(q) ||
      t.profiles?.email?.toLowerCase().includes(q) ||
      t.trainers?.profiles?.name?.toLowerCase().includes(q)
    );
  }, [trainees, search]);

  function openAdd() { setForm(INIT); setError(''); setModal('add'); }

  function openEdit(row) {
    setTarget(row);
    setForm({
      name:          row.profiles.name,
      email:         row.profiles.email,
      password:      '',
      phone:         row.profiles.phone ?? '',
      date_of_birth: row.date_of_birth ?? '',
      trainer_id:    row.trainers?.id ?? '',
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
        options:  { data: { name: form.name, role: 'trainee' } },
      });
      if (authErr) throw authErr;
      const uid = authData.user?.id;
      if (!uid) throw new Error('User creation failed.');

      // 2. Manually create profile row (trigger was removed)
      const { error: profileErr } = await supabase.from('profiles').upsert({
        id:             uid,
        name:           form.name,
        email:          form.email,
        phone:          form.phone || null,
        role:           'trainee',
        account_status: 'active',
      });
      if (profileErr) throw profileErr;

      // 3. Create trainee row
      const { error: tErr } = await supabase.from('trainees').insert({
        profile_id:    uid,
        trainer_id:    form.trainer_id    || null,
        date_of_birth: form.date_of_birth || null,
      });
      if (tErr) throw tErr;

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

      const { error: tErr } = await supabase
        .from('trainees')
        .update({
          trainer_id:    form.trainer_id    || null,
          date_of_birth: form.date_of_birth || null,
        })
        .eq('id', target.id);
      if (tErr) throw tErr;

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

  const columns = [
    {
      key: 'name',
      label: 'Member',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--cyan), var(--primary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>
            {r.profiles?.name?.[0]?.toUpperCase() ?? 'M'}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.profiles?.name ?? '—'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.profiles?.email ?? ''}</div>
          </div>
        </div>
      )
    },
    { key: 'phone', label: 'Contact Phone', render: (_, r) => r.profiles?.phone || '—' },
    {
      key: 'trainer',
      label: 'Assigned Trainer',
      render: (_, r) => r.trainers?.profiles?.name ? (
        <span style={{ color: 'var(--cyan)', fontWeight: 500 }}>{r.trainers.profiles.name}</span>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
      )
    },
    { key: 'dob', label: 'Date of Birth', render: (_, r) => r.date_of_birth ?? '—' },
    { key: 'status', label: 'Status', render: (_, r) => <Badge status={r.profiles?.account_status} /> },
    {
      key: 'actions', label: '',
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
          <h2>Trainees Directory</h2>
          <p className="page-header-subtitle">Manage gym members, assigned personal trainers, and access status</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <UserPlus size={16} />
          <span>Register Trainee</span>
        </button>
      </div>

      <Card padding={false}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search trainees by name, email, or assigned trainer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
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

        {trainees?.length === 0 && !loading ? (
          <EmptyState
            icon={<Users size={36} />}
            title="No trainees found"
            message="Register your first gym member to start tracking workouts and memberships."
            action={<button className="btn btn-primary" onClick={openAdd}><UserPlus size={16} /><span>Register Trainee</span></button>}
          />
        ) : (
          <Table columns={columns} data={filteredTrainees} loading={loading} emptyMsg="No trainees match your search criteria." />
        )}
      </Card>

      {/* Add Modal */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Register New Trainee" size="md">
        <form onSubmit={handleAdd} className="auth-form">
          <div className="form-row">
            <div className="form-group"><label>Full Name *</label><input required placeholder="e.g. Jessica Miller" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
            <div className="form-group"><label>Email Address *</label><input required type="email" placeholder="member@fitgym.net" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Password *</label><input required type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} /></div>
            <div className="form-group"><label>Phone Number</label><input placeholder="+1 (555) 000-0000" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Date of Birth</label><input type="date" value={form.date_of_birth} onChange={e=>setForm(f=>({...f,date_of_birth:e.target.value}))} /></div>
            <div className="form-group">
              <label>Assign Trainer</label>
              <select value={form.trainer_id} onChange={e=>setForm(f=>({...f,trainer_id:e.target.value}))}>
                <option value="">None (Self-guided)</option>
                {(trainers ?? []).map(t => (
                  <option key={t.id} value={t.id}>{t.profiles?.name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Registering…' : 'Register Trainee'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Trainee Details" size="md">
        <form onSubmit={handleEdit} className="auth-form">
          <div className="form-row">
            <div className="form-group"><label>Full Name *</label><input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
            <div className="form-group"><label>Phone Number</label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Date of Birth</label><input type="date" value={form.date_of_birth} onChange={e=>setForm(f=>({...f,date_of_birth:e.target.value}))} /></div>
            <div className="form-group">
              <label>Assign Trainer</label>
              <select value={form.trainer_id} onChange={e=>setForm(f=>({...f,trainer_id:e.target.value}))}>
                <option value="">None (Self-guided)</option>
                {(trainers ?? []).map(t => (
                  <option key={t.id} value={t.id}>{t.profiles?.name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      {/* Deactivate/Activate Modal */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Update Member Access" size="sm">
        <p style={{ marginTop: 0, color: 'var(--text-secondary)' }}>
          {target?.profiles?.account_status === 'active'
            ? `Deactivate member "${target?.profiles?.name}"? They will temporarily be locked out of check-ins and member access.`
            : `Reactivate member "${target?.profiles?.name}"?`}
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
