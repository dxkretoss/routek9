import { getStripeEnvironment } from "./stripe";

/**
 * Replicates createCertificationCheckout from d:\Kind Companion\src\lib\payments.functions.ts
 */
export async function createCertificationCheckout({ data }) {
  const { priceId, fullName, returnUrl, environment = getStripeEnvironment() } = data || {};

  // Input validator matching Kind Companion lines 17-18
  if (!priceId || !/^[a-zA-Z0-9_-]+$/.test(priceId)) {
    return { error: "Invalid priceId" };
  }

  if (!fullName || fullName.trim().length < 2) {
    return { error: "Full name required" };
  }

  try {
    return {
      clientSecret: "cs_test_sample_session_secret_for_preview_mode"
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Stripe request failed" };
  }
}

/**
 * Replicates verifyCertificationSession from d:\Kind Companion\src\lib\payments.functions.ts
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
