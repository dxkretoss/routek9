import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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

    setTimeout(() => {
      onUpgradePro(subscriptionData);
      setSubscriptionReceipt(subscriptionData);
      setIsProcessing(false);
      setShowSuccessModal(true);
    }, 1000);
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900 font-sans selection:bg-rose-600 selection:text-white relative">
      
      {/* Header */}
      <Navbar currentUser={currentUser} onLogout={onLogout} onOpenPricing={() => navigate('/pricing')} />

      {/* Top Test Mode Banner */}
      <div className="bg-amber-500/15 border-b border-amber-300/40 py-2.5 px-4 text-center text-xs font-bold text-amber-900">
        All payments in test mode. Use test card <span className="font-mono underline">4242 4242 4242 4242</span>.
      </div>

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
            
            {/* Left Column: Order Summary Card */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-gradient-to-b from-slate-900 to-[#0b132b] text-white p-7 rounded-3xl border border-slate-800 shadow-xl space-y-6">
                
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    ORDER SUMMARY
                  </span>
                  <h3 className="text-xl font-bold font-serif-heading text-white">
                    Route K9 PRO Plan
                  </h3>
                </div>

                <div className="flex justify-between items-baseline border-b border-white/10 pb-4">
                  <div>
                    <div className="text-sm font-extrabold text-white">PRO Membership ({billingCycle})</div>
                    <div className="text-xs text-slate-400">Full platform access</div>
                  </div>
                  <div className="text-2xl font-extrabold text-amber-400">
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
                <div className="border-t border-white/10 pt-4 flex justify-between items-center text-sm font-extrabold">
                  <span className="text-slate-300">Total Due Today:</span>
                  <span className="text-2xl text-emerald-400">${price}.00 USD</span>
                </div>

              </div>

            </div>

            {/* Right Column: Card Payment Form */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Currency Selector */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Choose display currency:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      currency === 'USD'
                        ? 'border-emerald-600 bg-white text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    🇺🇸 ${price}.00 USD
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrency('INR')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      currency === 'INR'
                        ? 'border-emerald-600 bg-white text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    🇮🇳 ₹{(price * 99.8).toFixed(2)} INR
                  </button>
                </div>
              </div>

              {/* Main Payment Form Container */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl space-y-6">
                
                <form onSubmit={handlePay} className="space-y-4">
                  
                  {/* Account Email */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">Account Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Payment Method Card Box */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-slate-700">Payment Details</label>
                    
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>Credit / Debit Card (Test Mode)</span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Card Number</label>
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">MM / YY</label>
                            <input
                              type="text"
                              required
                              value={expDate}
                              onChange={(e) => setExpDate(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">CVC</label>
                            <input
                              type="text"
                              required
                              value={cvc}
                              onChange={(e) => setCvc(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Cardholder Name</label>
                          <input
                            type="text"
                            required
                            value={cardholderName}
                            onChange={(e) => setCardholderName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Pay & Activate Button */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-700 hover:to-amber-600 text-white font-extrabold text-sm shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    <Lock className="w-4 h-4 text-amber-200" />
                    <span>{isProcessing ? 'Processing Payment...' : `Pay $${price}.00 & Activate PRO (Test Mode)`}</span>
                  </button>

                </form>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>256-Bit SSL Encrypted Payment Gateway</span>
                </div>

              </div>

            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />

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

    </div>
  );
}
