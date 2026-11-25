import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O Cloudflare define CI: sem o endereço da API, o site publicado tentaria
// falar com o computador de quem o abre.
if (process.env.CI && !process.env.VITE_API_URL?.startsWith('https://')) {
  throw new Error('Defina VITE_API_URL com o endereço https:// da API.')
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
