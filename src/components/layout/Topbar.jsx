import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* Map pathname segments to readable titles */
const ROUTE_TITLES = {
  dashboard:     'Dashboard',
  trainers:      'Trainers',
  trainees:      'My Trainees',
  memberships:   'Memberships',
  payments:      'Payments',
  attendance:    'Attendance',
  analytics:     'Analytics',
  notifications: 'Notifications',
  settings:      'Settings',
  workouts:      'Workouts',
  progress:      'Progress',
  profile:       'My Profile',
  membership:    'My Membership',
  workout:       'My Workout',
};

function getPageTitle(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  // Last meaningful segment (skip UUIDs)
  const last = [...segments].reverse().find(s => !s.match(/^[0-9a-f-]{36}$/i));
  return ROUTE_TITLES[last] ?? 'FitGym';
}

export default function Topbar({ onMenuToggle }) {
  const { profile, role } = useAuth();
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  const profileLink =
    role === 'trainee' ? '/trainee/profile' :
    role === 'admin'   ? '/admin/settings'  :
    null;

  return (
    <header className="topbar">
      {/* Left: hamburger (mobile) + page title */}
      <div className="topbar-left">
        <button
          className="topbar-hamburger"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>

      {/* Right: notifications + avatar */}
      <div className="topbar-right">
        {role === 'admin' && (
          <Link
            to="/admin/notifications"
            className="topbar-icon-btn"
            aria-label="Notifications"
            title="Notifications"
          >
            🔔
          </Link>
        )}

        {profile && (
          <div className="topbar-avatar-wrap">
            {profileLink ? (
              <Link to={profileLink} className="topbar-avatar" title="My profile">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.name} />
                  : <span>{profile.name?.[0]?.toUpperCase() ?? '?'}</span>
                }
              </Link>
            ) : (
              <div className="topbar-avatar">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.name} />
                  : <span>{profile.name?.[0]?.toUpperCase() ?? '?'}</span>
                }
              </div>
            )}
            <div className="topbar-user-info">
              <span className="topbar-user-name">{profile.name}</span>
              <span className="topbar-user-role">{profile.role}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
