import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useState } from "react";
import { getStripe, getStripeEnvironment } from "../lib/stripe";
import { createCertificationCheckout } from "../lib/payments.functions";

export function StripeEmbeddedCheckout({ priceId, fullName, returnUrl }) {
  const [error, setError] = useState(null);

  const fetchClientSecret = async () => {
    setError(null);
    try {
      const result = await createCertificationCheckout({
        data: { priceId, fullName, returnUrl, environment: getStripeEnvironment() },
      });

      console.log(result);
      if ("error" in result) throw new Error(result.error);
      if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
      return result.clientSecret;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start checkout";
      setError(msg);
      throw e;
    }
  };

  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 animate-fadeIn">
        <div className="font-semibold">Couldn't start checkout</div>
        <div className="mt-1">{error}</div>
        <div className="mt-2 text-red-700">
          Please go back and enter your full name (at least 2 characters) as it should appear on the certificate.
        </div>
      </div>
    );
  }

  return (
    <div id="checkout" className="w-full min-h-[400px]">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

export default StripeEmbeddedCheckout;
