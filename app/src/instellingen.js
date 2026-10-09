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
  kilometers: null,
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

export function labelVan(opties, waarde) {
  return opties.find((optie) => optie.waarde === waarde)?.label ?? waarde
}
