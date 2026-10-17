// Number formatting for the landing counters (A8), in Brazilian Portuguese ("2.809").
const pt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

export function formatNumber(n) {
  return pt.format(Math.round(n))
}

// Share of hits as a pt-BR percentage: formatPercent(82, 180, 1) -> "45,6%".
export function formatPercent(hits, total, digits = 0) {
  const value = total > 0 ? (hits / total) * 100 : 0
  return `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)}%`
}
