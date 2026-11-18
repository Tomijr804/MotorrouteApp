// De rondrit-generator.
// TomTom maakt zelf geen rondrit op basis van richting en afstand. Deze code legt daarom
// een lus van tussenpunten om het startpunt, laat TomTom de route berekenen, kijkt hoeveel
// kilometer het echt is en maakt de lus groter of kleiner tot het binnen de marge valt.

import { berekenRoute } from './tomtom.js'

export const MARGE = 0.1 // ±10% van het gevraagde aantal kilometers
export const MAX_POGINGEN = 4 // elke poging is 1 TomTom-aanvraag

// Eerste schatting: een route over de weg is zoveel keer langer dan de rechte lijnen tussen de punten.
// Dit is een aanname. Na elke poging sturen we bij met de echte afstand van TomTom.
const START_OMWEGFACTOR = 1.3

const AARDSTRAAL_METER = 6371000
const naarRadialen = (graden) => (graden * Math.PI) / 180
const naarGraden = (radialen) => (radialen * 180) / Math.PI

// Het punt dat op "afstandMeter" van "start" ligt, in de richting "koers"
// (in graden: 0 = noord, 90 = oost, 180 = zuid, 270 = west). Rekent met de bolvorm van de aarde.
export function puntOpAfstand(start, koers, afstandMeter) {
  const hoek = afstandMeter / AARDSTRAAL_METER
  const richting = naarRadialen(koers)
  const lat1 = naarRadialen(start.lat)
  const lng1 = naarRadialen(start.lng)

  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(hoek) + Math.cos(lat1) * Math.sin(hoek) * Math.cos(richting))
  const lng2 =
    lng1 +
    Math.atan2(Math.sin(richting) * Math.sin(hoek) * Math.cos(lat1), Math.cos(hoek) - Math.sin(lat1) * Math.sin(lat2))

  return { lat: naarGraden(lat2), lng: ((naarGraden(lng2) + 540) % 360) - 180 }
}

// Afstand hemelsbreed tussen twee punten, in meter.
export function afstandTussen(a, b) {
  const dLat = naarRadialen(b.lat - a.lat)
  const dLng = naarRadialen(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(naarRadialen(a.lat)) * Math.cos(naarRadialen(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * AARDSTRAAL_METER * Math.asin(Math.sqrt(h))
}

// De vorm van de lus. De standaardvorm is een ruit met het verste punt precies in de gekozen richting.
// Een variant draait de tussenpunten een paar graden en kan de lus andersom laten rijden.
export const STANDAARD_VARIANT = { omgekeerd: false, links: 0, ver: 0, rechts: 0 }

export function nieuweVariant() {
  const willekeurig = (maximum) => Math.round((Math.random() * 2 - 1) * maximum)
  return { omgekeerd: Math.random() < 0.5, links: willekeurig(20), ver: willekeurig(15), rechts: willekeurig(20) }
}

// De punten van de lus: start, drie tussenpunten en weer de start.
// De tussenpunten liggen op een cirkel door de start. "grootte" is de afstand van de start
// tot het verste punt (in de gekozen richting). De twee zijpunten liggen 45 graden links
// en rechts daarvan, op grootte / wortel 2.
export function maakLus(start, richtingGraden, grootte, variant = STANDAARD_VARIANT) {
  const ver = puntOpAfstand(start, richtingGraden + variant.ver, grootte)
  const zijafstand = grootte / Math.SQRT2
  const links = puntOpAfstand(start, richtingGraden - 45 + variant.links, zijafstand)
  const rechts = puntOpAfstand(start, richtingGraden + 45 + variant.rechts, zijafstand)
  const tussenpunten = variant.omgekeerd ? [rechts, ver, links] : [links, ver, rechts]
  return [start, ...tussenpunten, start]
}

// Eerste schatting van de grootte. De rechte lijnen van de lus zijn samen ongeveer
// 2,83 (2 x wortel 2) keer de grootte, en de weg is START_OMWEGFACTOR keer langer.
export function eersteGrootte(doelMeter) {
  return doelMeter / (START_OMWEGFACTOR * 2 * Math.SQRT2)
}

// Maakt een rondrit en geeft de beste poging terug:
// { coordinaten, afstandMeter, tijdSeconden, pogingen, binnenMarge, waarschuwing }.
//
// bijPoging({ poging, vorigeMeter }) wordt voor elke poging aangeroepen, voor de voortgang op het scherm.
// isGestopt() geeft true als je ondertussen iets anders hebt gedaan. Dan stopt de generator en geeft null.
// rekenRoute is alleen bedoeld voor tests. Standaard is het de echte TomTom-aanvraag.
export async function genereerRondrit({
  sleutel,
  start,
  richtingGraden,
  kilometers,
  voertuig,
  bochtigheid,
  variant = STANDAARD_VARIANT,
  bijPoging = () => {},
  isGestopt = () => false,
  rekenRoute = berekenRoute,
}) {
  const doelMeter = kilometers * 1000
  let grootte = eersteGrootte(doelMeter)
  let beste = null
  let vorigeMeter = null
  let waarschuwing = ''
  let pogingen = 0

  while (pogingen < MAX_POGINGEN) {
    pogingen += 1
    bijPoging({ poging: pogingen, vorigeMeter })

    let route
    try {
      route = await rekenRoute({ sleutel, punten: maakLus(start, richtingGraden, grootte, variant), voertuig, bochtigheid })
    } catch (fout) {
      if (isGestopt()) return null
      if (!beste) throw fout // de eerste poging mislukte: dan is er niets te tonen
      waarschuwing = fout.message // een latere poging mislukte: we houden de beste tot nu toe
      break
    }
    if (isGestopt()) return null

    const afwijking = Math.abs(route.afstandMeter - doelMeter) / doelMeter
    if (!beste || afwijking < beste.afwijking) beste = { ...route, afwijking }
    if (afwijking <= MARGE) break

    // Bijsturen: is de route bijvoorbeeld 20% te lang, dan maken we de lus 20% kleiner.
    // Nooit meer dan een halvering of verdubbeling in één keer.
    const verhouding = doelMeter / route.afstandMeter
    grootte *= Math.min(2, Math.max(0.5, verhouding))
    vorigeMeter = route.afstandMeter
  }

  return {
    coordinaten: beste.coordinaten,
    afstandMeter: beste.afstandMeter,
    tijdSeconden: beste.tijdSeconden,
    pogingen,
    binnenMarge: beste.afwijking <= MARGE,
    waarschuwing,
  }
}
