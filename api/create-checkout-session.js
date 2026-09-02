/**
 * Serverless Function for Stripe Checkout Session creation
 * Used in production (e.g. Vercel / Node backend)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const key = (process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY || '').trim();
    if (!key) {
      return res.status(400).json({ error: 'STRIPE_SECRET_KEY is not configured on server' });
    }

    const { returnUrl, productName, amountInCents, email, isSubscription, interval, mode } = req.body || {};

    const params = new URLSearchParams();
    params.append('ui_mode', 'embedded');
    params.append('mode', mode || (isSubscription ? 'subscription' : 'payment'));
    params.append('return_url', returnUrl);
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', productName || 'Route K9 Purchase');
    params.append('line_items[0][price_data][unit_amount]', String(amountInCents || 4900));
    params.append('line_items[0][quantity]', '1');

    if (email && email.includes('@')) {
      params.append('customer_email', email.trim());
    }

    if (isSubscription) {
      params.append('line_items[0][price_data][recurring][interval]', interval || 'month');
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
    return res.status(stripeRes.status).json(sessionData);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error creating Stripe session' });
  }
}
