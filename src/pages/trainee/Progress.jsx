import { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import Card       from '../../components/ui/Card';
import Chart      from '../../components/ui/Chart';
import Table      from '../../components/ui/Table';
import Modal      from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { Plus } from 'lucide-react';

function calcBMI(weight, heightCm) {
  if (!weight || !heightCm) return null;
  const h = heightCm / 100;
  return weight / (h * h);
}

function bmiLabel(bmi) {
  if (bmi == null) return '—';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

const INIT_FORM = { recorded_date: new Date().toISOString().slice(0,10), weight: '', notes: '' };

export default function TraineeProgress() {
  const { profile } = useAuth();

  const { data: trainee } = useSupabaseQuery(() =>
    supabase.from('trainees').select('id').eq('profile_id', profile.id).single(),
  [profile.id]);

  const traineeId = trainee?.id;
  const heightCm = profile?.height_cm ?? null;

  const { data: records, loading, refetch } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: [], error: null });
    return supabase
      .from('progress')
      .select('*')
      .eq('trainee_id', traineeId)
      .order('recorded_date', { ascending: true });
  }, [traineeId]);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function submitProgress(e) {
    e.preventDefault(); setBusy(true); setError(''); setSuccessMsg('');
    const { error: err } = await supabase.from('progress').insert({
      trainee_id: traineeId,
      weight: form.weight ? Number(form.weight) : null,
      notes: form.notes || null,
      recorded_date: form.recorded_date,
    });
    setBusy(false);
    if (err) { setError(err.message); return; }
    const savedWeight = form.weight ? Number(form.weight) : null;
    const savedBMI = savedWeight && heightCm ? calcBMI(savedWeight, heightCm) : null;
    setSuccessMsg(savedBMI ? `Entry saved! Your BMI is ${Math.round(savedBMI * 10) / 10} (${bmiLabel(savedBMI)})` : 'Entry saved!');
    setModal(false);
    setForm(INIT_FORM);
    refetch();
  }

  const weightChart = useMemo(() =>
    (records ?? []).filter(r => r.weight).map(r => ({ name: r.recorded_date, Weight: Number(r.weight) })),
  [records]);

  const bmiChart = useMemo(() =>
    (records ?? []).filter(r => r.weight && heightCm).map(r => ({ name: r.recorded_date, BMI: Math.round(calcBMI(Number(r.weight), heightCm) * 10) / 10 })),
  [records, heightCm]);

  const columns = [
    { key: 'recorded_date', label: 'Date' },
    { key: 'weight', label: 'Weight', render: v => v ? `${v} kg` : '—' },
    {
      key: 'bmi', label: 'BMI',
      render: (_, r) => {
        const bmi = calcBMI(r.weight, heightCm);
        return bmi ? `${Math.round(bmi * 10) / 10} · ${bmiLabel(bmi)}` : '—';
      }
    },
    {
      key: 'measurements', label: 'Measurements',
      render: v => {
        if (!v || typeof v !== 'object') return '—';
        const parts = [];
        if (v.waist) parts.push(`Waist ${v.waist}cm`);
        if (v.chest) parts.push(`Chest ${v.chest}cm`);
        if (v.arms) parts.push(`Arms ${v.arms}cm`);
        if (v.thighs) parts.push(`Thighs ${v.thighs}cm`);
        return parts.length ? parts.join(', ') : '—';
      },
      hideOnMobile: true
    },
    { key: 'notes', label: 'Notes', render: v => v ?? '—', hideOnMobile: true },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>My Progress</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>
          <Plus size={14} />
          <span>Add Entry</span>
        </button>
      </div>

      <div className="dashboard-charts">
        <Card title="Weight Over Time" subtitle="Track your weight changes" className="chart-card">
          <Chart type="area" data={weightChart} series={[{ key: 'Weight', label: 'Weight (kg)', color: '#6366f1' }]} xKey="name" height={240} loading={loading} />
        </Card>

        <Card title="BMI Trend" subtitle={heightCm ? 'Body Mass Index over time' : 'Set your height in Profile to see BMI'} className="chart-card">
          {bmiChart.length > 0 ? (
            <Chart type="line" data={bmiChart} series={[{ key: 'BMI', label: 'BMI', color: '#06b6d4' }]} xKey="name" height={240} loading={false} />
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {heightCm ? 'Add weight entries to see BMI trend' : 'Set your height in Profile to enable BMI tracking'}
            </div>
          )}
        </Card>
      </div>

      {/* Log table */}
      <Card title="Progress Log" padding={false} style={{ marginTop: '1.5rem' }}>
        {!loading && (records ?? []).length === 0
          ? <EmptyState icon="📈" title="No progress entries yet" message="Log your first body progress entry by clicking Add Entry above." />
          : <Table columns={columns} data={[...(records ?? [])].reverse()} loading={loading} />
        }
      </Card>

      {/* Add Progress Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setSuccessMsg(''); }} title="Log Body Progress" size="md">
        <form onSubmit={submitProgress} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input type="date" required value={form.recorded_date} onChange={e => setForm(f => ({ ...f, recorded_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Weight (kg) *</label>
              <input type="number" step="0.1" required value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="70.5" />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." rows={2} style={{ resize: 'vertical' }} />
          </div>
          {error && <div className="auth-error">{error}</div>}
          {successMsg && <div className="auth-success">{successMsg}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => { setModal(false); setSuccessMsg(''); }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save Entry'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
