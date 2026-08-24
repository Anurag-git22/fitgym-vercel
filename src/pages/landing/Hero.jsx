import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Shield, Zap, Users } from 'lucide-react';
import * as THREE from 'three';

/* ── Three.js Dumbbell Scene ──────────────────────────────── */
function initThreeScene(canvas) {
  const W = canvas.clientWidth  || 420;
  const H = canvas.clientHeight || 420;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.toneMapping       = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 0.5, 5);

  /* ── Materials ─────────────────────────────────────────── */
  const metalMat = new THREE.MeshStandardMaterial({
    color:     0x7c85ff,
    metalness: 0.92,
    roughness: 0.12,
    envMapIntensity: 1.4,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color:     0x1a1f35,
    metalness: 0.8,
    roughness: 0.25,
  });

  const plateMat = new THREE.MeshStandardMaterial({
    color:     0x6366f1,
    metalness: 0.85,
    roughness: 0.15,
    envMapIntensity: 1.2,
  });

  /* ── Dumbbell geometry ─────────────────────────────────── */
  const group = new THREE.Group();

  // Central bar
  const barGeo = new THREE.CylinderGeometry(0.09, 0.09, 3.2, 24);
  const bar    = new THREE.Mesh(barGeo, metalMat);
  bar.rotation.z = Math.PI / 2;
  bar.castShadow = true;
  group.add(bar);

  // Knurl pattern (thin ring on bar center)
  const knurlGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.8, 24);
  const knurl    = new THREE.Mesh(knurlGeo, darkMat);
  knurl.rotation.z = Math.PI / 2;
  group.add(knurl);

  // Helper: add a weight plate stack on one side
  function addPlates(xOffset) {
    const sizes = [
      { r: 0.72, h: 0.18 },
      { r: 0.60, h: 0.14 },
      { r: 0.50, h: 0.12 },
    ];
    let x = xOffset;
    const dir = xOffset > 0 ? 1 : -1;

    sizes.forEach(({ r, h }) => {
      // Outer plate disc
      const geo  = new THREE.CylinderGeometry(r, r, h, 36);
      const mesh = new THREE.Mesh(geo, plateMat);
      mesh.rotation.z = Math.PI / 2;
      mesh.position.x = x + dir * (h / 2);
      mesh.castShadow = true;
      group.add(mesh);

      // Edge bevel ring
      const edgeGeo  = new THREE.TorusGeometry(r, 0.025, 8, 36);
      const edgeMesh = new THREE.Mesh(edgeGeo, metalMat);
      edgeMesh.position.x = x + dir * (h / 2);
      edgeMesh.rotation.y = Math.PI / 2;
      group.add(edgeMesh);

      // Center hole
      const holeGeo  = new THREE.TorusGeometry(0.14, 0.04, 8, 24);
      const holeMesh = new THREE.Mesh(holeGeo, darkMat);
      holeMesh.position.x = x + dir * (h / 2);
      holeMesh.rotation.y = Math.PI / 2;
      group.add(holeMesh);

      x += dir * (h + 0.04);
    });

    // End collar
    const collarGeo  = new THREE.CylinderGeometry(0.18, 0.18, 0.22, 24);
    const collarMesh = new THREE.Mesh(collarGeo, darkMat);
    collarMesh.rotation.z = Math.PI / 2;
    collarMesh.position.x = x + dir * 0.11;
    collarMesh.castShadow = true;
    group.add(collarMesh);
  }

  addPlates( 1.1);
  addPlates(-1.1);

  group.rotation.x =  0.2;
  group.rotation.y = -0.3;
  scene.add(group);

  /* ── Shadow plane ──────────────────────────────────────── */
  const shadowGeo   = new THREE.PlaneGeometry(6, 6);
  const shadowMat   = new THREE.ShadowMaterial({ opacity: 0.25 });
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = -1.2;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  /* ── Lights ────────────────────────────────────────────── */
  // Key light — top-left purple
  const keyLight = new THREE.DirectionalLight(0x8b9dff, 3.5);
  keyLight.position.set(-3, 4, 3);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far  = 20;
  scene.add(keyLight);

  // Fill light — right side, softer
  const fillLight = new THREE.DirectionalLight(0x4f46e5, 1.8);
  fillLight.position.set(4, 2, 1);
  scene.add(fillLight);

  // Rim light — back
  const rimLight = new THREE.DirectionalLight(0xa5b4fc, 1.2);
  rimLight.position.set(0, -2, -4);
  scene.add(rimLight);

  // Ambient
  const ambient = new THREE.AmbientLight(0x1e1b4b, 1.5);
  scene.add(ambient);

  // Point glow under dumbbell
  const glowLight = new THREE.PointLight(0x6366f1, 2, 5);
  glowLight.position.set(0, -0.8, 0);
  scene.add(glowLight);

  /* ── Environment map (fake IBL using gradient) ─────────── */
  const pmremGen = new THREE.PMREMGenerator(renderer);
  pmremGen.compileEquirectangularShader();
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x0d1321);
  const envRT = pmremGen.fromScene(envScene);
  scene.environment = envRT.texture;
  pmremGen.dispose();

  /* ── Mouse parallax ────────────────────────────────────── */
  let mouseX = 0, mouseY = 0;
  const onMouseMove = (e) => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    mouseX = (e.clientX - cx) / cx;
    mouseY = (e.clientY - cy) / cy;
  };
  window.addEventListener('mousemove', onMouseMove);

  /* ── Animation loop ────────────────────────────────────── */
  let frameId;
  const clock = new THREE.Clock();

  function animate() {
    frameId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Slow auto-rotation
    group.rotation.y = -0.3 + t * 0.28;
    // Floating bob
    group.position.y = Math.sin(t * 0.7) * 0.08;
    // Subtle mouse parallax
    group.rotation.x = 0.2 + mouseY * 0.12;
    group.rotation.z = mouseX * 0.06;

    // Glow pulse
    glowLight.intensity = 1.8 + Math.sin(t * 1.5) * 0.6;

    renderer.render(scene, camera);
  }

  animate();

  /* ── Resize handler ────────────────────────────────────── */
  function onResize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  /* ── Cleanup ───────────────────────────────────────────── */
  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
}

/* ── Hero Component ───────────────────────────────────────── */
export default function Hero() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    // Small delay so the canvas is fully laid out
    const timer = setTimeout(() => {
      const cleanup = initThreeScene(canvasRef.current);
      return cleanup;
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  function scrollToFeatures() {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section className="land-hero">
      <div className="land-hero-inner">

        {/* ── Left ── */}
        <div className="land-hero-left fade-up visible">
          <div className="land-hero-badge">
            <span className="land-hero-badge-dot" />
            Premium Gym Management Platform
          </div>

          <h1 className="land-hero-title">
            Your Gym.<br />
            <span className="accent-word">Smarter.</span> Simpler.<br />
            Stronger.
          </h1>

          <p className="land-hero-desc">
            A modern gym management platform that connects administrators,
            trainers, and trainees in one powerful, intelligent system.
          </p>

          <div className="land-hero-actions">
            <Link to="/login" className="land-btn-hero-primary">
              Get Started <ArrowRight size={16} />
            </Link>
            <button className="land-btn-hero-secondary" onClick={scrollToFeatures}>
              Explore Features <ChevronDown size={16} />
            </button>
          </div>

          <div className="land-hero-stats">
            <div>
              <div className="land-hero-stat-num">3</div>
              <div className="land-hero-stat-label">Role Portals</div>
            </div>
            <div>
              <div className="land-hero-stat-num">9+</div>
              <div className="land-hero-stat-label">Admin Modules</div>
            </div>
            <div>
              <div className="land-hero-stat-num">100%</div>
              <div className="land-hero-stat-label">Real-time Data</div>
            </div>
          </div>
        </div>

        {/* ── Right — 3D ── */}
        <div className="land-hero-right fade-up delay-2 visible">
          <div className="land-hero-glow" />

          <div className="land-hero-canvas-wrap">
            <canvas
              ref={canvasRef}
              style={{ width: '100%', height: '100%', display: 'block' }}
            />

            {/* Floating stat cards */}
            <div className="land-float-card land-float-card--tl">
              <div className="land-float-card-label">Active Members</div>
              <div className="land-float-card-value">1,248</div>
              <div className="land-float-card-sub">↑ +12% this month</div>
            </div>

            <div className="land-float-card land-float-card--tr">
              <div className="land-float-card-label">Today's Attendance</div>
              <div className="land-float-card-value">86%</div>
              <div className="land-float-card-sub">↑ Above average</div>
            </div>

            <div className="land-float-card land-float-card--bl">
              <div className="land-float-card-label">Monthly Growth</div>
              <div className="land-float-card-value">+18.4%</div>
              <div className="land-float-card-sub">↑ Revenue up</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
