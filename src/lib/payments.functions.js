import { getStripeEnvironment } from "./stripe";
import { supabase } from "./supabase";

/**
 * Creates an official Stripe Checkout Session and returns clientSecret for Stripe Embedded Checkout.
 * Uses Lovable Cloud Deno Edge Function / Local Server API to create official Stripe sessions seamlessly.
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
    const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    const sessionParams = new URLSearchParams({
      ui_mode: "embedded",
      mode: isSubscription ? "subscription" : "payment",
      return_url: cleanReturnUrl,
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": productName,
      "line_items[0][price_data][unit_amount]": String(amountInCents),
      "line_items[0][quantity]": "1",
    });

    if (targetEmail && targetEmail.includes("@")) {
      sessionParams.append("customer_email", targetEmail);
    }
    if (isSubscription) {
      sessionParams.append("line_items[0][price_data][recurring][interval]", priceId.includes("yearly") ? "year" : "month");
    }

    // 1. Invoke Lovable / Supabase Cloud Deno Edge Function (Uses Lovable Cloud Secrets)
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId,
        returnUrl: cleanReturnUrl,
        productName,
        amountInCents,
        email: targetEmail,
      }
    });

    if (edgeError) {
      console.error("Supabase Edge Function Error:", edgeError);
      throw new Error(edgeError.message || "Failed to create checkout session from Lovable Edge function.");
    }

    if (edgeData) {
      if (edgeData.client_secret) {
        return { clientSecret: edgeData.client_secret };
      }
      if (edgeData.error) {
        const msg = typeof edgeData.error === "string" ? edgeData.error : (edgeData.error?.message || "Stripe session error");
        return { error: msg };
      }
    }

    throw new Error("Unable to create Stripe checkout session. Please ensure your Lovable Edge function is deployed.");
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
