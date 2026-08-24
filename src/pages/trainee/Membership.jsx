import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import Card       from '../../components/ui/Card';
import Badge      from '../../components/ui/Badge';
import Table      from '../../components/ui/Table';
import EmptyState from '../../components/ui/EmptyState';

export default function TraineeMembership() {
  const { profile } = useAuth();

  const { data: trainee } = useSupabaseQuery(() =>
    supabase.from('trainees').select('id').eq('profile_id', profile.id).single(),
  [profile.id]);

  const traineeId = trainee?.id;

  const { data: memberships, loading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: [], error: null });
    return supabase
      .from('memberships')
      .select('*')
      .eq('trainee_id', traineeId)
      .order('start_date', { ascending: false });
  }, [traineeId]);

  const active = (memberships ?? []).find(m => m.status === 'active');

  const daysLeft = active?.end_date
    ? Math.max(0, Math.ceil((new Date(active.end_date) - new Date()) / 86400000))
    : null;

  const histCols = [
    { key: 'plan',       label: 'Plan' },
    { key: 'start_date', label: 'Start' },
    { key: 'end_date',   label: 'End' },
    { key: 'status',     label: 'Status', render: v => <Badge status={v} /> },
  ];

  return (
    <div>
      <div className="page-header"><h2>My Membership</h2></div>

      {/* Active membership hero */}
      {loading ? (
        <div className="spinner" style={{ margin: '2rem auto' }} />
      ) : active ? (
        <div className="membership-hero">
          <div className="membership-hero-left">
            <div className="membership-plan-name">{active.plan}</div>
            <div className="membership-plan-label">Active Membership</div>
            <dl className="detail-dl" style={{ marginTop: '1rem' }}>
              <dt>Start</dt> <dd>{active.start_date}</dd>
              <dt>End</dt>   <dd>{active.end_date}</dd>
              <dt>Status</dt><dd><Badge status={active.status} /></dd>
            </dl>
          </div>
          <div className="membership-hero-right">
            <div className="membership-days-circle">
              <span className="membership-days-num">{daysLeft}</span>
              <span className="membership-days-label">days left</span>
            </div>
            {daysLeft !== null && daysLeft <= 7 && (
              <div className="banner banner--error" style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                Expiring soon! Contact admin to renew.
              </div>
            )}
          </div>
        </div>
      ) : (
        <Card style={{ marginBottom: '1.5rem' }}>
          <EmptyState icon="🪪" title="No active membership" message="Contact your gym admin to set up a membership plan." />
        </Card>
      )}

      {/* History */}
      <Card title="Membership History" padding={false} style={{ marginTop: '1.5rem' }}>
        <Table columns={histCols} data={memberships ?? []} loading={loading} emptyMsg="No membership history." />
      </Card>
    </div>
  );
}
