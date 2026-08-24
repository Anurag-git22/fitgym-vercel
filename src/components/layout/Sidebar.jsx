import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* ── Nav definitions per role ─────────────────────────────── */
const NAV = {
  admin: [
    { to: '/admin/dashboard',     icon: '🏠', label: 'Dashboard'     },
    { to: '/admin/trainers',      icon: '🏋️', label: 'Trainers'      },
    { to: '/admin/trainees',      icon: '👥', label: 'Trainees'      },
    { to: '/admin/memberships',   icon: '🪪', label: 'Memberships'   },
    { to: '/admin/payments',      icon: '💳', label: 'Payments'      },
    { to: '/admin/attendance',    icon: '📋', label: 'Attendance'    },
    { to: '/admin/analytics',     icon: '📊', label: 'Analytics'     },
    { to: '/admin/notifications', icon: '🔔', label: 'Notifications' },
    { to: '/admin/settings',      icon: '⚙️', label: 'Settings'      },
  ],
  trainer: [
    { to: '/trainer/dashboard',  icon: '🏠', label: 'Dashboard'  },
    { to: '/trainer/trainees',   icon: '👥', label: 'My Trainees' },
    { to: '/trainer/workouts',   icon: '💪', label: 'Workouts'   },
    { to: '/trainer/attendance', icon: '📋', label: 'Attendance' },
    { to: '/trainer/progress',   icon: '📈', label: 'Progress'   },
  ],
  trainee: [
    { to: '/trainee/dashboard',  icon: '🏠', label: 'Dashboard'  },
    { to: '/trainee/profile',    icon: '👤', label: 'Profile'    },
    { to: '/trainee/membership', icon: '🪪', label: 'Membership' },
    { to: '/trainee/workout',    icon: '💪', label: 'Workout'    },
    { to: '/trainee/attendance', icon: '📋', label: 'Attendance' },
    { to: '/trainee/progress',   icon: '📈', label: 'Progress'   },
    { to: '/trainee/payments',   icon: '💳', label: 'Payments'   },
  ],
};

const ROLE_LABEL = {
  admin:   'Admin',
  trainer: 'Trainer',
  trainee: 'Member',
};

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV[role] ?? [];

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <aside className={[
      'sidebar',
      collapsed   ? 'sidebar--collapsed'    : '',
      mobileOpen  ? 'sidebar--mobile-open'  : '',
    ].filter(Boolean).join(' ')}>
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">💪</span>
        {!collapsed && <span className="sidebar-brand-name">FitGym</span>}
      </div>

      {/* Role badge */}
      {!collapsed && role && (
        <div className="sidebar-role-badge">
          {ROLE_LABEL[role] ?? role}
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <span className="sidebar-link-icon">{icon}</span>
            {!collapsed && <span className="sidebar-link-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        {!collapsed && profile && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.name} />
                : <span>{profile.name?.[0]?.toUpperCase() ?? '?'}</span>
              }
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{profile.name}</span>
              <span className="sidebar-user-email">{profile.email}</span>
            </div>
          </div>
        )}
        <button
          className="sidebar-signout"
          onClick={handleSignOut}
          title="Sign out"
          aria-label="Sign out"
        >
          <span>🚪</span>
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '›' : '‹'}
      </button>
    </aside>
  );
}
