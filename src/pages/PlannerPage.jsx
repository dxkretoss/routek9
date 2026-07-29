import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { RoutePlanner } from "../components/RoutePlanner";
import { Rocket, MapPin, FileSpreadsheet, MessageSquare, DollarSign } from "lucide-react";
import heroBgPattern from "../assets/hero_bg_pattern.png";

export default function PlannerPage({ currentUser, onLogout, onOpenPricing, onTriggerGateModal }) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar currentUser={currentUser} onLogout={onLogout} onOpenPricing={onOpenPricing} />

      <main className="patriot flex-1 bg-white">
        <PlannerHero />
        <RoutePlanner currentUser={currentUser} onOpenPricing={onOpenPricing} onTriggerGateModal={onTriggerGateModal} />
      </main>

      <Footer />
    </div>
  );
}

function PlannerHero() {
  return (
    <section className="bg-gradient-to-br from-slate-50 via-[#faf9f6] to-rose-50/20 text-slate-900 py-12 sm:py-16 border-b border-slate-200/80 relative overflow-hidden">
      {/* Platform Route Map Background Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.14] mix-blend-multiply pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBgPattern})` }}
      />
      {/* Background Decorative Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* Left Column: Heading and intro */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-wider">
              <Rocket className="w-4 h-4 text-rose-600" />
              <span>AI-Powered Route Optimizer</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-tight">
              Command Every Stop. <br className="hidden sm:inline" />
              <span className="text-rose-600 italic font-serif-heading">Move the Whole Fleet.</span>
            </h1>

            <p className="text-slate-650 text-xs sm:text-sm font-normal leading-relaxed max-w-xl">
              A pro dispatch console built for courier drivers and dispatchers. Optimize up to 400 stops with 2-opt algorithms, carve territories into zones, hand off runs by SMS, and push the day to driver phones in one tap.
            </p>

            <div className="flex flex-wrap gap-2.5 pt-2">
              {/* <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-sans font-semibold text-slate-700 text-xs shadow-2xs">
                <Rocket className="w-3.5 h-3.5 text-rose-600" />
                <span>AI 2-opt Optimizer</span>
              </div> */}
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-sans font-semibold text-slate-700 text-xs shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Real-time GPS</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-sans font-semibold text-slate-700 text-xs shadow-2xs">
                <FileSpreadsheet className="w-3.5 h-3.5 text-rose-600" />
                <span>CSV Import/Export</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-sans font-semibold text-slate-700 text-xs shadow-2xs">
                <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
                <span>SMS Dispatch</span>
              </div>
              {/* <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-sans font-semibold text-slate-700 text-xs shadow-2xs">
                <DollarSign className="w-3.5 h-3.5 text-rose-600" />
                <span>$0 Fleet Cost</span>
              </div> */}
            </div>
          </div>

          {/* Right Column: Premium Quick Start Steps Card */}
          <div className="lg:col-span-5">
            <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-5 max-w-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600">Route Planning Made Simple</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">Pro Ready</span>
              </div>

              <div className="relative space-y-3.5">
                {/* Connecting Red Line */}
                <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-rose-400 via-rose-500 to-rose-400 z-0" />

                <div className="relative z-10 flex gap-3 items-start">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-600 border border-rose-200 shadow-2xs">1</div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0b132b]">Enter Stop Addresses</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">Type individual addresses, ZIP codes or import a CSV file.</p>
                  </div>
                </div>

                <div className="relative z-10 flex gap-3 items-start">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-600 border border-rose-200 shadow-2xs">2</div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0b132b]">Select Goal & Optimize</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">Choose Fastest, Shortest or Balanced, and click "Optimize route".</p>
                  </div>
                </div>

                <div className="relative z-10 flex gap-3 items-start">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-600 border border-rose-200 shadow-2xs">3</div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0b132b]">Zones & Driver Dispatch</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">Auto-group territories by proximity and assign registered drivers.</p>
                  </div>
                </div>

                <div className="relative z-10 flex gap-3 items-start">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-600 border border-rose-200 shadow-2xs">4</div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0b132b]">GPS & Navigation</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">Export to Google Maps/Apple Maps/Waze or send live to driver phone.</p>
                  </div>
                </div>
              </div>

              {/* Formatted Data Metrics Row inside Right-Side Card */}
              <div className="pt-4 border-t border-slate-100/80 grid grid-cols-4 gap-1.5 sm:gap-2">
                <div className="group flex flex-col items-center justify-center bg-rose-50/50 hover:bg-rose-50 border border-rose-100/80 rounded-xl px-1 py-2 text-center transition-all duration-200 shadow-2xs hover:shadow-xs min-w-0">
                  <span className="text-xs sm:text-base font-black text-rose-600 tracking-tight leading-none">400</span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-rose-950/70 uppercase tracking-tight whitespace-nowrap mt-1">Stops</span>
                </div>

                <div className="group flex flex-col items-center justify-center bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/80 rounded-xl px-1 py-2 text-center transition-all duration-200 shadow-2xs hover:shadow-xs min-w-0">
                  <span className="text-xs sm:text-base font-black text-indigo-600 tracking-tight leading-none">2-opt</span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-indigo-950/70 uppercase tracking-tight whitespace-nowrap mt-1">Optimizer</span>
                </div>

                <div className="group flex flex-col items-center justify-center bg-sky-50/50 hover:bg-sky-50 border border-sky-100/80 rounded-xl px-1 py-2 text-center transition-all duration-200 shadow-2xs hover:shadow-xs min-w-0">
                  <span className="text-xs sm:text-base font-black text-sky-600 tracking-tight leading-none">3</span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-sky-950/70 uppercase tracking-tight whitespace-nowrap mt-1">Nav Apps</span>
                </div>

                <div className="group flex flex-col items-center justify-center bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100/80 rounded-xl px-1 py-2 text-center transition-all duration-200 shadow-2xs hover:shadow-xs min-w-0">
                  <span className="text-xs sm:text-base font-black text-emerald-600 tracking-tight leading-none">$0</span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-950/70 uppercase tracking-tight whitespace-nowrap mt-1">Fleet Cost</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
