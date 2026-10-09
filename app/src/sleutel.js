import { ref } from 'vue'

// De TomTom-sleutel wordt bewaard in de browser van dit apparaat (localStorage).
// Hij staat dus niet in de code en niet in git. Op je telefoon voer je hem apart in.

const OPSLAGNAAM = 'tomtom-sleutel'

function leesUitBrowser() {
  try {
    return localStorage.getItem(OPSLAGNAAM) ?? ''
  } catch {
    return '' // opslag geblokkeerd, bijvoorbeeld in een privévenster
  }
}

export const sleutel = ref(leesUitBrowser())

// Geeft true terug als het bewaren in de browser lukte.
export function bewaarSleutel(nieuweSleutel) {
  sleutel.value = nieuweSleutel
  try {
    localStorage.setItem(OPSLAGNAAM, nieuweSleutel)
    return true
  } catch {
    return false
  }
}

export function verwijderSleutel() {
  sleutel.value = ''
  try {
    localStorage.removeItem(OPSLAGNAAM)
  } catch {
    // niets te doen als de opslag geblokkeerd is
  }
}
