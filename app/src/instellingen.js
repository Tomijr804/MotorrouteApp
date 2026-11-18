import { reactive } from 'vue'

// De criteria van de route. Het formulier past deze waarden aan en de
// routegenerator (stap 3) leest ze later weer uit.
//
// Waarden voor bochtigheid en voertuig zijn precies de woorden die TomTom gebruikt:
//   bochtigheid (windingness): 'low', 'normal', 'high'
//   voertuig (travelMode):     'motorcycle', 'car'
export const instellingen = reactive({
  voertuig: 'motorcycle',
  ritsoort: 'rondrit', // 'rondrit' of 'a-naar-b'
  richting: null, // een waarde uit RICHTINGEN, bijvoorbeeld 'NO'. Alleen voor een rondrit.
  kilometers: null, // alleen voor een rondrit
  bochtigheid: 'normal',
})

// De keuzes met hun Nederlandse namen, voor de knoppen en voor teksten.
export const VOERTUIGEN = [
  { waarde: 'motorcycle', label: 'Motor' },
  { waarde: 'car', label: 'Auto' },
]
export const RITSOORTEN = [
  { waarde: 'rondrit', label: 'Rondrit' },
  { waarde: 'a-naar-b', label: 'Van A naar B' },
]
export const BOCHTIGHEDEN = [
  { waarde: 'low', label: 'Laag' },
  { waarde: 'normal', label: 'Normaal' },
  { waarde: 'high', label: 'Hoog' },
]

// De windrichtingen voor een rondrit. "graden" is de kompasrichting: 0 = noord, 90 = oost.
export const RICHTINGEN = [
  { waarde: 'N', label: 'Noord (N)', graden: 0 },
  { waarde: 'NO', label: 'Noordoost (NO)', graden: 45 },
  { waarde: 'O', label: 'Oost (O)', graden: 90 },
  { waarde: 'ZO', label: 'Zuidoost (ZO)', graden: 135 },
  { waarde: 'Z', label: 'Zuid (Z)', graden: 180 },
  { waarde: 'ZW', label: 'Zuidwest (ZW)', graden: 225 },
  { waarde: 'W', label: 'West (W)', graden: 270 },
  { waarde: 'NW', label: 'Noordwest (NW)', graden: 315 },
]

export function labelVan(opties, waarde) {
  return opties.find((optie) => optie.waarde === waarde)?.label ?? waarde
}
