import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [vue()],
  // Op GitHub Pages staat de app op https://<gebruikersnaam>.github.io/MotorrouteApp/
  // (let op de hoofdletters, het webadres is hoofdlettergevoelig).
  // Alleen bij het bouwen gebruiken we dat pad. Met "npm run dev" blijft de app gewoon op /.
  base: command === 'build' ? '/MotorrouteApp/' : '/',
}))
