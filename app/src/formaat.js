export function formatAfstand(meter) {
  return `${(meter / 1000).toFixed(1).replace('.', ',')} km`
}

export function formatTijd(seconden) {
  const minuten = Math.round(seconden / 60)
  const uren = Math.floor(minuten / 60)
  return uren > 0 ? `${uren} u ${minuten % 60} min` : `${minuten} min`
}
