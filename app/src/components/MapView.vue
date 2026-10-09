<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { LngLatBounds, Map, Marker, NavigationControl } from 'maplibre-gl'
import { routeStatus, zetPunt } from '../routeStatus.js'

const KAARTSTIJL = 'https://tiles.openfreemap.org/styles/liberty'
const NEDERLAND = { center: [5.3, 52.1], zoom: 7 } // alleen als je locatie niet lukt
const ZOOM_OP_MIJN_LOCATIE = 11
const ROUTEKLEUR = '#1d6fe0'
const PUNTKLEUREN = { start: '#2b9348', tussen: '#6c757d', eind: '#111111' }

const kaartElement = ref(null)
const melding = ref('Locatie bepalen…')
let kaart = null
let kaartKlaar = false
let ikzelfMarker = null
let puntMarkers = []

onMounted(() => {
  kaart = new Map({
    container: kaartElement.value,
    style: KAARTSTIJL,
    center: NEDERLAND.center,
    zoom: NEDERLAND.zoom,
  })
  kaart.addControl(new NavigationControl({ showCompass: false }), 'top-right')

  kaart.on('load', () => {
    kaart.addSource('route', { type: 'geojson', data: legeData() })
    kaart.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': ROUTEKLEUR, 'line-width': 6 },
    })
    kaartKlaar = true
    tekenRoute()
  })

  // Een tik op de kaart zet een punt (start, tussenpunt of eindpunt, zoals gekozen onder de kaart).
  kaart.on('click', (gebeurtenis) => {
    zetPunt({ lng: gebeurtenis.lngLat.lng, lat: gebeurtenis.lngLat.lat })
  })

  tekenPunten()
  naarMijnLocatie()
})

onBeforeUnmount(() => {
  kaart?.remove()
})

function legeData() {
  return { type: 'FeatureCollection', features: [] }
}

// Vraagt de locatie aan de browser en zet de kaart daarop.
// De browser vraagt hiervoor toestemming. Op een telefoon werkt dit alleen via HTTPS.
function naarMijnLocatie() {
  if (!navigator.geolocation) {
    melding.value = 'Deze browser kan geen locatie opvragen. De kaart toont Nederland.'
    return
  }

  melding.value = 'Locatie bepalen…'
  navigator.geolocation.getCurrentPosition(
    (positie) => {
      const plek = [positie.coords.longitude, positie.coords.latitude]
      routeStatus.mijnLocatie = { lng: plek[0], lat: plek[1] }
      zetIkzelfMarker(plek)
      kaart.flyTo({ center: plek, zoom: ZOOM_OP_MIJN_LOCATIE })
      melding.value = ''
    },
    (fout) => {
      const uitleg = {
        1: 'Je hebt geen toestemming gegeven voor locatie.',
        2: 'Je locatie is nu niet beschikbaar.',
        3: 'Het bepalen van je locatie duurde te lang.',
      }
      melding.value = `${uitleg[fout.code] ?? 'Locatie lukt niet.'} De kaart toont Nederland.`
    },
    { timeout: 10000 },
  )
}

function zetIkzelfMarker(plek) {
  if (!ikzelfMarker) {
    const stip = document.createElement('div')
    stip.className = 'ikzelf'
    ikzelfMarker = new Marker({ element: stip }).setLngLat(plek).addTo(kaart)
  } else {
    ikzelfMarker.setLngLat(plek)
  }
}

// De punten (start, tussenpunten, eind) als markeringen op de kaart.
function tekenPunten() {
  puntMarkers.forEach((marker) => marker.remove())
  puntMarkers = []
  if (!kaart) return

  const zet = (plek, kleur) => {
    puntMarkers.push(new Marker({ color: kleur }).setLngLat([plek.lng, plek.lat]).addTo(kaart))
  }
  if (routeStatus.start) zet(routeStatus.start, PUNTKLEUREN.start)
  routeStatus.tussen.forEach((plek) => zet(plek, PUNTKLEUREN.tussen))
  if (routeStatus.eind) zet(routeStatus.eind, PUNTKLEUREN.eind)
}

// De berekende route als lijn, en de kaart zo zoomen dat de hele route zichtbaar is.
function tekenRoute() {
  if (!kaartKlaar) return
  const route = routeStatus.route

  kaart.getSource('route').setData(
    route ? { type: 'Feature', geometry: { type: 'LineString', coordinates: route.coordinaten } } : legeData(),
  )

  if (route) {
    const grenzen = new LngLatBounds()
    route.coordinaten.forEach((coordinaat) => grenzen.extend(coordinaat))
    kaart.fitBounds(grenzen, { padding: 50 })
  }
}

watch(() => [routeStatus.start, routeStatus.tussen.length, routeStatus.eind], tekenPunten)
watch(() => routeStatus.route, tekenRoute)
</script>

<template>
  <section class="kaartblok">
    <div ref="kaartElement" class="kaart"></div>
    <p v-if="melding" class="melding" role="status">{{ melding }}</p>
    <button type="button" class="locatieknop" @click="naarMijnLocatie">Mijn locatie</button>
  </section>
</template>

<style scoped>
.kaartblok {
  position: relative;
}

.kaart {
  position: absolute;
  inset: 0;
}

.melding {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 60px;
  margin: 0;
  padding: 8px 12px;
  border-radius: var(--afronding);
  background: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}

.locatieknop {
  position: absolute;
  left: 10px;
  /* Boven de bronvermelding van de kaart (die bij een smal scherm twee regels hoog is). */
  bottom: 64px;
  min-height: var(--minimale-tikgrootte);
  padding: 0 16px;
  border: 0;
  border-radius: var(--afronding);
  background: var(--kleur-achtergrond);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
  cursor: pointer;
}
</style>

<style>
/* De blauwe stip van je eigen positie. Niet "scoped", want MapLibre maakt dit element zelf aan. */
.ikzelf {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1d6fe0;
  border: 3px solid #fff;
  box-shadow: 0 0 0 1px #1d6fe0;
}
</style>
