import { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabaseClient';
import {
  Bell, Search, Menu, ChevronRight, Sun, Moon, CheckCheck,
  User, Settings, LogOut, ChevronDown,
} from 'lucide-react';
import SearchModal from '../ui/SearchModal';
import Avatar from '../ui/Avatar';

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
  const { profile, role, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { portal, pageTitle } = getPageDetails(location.pathname);
  const [timeStr, setTimeStr] = useState('');
  const [notifs, setNotifs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function markAllRead() {
    if (!profile?.id) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('profile_id', profile.id)
      .eq('is_read', false);
    setNotifs(n => n.map(x => ({ ...x, is_read: true })));
  }

  async function markRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const unreadCount = notifs.filter(n => !n.is_read).length;

  const profileLink =
    role === 'trainee' ? '/trainee/profile' :
    role === 'trainer' ? '/trainer/profile' :
    role === 'admin'   ? '/admin/settings'  :
    null;

  return (
    <header className="topbar">
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

      <button className="topbar-search-btn" onClick={() => setSearchOpen(true)} aria-label="Open search">
        <Search size={15} />
        <span>Search…</span>
        <kbd className="topbar-kbd">Ctrl K</kbd>
      </button>

      <div className="topbar-right">
        {timeStr && (
          <div className="topbar-live-badge">
            <span className="topbar-live-dot" />
            <span>LIVE {timeStr}</span>
          </div>
        )}

        <div className="topbar-notif-wrap" ref={notifRef}>
          <button
            className="topbar-icon-btn"
            onClick={() => { setNotifOpen(o => !o); setMenuOpen(false); }}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="topbar-badge-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
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
              {role === 'admin' && (
                <Link
                  to="/admin/notifications"
                  className="notif-dropdown-footer"
                  onClick={() => setNotifOpen(false)}
                >
                  View all broadcasts
                </Link>
              )}
            </div>
          )}
        </div>

        <button
          className="topbar-icon-btn theme-toggle-btn"
          onClick={toggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {profile && (
          <div className="topbar-avatar-wrap" ref={menuRef}>
            <button
              type="button"
              className="topbar-profile-btn"
              onClick={() => { setMenuOpen(o => !o); setNotifOpen(false); }}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <Avatar
                src={profile.avatar_url}
                name={profile.name}
                size={36}
                status={profile.account_status === 'active' ? 'active' : 'inactive'}
              />
              <div className="topbar-user-info">
                <span className="topbar-user-name">{profile.name}</span>
                <span className="topbar-user-role">{profile.role}</span>
              </div>
              <ChevronDown size={14} className={`topbar-caret${menuOpen ? ' topbar-caret--open' : ''}`} />
            </button>

            {menuOpen && (
              <div className="profile-dropdown" role="menu">
                <div className="profile-dropdown-head">
                  <Avatar src={profile.avatar_url} name={profile.name} size={40} />
                  <div>
                    <div className="profile-dropdown-name">{profile.name}</div>
                    <div className="profile-dropdown-email">{profile.email}</div>
                  </div>
                </div>
                {profileLink && (
                  <Link to={profileLink} className="profile-dropdown-item" onClick={() => setMenuOpen(false)} role="menuitem">
                    {role === 'admin' ? <Settings size={15} /> : <User size={15} />}
                    {role === 'admin' ? 'Settings' : 'View profile'}
                  </Link>
                )}
                <button type="button" className="profile-dropdown-item" onClick={() => { toggle(); setMenuOpen(false); }} role="menuitem">
                  {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </button>
                <button type="button" className="profile-dropdown-item profile-dropdown-item--danger" onClick={handleSignOut} role="menuitem">
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
