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
  const dim      = typeof size === 'number' ? `${size}px` : size;
  const fontSize = typeof size === 'number' ? Math.max(11, Math.round(size * 0.38)) : '0.85rem';

  return (
    <span
      className={`avatar ${status ? `avatar--${status}` : ''} ${className}`.trim()}
      style={{
        width:        dim,
        height:       dim,
        minWidth:     dim,
        minHeight:    dim,
        fontSize,
        borderRadius: '50%',
        overflow:     'hidden',
        position:     'relative',
        display:      'inline-flex',
        alignItems:   'center',
        justifyContent: 'center',
        flexShrink:   0,
      }}
      title={name || undefined}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? name}
          style={{
            position:   'absolute',
            top:        0,
            left:       0,
            width:      '100%',
            height:     '100%',
            objectFit:  'cover',
            display:    'block',
            borderRadius: '50%',
          }}
        />
      ) : (
        <span className="avatar-initials">{initialsFrom(name)}</span>
      )}
      {status && <span className="avatar-status" aria-hidden="true" />}
    </span>
  );
}
