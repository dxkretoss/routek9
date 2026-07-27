import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function VehicleEarningsCalculator() {
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(1);

  const vehicleStats = [
    {
      name: "Sedan / Hatchback",
      payRange: "$150 - $280 / day",
      avgWeekly: "$950 / wk",
      bestFor: "Medical Stat Specimen, Legal Documents, Small Pharma",
      requirements: "Clean MVR, HIPAA Cert, Cooler setup",
      specs: "Up to 500 lbs cargo"
    },
    {
      name: "Cargo Van",
      payRange: "$280 - $420 / day",
      avgWeekly: "$1,850 / wk",
      bestFor: "Final Mile Parcels, Auto Parts, Floral & Catering",
      requirements: "Cargo partition, 100k Auto Liability",
      specs: "Up to 3,000 lbs / 250 cu.ft"
    },
    {
      name: "High Roof Sprinter Van",
      payRange: "$350 - $550 / day",
      avgWeekly: "$2,300 / wk",
      bestFor: "Regional Linehaul, E-Commerce Pallet Hotshot",
      requirements: "DOT Number, E-Track straps, Ramp",
      specs: "Up to 4,500 lbs / 480 cu.ft"
    },
    {
      name: "16ft Box Truck",
      payRange: "$450 - $680 / day",
      avgWeekly: "$3,100 / wk",
      bestFor: "Dedicated Appliance & Furniture, Air Cargo",
      requirements: "Liftgate or Ramp, Pallet Jack, TWIC badge",
      specs: "Up to 8,000 lbs payload"
    },
    {
      name: "26ft Box Truck w/ Liftgate",
      payRange: "$550 - $950 / day",
      avgWeekly: "$4,200 / wk",
      bestFor: "Inter-State Freight Shuttle, Dedicated Postal",
      requirements: "Class B CDL or Non-CDL 26k GVWR, DOT/MC",
      specs: "Up to 12 pallet capacity / 10,000+ lbs"
    }
  ];

  const current = vehicleStats[selectedVehicleIdx];

  return (
    <section className="py-16 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-rose-600">
            VEHICLE EARNING POTENTIAL
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            What can your vehicle earn?
          </h2>
          <p className="text-slate-600 text-base">
            Select your vehicle specs to see average daily contract pay rates across the United States.
          </p>
        </div>

        {/* Vehicle Selection Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8">
          {vehicleStats.map((v, idx) => (
            <button
              key={v.name}
              onClick={() => setSelectedVehicleIdx(idx)}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedVehicleIdx === idx
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25 scale-105'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>

        {/* Vehicle Earnings Details Card */}
        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider">
              {current.name} Specs
            </span>
            
            <h3 className="text-2xl font-extrabold text-slate-900">
              {current.name} Contract Potential
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="text-xs text-slate-500 font-semibold uppercase">Typical Contract Daily Pay</div>
              <div className="text-3xl font-extrabold text-rose-600">{current.payRange}</div>
              <div className="text-xs text-slate-600 font-medium">Estimated Avg Gross: <strong>{current.avgWeekly}</strong></div>
            </div>

            <div className="space-y-2 text-xs font-medium text-slate-700">
              <div><strong>Capacity Specs:</strong> {current.specs}</div>
              <div><strong>Best Route Types:</strong> {current.bestFor}</div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Required Credentials
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              {current.requirements}
            </p>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>National Market Demand</span>
              <span className="text-emerald-400 font-bold">Very High</span>
            </div>

            <a
              href="#map-section"
              className="block w-full text-center py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Search {current.name} Routes
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}
