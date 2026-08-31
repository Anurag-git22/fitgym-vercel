/**
 * FormField — visual wrapper only. Does not change input behavior.
 */
export default function FormField({
  label,
  hint,
  error,
  icon,
  htmlFor,
  children,
}) {
  return (
    <div className={`form-group${error ? ' form-group--error' : ''}`}>
      {label && (
        <label htmlFor={htmlFor}>
          {label}
          {hint && <span className="form-hint">{hint}</span>}
        </label>
      )}
      <div className={icon ? 'input-with-icon' : undefined}>
        {icon && <span className="input-icon" aria-hidden="true">{icon}</span>}
        {children}
      </div>
      {error && <p className="form-error-text">{error}</p>}
    </div>
  );
}
