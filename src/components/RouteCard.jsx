import React from 'react';
import { Truck, MapPin, DollarSign, Calendar, ShieldCheck, ArrowRight, Clock, Award, Building2 } from 'lucide-react';

export default function RouteCard({ route, onViewDetails }) {
  const isForSale = route.category === 'for-sale';
  const isHiring = route.category === 'business-hiring';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-rose-300 transition-all duration-300 flex flex-col justify-between group">
      
      <div>
        {/* Top Header & Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider ${
              isForSale 
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : isHiring
                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}>
              {isForSale ? 'Route For Sale' : isHiring ? 'Business Hiring' : 'Open Contract'}
            </span>

            {route.urgency && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                {route.urgency}
              </span>
            )}
          </div>

          <span className="text-xs font-black px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 uppercase">
            {route.stateCode}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2 mb-2">
          {route.title}
        </h3>

        {/* Location & Company */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            {route.city}, {route.stateName}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            {route.company}
          </span>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block">Vehicle Specs</span>
            <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
              <Truck className="w-3.5 h-3.5 text-rose-500" />
              {route.vehicleRequired}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block">Schedule / Distance</span>
            <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {route.distance || route.schedule}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Price & Action Button */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {isForSale ? 'Asking Price' : 'Contract Pay'}
          </span>
          <div className="text-xl font-extrabold text-slate-900 flex items-baseline gap-1">
            <span className="text-rose-600 font-black">{route.pay}</span>
            <span className="text-xs font-semibold text-slate-500">{route.payPeriod}</span>
          </div>
        </div>

        <button
          onClick={() => onViewDetails(route)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer group-hover:bg-rose-600"
        >
          <span>View Specs</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
