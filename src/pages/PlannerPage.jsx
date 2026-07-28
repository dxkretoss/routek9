import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { RoutePlanner } from "../components/RoutePlanner";
import { Rocket, MapPin, FileSpreadsheet, MessageSquare, DollarSign } from "lucide-react";

export default function PlannerPage({ currentUser, onLogout }) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar currentUser={currentUser} onLogout={onLogout} />
      
      <main className="patriot flex-1 bg-white">
        <PlannerHero />
        <RoutePlanner />
      </main>
      
      <Footer />
    </div>
  );
}

function PlannerHero() {
  return (
    <section className="bg-gradient-to-br from-slate-50 via-[#faf9f6] to-rose-50/20 py-16 sm:py-20 border-b border-slate-200/60 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Heading and intro */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-wider">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
              <span>AI-Powered Route Optimizer</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-tight">
              Command Every Stop. <br className="hidden sm:inline" />
              <span className="text-rose-600 italic font-serif-heading">Move the Whole Fleet.</span>
            </h1>
            
            <p className="text-slate-650 text-xs sm:text-sm font-normal leading-relaxed max-w-xl">
              A pro dispatch console built for courier drivers and dispatchers. Optimize up to 400 stops with 2-opt, carve territories into zones, hand off runs by SMS, and push the day to driver phones in one tap.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-sans font-semibold text-slate-700 text-xs shadow-xs">
                <Rocket className="w-3.5 h-3.5 text-rose-600" />
                <span>AI 2-opt Optimizer</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-sans font-semibold text-slate-700 text-xs shadow-xs">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Real-time GPS</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-sans font-semibold text-slate-700 text-xs shadow-xs">
                <FileSpreadsheet className="w-3.5 h-3.5 text-rose-600" />
                <span>CSV Import/Export</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-sans font-semibold text-slate-700 text-xs shadow-xs">
                <MessageSquare className="w-3.5 h-3.5 text-rose-600" />
                <span>SMS Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-sans font-semibold text-slate-700 text-xs shadow-xs">
                <DollarSign className="w-3.5 h-3.5 text-rose-600" />
                <span>$0 Fleet Cost</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Quick Start Steps Card */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 max-w-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="text-xs font-bold uppercase tracking-wider text-rose-600">Route Planning Made Simple</div>
              
              <div className="space-y-4 pt-1">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-600 border border-rose-100">1</div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0b132b]">Enter Stop Addresses</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">Type individual addresses, ZIP codes or import a CSV file.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-600 border border-rose-100">2</div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0b132b]">Select Goal & Optimize</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">Choose Fastest, Shortest or Balanced, and click "Optimize route".</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-bold text-rose-600 border border-rose-100">3</div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0b132b]">Launch & Dispatch</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">Export to Google Maps/Apple Maps/Waze or send directly via SMS.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
