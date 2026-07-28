import React from 'react';
import { ArrowRight, TrendingUp, CheckCircle2, X, ShieldCheck, MapPin, Truck } from 'lucide-react';
import { US_STATES } from '../data/statesData';

export default function StateDetailCard({ state, onSelectState, onFilterCategory }) {
  const quickStatePills = ['TX', 'CA', 'FL', 'GA', 'NY', 'OH'];

  // View 1: When NO state is selected
  if (!state) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 space-y-4 transition-all duration-300">
        {/* Header Badge */}
        <div className="text-[11px] font-extrabold uppercase tracking-widest text-rose-600">
          SELECTED STATE
        </div>

        {/* Title */}
        <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif-heading">
          Tap a state
        </h3>

        {/* Subtitle */}
        <p className="text-slate-500 text-sm leading-relaxed font-normal">
          Hover to see it glow, click to pull up open routes, listings for sale, and local businesses in that state.
        </p>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium">
          Select any of the 50 states on the map to explore active delivery routes.
        </div>
      </div>
    );
  }

  // View 2: When a state IS selected
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 flex flex-col justify-between space-y-6 transition-all duration-300 relative">
      
      {/* Deselect / Reset button */}
      <button
        onClick={() => onSelectState(null)}
        className="absolute top-6 right-6 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
        title="Deselect state"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="space-y-6">
        {/* Header Badge */}
        <div className="text-[11px] font-extrabold uppercase tracking-widest text-rose-600">
          SELECTED STATE
        </div>

        {/* State Title & Abbreviation */}
        <div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-none mb-1 font-serif-heading">
            {state.name}
          </h3>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            {state.code}
          </span>
        </div>

        {/* 3 Action Buttons */}
        <div className="space-y-3">
          
          {/* Button 1: Solid Red Primary Button */}
          <button
            onClick={() => onFilterCategory('open-routes', state)}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-sm transition-all duration-200 cursor-pointer group"
          >
            <span>Find routes in {state.name}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Button 2: Outline Button */}
          <button
            onClick={() => onFilterCategory('for-sale', state)}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm transition-all duration-200 cursor-pointer group"
          >
            <span>Browse routes for sale</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Button 3: Outline Button */}
          <button
            onClick={() => onFilterCategory('business-hiring', state)}
            className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm transition-all duration-200 cursor-pointer group"
          >
            <span>Local businesses that need couriers</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

        </div>
      </div>

    </div>
  );
}
