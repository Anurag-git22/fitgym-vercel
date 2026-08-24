import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import Card     from '../../components/ui/Card';
import Badge    from '../../components/ui/Badge';

function today() { return new Date().toISOString().slice(0, 10); }

export default function TrainerDashboard() {
  const { profile } = useAuth();

  /* Get the trainer row for this profile */
  const { data: trainer } = useSupabaseQuery(() =>
    supabase.from('trainers').select('id').eq('profile_id', profile.id).single(),
  [profile.id]);

  const trainerId = trainer?.id;

  const { data: stats, loading: statsLoading } = useSupabaseQuery(async () => {
    if (!trainerId) return { data: null, error: null };
    const [trainees, attendance, workouts] = await Promise.all([
      supabase.from('trainees').select('id', { count: 'exact', head: true }).eq('trainer_id', trainerId),
      supabase.from('attendance')
        .select('id', { count: 'exact', head: true })
        .eq('date', today())
        .eq('status', 'present')
        .in('trainee_id',
          (await supabase.from('trainees').select('id').eq('trainer_id', trainerId)).data?.map(t => t.id) ?? []
        ),
      supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('trainer_id', trainerId),
    ]);
    return {
      data: {
        trainees:   trainees.count   ?? 0,
        attendance: attendance.count ?? 0,
        workouts:   workouts.count   ?? 0,
      },
      error: null,
    };
  }, [trainerId]);

  const { data: recentProgress, loading: progLoading } = useSupabaseQuery(async () => {
    if (!trainerId) return { data: [], error: null };
    const { data: tids } = await supabase.from('trainees').select('id').eq('trainer_id', trainerId);
    const ids = tids?.map(t => t.id) ?? [];
    if (!ids.length) return { data: [], error: null };
    return supabase
      .from('progress')
      .select('*, trainees(profiles(name))')
      .in('trainee_id', ids)
      .order('recorded_date', { ascending: false })
      .limit(5);
  }, [trainerId]);

  const { data: todayAttendance, loading: attLoading } = useSupabaseQuery(async () => {
    if (!trainerId) return { data: [], error: null };
    const { data: tids } = await supabase.from('trainees').select('id').eq('trainer_id', trainerId);
    const ids = tids?.map(t => t.id) ?? [];
    if (!ids.length) return { data: [], error: null };
    return supabase
      .from('attendance')
      .select('*, trainees(profiles(name))')
      .in('trainee_id', ids)
      .eq('date', today());
  }, [trainerId]);

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="My Trainees"          value={stats?.trainees   ?? '—'} icon="👥" color="blue"   loading={statsLoading} />
        <StatCard label="Present Today"        value={stats?.attendance ?? '—'} icon="📋" color="green"  loading={statsLoading} />
        <StatCard label="Active Workout Plans" value={stats?.workouts   ?? '—'} icon="💪" color="purple" loading={statsLoading} />
      </div>

      <div className="dashboard-charts">
        {/* Today's attendance */}
        <Card
          title="Today's Attendance"
          actions={<Link to="/trainer/attendance" className="btn btn-secondary btn-sm">View all</Link>}
        >
          {attLoading ? (
            <div className="spinner" style={{ margin: '1.5rem auto' }} />
          ) : (todayAttendance ?? []).length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>No attendance marked yet today.</p>
          ) : (
            <ul className="simple-list">
              {(todayAttendance ?? []).map(a => (
                <li key={a.id} className="simple-list-item">
                  <span>{a.trainees?.profiles?.name ?? '—'}</span>
                  <Badge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent progress */}
        <Card
          title="Recent Progress Updates"
          actions={<Link to="/trainer/progress" className="btn btn-secondary btn-sm">View all</Link>}
        >
          {progLoading ? (
            <div className="spinner" style={{ margin: '1.5rem auto' }} />
          ) : (recentProgress ?? []).length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>No progress entries yet.</p>
          ) : (
            <ul className="simple-list">
              {(recentProgress ?? []).map(p => (
                <li key={p.id} className="simple-list-item">
                  <span>{p.trainees?.profiles?.name ?? '—'}</span>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    {p.weight ? `${p.weight} kg` : '—'} · {p.recorded_date}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
