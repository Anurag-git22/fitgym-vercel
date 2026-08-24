import { useEffect, useRef } from 'react';

const BARS = [45, 72, 58, 88, 65, 94, 70, 82, 60, 90, 75, 85];

const PAYMENTS = [
  { name: 'Alice T.',  amount: '$120', status: 'paid'    },
  { name: 'Bob T.',    amount: '$50',  status: 'pending' },
  { name: 'Carol T.',  amount: '$480', status: 'paid'    },
  { name: 'Dan T.',    amount: '$50',  status: 'pending' },
];

export default function DashboardPreview() {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.1 }
    );
    ref.current?.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="land-section land-preview-section" ref={ref}>
      <div className="land-section-inner">
        <div className="land-preview-header fade-up">
          <div className="land-section-tag">Dashboard</div>
          <h2 className="land-section-title">
            See Your Gym <span className="accent-word">at a Glance</span>
          </h2>
          <p className="land-section-subtitle" style={{ margin: '0 auto' }}>
            A powerful admin dashboard gives you real-time visibility across
            your entire gym operation — members, revenue, attendance and more.
          </p>
        </div>

        <div className="fade-up delay-2">
          <div className="land-browser-frame">
            {/* Browser chrome */}
            <div className="land-browser-bar">
              <div className="land-browser-dots">
                <div className="land-browser-dot" />
                <div className="land-browser-dot" />
                <div className="land-browser-dot" />
              </div>
              <div className="land-browser-url">fitgym.app/admin/dashboard</div>
            </div>

            {/* Stat cards */}
            <div className="land-preview-content">
              {[
                { icon: '👥', val: '6',      label: 'Total Trainees'    },
                { icon: '🏋️', val: '2',      label: 'Total Trainers'    },
                { icon: '🪪', val: '5',      label: 'Active Memberships'},
                { icon: '💰', val: '₹940',   label: 'Total Revenue'     },
                { icon: '⏳', val: '1',      label: 'Pending Payments'  },
                { icon: '📋', val: '6',      label: "Today's Attendance"},
              ].map(s => (
                <div key={s.label} className="land-preview-stat">
                  <div className="land-preview-stat-icon">{s.icon}</div>
                  <div className="land-preview-stat-val">{s.val}</div>
                  <div className="land-preview-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="land-preview-chart-row">
              {/* Revenue bar chart */}
              <div className="land-preview-chart-placeholder">
                <div className="land-preview-chart-title">Revenue Overview</div>
                <div className="land-preview-bars">
                  {BARS.map((h, i) => (
                    <div
                      key={i}
                      className="land-preview-bar"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Payments list */}
              <div className="land-preview-list-placeholder">
                <div className="land-preview-chart-title" style={{ marginBottom: '0.5rem' }}>
                  Recent Payments
                </div>
                {PAYMENTS.map(p => (
                  <div key={p.name} className="land-preview-list-item">
                    <span>{p.name}</span>
                    <span>{p.amount}</span>
                    <span className={`land-preview-badge ${p.status}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
