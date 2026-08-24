/**
 * Table  — responsive data table
 *
 * Props:
 *   columns   Array<{ key, label, render?, width? }>
 *   data      Array<object>   — each row must have a unique `id` field
 *   loading   boolean?
 *   emptyMsg  string?         — text shown when data is empty
 *   rowKey    string?         — field used as React key, default 'id'
 *   onRowClick  (row) => void?
 */
export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMsg = 'No records found.',
  rowKey = 'id',
  onRowClick,
}) {
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
      </div>
    );
  }

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
    </div>
  );
}
