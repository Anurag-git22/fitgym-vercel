import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import StatCard  from '../../components/ui/StatCard';
import Card      from '../../components/ui/Card';
import Badge     from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

export default function TraineeDashboard() {
  const { profile } = useAuth();

  /* Get own trainee row */
  const { data: trainee } = useSupabaseQuery(() =>
    supabase.from('trainees').select('id, trainer_id, trainers(profiles(name))').eq('profile_id', profile.id).single(),
  [profile.id]);

  const traineeId = trainee?.id;

  /* Active membership */
  const { data: membership, loading: memLoading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: null, error: null });
    return supabase
      .from('memberships')
      .select('*')
      .eq('trainee_id', traineeId)
      .eq('status', 'active')
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();
  }, [traineeId]);

  /* Attendance summary */
  const { data: attendanceSummary, loading: attLoading } = useSupabaseQuery(async () => {
    if (!traineeId) return { data: null, error: null };
    const { data, error } = await supabase
      .from('attendance')
      .select('status')
      .eq('trainee_id', traineeId);
    if (error) return { data: null, error };
    const present = data.filter(a => a.status === 'present').length;
    const total   = data.length;
    return { data: { present, total, pct: total ? Math.round((present / total) * 100) : 0 }, error: null };
  }, [traineeId]);

  /* Latest payment */
  const { data: latestPayment, loading: payLoading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: null, error: null });
    return supabase
      .from('payments')
      .select('*')
      .eq('trainee_id', traineeId)
      .order('payment_date', { ascending: false })
      .limit(1)
      .maybeSingle();
  }, [traineeId]);

  /* Latest workout */
  const { data: latestWorkout, loading: wkLoading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: null, error: null });
    return supabase
      .from('workouts')
      .select('*')
      .eq('trainee_id', traineeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  }, [traineeId]);

  /* Latest progress */
  const { data: latestProgress } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: null, error: null });
    return supabase
      .from('progress')
      .select('*')
      .eq('trainee_id', traineeId)
      .order('recorded_date', { ascending: false })
      .limit(1)
      .maybeSingle();
  }, [traineeId]);

  /* Days until membership expires */
  const daysLeft = membership?.end_date
    ? Math.max(0, Math.ceil((new Date(membership.end_date) - new Date()) / 86400000))
    : null;

  return (
    <div>
      <div className="stat-grid">
        <StatCard
          label="Membership"
          value={membership ? membership.plan : 'None'}
          icon="🪪"
          color={membership ? 'green' : 'red'}
          loading={memLoading}
        />
        <StatCard
          label="Days Until Expiry"
          value={daysLeft !== null ? daysLeft : '—'}
          icon="📅"
          color={daysLeft !== null && daysLeft < 7 ? 'red' : 'blue'}
          loading={memLoading}
        />
        <StatCard
          label="Attendance Rate"
          value={attendanceSummary ? `${attendanceSummary.pct}%` : '—'}
          icon="📋"
          color="purple"
          loading={attLoading}
        />
        <StatCard
          label="Last Payment"
          value={latestPayment ? `$${Number(latestPayment.amount).toFixed(2)}` : '—'}
          icon="💳"
          color={latestPayment?.payment_status === 'paid' ? 'green' : 'orange'}
          loading={payLoading}
        />
      </div>

      <div className="dashboard-charts">
        {/* Current workout plan */}
        <Card
          title="Current Workout Plan"
          actions={<Link to="/trainee/workout" className="btn btn-secondary btn-sm">View full</Link>}
        >
          {wkLoading ? (
            <div className="spinner" style={{ margin: '1.5rem auto' }} />
          ) : !latestWorkout ? (
            <EmptyState icon="💪" title="No workout assigned yet" message="Your trainer will assign a plan soon." />
          ) : (
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.4rem' }}>{latestWorkout.name}</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                {latestWorkout.duration_minutes ? `${latestWorkout.duration_minutes} min` : ''} · {(latestWorkout.exercises ?? []).length} exercises
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {(latestWorkout.exercises ?? []).slice(0, 4).map((ex, i) => (
                  <li key={i} style={{ fontSize: '0.85rem', color: '#374151', display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: '#6366f1', fontWeight: 700 }}>{i + 1}.</span>
                    <span>{ex.name}</span>
                    {ex.sets && <span style={{ color: '#94a3b8' }}>{ex.sets}×{ex.reps}</span>}
                  </li>
                ))}
                {(latestWorkout.exercises ?? []).length > 4 && (
                  <li style={{ fontSize: '0.8rem', color: '#94a3b8' }}>+{latestWorkout.exercises.length - 4} more…</li>
                )}
              </ul>
            </div>
          )}
        </Card>

        {/* Latest progress */}
        <Card
          title="Latest Progress"
          actions={<Link to="/trainee/progress" className="btn btn-secondary btn-sm">View all</Link>}
        >
          {!latestProgress ? (
            <EmptyState icon="📈" title="No progress recorded yet" />
          ) : (
            <dl className="detail-dl">
              <dt>Date</dt>   <dd>{latestProgress.recorded_date}</dd>
              <dt>Weight</dt> <dd>{latestProgress.weight ? `${latestProgress.weight} kg` : '—'}</dd>
              <dt>Notes</dt>  <dd>{latestProgress.notes ?? '—'}</dd>
            </dl>
          )}
        </Card>

        {/* Trainer info */}
        <Card title="My Trainer">
          {trainee?.trainers?.profiles?.name ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="sidebar-user-avatar" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                {trainee.trainers.profiles.name[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{trainee.trainers.profiles.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Your assigned trainer</div>
              </div>
            </div>
          ) : (
            <EmptyState icon="🏋️" title="No trainer assigned" message="Contact admin to assign a trainer." />
          )}
        </Card>
      </div>
    </div>
  );
}
