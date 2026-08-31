import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, Dumbbell, CalendarCheck, User } from 'lucide-react';

const ITEMS = {
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/admin/trainees', icon: Users, label: 'Members' },
    { to: '/admin/memberships', icon: Dumbbell, label: 'Plans' },
    { to: '/admin/attendance', icon: CalendarCheck, label: 'Check-in' },
    { to: '/admin/settings', icon: User, label: 'Account' },
  ],
  trainer: [
    { to: '/trainer/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/trainer/trainees', icon: Users, label: 'Trainees' },
    { to: '/trainer/workouts', icon: Dumbbell, label: 'Workouts' },
    { to: '/trainer/attendance', icon: CalendarCheck, label: 'Attendance' },
    { to: '/trainer/profile', icon: User, label: 'Profile' },
  ],
  trainee: [
    { to: '/trainee/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/trainee/workout', icon: Dumbbell, label: 'Workout' },
    { to: '/trainee/attendance', icon: CalendarCheck, label: 'Log' },
    { to: '/trainee/progress', icon: Users, label: 'Progress' },
    { to: '/trainee/profile', icon: User, label: 'Profile' },
  ],
};

export default function MobileBottomNav() {
  const { role } = useAuth();
  const items = ITEMS[role];
  if (!items) return null;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `mobile-bottom-nav-item${isActive ? ' mobile-bottom-nav-item--active' : ''}`
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
