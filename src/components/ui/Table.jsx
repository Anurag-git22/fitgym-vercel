/**
 * Table — Responsive Dark SaaS Data Table with Skeleton Loaders
 * Renders as cards on mobile (≤767px) using hideOnMobile column config.
 */
export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMsg = 'No records found.',
  rowKey = 'id',
  onRowClick,
  sortBy,
  sortDir,
  onSort,
}) {
  const visibleCols = columns.filter(c => !c.hideOnMobile);
  const actionCols  = columns.filter(c => c.hideOnMobile && c.key === 'actions');

  function SortIcon({ col }) {
    if (col.key !== sortBy) return <span style={{ opacity: 0.3, marginLeft: 4 }}>↕</span>;
    return <span style={{ marginLeft: 4, color: 'var(--primary)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  if (loading) {
    return (
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key} style={c.width ? { width: c.width } : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="skeleton-row">
                {columns.map(c => (
                  <td key={c.key}><div className="skeleton-cell" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="data-table-cards">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="data-card data-card--skeleton">
              {visibleCols.map(c => (
                <div key={c.key} className="data-card-row">
                  <div className="skeleton-cell" style={{ height: 12, width: '40%' }} />
                  <div className="skeleton-cell" style={{ height: 14, width: '55%' }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(c => (
              <th
                key={c.key}
                style={c.width ? { width: c.width } : undefined}
                className={c.sortable ? 'data-table-th--sortable' : ''}
                onClick={() => c.sortable && onSort?.(c.key)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', cursor: c.sortable ? 'pointer' : 'default' }}>
                  {c.label}
                  {c.sortable && <SortIcon col={c} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                {emptyMsg}
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'table-row--clickable' : undefined}
              >
                {columns.map(c => (
                  <td key={c.key}>
                    {c.render ? c.render(row[c.key], row) : row[c.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="data-table-cards">
        {data.length === 0 ? (
          <div className="table-empty">{emptyMsg}</div>
        ) : (
          data.map(row => (
            <div
              key={row[rowKey]}
              className={`data-card${onRowClick ? ' data-card--clickable' : ''}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {visibleCols.map(c => (
                <div key={c.key} className="data-card-row">
                  <span className="data-card-label">{c.label}</span>
                  <span className="data-card-value">
                    {c.render ? c.render(row[c.key], row) : row[c.key] ?? '—'}
                  </span>
                </div>
              ))}
              {actionCols.length > 0 && (
                <div className="data-card-actions">
                  {actionCols.map(c => (
                    <span key={c.key}>{c.render ? c.render(row[c.key], row) : row[c.key] ?? '—'}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
