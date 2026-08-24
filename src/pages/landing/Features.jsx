import { useEffect, useRef } from 'react';
import { LayoutDashboard, Users, TrendingUp, CreditCard, CalendarCheck, ShieldCheck } from 'lucide-react';

const FEATURES = [
  {
    num: '01',
    icon: <LayoutDashboard size={22} />,
    title: 'Smart Management',
    desc:  'Manage trainees, trainers, memberships and gym operations from one centralized, real-time platform.',
  },
  {
    num: '02',
    icon: <Users size={22} />,
    title: 'Trainer Management',
    desc:  'Trainers manage their assigned trainees, create workout plans, track attendance and monitor progress.',
  },
  {
    num: '03',
    icon: <TrendingUp size={22} />,
    title: 'Member Progress',
    desc:  'Trainees view their schedule, workouts, body progress charts, attendance history and payments in one place.',
  },
  {
    num: '04',
    icon: <CreditCard size={22} />,
    title: 'Payments & Revenue',
    desc:  'Record and track payments, monitor revenue trends, and get notified about pending or overdue payments.',
  },
  {
    num: '05',
    icon: <CalendarCheck size={22} />,
    title: 'Attendance Tracking',
    desc:  'Mark and view daily attendance for all trainees. Visualise patterns with monthly attendance charts.',
  },
  {
    num: '06',
    icon: <ShieldCheck size={22} />,
    title: 'Role-Based Security',
    desc:  'Every role sees only what they need. Postgres Row-Level Security enforces access at the database level.',
  },
];

export default function Features() {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.12 }
    );
    ref.current?.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="land-section" id="features" ref={ref}>
      <div className="land-section-inner">
        <div className="fade-up">
          <div className="land-section-tag">Features</div>
          <h2 className="land-section-title">
            Everything You Need to<br />
            <span className="accent-word">Run Your Gym</span>
          </h2>
          <p className="land-section-subtitle">
            A complete suite of tools built for modern gym operations — from
            member management to analytics, all in one platform.
          </p>
        </div>

        <div className="land-features-grid">
          {FEATURES.map((f, i) => (
            <div
              key={f.num}
              className={`land-feature-card fade-up delay-${Math.min(i + 1, 5)}`}
            >
              <div className="land-feature-num">{f.num}</div>
              <div className="land-feature-icon">{f.icon}</div>
              <h3 className="land-feature-title">{f.title}</h3>
              <p className="land-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
