import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 *
 * Usage in router:
 *   <Route element={<ProtectedRoute role="admin" />}>
 *     <Route path="/admin/dashboard" element={<AdminDashboard />} />
 *   </Route>
 *
 * Props:
 *   role  – 'admin' | 'trainer' | 'trainee'
 *           If omitted, any authenticated user passes through.
 */
export default function ProtectedRoute({ role }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  // Still loading session / profile — render nothing (spinner is in DashboardLayout)
  if (loading) {
    return (
      <div className="full-page-spinner">
        <div className="spinner" />
      </div>
    );
  }

  // Not authenticated → redirect to login, preserving intended destination
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated but profile not yet loaded (edge case)
  if (!profile) {
    return (
      <div className="full-page-spinner">
        <div className="spinner" />
      </div>
    );
  }

  // Wrong role → 403 page
  if (role && profile.role !== role) {
    return <Navigate to="/403" replace />;
  }

  // Inactive account → show a message instead of the app
  if (profile.account_status === 'inactive') {
    return (
      <div className="full-page-message">
        <h2>Account Inactive</h2>
        <p>Your account has been deactivated. Please contact your gym administrator.</p>
      </div>
    );
  }

  return <Outlet />;
}
