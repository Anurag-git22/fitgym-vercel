/**
 * EmptyState  — zero-data placeholder
 *
 * Props:
 *   icon     string   emoji
 *   title    string
 *   message  string?
 *   action   ReactNode?  e.g. a <button>
 */
export default function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">{icon}</span>
      <h3 className="empty-state-title">{title}</h3>
      {message && <p className="empty-state-message">{message}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
