/**
 * Badge — Status pill with glowing status dot indicator
 */
const STATUS_COLOR = {
  active:    'badge--green',
  inactive:  'badge--gray',
  expired:   'badge--red',
  cancelled: 'badge--red',
  paid:      'badge--green',
  pending:   'badge--yellow',
  failed:    'badge--red',
  present:   'badge--green',
  absent:    'badge--red',
  admin:     'badge--purple',
  trainer:   'badge--blue',
  trainee:   'badge--gray',
};

export default function Badge({ status = '', label, dot = true }) {
  const norm = status?.toLowerCase() || '';
  const colorClass = STATUS_COLOR[norm] ?? 'badge--gray';
  const text = label ?? (status ? status[0].toUpperCase() + status.slice(1) : '—');

  return (
    <span className={`badge ${colorClass}`}>
      {dot && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          boxShadow: '0 0 6px currentColor',
          display: 'inline-block',
        }} />
      )}
      {text}
    </span>
  );
}
