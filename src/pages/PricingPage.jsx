import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PaymentTestModeBanner from '../components/PaymentTestModeBanner';
import {
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  Crown,
  Building,
  Users,
  FileText,
  Lock,
  ArrowRight,
  HelpCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';

import heroBgPattern from '../assets/hero_bg_pattern.png';
import heroFleetImg from '../assets/hero_fleet_trucks.png';

export default function PricingPage({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'

  const handleSelectPro = () => {
    navigate(`/pro-checkout?cycle=${billingCycle}`);
  };

  const isPro = !!currentUser?.isPro;

  return (
    <>
      {/* Payment Test Mode Banner */}
      {/* <PaymentTestModeBanner /> */}

      {/* Premium Redesigned Hero Section */}
      <section className="relative bg-slate-950 text-white py-20 sm:py-28 border-b border-slate-800 overflow-hidden text-center">
        {/* Full-Screen High Resolution Fleet Background Image */}
        <img
          src={heroFleetImg}
          alt="Route K9 Pro Fleet Background"
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 scale-105 opacity-40"
        />

        {/* Dark Translucent Gradient Overlay for High Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/85 to-slate-950/95 backdrop-blur-[2px] pointer-events-none" />

        {/* Vector Route Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBgPattern})` }}
        />

        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-rose-500/20 via-amber-500/15 to-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">

          {/* Glowing Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-extrabold uppercase tracking-wider backdrop-blur-md shadow-md animate-pulse">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>ROUTE K9 MEMBERSHIP PLANS</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-serif-heading leading-tight max-w-3xl mx-auto">
            Unlock the Full Power of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 italic font-serif-heading">Route K9 PRO</span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-sm sm:text-base font-normal max-w-2xl mx-auto leading-relaxed">
            Supercharge your courier operations with unlimited <strong className="text-white font-bold">400-stop route optimization</strong>, direct <strong className="text-white font-bold">government procurement contacts</strong>, and independent driver recruitment tools.
          </p>

          {/* Floating Glassmorphism Feature Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-2">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 shadow-xl p-4 rounded-2xl text-center hover:bg-white/15 transition-all group">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xl font-extrabold font-serif-heading">
                <Zap className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>400 Stops</span>
              </div>
              <div className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider mt-1">Unlimited Route Optimizer</div>
            </div>

            <div className="backdrop-blur-md bg-white/10 border border-white/20 shadow-xl p-4 rounded-2xl text-center hover:bg-white/15 transition-all group">
              <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xl font-extrabold font-serif-heading">
                <Building className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
                <span>SAM.gov Links</span>
              </div>
              <div className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider mt-1">Direct Procurement Contacts</div>
            </div>

            <div className="backdrop-blur-md bg-white/10 border border-white/20 shadow-xl p-4 rounded-2xl text-center hover:bg-white/15 transition-all group">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xl font-extrabold font-serif-heading">
                <Users className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Direct Messaging</span>
              </div>
              <div className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider mt-1">Driver Directory Proposals</div>
            </div>
          </div>

          {/* Premium Glassmorphic Billing Cycle Switcher */}
          <div className="pt-4 flex justify-center">
            <div className="inline-flex items-center gap-2 backdrop-blur-md bg-white/10 border border-white/20 p-2 rounded-full shadow-2xl">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${billingCycle === 'monthly'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-slate-300 hover:text-white'
                  }`}
              >
                Monthly Billing
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2.5 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${billingCycle === 'yearly'
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                    : 'text-slate-300 hover:text-white'
                  }`}
              >
                <span>Yearly Billing</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase shadow-xs">
                  Save 15%
                </span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Main Plans Section */}
      <main className="flex-1 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">

            {/* FREE STARTER PLAN CARD */}
            <div className={`bg-white rounded-3xl p-8 border ${!isPro ? 'border-slate-300 shadow-lg' : 'border-slate-200'} flex flex-col justify-between space-y-8 relative`}>
              {!isPro && (
                <div className="absolute -top-3.5 left-8 px-4 py-1 rounded-full bg-slate-200 border border-slate-300 text-slate-700 text-xs font-extrabold uppercase tracking-wider">
                  Your Current Plan
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold text-[#0b132b] font-serif-heading">Free Starter</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Essential tools for new solo drivers</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-[#0b132b]">$0</span>
                  <span className="text-xs text-slate-500 font-bold">/ forever</span>
                </div>

                <ul className="space-y-4 pt-6 border-t border-slate-100">
                  <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 font-medium">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Route Planner (Max 5 stops limit)</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 font-medium">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Public Route Marketplace access</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 font-medium">
                    <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Basic Net Profit & Fuel Calculators</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-400 font-medium line-through">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>Gov Contract Procurement Contacts</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-400 font-medium line-through">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>Direct Driver Recruitment Messaging</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button
                  disabled
                  className="w-full py-4 rounded-xl bg-slate-100 text-slate-400 font-extrabold text-sm border border-slate-200 cursor-default text-center"
                >
                  {!isPro ? 'Active Plan' : 'Free Starter Tier'}
                </button>
              </div>
            </div>

            {/* ROUTE K9 PRO PLAN CARD */}
            <div className={`bg-gradient-to-b from-slate-900 via-slate-900 to-[#0b132b] text-white rounded-3xl p-8 border ${isPro ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-rose-600'} shadow-2xl flex flex-col justify-between space-y-8 relative`}>

              <div className="absolute -top-4 right-8 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Recommended Tier</span>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-extrabold text-white font-serif-heading">Route K9 PRO</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-extrabold border border-amber-400/30">PRO</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium">For serious contractors, fleet owners & dispatchers</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-white">
                    ${billingCycle === 'monthly' ? '29' : '299'}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {billingCycle === 'monthly' ? '/ month' : '/ year'}
                  </span>
                </div>

                <ul className="space-y-4 pt-6 border-t border-white/10">
                  <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-200 font-medium">
                    <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong className="text-white">Unlimited 400-Stop</strong> Route Optimizer & 2-Opt TSP algorithm</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-200 font-medium">
                    <Building className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <span><strong className="text-white">Gov Contracts Unlock:</strong> Direct procurement officer phone, email & SAM.gov links</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-200 font-medium">
                    <Users className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong className="text-white">Driver Recruitment:</strong> Direct messaging & contract proposals</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-200 font-medium">
                    <FileText className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                    <span>Export routes to CSV & SMS dispatch links</span>
                  </li>
                  <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-200 font-medium">
                    <Crown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <span>Gold PRO Member Badge across platform</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleSelectPro}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-700 hover:to-amber-600 text-white font-extrabold text-sm shadow-xl shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>{isPro ? 'Change / Renew Subscription →' : 'Upgrade to PRO →'}</span>
                </button>
              </div>

            </div>

          </div>

          {/* Guarantee / Security Banner */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm text-[#0b132b]">100% Risk-Free Guarantee</h4>
                <p className="text-xs text-slate-500 font-medium">Cancel your subscription at any time with 1-click in your profile dashboard.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Instant Unlocks</span>
              <span className="text-slate-300">•</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
