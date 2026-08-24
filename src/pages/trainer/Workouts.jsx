import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import Card       from '../../components/ui/Card';
import Table      from '../../components/ui/Table';
import Modal      from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';

const EMPTY_EXERCISE = { name: '', sets: '', reps: '', weight: '', notes: '' };
const INIT = { trainee_id: '', name: '', duration_minutes: '', notes: '', exercises: [{ ...EMPTY_EXERCISE }] };

export default function TrainerWorkouts() {
  const { profile } = useAuth();

  const { data: trainer } = useSupabaseQuery(() =>
    supabase.from('trainers').select('id').eq('profile_id', profile.id).single(),
  [profile.id]);

  const trainerId = trainer?.id;

  const { data: workouts, loading, refetch } = useSupabaseQuery(() => {
    if (!trainerId) return Promise.resolve({ data: [], error: null });
    return supabase
      .from('workouts')
      .select('*, trainees(profiles(name))')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: false });
  }, [trainerId]);

  const { data: myTrainees } = useSupabaseQuery(() => {
    if (!trainerId) return Promise.resolve({ data: [], error: null });
    return supabase.from('trainees').select('id, profiles(name)').eq('trainer_id', trainerId);
  }, [trainerId]);

  const [modal,  setModal]  = useState(null); // null | 'add' | 'edit' | 'view'
  const [form,   setForm]   = useState(INIT);
  const [target, setTarget] = useState(null);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState('');

  function openAdd() { setForm(INIT); setError(''); setModal('add'); }

  function openEdit(row) {
    setTarget(row);
    setForm({
      trainee_id:       row.trainee_id,
      name:             row.name,
      duration_minutes: row.duration_minutes ?? '',
      notes:            row.notes ?? '',
      exercises:        row.exercises?.length ? row.exercises : [{ ...EMPTY_EXERCISE }],
    });
    setError(''); setModal('edit');
  }

  function openView(row) { setTarget(row); setModal('view'); }

  /* Exercise list helpers */
  function setExercise(i, field, value) {
    setForm(f => {
      const exs = [...f.exercises];
      exs[i] = { ...exs[i], [field]: value };
      return { ...f, exercises: exs };
    });
  }
  function addExercise()    { setForm(f => ({ ...f, exercises: [...f.exercises, { ...EMPTY_EXERCISE }] })); }
  function removeExercise(i){ setForm(f => ({ ...f, exercises: f.exercises.filter((_, idx) => idx !== i) })); }

  async function handleAdd(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: err } = await supabase.from('workouts').insert({
      trainer_id:       trainerId,
      trainee_id:       form.trainee_id,
      name:             form.name,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      notes:            form.notes || null,
      exercises:        form.exercises.filter(ex => ex.name.trim()),
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setModal(null); refetch();
  }

  async function handleEdit(e) {
    e.preventDefault(); setBusy(true); setError('');
    const { error: err } = await supabase.from('workouts').update({
      name:             form.name,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      notes:            form.notes || null,
      exercises:        form.exercises.filter(ex => ex.name.trim()),
    }).eq('id', target.id);
    setBusy(false);
    if (err) { setError(err.message); return; }
    setModal(null); refetch();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this workout plan?')) return;
    await supabase.from('workouts').delete().eq('id', id);
    refetch();
  }

  const columns = [
    { key: 'name',             label: 'Plan Name' },
    { key: 'trainee',          label: 'Trainee',  render: (_, r) => r.trainees?.profiles?.name ?? '—' },
    { key: 'duration_minutes', label: 'Duration', render: v => v ? `${v} min` : '—' },
    { key: 'exercises',        label: 'Exercises', render: v => `${(v ?? []).length} exercises` },
    { key: 'created_at',       label: 'Created',  render: v => new Date(v).toLocaleDateString() },
    {
      key: 'actions', label: '',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => openView(r)}>View</button>
          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>
          <button className="btn btn-danger btn-sm"    onClick={() => handleDelete(r.id)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Workout Plans</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ New Plan</button>
      </div>

      <Card padding={false}>
        {!loading && (workouts ?? []).length === 0
          ? <EmptyState icon="💪" title="No workout plans yet" action={<button className="btn btn-primary" onClick={openAdd}>Create Plan</button>} />
          : <Table columns={columns} data={workouts ?? []} loading={loading} />
        }
      </Card>

      {/* View Modal */}
      <Modal open={modal === 'view'} onClose={() => setModal(null)} title={target?.name} size="lg">
        <p style={{ color: '#64748b', marginTop: 0 }}>
          Trainee: <strong>{target?.trainees?.profiles?.name ?? '—'}</strong> ·
          Duration: <strong>{target?.duration_minutes ? `${target.duration_minutes} min` : '—'}</strong>
        </p>
        {target?.notes && <p style={{ color: '#374151', marginBottom: '1rem' }}>{target.notes}</p>}
        <div className="workout-exercise-list">
          {(target?.exercises ?? []).map((ex, i) => (
            <div key={i} className="workout-exercise-card">
              <div className="workout-exercise-num">{i + 1}</div>
              <div>
                <div className="workout-exercise-name">{ex.name}</div>
                <div className="workout-exercise-meta">
                  {ex.sets  && <span>{ex.sets} sets</span>}
                  {ex.reps  && <span>{ex.reps} reps</span>}
                  {ex.weight && <span>{ex.weight} kg</span>}
                  {ex.notes  && <span>{ex.notes}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal
          open
          onClose={() => setModal(null)}
          title={modal === 'add' ? 'New Workout Plan' : 'Edit Workout Plan'}
          size="lg"
        >
          <form onSubmit={modal === 'add' ? handleAdd : handleEdit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label>Plan Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              {modal === 'add' && (
                <div className="form-group">
                  <label>Trainee *</label>
                  <select required value={form.trainee_id} onChange={e => setForm(f => ({ ...f, trainee_id: e.target.value }))}>
                    <option value="">— Select —</option>
                    {(myTrainees ?? []).map(t => <option key={t.id} value={t.id}>{t.profiles?.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input type="number" min="1" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>

            {/* Exercise builder */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ fontWeight: 600, color: '#374151' }}>Exercises</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addExercise}>+ Add Exercise</button>
              </div>
              {form.exercises.map((ex, i) => (
                <div key={i} className="exercise-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Exercise {i + 1}</label>
                    <input placeholder="e.g. Bench Press" value={ex.name} onChange={e => setExercise(i, 'name', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Sets</label>
                    <input type="number" min="1" value={ex.sets} onChange={e => setExercise(i, 'sets', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Reps</label>
                    <input type="number" min="1" value={ex.reps} onChange={e => setExercise(i, 'reps', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Weight (kg)</label>
                    <input type="number" min="0" step="0.5" value={ex.weight} onChange={e => setExercise(i, 'weight', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Notes</label>
                    <input value={ex.notes} onChange={e => setExercise(i, 'notes', e.target.value)} />
                  </div>
                  {form.exercises.length > 1 && (
                    <button type="button" className="btn btn-danger btn-sm" style={{ alignSelf: 'flex-end' }} onClick={() => removeExercise(i)}>✕</button>
                  )}
                </div>
              ))}
            </div>

            {error && <div className="auth-error">{error}</div>}
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : modal === 'add' ? 'Create Plan' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
