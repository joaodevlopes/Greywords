// Greywords mark: a greyhound in full gallop. Drawn in currentColor so it follows the theme.
// Same shapes as public/favicon.svg; keep both in sync.
export default function GreyhoundMark({ height = 22 }) {
  return (
    <svg
      className="gw-mark"
      width={(height * 120) / 60}
      height={height}
      viewBox="0 2 120 60"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">
        {/* body: back, rump, tucked waist, deep chest, throat */}
        <path d="M96 15C88 17 80 21 70 22C58 23 46 20 36 21C28 22 25 31 32 35C40 39 50 35 58 34C66 33 72 43 82 44C91 45 95 36 96 29C98 25 100 23 102 22L100 14Z" />
        {/* head with long narrow muzzle */}
        <path d="M95 13C98 8 104 7 109 10L118.5 16.5C120 18 118.5 20 116.5 19.5L106 18.5C102 20 99 22 97 21Z" />
        {/* folded rose ear */}
        <path d="M99 9.5L91 8.5L97 13.5Z" />
        {/* hind thigh */}
        <ellipse cx="36" cy="28" rx="9.5" ry="7.5" transform="rotate(-25 36 28)" />
      </g>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* hind legs stretched back: thick thigh segment, thin lower leg */}
        <path d="M38 31L25 40" strokeWidth="7" />
        <path d="M25 40L6 42" strokeWidth="3.5" />
        <path d="M44 33L33 45" strokeWidth="6" />
        <path d="M33 45L16 51" strokeWidth="3.5" />
        {/* front legs reaching forward */}
        <path d="M86 40L98 47" strokeWidth="6.5" />
        <path d="M98 47L114 48.5" strokeWidth="3.5" />
        <path d="M82 42L90 52" strokeWidth="5.5" />
        <path d="M90 52L104 56" strokeWidth="3.5" />
        {/* long thin tail */}
        <path d="M30 23C20 21 12 27 4 23" strokeWidth="2.5" />
      </g>
    </svg>
  )
}
