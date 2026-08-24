import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import Card       from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';

export default function TraineeWorkout() {
  const { profile } = useAuth();
  const [selected, setSelected] = useState(null);

  const { data: trainee } = useSupabaseQuery(() =>
    supabase.from('trainees').select('id').eq('profile_id', profile.id).single(),
  [profile.id]);

  const traineeId = trainee?.id;

  const { data: workouts, loading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: [], error: null });
    return supabase
      .from('workouts')
      .select('*, trainers(profiles(name))')
      .eq('trainee_id', traineeId)
      .order('created_at', { ascending: false });
  }, [traineeId]);

  const current = selected ?? workouts?.[0] ?? null;

  if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />;

  if (!workouts?.length) {
    return (
      <div>
        <div className="page-header"><h2>My Workout</h2></div>
        <Card><EmptyState icon="💪" title="No workout plans assigned yet" message="Your trainer will add a workout plan for you." /></Card>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header"><h2>My Workout</h2></div>

      <div className="workout-layout">
        {/* Plan selector (if multiple) */}
        {workouts.length > 1 && (
          <Card title="Plans" style={{ minWidth: 200 }}>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {workouts.map(w => (
                <li key={w.id}>
                  <button
                    onClick={() => setSelected(w)}
                    className={`plan-selector-btn${current?.id === w.id ? ' plan-selector-btn--active' : ''}`}
                  >
                    {w.name}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Plan detail */}
        <Card title={current?.name} subtitle={`Assigned by ${current?.trainers?.profiles?.name ?? '—'} · ${current?.duration_minutes ? current.duration_minutes + ' min' : ''}`} style={{ flex: 1 }}>
          {current?.notes && (
            <div className="banner banner--info" style={{ marginBottom: '1rem' }}>{current.notes}</div>
          )}

          <div className="workout-exercise-list">
            {(current?.exercises ?? []).length === 0 ? (
              <p style={{ color: '#94a3b8', margin: 0 }}>No exercises in this plan yet.</p>
            ) : (current.exercises).map((ex, i) => (
              <div key={i} className="workout-exercise-card">
                <div className="workout-exercise-num">{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div className="workout-exercise-name">{ex.name}</div>
                  <div className="workout-exercise-meta">
                    {ex.sets   && <span><strong>{ex.sets}</strong> sets</span>}
                    {ex.reps   && <span><strong>{ex.reps}</strong> reps</span>}
                    {ex.weight && <span><strong>{ex.weight}</strong> kg</span>}
                    {ex.notes  && <span style={{ color: '#94a3b8' }}>{ex.notes}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
