import { markRaw, reactive } from 'vue'
import { instellingen } from './instellingen.js'
import { sleutel } from './sleutel.js'
import { berekenRoute, TomTomFout } from './tomtom.js'

// Alles over de punten die je op de kaart zet en de route die daaruit komt.
// De kaart (MapView) tekent wat hier staat. De knoppen (PuntenBlok) veranderen het.

export const MAX_TUSSENPUNTEN = 3

export const routeStatus = reactive({
  start: null, // { lng, lat }
  tussen: [], // lijst met { lng, lat }
  eind: null, // { lng, lat }, leeg betekent: terug naar de start (rondrit)
  volgendeSoort: 'start', // wat de volgende tik op de kaart neerzet: 'start', 'tussen' of 'eind'
  mijnLocatie: null, // { lng, lat }, ingevuld door de kaart zodra de locatie bekend is
  route: null, // { coordinaten, afstandMeter, tijdSeconden, voertuig, bochtigheid }
  bezig: false,
  melding: '',
  meldingIsFout: false,
})

// Telt mee elke keer dat de punten veranderen, zodat een late TomTom-uitkomst
// van een oude aanvraag genegeerd wordt.
let aanvraagNummer = 0

function wisRoute() {
  aanvraagNummer += 1
  routeStatus.route = null
  routeStatus.bezig = false
  routeStatus.melding = ''
}

export function zetPunt(plek) {
  const soort = routeStatus.volgendeSoort
  if (soort === 'tussen' && routeStatus.tussen.length >= MAX_TUSSENPUNTEN) {
    return toonFout(`Maximaal ${MAX_TUSSENPUNTEN} tussenpunten. Wis de punten om opnieuw te beginnen.`)
  }

  wisRoute()
  if (soort === 'start') {
    routeStatus.start = plek
    routeStatus.volgendeSoort = 'tussen'
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
  routeStatus.volgendeSoort = 'tussen'
}

export function wisPunten() {
  wisRoute()
  routeStatus.start = null
  routeStatus.tussen = []
  routeStatus.eind = null
  routeStatus.volgendeSoort = 'start'
}

function toonFout(tekst) {
  routeStatus.melding = tekst
  routeStatus.meldingIsFout = true
}

// Rekent één route uit via TomTom met het voertuig en de bochtigheid uit het formulier.
// Kost één TomTom-aanvraag.
export async function berekenEigenRoute() {
  if (!sleutel.value) return toonFout('Voer eerst je TomTom-sleutel in (bovenaan).')
  if (!routeStatus.start) return toonFout('Zet eerst een startpunt op de kaart.')
  if (!routeStatus.tussen.length && !routeStatus.eind) {
    return toonFout('Zet minstens één tussenpunt of een eindpunt.')
  }

  const nummer = ++aanvraagNummer
  const { voertuig, bochtigheid } = instellingen
  routeStatus.bezig = true
  routeStatus.melding = ''

  try {
    const uitkomst = await berekenRoute({
      sleutel: sleutel.value,
      punten: [routeStatus.start, ...routeStatus.tussen, routeStatus.eind ?? routeStatus.start],
      voertuig,
      bochtigheid,
    })
    if (nummer !== aanvraagNummer) return // de punten zijn ondertussen veranderd
    // markRaw: de kaart krijgt de coördinaten in een achtergrondproces en dat kan niet met Vue-objecten.
    routeStatus.route = markRaw({ ...uitkomst, voertuig, bochtigheid })
    routeStatus.melding = ''
  } catch (fout) {
    if (nummer !== aanvraagNummer) return
    toonFout(fout instanceof TomTomFout ? fout.message : `Er ging iets mis: ${fout.message}`)
  } finally {
    if (nummer === aanvraagNummer) routeStatus.bezig = false
  }
}
