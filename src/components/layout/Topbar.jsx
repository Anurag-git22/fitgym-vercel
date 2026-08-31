import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabaseClient';
import { Bell, Search, Menu, ChevronRight, Sun, Moon, CheckCheck } from 'lucide-react';
import SearchModal from '../ui/SearchModal';

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
  const [timeStr,       setTimeStr]       = useState('');
  const [notifs,        setNotifs]        = useState([]);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const notifRef = useRef(null);

  /* ── Clock ─────────────────────────────────────────────── */
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ── Fetch notifications for current user ───────────────── */
  useEffect(() => {
    if (!profile?.id) return;

    async function fetchNotifs() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setNotifs(data ?? []);
    }

    fetchNotifs();

    // Realtime subscription
    const channel = supabase
      .channel(`notifs-${profile.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `profile_id=eq.${profile.id}`,
      }, () => fetchNotifs())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [profile?.id]);

  /* ── Close dropdown on outside click ───────────────────── */
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ── Mark all as read ───────────────────────────────────── */
  async function markAllRead() {
    if (!profile?.id) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('profile_id', profile.id)
      .eq('is_read', false);
    setNotifs(n => n.map(x => ({ ...x, is_read: true })));
  }

  /* ── Mark single as read ────────────────────────────────── */
  async function markRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
  }

  const unreadCount = notifs.filter(n => !n.is_read).length;

  const profileLink =
    role === 'trainee' ? '/trainee/profile' :
    role === 'trainer' ? '/trainer/profile' :
    role === 'admin'   ? '/admin/settings'  :
    null;

  return (
    <header className="topbar">
      {/* Left */}
      <div className="topbar-left">
        <button className="topbar-hamburger" onClick={onMenuToggle} aria-label="Toggle navigation menu">
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

      {/* Center: Search trigger */}
      <button className="topbar-search-btn" onClick={() => setSearchOpen(true)} aria-label="Open search">
        <Search size={15} />
        <span>Search...</span>
      </button>

      {/* Right */}
      <div className="topbar-right">
        {timeStr && (
          <div className="topbar-live-badge">
            <span className="topbar-live-dot" />
            <span>LIVE {timeStr}</span>
          </div>
        )}

        {/* ── Notification bell — ALL roles ─────────────────── */}
        <div className="topbar-notif-wrap" ref={notifRef}>
          {role === 'admin' ? (
            /* Admin goes to the full notifications page */
            <Link
              to="/admin/notifications"
              className="topbar-icon-btn"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="topbar-badge-count">{unreadCount}</span>
              )}
            </Link>
          ) : (
            /* Trainer & Trainee get inline dropdown */
            <button
              className="topbar-icon-btn"
              onClick={() => setNotifOpen(o => !o)}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="topbar-badge-count">{unreadCount}</span>
              )}
            </button>
          )}

          {/* Dropdown panel */}
          {notifOpen && role !== 'admin' && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-header">
                <span className="notif-dropdown-title">Notifications</span>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={markAllRead}>
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notif-dropdown-body">
                {notifs.length === 0 ? (
                  <div className="notif-dropdown-empty">
                    <Bell size={24} />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifs.map(n => (
                    <div
                      key={n.id}
                      className={`notif-dropdown-item${n.is_read ? '' : ' notif-dropdown-item--unread'}`}
                      onClick={() => markRead(n.id)}
                    >
                      <div className="notif-dropdown-dot-wrap">
                        {!n.is_read && <span className="notif-dropdown-dot" />}
                      </div>
                      <div className="notif-dropdown-content">
                        <p className="notif-dropdown-msg">{n.message}</p>
                        <span className="notif-dropdown-time">
                          {new Date(n.created_at).toLocaleDateString([], {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          className="topbar-icon-btn theme-toggle-btn"
          onClick={toggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Avatar */}
        {profile && (
          <div className="topbar-avatar-wrap">
            {profileLink ? (
              <Link to={profileLink} className="topbar-avatar" title="View Profile">
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

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
