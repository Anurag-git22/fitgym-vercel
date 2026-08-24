/**
 * Card — Dark glassmorphic container with refined headers & actions
 */
export default function Card({
  title,
  subtitle,
  icon,
  actions,
  padding = true,
  className = '',
  style,
  children,
}) {
  const hasHeader = title || subtitle || actions || icon;

  return (
    <div className={`card ${className}`} style={style}>
      {hasHeader && (
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
            {icon && (
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                flexShrink: 0
              }}>
                {icon}
              </div>
            )}
            <div className="card-header-text">
              {title && <h3 className="card-title">{title}</h3>}
              {subtitle && <p className="card-subtitle">{subtitle}</p>}
            </div>
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
