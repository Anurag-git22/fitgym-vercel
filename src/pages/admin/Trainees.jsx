import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import Card       from '../../components/ui/Card';
import Table      from '../../components/ui/Table';
import Modal      from '../../components/ui/Modal';
import Badge      from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

const INIT = { name: '', email: '', password: '', phone: '', date_of_birth: '', trainer_id: '' };

export default function AdminTrainees() {
  const [modal,  setModal]  = useState(null);
  const [form,   setForm]   = useState(INIT);
  const [target, setTarget] = useState(null);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState('');

  const { data: trainees, loading, refetch } = useSupabaseQuery(() =>
    supabase
      .from('trainees')
      .select('id, date_of_birth, profiles(id,name,email,phone,account_status), trainers(id,profiles(name))')
      .order('created_at', { ascending: false }),
  []);

  const { data: trainers } = useSupabaseQuery(() =>
    supabase.from('trainers').select('id, profiles(name)'),
  []);

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
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options:  { data: { name: form.name, role: 'trainee' } },
      });
      if (authErr) throw authErr;
      const uid = authData.user?.id;
      if (!uid) throw new Error('User creation failed.');

      if (form.phone) await supabase.from('profiles').update({ phone: form.phone }).eq('id', uid);

      const { error: tnErr } = await supabase.from('trainees').insert({
        profile_id:    uid,
        trainer_id:    form.trainer_id || null,
        date_of_birth: form.date_of_birth || null,
      });
      if (tnErr) throw tnErr;

      setModal(null); refetch();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { error: pe } = await supabase.from('profiles')
        .update({ name: form.name, phone: form.phone || null })
        .eq('id', target.profiles.id);
      if (pe) throw pe;

      const { error: te } = await supabase.from('trainees')
        .update({ trainer_id: form.trainer_id || null, date_of_birth: form.date_of_birth || null })
        .eq('id', target.id);
      if (te) throw te;

      setModal(null); refetch();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function handleToggleStatus() {
    setBusy(true);
    const next = target.profiles.account_status === 'active' ? 'inactive' : 'active';
    await supabase.from('profiles').update({ account_status: next }).eq('id', target.profiles.id);
    setBusy(false); setModal(null); refetch();
  }

  const columns = [
    { key: 'name',          label: 'Name',    render: (_, r) => r.profiles?.name  ?? '—' },
    { key: 'email',         label: 'Email',   render: (_, r) => r.profiles?.email ?? '—' },
    { key: 'trainer',       label: 'Trainer', render: (_, r) => r.trainers?.profiles?.name ?? 'Unassigned' },
    { key: 'date_of_birth', label: 'DOB',     render: v => v ?? '—' },
    { key: 'status',        label: 'Status',  render: (_, r) => <Badge status={r.profiles?.account_status} /> },
    {
      key: 'actions', label: '',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>
          <button className={`btn btn-sm ${r.profiles?.account_status === 'active' ? 'btn-danger' : 'btn-success'}`} onClick={() => openDelete(r)}>
            {r.profiles?.account_status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Trainees</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Trainee</button>
      </div>

      <Card padding={false}>
        {trainees?.length === 0 && !loading
          ? <EmptyState icon="👥" title="No trainees yet" action={<button className="btn btn-primary" onClick={openAdd}>Add Trainee</button>} />
          : <Table columns={columns} data={trainees ?? []} loading={loading} />
        }
      </Card>

      {/* Add */}
      <Modal open={modal === 'add'} onClose={() => setModal(null)} title="Add Trainee" size="md">
        <form onSubmit={handleAdd} className="auth-form">
          <div className="form-row">
            <div className="form-group"><label>Full Name *</label><input required value={form.name}  onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
            <div className="form-group"><label>Email *</label>    <input required type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Password *</label><input required type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} /></div>
            <div className="form-group"><label>Phone</label>     <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Date of Birth</label><input type="date" value={form.date_of_birth} onChange={e=>setForm(f=>({...f,date_of_birth:e.target.value}))} /></div>
            <div className="form-group">
              <label>Assign Trainer</label>
              <select value={form.trainer_id} onChange={e=>setForm(f=>({...f,trainer_id:e.target.value}))}>
                <option value="">— Unassigned —</option>
                {(trainers ?? []).map(t => <option key={t.id} value={t.id}>{t.profiles?.name}</option>)}
              </select>
            </div>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Add Trainee'}</button>
          </div>
        </form>
      </Modal>

      {/* Edit */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Edit Trainee" size="md">
        <form onSubmit={handleEdit} className="auth-form">
          <div className="form-row">
            <div className="form-group"><label>Full Name *</label><input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
            <div className="form-group"><label>Phone</label>      <input value={form.phone}         onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Date of Birth</label><input type="date" value={form.date_of_birth} onChange={e=>setForm(f=>({...f,date_of_birth:e.target.value}))} /></div>
            <div className="form-group">
              <label>Assign Trainer</label>
              <select value={form.trainer_id} onChange={e=>setForm(f=>({...f,trainer_id:e.target.value}))}>
                <option value="">— Unassigned —</option>
                {(trainers ?? []).map(t => <option key={t.id} value={t.id}>{t.profiles?.name}</option>)}
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

      {/* Status toggle confirm */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Change Account Status" size="sm">
        <p style={{marginTop:0}}>
          {target?.profiles?.account_status === 'active'
            ? `Deactivate "${target?.profiles?.name}"?`
            : `Reactivate "${target?.profiles?.name}"?`}
        </p>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
          <button className={target?.profiles?.account_status === 'active' ? 'btn btn-danger' : 'btn btn-success'} onClick={handleToggleStatus} disabled={busy}>
            {busy ? 'Updating…' : target?.profiles?.account_status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
