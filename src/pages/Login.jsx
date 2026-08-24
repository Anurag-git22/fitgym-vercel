import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Dumbbell, Users, BarChart3, Shield, ArrowRight } from 'lucide-react';

export default function Login() {
  const { signIn, loading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);
  const [showPass, setShowPass] = useState(false);

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
    <div className="login-split">

      {/* ── Left Panel ──────────────────────────────────────── */}
      <div className="login-panel-left">
        {/* Ambient blobs */}
        <div className="login-blob login-blob--1" />
        <div className="login-blob login-blob--2" />

        <div className="login-panel-left-inner">
          {/* Brand */}
          <div className="login-brand">
            <div className="login-brand-icon">
              <Dumbbell size={22} color="#fff" />
            </div>
            <span className="login-brand-name">FitGym</span>
          </div>

          {/* Hero text */}
          <div className="login-hero-text">
            <h1 className="login-hero-title">
              Manage Your Gym<br />
              <span className="login-hero-accent">Smarter.</span>
            </h1>
            <p className="login-hero-desc">
              The all-in-one platform for gym owners, trainers, and members.
              Real-time data. Role-based access. Zero complexity.
            </p>
          </div>

          {/* Feature list */}
          <ul className="login-features">
            <li className="login-feature-item">
              <div className="login-feature-icon"><Users size={16} /></div>
              <div>
                <div className="login-feature-title">3 Role Portals</div>
                <div className="login-feature-sub">Admin, Trainer & Member dashboards</div>
              </div>
            </li>
            <li className="login-feature-item">
              <div className="login-feature-icon"><BarChart3 size={16} /></div>
              <div>
                <div className="login-feature-title">Live Analytics</div>
                <div className="login-feature-sub">Revenue, attendance & membership charts</div>
              </div>
            </li>
            <li className="login-feature-item">
              <div className="login-feature-icon"><Shield size={16} /></div>
              <div>
                <div className="login-feature-title">Secure by Default</div>
                <div className="login-feature-sub">Row-level security on every table</div>
              </div>
            </li>
          </ul>

          {/* Footer */}
          <p className="login-panel-footer">
            © {new Date().getFullYear()} FitGym ERP
          </p>
        </div>
      </div>

      {/* ── Right Panel — Form ───────────────────────────────── */}
      <div className="login-panel-right">
        <div className="login-form-wrap">

          {/* Mobile logo */}
          <div className="login-mobile-brand">
            <div className="login-brand-icon" style={{ width: 36, height: 36 }}>
              <Dumbbell size={18} color="#fff" />
            </div>
            <span className="login-brand-name">FitGym</span>
          </div>

          <h2 className="login-form-title">Welcome back</h2>
          <p className="login-form-sub">Sign in to your account to continue</p>

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
                disabled={busy || loading}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--cyan)', fontWeight: 500 }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={busy || loading}
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem',
                    fontWeight: 600, padding: '0.25rem',
                  }}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">{error}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full login-submit-btn"
              disabled={busy || loading}
            >
              {busy ? (
                <>
                  <span className="login-btn-spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="login-demo-section">
            <div className="login-demo-label">
              <span className="login-demo-line" />
              <span>Demo Accounts</span>
              <span className="login-demo-line" />
            </div>
            <div className="login-demo-btns">
              <button
                type="button"
                className="login-demo-btn"
                onClick={() => fillDemo('admin@fitgym.net', 'Admin@123')}
              >
                <span className="login-demo-role-dot login-demo-role-dot--admin" />
                <div>
                  <div className="login-demo-btn-title">Admin</div>
                  <div className="login-demo-btn-sub">Full access</div>
                </div>
              </button>
              <button
                type="button"
                className="login-demo-btn"
                onClick={() => fillDemo('trainer1@fitgym.net', 'Trainer@123')}
              >
                <span className="login-demo-role-dot login-demo-role-dot--trainer" />
                <div>
                  <div className="login-demo-btn-title">Trainer</div>
                  <div className="login-demo-btn-sub">Coach portal</div>
                </div>
              </button>
              <button
                type="button"
                className="login-demo-btn"
                onClick={() => fillDemo('trainee1@fitgym.net', 'Trainee@123')}
              >
                <span className="login-demo-role-dot login-demo-role-dot--trainee" />
                <div>
                  <div className="login-demo-btn-title">Member</div>
                  <div className="login-demo-btn-sub">Member portal</div>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
