import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useState, useEffect } from "react";
import { getStripe, getStripeEnvironment } from "../lib/stripe";
import { createCertificationCheckout } from "../lib/payments.functions";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

// Cache promises globally to guarantee only 1 backend call per unique product/plan session
const sessionPromiseCache = new Map();

export function StripeEmbeddedCheckout({ priceId, fullName, email, customerEmail, returnUrl, priceAmount, productName, onSuccess }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    const userEmail = (email || customerEmail || "").trim();
    const effectiveName = (fullName || "").trim() || "Customer";

    if (!priceId || !productName || productName.toLowerCase().startsWith("loading")) {
      return;
    }

    const sessionKey = `${priceId}_${priceAmount}_${productName}_${userEmail}`;

    setLoading(true);
    setError(null);

    // Reuse existing promise or initiate a single network call
    if (!sessionPromiseCache.has(sessionKey)) {
      const promise = createCertificationCheckout({
        data: {
          priceId,
          fullName: effectiveName,
          email: userEmail,
          returnUrl,
          priceAmount,
          productName,
          environment: getStripeEnvironment()
        },
      });
      sessionPromiseCache.set(sessionKey, promise);
    }

    sessionPromiseCache
      .get(sessionKey)
      .then((result) => {
        if (!isCurrent) return;
        if (result && result.clientSecret) {
          setClientSecret(result.clientSecret);
        } else if (result && result.error) {
          sessionPromiseCache.delete(sessionKey); // Allow retry on failure
          setError(result.error);
        } else {
          sessionPromiseCache.delete(sessionKey);
          setError("Failed to generate Stripe checkout session");
        }
      })
      .catch((err) => {
        if (!isCurrent) return;
        sessionPromiseCache.delete(sessionKey);
        setError(err.message || "Failed to initialize Stripe checkout");
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [priceId, priceAmount, productName]);

  if (loading) {
    return (
      <div className="w-full max-w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-12 text-center space-y-4 animate-fadeIn overflow-hidden box-border">
        <Loader2 className="w-10 h-10 animate-spin text-rose-600 mx-auto" />
        <div className="max-w-full overflow-hidden">
          <h4 className="text-sm font-extrabold text-[#0b132b]">Connecting to Stripe Secure Gateway...</h4>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-full bg-white rounded-3xl border border-rose-200 shadow-xl p-6 sm:p-8 text-center space-y-4 animate-fadeIn overflow-hidden box-border">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600 shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2 w-full max-w-full overflow-hidden">
          <h4 className="text-base font-extrabold text-[#0b132b]">Stripe Session Error</h4>
          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100/80 max-w-full overflow-hidden">
            <p className="text-xs text-rose-600 font-semibold break-all break-words leading-relaxed whitespace-pre-wrap">{error}</p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium pt-1">
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
    <div id="checkout" className="w-full max-w-full min-h-[450px] bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-2 sm:p-4 box-border">
      {clientSecret && (
        <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      )}
    </div>
  );
}

export default StripeEmbeddedCheckout;
