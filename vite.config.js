import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const stripeSecretKey = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '';

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'server-stripe-checkout',
        configureServer(server) {
          server.middlewares.use('/api/create-checkout-session', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const key = stripeSecretKey.trim();

                if (!key) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'STRIPE_SECRET_KEY is not configured in .env' }));
                  return;
                }

                const params = new URLSearchParams();
                params.append('ui_mode', 'embedded');
                params.append('mode', parsed.mode || (parsed.isSubscription ? 'subscription' : 'payment'));
                params.append('return_url', parsed.returnUrl);
                params.append('line_items[0][price_data][currency]', 'usd');
                params.append('line_items[0][price_data][product_data][name]', parsed.productName || 'Route K9 Purchase');
                params.append('line_items[0][price_data][unit_amount]', String(parsed.amountInCents || 4900));
                params.append('line_items[0][quantity]', '1');

                if (parsed.email && parsed.email.includes('@')) {
                  params.append('customer_email', parsed.email.trim());
                }

                if (parsed.isSubscription) {
                  params.append('line_items[0][price_data][recurring][interval]', parsed.interval || 'month');
                }

                const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${key}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                  },
                  body: params.toString(),
                });

                const sessionData = await stripeRes.json();
                res.statusCode = stripeRes.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(sessionData));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || 'Server error creating Stripe session' }));
              }
            });
          });
        }
      }
    ],
    optimizeDeps: {
      include: ['react-simple-maps', 'prop-types', 'topojson-client', 'd3-scale', 'jodit-react', 'jodit']
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('jodit') || id.includes('jodit-react')) {
                return 'vendor-editor';
              }
              if (id.includes('leaflet')) {
                return 'vendor-leaflet';
              }
              if (id.includes('react-simple-maps') || id.includes('d3') || id.includes('topojson')) {
                return 'vendor-maps';
              }
              if (id.includes('html2canvas') || id.includes('dompurify')) {
                return 'vendor-canvas';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('@stripe')) {
                return 'vendor-stripe';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('react-phone-input-2')) {
                return 'vendor-phone';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor-react';
              }
              return 'vendor-misc';
            }
          }
        }
      }
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
