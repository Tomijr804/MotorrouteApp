<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { BOCHTIGHEDEN, RICHTINGEN, VOERTUIGEN, labelVan } from '../instellingen.js'
import { formatAfstand, formatTijd } from '../formaat.js'
import { MARGE, MAX_POGINGEN } from '../generator.js'
import { andereVariant, routeStatus } from '../routeStatus.js'

const margeProcent = Math.round(MARGE * 100)
const route = computed(() => routeStatus.route)
const zichtbaar = computed(() => routeStatus.bezig || routeStatus.melding || routeStatus.route)

function pogingenTekst(aantal) {
  return `${aantal} ${aantal === 1 ? 'poging' : 'pogingen'}`
}

// Een melding of resultaat staat onder het formulier. Op een telefoon scrolt het dan in beeld.
const blok = ref(null)
watch(
  () => [routeStatus.voortgang, routeStatus.melding, routeStatus.route],
  async () => {
    await nextTick()
    blok.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  },
)
</script>

<template>
  <section v-if="zichtbaar" ref="blok" class="uitkomst" aria-live="polite">
    <p v-if="routeStatus.bezig" class="melding">{{ routeStatus.voortgang || 'Bezig…' }}</p>

    <p v-if="routeStatus.melding" :class="['melding', { fout: routeStatus.meldingIsFout }]" role="alert">
      {{ routeStatus.melding }}
    </p>

    <div v-if="route" class="resultaat">
      <strong class="groot">{{ formatAfstand(route.afstandMeter) }} · {{ formatTijd(route.tijdSeconden) }}</strong>
      <span>
        {{ labelVan(VOERTUIGEN, route.voertuig) }}, bochtigheid
        {{ labelVan(BOCHTIGHEDEN, route.bochtigheid).toLowerCase() }}
      </span>

      <template v-if="route.bron === 'rondrit'">
        <span>Rondrit, richting {{ labelVan(RICHTINGEN, route.richting) }}, gevraagd {{ route.gevraagdKm }} km.</span>
        <span v-if="route.binnenMarge" class="goed">
          Binnen ±{{ margeProcent }}%, na {{ pogingenTekst(route.pogingen) }}.
        </span>
        <span v-else class="let-op">
          Niet binnen ±{{ margeProcent }}% gelukt. Dit is de beste van {{ pogingenTekst(route.pogingen) }}.
        </span>
        <span v-if="route.waarschuwing" class="let-op">Een poging mislukte: {{ route.waarschuwing }}</span>

        <button type="button" class="knop" :disabled="routeStatus.bezig" @click="andereVariant">Andere variant</button>
        <small>Een andere vorm van de lus, met dezelfde richting en afstand. Kost maximaal {{ MAX_POGINGEN }} aanvragen.</small>
      </template>
    </div>
  </section>
</template>

<style scoped>
.uitkomst {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0 16px;
}

p {
  margin: 0;
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
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--kleur-hoofd);
  border-radius: var(--afronding);
}

.groot {
  font-size: 20px;
}

.goed {
  color: #1e7a3c;
}

.let-op {
  color: #8a5a00;
}

.resultaat .knop {
  margin-top: 6px;
}

small {
  color: var(--kleur-zacht);
  font-size: 14px;
}
</style>
