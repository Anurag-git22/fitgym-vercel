import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Dumbbell, ArrowRight } from 'lucide-react';

/* ── Abstract ERP Dashboard Visualization ───────────────────── */
function ERPVisualization() {
  return (
    <div className="erp-viz">

      {/* Background connection lines */}
      <svg className="erp-viz-lines" viewBox="0 0 340 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="60"  y1="80"  x2="170" y2="140" stroke="rgba(99,102,241,0.15)" strokeWidth="1" strokeDasharray="4 4"/>
        <line x1="280" y1="70"  x2="170" y2="140" stroke="rgba(6,182,212,0.12)"  strokeWidth="1" strokeDasharray="4 4"/>
        <line x1="170" y1="140" x2="80"  y2="220" stroke="rgba(99,102,241,0.12)" strokeWidth="1" strokeDasharray="4 4"/>
        <line x1="170" y1="140" x2="260" y2="210" stroke="rgba(6,182,212,0.1)"   strokeWidth="1" strokeDasharray="4 4"/>
        {/* Data points */}
        <circle cx="60"  cy="80"  r="3" fill="rgba(129,140,248,0.6)"/>
        <circle cx="280" cy="70"  r="3" fill="rgba(6,182,212,0.6)"/>
        <circle cx="80"  cy="220" r="3" fill="rgba(129,140,248,0.5)"/>
        <circle cx="260" cy="210" r="3" fill="rgba(6,182,212,0.5)"/>
        <circle cx="170" cy="140" r="5" fill="rgba(99,102,241,0.4)" />
        <circle cx="170" cy="140" r="10" fill="rgba(99,102,241,0.08)" />
      </svg>

      {/* Panel 1 — Attendance mini chart (top left) */}
      <div className="erp-panel erp-panel--tl">
        <div className="erp-panel-label">Attendance</div>
        <div className="erp-mini-bars">
          {[65,80,55,90,72,88,60,95,70,85].map((h, i) => (
            <div key={i} className="erp-mini-bar" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="erp-panel-value">86%</div>
      </div>

      {/* Panel 2 — Circular progress (top right) */}
      <div className="erp-panel erp-panel--tr">
        <div className="erp-panel-label">Members</div>
        <div className="erp-ring-wrap">
          <svg viewBox="0 0 60 60" className="erp-ring-svg">
            <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4"/>
            <circle cx="30" cy="30" r="24" fill="none" stroke="url(#ringGrad)" strokeWidth="4"
              strokeDasharray="113" strokeDashoffset="28" strokeLinecap="round"
              transform="rotate(-90 30 30)"/>
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#6366f1"/>
                <stop offset="100%" stopColor="#06b6d4"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="erp-ring-num">75%</span>
        </div>
      </div>

      {/* Panel 3 — Revenue graph (center, largest) */}
      <div className="erp-panel erp-panel--center">
        <div className="erp-panel-header">
          <span className="erp-panel-label">Revenue</span>
          <span className="erp-panel-trend">↑ 18%</span>
        </div>
        <svg viewBox="0 0 160 50" className="erp-area-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M0,45 L16,38 L32,30 L48,33 L64,20 L80,25 L96,15 L112,18 L128,8 L144,12 L160,5 L160,50 L0,50 Z"
                fill="url(#areaGrad)"/>
          <path d="M0,45 L16,38 L32,30 L48,33 L64,20 L80,25 L96,15 L112,18 L128,8 L144,12 L160,5"
                fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round"/>
          {/* Glow dot at latest */}
          <circle cx="160" cy="5" r="3" fill="#818cf8"/>
          <circle cx="160" cy="5" r="6" fill="rgba(99,102,241,0.2)"/>
        </svg>
      </div>

      {/* Panel 4 — Member activity (bottom left) */}
      <div className="erp-panel erp-panel--bl">
        <div className="erp-panel-label">Activity</div>
        <div className="erp-activity-rows">
          {[
            { label: 'Admin',   w: 90, color: '#818cf8' },
            { label: 'Trainer', w: 65, color: '#34d399' },
            { label: 'Member',  w: 80, color: '#fbbf24' },
          ].map(r => (
            <div key={r.label} className="erp-activity-row">
              <span className="erp-activity-label">{r.label}</span>
              <div className="erp-activity-bar-track">
                <div className="erp-activity-bar-fill" style={{ width: `${r.w}%`, background: r.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel 5 — Status pill (bottom right) */}
      <div className="erp-panel erp-panel--br">
        <div className="erp-status-dot" />
        <div className="erp-panel-label" style={{ marginTop: '0.3rem' }}>System</div>
        <div className="erp-status-text">Online</div>
      </div>

    </div>
  );
}

/* ── Login Component ────────────────────────────────────────── */
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

      {/* ══════════════════════════════════════════════════════
          LEFT PANEL — ERP dashboard visualization
          ══════════════════════════════════════════════════════ */}
      <div className="login-panel-left">
        <div className="login-blob login-blob--1" />
        <div className="login-blob login-blob--2" />
        <div className="login-grid-overlay" />

        <div className="login-panel-left-inner login-panel-erp">

          {/* Brand top-left */}
          <div className="login-brand">
            <div className="login-brand-icon">
              <Dumbbell size={20} color="#fff" />
            </div>
            <span className="login-brand-name">FitGym</span>
          </div>

          {/* Main headline */}
          <div className="login-erp-headline">
            <h1 className="login-erp-title">
              RUN YOUR GYM.<br />
              <span className="login-erp-accent">SMARTER.</span>
            </h1>
            <p className="login-erp-sub">
              Everything your gym needs. In one place.
            </p>
          </div>

          {/* ERP Visualization */}
          <ERPVisualization />

          {/* Footer */}
          <p className="login-erp-footer">
            © {new Date().getFullYear()} FitGym ERP
          </p>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT PANEL — unchanged
          ══════════════════════════════════════════════════════ */}
      <div className="login-panel-right">
        <div className="login-form-wrap">

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

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-full login-submit-btn"
              disabled={busy || loading}
            >
              {busy
                ? <><span className="login-btn-spinner" /> Signing in…</>
                : <>Sign in <ArrowRight size={16} /></>
              }
            </button>
          </form>

          <div className="login-demo-section">
            <div className="login-demo-label">
              <span className="login-demo-line" />
              <span>Demo Accounts</span>
              <span className="login-demo-line" />
            </div>
            <div className="login-demo-btns">
              <button type="button" className="login-demo-btn" onClick={() => fillDemo('admin@fitgym.net', 'Admin@123')}>
                <span className="login-demo-role-dot login-demo-role-dot--admin" />
                <div>
                  <div className="login-demo-btn-title">Admin</div>
                  <div className="login-demo-btn-sub">Full access</div>
                </div>
              </button>
              <button type="button" className="login-demo-btn" onClick={() => fillDemo('trainer1@fitgym.net', 'Trainer@123')}>
                <span className="login-demo-role-dot login-demo-role-dot--trainer" />
                <div>
                  <div className="login-demo-btn-title">Trainer</div>
                  <div className="login-demo-btn-sub">Coach portal</div>
                </div>
              </button>
              <button type="button" className="login-demo-btn" onClick={() => fillDemo('trainee1@fitgym.net', 'Trainee@123')}>
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
