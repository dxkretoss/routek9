import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ['react-simple-maps', 'prop-types', 'topojson-client', 'd3-scale']
  },
  server: {
    proxy: {
      '/api/stripe': {
        target: 'https://connector-gateway.lovable.dev/stripe',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stripe/, ''),
        headers: {
          'X-Connection-Api-Key': 'acct_1TtzfQIKKpSWYo2f',
        }
      }
    }
  }
})
