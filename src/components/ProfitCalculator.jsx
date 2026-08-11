import React, { useState, useMemo } from 'react';

const PAY_UNITS = [
  { id: 'week', label: 'Per week (flat)', volumeLabel: 'Weeks', volumeHint: 'Flat weekly contract — volume is 1 week.', defaultVolume: 1, defaultRate: 1200 },
  { id: 'day', label: 'Per day', volumeLabel: 'Days per week', volumeHint: "How many days per week you'll run this route.", defaultVolume: 5, defaultRate: 220 },
  { id: 'stop', label: 'Per stop', volumeLabel: 'Stops per week', volumeHint: 'Total stops across the whole week.', defaultVolume: 400, defaultRate: 3 },
  { id: 'load', label: 'Per load / run', volumeLabel: 'Loads per week', volumeHint: "How many complete loads you'll run in a week.", defaultVolume: 10, defaultRate: 120 },
  { id: 'package', label: 'Per package', volumeLabel: 'Packages per week', volumeHint: 'Total packages delivered in the week.', defaultVolume: 800, defaultRate: 1.5 },
  { id: 'mile', label: 'Per mile', volumeLabel: 'Paid miles per week', volumeHint: 'Only miles the contract pays for — not deadhead.', defaultVolume: 1200, defaultRate: 1.1 },
  { id: 'hour', label: 'Per hour', volumeLabel: 'Hours per week', volumeHint: 'Total on-clock hours in a typical week.', defaultVolume: 45, defaultRate: 22 },
];

const VEHICLE_MPG_GROUPS = [
  {
    group: "Cars & small SUVs",
    items: [
      { label: "Toyota Prius", mpg: 52 },
      { label: "Toyota Corolla / Camry", mpg: 32 },
      { label: "Honda Civic / Accord", mpg: 32 },
      { label: "Hyundai Elantra / Kia Forte", mpg: 33 },
      { label: "Toyota RAV4 / Honda CR-V", mpg: 28 },
      { label: "Ford Escape / Chevy Equinox", mpg: 26 },
    ],
  },
  {
    group: "Minivans & large SUVs",
    items: [
      { label: "Toyota Sienna / Honda Odyssey", mpg: 22 },
      { label: "Chrysler Pacifica / Dodge Caravan", mpg: 20 },
      { label: "Ford Explorer / Chevy Tahoe", mpg: 17 },
      { label: "Ford Expedition / Chevy Suburban", mpg: 15 },
    ],
  },
  {
    group: "Cargo vans",
    items: [
      { label: "Ford Transit Connect (small)", mpg: 24 },
      { label: "Ram ProMaster City / Nissan NV200", mpg: 22 },
      { label: "Ford Transit (gas, mid roof)", mpg: 16 },
      { label: "Mercedes Sprinter (diesel)", mpg: 18 },
      { label: "Ram ProMaster (gas)", mpg: 15 },
      { label: "Chevy Express / GMC Savana", mpg: 14 },
    ],
  },
  {
    group: "Pickups & box trucks",
    items: [
      { label: "Ford F-150 / Chevy Silverado 1500", mpg: 20 },
      { label: "Ford F-250 / Ram 2500 (diesel)", mpg: 15 },
      { label: "Isuzu NPR / 16 ft box truck", mpg: 12 },
      { label: "26 ft box truck", mpg: 9 },
    ],
  },
];

function num(v, fallback = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
}

export default function ProfitCalculator() {
  const [unit, setUnit] = useState('stop');
  const [ratePeriod, setRatePeriod] = useState('week'); // 'day' | 'week'
  const [milesUnit, setMilesUnit] = useState('week'); // 'day' | 'week'
  const cfg = PAY_UNITS.find((u) => u.id === unit) || PAY_UNITS[2];

  const [rate, setRate] = useState('');
  const [volume, setVolume] = useState('');
  const [totalMiles, setTotalMiles] = useState('');
  const [mpg, setMpg] = useState('');
  const [fuelPrice, setFuelPrice] = useState('');

  const [insurance, setInsurance] = useState('');
  const [maintenance, setMaintenance] = useState('');
  const [phone, setPhone] = useState('');
  const [otherExpenses, setOtherExpenses] = useState('');

  const [taxRate, setTaxRate] = useState('');

  // Bottom Helper State
  const [helperPay, setHelperPay] = useState('');
  const [helperMiles, setHelperMiles] = useState('');
  const [helperPeriod, setHelperPeriod] = useState('week');

  const allVehicleItems = useMemo(() => VEHICLE_MPG_GROUPS.flatMap((g) => g.items), []);
  const matchedVehicle = allVehicleItems.find((v) => String(v.mpg) === mpg);
  const [selectedVehiclePick, setSelectedVehiclePick] = useState(matchedVehicle ? matchedVehicle.label : '');

  function pickUnit(id) {
    const next = PAY_UNITS.find((u) => u.id === id);
    setUnit(id);
    if (next) {
      setRate(String(next.defaultRate));
      setVolume(String(next.defaultVolume));
    }
  }

  const dynamicVolumeLabel = useMemo(() => {
    if (ratePeriod === 'day') {
      switch (unit) {
        case 'hour': return 'Hours per day';
        case 'stop': return 'Stops per day';
        case 'load': return 'Loads per day';
        case 'package': return 'Packages per day';
        case 'mile': return 'Paid miles per day';
        case 'day': return 'Days per week';
        case 'week': return 'Weeks';
        default: return cfg.volumeLabel;
      }
    }
    return cfg.volumeLabel;
  }, [cfg, unit, ratePeriod]);

  const calc = useMemo(() => {
    const r = num(rate);
    const v = num(volume);

    // Default working days per week (clamped 1 to 7 days)
    const workDays = unit === 'day' ? Math.min(Math.max(num(v, 5), 1), 7) : 7;

    // 1. CONTRACT DURATION IN WEEKS
    const numWeeks = unit === 'week' ? Math.max(v, 1) : 1;

    // 2. WEEKLY BASE GROSS REVENUE
    let singleWeekGross = 0;
    if (unit === 'week') {
      const weeklyRate = ratePeriod === 'day' ? r * 7 : r;
      singleWeekGross = weeklyRate;
    } else if (unit === 'day') {
      singleWeekGross = ratePeriod === 'day' ? r * v : (r / 7) * v;
    } else {
      singleWeekGross = ratePeriod === 'day' ? r * v * 7 : r * v;
    }

    // 3. WEEKLY MILES & FUEL COST (per single week)
    const rawMiles = num(totalMiles);
    const singleWeekMiles = milesUnit === 'day' ? rawMiles * workDays : rawMiles;
    const mpgN = Math.max(num(mpg), 1);
    const singleWeekFuel = (singleWeekMiles / mpgN) * num(fuelPrice);

    // 4. FIXED OPERATING COSTS (per single week)
    const singleWeekFixed = num(insurance) + num(maintenance) + num(phone) + num(otherExpenses);

    // 5. TOTAL CONTRACT VALUES (scaled by numWeeks)
    const contractGross = singleWeekGross * numWeeks;
    const contractFuel = singleWeekFuel * numWeeks;
    const contractFixed = singleWeekFixed * numWeeks;

    // 6. PRE-TAX PROFIT & TAX RESERVE
    const contractPreTax = contractGross - contractFuel - contractFixed;
    const taxPct = num(taxRate) / 100;
    const contractTax = Math.max(contractPreTax, 0) * taxPct;
    const contractNet = contractPreTax - contractTax;

    // 7. AVERAGED PERIOD VALUES
    const weekGross = singleWeekGross;
    const weekNet = contractNet / numWeeks;
    const dayNet = weekNet / workDays;
    const monthNet = weekNet * 4.33;

    // 8. NET PROFIT MARGIN
    const margin = contractGross > 0 ? (contractNet / contractGross) * 100 : 0;

    // 9. PER-MILE METRICS
    const totalContractMiles = singleWeekMiles * numWeeks;
    const revPerMile = totalContractMiles > 0 ? contractGross / totalContractMiles : 0;
    const totalContractCost = contractFuel + contractFixed + contractTax;
    const costPerMile = totalContractMiles > 0 ? totalContractCost / totalContractMiles : 0;

    const periodText = unit === 'week' && numWeeks > 1 ? `${numWeeks} weeks` : 'week';

    return {
      gross: contractGross,
      fuel: contractFuel,
      fixed: contractFixed,
      taxReserve: contractTax,
      net: contractNet,
      margin,
      revPerMile,
      costPerMile,
      dailyNet: dayNet,
      weeklyNet: weekNet,
      monthlyNet: monthNet,
      periodLabel: periodText,
    };
  }, [
    rate,
    volume,
    totalMiles,
    milesUnit,
    ratePeriod,
    mpg,
    fuelPrice,
    insurance,
    maintenance,
    phone,
    otherExpenses,
    taxRate,
    unit,
  ]);

  const verdict = useMemo(() => {
    if (calc.net <= 0 || calc.margin < 15) {
      return {
        label: "BAD LOAD — WALK AWAY",
        tone: "text-rose-700",
        bg: "bg-rose-50",
        border: "border-rose-300",
        reason:
          "After fuel, insurance, and tax reserve, there's almost nothing (or nothing) left. One flat tire or fuel spike puts you underwater. Negotiate the rate up or pass.",
      };
    }
    if (calc.margin < 25) {
      return {
        label: "MARGINAL — NEGOTIATE",
        tone: "text-amber-800",
        bg: "bg-amber-50",
        border: "border-amber-300",
        reason:
          "You'll cover costs and take something home, but there's no cushion for repairs, downtime, or a slow week. Ask for a higher rate, fewer deadhead miles, or a fuel surcharge before signing.",
      };
    }
    if (calc.margin < 40) {
      return {
        label: "SOLID CONTRACT",
        tone: "text-sky-900",
        bg: "bg-sky-50",
        border: "border-sky-300",
        reason:
          "You're above the 25% threshold. Enough cushion to absorb a bad week and still be profitable. Worth signing if the schedule and territory work for you.",
      };
    }
    return {
      label: "EXCELLENT — LOCK IT IN",
      tone: "text-emerald-900",
      bg: "bg-emerald-50",
      border: "border-emerald-400",
      reason:
        "Above 40% margin is rare. Verify the volume is real (ride the route, ask for settlement statements) — if it holds up, this is the tier of route that builds a real business.",
    };
  }, [calc.margin, calc.net]);

  // Per Mile Helper Calc
  const helperCalc = useMemo(() => {
    const m = num(helperMiles);
    const p = num(helperPay);
    const perMile = m > 0 ? p / m : 0;
    const isGood = perMile >= 1.5;
    const isOk = perMile >= 1.0 && perMile < 1.5;
    return { perMile, isGood, isOk };
  }, [helperPay, helperMiles]);

  return (
    <section id="calculator-section" className="py-8 sm:py-16 bg-[#FAF9F6] border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Header Block */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-rose-600 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-sans">
              ROUTE CALCULATOR
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-tight">
            Is this route actually paying?
          </h2>

          <p className="text-slate-600 text-sm max-w-2xl font-normal leading-relaxed font-sans">
            Plug in what the contract offers and your real costs. We'll show you the profit margin, the good/bad verdict, and the target margin to hold this route to.
          </p>
        </div>

        {/* 2-Column Calculator Grid */}
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
                  {PAY_UNITS.map((u) => {
                    const isSelected = unit === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => pickUnit(u.id)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${isSelected
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        {u.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. PAY RATE & DYNAMIC VOLUME */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">
                      PAY RATE ($ PER {['week', 'day'].includes(unit) ? ratePeriod.toUpperCase() : unit.toUpperCase()})
                    </label>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[9px] font-bold">
                      <button
                        type="button"
                        onClick={() => setRatePeriod('day')}
                        className={`px-1.5 py-0.5 rounded-md transition-all ${ratePeriod === 'day' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Day
                      </button>
                      <button
                        type="button"
                        onClick={() => setRatePeriod('week')}
                        className={`px-1.5 py-0.5 rounded-md transition-all ${ratePeriod === 'week' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Week
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 text-sm font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={rate}
                      onChange={(e) => setRate(e.target.value.replace(/-/g, ''))}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b] focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">
                    {dynamicVolumeLabel}
                  </label>
                  {unit === 'day' ? (
                    <select
                      value={Math.min(Math.max(parseInt(volume, 10) || 5, 1), 7)}
                      onChange={(e) => setVolume(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b] focus:ring-2 focus:ring-rose-500 cursor-pointer"
                    >
                      <option value="1">1 day per week</option>
                      <option value="2">2 days per week</option>
                      <option value="3">3 days per week</option>
                      <option value="4">4 days per week</option>
                      <option value="5">5 days per week</option>
                      <option value="6">6 days per week</option>
                      <option value="7">7 days per week</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={volume}
                      onChange={(e) => setVolume(e.target.value.replace(/-/g, ''))}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b] focus:ring-2 focus:ring-rose-500"
                    />
                  )}
                  <p className="text-[10px] text-slate-400 font-medium">{cfg.volumeHint}</p>
                </div>
              </div>

              {/* 3. DRIVING & FUEL */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-sm font-bold text-[#0b132b] font-sans">
                  Driving & fuel
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        MILES DRIVEN / {milesUnit.toUpperCase()}
                      </label>
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[9px] font-bold">
                        <button
                          type="button"
                          onClick={() => setMilesUnit('day')}
                          className={`px-1.5 py-0.5 rounded-md transition-all ${milesUnit === 'day' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Day
                        </button>
                        <button
                          type="button"
                          onClick={() => setMilesUnit('week')}
                          className={`px-1.5 py-0.5 rounded-md transition-all ${milesUnit === 'week' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          Week
                        </button>
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={totalMiles}
                      onChange={(e) => setTotalMiles(e.target.value.replace(/-/g, ''))}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      VEHICLE (MPG)
                    </label>
                    <select
                      value={selectedVehiclePick}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedVehiclePick(val);
                        if (val === 'custom' || !val) {
                          setMpg('');
                        } else {
                          const found = allVehicleItems.find((f) => f.label === val);
                          if (found) {
                            setMpg(String(found.mpg));
                          }
                        }
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0b132b] appearance-none cursor-pointer"
                    >
                      <option value="">Select Vehicle</option>
                      {VEHICLE_MPG_GROUPS.map((g) => (
                        <optgroup key={g.group} label={g.group}>
                          {g.items.map((it) => (
                            <option key={it.label} value={it.label}>
                              {it.label} — {it.mpg} mpg
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="custom">Custom / Other</option>
                    </select>

                    {selectedVehiclePick === 'custom' && (
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={mpg}
                        onChange={(e) => setMpg(e.target.value.replace(/-/g, ''))}
                        onWheel={(e) => e.target.blur()}
                        placeholder="Enter MPG"
                        className="mt-1.5 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0b132b]"
                      />
                    )}
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
                        min="0"
                        step="0.01"
                        value={fuelPrice}
                        onChange={(e) => setFuelPrice(e.target.value.replace(/-/g, ''))}
                        onWheel={(e) => e.target.blur()}
                        placeholder="0.00"
                        className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. FIXED COSTS */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-sm font-bold text-[#0b132b] font-sans">
                  Fixed operating costs
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
                        min="0"
                        step="5"
                        value={insurance}
                        onChange={(e) => setInsurance(e.target.value.replace(/-/g, ''))}
                        onWheel={(e) => e.target.blur()}
                        placeholder="0.00"
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
                        min="0"
                        step="5"
                        value={maintenance}
                        onChange={(e) => setMaintenance(e.target.value.replace(/-/g, ''))}
                        onWheel={(e) => e.target.blur()}
                        placeholder="0.00"
                        className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b]"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400">Set aside regular funds, don't wait for a repair bill.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      PHONE / DISPATCH APP
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/-/g, ''))}
                        onWheel={(e) => e.target.blur()}
                        placeholder="0.00"
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
                        min="0"
                        step="5"
                        value={otherExpenses}
                        onChange={(e) => setOtherExpenses(e.target.value.replace(/-/g, ''))}
                        onWheel={(e) => e.target.blur()}
                        placeholder="0.00"
                        className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. SELF-EMPLOYMENT TAX RESERVE */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-sm font-bold text-[#0b132b] font-sans">
                  Self-employment tax reserve
                </h4>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  SET ASIDE % OF PROFIT FOR TAXES
                </label>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value.replace(/-/g, ''))}
                    onWheel={(e) => e.target.blur()}
                    placeholder="0"
                    className="w-full pr-8 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0b132b]"
                  />
                  <span className="absolute right-3.5 top-2.5 text-slate-400 text-sm font-bold">%</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  15.3% covers SE tax. Add more (25–30% total) if you don't take other deductions.
                </p>
              </div>

              {/* Red Dashed Box: "Don't know your pay-per-mile? Work it out." */}
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
                      TOTAL PAY PER {helperPeriod.toUpperCase()}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={helperPay}
                        onChange={(e) => setHelperPay(e.target.value.replace(/-/g, ''))}
                        onWheel={(e) => e.target.blur()}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#0b132b]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      MILES DRIVEN PER {helperPeriod.toUpperCase()}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={helperMiles}
                      onChange={(e) => setHelperMiles(e.target.value.replace(/-/g, ''))}
                      onWheel={(e) => e.target.blur()}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#0b132b]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      TIME FRAME
                    </label>
                    <select
                      value={helperPeriod}
                      onChange={(e) => setHelperPeriod(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#0b132b] cursor-pointer"
                    >
                      <option value="week">Per week</option>
                      <option value="day">Per day</option>
                      <option value="load">Per load</option>
                      <option value="trip">Per trip</option>
                    </select>
                  </div>
                </div>

                {/* Big Result Display Banner */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    YOU'RE GETTING PAID{' '}
                    <span className={`text-2xl font-extrabold ${helperCalc.isGood ? 'text-emerald-600' : helperCalc.isOk ? 'text-[#0b132b]' : 'text-rose-600'}`}>
                      ${helperCalc.perMile.toFixed(2)}
                    </span>{' '}
                    per mile (gross, before expenses)
                  </span>
                </div>

                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Rough benchmarks for solo drivers: <strong className="text-rose-600">under $1.00/mi</strong> loses money after fuel and maintenance, <strong className="text-amber-700">$1.00–$1.50/mi</strong> is thin but workable, and <strong className="text-emerald-600">$1.50+/mi</strong> is where routes actually build a business.
                </p>
              </div>

            </div>

          </div>

          {/* Right Column: Output Cards & Verdict */}
          <div className="lg:col-span-5 space-y-6">

            {/* 1. Top Verdict Banner */}
            <div className={`p-6 rounded-3xl border ${verdict.border} ${verdict.bg} shadow-xs space-y-3`}>
              <div className={`text-xs font-extrabold uppercase tracking-widest ${verdict.tone}`}>
                {verdict.label}
              </div>
              <div className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${verdict.tone}`}>
                {calc.margin.toFixed(1)}% <span className="text-lg font-bold">margin</span>
              </div>
              <p className="text-xs leading-relaxed font-medium text-slate-700">
                {verdict.reason}
              </p>
            </div>

            {/* 2. Middle Financial Breakdown Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="font-bold text-slate-700">Gross revenue ({calc.periodLabel})</span>
                <span className="font-extrabold text-[#0b132b]">${calc.gross.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
                <span>− Fuel costs</span>
                <span className="font-bold">−${calc.fuel.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
                <span>− Fixed operating costs</span>
                <span className="font-bold">−${calc.fixed.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 text-rose-600">
                <span>− Tax reserve</span>
                <span className="font-bold">−${calc.taxReserve.toFixed(2)}</span>
              </div>

              <div className="flex justify-between py-3 font-extrabold text-sm border-b border-slate-200 text-[#0b132b]">
                <span>Estimated Take-Home Profit</span>
                <span className={`text-base font-extrabold ${calc.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ${calc.net.toFixed(2)} / {calc.periodLabel}
                </span>
              </div>

              {/* Equivalence Summary Badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Per Day</span>
                  <span className="font-extrabold text-slate-900">${calc.dailyNet.toFixed(2)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Per Week</span>
                  <span className="font-extrabold text-slate-900">${calc.weeklyNet.toFixed(2)}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Per Month</span>
                  <span className="font-extrabold text-slate-900">${calc.monthlyNet.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between text-slate-500 font-semibold">
                <span>Revenue per mile</span>
                <span className="font-bold text-slate-800">${calc.revPerMile.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-500 font-semibold">
                <span>Cost per mile</span>
                <span className="font-bold text-slate-800">${calc.costPerMile.toFixed(2)}</span>
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
                  <span className="font-extrabold text-amber-700">15% – 25%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Solid contract</span>
                  <span className="font-extrabold text-sky-700">25% – 40%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Excellent — lock it in</span>
                  <span className="font-extrabold text-emerald-600">40%+</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 font-medium leading-relaxed pt-2 border-t border-slate-100">
                Rule of thumb: hold every route to <span className="font-bold text-[#0b132b]">30%+ net margin</span>. Anything less and one bad week — a blown tire, a fuel spike — wipes out the month.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
