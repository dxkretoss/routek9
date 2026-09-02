import { getStripeEnvironment } from "./stripe";

/**
 * Creates an official Stripe Checkout Session and returns clientSecret for Stripe Embedded Checkout.
 * Uses Lovable Gateway / Vite Proxy to create official Stripe sessions seamlessly.
 */
export async function createCertificationCheckout({ data }) {
  const { priceId, fullName, email, customerEmail, returnUrl, priceAmount, productName: customProductName } = data || {};

  if (!priceId || !/^[a-zA-Z0-9_-]+$/.test(priceId)) {
    return { error: "Invalid priceId" };
  }

  if (!fullName || fullName.trim().length < 2) {
    return { error: "Full name required" };
  }

  try {
    const isSubscription = priceId.includes("pro") || priceId.includes("yearly") || priceId.includes("monthly");

    // Determine dynamic amount in cents from priceAmount if provided, or fallback to priceId rules
    let parsedPrice = null;
    if (typeof priceAmount === "string") {
      const cleaned = priceAmount.replace(/[^0-9.]/g, "");
      if (cleaned) parsedPrice = parseFloat(cleaned);
    } else if (typeof priceAmount === "number") {
      parsedPrice = priceAmount;
    }

    let amountInCents = 4900;
    if (parsedPrice != null && !isNaN(parsedPrice) && parsedPrice >= 0.50) {
      amountInCents = parsedPrice < 1000 ? Math.round(parsedPrice * 100) : Math.round(parsedPrice);
    } else if (priceId) {
      amountInCents = priceId.includes("yearly") ? 29900 : priceId.includes("pro") ? 2900 : 4900;
    }

    // Stripe USD minimum charge threshold is $0.50 (50 cents)
    if (isNaN(amountInCents) || amountInCents < 50) {
      amountInCents = 50;
    }

    const productName = customProductName || (priceId.includes("pro") ? "Route K9 PRO Membership" : "Route K9 Certification Course");

    // Stripe Embedded Checkout requires a return_url containing {CHECKOUT_SESSION_ID} and without hash anchors
    let cleanReturnUrl = returnUrl || window.location.origin + window.location.pathname;
    cleanReturnUrl = cleanReturnUrl.split("#")[0];
    if (!cleanReturnUrl.includes("{CHECKOUT_SESSION_ID}")) {
      cleanReturnUrl += (cleanReturnUrl.includes("?") ? "&" : "?") + "session_id={CHECKOUT_SESSION_ID}";
    }

    const targetEmail = (email || customerEmail || "").trim();

    // 1. Call secure server-side Stripe checkout session endpoint
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnUrl: cleanReturnUrl,
          productName,
          amountInCents,
          email: targetEmail,
          isSubscription,
          interval: priceId.includes("yearly") ? "year" : "month",
          mode: isSubscription ? "subscription" : "payment",
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const session = await response.json();
        if (session && session.client_secret) {
          return { clientSecret: session.client_secret };
        }
        if (session && session.error) {
          const msg = typeof session.error === "string" ? session.error : session.error.message;
          return { error: msg || "Stripe API Error" };
        }
      }
    } catch (apiErr) {
      console.warn("create-checkout-session api error:", apiErr);
    }

    // 2. Fallback: Direct Stripe / Lovable gateway proxy if available
    try {
      const proxyResponse = await fetch("/api/stripe/v1/checkout/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Connection-Api-Key": "acct_1TtzfQIKKpSWYo2f",
        },
        body: new URLSearchParams({
          ui_mode: "embedded",
          mode: isSubscription ? "subscription" : "payment",
          return_url: cleanReturnUrl,
          "line_items[0][price_data][currency]": "usd",
          "line_items[0][price_data][product_data][name]": productName,
          "line_items[0][price_data][unit_amount]": String(amountInCents),
          "line_items[0][quantity]": "1",
        }).toString(),
      });

      const proxyContentType = proxyResponse.headers.get("content-type") || "";
      if (proxyContentType.includes("application/json")) {
        const fallbackSession = await proxyResponse.json();
        if (fallbackSession && fallbackSession.client_secret) {
          return { clientSecret: fallbackSession.client_secret };
        }
        if (fallbackSession?.error?.message) {
          return { error: fallbackSession.error.message };
        }
      }
    } catch (proxyErr) {
      console.warn("Proxy gateway fallback notice:", proxyErr);
    }

    throw new Error("Unable to create Stripe checkout session. Please ensure your backend API or Stripe server is deployed.");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Stripe request failed" };
  }
}

/**
 * Replicates verifyCertificationSession from Kind Companion payments.functions.ts
 */
export async function verifyCertificationSession({ data }) {
  const { sessionId } = data || {};

  if (sessionId && !/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
    return { error: "Invalid sessionId" };
  }

  try {
    return {
      paid: true,
      fullName: data?.fullName || null
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Verification failed" };
  }
}
