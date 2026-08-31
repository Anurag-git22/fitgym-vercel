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
  PieChart,
  AlertTriangle,
  UserPlus as UserPlusIcon,
  Activity
} from 'lucide-react';

function fmt(n) { return n?.toLocaleString() ?? '0'; }
function currency(n) { return `₹${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`; }
function today() { return new Date().toISOString().slice(0, 10); }
function daysLeft(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  return diff;
}

export default function AdminDashboard() {
  const { data: stats, loading: statsLoading, error: statsError } = useSupabaseQuery(async () => {
    try {
      const [traineesRes, trainersRes, membershipsRes, paymentsRes, attendanceRes] = await Promise.all([
        supabase.from('trainees').select('id', { count: 'exact', head: true }),
        supabase.from('trainers').select('id', { count: 'exact', head: true }),
        supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('payments').select('amount, payment_status'),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today()).eq('status', 'present'),
      ]);
      const paymentsData = paymentsRes.data ?? [];
      const revenue = paymentsData.filter(p => p.payment_status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
      const pending = paymentsData.filter(p => p.payment_status === 'pending').length;
      return {
        data: {
          trainees:    traineesRes.count ?? 0,
          trainers:    trainersRes.count ?? 0,
          memberships: membershipsRes.count ?? 0,
          revenue,
          pending,
          todayAttendance: attendanceRes.count ?? 0,
        },
        error: null,
      };
    } catch (e) {
      console.error('Stats query failed:', e);
      return { data: null, error: e };
    }
  }, []);

  const { data: revenueChart, loading: chartLoading, error: chartError } = useSupabaseQuery(async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('amount, payment_date, payment_status')
        .eq('payment_status', 'paid')
        .order('payment_date', { ascending: true });
      if (error) throw error;
      const byMonth = {};
      (data ?? []).forEach(p => {
        const m = p.payment_date?.slice(0, 7);
        if (m) byMonth[m] = (byMonth[m] ?? 0) + Number(p.amount);
      });
      return {
        data: Object.entries(byMonth).slice(-6).map(([month, revenue]) => ({ name: month, Revenue: revenue })),
        error: null,
      };
    } catch (e) {
      console.error('Revenue chart query failed:', e);
      return { data: null, error: e };
    }
  }, []);

  const { data: membershipChart, loading: memChartLoading, error: memChartError } = useSupabaseQuery(async () => {
    try {
      const { data, error } = await supabase.from('memberships').select('status');
      if (error) throw error;
      const counts = { active: 0, expired: 0, cancelled: 0 };
      (data ?? []).forEach(m => { counts[m.status] = (counts[m.status] ?? 0) + 1; });
      return {
        data: Object.entries(counts).map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), Count: count })),
        error: null,
      };
    } catch (e) {
      console.error('Membership chart query failed:', e);
      return { data: null, error: e };
    }
  }, []);

  const { data: recentPayments, loading: payLoading, error: payError } = useSupabaseQuery(async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('id, amount, payment_date, payment_status, trainees(profiles(name, email))')
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      console.error('Recent payments query failed:', e);
      return { data: null, error: e };
    }
  }, []);

  const { data: newMembers, loading: newMembersLoading, error: newMembersError } = useSupabaseQuery(async () => {
    try {
      const { data, error } = await supabase
        .from('trainees')
        .select('id, created_at, profiles(name, email, phone)')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      console.error('New members query failed:', e);
      return { data: null, error: e };
    }
  }, []);

  const { data: expiringMemberships, loading: expiringLoading, error: expiringError } = useSupabaseQuery(async () => {
    try {
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('memberships')
        .select('id, plan, start_date, end_date, status, trainees(id, profiles(name, email))')
        .eq('status', 'active')
        .lte('end_date', thirtyDaysFromNow)
        .order('end_date', { ascending: true })
        .limit(5);
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      console.error('Expiring memberships query failed:', e);
      return { data: null, error: e };
    }
  }, []);

  const { data: recentActivity, loading: activityLoading, error: activityError } = useSupabaseQuery(async () => {
    try {
      const [notificationsRes, paymentsRes, workoutsRes] = await Promise.all([
        supabase.from('notifications').select('id, message, created_at').order('created_at', { ascending: false }).limit(3),
        supabase.from('payments').select('id, amount, payment_status, payment_date, trainees(profiles(name))').order('created_at', { ascending: false }).limit(2),
        supabase.from('workouts').select('id, name, created_at, trainees(profiles(name))').order('created_at', { ascending: false }).limit(2),
      ]);

      const activities = [
        ...(notificationsRes.data ?? []).map(n => ({ ...n, type: 'notification', date: n.created_at, message: n.message })),
        ...(paymentsRes.data ?? []).map(p => ({ ...p, type: 'payment', date: p.created_at, message: `Payment ${currency(p.amount)} by ${p.trainees?.profiles?.name ?? 'member'}` })),
        ...(workoutsRes.data ?? []).map(w => ({ ...w, type: 'workout', date: w.created_at, message: `New workout "${w.name}" for ${w.trainees?.profiles?.name ?? 'member'}` })),
      ];

      return activities.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
    } catch (e) {
      console.error('Recent activity query failed:', e);
      return { data: null, error: e };
    }
  }, []);

  const allErrors = [statsError, chartError, memChartError, payError, newMembersError, expiringError, activityError].filter(Boolean);
  if (allErrors.length > 0) {
    console.error('Dashboard errors:', allErrors);
  }

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
      key: 'actions', label: '', hideOnMobile: true,
      render: (_, r) => (
        <Link to="/admin/payments" className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.6rem' }}>Details</Link>
      ),
    },
  ];

  const newMembersCols = [
    {
      key: 'name', label: 'Member',
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--purple), var(--primary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
          }}>
            {r.profiles?.name?.[0]?.toUpperCase() ?? 'M'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{r.profiles?.name ?? '—'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.profiles?.email ?? ''}</div>
          </div>
        </div>
      ),
    },
    { key: 'trainer', label: 'Trainer', render: (_, r) => r.trainers?.profiles?.name ?? 'Unassigned' },
    { key: 'created_at', label: 'Joined', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    {
      key: 'actions', label: '', hideOnMobile: true,
      render: (_, r) => <Link to={`/admin/trainees`} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.6rem' }}>View</Link>,
    },
  ];

  const expiringCols = [
    {
      key: 'trainee', label: 'Member',
      render: (_, r) => (
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
          {r.trainees?.profiles?.name ?? '—'}
        </div>
      ),
    },
    { key: 'plan', label: 'Plan', render: v => v },
    { key: 'end_date', label: 'Expires', render: v => v },
    {
      key: 'days', label: 'In',
      render: (_, r) => {
        const d = daysLeft(r.end_date);
        if (d === null) return '—';
        if (d <= 7) return <span style={{ color: 'var(--rose)', fontWeight: 600 }}>{d} days</span>;
        if (d <= 14) return <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{d} days</span>;
        return <span style={{ color: 'var(--text-secondary)' }}>{d} days</span>;
      },
    },
    {
      key: 'actions', label: '', hideOnMobile: true,
      render: (_, r) => <Link to="/admin/memberships" className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.6rem' }}>Renew</Link>,
    },
  ];

  const activityCols = [
    {
      key: 'message', label: 'Activity',
      render: (_, r) => {
        const iconMap = { notification: '🔔', payment: '💳', workout: '💪' };
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.1rem' }}>{iconMap[r.type] ?? '📋'}</span>
            <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{r.message ?? '—'}</span>
          </div>
        );
      },
    },
    {
      key: 'date', label: 'Time',
      render: v => v ? new Date(v).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
      hideOnMobile: true,
    },
  ];

  const attendanceRate = useMemo(() => {
    if (!stats?.trainees) return '88%';
    const pct = Math.round(((stats.todayAttendance || 0) / (stats.trainees || 1)) * 100);
    return `${pct}%`;
  }, [stats]);

  return (
    <div>
      {allErrors.length > 0 && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', color: '#fca5a5', fontSize: '0.85rem' }}>
          <strong>Dashboard Error:</strong> Some sections failed to load. Check the browser console for details.
        </div>
      )}

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
        {/* CSS-only hero visual — no canvas, no overflow */}
        <div className="hero-visual-wrap">
          <div className="hero-visual-ring hero-visual-ring--1" />
          <div className="hero-visual-ring hero-visual-ring--2" />
          <div className="hero-visual-ring hero-visual-ring--3" />
          <div className="hero-visual-glow" />
          <div className="hero-visual-icon">💪</div>
          <div className="hero-badge hero-badge--top">
            <span className="hero-badge-dot" />
            <div>
              <div className="hero-badge-val">Operating Peak</div>
              <div className="hero-badge-lbl">System Status</div>
            </div>
          </div>
          <div className="hero-badge hero-badge--bottom">
            <span className="hero-badge-dot hero-badge-dot--cyan" />
            <div>
              <div className="hero-badge-val">{attendanceRate} Check-in</div>
              <div className="hero-badge-lbl">Daily Engagement</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KPI Stat Cards Grid ──────────────────────────────── */}
      <div className="stat-grid">
        <StatCard label="Total Trainees" value={fmt(stats?.trainees)} icon={<Users size={22} />} color="blue" trend={12} loading={statsLoading} />
        <StatCard label="Total Trainers" value={fmt(stats?.trainers)} icon={<UserCheck size={22} />} color="purple" trend={5} loading={statsLoading} />
        <StatCard label="Active Memberships" value={fmt(stats?.memberships)} icon={<IdCard size={22} />} color="green" trend={18} loading={statsLoading} />
        <StatCard label="Total Revenue" value={currency(stats?.revenue)} icon={<IndianRupee size={22} />} color="orange" trend={24} loading={statsLoading} />
        <StatCard label="Pending Payments" value={fmt(stats?.pending)} icon={<Clock size={22} />} color="red" loading={statsLoading} />
        <StatCard label="Today's Attendance" value={fmt(stats?.todayAttendance)} icon={<CalendarCheck size={22} />} color="blue" trend={8} loading={statsLoading} />
      </div>

      {/* ── Quick Actions Row ────────────────────────────────── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Operational Shortcuts</h3>
          <span style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>Quick management actions</span>
        </div>
        <div className="quick-actions-grid">
          <QuickActionCard to="/admin/trainees" icon={<UserPlus size={20} />} title="Register Trainee" description="Onboard new gym member" />
          <QuickActionCard to="/admin/trainers" icon={<PlusCircle size={20} />} title="Add Trainer" description="Assign gym staff & trainer" />
          <QuickActionCard to="/admin/memberships" icon={<IdCard size={20} />} title="Create Membership" description="Assign subscription plan" />
          <QuickActionCard to="/admin/payments" icon={<CreditCard size={20} />} title="Record Payment" description="Process invoice & billing" />
        </div>
      </div>

      {/* ── Analytics Charts ─────────────────────────────────── */}
      <div className="dashboard-charts">
        <Card title="Revenue Overview" subtitle="Monthly cash collection trends (last 6 months)" icon={<TrendingUp size={18} />} className="chart-card"
          actions={<Link to="/admin/analytics" className="btn btn-secondary btn-sm"><span>Full Analytics</span><ArrowUpRight size={14} /></Link>}>
          <Chart type="area" data={revenueChart ?? []} series={[{ key: 'Revenue', label: 'Gross Revenue (₹)', color: '#06b6d4' }]} xKey="name" height={260} loading={chartLoading} />
        </Card>
        <Card title="Membership Distribution" subtitle="Active vs Expired vs Cancelled plans" icon={<PieChart size={18} />} className="chart-card"
          actions={<Link to="/admin/memberships" className="btn btn-secondary btn-sm"><span>View Plans</span><ArrowUpRight size={14} /></Link>}>
          <Chart type="bar" data={membershipChart ?? []} series={[{ key: 'Count', label: 'Members', color: '#6366f1' }]} xKey="name" height={260} loading={memChartLoading} />
        </Card>
      </div>

      {/* ── Expiring Memberships ─────────────────────────────── */}
      <div style={{ marginTop: '2rem' }}>
        <Card
          title="Expiring Memberships"
          subtitle="Memberships ending within the next 30 days"
          icon={<AlertTriangle size={18} />}
          actions={<Link to="/admin/memberships" className="btn btn-secondary btn-sm"><span>View All</span><ArrowUpRight size={14} /></Link>}
        >
          {expiringLoading ? (
            <div className="spinner" style={{ margin: '2rem auto' }} />
          ) : (
            <Table columns={expiringCols} data={expiringMemberships ?? []} loading={expiringLoading} emptyMsg="No memberships expiring soon." />
          )}
        </Card>
      </div>

      {/* ── New Members ──────────────────────────────────────── */}
      <div style={{ marginTop: '2rem' }}>
        <Card
          title="New Members"
          subtitle="Recently registered gym members"
          icon={<UserPlusIcon size={18} />}
          actions={<Link to="/admin/trainees" className="btn btn-secondary btn-sm"><span>View All</span><ArrowUpRight size={14} /></Link>}
        >
          {newMembersLoading ? (
            <div className="spinner" style={{ margin: '2rem auto' }} />
          ) : (
            <Table columns={newMembersCols} data={newMembers ?? []} loading={newMembersLoading} emptyMsg="No members registered yet." />
          )}
        </Card>
      </div>

      {/* ── Recent Activity ──────────────────────────────────── */}
      <div style={{ marginTop: '2rem' }}>
        <Card
          title="Recent Activity"
          subtitle="Latest notifications, payments, and workouts across the gym"
          icon={<Activity size={18} />}
        >
          {activityLoading ? (
            <div className="spinner" style={{ margin: '2rem auto' }} />
          ) : (
            <Table columns={activityCols} data={recentActivity ?? []} loading={activityLoading} emptyMsg="No recent activity." />
          )}
        </Card>
      </div>

      {/* ── Recent Payments Table ────────────────────────────── */}
      <div style={{ marginTop: '2rem' }}>
        <Card
          title="Recent Billing & Transactions"
          subtitle="Real-time payment logs and member invoices"
          icon={<ClipboardList size={18} />}
          actions={<Link to="/admin/payments" className="btn btn-secondary btn-sm"><span>View All Payments</span><ArrowUpRight size={14} /></Link>}
        >
          {payLoading ? (
            <div className="spinner" style={{ margin: '2rem auto' }} />
          ) : (
            <Table columns={recentCols} data={recentPayments ?? []} loading={payLoading} emptyMsg="No payment transactions recorded yet." />
          )}
        </Card>
      </div>
    </div>
  );
}
