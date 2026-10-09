<script setup>
import SegmentedKeuze from './SegmentedKeuze.vue'
import { BOCHTIGHEDEN, RITSOORTEN, VOERTUIGEN, instellingen } from '../instellingen.js'

const MAX_KILOMETERS = 900 // TomTom: maximaal 900 km per route met het type "thrilling"
</script>

<template>
  <form class="formulier" @submit.prevent>
    <SegmentedKeuze v-model="instellingen.voertuig" label="Voertuig" :opties="VOERTUIGEN" />
    <SegmentedKeuze v-model="instellingen.ritsoort" label="Soort rit" :opties="RITSOORTEN" />

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

    <SegmentedKeuze v-model="instellingen.bochtigheid" label="Bochtigheid" :opties="BOCHTIGHEDEN" />

    <div class="komtlater" aria-disabled="true">
      <strong>Richting</strong>
      <span>Komt in stap 3</span>
    </div>
    <div class="komtlater" aria-disabled="true">
      <strong>Eerst snelweg of alles binnendoor</strong>
      <span>Komt in stap 5</span>
    </div>

    <button type="submit" class="hoofdknop" disabled>Genereer route (komt in stap 3)</button>
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

.veld input {
  min-height: var(--minimale-tikgrootte);
  padding: 0 12px;
  border: 1px solid var(--kleur-lijn);
  border-radius: var(--afronding);
  /* 16 pixels of groter voorkomt dat iPhone-Safari inzoomt bij het typen. */
  font-size: 16px;
}

.veld small {
  color: var(--kleur-zacht);
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
