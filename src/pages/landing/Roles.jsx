import { useEffect, useRef } from 'react';
import { ShieldCheck, Dumbbell, UserCircle } from 'lucide-react';

const ROLES = [
  {
    key:   'admin',
    icon:  <ShieldCheck size={28} />,
    label: 'Role',
    title: 'Admin',
    desc:  'Full control over every aspect of your gym — people, money, and data.',
    features: [
      'Manage all trainees & trainers',
      'Memberships & subscriptions',
      'Payments & revenue tracking',
      'Attendance overview',
      'Analytics & charts',
      'Notifications system',
    ],
  },
  {
    key:   'trainer',
    icon:  <Dumbbell size={28} />,
    label: 'Role',
    title: 'Trainer',
    desc:  'Focus on coaching. Manage your assigned trainees and their progress.',
    features: [
      'View assigned trainees',
      'Create workout plans',
      'Mark daily attendance',
      'Log progress entries',
      'Monitor trainee detail',
      'Track performance',
    ],
  },
  {
    key:   'trainee',
    icon:  <UserCircle size={28} />,
    label: 'Role',
    title: 'Trainee',
    desc:  'Stay on top of your fitness journey with a personal dashboard.',
    features: [
      'View workout plan',
      'Track attendance %',
      'Monitor body progress',
      'Check membership status',
      'View payment history',
      'Profile management',
    ],
  },
];

export default function Roles() {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.1 }
    );
    ref.current?.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="land-section land-roles-section" id="roles" ref={ref}>
      <div className="land-section-inner">
        <div className="land-roles-header fade-up">
          <div className="land-section-tag">One Platform</div>
          <h2 className="land-section-title">
            Three <span className="accent-word">Powerful</span> Experiences
          </h2>
          <p className="land-section-subtitle" style={{ margin: '0 auto' }}>
            Every role gets a tailored portal — purpose-built for how they
            actually use the platform.
          </p>
        </div>

        <div className="land-roles-grid">
          {ROLES.map((r, i) => (
            <div
              key={r.key}
              className={`land-role-card land-role-card--${r.key} fade-up delay-${i + 1}`}
            >
              <div className="land-role-icon-wrap">{r.icon}</div>
              <div className="land-role-label">{r.label}</div>
              <h3 className="land-role-title">{r.title}</h3>
              <p className="land-role-desc">{r.desc}</p>
              <ul className="land-role-features">
                {r.features.map(f => <li key={f}>{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
