import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    optimizeDeps: {
      include: ['react-simple-maps', 'prop-types', 'topojson-client', 'd3-scale', 'jodit-react', 'jodit']
    },
    server: {
      port: 5173,
      proxy: {
        '/api/samgov': {
          target: 'https://api.sam.gov',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/samgov/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
            });
          }
        }
      }
    }
  };
})
