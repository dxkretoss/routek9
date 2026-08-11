import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { saveUserChecklistToDb, loadUserChecklistFromDb } from '../lib/supabase';

const ALL_STATES_ORDERED = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' }
];

const ROUTE_MARKETPLACES = [
  {
    name: "BizBuySell",
    description: "The largest general marketplace — hundreds of FedEx P&D and linehaul route listings nationwide.",
    url: "https://www.bizbuysell.com/fedex-routes-for-sale/"
  },
  {
    name: "LoopNet",
    description: "Commercial listing site with an active FedEx and delivery route category.",
    url: "https://www.loopnet.com/"
  },
  {
    name: "BizQuest",
    description: "Business-for-sale marketplace with a dedicated FedEx route section.",
    url: "https://www.bizquest.com/"
  },
  {
    name: "KR Capital / DeliveryRoutesForSale",
    description: "Route brokerage — over $500M in FedEx route sales, buyer & seller resources.",
    url: "https://krcapital600.com/"
  },
  {
    name: "Capital Route Sales",
    description: "Boutique broker working small groups of buyers and sellers directly.",
    url: "https://capitalroutesales.com/"
  },
  {
    name: "Route Brokers, Inc.",
    description: "35+ years brokering delivery & distribution routes of many kinds.",
    url: "https://routebrokers.com/"
  },
  {
    name: "Total Business Brokers",
    description: "Specializes exclusively in FedEx P&D and linehaul route sales.",
    url: "https://totalbusinessbrokers.com/"
  },
  {
    name: "Route Consultant",
    description: "Route brokerage and advisory — FedEx, Amazon, and bread routes for sale with valuations.",
    url: "https://routeconsultant.com/"
  },
  {
    name: "Route For Sale",
    description: "Multi-brand route marketplace — Amazon, FedEx, bread, and independent courier routes.",
    url: "https://routeforsale.com/"
  },
  {
    name: "BuildAGroundRoute (FedEx)",
    description: "FedEx's own listing tool for new and resale Ground contractor opportunities.",
    url: "https://www.buildagroundroute.com/"
  }
];

const DUE_DILIGENCE_CHECKLIST = [
  "12+ months of verified settlement statements or P&L — not just the seller's summary",
  "Ride the route(s) yourself before closing to see real stop counts and road conditions",
  "Vehicle age, mileage, and maintenance records for every truck included in the sale",
  "Written confirmation the contract (ISP, CDS, franchise, etc.) is transferable and pre-approved for you as the buyer",
  "An independent valuation — don't rely solely on the seller's or broker's asking price",
  "Check for open compliance violations, safety score issues, or termination notices tied to the territory",
  "Clear financing terms — SBA loan eligibility, seller financing, and what's included vs. excluded",
  "A broker or attorney experienced specifically in this route type, not general business sales"
];

export default function OwnEstablishedRouteSection({ selectedState: propState, onSelectState, currentUser }) {
  const navigate = useNavigate();
  const [checkedItems, setCheckedItems] = useState({});
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const saveTimeoutRef = useRef(null);

  const selectedState = propState;

  const hasLoadedRef = useRef(false);

  // 1. Load checked items from Supabase database with Local Buffer Fallback for instant 0ms render
  useEffect(() => {
    async function fetchChecklist() {
      if (currentUser?.id) {
        if (!hasLoadedRef.current) {
          setLoadingChecklist(true);
        }
        const bufferKey = `rk9_buffer_${currentUser.id}_diligence_checklist`;

        // Instant local buffer sync
        try {
          const cached = localStorage.getItem(bufferKey);
          if (cached && !hasLoadedRef.current) {
            setCheckedItems(JSON.parse(cached));
          }
        } catch { }

        // Async fetch from Supabase
        const savedMap = await loadUserChecklistFromDb(currentUser.id, 'diligence_checklist');
        if (savedMap && Object.keys(savedMap).length > 0) {
          setCheckedItems(savedMap);
          try {
            localStorage.setItem(bufferKey, JSON.stringify(savedMap));
          } catch { }
        }
        hasLoadedRef.current = true;
        setLoadingChecklist(false);
      } else {
        setCheckedItems({});
        setLoadingChecklist(false);
      }
    }
    fetchChecklist();
  }, [currentUser?.id]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // 2. Handle Checkbox Click with Login Validation, Instant Local Buffer & Debounced Database Persistence
  const toggleCheck = (idx) => {
    // Validation: If user is not logged in / registered, redirect to login page
    if (!currentUser) {
      navigate('/login?redirect=/#buy-a-route-section');
      return;
    }

    setSaveStatus('saving');

    setCheckedItems((prev) => {
      const updatedMap = {
        ...prev,
        [idx]: !prev[idx]
      };

      // Save instant local buffer
      const bufferKey = `rk9_buffer_${currentUser.id}_diligence_checklist`;
      try {
        localStorage.setItem(bufferKey, JSON.stringify(updatedMap));
      } catch { }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        const res = await saveUserChecklistToDb(currentUser.id, 'diligence_checklist', updatedMap);
        if (res.success) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2200);
        } else {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      }, 300);

      return updatedMap;
    });
  };

  const verifiedCount = Object.values(checkedItems).filter(Boolean).length;

  const handleStateClick = (st) => {
    if (onSelectState) {
      if (selectedState && selectedState.code === st.code) {
        onSelectState(null);
      } else {
        onSelectState(st);
      }
    }
  };

  const getSearchUrlForState = () => {
    if (!selectedState) return '#';
    return `https://www.google.com/search?q=${encodeURIComponent(`FedEx delivery routes for sale in ${selectedState.name}`)}`;
  };

  return (
    <section id="buy-a-route-section" className="py-8 sm:py-16 bg-[#FAF9F6] border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* Section Header matching screenshot */}
        <div className="space-y-3">

          {/* Badge Line */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-rose-600 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-sans">
              BUY A ROUTE
            </span>
          </div>

          {/* Headline matching screenshot */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-tight">
            Own an established route — all 50+ states
          </h2>

          {/* Subtitle matching screenshot */}
          <p className="text-slate-600 text-sm max-w-2xl font-normal leading-relaxed font-sans">
            Purchase an existing contract business — trucks, territory, and drivers already in place. Pick a state to search.
          </p>

        </div>

        {/* 1. TAP A STATE Card Container matching screenshot 1 & 2 */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">

          <div className="space-y-3">
            <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">
              TAP A STATE
            </label>

            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-2">
              {ALL_STATES_ORDERED.map((st) => {
                const isSelected = selectedState?.code === st.code;
                return (
                  <button
                    key={st.code}
                    onClick={() => handleStateClick(st)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-all duration-150 cursor-pointer text-center ${isSelected
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20 scale-105'
                      : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                  >
                    {st.code}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Row below state grid */}
          {!selectedState ? (
            <p className="text-xs italic text-slate-500 pt-2 font-sans">
              Select a state above to generate your search links.
            </p>
          ) : (
            <div className="pt-2">
              <a
                href={getSearchUrlForState()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                <span>Search routes for sale in {selectedState.name}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

        </div>

        {/* 2. Route Marketplaces & Brokers Sub-Section matching screenshot */}
        <div className="space-y-6 pt-6">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading">
            Route marketplaces & brokers
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROUTE_MARKETPLACES.map((mp) => (
              <a
                key={mp.name}
                href={mp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-[#0b132b] group-hover:text-rose-600 transition-colors font-serif-heading">
                      {mp.name}
                    </h4>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition-colors shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    {mp.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* 3. Due Diligence Checklist Card matching screenshot */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">

          {/* Title & Counter */}
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading">
              Due diligence, before you buy
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Check off what you've verified before signing anything.
            </p>

            <div className="pt-2 text-xs font-bold text-rose-600 flex items-center gap-2">
              <span>{verifiedCount} / {DUE_DILIGENCE_CHECKLIST.length} verified</span>
              {verifiedCount === DUE_DILIGENCE_CHECKLIST.length && (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Fully Verified!
                </span>
              )}
              {saveStatus === 'saving' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-rose-600" />
                  <span>Saving...</span>
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Saved</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
                  <span>Buffered locally</span>
                </span>
              )}
            </div>
          </div>

          {/* Skeleton Buffer while loading initial checklist state */}
          {loadingChecklist ? (
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200/60 bg-slate-50/60 animate-pulse">
                  <div className="w-4 h-4 bg-slate-200 rounded shrink-0" />
                  <div className="h-4 bg-slate-200 rounded w-5/6" />
                </div>
              ))}
            </div>
          ) : (
            /* Interactive Checkbox List */
            <div className="space-y-3 pt-2">
              {DUE_DILIGENCE_CHECKLIST.map((itemText, idx) => {
                const isChecked = !!checkedItems[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleCheck(idx)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${isChecked
                      ? 'bg-emerald-50/60 border-emerald-300 text-slate-900 shadow-2xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-700'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      tabIndex={-1}
                      className="mt-0.5 w-4 h-4 accent-rose-600 rounded cursor-pointer shrink-0 pointer-events-none"
                    />
                    <span className="text-xs sm:text-sm font-medium leading-relaxed">
                      {itemText}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
