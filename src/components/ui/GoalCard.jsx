import { useState } from 'react';
import Modal from './Modal';
import { Plus, Edit2, Trash2, CheckCircle2, Target } from 'lucide-react';

const INIT_FORM = { title: '', target_value: '', current_value: '0', unit: 'kg', target_date: '' };

export default function GoalCard({ goal, onUpdate, onDelete, editable = true }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    title: goal.title,
    target_value: goal.target_value,
    current_value: goal.current_value,
    unit: goal.unit,
    target_date: goal.target_date || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pct = goal.target_value > 0 ? Math.min(100, Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100)) : 0;
  const isCompleted = goal.status === 'completed';
  const remaining = goal.target_date ? Math.max(0, Math.ceil((new Date(goal.target_date) - new Date()) / 86400000)) : null;

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    const updates = {
      title: form.title,
      target_value: Number(form.target_value),
      current_value: Number(form.current_value),
      unit: form.unit,
      target_date: form.target_date || null,
      status: Number(form.current_value) >= Number(form.target_value) ? 'completed' : 'in_progress',
    };
    await onUpdate(goal.id, updates);
    setBusy(false);
    setModal(false);
  }

  async function handleDelete() {
    setBusy(true);
    await onDelete(goal.id);
    setBusy(false);
    setModal(false);
  }

  function openEdit() {
    setForm({
      title: goal.title,
      target_value: goal.target_value,
      current_value: goal.current_value,
      unit: goal.unit,
      target_date: goal.target_date || '',
    });
    setError('');
    setModal(true);
  }

  return (
    <div className={`goal-card${isCompleted ? ' goal-card--completed' : ''}`}>
      <div className="goal-card-header">
        <div className="goal-card-icon">
          <Target size={18} />
        </div>
        <div className="goal-card-title-wrap">
          <h4 className="goal-card-title">{goal.title}</h4>
          <span className="goal-card-meta">
            {Number(goal.current_value)} / {Number(goal.target_value)} {goal.unit}
            {remaining !== null && !isCompleted && <span className="goal-card-remaining"> · {remaining} days left</span>}
            {isCompleted && <span className="goal-card-badge goal-card-badge--completed">Completed</span>}
          </span>
        </div>
        {editable && !isCompleted && (
          <div className="goal-card-actions">
            <button className="goal-card-btn" onClick={openEdit} aria-label="Edit goal"><Edit2 size={14} /></button>
            <button className="goal-card-btn goal-card-btn--danger" onClick={() => { setForm({ title: goal.title, target_value: goal.target_value, current_value: goal.current_value, unit: goal.unit, target_date: goal.target_date || '' }); setError(''); setModal(true); }} aria-label="Delete goal">
              <Trash2 size={14} />
            </button>
          </div>
        )}
        {isCompleted && <CheckCircle2 size={20} className="goal-card-completed-icon" />}
      </div>

      <div className="goal-card-progress">
        <div className="progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-bar__header">
            <span className="progress-bar__value">{pct}%</span>
          </div>
          <div className="progress-bar__track" style={{ height: 8, borderRadius: 4 }}>
            <div
              className="progress-bar__fill"
              style={{
                borderRadius: 4,
                width: `${pct}%`,
                background: isCompleted ? 'linear-gradient(90deg, var(--emerald), var(--emerald-glow))' : 'linear-gradient(90deg, var(--primary), var(--primary-glow))',
                boxShadow: isCompleted ? '0 0 12px var(--emerald-glow)' : '0 0 12px var(--primary-glow)',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        </div>
      </div>

      <Modal open={modal && editable} onClose={() => setModal(false)} title={isCompleted ? 'View Goal' : 'Update Goal'} size="sm">
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label>Goal Title *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Target Value *</label>
              <input type="number" step="0.1" required value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Current Progress *</label>
              <input type="number" step="0.1" required value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Unit *</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                <option value="kg">kg</option>
                <option value="km">km</option>
                <option value="days">days</option>
                <option value="reps">reps</option>
                <option value="minutes">minutes</option>
                <option value="sessions">sessions</option>
              </select>
            </div>
            <div className="form-group">
              <label>Target Date</label>
              <input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
            </div>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="form-actions">
            {!isCompleted && (
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete} disabled={busy}>
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
