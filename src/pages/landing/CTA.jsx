import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.2 }
    );
    ref.current?.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="land-cta-section" ref={ref}>
      <div className="fade-up">
        <h2 className="land-cta-title">
          Ready to Manage Your<br />
          Gym Smarter?
        </h2>
        <p className="land-cta-desc">
          Bring your gym operations, trainers and trainees together with
          FitGym — the intelligent platform built for modern fitness businesses.
        </p>
        <Link to="/login" className="land-cta-btn">
          Get Started <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}
