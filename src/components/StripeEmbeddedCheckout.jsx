import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useState, useEffect } from "react";
import { getStripe, getStripeEnvironment } from "../lib/stripe";
import { createCertificationCheckout } from "../lib/payments.functions";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

export function StripeEmbeddedCheckout({ priceId, fullName, returnUrl, onSuccess }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function initCheckout() {
      setLoading(true);
      setError(null);
      try {
        const result = await createCertificationCheckout({
          data: { priceId, fullName, returnUrl, environment: getStripeEnvironment() },
        });

        if (!isMounted) return;

        if (result && result.clientSecret) {
          setClientSecret(result.clientSecret);
        } else if (result && result.error) {
          setError(result.error);
        } else {
          setError("Failed to generate Stripe checkout session");
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Failed to initialize Stripe checkout");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initCheckout();
    return () => {
      isMounted = false;
    };
  }, [priceId, fullName, returnUrl]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-12 text-center space-y-4 animate-fadeIn">
        <Loader2 className="w-10 h-10 animate-spin text-rose-600 mx-auto" />
        <div>
          <h4 className="text-sm font-extrabold text-[#0b132b]">Connecting to Stripe Secure Gateway...</h4>
          <p className="text-xs text-slate-400 font-medium mt-1">Initializing official 256-bit encrypted checkout session</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 shadow-xl p-8 text-center space-y-4 animate-fadeIn">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-extrabold text-[#0b132b]">Stripe Session Error</h4>
          <p className="text-xs text-rose-600 font-bold">{error}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-2">
            Please check your Stripe API keys or retry loading the checkout.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-[#0b132b] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Checkout</span>
        </button>
      </div>
    );
  }

  return (
    <div id="checkout" className="w-full min-h-[450px] bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-4">
      {clientSecret && (
        <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      )}
    </div>
  );
}

export default StripeEmbeddedCheckout;
