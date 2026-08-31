/**
 * Badge — consistent status pills across the app.
 */
const STATUS_COLOR = {
  active:         'badge--green',
  inactive:       'badge--gray',
  expired:        'badge--red',
  cancelled:      'badge--red',
  paid:           'badge--green',
  unpaid:         'badge--yellow',
  pending:        'badge--yellow',
  failed:         'badge--red',
  present:        'badge--green',
  absent:         'badge--red',
  admin:          'badge--purple',
  trainer:        'badge--blue',
  trainee:        'badge--gray',
  expiring:       'badge--yellow',
  'expiring soon': 'badge--yellow',
  expiring_soon:  'badge--yellow',
};

const STATUS_LABEL = {
  unpaid: 'Unpaid',
  expiring: 'Expiring Soon',
  'expiring soon': 'Expiring Soon',
  expiring_soon: 'Expiring Soon',
};

export default function Badge({ status = '', label, dot = true }) {
  const norm = status?.toLowerCase() || '';
  const colorClass = STATUS_COLOR[norm] ?? 'badge--gray';
  const text = label
    ?? STATUS_LABEL[norm]
    ?? (status ? status[0].toUpperCase() + status.slice(1) : '—');

  return (
    <span className={`badge ${colorClass}`}>
      {dot && <span className="badge-dot" />}
      {text}
    </span>
  );
}
