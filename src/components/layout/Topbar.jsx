import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Bell, Search, Menu, ChevronRight, Sun, Moon } from 'lucide-react';

/* Map pathname segments to readable titles */
const ROUTE_TITLES = {
  dashboard:     'Dashboard',
  trainers:      'Trainers Management',
  trainees:      'Trainees Directory',
  memberships:   'Membership Plans',
  payments:      'Payment Invoices',
  attendance:    'Attendance Logs',
  analytics:     'Performance Analytics',
  notifications: 'Broadcasts & Alerts',
  settings:      'Gym Settings',
  workouts:      'Workout Routines',
  progress:      'Progress Tracker',
  profile:       'Member Profile',
  membership:    'Membership Details',
  workout:       'My Workout Plan',
};

function getPageDetails(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const portal = segments[0] ? segments[0][0].toUpperCase() + segments[0].slice(1) : 'Portal';
  const last = [...segments].reverse().find(s => !s.match(/^[0-9a-f-]{36}$/i));
  const pageTitle = ROUTE_TITLES[last] ?? 'Overview';
  return { portal, pageTitle };
}

export default function Topbar({ onMenuToggle }) {
  const { profile, role } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const { portal, pageTitle } = getPageDetails(location.pathname);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const profileLink =
    role === 'trainee' ? '/trainee/profile' :
    role === 'admin'   ? '/admin/settings'  :
    null;

  return (
    <header className="topbar">
      {/* Left: hamburger (mobile) + breadcrumbs & title */}
      <div className="topbar-left">
        <button
          className="topbar-hamburger"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="topbar-title-wrap">
          <div className="topbar-breadcrumb">
            <span>{portal}</span>
            <ChevronRight size={12} />
            <span>{pageTitle}</span>
          </div>
          <h1 className="topbar-title">{pageTitle}</h1>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="topbar-search">
        <Search size={15} className="topbar-search-icon" />
        <input
          type="text"
          placeholder="Search members, routines, records..."
          aria-label="Quick search"
        />
      </div>

      {/* Right: Live Gym Status, Notifications, Avatar */}
      <div className="topbar-right">
        {timeStr && (
          <div className="topbar-live-badge">
            <span className="topbar-live-dot" />
            <span>LIVE {timeStr}</span>
          </div>
        )}

        {role === 'admin' && (
          <Link
            to="/admin/notifications"
            className="topbar-icon-btn"
            aria-label="Notifications"
            title="System Notifications"
          >
            <Bell size={18} />
            <span className="topbar-badge-count">3</span>
          </Link>
        )}

        {/* Theme toggle */}
        <button
          className="topbar-icon-btn theme-toggle-btn"
          onClick={toggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark'
            ? <Sun size={18} />
            : <Moon size={18} />
          }
        </button>

        {profile && (
          <div className="topbar-avatar-wrap">
            {profileLink ? (
              <Link to={profileLink} className="topbar-avatar" title="View Profile">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} />
                ) : (
                  <span>{profile.name?.[0]?.toUpperCase() ?? '?'}</span>
                )}
              </Link>
            ) : (
              <div className="topbar-avatar">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} />
                ) : (
                  <span>{profile.name?.[0]?.toUpperCase() ?? '?'}</span>
                )}
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
