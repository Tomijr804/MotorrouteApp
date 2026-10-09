<script setup>
import { useId } from 'vue'

// Een rij grote knoppen waarvan je er één kiest (zoals "Laag, Normaal, Hoog").
// Gebruik: <SegmentedKeuze v-model="waarde" label="Naam" :opties="[{ waarde: 'a', label: 'A' }, ...]" />
defineProps({
  label: { type: String, required: true },
  opties: { type: Array, required: true },
})

const gekozen = defineModel()
const groepsnaam = useId()
</script>

<template>
  <fieldset class="keuze">
    <legend>{{ label }}</legend>
    <div class="knoppen">
      <label v-for="optie in opties" :key="optie.waarde" :class="{ actief: gekozen === optie.waarde }">
        <input v-model="gekozen" type="radio" :name="groepsnaam" :value="optie.waarde" />
        <span>{{ optie.label }}</span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.keuze {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}

legend {
  padding: 0;
  margin-bottom: 6px;
  font-weight: 600;
}

.knoppen {
  display: flex;
  border: 1px solid var(--kleur-lijn);
  border-radius: var(--afronding);
  overflow: hidden;
}

label {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--minimale-tikgrootte);
  padding: 0 8px;
  text-align: center;
  background: var(--kleur-achtergrond);
  cursor: pointer;
}

label + label {
  border-left: 1px solid var(--kleur-lijn);
}

label.actief {
  background: var(--kleur-hoofd);
  color: var(--kleur-hoofd-tekst);
  font-weight: 600;
}

/* Het echte keuzerondje verbergen, maar wel bruikbaar houden voor toetsenbord en schermlezers. */
input {
  position: absolute;
  opacity: 0;
  inset: 0;
  margin: 0;
  cursor: pointer;
}

label:has(input:focus-visible) {
  outline: 3px solid #f08c00;
  outline-offset: -3px;
}
</style>
