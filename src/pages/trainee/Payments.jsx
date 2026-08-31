import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import { useAuth } from '../../context/AuthContext';
import Card      from '../../components/ui/Card';
import Table     from '../../components/ui/Table';
import Badge     from '../../components/ui/Badge';
import StatCard  from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';

function currency(n) { return `₹${Number(n ?? 0).toFixed(2)}`; }

export default function TraineePayments() {
  const { profile } = useAuth();

  const { data: trainee } = useSupabaseQuery(() =>
    supabase.from('trainees').select('id').eq('profile_id', profile.id).single(),
  [profile.id]);

  const traineeId = trainee?.id;

  const { data: payments, loading } = useSupabaseQuery(() => {
    if (!traineeId) return Promise.resolve({ data: [], error: null });
    return supabase
      .from('payments')
      .select('*, memberships(plan)')
      .eq('trainee_id', traineeId)
      .order('payment_date', { ascending: false });
  }, [traineeId]);

  const totalPaid    = (payments ?? []).filter(p => p.payment_status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = (payments ?? []).filter(p => p.payment_status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const lastPayment  = (payments ?? [])[0];

  const columns = [
    { key: 'payment_date',   label: 'Date' },
    { key: 'memberships',    label: 'Plan',   render: (_, r) => r.memberships?.plan ?? '—', hideOnMobile: true },
    { key: 'amount',         label: 'Amount', render: v => currency(v) },
    { key: 'payment_status', label: 'Status', render: v => <Badge status={v} /> },
  ];

  return (
    <div>
      <div className="page-header"><h2>My Payments</h2></div>

      <div className="stat-grid stat-grid--2" style={{ marginBottom: '1.5rem' }}>
        <StatCard label="Total Paid"    value={currency(totalPaid)}    icon="✅" color="green"  loading={loading} />
        <StatCard label="Pending"       value={currency(totalPending)} icon="⏳" color="orange" loading={loading} />
        <StatCard label="Last Payment"  value={lastPayment ? currency(lastPayment.amount) : '—'} icon="💳" color="blue" loading={loading} />
        <StatCard label="Last Status"   value={lastPayment?.payment_status ?? '—'} icon="📋"
          color={lastPayment?.payment_status === 'paid' ? 'green' : lastPayment?.payment_status === 'failed' ? 'red' : 'orange'}
          loading={loading}
        />
      </div>

      <Card title="Payment History" padding={false}>
        {!loading && (payments ?? []).length === 0
          ? <EmptyState icon="💳" title="No payment records" message="Payments recorded by admin will appear here." />
          : <Table columns={columns} data={payments ?? []} loading={loading} emptyMsg="No payments." />
        }
      </Card>
    </div>
  );
}
