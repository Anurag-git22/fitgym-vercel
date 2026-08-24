import { Link } from 'react-router-dom';
// auth.css is imported globally via src/styles/global.css

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-card auth-card--center">
        <span className="error-code">404</span>
        <h2 className="auth-title">Page Not Found</h2>
        <p className="auth-subtitle">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/login" className="btn btn-primary">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
