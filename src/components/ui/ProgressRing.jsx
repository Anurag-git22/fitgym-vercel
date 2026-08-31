import { useEffect, useRef } from 'react';

const COLOR_MAP = {
  primary: '--primary',
  emerald: '--emerald',
  amber: '--amber',
  rose: '--rose',
};

export default function ProgressRing({
  value = 0,
  size = 80,
  strokeWidth = 6,
  color = 'primary',
  label = '',
  sublabel = '',
}) {
  const cssVar = COLOR_MAP[color] || COLOR_MAP.primary;
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * Math.max(radius, 0.1);
  const offsetRef = useRef(null);

  useEffect(() => {
    const el = offsetRef.current;
    if (!el) return;
    el.style.strokeDashoffset = circumference;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = circumference - (clamped / 100) * circumference;
        el.style.strokeDashoffset = target;
      });
    });
  }, [clamped, circumference]);

  const center = size / 2;

  return (
    <div
      className="progress-ring"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="progress-ring__svg">
        <defs>
          <linearGradient id={`grad-${color}-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`var(${cssVar})`} />
            <stop offset="100%" stopColor={`var(${cssVar}-glow)`} />
          </linearGradient>
          <filter id={`glow-${color}-${size}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          className="progress-ring__track"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
        />

        <circle
          ref={offsetRef}
          className="progress-ring__fill"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke={`url(#grad-${color}-${size})`}
          filter={`url(#glow-${color}-${size})`}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>

      <div className="progress-ring__content">
        <span className="progress-ring__percent">{Math.round(clamped)}%</span>
      </div>

      {(label || sublabel) && (
        <div className="progress-ring__meta">
          {label && <span className="progress-ring__label">{label}</span>}
          {sublabel && <span className="progress-ring__sublabel">{sublabel}</span>}
        </div>
      )}
    </div>
  );
}
