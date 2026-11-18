<script setup>
import { computed } from 'vue'
import SegmentedKeuze from './SegmentedKeuze.vue'
import { instellingen } from '../instellingen.js'
import { MAX_TUSSENPUNTEN, routeStatus, wisPunten, zetStartOpMijnLocatie } from '../routeStatus.js'

const soorten = [
  { waarde: 'start', label: 'A' },
  { waarde: 'tussen', label: 'Tussenpunt' },
  { waarde: 'eind', label: 'B' },
]

const isRondrit = computed(() => instellingen.ritsoort === 'rondrit')

const overzicht = computed(() =>
  isRondrit.value
    ? `Startpunt: ${routeStatus.start ? 'gezet' : 'nog niet gezet'}`
    : `A: ${routeStatus.start ? 'ja' : 'nee'} · Tussenpunten: ${routeStatus.tussen.length}/${MAX_TUSSENPUNTEN} · ` +
      `B: ${routeStatus.eind ? 'ja' : 'nee'}`,
)
</script>

<template>
  <section class="punten">
    <h2>{{ isRondrit ? 'Startpunt' : 'Punten A en B' }}</h2>
    <p v-if="isRondrit" class="uitleg">Tik op de kaart om het startpunt te zetten, of gebruik je huidige locatie.</p>
    <p v-else class="uitleg">Kies wat je zet en tik op de kaart. Tussenpunten zijn niet nodig.</p>

    <SegmentedKeuze v-if="!isRondrit" v-model="routeStatus.volgendeSoort" label="Wat zet de volgende tik?" :opties="soorten" />
    <p class="overzicht">{{ overzicht }}</p>

    <div class="rij">
      <button type="button" class="knop" :disabled="!routeStatus.mijnLocatie" @click="zetStartOpMijnLocatie">
        {{ isRondrit ? 'Start = mijn locatie' : 'A = mijn locatie' }}
      </button>
      <button type="button" class="knop" @click="wisPunten">Wis punten</button>
    </div>
  </section>
</template>

<style scoped>
.punten {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0 16px;
}

h2 {
  margin: 0;
  font-size: 18px;
}

p {
  margin: 0;
}

.uitleg,
.overzicht {
  color: var(--kleur-zacht);
  font-size: 14px;
}

.rij {
  display: flex;
  gap: 8px;
}
</style>
