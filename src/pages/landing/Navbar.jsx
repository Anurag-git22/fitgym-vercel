import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Menu, X, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function scrollTo(id) {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <nav className={`land-nav${scrolled ? ' land-nav--scrolled' : ''}`}>
        {/* Logo */}
        <Link to="/" className="land-nav-logo">
          <div className="land-nav-logo-mark">
            <Dumbbell size={18} color="#fff" />
          </div>
          <span className="land-nav-logo-text">FitGym</span>
        </Link>

        {/* Desktop links */}
        <ul className="land-nav-links">
          <li><a href="#features"    onClick={e => { e.preventDefault(); scrollTo('features');  }}>Features</a></li>
          <li><a href="#roles"       onClick={e => { e.preventDefault(); scrollTo('roles');     }}>Roles</a></li>
          <li><a href="#how-it-works" onClick={e => { e.preventDefault(); scrollTo('how-it-works'); }}>How It Works</a></li>
        </ul>

        {/* Desktop actions */}
        <div className="land-nav-actions">
          <Link to="/login" className="land-btn-ghost">Login</Link>
          <Link to="/login" className="land-btn-primary">
            Get Started <ArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="land-nav-mobile-toggle"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`land-nav-mobile-menu${mobileOpen ? ' open' : ''}`}>
        <a href="#features"     onClick={e => { e.preventDefault(); scrollTo('features');     }}>Features</a>
        <a href="#roles"        onClick={e => { e.preventDefault(); scrollTo('roles');        }}>Roles</a>
        <a href="#how-it-works" onClick={e => { e.preventDefault(); scrollTo('how-it-works'); }}>How It Works</a>
        <Link to="/login" onClick={() => setMobileOpen(false)} style={{ color: '#818cf8', fontWeight: 700 }}>
          Login / Get Started →
        </Link>
      </div>
    </>
  );
}
