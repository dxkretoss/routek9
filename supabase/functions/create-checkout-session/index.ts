// @ts-nocheck
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OFFICIAL_PRICE_CATALOG: Record<string, { name: string; amountInCents: number; isSubscription: boolean; interval?: string }> = {
  // Pro Subscriptions
  'pro_monthly': { name: 'Route K9 PRO Membership (Monthly)', amountInCents: 2900, isSubscription: true, interval: 'month' },
  'pro_yearly': { name: 'Route K9 PRO Membership (Yearly)', amountInCents: 29900, isSubscription: true, interval: 'year' },
  'pro-monthly': { name: 'Route K9 PRO Membership (Monthly)', amountInCents: 2900, isSubscription: true, interval: 'month' },
  'pro-yearly': { name: 'Route K9 PRO Membership (Yearly)', amountInCents: 29900, isSubscription: true, interval: 'year' },

  // Certifications
  'hipaa_certificate': { name: 'HIPAA & Bloodborne Pathogens Certification', amountInCents: 2500, isSubscription: false },
  'hipaa': { name: 'HIPAA & Bloodborne Pathogens Certification', amountInCents: 2500, isSubscription: false },

  // Standard Default Courses ($49.00 each)
  'master-contractor': { name: 'Master Contractor Training', amountInCents: 4900, isSubscription: false },
  'logistics-consultant': { name: 'Logistics Consultant Training', amountInCents: 4900, isSubscription: false },
  'delivery-company': { name: 'Delivery Company Training', amountInCents: 4900, isSubscription: false },
  'notary-public': { name: 'Notary Public Training', amountInCents: 4900, isSubscription: false },
  'field-inspector': { name: 'Field Inspector Training', amountInCents: 4900, isSubscription: false },
  'courier-dispatcher': { name: 'Courier Dispatcher Training', amountInCents: 4900, isSubscription: false },
};

async function fetchCourseFromDb(courseId: string, supabaseUrl: string, supabaseAnonKey: string) {
  if (!courseId) return null;
  const cleanId = String(courseId).replace(/^course_/, '').toLowerCase().trim();
  try {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    const url = `${supabaseUrl}/rest/v1/courses?id=eq.${encodeURIComponent(cleanId)}&select=title,price,status`;
    const res = await fetch(url, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      }
    });

    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const dbCourse = rows[0];
        const numPrice = parseFloat(dbCourse.price);
        if (!isNaN(numPrice) && numPrice >= 0.50) {
          return {
            name: dbCourse.title || 'Route K9 Training Course',
            amountInCents: Math.round(numPrice * 100),
            isSubscription: false
          };
        }
      }
    }
  } catch (err) {
    console.warn('Notice looking up course in Supabase database:', err);
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("VITE_STRIPE_SECRET_KEY");

    console.log("[create-checkout-session] STRIPE_SECRET_KEY status:", stripeKey
      ? `✅ FOUND (Prefix: "${stripeKey.substring(0, 10)}...", Length: ${stripeKey.length} chars)`
      : "❌ NOT FOUND (Please check Lovable Secrets)"
    );

    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY is not configured in Lovable Secrets." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { priceId, returnUrl, productName, email } = await req.json();
    console.log("[create-checkout-session] Request params:", { priceId, productName, email, returnUrl });

    if (!returnUrl) {
      return new Response(
        JSON.stringify({ error: "returnUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanId = String(priceId || '').replace(/^course_/, '').toLowerCase().trim();
    let verified: { name: string; amountInCents: number; isSubscription: boolean; interval?: string } | null = null;

    if (cleanId.includes('yearly')) {
      verified = { name: 'Route K9 PRO (Yearly)', amountInCents: 29900, isSubscription: true, interval: 'year' };
    } else if (cleanId.includes('monthly') || cleanId.includes('pro')) {
      verified = { name: 'Route K9 PRO (Monthly)', amountInCents: 2900, isSubscription: true, interval: 'month' };
    } else if (cleanId.includes('hipaa') || cleanId.includes('cert')) {
      verified = { name: 'HIPAA & Bloodborne Pathogens Certification', amountInCents: 2500, isSubscription: false };
    } else {
      // Lookup dynamic price in Supabase DB
      const sUrl = Deno.env.get("SUPABASE_URL") || "";
      const sKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
      verified = await fetchCourseFromDb(cleanId, sUrl, sKey);

      if (!verified) {
        verified = OFFICIAL_PRICE_CATALOG[cleanId] || {
          name: productName || 'Route K9 Training Course',
          amountInCents: 4900,
          isSubscription: false,
        };
      }
    }

    console.log("[create-checkout-session] Verified pricing:", verified);

    const params = new URLSearchParams();
    params.append('ui_mode', 'embedded');
    params.append('mode', verified.isSubscription ? 'subscription' : 'payment');
    params.append('return_url', returnUrl);
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', verified.name);
    params.append('line_items[0][price_data][unit_amount]', String(verified.amountInCents));
    params.append('line_items[0][quantity]', '1');

    if (email && email.includes('@')) {
      params.append('customer_email', email.trim());
    }

    if (verified.isSubscription) {
      params.append('line_items[0][price_data][recurring][interval]', verified.interval || 'month');
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey.trim()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const sessionData = await stripeRes.json();
    console.log("[create-checkout-session] Stripe response status:", stripeRes.status, "session ID:", sessionData?.id || sessionData?.error?.message);

    return new Response(
      JSON.stringify(sessionData),
      { status: stripeRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[create-checkout-session] Uncaught error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Server error creating Stripe session' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
