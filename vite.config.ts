import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' : les assets sont référencés en relatif, ce qui rend le build
// déployable tel quel sur GitHub Pages (sous-chemin /<repo>/) — le routing
// interne est en hash, donc aucun rewrite serveur n'est nécessaire.
export default defineConfig({
  base: './',
  plugins: [react()],
})
