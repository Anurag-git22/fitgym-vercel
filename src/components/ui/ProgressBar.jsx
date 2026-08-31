import { useEffect, useRef } from 'react';

const COLOR_MAP = {
  primary: '--primary',
  emerald: '--emerald',
  amber: '--amber',
  rose: '--rose',
};

const SIZE_MAP = {
  sm: { height: 6, radius: 3, labelSize: '0.7rem' },
  md: { height: 10, radius: 5, labelSize: '0.78rem' },
  lg: { height: 14, radius: 7, labelSize: '0.85rem' },
};

export default function ProgressBar({
  value = 0,
  color = 'primary',
  size = 'md',
  showLabel = false,
  label = '',
}) {
  const fillRef = useRef(null);
  const cssVar = COLOR_MAP[color] || COLOR_MAP.primary;
  const cfg = SIZE_MAP[size] || SIZE_MAP.md;
  const clamped = Math.max(0, Math.min(100, value));

  useEffect(() => {
    const el = fillRef.current;
    if (!el) return;
    el.style.width = '0%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.width = `${clamped}%`;
      });
    });
  }, [clamped]);

  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      {(label || showLabel) && (
        <div className="progress-bar__header">
          <span className="progress-bar__label">{label || 'Progress'}</span>
          <span className="progress-bar__value">{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className="progress-bar__track"
        style={{ height: cfg.height, borderRadius: cfg.radius }}
      >
        <div
          ref={fillRef}
          className="progress-bar__fill"
          style={{
            borderRadius: cfg.radius,
            background: `linear-gradient(90deg, var(${cssVar}), var(${cssVar}-glow))`,
            boxShadow: `0 0 12px var(${cssVar}-glow)`,
          }}
        />
      </div>
    </div>
  );
}
