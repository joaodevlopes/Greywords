// WCAG 2.x contrast helpers, used to keep the palette (palette.css) accessible.

export function luminance(hex) {
  const [r, g, b] = hex
    .replace('#', '')
    .match(/\w\w/g)
    .map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Reads the --gw-* hex tokens of each theme block: { light: { bg: '#…' }, dark: { … } }.
export function parsePalette(css) {
  const themes = {}
  const blocks = { light: /:root\s*\{([^}]*)\}/, dark: /:root\[data-theme='dark'\]\s*\{([^}]*)\}/ }
  for (const [name, re] of Object.entries(blocks)) {
    const body = css.match(re)?.[1] ?? ''
    themes[name] = Object.fromEntries(
      [...body.matchAll(/--gw-([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map(([, key, value]) => [key, value]),
    )
  }
  return themes
}
