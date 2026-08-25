import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Dumbbell, KeyRound, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [error,     setError]     = useState('');
  const [message,   setMessage]   = useState('');
  const [busy,      setBusy]      = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [checking,  setChecking]  = useState(true);

  useEffect(() => {
    // Supabase puts the token in the URL hash when the user clicks the email link.
    // onAuthStateChange fires with event 'PASSWORD_RECOVERY' when the token is valid.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidLink(true);
        setChecking(false);
      } else if (event === 'SIGNED_IN' && session) {
        // Also valid — token was exchanged for a session
        setValidLink(true);
        setChecking(false);
      }
    });

    // Also check for an existing session (user already authenticated via token)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidLink(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);

    const { error: updateErr } = await supabase.auth.updateUser({ password });

    setBusy(false);

    if (updateErr) {
      setError(updateErr.message ?? 'Failed to update password. Please try again.');
    } else {
      setMessage('Password updated successfully!');
      // Sign out so they log in fresh with the new password
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/login');
      }, 2500);
    }
  }

  if (checking) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--center">
          <div className="spinner" />
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.875rem' }}>
            Verifying reset link…
          </p>
        </div>
      </div>
    );
  }

  if (!validLink) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--center">
          <span className="error-code">⚠️</span>
          <h2 className="auth-title">Invalid or Expired Link</h2>
          <p className="auth-subtitle">
            This password reset link is invalid or has already expired.
            Please request a new one.
          </p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Request new link
          </Link>
          <p className="auth-footer-link">
            <Link to="/login">← Back to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-split">

      {/* Left panel */}
      <div className="login-panel-left">
        <div className="login-blob login-blob--1" />
        <div className="login-blob login-blob--2" />
        <div className="login-panel-left-inner">
          <div className="login-brand">
            <div className="login-brand-icon">
              <Dumbbell size={22} color="#fff" />
            </div>
            <span className="login-brand-name">FitGym</span>
          </div>
          <div className="login-hero-text">
            <h1 className="login-hero-title">
              Secure Your<br />
              <span className="login-hero-accent">Account.</span>
            </h1>
            <p className="login-hero-desc">
              Choose a strong password to keep your FitGym account safe.
              Use at least 6 characters with a mix of letters and numbers.
            </p>
          </div>
          <ul className="login-features">
            <li className="login-feature-item">
              <div className="login-feature-icon"><KeyRound size={16} /></div>
              <div>
                <div className="login-feature-title">Strong Password Tips</div>
                <div className="login-feature-sub">At least 6 characters, mix of letters & numbers</div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-panel-right">
        <div className="login-form-wrap">

          <div className="login-mobile-brand" style={{ display: 'flex' }}>
            <div className="login-brand-icon" style={{ width: 36, height: 36 }}>
              <Dumbbell size={18} color="#fff" />
            </div>
            <span className="login-brand-name">FitGym</span>
          </div>

          {message ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <CheckCircle size={52} color="#10b981" style={{ margin: '0 auto 1rem' }} />
              <h2 className="login-form-title">Password Updated!</h2>
              <p className="login-form-sub" style={{ marginBottom: '0.5rem' }}>
                Your password has been changed successfully.
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Redirecting to login…
              </p>
            </div>
          ) : (
            <>
              <h2 className="login-form-title">Set New Password</h2>
              <p className="login-form-sub">Enter your new password below.</p>

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="password">New Password</label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={busy}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirm">Confirm New Password</label>
                  <input
                    id="confirm"
                    type="password"
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    disabled={busy}
                  />
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div style={{ marginTop: '-0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.3rem' }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{
                          flex: 1, height: 3, borderRadius: 2,
                          background: password.length >= i * 3
                            ? i <= 1 ? '#ef4444' : i <= 2 ? '#f59e0b' : i <= 3 ? '#6366f1' : '#10b981'
                            : 'rgba(255,255,255,0.1)',
                          transition: 'background 0.2s'
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {password.length < 4  ? 'Too short' :
                       password.length < 7  ? 'Weak' :
                       password.length < 10 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                )}

                {error && (
                  <div className="auth-error" role="alert">{error}</div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-full login-submit-btn"
                  disabled={busy}
                >
                  {busy ? (
                    <><span className="login-btn-spinner" /> Updating…</>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>

              <p className="auth-footer-link" style={{ marginTop: '1.5rem' }}>
                <Link to="/login">← Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
