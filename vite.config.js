import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const stripeSecretKey = env.STRIPE_SECRET_KEY || env.VITE_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'secure-stripe-session-server',
        configureServer(server) {
          server.middlewares.use('/api/create-checkout-session', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Method Not Allowed' }));
              return;
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });

            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const key = (stripeSecretKey || '').trim();

                if (!key) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    error: 'STRIPE_SECRET_KEY is not configured in .env on the server.'
                  }));
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
        },
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
  };
})
