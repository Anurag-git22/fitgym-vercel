import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute   from './routes/ProtectedRoute';
import DashboardLayout  from './components/layout/DashboardLayout';

/* ── Public pages ───────────────────────────────────────────── */
import LandingPage    from './pages/landing/LandingPage';
import Login          from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword  from './pages/ResetPassword';
import Forbidden      from './pages/Forbidden';
import NotFound       from './pages/NotFound';

/* ── Admin pages ────────────────────────────────────────────── */
import AdminDashboard     from './pages/admin/Dashboard';
import AdminTrainers      from './pages/admin/Trainers';
import AdminTrainees      from './pages/admin/Trainees';
import AdminMemberships   from './pages/admin/Memberships';
import AdminPayments      from './pages/admin/Payments';
import AdminAttendance    from './pages/admin/Attendance';
import AdminAnalytics     from './pages/admin/Analytics';
import AdminNotifications from './pages/admin/Notifications';
import AdminSettings      from './pages/admin/Settings';

/* ── Trainer pages ──────────────────────────────────────────── */
import TrainerDashboard    from './pages/trainer/Dashboard';
import TrainerMyTrainees   from './pages/trainer/MyTrainees';
import TrainerTraineeDetail from './pages/trainer/TraineeDetail';
import TrainerWorkouts     from './pages/trainer/Workouts';
import TrainerAttendance   from './pages/trainer/Attendance';
import TrainerProgress     from './pages/trainer/Progress';
import TrainerProfile      from './pages/trainer/Profile';

/* ── Trainee pages ──────────────────────────────────────────── */
import TraineeDashboard  from './pages/trainee/Dashboard';
import TraineeProfile    from './pages/trainee/Profile';
import TraineeMembership from './pages/trainee/Membership';
import TraineeWorkout    from './pages/trainee/Workout';
import TraineeAttendance from './pages/trainee/Attendance';
import TraineeProgress   from './pages/trainee/Progress';
import TraineePayments   from './pages/trainee/Payments';

import { isSupabaseConfigured } from './lib/supabaseClient';

/* ── Layout wrapper helper ──────────────────────────────────── */
function WithLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f8fafc', padding: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '520px', width: '100%', background: '#1e293b', padding: '2rem', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚙️</div>
          <h2 style={{ color: '#f8fafc', margin: '0 0 0.75rem', fontSize: '1.4rem', fontWeight: 700 }}>Supabase Configuration Required</h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.925rem', margin: '0 0 1.25rem' }}>
            Your FitGym app is deployed on Vercel, but it needs your Supabase project credentials to connect to the backend.
          </p>
          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '1.25rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', fontWeight: 600, color: '#38bdf8' }}>
              Add these in Vercel &rarr; Settings &rarr; Environment Variables:
            </p>
            <code style={{ display: 'block', color: '#f1f5f9', background: '#1e293b', padding: '0.375rem 0.625rem', borderRadius: '4px', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
              VITE_SUPABASE_URL
            </code>
            <code style={{ display: 'block', color: '#f1f5f9', background: '#1e293b', padding: '0.375rem 0.625rem', borderRadius: '4px', fontSize: '0.8125rem' }}>
              VITE_SUPABASE_ANON_KEY
            </code>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>
            After adding the variables in Vercel, click <strong>Redeploy</strong> to apply changes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public ──────────────────────────────────────── */}
          <Route path="/login"           element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/403"             element={<Forbidden />} />
          <Route path="/404"             element={<NotFound />} />

          {/* Root → login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ── Admin ──────────────────────────────────────── */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin/dashboard"     element={<WithLayout><AdminDashboard /></WithLayout>} />
            <Route path="/admin/trainers"      element={<WithLayout><AdminTrainers /></WithLayout>} />
            <Route path="/admin/trainees"      element={<WithLayout><AdminTrainees /></WithLayout>} />
            <Route path="/admin/memberships"   element={<WithLayout><AdminMemberships /></WithLayout>} />
            <Route path="/admin/payments"      element={<WithLayout><AdminPayments /></WithLayout>} />
            <Route path="/admin/attendance"    element={<WithLayout><AdminAttendance /></WithLayout>} />
            <Route path="/admin/analytics"     element={<WithLayout><AdminAnalytics /></WithLayout>} />
            <Route path="/admin/notifications" element={<WithLayout><AdminNotifications /></WithLayout>} />
            <Route path="/admin/settings"      element={<WithLayout><AdminSettings /></WithLayout>} />
          </Route>

          {/* ── Trainer ────────────────────────────────────── */}
          <Route element={<ProtectedRoute role="trainer" />}>
            <Route path="/trainer/dashboard"       element={<WithLayout><TrainerDashboard /></WithLayout>} />
            <Route path="/trainer/trainees"        element={<WithLayout><TrainerMyTrainees /></WithLayout>} />
            <Route path="/trainer/trainees/:id"    element={<WithLayout><TrainerTraineeDetail /></WithLayout>} />
            <Route path="/trainer/workouts"        element={<WithLayout><TrainerWorkouts /></WithLayout>} />
            <Route path="/trainer/attendance"      element={<WithLayout><TrainerAttendance /></WithLayout>} />
            <Route path="/trainer/progress"        element={<WithLayout><TrainerProgress /></WithLayout>} />
            <Route path="/trainer/profile"         element={<WithLayout><TrainerProfile /></WithLayout>} />
          </Route>

          {/* ── Trainee ────────────────────────────────────── */}
          <Route element={<ProtectedRoute role="trainee" />}>
            <Route path="/trainee/dashboard"  element={<WithLayout><TraineeDashboard /></WithLayout>} />
            <Route path="/trainee/profile"    element={<WithLayout><TraineeProfile /></WithLayout>} />
            <Route path="/trainee/membership" element={<WithLayout><TraineeMembership /></WithLayout>} />
            <Route path="/trainee/workout"    element={<WithLayout><TraineeWorkout /></WithLayout>} />
            <Route path="/trainee/attendance" element={<WithLayout><TraineeAttendance /></WithLayout>} />
            <Route path="/trainee/progress"   element={<WithLayout><TraineeProgress /></WithLayout>} />
            <Route path="/trainee/payments"   element={<WithLayout><TraineePayments /></WithLayout>} />
          </Route>

          {/* ── Catch-all ──────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
