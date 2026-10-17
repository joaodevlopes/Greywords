// Original flat illustrations for the landing demo ("sun" and two decoys).
// Decorative: the surrounding UI names what each one shows.

const svg = { viewBox: '0 0 100 100', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': true, focusable: 'false' }

export function SunsetSea() {
  return (
    <svg {...svg}>
      <rect width="100" height="62" fill="#ff8a4c" />
      <rect width="100" height="30" fill="#ffad6b" />
      <circle cx="50" cy="62" r="20" fill="#fff1c9" />
      <rect y="62" width="100" height="38" fill="#2f4a7a" />
      <path d="M30 70h40M38 77h24M44 84h12" stroke="#ffd59a" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function SunRays() {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30)
  return (
    <svg {...svg}>
      <rect width="100" height="100" fill="#7cc4ff" />
      <g transform="translate(50 50)">
        {rays.map((a) => (
          <rect key={a} x="-2.5" y="-40" width="5" height="12" rx="2.5" fill="#ffd23f" transform={`rotate(${a})`} />
        ))}
        <circle r="22" fill="#ffd23f" />
        <circle r="22" fill="none" stroke="#ffb400" strokeWidth="3" />
      </g>
    </svg>
  )
}

export function SunnyField() {
  return (
    <svg {...svg}>
      <rect width="100" height="100" fill="#bfe6ff" />
      <circle cx="72" cy="30" r="14" fill="#ffcc33" />
      <ellipse cx="34" cy="30" rx="16" ry="7" fill="#ffffff" />
      <ellipse cx="44" cy="26" rx="10" ry="7" fill="#ffffff" />
      <path d="M0 72 Q25 55 50 68 T100 62 V100 H0Z" fill="#6fbf5a" />
      <path d="M0 84 Q30 72 60 82 T100 80 V100 H0Z" fill="#4e9d3f" />
    </svg>
  )
}

export function NightMoon() {
  return (
    <svg {...svg}>
      <rect width="100" height="100" fill="#1d2440" />
      <circle cx="60" cy="40" r="18" fill="#f3f0d8" />
      <circle cx="68" cy="34" r="16" fill="#1d2440" />
      {[
        [20, 22],
        [30, 60],
        [80, 70],
        [15, 80],
        [85, 18],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#ffffff" />
      ))}
    </svg>
  )
}

export function BeachUmbrella() {
  return (
    <svg {...svg}>
      <rect width="100" height="60" fill="#9ad8ff" />
      <rect y="60" width="100" height="40" fill="#f2d7a0" />
      <path d="M50 28 L52 86" stroke="#6b4b2a" strokeWidth="2.5" />
      <path d="M22 44 Q50 10 80 44 Z" fill="#ff5d5d" />
      <path d="M41 44 Q50 10 60 44 Z" fill="#ffffff" />
    </svg>
  )
}

export function Lamp() {
  return (
    <svg {...svg}>
      <rect width="100" height="100" fill="#f4efe6" />
      <path d="M35 30 H65 L74 56 H26 Z" fill="#ffb84d" />
      <rect x="47" y="56" width="6" height="26" fill="#5d564c" />
      <rect x="34" y="82" width="32" height="6" rx="3" fill="#5d564c" />
    </svg>
  )
}

export const DEMO_TILES = [
  { id: 'sunset', label: 'Pôr do sol no mar', Scene: SunsetSea, pick: 1 },
  { id: 'moon', label: 'Lua à noite', Scene: NightMoon, pick: 0 },
  { id: 'rays', label: 'Sol com raios', Scene: SunRays, pick: 2 },
  { id: 'umbrella', label: 'Guarda-sol na praia', Scene: BeachUmbrella, pick: 0 },
  { id: 'field', label: 'Sol sobre o campo', Scene: SunnyField, pick: 3 },
  { id: 'lamp', label: 'Luminária', Scene: Lamp, pick: 0 },
]
