import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import Card       from '../../components/ui/Card';
import Table      from '../../components/ui/Table';
import Badge      from '../../components/ui/Badge';
import StatCard   from '../../components/ui/StatCard';
import Chart      from '../../components/ui/Chart';
import EmptyState from '../../components/ui/EmptyState';

export default function TraineeAttendance() {
  const { profile } = useAuth();

  const { data: trainee } = useSupabaseQuery(() =>
    supabase.from('trainees').select('id').eq('profile_id', profile.id).single(),
  [profile.id]);

  const traineeId = trainee?.id;

  const { data: records, loading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: [], error: null });
    return supabase
      .from('attendance')
      .select('*')
      .eq('trainee_id', traineeId)
      .order('date', { ascending: false });
  }, [traineeId]);

  const present = (records ?? []).filter(r => r.status === 'present').length;
  const absent  = (records ?? []).filter(r => r.status === 'absent').length;
  const total   = (records ?? []).length;
  const pct     = total ? Math.round((present / total) * 100) : 0;

  /* Monthly chart data */
  const chartData = (() => {
    const map = {};
    (records ?? []).forEach(r => {
      const m = r.date?.slice(0, 7) ?? 'Unknown';
      if (!map[m]) map[m] = { name: m, Present: 0, Absent: 0 };
      map[m][r.status === 'present' ? 'Present' : 'Absent']++;
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name)).slice(-6);
  })();

  const columns = [
    { key: 'date',          label: 'Date' },
    { key: 'status',        label: 'Status',   render: v => <Badge status={v} /> },
    { key: 'check_in_time', label: 'Check-in', render: v => v ? new Date(v).toLocaleTimeString() : '—' },
  ];

  return (
    <div>
      <div className="page-header"><h2>My Attendance</h2></div>

      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard label="Attendance Rate" value={`${pct}%`}   icon="📊" color="blue"  loading={loading} />
        <StatCard label="Days Present"    value={present}      icon="✅" color="green" loading={loading} />
        <StatCard label="Days Absent"     value={absent}       icon="❌" color="red"   loading={loading} />
        <StatCard label="Total Sessions"  value={total}        icon="📋" color="purple" loading={loading} />
      </div>

      {/* Monthly chart */}
      <Card title="Monthly Attendance" style={{ marginBottom: '1.5rem' }}>
        <Chart
          type="bar"
          data={chartData}
          series={[
            { key: 'Present', label: 'Present', color: '#10b981' },
            { key: 'Absent',  label: 'Absent',  color: '#ef4444' },
          ]}
          xKey="name"
          height={240}
          loading={loading}
        />
      </Card>

      {/* Log table */}
      <Card title="Attendance Log" padding={false}>
        {!loading && (records ?? []).length === 0
          ? <EmptyState icon="📋" title="No attendance records yet" />
          : <Table columns={columns} data={records ?? []} loading={loading} emptyMsg="No records." />
        }
      </Card>
    </div>
  );
}
