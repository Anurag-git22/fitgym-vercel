import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className={`breadcrumbs-item ${isLast ? 'breadcrumbs-item--current' : ''}`}
            >
              {isLast ? (
                <span className="breadcrumbs-label" aria-current="page">
                  {item.label}
                </span>
              ) : item.to ? (
                <Link to={item.to} className="breadcrumbs-link">
                  {item.label}
                </Link>
              ) : item.href ? (
                <a href={item.href} className="breadcrumbs-link">
                  {item.label}
                </a>
              ) : item.onClick ? (
                <button type="button" className="breadcrumbs-link" onClick={item.onClick}>
                  {item.label}
                </button>
              ) : (
                <span className="breadcrumbs-label">{item.label}</span>
              )}

              {!isLast && (
                <span className="breadcrumbs-separator" aria-hidden="true">
                  <ChevronRight size={14} />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
