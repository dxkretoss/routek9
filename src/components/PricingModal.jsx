import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  Crown, 
  Building, 
  Users, 
  FileText,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function PricingModal({ isOpen, onClose, isPro, onUpgrade, onCancel }) {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onUpgrade(billingCycle);
      setIsProcessing(false);
      onClose();
    }, 600);
  };

  const handleCancelClick = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onCancel();
      setIsProcessing(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-[#0b132b] text-white p-8 sm:p-10 text-center relative overflow-hidden">
          {/* Decorative ambient background glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-extrabold uppercase tracking-wider backdrop-blur-md">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Route K9 Membership Plans</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif-heading">
              Unlock the Full Power of <span className="text-rose-500 italic">Route K9</span>
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
              Supercharge your courier operations with unlimited multi-stop optimization, exclusive government contracts, and direct driver recruitment.
            </p>

            {/* Monthly / Yearly Billing Toggle */}
            <div className="pt-4 flex justify-center items-center gap-3">
              <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
              <button
                type="button"
                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                className="w-14 h-8 rounded-full bg-slate-800 border border-slate-700 p-1 flex items-center transition-all cursor-pointer relative"
              >
                <div 
                  className={`w-6 h-6 rounded-full bg-rose-600 shadow-md transform transition-transform ${
                    billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                  }`} 
                />
              </button>
              <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-400'}`}>
                Yearly
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase">Save 15%</span>
              </span>
            </div>

          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FAF9F6]">
          
          {/* FREE PLAN CARD */}
          <div className={`bg-white rounded-3xl p-6 sm:p-8 border ${!isPro ? 'border-slate-300 shadow-md' : 'border-slate-200'} flex flex-col justify-between space-y-6 relative`}>
            {!isPro && (
              <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-slate-200 border border-slate-300 text-slate-700 text-[10px] font-extrabold uppercase tracking-wider">
                Current Plan
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#0b132b] font-serif-heading">Free Starter</h3>
                <p className="text-xs text-slate-500 font-medium">Essential features for new solo drivers</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[#0b132b]">$0</span>
                <span className="text-xs text-slate-500 font-bold">/ forever</span>
              </div>

              <ul className="space-y-3 pt-4 border-t border-slate-100">
                <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Route Planner (Max 5 stops limit)</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Public Route Marketplace access</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Basic Net Profit & Fuel Calculators</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-slate-400 font-medium line-through">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>Gov Contract Procurement Contacts</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-slate-400 font-medium line-through">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>Direct Driver Recruitment Messaging</span>
                </li>
              </ul>
            </div>

            <button
              disabled={!isPro}
              onClick={handleCancelClick}
              className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                !isPro 
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-default'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              {!isPro ? 'Your Active Plan' : 'Downgrade to Free'}
            </button>
          </div>

          {/* PRO PLAN CARD */}
          <div className={`bg-gradient-to-b from-slate-900 to-[#0b132b] text-white rounded-3xl p-6 sm:p-8 border ${isPro ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-rose-600'} shadow-xl flex flex-col justify-between space-y-6 relative`}>
            
            <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Recommended</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white font-serif-heading">Route K9 PRO</h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-extrabold border border-amber-400/30">PRO</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">For serious contractors, fleet owners & dispatchers</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">
                  ${billingCycle === 'monthly' ? '29' : '299'}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {billingCycle === 'monthly' ? '/ month' : '/ year'}
                </span>
              </div>

              <ul className="space-y-3 pt-4 border-t border-white/10">
                <li className="flex items-start gap-2.5 text-xs text-slate-200 font-medium">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">Unlimited 400-Stop</strong> Route Optimizer & 2-Opt TSP algorithm</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-slate-200 font-medium">
                  <Building className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">Gov Contracts Unlock:</strong> Direct procurement officer phone, email & SAM.gov links</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-slate-200 font-medium">
                  <Users className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong className="text-white">Driver Recruitment:</strong> Direct messaging & contract proposals</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-slate-200 font-medium">
                  <FileText className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>Export routes to CSV & SMS dispatch links</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-slate-200 font-medium">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Gold PRO Member Badge across platform</span>
                </li>
              </ul>
            </div>

            <button
              disabled={isProcessing}
              onClick={handleUpgradeClick}
              className={`w-full py-4 rounded-xl font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                isPro
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25'
              }`}
            >
              {isProcessing ? (
                <span>Processing...</span>
              ) : isPro ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Active PRO Member</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Upgrade to PRO (Test Mode)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>

        {/* Modal Footer Note */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 text-center text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>All subscriptions are in test mode. You can toggle between Free and Pro at any time for testing.</span>
        </div>

      </div>
    </div>
  );
}
