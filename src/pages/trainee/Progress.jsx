import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import Card       from '../../components/ui/Card';
import Table      from '../../components/ui/Table';
import Chart      from '../../components/ui/Chart';
import EmptyState from '../../components/ui/EmptyState';

export default function TraineeProgress() {
  const { profile } = useAuth();

  const { data: trainee } = useSupabaseQuery(() =>
    supabase.from('trainees').select('id').eq('profile_id', profile.id).single(),
  [profile.id]);

  const traineeId = trainee?.id;

  const { data: records, loading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: [], error: null });
    return supabase
      .from('progress')
      .select('*')
      .eq('trainee_id', traineeId)
      .order('recorded_date', { ascending: true });
  }, [traineeId]);

  /* Weight-over-time chart */
  const weightChart = (records ?? [])
    .filter(r => r.weight)
    .map(r => ({ name: r.recorded_date, Weight: Number(r.weight) }));

  const columns = [
    { key: 'recorded_date', label: 'Date' },
    { key: 'weight',        label: 'Weight',       render: v => v ? `${v} kg` : '—' },
    { key: 'measurements',  label: 'Measurements', render: v => v ? (typeof v === 'object' ? JSON.stringify(v) : v) : '—', hideOnMobile: true },
    { key: 'notes',         label: 'Notes',        render: v => v ?? '—', hideOnMobile: true },
  ];

  return (
    <div>
      <div className="page-header"><h2>My Progress</h2></div>

      {/* Weight chart */}
      <Card title="Weight Over Time" style={{ marginBottom: '1.5rem' }}>
        <Chart
          type="line"
          data={weightChart}
          series={[{ key: 'Weight', label: 'Weight (kg)', color: '#6366f1' }]}
          xKey="name"
          height={240}
          loading={loading}
        />
      </Card>

      {/* Log table */}
      <Card title="Progress Log" padding={false}>
        {!loading && (records ?? []).length === 0
          ? <EmptyState icon="📈" title="No progress entries yet" message="Your trainer will log your progress after each session." />
          : <Table columns={[...columns].reverse().slice(0, 4).reverse()} data={[...(records ?? [])].reverse()} loading={loading} />
        }
      </Card>
    </div>
  );
}
