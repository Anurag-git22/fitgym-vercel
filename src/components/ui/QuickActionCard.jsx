import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * QuickActionCard — Interactive action tile with hover arrow animation
 */
export default function QuickActionCard({
  to,
  onClick,
  icon,
  title,
  description
}) {
  const content = (
    <>
      <div className="quick-action-icon">
        {icon}
      </div>
      <div className="quick-action-text">
        <h4 className="quick-action-title">{title}</h4>
        {description && <p className="quick-action-desc">{description}</p>}
      </div>
      <div className="quick-action-arrow">
        <ArrowRight size={16} />
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="quick-action-card">
        {content}
      </Link>
    );
  }

  return (
    <div className="quick-action-card" onClick={onClick} role="button" tabIndex={0}>
      {content}
    </div>
  );
}
