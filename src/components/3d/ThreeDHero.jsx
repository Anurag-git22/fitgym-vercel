import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

/**
 * ThreeDHero
 * High-performance interactive 3D Fitness Hero canvas using Three.js.
 * Renders a procedural matte-carbon & cyber-cyan dumbbell sculpture with dynamic lighting,
 * mouse parallax response, and floating glassmorphism KPI badges.
 */
export default function ThreeDHero({
  attendancePct = '88%',
  status = 'Active Peak',
  activeMembers = 142
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width  = container.clientWidth  || 380;
    const height = container.clientHeight || 260;

    // 1. Scene & Camera
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    // Ensure canvas never overflows
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width   = '100%';
    renderer.domElement.style.height  = '100%';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top     = '0';
    renderer.domElement.style.left    = '0';
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x06b6d4, 3.5); // Cyan key
    keyLight.position.set(5, 6, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 2.5); // Indigo rim
    rimLight.position.set(-6, -4, -3);
    scene.add(rimLight);

    const accentPoint = new THREE.PointLight(0x38bdf8, 2, 8);
    accentPoint.position.set(0, 0, 2);
    scene.add(accentPoint);

    // 4. Procedural 3D Dumbbell Sculpture Group
    const group = new THREE.Group();

    // Materials
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0x242d3d,
      metalness: 0.9,
      roughness: 0.2,
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.5,
      roughness: 0.4,
    });

    const cyanGlowMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    });

    // Central Grip Bar
    const barGeo = new THREE.CylinderGeometry(0.18, 0.18, 3.2, 32);
    const bar = new THREE.Mesh(barGeo, chromeMat);
    bar.rotation.z = Math.PI / 2;
    group.add(bar);

    // Grip Knurling rings
    for (let i = -0.8; i <= 0.8; i += 0.4) {
      const ringGeo = new THREE.TorusGeometry(0.19, 0.02, 16, 32);
      const ring = new THREE.Mesh(ringGeo, cyanGlowMat);
      ring.rotation.y = Math.PI / 2;
      ring.position.x = i;
      group.add(ring);
    }

    // Weight Plates (Left & Right)
    const createPlates = (side) => {
      const xOffset = side * 1.8;

      // Inner plate
      const p1Geo = new THREE.CylinderGeometry(0.95, 0.95, 0.35, 32);
      const p1 = new THREE.Mesh(p1Geo, carbonMat);
      p1.rotation.z = Math.PI / 2;
      p1.position.x = xOffset;
      group.add(p1);

      // Cyan Accent Bevel Ring
      const b1Geo = new THREE.TorusGeometry(0.95, 0.035, 16, 32);
      const b1 = new THREE.Mesh(b1Geo, cyanGlowMat);
      b1.rotation.y = Math.PI / 2;
      b1.position.x = xOffset;
      group.add(b1);

      // Outer plate
      const p2Geo = new THREE.CylinderGeometry(0.8, 0.8, 0.35, 32);
      const p2 = new THREE.Mesh(p2Geo, carbonMat);
      p2.rotation.z = Math.PI / 2;
      p2.position.x = xOffset + (side * 0.4);
      group.add(p2);

      // End Cap
      const capGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 32);
      const cap = new THREE.Mesh(capGeo, chromeMat);
      cap.rotation.z = Math.PI / 2;
      cap.position.x = xOffset + (side * 0.65);
      group.add(cap);
    };

    createPlates(-1); // Left plates
    createPlates(1);  // Right plates

    // Floating Geometric Orbit Ring
    const orbitGeo = new THREE.TorusGeometry(2.3, 0.02, 16, 64);
    const orbit = new THREE.Mesh(orbitGeo, cyanGlowMat);
    orbit.rotation.x = Math.PI / 3;
    group.add(orbit);

    group.rotation.x = 0.35;
    group.rotation.y = 0.4;
    scene.add(group);

    // 5. Mouse Parallax Interaction
    let targetX = 0;
    let targetY = 0;
    let isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.5;
      targetY = y * 0.35;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 6. Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth  || 380;
      const h = container.clientHeight || 260;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 7. Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isReducedMotion) {
        // Continuous gentle rotation
        group.rotation.y += 0.007;
        group.rotation.z += 0.003;
        orbit.rotation.z -= 0.012;

        // Smooth mouse interpolation (lerp)
        group.rotation.x += (0.35 + targetY - group.rotation.x) * 0.05;
        group.position.x += (targetX - group.position.x) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="hero-canvas-wrap">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="three-canvas-container" title="Interactive 3D FitGym Sculpture" />

      {/* Floating Status Glass Badges */}
      <div className="hero-floating-card hero-floating-card--top">
        <div className="floating-card-icon floating-card-icon--green">
          <ShieldCheck size={18} />
        </div>
        <div>
          <div className="floating-card-val">{status}</div>
          <div className="floating-card-lbl">System Status</div>
        </div>
      </div>

      <div className="hero-floating-card hero-floating-card--bottom">
        <div className="floating-card-icon floating-card-icon--cyan">
          <Activity size={18} />
        </div>
        <div>
          <div className="floating-card-val">{attendancePct} Check-in Rate</div>
          <div className="floating-card-lbl">Daily Trainee Engagement</div>
        </div>
      </div>
    </div>
  );
}
