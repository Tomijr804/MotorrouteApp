<script setup>
import { computed } from 'vue'
import SegmentedKeuze from './SegmentedKeuze.vue'
import { BOCHTIGHEDEN, RICHTINGEN, RITSOORTEN, VOERTUIGEN, instellingen } from '../instellingen.js'
import { MAX_POGINGEN } from '../generator.js'
import { MAX_KILOMETERS, genereerRoute, routeStatus } from '../routeStatus.js'

const isRondrit = computed(() => instellingen.ritsoort === 'rondrit')
</script>

<template>
  <form class="formulier" @submit.prevent="genereerRoute">
    <SegmentedKeuze v-model="instellingen.voertuig" label="Voertuig" :opties="VOERTUIGEN" />
    <SegmentedKeuze v-model="instellingen.ritsoort" label="Soort rit" :opties="RITSOORTEN" />

    <template v-if="isRondrit">
      <div class="veld">
        <label for="richting">Richting</label>
        <select id="richting" v-model="instellingen.richting">
          <option :value="null" disabled>Kies een richting</option>
          <option v-for="richting in RICHTINGEN" :key="richting.waarde" :value="richting.waarde">
            {{ richting.label }}
          </option>
        </select>
      </div>

      <div class="veld">
        <label for="kilometers">Aantal kilometers</label>
        <input
          id="kilometers"
          v-model.number="instellingen.kilometers"
          type="number"
          inputmode="numeric"
          min="1"
          :max="MAX_KILOMETERS"
          placeholder="Bijvoorbeeld 150"
          @wheel="$event.target.blur()"
        />
        <small>Maximaal {{ MAX_KILOMETERS }} km (limiet van TomTom voor dit routetype).</small>
      </div>
    </template>

    <SegmentedKeuze v-model="instellingen.bochtigheid" label="Bochtigheid" :opties="BOCHTIGHEDEN" />

    <div class="komtlater" aria-disabled="true">
      <strong>Eerst snelweg of alles binnendoor</strong>
      <span>Komt in stap 5</span>
    </div>

    <button type="submit" class="hoofdknop" :disabled="routeStatus.bezig">
      {{ routeStatus.bezig ? 'Bezig…' : isRondrit ? 'Genereer rondrit' : 'Bereken route van A naar B' }}
    </button>
    <small v-if="isRondrit">Kost maximaal {{ MAX_POGINGEN }} TomTom-aanvragen.</small>
    <small v-else>Kost 1 TomTom-aanvraag. Kilometers en richting doen hier niets.</small>
  </form>
</template>

<style scoped>
.formulier {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 0 16px;
}

.veld {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.veld label {
  font-weight: 600;
}

.veld input,
.veld select {
  min-height: var(--minimale-tikgrootte);
  padding: 0 12px;
  border: 1px solid var(--kleur-lijn);
  border-radius: var(--afronding);
  background: var(--kleur-achtergrond);
  color: var(--kleur-tekst);
  /* 16 pixels of groter voorkomt dat iPhone-Safari inzoomt bij het typen. */
  font-size: 16px;
}

small {
  color: var(--kleur-zacht);
}

.hoofdknop + small {
  margin-top: -10px;
}

.komtlater {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1px dashed var(--kleur-lijn);
  border-radius: var(--afronding);
  background: var(--kleur-vlak);
  color: var(--kleur-zacht);
}
</style>
