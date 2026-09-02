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

                // Server-Side Pricing Truth Table
                const OFFICIAL_PRICES = {
                  'pro_monthly': { name: 'Route K9 PRO Membership (Monthly)', amountInCents: 2900, isSubscription: true, interval: 'month' },
                  'pro_yearly': { name: 'Route K9 PRO Membership (Yearly)', amountInCents: 29900, isSubscription: true, interval: 'year' },
                  'pro-monthly': { name: 'Route K9 PRO Membership (Monthly)', amountInCents: 2900, isSubscription: true, interval: 'month' },
                  'pro-yearly': { name: 'Route K9 PRO Membership (Yearly)', amountInCents: 29900, isSubscription: true, interval: 'year' },
                  'hipaa_certificate': { name: 'HIPAA & Bloodborne Pathogens Certification', amountInCents: 2500, isSubscription: false },
                  'hipaa': { name: 'HIPAA & Bloodborne Pathogens Certification', amountInCents: 2500, isSubscription: false },
                  'master-contractor': { name: 'Master Contractor Training', amountInCents: 4900, isSubscription: false },
                  'logistics-consultant': { name: 'Logistics Consultant Training', amountInCents: 4900, isSubscription: false },
                  'delivery-company': { name: 'Delivery Company Training', amountInCents: 4900, isSubscription: false },
                  'notary-public': { name: 'Notary Public Training', amountInCents: 4900, isSubscription: false },
                  'field-inspector': { name: 'Field Inspector Training', amountInCents: 4900, isSubscription: false },
                  'courier-dispatcher': { name: 'Courier Dispatcher Training', amountInCents: 4900, isSubscription: false },
                };

                const cleanId = String(parsed.priceId || '').replace(/^course_/, '').toLowerCase().trim();

                // 1. Pro Subscriptions
                let verified = null;
                if (cleanId.includes('yearly')) {
                  verified = { name: 'Route K9 PRO (Yearly)', amountInCents: 29900, isSubscription: true, interval: 'year' };
                } else if (cleanId.includes('monthly') || cleanId.includes('pro')) {
                  verified = { name: 'Route K9 PRO (Monthly)', amountInCents: 2900, isSubscription: true, interval: 'month' };
                } else if (cleanId.includes('hipaa') || cleanId.includes('cert')) {
                  verified = { name: 'HIPAA & Bloodborne Pathogens Certification', amountInCents: 2500, isSubscription: false };
                } else {
                  // 2. Fetch live price set by Admin in Supabase DB
                  const sUrl = env.VITE_SUPABASE_URL || 'https://qgriomlngioeiterbeii.supabase.co';
                  const sKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '';
                  if (sKey) {
                    try {
                      const dbRes = await fetch(`${sUrl}/rest/v1/courses?id=eq.${encodeURIComponent(cleanId)}&select=title,price`, {
                        headers: { apikey: sKey, Authorization: `Bearer ${sKey}` }
                      });
                      if (dbRes.ok) {
                        const rows = await dbRes.json();
                        if (Array.isArray(rows) && rows.length > 0) {
                          const p = parseFloat(rows[0].price);
                          if (!isNaN(p) && p >= 0.50) {
                            verified = {
                              name: rows[0].title || parsed.productName || 'Route K9 Course',
                              amountInCents: Math.round(p * 100),
                              isSubscription: false,
                            };
                          }
                        }
                      }
                    } catch (dbErr) {
                      console.warn("DB course check notice:", dbErr);
                    }
                  }

                  // 3. Fallback to default catalog or default $49
                  if (!verified) {
                    verified = OFFICIAL_PRICES[cleanId] || {
                      name: parsed.productName || 'Route K9 Training Course',
                      amountInCents: 4900,
                      isSubscription: false,
                    };
                  }
                }

                const params = new URLSearchParams();
                params.append('ui_mode', 'embedded');
                params.append('mode', verified.isSubscription ? 'subscription' : 'payment');
                params.append('return_url', parsed.returnUrl);
                params.append('line_items[0][price_data][currency]', 'usd');
                params.append('line_items[0][price_data][product_data][name]', verified.name);
                params.append('line_items[0][price_data][unit_amount]', String(verified.amountInCents));
                params.append('line_items[0][quantity]', '1');

                if (parsed.email && parsed.email.includes('@')) {
                  params.append('customer_email', parsed.email.trim());
                }

                if (verified.isSubscription) {
                  params.append('line_items[0][price_data][recurring][interval]', verified.interval || 'month');
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
