import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import Card    from '../../components/ui/Card';
import Chart   from '../../components/ui/Chart';
import StatCard from '../../components/ui/StatCard';

function currency(n) { return `₹${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`; }

export default function AdminAnalytics() {
  /* Revenue per month */
  const { data: revenueData, loading: revLoading } = useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('amount, payment_date, payment_status')
      .eq('payment_status', 'paid');
    if (error) return { data: null, error };
    const map = {};
    (data ?? []).forEach(p => {
      const m = p.payment_date?.slice(0, 7) ?? 'Unknown';
      map[m] = (map[m] ?? 0) + Number(p.amount);
    });
    return {
      data: Object.entries(map).sort().map(([name, Revenue]) => ({ name, Revenue })),
      error: null,
    };
  }, []);

  /* Attendance per month */
  const { data: attendanceData, loading: attLoading } = useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select('date, status');
    if (error) return { data: null, error };
    const map = {};
    (data ?? []).forEach(r => {
      const m = r.date?.slice(0, 7) ?? 'Unknown';
      if (!map[m]) map[m] = { name: m, Present: 0, Absent: 0 };
      map[m][r.status === 'present' ? 'Present' : 'Absent']++;
    });
    return {
      data: Object.values(map).sort((a, b) => a.name.localeCompare(b.name)),
      error: null,
    };
  }, []);

  /* Membership plan distribution */
  const { data: planData, loading: planLoading } = useSupabaseQuery(async () => {
    const { data, error } = await supabase.from('memberships').select('plan');
    if (error) return { data: null, error };
    const map = {};
    (data ?? []).forEach(m => { map[m.plan] = (map[m.plan] ?? 0) + 1; });
    return {
      data: Object.entries(map).map(([name, Count]) => ({ name, Count })),
      error: null,
    };
  }, []);

  /* Aggregate KPIs */
  const { data: kpis, loading: kpiLoading } = useSupabaseQuery(async () => {
    const [payments, trainees, memberships] = await Promise.all([
      supabase.from('payments').select('amount, payment_status'),
      supabase.from('trainees').select('id', { count: 'exact', head: true }),
      supabase.from('memberships').select('status'),
    ]);
    const paid    = (payments.data ?? []).filter(p => p.payment_status === 'paid');
    const pending = (payments.data ?? []).filter(p => p.payment_status === 'pending');
    const totalRevenue = paid.reduce((s, p) => s + Number(p.amount), 0);
    const pendingAmt   = pending.reduce((s, p) => s + Number(p.amount), 0);
    const activeM = (memberships.data ?? []).filter(m => m.status === 'active').length;
    return {
      data: { totalRevenue, pendingAmt, activeM, trainees: trainees.count ?? 0 },
      error: null,
    };
  }, []);

  return (
    <div>
      <div className="page-header"><h2>Analytics</h2></div>

      <div className="stat-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <StatCard label="Total Revenue"      value={currency(kpis?.totalRevenue)}  icon="💰" color="green"  loading={kpiLoading} />
        <StatCard label="Pending Revenue"    value={currency(kpis?.pendingAmt)}    icon="⏳" color="orange" loading={kpiLoading} />
        <StatCard label="Active Memberships" value={kpis?.activeM ?? '—'}          icon="🪪" color="blue"   loading={kpiLoading} />
        <StatCard label="Total Trainees"     value={kpis?.trainees ?? '—'}         icon="👥" color="purple" loading={kpiLoading} />
      </div>

      <div className="analytics-grid">
        <Card title="Monthly Revenue" subtitle="Paid payments aggregated by month">
          <Chart
            type="bar"
            data={revenueData ?? []}
            series={[{ key: 'Revenue', label: 'Revenue (₹)', color: '#10b981' }]}
            xKey="name"
            height={280}
            loading={revLoading}
          />
        </Card>

        <Card title="Monthly Attendance">
          <Chart
            type="bar"
            data={attendanceData ?? []}
            series={[
              { key: 'Present', label: 'Present', color: '#6366f1' },
              { key: 'Absent',  label: 'Absent',  color: '#ef4444' },
            ]}
            xKey="name"
            height={280}
            loading={attLoading}
          />
        </Card>

        <Card title="Membership Plans Distribution">
          <Chart
            type="bar"
            data={planData ?? []}
            series={[{ key: 'Count', label: 'Members', color: '#f59e0b' }]}
            xKey="name"
            height={260}
            loading={planLoading}
          />
        </Card>
      </div>
    </div>
  );
}
