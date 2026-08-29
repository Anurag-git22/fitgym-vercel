import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useSupabaseQuery } from '../../hooks/useSupabaseQuery';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Chart from '../../components/ui/Chart';
import Badge from '../../components/ui/Badge';
import QuickActionCard from '../../components/ui/QuickActionCard';
import Table from '../../components/ui/Table';
import ThreeDHero from '../../components/3d/ThreeDHero';
import {
  Users,
  UserCheck,
  IdCard,
  IndianRupee,
  Clock,
  CalendarCheck,
  UserPlus,
  PlusCircle,
  CreditCard,
  ClipboardList,
  ArrowUpRight,
  TrendingUp,
  PieChart
} from 'lucide-react';

function fmt(n) { return n?.toLocaleString() ?? '0'; }
function currency(n) { return `₹${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`; }
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
      data: Object.entries(counts).map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        Count: count
      })),
      error: null,
    };
  }, []);

  const { data: recentPayments, loading: payLoading } = useSupabaseQuery(async () => {
    return supabase
      .from('payments')
      .select('id, amount, payment_date, payment_status, trainees(profiles(name, email))')
      .order('created_at', { ascending: false })
      .limit(6);
  }, []);

  const recentCols = [
    {
      key: 'trainee', label: 'Trainee / Member',
      render: (_, r) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {r.trainees?.profiles?.name ?? 'Anonymous Trainee'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {r.trainees?.profiles?.email ?? ''}
          </span>
        </div>
      ),
    },
    { key: 'amount', label: 'Amount', render: v => <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{currency(v)}</span> },
    { key: 'payment_date', label: 'Payment Date', render: v => v },
    { key: 'payment_status', label: 'Status', render: v => <Badge status={v} /> },
    {
      key: 'actions', label: '',
      hideOnMobile: true,
      render: (_, r) => (
        <Link to="/admin/payments" className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.6rem' }}>
          Details
        </Link>
      ),
    },
  ];

  const attendanceRate = useMemo(() => {
    if (!stats?.trainees) return '88%';
    const pct = Math.round(((stats.todayAttendance || 0) / (stats.trainees || 1)) * 100);
    return `${pct}%`;
  }, [stats]);

  return (
    <div>
      {/* ── 3D Interactive Hero Section ──────────────────────── */}
      <section className="dashboard-hero-section">
        <div className="hero-content-left">
          <div className="hero-pill-tag">
            <span className="hero-pill-dot" />
            <span>FitGym Intelligence ERP</span>
          </div>
          <h2 className="hero-title">
            Welcome back, <span className="hero-title-highlight">Admin</span>
          </h2>
          <p className="hero-description">
            Here is a high-level operational overview of your gym performance, trainee check-ins, and active cash flows today.
          </p>

          <div className="hero-stats-row">
            <div className="hero-stat-item">
              <span className="hero-stat-val">{currency(stats?.revenue)}</span>
              <span className="hero-stat-lbl">Total Cashflow</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-val">{fmt(stats?.memberships)}</span>
              <span className="hero-stat-lbl">Active Memberships</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-val">{attendanceRate}</span>
              <span className="hero-stat-lbl">Daily Attendance</span>
            </div>
          </div>
        </div>

        {/* 3D Model with Floating HUD Cards */}
        <ThreeDHero
          attendancePct={attendanceRate}
          status="Operating Peak"
          activeMembers={stats?.trainees ?? 0}
        />
      </section>

      {/* ── KPI Stat Cards Grid ──────────────────────────────── */}
      <div className="stat-grid">
        <StatCard
          label="Total Trainees"
          value={fmt(stats?.trainees)}
          icon={<Users size={22} />}
          color="blue"
          trend={12}
          loading={statsLoading}
        />
        <StatCard
          label="Total Trainers"
          value={fmt(stats?.trainers)}
          icon={<UserCheck size={22} />}
          color="purple"
          trend={5}
          loading={statsLoading}
        />
        <StatCard
          label="Active Memberships"
          value={fmt(stats?.memberships)}
          icon={<IdCard size={22} />}
          color="green"
          trend={18}
          loading={statsLoading}
        />
        <StatCard
          label="Total Revenue"
          value={currency(stats?.revenue)}
           icon={<IndianRupee size={22} />}
          color="orange"
          trend={24}
          loading={statsLoading}
        />
        <StatCard
          label="Pending Payments"
          value={fmt(stats?.pending)}
          icon={<Clock size={22} />}
          color="red"
          loading={statsLoading}
        />
        <StatCard
          label="Today's Attendance"
          value={fmt(stats?.todayAttendance)}
          icon={<CalendarCheck size={22} />}
          color="blue"
          trend={8}
          loading={statsLoading}
        />
      </div>

      {/* ── Quick Actions Row ────────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Operational Shortcuts</h3>
          <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>Quick management actions</span>
        </div>
        <div className="quick-actions-grid">
          <QuickActionCard
            to="/admin/trainees"
            icon={<UserPlus size={20} />}
            title="Register Trainee"
            description="Onboard new gym member"
          />
          <QuickActionCard
            to="/admin/trainers"
            icon={<PlusCircle size={20} />}
            title="Add Trainer"
            description="Assign gym staff & trainer"
          />
          <QuickActionCard
            to="/admin/memberships"
            icon={<IdCard size={20} />}
            title="Create Membership"
            description="Assign subscription plan"
          />
          <QuickActionCard
            to="/admin/payments"
            icon={<CreditCard size={20} />}
            title="Record Payment"
            description="Process invoice & billing"
          />
        </div>
      </div>

      {/* ── Analytics Charts ─────────────────────────────────── */}
      <div className="dashboard-charts">
        <Card
          title="Revenue Overview"
          subtitle="Monthly cash collection trends (last 6 months)"
          icon={<TrendingUp size={18} />}
          className="chart-card"
          actions={
            <Link to="/admin/analytics" className="btn btn-secondary btn-sm">
              <span>Full Analytics</span>
              <ArrowUpRight size={14} />
            </Link>
          }
        >
          <Chart
            type="area"
            data={revenueChart ?? []}
            series={[{ key: 'Revenue', label: 'Gross Revenue (₹)', color: '#06b6d4' }]}
            xKey="name"
            height={260}
            loading={chartLoading}
          />
        </Card>

        <Card
          title="Membership Distribution"
          subtitle="Active vs Expired vs Cancelled plans"
          icon={<PieChart size={18} />}
          className="chart-card"
          actions={
            <Link to="/admin/memberships" className="btn btn-secondary btn-sm">
              <span>View Plans</span>
              <ArrowUpRight size={14} />
            </Link>
          }
        >
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

      {/* ── Recent Payments Table ────────────────────────────── */}
      <Card
        title="Recent Billing & Transactions"
        subtitle="Real-time payment logs and member invoices"
        icon={<ClipboardList size={18} />}
        actions={
          <Link to="/admin/payments" className="btn btn-secondary btn-sm">
            <span>View All Payments</span>
            <ArrowUpRight size={14} />
          </Link>
        }
      >
        {payLoading ? (
          <div className="spinner" style={{ margin: '2rem auto' }} />
        ) : (
          <Table columns={recentCols} data={recentPayments ?? []} loading={payLoading} emptyMsg="No payment transactions recorded yet." />
        )}
      </Card>
    </div>
  );
}
