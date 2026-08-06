import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { saveUserChecklistToDb, loadUserChecklistFromDb } from '../lib/supabase';

const READINESS_CHECKLIST = [
  "Valid driver's license with clean motor vehicle record",
  "Reliable vehicle matching the route class you're targeting",
  "Current vehicle registration and insurance",
  "Commercial auto or courier/cargo insurance policy",
  "Business entity (sole proprietorship or LLC) with an EIN",
  "Clean background check",
  "Smartphone with GPS and delivery/dispatch app"
];

const VEHICLE_QUALIFICATIONS = [
  {
    classTitle: "Car / Sedan",
    description: "Small parcel, auto parts, medical specimens",
    payRate: "$120–180 / day",
    icon: "🚗"
  },
  {
    classTitle: "Minivan / SUV",
    description: "Small package routes, on-demand gigs",
    payRate: "$150–250 / day",
    icon: "🚙"
  },
  {
    classTitle: "Cargo Van",
    description: "DSP-style routes, e-commerce parcels",
    payRate: "$800–1,300 / week",
    icon: "🚐"
  },
  {
    classTitle: "Sprinter / High-Top",
    description: "Higher-volume, multi-stop contracts",
    payRate: "$900–1,600 / week",
    icon: "🚛"
  },
  {
    classTitle: "Box Truck (16–26 ft)",
    description: "Master contractor routes, freight & retail",
    payRate: "$1,200–2,200+ / week",
    icon: "📦"
  }
];

export default function ContractReadinessSection({ currentUser }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('checklist');
  const [checkedItems, setCheckedItems] = useState({});

  // 1. Load checked items from Supabase database when user is logged in
  useEffect(() => {
    async function fetchChecklist() {
      if (currentUser?.id) {
        const savedMap = await loadUserChecklistFromDb(currentUser.id, 'readiness_checklist');
        setCheckedItems(savedMap || {});
      } else {
        setCheckedItems({});
      }
    }
    fetchChecklist();
  }, [currentUser]);

  // 2. Handle Checkbox Click with Login Validation & Database Persistence
  const toggleCheck = (idx) => {
    // Validation: If user is not logged in / registered, redirect to login page
    if (!currentUser) {
      navigate('/login?redirect=/#readiness-section');
      return;
    }

    const updatedMap = {
      ...checkedItems,
      [idx]: !checkedItems[idx]
    };

    setCheckedItems(updatedMap);
    // Save directly to Supabase PostgreSQL database (NO localstorage)
    saveUserChecklistToDb(currentUser.id, 'readiness_checklist', updatedMap);
  };

  const readyCount = Object.values(checkedItems).filter(Boolean).length;
  const isFullyReady = readyCount === READINESS_CHECKLIST.length;

  return (
    <section id="readiness-section" className="py-10 sm:py-14 bg-[#FAF9F6] border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-rose-600 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-sans">
              GET STARTED
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-tight">
            Are you ready to drive?
          </h2>

          <p className="text-slate-600 text-sm font-normal leading-relaxed font-sans">
            Check your requirements and see what your vehicle qualifies for.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'checklist'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Requirements Checklist
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'vehicles'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
          >
            <Truck className="w-4 h-4" />
            Vehicle Pay Rates
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'checklist' ? (
          /* Checklist Tab */
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">

            {/* Counter */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="text-sm font-bold text-rose-600 flex items-center gap-2">
                <span className="text-base font-extrabold">{readyCount} / {READINESS_CHECKLIST.length} ready</span>
                {isFullyReady && (
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    100% Ready!
                  </span>
                )}
              </div>

              {readyCount > 0 && !isFullyReady && (
                <span className="text-xs font-semibold text-slate-400">
                  {READINESS_CHECKLIST.length - readyCount} remaining
                </span>
              )}
            </div>

            {/* Checkbox List */}
            <div className="space-y-3 pt-1">
              {READINESS_CHECKLIST.map((itemText, idx) => {
                const isChecked = !!checkedItems[idx];
                return (
                  <label
                    key={idx}
                    onClick={() => toggleCheck(idx)}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${isChecked
                      ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-2xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-700'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => { }}
                      className="mt-0.5 w-4 h-4 accent-rose-600 rounded cursor-pointer shrink-0"
                    />
                    <span className="text-sm font-medium leading-relaxed select-none">
                      {itemText}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Footer */}
            {isFullyReady ? (
              <div className="p-4 rounded-2xl bg-emerald-900 text-white flex items-center justify-between text-xs sm:text-sm font-bold mt-4 shadow-md">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  You meet all carrier onboarding requirements!
                </span>
                <a
                  href="#map-section"
                  className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold transition-all"
                >
                  Apply Now →
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium pt-2 text-center">
                Complete all 7 requirements to qualify for immediate daily settlements.
              </p>
            )}
          </div>
        ) : (
          /* Vehicle Pay Rates Tab */
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {VEHICLE_QUALIFICATIONS.map((item, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-[#0b132b] font-serif-heading">
                      {item.classTitle}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium font-sans">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="text-base sm:text-lg font-extrabold text-rose-600 font-sans shrink-0">
                  {item.payRate}
                </div>
              </div>
            ))}
            <div className="px-6 py-4 bg-slate-50 text-[10px] text-slate-400 font-medium">
              Typical ranges seen on contract boards — run your own numbers in the calculator above.
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
