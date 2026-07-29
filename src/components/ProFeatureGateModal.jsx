import React from 'react';
import { 
  X, 
  Crown, 
  Sparkles, 
  Zap, 
  Building, 
  Users, 
  ArrowRight, 
  ShieldCheck,
  Lock
} from 'lucide-react';

export default function ProFeatureGateModal({ isOpen, onClose, title, message, onGoToPricing }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn overflow-hidden">
      <div className="relative w-full max-w-[420px] max-h-[90vh] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-y-auto animate-scaleUp flex flex-col my-auto scrollbar-thin">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-[#0b132b] text-white p-5 sm:p-6 text-center relative overflow-hidden shrink-0">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-28 bg-rose-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Crown Icon Badge */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 p-0.5 shadow-lg mx-auto mb-3 relative z-10">
            <div className="w-full h-full bg-[#0b132b] rounded-[10px] flex items-center justify-center">
              <Crown className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
          </div>

          <div className="relative z-10 space-y-1.5 max-w-xs mx-auto">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>PRO MEMBER FEATURE</span>
            </div>

            <h3 className="text-xl font-extrabold text-white font-serif-heading tracking-tight leading-snug">
              {title || "Unlock Route K9 PRO"}
            </h3>

            <p className="text-slate-300 text-xs font-normal leading-relaxed">
              {message || "This feature requires an active Route K9 PRO Membership to access."}
            </p>
          </div>
        </div>

        {/* Modal Content & Features List */}
        <div className="p-5 sm:p-6 space-y-4 bg-[#FAF9F6] flex-1">
          
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Included With Route K9 PRO ($29/mo):</div>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-slate-700 font-medium leading-snug">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Unlimited 400-Stop</strong> Route Optimizer & 2-Opt TSP</span>
              </div>

              <div className="flex items-start gap-2 text-slate-700 font-medium leading-snug">
                <Building className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">SAM.gov Unlocked:</strong> Procurement phone, email & bid links</span>
              </div>

              <div className="flex items-start gap-2 text-slate-700 font-medium leading-snug">
                <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong className="text-slate-900">Driver Recruitment:</strong> Direct messaging & proposals</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={onGoToPricing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-700 hover:to-amber-600 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>View Subscription Plans ($29/mo)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Continue with Free Plan
            </button>
          </div>

          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-medium text-center">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Cancel anytime • Instant activation in test mode</span>
          </div>

        </div>

      </div>
    </div>
  );
}
