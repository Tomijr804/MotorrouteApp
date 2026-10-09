// Praat met de TomTom Routing API (versie 1, Calculate Route).
// Documentatie: https://docs.tomtom.com/routing-api/documentation/tomtom-maps/calculate-route

const BASIS = 'https://api.tomtom.com/routing/1/calculateRoute'

export class TomTomFout extends Error {}

// punten: lijst met { lng, lat }, van start via tussenpunten naar het einde.
// voertuig: 'motorcycle' of 'car'. bochtigheid: 'low', 'normal' of 'high'.
export async function berekenRoute({ sleutel, punten, voertuig, bochtigheid }) {
  const locaties = punten.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(':')
  const parameters = new URLSearchParams({
    key: sleutel,
    travelMode: voertuig,
    routeType: 'thrilling',
    windingness: bochtigheid,
  })

  let antwoord
  try {
    antwoord = await fetch(`${BASIS}/${locaties}/json?${parameters}`)
  } catch {
    throw new TomTomFout('Geen verbinding met TomTom. Controleer je internet en probeer het opnieuw.')
  }

  const tekst = await antwoord.text()
  let data = null
  try {
    data = JSON.parse(tekst)
  } catch {
    // geen JSON, dan werken we met de statuscode
  }

  if (!antwoord.ok) {
    throw new TomTomFout(foutTekst(antwoord.status, data, sleutel))
  }

  const route = data?.routes?.[0]
  if (!route) {
    throw new TomTomFout('TomTom gaf geen route terug.')
  }

  return {
    coordinaten: route.legs.flatMap((been) => been.points.map((p) => [p.longitude, p.latitude])),
    afstandMeter: route.summary.lengthInMeters,
    tijdSeconden: route.summary.travelTimeInSeconds,
  }
}

function foutTekst(status, data, sleutel) {
  if (data?.detailedError?.code === 'NO_ROUTE_FOUND') {
    return 'TomTom vond geen route tussen deze punten. Probeer andere punten.'
  }
  if (status === 401 || status === 403) {
    return (
      `TomTom weigert de aanvraag (HTTP ${status}). Mogelijke oorzaken: de sleutel klopt niet, ` +
      'de Routing API staat niet aan op je sleutel, of de gratis limiet is bereikt.'
    )
  }
  const uitleg = data?.detailedError?.message ?? data?.error?.description ?? data?.message ?? ''
  // Voor de zekerheid: de sleutel mag nooit in een melding terechtkomen.
  const veilig = sleutel ? String(uitleg).split(sleutel).join('…') : String(uitleg)
  return `TomTom gaf een fout (HTTP ${status}). ${veilig}`.trim()
}
