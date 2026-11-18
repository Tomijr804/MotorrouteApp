<script setup>
import MapView from './components/MapView.vue'
import PuntenBlok from './components/PuntenBlok.vue'
import RouteForm from './components/RouteForm.vue'
import RouteResultaat from './components/RouteResultaat.vue'
import SleutelVak from './components/SleutelVak.vue'
</script>

<template>
  <main class="scherm">
    <MapView class="kaartvak" />
    <div class="onderkant">
      <SleutelVak />
      <PuntenBlok />
      <RouteForm />
      <RouteResultaat />
    </div>
  </main>
</template>

<style scoped>
.scherm {
  display: grid;
  grid-template-rows: 45vh 1fr;
  grid-template-rows: 45dvh 1fr;
  height: 100vh;
  height: 100dvh;
}

.kaartvak {
  min-height: 0;
}

/* Alles onder de kaart scrolt, de kaart blijft zichtbaar. */
.onderkant {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 0 calc(24px + env(safe-area-inset-bottom));
}
</style>
