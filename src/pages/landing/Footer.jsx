import { Link } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';

export default function Footer() {
  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <footer className="land-footer">
      <div className="land-footer-inner">
        {/* Brand */}
        <div className="land-footer-brand">
          <div className="land-footer-logo">
            <div className="land-footer-logo-mark">
              <Dumbbell size={16} color="#fff" />
            </div>
            <span className="land-footer-logo-text">FitGym</span>
          </div>
          <p className="land-footer-tagline">
            Smart gym management for modern fitness businesses.
          </p>
        </div>

        {/* Links */}
        <ul className="land-footer-links">
          <li><a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</a></li>
          <li><a href="#features"    onClick={e => { e.preventDefault(); scrollTo('features');     }}>Features</a></li>
          <li><a href="#roles"       onClick={e => { e.preventDefault(); scrollTo('roles');        }}>Roles</a></li>
          <li><a href="#how-it-works" onClick={e => { e.preventDefault(); scrollTo('how-it-works'); }}>How It Works</a></li>
          <li><Link to="/login">Login</Link></li>
        </ul>
      </div>

      <div className="land-footer-bottom">
        <p className="land-footer-copy">
          © {new Date().getFullYear()} <span>FitGym</span>. All rights reserved.
        </p>
        <p className="land-footer-copy">
          Built with React + Supabase
        </p>
      </div>
    </footer>
  );
}
