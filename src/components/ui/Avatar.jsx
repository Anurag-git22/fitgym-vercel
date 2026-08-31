import { useState, useEffect } from 'react';

/**
 * Avatar — circular photo with initials fallback and optional status dot.
 * The image is always clipped to the circle — no overflow.
 */
function initialsFrom(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function Avatar({
  src,
  name = '',
  size = 40,
  status,
  className = '',
  alt,
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const dim = typeof size === 'number' ? `${size}px` : size;
  const numSize = typeof size === 'number' ? size : parseInt(size, 10) || 40;
  const fontSize = typeof size === 'number' ? Math.max(11, Math.round(size * 0.38)) : '0.85rem';
  const statusDotSize = Math.max(7, Math.round(numSize * 0.25));

  const hasImage = Boolean(src && !imgError);

  return (
    <span
      className={`avatar ${status ? `avatar--has-status` : ''} ${className}`.trim()}
      style={{
        width:        dim,
        height:       dim,
        minWidth:     dim,
        minHeight:    dim,
        maxWidth:     dim,
        maxHeight:    dim,
        fontSize,
        borderRadius: '50%',
        position:     'relative',
        display:      'inline-flex',
        alignItems:   'center',
        justifyContent: 'center',
        flexShrink:   0,
        boxSizing:    'border-box',
      }}
      title={name || undefined}
    >
      <span
        className="avatar-inner"
        style={{
          width:          '100%',
          height:         '100%',
          borderRadius:   '50%',
          overflow:       'hidden',
          position:       'relative',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          background:     'linear-gradient(135deg, var(--primary, #6366f1), var(--cyan, #06b6d4))',
          color:          '#ffffff',
          fontWeight:     700,
        }}
      >
        {hasImage ? (
          <img
            src={src}
            alt={alt ?? name ?? 'Avatar'}
            onError={() => setImgError(true)}
            className="avatar-img"
            style={{
              position:       'absolute',
              top:            0,
              left:           0,
              width:          '100%',
              height:         '100%',
              minWidth:       '100%',
              minHeight:      '100%',
              maxWidth:       '100%',
              maxHeight:      '100%',
              objectFit:      'cover',
              objectPosition: 'center',
              display:        'block',
              borderRadius:   '50%',
            }}
          />
        ) : (
          <span className="avatar-initials">{initialsFrom(name)}</span>
        )}
      </span>
      {status && (
        <span
          className={`avatar-status avatar-status--${status}`}
          aria-hidden="true"
          style={{
            position:        'absolute',
            bottom:          '-1px',
            right:           '-1px',
            width:           `${statusDotSize}px`,
            height:          `${statusDotSize}px`,
            borderRadius:    '50%',
            backgroundColor: status === 'active' ? 'var(--emerald, #10b981)' : 'var(--text-muted, #64748b)',
            border:          '2px solid var(--bg-surface, #0f172a)',
            zIndex:          2,
            boxSizing:       'border-box',
          }}
        />
      )}
    </span>
  );
}
