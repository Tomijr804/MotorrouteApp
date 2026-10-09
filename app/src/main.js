import { createApp } from 'vue'
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import './style.css'
import App from './App.vue'

// MapLibre rekent op de achtergrond in een "worker". Vite moet weten waar die staat.
setWorkerUrl(workerUrl)

createApp(App).mount('#app')
