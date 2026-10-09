<script setup>
import { ref } from 'vue'
import { sleutel, bewaarSleutel, verwijderSleutel } from '../sleutel.js'

const invoer = ref('')
const tonen = ref(false)
const wijzigen = ref(false)
const melding = ref('')

function opslaan() {
  const schoon = invoer.value.trim()
  if (!schoon) {
    melding.value = 'Plak eerst je sleutel in het veld.'
    return
  }
  if (/\s/.test(schoon)) {
    melding.value = 'Een sleutel bevat geen spaties. Controleer wat je hebt geplakt.'
    return
  }

  const bewaard = bewaarSleutel(schoon)
  melding.value = bewaard
    ? 'Sleutel opgeslagen op dit apparaat.'
    : 'Je browser liet niet toe om de sleutel te bewaren. Hij geldt alleen tot je de pagina sluit.'
  stopInvoer()
}

function startWijzigen() {
  wijzigen.value = true
  melding.value = ''
}

function verwijderen() {
  verwijderSleutel()
  melding.value = 'Sleutel verwijderd.'
}

function stopInvoer() {
  invoer.value = ''
  tonen.value = false
  wijzigen.value = false
}

function annuleren() {
  stopInvoer()
  melding.value = ''
}
</script>

<template>
  <section class="sleutelvak">
    <div v-if="sleutel && !wijzigen" class="opgeslagen">
      <p>TomTom-sleutel staat opgeslagen op dit apparaat.</p>
      <div class="rij">
        <button type="button" class="knop" @click="startWijzigen">Wijzig</button>
        <button type="button" class="knop" @click="verwijderen">Verwijder</button>
      </div>
    </div>

    <form v-else class="invoer" @submit.prevent="opslaan">
      <label for="sleutel-invoer">{{ sleutel ? 'Nieuwe TomTom-sleutel' : 'Voer je TomTom-sleutel in' }}</label>
      <input
        id="sleutel-invoer"
        v-model="invoer"
        :class="{ verborgen: !tonen }"
        type="text"
        name="tomtom-sleutel"
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        placeholder="Plak hier je sleutel"
      />
      <label class="toon"><input v-model="tonen" type="checkbox" /> Toon de sleutel</label>
      <small>Je sleutel blijft op dit apparaat en gaat alleen naar TomTom.</small>
      <div class="rij">
        <button type="submit" class="hoofdknop">Opslaan</button>
        <button v-if="wijzigen" type="button" class="knop" @click="annuleren">Annuleer</button>
      </div>
    </form>

    <p v-if="melding" class="melding" role="status">{{ melding }}</p>
  </section>
</template>

<style scoped>
.sleutelvak {
  margin: 0 16px;
  padding: 12px;
  border: 1px solid var(--kleur-lijn);
  border-radius: var(--afronding);
  background: var(--kleur-vlak);
}

p {
  margin: 0;
}

.invoer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.invoer > label:first-child {
  font-weight: 600;
}

input[type='text'] {
  min-height: var(--minimale-tikgrootte);
  padding: 0 12px;
  border: 1px solid var(--kleur-lijn);
  border-radius: var(--afronding);
  font-size: 16px;
}

/* De sleutel als bolletjes tonen, zonder dat de browser denkt dat het een wachtwoord is. */
input.verborgen {
  -webkit-text-security: disc;
  text-security: disc;
}

.toon {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}

small {
  color: var(--kleur-zacht);
}

.rij {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.opgeslagen .rij {
  margin-top: 10px;
}

.melding {
  margin-top: 8px;
  font-size: 14px;
}
</style>
