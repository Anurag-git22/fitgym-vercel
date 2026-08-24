/**
 * Card  — generic content container
 *
 * Props:
 *   title      string?   — optional header title
 *   subtitle   string?   — optional muted subtext below title
 *   actions    ReactNode — optional right-side header slot (buttons, links)
 *   padding    boolean   — default true; set false to remove inner padding
 *   className  string?
 *   children
 */
export default function Card({
  title,
  subtitle,
  actions,
  padding = true,
  className = '',
  children,
}) {
  const hasHeader = title || subtitle || actions;
  return (
    <div className={`card ${className}`}>
      {hasHeader && (
        <div className="card-header">
          <div className="card-header-text">
            {title    && <h3 className="card-title">{title}</h3>}
            {subtitle && <p  className="card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className={padding ? 'card-body' : 'card-body card-body--no-pad'}>
        {children}
      </div>
    </div>
  );
}
