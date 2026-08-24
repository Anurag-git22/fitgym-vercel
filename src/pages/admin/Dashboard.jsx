import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import StatCard   from '../../components/ui/StatCard';
import Card       from '../../components/ui/Card';
import Chart      from '../../components/ui/Chart';
import Badge      from '../../components/ui/Badge';

function fmt(n) { return n?.toLocaleString() ?? '0'; }
function currency(n) { return `$${Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`; }
function today() { return new Date().toISOString().slice(0, 10); }

export default function AdminDashboard() {
  const { data: stats, loading: statsLoading } = useSupabaseQuery(async () => {
    const [trainees, trainers, memberships, payments, attendance] = await Promise.all([
      supabase.from('trainees').select('id', { count: 'exact', head: true }),
      supabase.from('trainers').select('id', { count: 'exact', head: true }),
      supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('payments').select('amount, payment_status'),
      supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today()).eq('status', 'present'),
    ]);
    const revenue = payments.data?.filter(p => p.payment_status === 'paid').reduce((s, p) => s + Number(p.amount), 0) ?? 0;
    const pending = payments.data?.filter(p => p.payment_status === 'pending').length ?? 0;
    return {
      data: {
        trainees:    trainees.count ?? 0,
        trainers:    trainers.count ?? 0,
        memberships: memberships.count ?? 0,
        revenue,
        pending,
        todayAttendance: attendance.count ?? 0,
      },
      error: null,
    };
  }, []);

  const { data: revenueChart, loading: chartLoading } = useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('amount, payment_date, payment_status')
      .eq('payment_status', 'paid')
      .order('payment_date', { ascending: true });
    if (error) return { data: null, error };
    // Aggregate by month
    const byMonth = {};
    (data ?? []).forEach(p => {
      const m = p.payment_date?.slice(0, 7);
      if (m) byMonth[m] = (byMonth[m] ?? 0) + Number(p.amount);
    });
    const chartData = Object.entries(byMonth).slice(-6).map(([month, revenue]) => ({
      name: month,
      Revenue: revenue,
    }));
    return { data: chartData, error: null };
  }, []);

  const { data: membershipChart, loading: memChartLoading } = useSupabaseQuery(async () => {
    const { data, error } = await supabase.from('memberships').select('status');
    if (error) return { data: null, error };
    const counts = { active: 0, expired: 0, cancelled: 0 };
    (data ?? []).forEach(m => { counts[m.status] = (counts[m.status] ?? 0) + 1; });
    return {
      data: Object.entries(counts).map(([name, count]) => ({ name, Count: count })),
      error: null,
    };
  }, []);

  const { data: recentPayments, loading: payLoading } = useSupabaseQuery(async () => {
    return supabase
      .from('payments')
      .select('id, amount, payment_date, payment_status, trainees(profiles(name))')
      .order('created_at', { ascending: false })
      .limit(5);
  }, []);

  return (
    <div>
      {/* Stat cards */}
      <div className="stat-grid">
        <StatCard label="Total Trainees"       value={fmt(stats?.trainees)}        icon="👥" color="blue"   loading={statsLoading} />
        <StatCard label="Total Trainers"        value={fmt(stats?.trainers)}         icon="🏋️" color="purple" loading={statsLoading} />
        <StatCard label="Active Memberships"    value={fmt(stats?.memberships)}      icon="🪪" color="green"  loading={statsLoading} />
        <StatCard label="Total Revenue"         value={currency(stats?.revenue)}     icon="💰" color="orange" loading={statsLoading} />
        <StatCard label="Pending Payments"      value={fmt(stats?.pending)}          icon="⏳" color="red"    loading={statsLoading} />
        <StatCard label="Today's Attendance"    value={fmt(stats?.todayAttendance)}  icon="📋" color="blue"   loading={statsLoading} />
      </div>

      {/* Charts */}
      <div className="dashboard-charts">
        <Card title="Revenue (last 6 months)" className="chart-card">
          <Chart
            type="bar"
            data={revenueChart ?? []}
            series={[{ key: 'Revenue', label: 'Revenue ($)' }]}
            xKey="name"
            height={260}
            loading={chartLoading}
          />
        </Card>
        <Card title="Membership Status" className="chart-card">
          <Chart
            type="bar"
            data={membershipChart ?? []}
            series={[{ key: 'Count', label: 'Members', color: '#6366f1' }]}
            xKey="name"
            height={260}
            loading={memChartLoading}
          />
        </Card>
      </div>

      {/* Recent payments */}
      <Card
        title="Recent Payments"
        actions={<Link to="/admin/payments" className="btn btn-secondary btn-sm">View all</Link>}
      >
        {payLoading ? (
          <div className="spinner" style={{ margin: '2rem auto' }} />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trainee</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(recentPayments ?? []).length === 0 ? (
                  <tr><td colSpan={4} className="table-empty">No payments yet.</td></tr>
                ) : (recentPayments ?? []).map(p => (
                  <tr key={p.id}>
                    <td>{p.trainees?.profiles?.name ?? '—'}</td>
                    <td>{currency(p.amount)}</td>
                    <td>{p.payment_date}</td>
                    <td><Badge status={p.payment_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
