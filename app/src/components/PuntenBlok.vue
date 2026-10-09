<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import SegmentedKeuze from './SegmentedKeuze.vue'
import { BOCHTIGHEDEN, VOERTUIGEN, labelVan } from '../instellingen.js'
import { formatAfstand, formatTijd } from '../formaat.js'
import { MAX_TUSSENPUNTEN, berekenEigenRoute, routeStatus, wisPunten, zetStartOpMijnLocatie } from '../routeStatus.js'

const soorten = [
  { waarde: 'start', label: 'Start' },
  { waarde: 'tussen', label: 'Tussenpunt' },
  { waarde: 'eind', label: 'Eindpunt' },
]

const overzicht = computed(
  () =>
    `Start: ${routeStatus.start ? 'ja' : 'nee'} · ` +
    `Tussenpunten: ${routeStatus.tussen.length}/${MAX_TUSSENPUNTEN} · ` +
    `Eindpunt: ${routeStatus.eind ? 'ja' : 'nee (rondrit)'}`,
)

// Een melding of resultaat staat onder de knop. Op een telefoon scrolt het dan in beeld.
const uitkomstBlok = ref(null)
watch(
  () => [routeStatus.melding, routeStatus.route],
  async () => {
    await nextTick()
    uitkomstBlok.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  },
)
</script>

<template>
  <section class="punten">
    <h2>Punten op de kaart</h2>
    <p class="uitleg">
      Kies hieronder wat je zet en tik dan op de kaart. Zonder eindpunt rijdt de route terug naar de start
      (rondrit). De route gebruikt het voertuig en de bochtigheid uit het formulier hierboven.
    </p>

    <SegmentedKeuze v-model="routeStatus.volgendeSoort" label="Wat zet de volgende tik?" :opties="soorten" />
    <p class="overzicht">{{ overzicht }}</p>

    <div class="rij">
      <button type="button" class="knop" :disabled="!routeStatus.mijnLocatie" @click="zetStartOpMijnLocatie">
        Start = mijn locatie
      </button>
      <button type="button" class="knop" @click="wisPunten">Wis punten</button>
    </div>

    <button type="button" class="hoofdknop" :disabled="routeStatus.bezig" @click="berekenEigenRoute">
      {{ routeStatus.bezig ? 'Route berekenen…' : 'Bereken route' }}
    </button>
    <small>Elke berekening kost 1 TomTom-aanvraag.</small>

    <div ref="uitkomstBlok" class="uitkomst">
      <p v-if="routeStatus.melding" :class="['melding', { fout: routeStatus.meldingIsFout }]" role="alert">
        {{ routeStatus.melding }}
      </p>

      <div v-if="routeStatus.route" class="resultaat" role="status">
        <strong>
          {{ formatAfstand(routeStatus.route.afstandMeter) }} · {{ formatTijd(routeStatus.route.tijdSeconden) }}
        </strong>
        <span>
          {{ labelVan(VOERTUIGEN, routeStatus.route.voertuig) }}, bochtigheid
          {{ labelVan(BOCHTIGHEDEN, routeStatus.route.bochtigheid).toLowerCase() }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.punten {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0 16px;
  padding-top: 18px;
  border-top: 1px solid var(--kleur-lijn);
}

h2 {
  margin: 0;
  font-size: 18px;
}

p {
  margin: 0;
}

.uitleg,
.overzicht,
small {
  color: var(--kleur-zacht);
  font-size: 14px;
}

.rij {
  display: flex;
  gap: 8px;
}

.melding {
  padding: 10px 12px;
  border-radius: var(--afronding);
  background: var(--kleur-vlak);
}

.melding.fout {
  background: #fdecea;
  color: #8a1c10;
}

.resultaat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  border: 1px solid var(--kleur-hoofd);
  border-radius: var(--afronding);
}

.resultaat strong {
  font-size: 20px;
}
</style>
