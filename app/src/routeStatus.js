import { markRaw, reactive, watch } from 'vue'
import { formatAfstand } from './formaat.js'
import { MAX_POGINGEN, STANDAARD_VARIANT, genereerRondrit, nieuweVariant } from './generator.js'
import { RICHTINGEN, instellingen } from './instellingen.js'
import { sleutel } from './sleutel.js'
import { berekenRoute, TomTomFout } from './tomtom.js'

// Alles over de punten op de kaart en de route die daaruit komt.
// De kaart (MapView) tekent wat hier staat. De knoppen en het formulier veranderen het.

export const MAX_TUSSENPUNTEN = 3
export const MAX_KILOMETERS = 900 // TomTom: maximaal 900 km per route met het type "thrilling"

export const routeStatus = reactive({
  start: null, // { lng, lat }, bij een rondrit het startpunt, bij A naar B punt A
  tussen: [], // lijst met { lng, lat }, alleen bij A naar B
  eind: null, // { lng, lat }, punt B, alleen bij A naar B
  volgendeSoort: 'start', // bij A naar B: wat de volgende tik op de kaart neerzet: 'start', 'tussen' of 'eind'
  mijnLocatie: null, // { lng, lat }, ingevuld door de kaart zodra de locatie bekend is
  route: null, // de berekende route, zie toonRoute()
  bezig: false,
  voortgang: '', // bijvoorbeeld "Poging 2 van 4…"
  melding: '',
  meldingIsFout: false,
})

// Telt mee bij elke wijziging, zodat een late TomTom-uitkomst van een oude aanvraag genegeerd wordt.
let aanvraagNummer = 0

function wisRoute() {
  aanvraagNummer += 1
  routeStatus.route = null
  routeStatus.bezig = false
  routeStatus.voortgang = ''
  routeStatus.melding = ''
}

function toonFout(tekst) {
  routeStatus.melding = tekst
  routeStatus.meldingIsFout = true
}

function foutTekst(fout, tipBijGeenRoute) {
  if (!(fout instanceof TomTomFout)) return `Er ging iets mis: ${fout.message}`
  return fout.soort === 'geen-route' ? `${fout.message} ${tipBijGeenRoute}` : fout.message
}

// Wissel je tussen rondrit en A naar B, dan vervalt de oude route.
// Een rondrit gebruikt alleen het startpunt, dus tussenpunten en punt B gaan weg.
watch(
  () => instellingen.ritsoort,
  (soort) => {
    wisRoute()
    if (soort === 'rondrit') {
      routeStatus.tussen = []
      routeStatus.eind = null
    }
    routeStatus.volgendeSoort = routeStatus.start ? 'eind' : 'start'
  },
)

// ---------- Punten zetten ----------

// Een tik op de kaart. Bij een rondrit zet die altijd het startpunt.
export function zetPunt(plek) {
  const soort = instellingen.ritsoort === 'rondrit' ? 'start' : routeStatus.volgendeSoort
  if (soort === 'tussen' && routeStatus.tussen.length >= MAX_TUSSENPUNTEN) {
    return toonFout(`Maximaal ${MAX_TUSSENPUNTEN} tussenpunten. Wis de punten om opnieuw te beginnen.`)
  }

  wisRoute()
  if (soort === 'start') {
    routeStatus.start = plek
    routeStatus.volgendeSoort = 'eind'
  } else if (soort === 'eind') {
    routeStatus.eind = plek
  } else {
    routeStatus.tussen.push(plek)
  }
}

export function zetStartOpMijnLocatie() {
  if (!routeStatus.mijnLocatie) return
  wisRoute()
  routeStatus.start = { ...routeStatus.mijnLocatie }
  routeStatus.volgendeSoort = 'eind'
}

export function wisPunten() {
  wisRoute()
  routeStatus.start = null
  routeStatus.tussen = []
  routeStatus.eind = null
  routeStatus.volgendeSoort = 'start'
}

// ---------- Route maken ----------

// De knop "Genereer route": een rondrit of een route van A naar B, afhankelijk van "Soort rit".
export function genereerRoute() {
  return instellingen.ritsoort === 'rondrit' ? maakRondrit(STANDAARD_VARIANT) : maakAnaarB()
}

// De knop "Andere variant": dezelfde rondrit met een andere vorm van de lus.
export function andereVariant() {
  return maakRondrit(nieuweVariant())
}

// markRaw: de kaart geeft de coördinaten door aan een achtergrondproces en dat kan niet met Vue-objecten.
function toonRoute(route) {
  routeStatus.route = markRaw(route)
}

async function maakRondrit(variant) {
  if (!sleutel.value) return toonFout('Voer eerst je TomTom-sleutel in (bovenaan).')
  if (!routeStatus.start) {
    return toonFout('Zet eerst een startpunt: tik op de kaart of gebruik "Start = mijn locatie".')
  }
  const richting = RICHTINGEN.find((r) => r.waarde === instellingen.richting)
  if (!richting) return toonFout('Kies eerst een richting.')
  const kilometers = instellingen.kilometers
  if (!Number.isFinite(kilometers) || kilometers < 1 || kilometers > MAX_KILOMETERS) {
    return toonFout(`Vul een aantal kilometers in tussen 1 en ${MAX_KILOMETERS}.`)
  }

  const nummer = ++aanvraagNummer
  const { voertuig, bochtigheid } = instellingen
  routeStatus.route = null
  routeStatus.melding = ''
  routeStatus.bezig = true

  try {
    const uitkomst = await genereerRondrit({
      sleutel: sleutel.value,
      start: { ...routeStatus.start },
      richtingGraden: richting.graden,
      kilometers,
      voertuig,
      bochtigheid,
      variant,
      bijPoging: ({ poging, vorigeMeter }) => {
        if (nummer !== aanvraagNummer) return
        const vorige = vorigeMeter ? ` (vorige poging: ${formatAfstand(vorigeMeter)})` : ''
        routeStatus.voortgang = `Rondrit maken: poging ${poging} van ${MAX_POGINGEN}${vorige}…`
      },
      isGestopt: () => nummer !== aanvraagNummer,
    })
    if (!uitkomst || nummer !== aanvraagNummer) return

    toonRoute({
      ...uitkomst,
      bron: 'rondrit',
      voertuig,
      bochtigheid,
      richting: richting.waarde,
      gevraagdKm: kilometers,
    })
  } catch (fout) {
    if (nummer !== aanvraagNummer) return
    toonFout(foutTekst(fout, 'Probeer een andere richting, afstand of variant.'))
  } finally {
    if (nummer === aanvraagNummer) {
      routeStatus.bezig = false
      routeStatus.voortgang = ''
    }
  }
}

// Van A naar B: één TomTom-aanvraag met het voertuig en de bochtigheid uit het formulier.
async function maakAnaarB() {
  if (!sleutel.value) return toonFout('Voer eerst je TomTom-sleutel in (bovenaan).')
  if (!routeStatus.start) return toonFout('Zet eerst punt A op de kaart.')
  if (!routeStatus.eind) return toonFout('Zet ook punt B op de kaart.')

  const nummer = ++aanvraagNummer
  const { voertuig, bochtigheid } = instellingen
  routeStatus.route = null
  routeStatus.melding = ''
  routeStatus.bezig = true
  routeStatus.voortgang = 'Route van A naar B berekenen…'

  try {
    const uitkomst = await berekenRoute({
      sleutel: sleutel.value,
      punten: [routeStatus.start, ...routeStatus.tussen, routeStatus.eind],
      voertuig,
      bochtigheid,
    })
    if (nummer !== aanvraagNummer) return
    toonRoute({ ...uitkomst, bron: 'a-naar-b', voertuig, bochtigheid })
  } catch (fout) {
    if (nummer !== aanvraagNummer) return
    toonFout(foutTekst(fout, 'Probeer andere punten.'))
  } finally {
    if (nummer === aanvraagNummer) {
      routeStatus.bezig = false
      routeStatus.voortgang = ''
    }
  }
}
