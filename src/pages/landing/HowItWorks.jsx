import { useEffect, useRef } from 'react';
import { LogIn, UserCog, BarChart3 } from 'lucide-react';

const STEPS = [
  {
    num:   '01',
    icon:  <LogIn size={24} />,
    title: 'Sign In',
    desc:  'Access FitGym with your existing account credentials. Secure authentication powered by Supabase.',
  },
  {
    num:   '02',
    icon:  <UserCog size={24} />,
    title: 'Choose Your Role',
    desc:  'FitGym automatically delivers the right experience — Admin, Trainer, or Trainee — based on your role.',
  },
  {
    num:   '03',
    icon:  <BarChart3 size={24} />,
    title: 'Manage & Track',
    desc:  'Manage your gym, assign workouts, track attendance and progress — all from one intelligent platform.',
  },
];

export default function HowItWorks() {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.12 }
    );
    ref.current?.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="land-section land-how-section" id="how-it-works" ref={ref}>
      <div className="land-section-inner">
        <div className="land-how-header fade-up">
          <div className="land-section-tag">Process</div>
          <h2 className="land-section-title">
            Up and Running in <span className="accent-word">3 Steps</span>
          </h2>
          <p className="land-section-subtitle" style={{ margin: '0 auto' }}>
            Getting started with FitGym is simple. No complex setup, no lengthy
            onboarding — just sign in and start managing.
          </p>
        </div>

        <div className="land-how-grid">
          {STEPS.map((s, i) => (
            <div key={s.num} className={`land-how-step fade-up delay-${i + 1}`}>
              <div className="land-how-step-num">{s.num}</div>
              <h3 className="land-how-step-title">{s.title}</h3>
              <p className="land-how-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
