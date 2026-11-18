// Praat met de TomTom Routing API (versie 1, Calculate Route).
// Documentatie: https://docs.tomtom.com/routing-api/documentation/tomtom-maps/calculate-route

const BASIS = 'https://api.tomtom.com/routing/1/calculateRoute'

// soort: 'geen-route' (TomTom vond geen route of kon een punt niet bij een weg vinden),
// 'sleutel' (aanvraag geweigerd), 'verbinding' (geen internet) of 'anders'.
export class TomTomFout extends Error {
  constructor(bericht, soort = 'anders') {
    super(bericht)
    this.soort = soort
  }
}

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
    throw new TomTomFout('Geen verbinding met TomTom. Controleer je internet en probeer het opnieuw.', 'verbinding')
  }

  const tekst = await antwoord.text()
  let data = null
  try {
    data = JSON.parse(tekst)
  } catch {
    // geen JSON, dan werken we met de statuscode
  }

  if (!antwoord.ok) {
    throw maakFout(antwoord.status, data, sleutel)
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

// De foutcodes staan in de documentatie onder "detailedError".
function maakFout(status, data, sleutel) {
  const code = data?.detailedError?.code
  if (code === 'NO_ROUTE_FOUND') {
    return new TomTomFout('TomTom vond geen route tussen deze punten.', 'geen-route')
  }
  if (code === 'MAP_MATCHING_FAILURE') {
    return new TomTomFout('TomTom kon een van de punten niet bij een weg vinden.', 'geen-route')
  }
  if (code === 'COMPUTE_TIME_LIMIT_EXCEEDED') {
    return new TomTomFout('TomTom had te veel rekentijd nodig voor deze route. Probeer een kortere rit.')
  }
  if (status === 401 || status === 403) {
    return new TomTomFout(
      `TomTom weigert de aanvraag (HTTP ${status}). Mogelijke oorzaken: de sleutel klopt niet, ` +
        'de Routing API staat niet aan op je sleutel, of de gratis limiet is bereikt.',
      'sleutel',
    )
  }
  const uitleg = data?.detailedError?.message ?? data?.error?.description ?? data?.message ?? ''
  // Voor de zekerheid: de sleutel mag nooit in een melding terechtkomen.
  const veilig = sleutel ? String(uitleg).split(sleutel).join('…') : String(uitleg)
  return new TomTomFout(`TomTom gaf een fout (HTTP ${status}). ${veilig}`.trim())
}
