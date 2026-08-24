/**
 * Badge  — status pill
 *
 * Props:
 *   status  string   — mapped to a color class
 *   label   string?  — override display text (defaults to capitalised status)
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

export default function Badge({ status = '', label }) {
  const colorClass = STATUS_COLOR[status?.toLowerCase()] ?? 'badge--gray';
  const text = label ?? (status ? status[0].toUpperCase() + status.slice(1) : '—');
  return <span className={`badge ${colorClass}`}>{text}</span>;
}
