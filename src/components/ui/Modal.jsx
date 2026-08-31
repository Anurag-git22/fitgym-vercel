import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Modal — glass dialog with enter/exit animation.
 */
export default function Modal({ open, onClose, title, size = 'md', children }) {
  const dialogRef = useRef(null);
  const [visible, setVisible] = useState(open);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setLeaving(false);
      return;
    }
    if (!visible) return undefined;
    setLeaving(true);
    const t = setTimeout(() => {
      setVisible(false);
      setLeaving(false);
    }, 160);
    return () => clearTimeout(t);
  }, [open, visible]);

  useEffect(() => {
    if (!visible || leaving) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, leaving, onClose]);

  useEffect(() => {
    if (visible && !leaving) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [visible, leaving]);

  useEffect(() => {
    if (open && dialogRef.current) dialogRef.current.focus();
  }, [open]);

  if (!visible) return null;

  return (
    <div
      className={`modal-overlay${leaving ? ' modal-overlay--out' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <div
        className={`modal-dialog modal-dialog--${size}${leaving ? ' modal-dialog--out' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="modal-header">
          {title && <h2 id="modal-title" className="modal-title">{title}</h2>}
          <button className="modal-close" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
