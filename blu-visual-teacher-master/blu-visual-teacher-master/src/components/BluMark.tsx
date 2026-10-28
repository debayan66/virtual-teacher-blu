/**
 * Blu Visual Teacher mark — an original geometric symbol.
 * Three ideas combined: a visual frame (corner brackets), a knowledge node
 * chain (the spine) and a play symbol (the wedge). No external artwork.
 */
export function BluMark({ size = 40, id = 'blu' }: { size?: number; id?: string }) {
  const gid = `${id}-grad`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      role="img"
      aria-label="Blu Visual Teacher"
    >
      <defs>
        <linearGradient id={gid} x1="6" y1="4" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF7900" />
          <stop offset="0.52" stopColor="#2563EB" />
          <stop offset="1" stopColor="#173B8F" />
        </linearGradient>
      </defs>

      {/* visual frame — open corner brackets */}
      <path
        d="M4 15V6.5C4 5.1 5.1 4 6.5 4H15"
        stroke={`url(#${gid})`}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M40 29v8.5c0 1.4-1.1 2.5-2.5 2.5H29"
        stroke={`url(#${gid})`}
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* play symbol */}
      <path
        d="M16.4 11.6 34.6 22 16.4 32.4z"
        fill={`url(#${gid})`}
        fillOpacity="0.24"
        stroke={`url(#${gid})`}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* knowledge node chain forming the spine of the play symbol */}
      <path d="M16.4 11.6v20.8" stroke={`url(#${gid})`} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="16.4" cy="11.6" r="3.4" fill="#FFFFFF" stroke="#FF7900" strokeWidth="2.2" />
      <circle cx="16.4" cy="32.4" r="3.4" fill="#FFFFFF" stroke="#173B8F" strokeWidth="2.2" />
      <circle cx="16.4" cy="22" r="2" fill="#FF7900" />
    </svg>
  );
}

/** Compact lockup used in the navigation rail and top bar. */
export function BluLogo({ open = false, size = 34 }: { open?: boolean; size?: number }) {
  return (
    <span className="logo-lockup" data-open={open}>
      <BluMark size={size} />
      <span className="logo-word">
        <b>Blu</b>
        <i>Visual Teacher</i>
      </span>
    </span>
  );
}