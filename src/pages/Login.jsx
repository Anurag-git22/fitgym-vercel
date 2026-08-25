import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Dumbbell, ArrowRight } from 'lucide-react';
import * as THREE from 'three';

/* ── Three.js dumbbell for the left panel ───────────────────── */
function initDumbbellScene(canvas) {
  const W = canvas.clientWidth  || 320;
  const H = canvas.clientHeight || 320;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
  camera.position.set(0, 0.3, 5.5);

  const metalMat = new THREE.MeshStandardMaterial({ color: 0x8b9dff, metalness: 0.95, roughness: 0.08 });
  const darkMat  = new THREE.MeshStandardMaterial({ color: 0x1a1f35, metalness: 0.8,  roughness: 0.3  });
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.88, roughness: 0.12 });

  const group = new THREE.Group();

  /* Bar */
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 24), metalMat);
  bar.rotation.z = Math.PI / 2;
  group.add(bar);

  /* Knurl */
  const knurl = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.7, 24), darkMat);
  knurl.rotation.z = Math.PI / 2;
  group.add(knurl);

  function addPlates(xOffset) {
    const sizes = [{ r: 0.68, h: 0.16 }, { r: 0.55, h: 0.13 }, { r: 0.44, h: 0.11 }];
    let x = xOffset;
    const dir = xOffset > 0 ? 1 : -1;
    sizes.forEach(({ r, h }) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32), plateMat);
      mesh.rotation.z = Math.PI / 2;
      mesh.position.x = x + dir * (h / 2);
      group.add(mesh);

      const edge = new THREE.Mesh(new THREE.TorusGeometry(r, 0.022, 8, 32), metalMat);
      edge.position.x = x + dir * (h / 2);
      edge.rotation.y = Math.PI / 2;
      group.add(edge);

      const hole = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 8, 20), darkMat);
      hole.position.x = x + dir * (h / 2);
      hole.rotation.y = Math.PI / 2;
      group.add(hole);

      x += dir * (h + 0.035);
    });
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 24), darkMat);
    collar.rotation.z = Math.PI / 2;
    collar.position.x = x + dir * 0.1;
    group.add(collar);
  }

  addPlates( 1.05);
  addPlates(-1.05);

  group.rotation.x =  0.18;
  group.rotation.y = -0.25;
  scene.add(group);

  /* Lights */
  const key = new THREE.DirectionalLight(0x9daaff, 4);
  key.position.set(-3, 4, 3);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x4f46e5, 2);
  fill.position.set(4, 1, 1);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x06b6d4, 1.5);
  rim.position.set(0, -2, -4);
  scene.add(rim);

  scene.add(new THREE.AmbientLight(0x1e1b4b, 2));

  const glow = new THREE.PointLight(0x6366f1, 2.5, 5);
  glow.position.set(0, -0.5, 0);
  scene.add(glow);

  let mx = 0, my = 0;
  const onMouse = (e) => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('mousemove', onMouse);

  let raf;
  const clock = new THREE.Clock();
  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    group.rotation.y  = -0.25 + t * 0.22;
    group.position.y  = Math.sin(t * 0.7) * 0.07;
    group.rotation.x  = 0.18 + my * 0.08;
    group.rotation.z  = mx * 0.04;
    glow.intensity    = 2.2 + Math.sin(t * 1.8) * 0.6;
    renderer.render(scene, camera);
  }
  animate();

  const onResize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('mousemove', onMouse);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
}

/* ── Login Component ────────────────────────────────────────── */
export default function Login() {
  const { signIn, loading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const canvasRef = useRef(null);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);
  const [showPass, setShowPass] = useState(false);

  const from = location.state?.from?.pathname ?? null;

  useEffect(() => {
    if (!canvasRef.current) return;
    const timer = setTimeout(() => {
      const cleanup = initDumbbellScene(canvasRef.current);
      return cleanup;
    }, 120);
    return () => clearTimeout(timer);
  }, []);

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
          LEFT PANEL — minimal premium 3D redesign
          ══════════════════════════════════════════════════════ */}
      <div className="login-panel-left">
        <div className="login-blob login-blob--1" />
        <div className="login-blob login-blob--2" />
        <div className="login-grid-overlay" />

        <div className="login-panel-left-inner login-panel-left-inner--centered">

          {/* Brand */}
          <div className="login-brand login-brand--top">
            <div className="login-brand-icon">
              <Dumbbell size={20} color="#fff" />
            </div>
            <span className="login-brand-name">FitGym</span>
          </div>

          {/* 3D centerpiece */}
          <div className="login-3d-wrap">
            <div className="login-ring login-ring--outer" />
            <div className="login-ring login-ring--mid"   />
            <div className="login-ring login-ring--inner" />
            <div className="login-glow-disc" />
            <canvas ref={canvasRef} className="login-3d-canvas" />
            <div className="login-orbit">
              <div className="login-orbit-dot login-orbit-dot--1" />
              <div className="login-orbit-dot login-orbit-dot--2" />
              <div className="login-orbit-dot login-orbit-dot--3" />
            </div>
          </div>

          {/* Text */}
          <div className="login-left-text">
            <h1 className="login-left-headline">
              One Gym.<br />One System.
            </h1>
            <p className="login-left-tagline">Manage. Track. Grow.</p>
          </div>

          <p className="login-left-footer">
            Gym Management &bull; Simplified
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
