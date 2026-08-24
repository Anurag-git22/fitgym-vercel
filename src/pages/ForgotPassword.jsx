import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// auth.css is imported globally via src/styles/global.css

export default function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email,   setEmail]   = useState('');
  const [message, setMessage] = useState('');
  const [error,   setError]   = useState('');
  const [busy,    setBusy]    = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);

    const { error: resetError } = await resetPassword(email.trim());

    if (resetError) {
      setError(resetError.message ?? 'Something went wrong. Please try again.');
    } else {
      setMessage(
        'Check your email — we sent a password reset link. It may take a minute to arrive.'
      );
    }
    setBusy(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">💪</span>
          <h1>FitGym</h1>
        </div>

        <h2 className="auth-title">Reset your password</h2>
        <p className="auth-subtitle">
          Enter your account email and we'll send you a reset link.
        </p>

        {message ? (
          <div className="auth-success" role="status">
            {message}
            <p className="auth-footer-link" style={{ marginTop: '1rem' }}>
              <Link to="/login">← Back to sign in</Link>
            </p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@fitgym.com"
                disabled={busy}
              />
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={busy}
            >
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="auth-footer-link">
          <Link to="/login">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
