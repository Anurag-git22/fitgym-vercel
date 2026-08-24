import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function Login() {
  const { signIn, loading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);

  const from = location.state?.from?.pathname ?? null;

  function roleHome(role) {
    if (role === 'admin')   return '/admin/dashboard';
    if (role === 'trainer') return '/trainer/dashboard';
    return '/trainee/dashboard';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    const { data: authData, error: signInError } = await signIn(email.trim(), password);

    if (signInError) {
      setError(signInError.message ?? 'Login failed. Please check your credentials.');
      setBusy(false);
      return;
    }

    const userId = authData?.user?.id;
    let role = null;
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      role = profile?.role;
    }

    // Ensure `from` matches the role to avoid 403 loops
    const isValidFrom = from && role && from.startsWith(`/${role}`);
    const dest = isValidFrom ? from : roleHome(role);
    navigate(dest, { replace: true });
  }

  function fillDemo(demoEmail, demoPass) {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">💪</span>
          <h1>FitGym</h1>
        </div>

        <h2 className="auth-title">Sign in to your account</h2>

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
              placeholder="admin@fitgym.net"
              disabled={busy || loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={busy || loading}
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
            disabled={busy || loading}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Demo credentials helper */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.8125rem', color: '#64748b' }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#334155' }}>Demo Accounts (click to fill):</p>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('admin@fitgym.net', 'Admin@123')}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            >
              👑 Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('trainer1@fitgym.net', 'Trainer@123')}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            >
              🏋️ Trainer
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillDemo('trainee1@fitgym.net', 'Trainee@123')}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            >
              🏃 Member
            </button>
          </div>
        </div>

        <p className="auth-footer-link" style={{ marginTop: '1rem' }}>
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
      </div>
    </div>
  );
}
