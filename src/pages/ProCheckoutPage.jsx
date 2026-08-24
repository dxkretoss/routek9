import StripeEmbeddedCheckout from '../components/StripeEmbeddedCheckout';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import PaymentTestModeBanner from '../components/PaymentTestModeBanner';
import {
  ArrowLeft,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Crown,
  ArrowRight,
  Sparkles,
  Zap,
  Building,
  Users,
  FileText
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { supabase, createNotification } from '../lib/supabase';

export default function ProCheckoutPage({ currentUser, onLogout, onUpgradePro }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const cycleParam = searchParams.get('cycle') || 'monthly';
  const [billingCycle, setBillingCycle] = useState(cycleParam);

  const price = billingCycle === 'yearly' ? 299 : 29;
  const cycleText = billingCycle === 'yearly' ? 'year' : 'month';

  const [currency, setCurrency] = useState('USD');
  const [email, setEmail] = useState(currentUser?.email || 'driver@routek9.com');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expDate, setExpDate] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [cardholderName, setCardholderName] = useState(currentUser?.name || 'Jane A. Driver');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [subscriptionReceipt, setSubscriptionReceipt] = useState(null);
  const [hasProcessed, setHasProcessed] = useState(false);
  const processingRef = useRef(false);

  const queryParams = new URLSearchParams(window.location.search);
  const sessionId = queryParams.get('session_id');

  // Self-healing database insert helper for transactions
  async function safeInsertTransaction(payload) {
    const { data, error } = await supabase.from('transactions').insert([payload]).select();
    if (error) {
      if (error.code === '42703' || error.message?.includes('column')) {
        const match = error.message?.match(/column "(\w+)"/);
        const missingColumn = match ? match[1] : null;
        if (missingColumn && payload.hasOwnProperty(missingColumn)) {
          const nextPayload = { ...payload };
          delete nextPayload[missingColumn];
          return await safeInsertTransaction(nextPayload);
        }
      }
      if (payload.hasOwnProperty('user_id')) {
        const nextPayload = { ...payload };
        delete nextPayload.user_id;
        return await safeInsertTransaction(nextPayload);
      }
      if (payload.hasOwnProperty('course_id')) {
        const nextPayload = { ...payload };
        delete nextPayload.course_id;
        return await safeInsertTransaction(nextPayload);
      }
      throw error;
    }
    return data;
  }

  useEffect(() => {
    if (sessionId && !processingRef.current) {
      processingRef.current = true;
      setHasProcessed(true);
      async function handleSubSuccess() {
        const now = new Date();
        const subscribedAt = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        const renewalDate = new Date(now);
        if (billingCycle === 'yearly') {
          renewalDate.setFullYear(renewalDate.getFullYear() + 1);
        } else {
          renewalDate.setMonth(renewalDate.getMonth() + 1);
        }
        const nextRenewal = renewalDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        const subscriptionData = {
          isPro: true,
          subscriptionPlan: billingCycle === 'yearly' ? 'yearly' : 'pro',
          planName: 'Route K9 PRO Membership',
          billingCycle,
          amountPaid: `$${price}.00 USD`,
          subscribedAt,
          nextRenewal
        };

        // Upgrade local state
        onUpgradePro(subscriptionData);
        setSubscriptionReceipt(subscriptionData);

        // Save transaction to DB
        try {
          const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('id', sessionId)
            .limit(1);

          if (!existing || existing.length === 0) {
            await safeInsertTransaction({
              id: sessionId,
              user_id: currentUser?.id || null,
              course_id: `pro-${billingCycle}`,
              email: currentUser?.email || 'guest@routek9.com',
              description: `Route K9 PRO Membership (${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})`,
              amount: `$${price}.00`,
              status: 'Succeeded',
              created_at: new Date().toISOString()
            });
          }
        } catch (err) {
          console.warn("Failed to save subscription transaction record to database:", err);
        }

        // Create notification
        try {
          await createNotification({
            userId: currentUser?.id || null,
            title: 'PRO Membership Activated',
            message: `Thank you! Your Route K9 PRO Membership (${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}) is now active. Enjoy premium features!`,
            category: 'Earnings',
            important: true,
          });
        } catch (notifErr) {
          console.warn("Could not save PRO notification:", notifErr);
        }

        setShowSuccessModal(true);
      }
      handleSubSuccess();
    }
  }, [sessionId, billingCycle, price, currentUser, hasProcessed]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.name && (currentUser.name !== 'Jane A. Driver' || currentUser.email === 'driver@routek9.com')) {
        setCardholderName(currentUser.name);
      } else if (currentUser.email && currentUser.email !== 'driver@routek9.com') {
        setCardholderName(currentUser.email.split('@')[0]);
      }
    }
  }, [currentUser]);

  const handlePay = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    const now = new Date();
    const subscribedAt = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Calculate renewal date (+1 month or +1 year)
    const renewalDate = new Date(now);
    if (billingCycle === 'yearly') {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    } else {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    }
    const nextRenewal = renewalDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const subscriptionData = {
      isPro: true,
      subscriptionPlan: 'pro',
      planName: 'Route K9 PRO Membership',
      billingCycle,
      amountPaid: `$${price}.00 USD`,
      subscribedAt,
      nextRenewal
    };

    setTimeout(async () => {
      onUpgradePro(subscriptionData);
      setSubscriptionReceipt(subscriptionData);
      setIsProcessing(false);
      setShowSuccessModal(true);

      // Save a mock transaction
      const mockSessionId = `mock_pro_cs_${Date.now()}`;
      try {
        await safeInsertTransaction({
          id: mockSessionId,
          user_id: currentUser?.id || null,
          course_id: `pro-${billingCycle}`,
          email: currentUser?.email || 'guest@routek9.com',
          description: `Route K9 PRO Membership (${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})`,
          amount: `$${price}.00`,
          status: 'Succeeded',
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Failed to save mock subscription transaction:", err);
      }

      // Create notification
      try {
        await createNotification({
          userId: currentUser?.id || null,
          title: 'PRO Membership Activated',
          message: `Thank you! Your Route K9 PRO Membership (${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}) is now active. Enjoy premium features!`,
          category: 'Earnings',
          important: true,
        });
      } catch (notifErr) {
        console.warn("Could not save PRO notification:", notifErr);
      }
    }, 1000);
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    navigate('/dashboard');
  };

  return (
    <>
      {/* Payment Test Mode Banner */}
      {/* <PaymentTestModeBanner /> */}

      {/* Hero Sub-Header */}
      <div className="bg-[#0b132b] text-white py-10 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">

          <Link
            to="/pricing"
            className="text-xs font-bold text-slate-400 hover:text-rose-400 inline-flex items-center gap-1.5 transition-colors uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full backdrop-blur-md border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to plans</span>
          </Link>

          <div className="flex items-center gap-2 pt-1">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-300 font-sans">
              ROUTE K9 PRO MEMBERSHIP
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-serif-heading">
            Subscribe to Route K9 PRO
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm font-medium">
            Unlock 400-stop route optimization, government procurement contact details, and direct driver recruitment.
          </p>

        </div>
      </div>

      {/* Main Payment Checkout Box */}
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Column: Order Summary Card (Sticky) */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">

              <div className="bg-gradient-to-b from-slate-900 to-[#0b132b] text-white p-7 rounded-3xl border border-slate-800 shadow-xl space-y-6">

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    ORDER SUMMARY
                  </span>
                  <h3 className="text-xl font-bold font-serif-heading text-white">
                    Route K9 PRO Plan
                  </h3>
                </div>

                <div className="flex justify-between items-center border-b border-white/10 pb-4 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-extrabold text-white whitespace-nowrap overflow-hidden text-ellipsis">
                      PRO Membership <span className="text-xs font-semibold text-slate-400 capitalize">({billingCycle})</span>
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap">Full platform access</div>
                  </div>
                  <div className="text-2xl font-extrabold text-amber-400 shrink-0 whitespace-nowrap ml-2">
                    ${price}<span className="text-xs text-slate-400">/{cycleText}</span>
                  </div>
                </div>

                {/* Benefits Checklist */}
                <div className="space-y-3 pt-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Included Benefits:</div>

                  <div className="flex items-start gap-2 text-xs text-slate-200 font-medium">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>400-Stop Route Optimizer & 2-Opt Algorithm</span>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-slate-200 font-medium">
                    <Building className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>SAM.gov Procurement Contacts Unlocked</span>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-slate-200 font-medium">
                    <Users className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Direct Driver Recruitment Messaging</span>
                  </div>
                </div>

                {/* Total Line */}
                <div className="border-t border-white/10 pt-4 flex justify-between items-center text-sm font-extrabold gap-2">
                  <span className="text-slate-300 whitespace-nowrap">Total Due Today:</span>
                  <span className="text-xl sm:text-2xl text-emerald-400 font-extrabold shrink-0 whitespace-nowrap">${price}.00 USD</span>
                </div>

              </div>

            </div>

            {/* Right Column: Stripe Embedded Checkout Component matching reference code */}
            <div className="lg:col-span-7">
              <StripeEmbeddedCheckout
                priceId={`pro_${billingCycle}`}
                priceAmount={price}
                productName={`Route K9 PRO (${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})`}
                fullName={cardholderName}
                returnUrl={window.location.href}
                onSuccess={() => handlePay({ preventDefault: () => { } })}
              />
            </div>

          </div>

        </div>
      </main>

      {/* Modern Subscription Thank You Success Modal Overlay */}
      {showSuccessModal && subscriptionReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">

          <div className="bg-white max-w-md w-full rounded-3xl p-8 border border-slate-200 shadow-2xl space-y-6 text-center relative overflow-hidden animate-scaleUp">

            {/* Background Festive Ambient Glows */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Checkmark Icon Animation Badge */}
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-md">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            {/* Title & Badge */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase border border-emerald-200 tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Subscription Activated</span>
              </div>

              <h2 className="text-2xl font-extrabold text-[#0b132b] font-serif-heading">
                Thank You For Subscribing!
              </h2>

              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                You are now officially a <span className="font-bold text-rose-600">Route K9 PRO Member</span>. All premium features are unlocked.
              </p>
            </div>

            {/* Receipt Summary Details Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Plan Name:</span>
                <span className="font-bold text-slate-900">{subscriptionReceipt.planName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Billing Frequency:</span>
                <span className="font-bold text-slate-900 uppercase">{subscriptionReceipt.billingCycle}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Amount Paid:</span>
                <span className="font-bold text-emerald-600">{subscriptionReceipt.amountPaid}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Subscribed Date:</span>
                <span className="font-bold text-slate-800">{subscriptionReceipt.subscribedAt}</span>
              </div>

              <div className="flex justify-between items-center border-t border-slate-200/70 pt-2">
                <span className="text-slate-500 font-medium">Next Renewal:</span>
                <span className="font-extrabold text-amber-600">{subscriptionReceipt.nextRenewal}</span>
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              onClick={handleGoToDashboard}
              className="w-full py-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to My Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

        </div>
      )}
    </>
  );
}
