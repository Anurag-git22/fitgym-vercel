import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  CreditCard,
  CalendarCheck,
  TrendingUp,
  Bell,
  Settings,
  UserCheck,
  IdCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Flame,
  User
} from 'lucide-react';

/* ── Grouped Nav Definitions ───────────────────────────────── */
const NAV_CONFIG = {
  admin: [
    {
      category: 'Overview',
      items: [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
      ]
    },
    {
      category: 'Management',
      items: [
        { to: '/admin/trainers', icon: UserCheck, label: 'Trainers' },
        { to: '/admin/trainees', icon: Users, label: 'Trainees' },
        { to: '/admin/memberships', icon: IdCard, label: 'Memberships' },
        { to: '/admin/attendance', icon: CalendarCheck, label: 'Attendance' },
      ]
    },
    {
      category: 'Finance & System',
      items: [
        { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
        { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
        { to: '/admin/settings', icon: Settings, label: 'Settings' },
      ]
    }
  ],
  trainer: [
    {
      category: 'Overview',
      items: [
        { to: '/trainer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ]
    },
    {
      category: 'Training',
      items: [
        { to: '/trainer/trainees', icon: Users, label: 'My Trainees' },
        { to: '/trainer/workouts', icon: Dumbbell, label: 'Workout Plans' },
        { to: '/trainer/attendance', icon: CalendarCheck, label: 'Attendance' },
        { to: '/trainer/progress', icon: TrendingUp, label: 'Progress Tracking' },
      ]
    }
  ],
  trainee: [
    {
      category: 'Member Portal',
      items: [
        { to: '/trainee/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/trainee/profile', icon: User, label: 'Profile' },
        { to: '/trainee/membership', icon: IdCard, label: 'My Membership' },
      ]
    },
    {
      category: 'Fitness & Activity',
      items: [
        { to: '/trainee/workout', icon: Dumbbell, label: 'Daily Workout' },
        { to: '/trainee/progress', icon: TrendingUp, label: 'Body Progress' },
        { to: '/trainee/attendance', icon: CalendarCheck, label: 'Attendance Log' },
        { to: '/trainee/payments', icon: CreditCard, label: 'Invoices & Billing' },
      ]
    }
  ]
};

const ROLE_LABEL = {
  admin: 'Administrator',
  trainer: 'Personal Trainer',
  trainee: 'Gym Member',
};

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const sections = NAV_CONFIG[role] ?? [];

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <aside className={[
      'sidebar',
      collapsed ? 'sidebar--collapsed' : '',
      mobileOpen ? 'sidebar--mobile-open' : '',
    ].filter(Boolean).join(' ')}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Flame size={20} />
        </div>
        {!collapsed && (
          <>
            <span className="sidebar-brand-name">FitGym</span>
          </>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: collapsed ? '0.25rem' : '0.5rem' }}>
            {!collapsed && section.category && (
              <div className="sidebar-category">{section.category}</div>
            )}
            {section.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
                }
                title={collapsed ? label : undefined}
              >
                <div className="sidebar-link-icon">
                  <Icon size={18} />
                </div>
                {!collapsed && <span className="sidebar-link-label">{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User profile footer */}
      <div className="sidebar-footer">
        {!collapsed && profile && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} />
              ) : (
                <span>{profile.name?.[0]?.toUpperCase() ?? '?'}</span>
              )}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{profile.name}</span>
              <span className="sidebar-user-role">{ROLE_LABEL[role] ?? role}</span>
            </div>
          </div>
        )}

        <button
          className="sidebar-signout"
          onClick={handleSignOut}
          title="Sign out of account"
          aria-label="Sign out"
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
