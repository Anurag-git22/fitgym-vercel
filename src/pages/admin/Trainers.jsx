import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import Card       from '../../components/ui/Card';
import Table      from '../../components/ui/Table';
import Modal      from '../../components/ui/Modal';
import Badge      from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const INIT = { name: '', email: '', password: '', phone: '', specialization: '', joining_date: '' };

export default function AdminTrainers() {
  const [modal,  setModal]  = useState(null); // null | 'add' | 'edit' | 'delete'
  const [form,   setForm]   = useState(INIT);
  const [target, setTarget] = useState(null);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState('');

  const { data: trainers, loading, refetch } = useSupabaseQuery(() =>
    supabase
      .from('trainers')
      .select('id, specialization, joining_date, profiles(id, name, email, phone, account_status)')
      .order('created_at', { ascending: false }),
  []);

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
      // 1. Create auth user via Supabase Admin — but from the browser we use the
      //    anon key, so we call signUp. The handle_new_user trigger creates the profile.
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options:  { data: { name: form.name, role: 'trainer' } },
      });
      if (authErr) throw authErr;

      const uid = authData.user?.id;
      if (!uid) throw new Error('User creation failed — no user id returned.');

      // 2. Update phone on the profile (trigger may not have it yet)
      if (form.phone) {
        await supabase.from('profiles').update({ phone: form.phone }).eq('id', uid);
      }

      // 3. Create trainers row
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
    { key: 'name',           label: 'Name',           render: (_, r) => r.profiles?.name ?? '—' },
    { key: 'email',          label: 'Email',          render: (_, r) => r.profiles?.email ?? '—' },
    { key: 'specialization', label: 'Specialization', render: v => v ?? '—' },
    { key: 'joining_date',   label: 'Joined',         render: v => v ?? '—' },
    { key: 'status',         label: 'Status',         render: (_, r) => <Badge status={r.profiles?.account_status} /> },
    {
      key: 'actions', label: '',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>
          <button className="btn btn-danger btn-sm"    onClick={() => openDelete(r)}>
            {r.profiles?.account_status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Trainers</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Trainer</button>
      </div>

      <Card padding={false}>
        {trainers?.length === 0 && !loading ? (
          <EmptyState icon="🏋️" title="No trainers yet" message="Add your first trainer to get started." action={<button className="btn btn-primary" onClick={openAdd}>Add Trainer</button>} />
        ) : (
          <Table columns={columns} data={trainers ?? []} loading={loading} emptyMsg="No trainers found." />
        )}
      </Card>

      {/* Add Modal */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Add Trainer" size="md">
        <form onSubmit={handleAdd} className="auth-form">
          <div className="form-row">
            <div className="form-group"><label>Full Name *</label><input required value={form.name}   onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
            <div className="form-group"><label>Email *</label>    <input required type="email" value={form.email}  onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Password *</label>        <input required type="password" value={form.password}       onChange={e=>setForm(f=>({...f,password:e.target.value}))} /></div>
            <div className="form-group"><label>Phone</label>             <input value={form.phone}        onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Specialization</label>    <input value={form.specialization} onChange={e=>setForm(f=>({...f,specialization:e.target.value}))} /></div>
            <div className="form-group"><label>Joining Date</label>      <input type="date" value={form.joining_date} onChange={e=>setForm(f=>({...f,joining_date:e.target.value}))} /></div>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Add Trainer'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Trainer" size="md">
        <form onSubmit={handleEdit} className="auth-form">
          <div className="form-row">
            <div className="form-group"><label>Full Name *</label><input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
            <div className="form-group"><label>Phone</label>      <input value={form.phone}          onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Specialization</label> <input value={form.specialization} onChange={e=>setForm(f=>({...f,specialization:e.target.value}))} /></div>
            <div className="form-group"><label>Joining Date</label>   <input type="date" value={form.joining_date} onChange={e=>setForm(f=>({...f,joining_date:e.target.value}))} /></div>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      {/* Deactivate/Activate Confirm */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Change Account Status" size="sm">
        <p style={{marginTop:0}}>
          {target?.profiles?.account_status === 'active'
            ? `Deactivate trainer "${target?.profiles?.name}"? They will no longer be able to sign in.`
            : `Reactivate trainer "${target?.profiles?.name}"?`}
        </p>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
          <button
            className={target?.profiles?.account_status === 'active' ? 'btn btn-danger' : 'btn btn-success'}
            onClick={handleToggleStatus}
            disabled={busy}
          >
            {busy ? 'Updating…' : target?.profiles?.account_status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
