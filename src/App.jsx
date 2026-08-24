import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute   from './routes/ProtectedRoute';
import DashboardLayout  from './components/layout/DashboardLayout';

/* ── Public pages ───────────────────────────────────────────── */
import Login          from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
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

/* ── Trainee pages ──────────────────────────────────────────── */
import TraineeDashboard  from './pages/trainee/Dashboard';
import TraineeProfile    from './pages/trainee/Profile';
import TraineeMembership from './pages/trainee/Membership';
import TraineeWorkout    from './pages/trainee/Workout';
import TraineeAttendance from './pages/trainee/Attendance';
import TraineeProgress   from './pages/trainee/Progress';
import TraineePayments   from './pages/trainee/Payments';

/* ── Layout wrapper helper ──────────────────────────────────── */
function WithLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public ──────────────────────────────────────── */}
          <Route path="/login"           element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/403"             element={<Forbidden />} />
          <Route path="/404"             element={<NotFound />} />

          {/* Root redirect */}
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
