import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import Card       from '../../components/ui/Card';
import Table      from '../../components/ui/Table';
import Badge      from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

export default function TrainerMyTrainees() {
  const { profile } = useAuth();
  const navigate    = useNavigate();

  const { data: trainer } = useSupabaseQuery(() =>
    supabase.from('trainers').select('id').eq('profile_id', profile.id).single(),
  [profile.id]);

  const { data: trainees, loading } = useSupabaseQuery(() => {
    if (!trainer?.id) return Promise.resolve({ data: [], error: null });
    return supabase
      .from('trainees')
      .select('id, date_of_birth, profiles(id,name,email,phone,account_status), memberships(status,plan,end_date)')
      .eq('trainer_id', trainer.id)
      .order('created_at', { ascending: false });
  }, [trainer?.id]);

  const columns = [
    { key: 'name',   label: 'Name',   render: (_, r) => r.profiles?.name  ?? '—' },
    { key: 'email',  label: 'Email',  render: (_, r) => r.profiles?.email ?? '—' },
    { key: 'phone',  label: 'Phone',  render: (_, r) => r.profiles?.phone ?? '—' },
    {
      key: 'membership', label: 'Membership',
      render: (_, r) => {
        const active = (r.memberships ?? []).find(m => m.status === 'active');
        return active ? <Badge status="active" label={active.plan} /> : <Badge status="expired" label="None" />;
      },
    },
    { key: 'status', label: 'Status', render: (_, r) => <Badge status={r.profiles?.account_status} /> },
    {
      key: 'actions', label: '',
      render: (_, r) => (
        <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); navigate(`/trainer/trainees/${r.id}`); }}>
          View
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header"><h2>My Trainees</h2></div>
      <Card padding={false}>
        {!loading && (trainees ?? []).length === 0 ? (
          <EmptyState icon="👥" title="No trainees assigned" message="Contact your admin to assign trainees to you." />
        ) : (
          <Table
            columns={columns}
            data={trainees ?? []}
            loading={loading}
            onRowClick={row => navigate(`/trainer/trainees/${row.id}`)}
          />
        )}
      </Card>
    </div>
  );
}
