import React, { useState, useMemo } from 'react';
import { Calculator } from 'lucide-react';

const PAYMENT_MODES = [
  { id: 'per_week', label: 'Per week (flat)' },
  { id: 'per_day', label: 'Per day' },
  { id: 'per_stop', label: 'Per stop' },
  { id: 'per_load', label: 'Per load / run' },
  { id: 'per_package', label: 'Per package' },
  { id: 'per_mile', label: 'Per mile' },
  { id: 'per_hour', label: 'Per hour' }
];

const VEHICLE_MPG_OPTIONS = [
  { label: 'Chevy Express / GMC Savana (15 mpg)', mpg: 15 },
  { label: 'Ford Transit Cargo Van (18 mpg)', mpg: 18 },
  { label: 'Ram ProMaster (17 mpg)', mpg: 17 },
  { label: 'Mercedes Sprinter High-Roof (20 mpg)', mpg: 20 },
  { label: 'Sedan / Hatchback (30 mpg)', mpg: 30 },
  { label: 'SUV / Minivan (22 mpg)', mpg: 22 },
  { label: '16ft Box Truck (10 mpg)', mpg: 10 },
  { label: '26ft Box Truck (8 mpg)', mpg: 8 }
];

export default function ProfitCalculator() {
  // Main Pay Mode
  const [payMode, setPayMode] = useState('per_stop');

  // Input Fields
  const [payRate, setPayRate] = useState(3);
  const [unitsPerWeek, setUnitsPerWeek] = useState(400); // e.g. stops per week
  const [milesDrivenPerWeek, setMilesDrivenPerWeek] = useState(1200);
  const [selectedMpgOption, setSelectedMpgOption] = useState(15);
  const [fuelPrice, setFuelPrice] = useState(3.60);

  // Fixed Costs
  const [insuranceWeekly, setInsuranceWeekly] = useState(110);
  const [maintenanceWeekly, setMaintenanceWeekly] = useState(90);
  const [phoneWeekly, setPhoneWeekly] = useState(15);
  const [otherWeekly, setOtherWeekly] = useState(40);

  // Tax Reserve
  const [taxPercent, setTaxPercent] = useState(15);

  // Bottom Calculator: Pay per mile converter
  const [calcPayTotal, setCalcPayTotal] = useState(1200);
  const [calcMilesTotal, setCalcMilesTotal] = useState(1200);
  const [calcTimeFrame, setCalcTimeFrame] = useState('Per week');

  // Calculations
  const metrics = useMemo(() => {
    // 1. Calculate Gross Weekly Pay
    let grossWeeklyPay = 0;
    if (payMode === 'per_week') {
      grossWeeklyPay = Number(payRate);
    } else if (payMode === 'per_day') {
      grossWeeklyPay = Number(payRate) * Math.min(Number(unitsPerWeek), 7);
    } else if (payMode === 'per_stop' || payMode === 'per_package' || payMode === 'per_load') {
      grossWeeklyPay = Number(payRate) * Number(unitsPerWeek);
    } else if (payMode === 'per_mile') {
      grossWeeklyPay = Number(payRate) * Number(milesDrivenPerWeek);
    } else if (payMode === 'per_hour') {
      grossWeeklyPay = Number(payRate) * Number(unitsPerWeek); // hours per week
    }

    // 2. Fuel Cost
    const gallonsUsed = Number(milesDrivenPerWeek) / Math.max(Number(selectedMpgOption), 1);
    const fuelCostWeekly = gallonsUsed * Number(fuelPrice);

    // 3. Operating Expenses
    const operatingExpensesWeekly =
      Number(insuranceWeekly) +
      Number(maintenanceWeekly) +
      Number(phoneWeekly) +
      Number(otherWeekly);

    const subtotalBeforeTax = grossWeeklyPay - fuelCostWeekly - operatingExpensesWeekly;
    const profitBeforeTax = Math.max(0, subtotalBeforeTax);

    // 4. Tax Reserve
    const taxReserveWeekly = profitBeforeTax * (Number(taxPercent) / 100);

    // 5. Take-Home Pay
    const takeHomeWeekly = grossWeeklyPay - fuelCostWeekly - operatingExpensesWeekly - taxReserveWeekly;

    // 6. Margin Percentage
    const netMarginPercent = grossWeeklyPay > 0 ? ((takeHomeWeekly / grossWeeklyPay) * 100) : 0;

    // 7. Per Mile Revenue & Cost
    const revenuePerMile = milesDrivenPerWeek > 0 ? (grossWeeklyPay / milesDrivenPerWeek) : 0;
    const costPerMile = milesDrivenPerWeek > 0 ? ((fuelCostWeekly + operatingExpensesWeekly + taxReserveWeekly) / milesDrivenPerWeek) : 0;

    // 8. Verdict Classification
    let verdictTitle = "WALK AWAY";
    let verdictColorClass = "bg-rose-50 border-rose-200 text-rose-800";
    let verdictMarginColor = "text-rose-600";
    let verdictText = "This margin is too thin. One repair bill or slow week puts you in the negative. Negotiate higher pay or pass.";

    if (netMarginPercent >= 40) {
      verdictTitle = "EXCELLENT — LOCK IT IN";
      verdictColorClass = "bg-emerald-50 border-emerald-300 text-emerald-900";
      verdictMarginColor = "text-emerald-600";
      verdictText = "Above 40% margin is rare. Verify the volume is real (ride the route, ask for settlement statements) — if it holds up, this is the tier of route that builds a real business.";
    } else if (netMarginPercent >= 25) {
      verdictTitle = "SOLID CONTRACT";
      verdictColorClass = "bg-sky-50 border-sky-300 text-sky-900";
      verdictMarginColor = "text-sky-600";
      verdictText = "A healthy 25-40% net margin. Provides good income buffer for maintenance and unexpected costs.";
    } else if (netMarginPercent >= 15) {
      verdictTitle = "MARGINAL — NEGOTIATE";
      verdictColorClass = "bg-amber-50 border-amber-300 text-amber-900";
      verdictMarginColor = "text-amber-600";
      verdictText = "15-25% margin is workable but thin. Attempt to negotiate fuel surcharges or stop rates.";
    }

    return {
      grossWeeklyPay: Math.max(0, grossWeeklyPay),
      fuelCostWeekly,
      operatingExpensesWeekly,
      taxReserveWeekly,
      takeHomeWeekly,
      netMarginPercent: netMarginPercent.toFixed(1),
      revenuePerMile: revenuePerMile.toFixed(2),
      costPerMile: costPerMile.toFixed(2),
      verdictTitle,
      verdictColorClass,
      verdictMarginColor,
      verdictText
    };
  }, [
    payMode, payRate, unitsPerWeek, milesDrivenPerWeek, selectedMpgOption, fuelPrice,
    insuranceWeekly, maintenanceWeekly, phoneWeekly, otherWeekly, taxPercent
  ]);

  // Bottom Converter
  const grossPayPerMileCalc = useMemo(() => {
    if (calcMilesTotal <= 0) return "0.00";
    return (calcPayTotal / calcMilesTotal).toFixed(2);
  }, [calcPayTotal, calcMilesTotal]);

  return (
    <section id="calculator-section" className="py-8 sm:py-16 bg-[#FAF9F6] border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Header matching screenshot */}
        <div className="space-y-3">

          {/* Badge Line */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-rose-600 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-sans">
              ROUTE CALCULATOR
            </span>
          </div>

          {/* Headline matching screenshot */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-tight">
            Is this route actually paying?
          </h2>

          {/* Subtitle matching screenshot */}
          <p className="text-slate-600 text-sm max-w-2xl font-normal leading-relaxed font-sans">
            Plug in what the contract pays and your real costs — we'll show you the profit margin and verdict.
          </p>

        </div>

        {/* 2-Column Calculator Grid matching screenshot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Inputs Form */}
          <div className="lg:col-span-7 space-y-6">

            {/* White Form Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">

              {/* 1. HOW IS THIS ROUTE PAID? */}
              <div className="space-y-3">
                <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">
                  HOW IS THIS ROUTE PAID?
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PAYMENT_MODES.map((mode) => {
                    const isSelected = payMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPayMode(mode.id)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${isSelected
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. PAY RATE & UNITS PER WEEK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">
                    PAY RATE ($ PER {payMode === 'per_stop' ? 'STOP' : payMode === 'per_day' ? 'DAY' : payMode === 'per_mile' ? 'MILE' : 'UNIT'})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 text-sm font-bold">$</span>
                    <input
                      type="number"
                      step="0.10"
                      value={payRate}
                      onChange={(e) => setPayRate(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b] focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">
                    STOPS / UNITS PER WEEK
                  </label>
                  <input
                    type="number"
                    value={unitsPerWeek}
                    onChange={(e) => setUnitsPerWeek(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b] focus:ring-2 focus:ring-rose-500"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Total stops across the whole week.</p>
                </div>
              </div>

              {/* 3. Weekly driving & fuel */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-sm font-bold text-[#0b132b] font-sans">
                  Weekly driving & fuel
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      MILES DRIVEN / WEEK
                    </label>
                    <input
                      type="number"
                      value={milesDrivenPerWeek}
                      onChange={(e) => setMilesDrivenPerWeek(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      VEHICLE (MPG)
                    </label>
                    <select
                      value={selectedMpgOption}
                      onChange={(e) => setSelectedMpgOption(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0b132b] appearance-none"
                    >
                      {VEHICLE_MPG_OPTIONS.map((opt) => (
                        <option key={opt.label} value={opt.mpg}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[9px] text-slate-400 leading-tight">
                      Not sure? Pick closest vehicle — drivers are within 1-2 mpg.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      FUEL $/GALLON
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-bold">$</span>
                      <input
                        type="number"
                        step="0.05"
                        value={fuelPrice}
                        onChange={(e) => setFuelPrice(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Weekly fixed costs */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-sm font-bold text-[#0b132b] font-sans">
                  Weekly fixed costs
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      COMMERCIAL INSURANCE
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-bold">$</span>
                      <input
                        type="number"
                        value={insuranceWeekly}
                        onChange={(e) => setInsuranceWeekly(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      MAINTENANCE & TIRES
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-bold">$</span>
                      <input
                        type="number"
                        value={maintenanceWeekly}
                        onChange={(e) => setMaintenanceWeekly(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b]"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400">Set aside weekly, don't wait for a repair bill.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      PHONE / DISPATCH APP
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-bold">$</span>
                      <input
                        type="number"
                        value={phoneWeekly}
                        onChange={(e) => setPhoneWeekly(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      OTHER (TOLLS, PARKING, SUPPLIES)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-bold">$</span>
                      <input
                        type="number"
                        value={otherWeekly}
                        onChange={(e) => setOtherWeekly(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Self employment tax reserve */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-sm font-bold text-[#0b132b] font-sans">
                  Self employment tax reserve
                </h4>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  SET ASIDE % OF PROFIT FOR TAXES
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="w-full pr-8 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b]"
                  />
                  <span className="absolute right-3.5 top-2.5 text-slate-400 text-sm font-bold">%</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  15.3% covers SE tax. Add more (20-30% total) if you don't take other deductions.
                </p>
              </div>

            </div>

            {/* Red Dashed Box: "Don't know your pay-per-mile? Work it out." matching screenshot */}
            <div className="p-6 rounded-3xl border-2 border-dashed border-rose-300 bg-rose-50/20 space-y-4">
              <div>
                <h4 className="text-base font-bold text-[#0b132b] font-serif-heading">
                  Don't know your pay-per-mile? Work it out.
                </h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Enter what the contract pays and the miles you actually drive for it — we'll flip it into a $/mile figure so you can compare routes apples-to-apples.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    TOTAL PAY PER WEEK
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                    <input
                      type="number"
                      value={calcPayTotal}
                      onChange={(e) => setCalcPayTotal(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#0b132b]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    MILES DRIVEN PER WEEK
                  </label>
                  <input
                    type="number"
                    value={calcMilesTotal}
                    onChange={(e) => setCalcMilesTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#0b132b]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    TIME FRAME
                  </label>
                  <select
                    value={calcTimeFrame}
                    onChange={(e) => setCalcTimeFrame(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#0b132b]"
                  >
                    <option value="Per week">Per week</option>
                    <option value="Per day">Per day</option>
                    <option value="Per month">Per month</option>
                  </select>
                </div>
              </div>

              {/* Big Result Display Banner */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  YOU'RE GETTING PAID{' '}
                  <span className="text-2xl font-extrabold text-[#0b132b]">
                    ${grossPayPerMileCalc}
                  </span>{' '}
                  per mile (gross, before expenses)
                </span>
              </div>

              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Rough benchmarks for solo drivers: <strong className="text-rose-600">under $1.00/mi</strong> loses money after fuel and maintenance, <strong className="text-amber-600">$1.00–$1.50/mi</strong> is thin but workable, and <strong className="text-emerald-600">$1.50+/mi</strong> is where routes actually build a business.
              </p>
            </div>

          </div>

          {/* Right Column: Output Cards & Verdict */}
          <div className="lg:col-span-5 space-y-6">

            {/* 1. Top Verdict Banner (Green Box in screenshot) */}
            <div className={`p-6 rounded-3xl border ${metrics.verdictColorClass} shadow-xs space-y-3`}>
              <div className="text-xs font-extrabold uppercase tracking-widest">
                {metrics.verdictTitle}
              </div>
              <div className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${metrics.verdictMarginColor}`}>
                {metrics.netMarginPercent}% <span className="text-lg font-bold">margin</span>
              </div>
              <p className="text-xs leading-relaxed font-medium">
                {metrics.verdictText}
              </p>
            </div>

            {/* 2. Middle Financial Breakdown Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-bold text-slate-700">Gross weekly pay</span>
                <span className="font-extrabold text-[#0b132b]">${metrics.grossWeeklyPay.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
                <span>− Fuel</span>
                <span className="font-bold">−${metrics.fuelCostWeekly.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
                <span>− Insurance, maintenance, phone, other</span>
                <span className="font-bold">−${metrics.operatingExpensesWeekly.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
                <span>− Tax reserve</span>
                <span className="font-bold">−${metrics.taxReserveWeekly.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-3 font-extrabold text-sm border-b border-slate-200 text-[#0b132b]">
                <span>Take-home / week</span>
                <span className="text-emerald-600 text-base">${metrics.takeHomeWeekly.toFixed(2)}</span>
              </div>

              <div className="pt-2 flex justify-between text-slate-500 font-semibold">
                <span>Revenue per mile</span>
                <span className="font-bold text-slate-800">${metrics.revenuePerMile}</span>
              </div>

              <div className="flex justify-between text-slate-500 font-semibold">
                <span>Cost per mile</span>
                <span className="font-bold text-slate-800">${metrics.costPerMile}</span>
              </div>
            </div>

            {/* 3. Target Margin Reference Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-[#0b132b] font-serif-heading">
                Target margin
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Walk away</span>
                  <span className="font-extrabold text-rose-600">Below 15%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Marginal — negotiate</span>
                  <span className="font-extrabold text-amber-600">15% – 25%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Solid contract</span>
                  <span className="font-extrabold text-sky-600">25% – 40%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Excellent — lock it in</span>
                  <span className="font-extrabold text-emerald-600">40%+</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 font-medium leading-relaxed pt-2 border-t border-slate-100">
                Rule of thumb: hold every route to 20%+ net margin. Anything less and one bad week — a blown tire, a fuel spike — wipes out the month.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
