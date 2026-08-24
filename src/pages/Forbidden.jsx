import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// auth.css is imported globally via src/styles/global.css

export default function Forbidden() {
  const { role } = useAuth();

  const homeLink =
    role === 'admin'   ? '/admin/dashboard'   :
    role === 'trainer' ? '/trainer/dashboard' :
    role === 'trainee' ? '/trainee/dashboard' :
    '/login';

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--center">
        <span className="error-code">403</span>
        <h2 className="auth-title">Access Denied</h2>
        <p className="auth-subtitle">
          You don't have permission to view this page.
        </p>
        <Link to={homeLink} className="btn btn-primary">
          Go to my dashboard
        </Link>
      </div>
    </div>
  );
}
