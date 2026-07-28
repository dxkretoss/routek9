import React, { useState, useMemo, useEffect } from 'react';
import USMap from './USMap';
import {
  ArrowRight,
  X,
  MapPin,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  Building,
  Briefcase
} from 'lucide-react';
import { US_STATES } from '../data/statesData';

const OPPORTUNITY_TYPES = [
  "Courier driver",
  "Medical / lab courier",
  "Pharmacy courier",
  "Legal / process courier",
  "Cannabis courier",
  "Cargo van driver",
  "Sprinter van driver",
  "Box truck driver",
  "Route delivery driver",
  "Last-mile delivery",
  "FedEx Ground contractor",
  "Amazon DSP / Flex",
  "Auto parts delivery",
  "Catering / food delivery",
  "Hotshot / expedited freight"
];

const ALL_STATES_ORDERED = [
  { code: 'AL', name: 'Alabama', largestCity: 'Birmingham' },
  { code: 'AK', name: 'Alaska', largestCity: 'Anchorage' },
  { code: 'AZ', name: 'Arizona', largestCity: 'Phoenix' },
  { code: 'AR', name: 'Arkansas', largestCity: 'Little Rock' },
  { code: 'CA', name: 'California', largestCity: 'Los Angeles' },
  { code: 'CO', name: 'Colorado', largestCity: 'Denver' },
  { code: 'CT', name: 'Connecticut', largestCity: 'Bridgeport' },
  { code: 'DE', name: 'Delaware', largestCity: 'Wilmington' },
  { code: 'FL', name: 'Florida', largestCity: 'Miami' },
  { code: 'GA', name: 'Georgia', largestCity: 'Atlanta' },
  { code: 'HI', name: 'Hawaii', largestCity: 'Honolulu' },
  { code: 'ID', name: 'Idaho', largestCity: 'Boise' },
  { code: 'IL', name: 'Illinois', largestCity: 'Chicago' },
  { code: 'IN', name: 'Indiana', largestCity: 'Indianapolis' },
  { code: 'IA', name: 'Iowa', largestCity: 'Des Moines' },
  { code: 'KS', name: 'Kansas', largestCity: 'Wichita' },
  { code: 'KY', name: 'Kentucky', largestCity: 'Louisville' },
  { code: 'LA', name: 'Louisiana', largestCity: 'New Orleans' },
  { code: 'ME', name: 'Maine', largestCity: 'Portland' },
  { code: 'MD', name: 'Maryland', largestCity: 'Baltimore' },
  { code: 'MA', name: 'Massachusetts', largestCity: 'Boston' },
  { code: 'MI', name: 'Michigan', largestCity: 'Detroit' },
  { code: 'MN', name: 'Minnesota', largestCity: 'Minneapolis' },
  { code: 'MS', name: 'Mississippi', largestCity: 'Jackson' },
  { code: 'MO', name: 'Missouri', largestCity: 'Kansas City' },
  { code: 'MT', name: 'Montana', largestCity: 'Billings' },
  { code: 'NE', name: 'Nebraska', largestCity: 'Omaha' },
  { code: 'NV', name: 'Nevada', largestCity: 'Las Vegas' },
  { code: 'NH', name: 'New Hampshire', largestCity: 'Manchester' },
  { code: 'NJ', name: 'New Jersey', largestCity: 'Newark' },
  { code: 'NM', name: 'New Mexico', largestCity: 'Albuquerque' },
  { code: 'NY', name: 'New York', largestCity: 'New York City' },
  { code: 'NC', name: 'North Carolina', largestCity: 'Charlotte' },
  { code: 'ND', name: 'North Dakota', largestCity: 'Fargo' },
  { code: 'OH', name: 'Ohio', largestCity: 'Columbus' },
  { code: 'OK', name: 'Oklahoma', largestCity: 'Oklahoma City' },
  { code: 'OR', name: 'Oregon', largestCity: 'Portland' },
  { code: 'PA', name: 'Pennsylvania', largestCity: 'Philadelphia' },
  { code: 'RI', name: 'Rhode Island', largestCity: 'Providence' },
  { code: 'SC', name: 'South Carolina', largestCity: 'Charleston' },
  { code: 'SD', name: 'South Dakota', largestCity: 'Sioux Falls' },
  { code: 'TN', name: 'Tennessee', largestCity: 'Nashville' },
  { code: 'TX', name: 'Texas', largestCity: 'Houston' },
  { code: 'UT', name: 'Utah', largestCity: 'Salt Lake City' },
  { code: 'VT', name: 'Vermont', largestCity: 'Burlington' },
  { code: 'VA', name: 'Virginia', largestCity: 'Virginia Beach' },
  { code: 'WA', name: 'Washington', largestCity: 'Seattle' },
  { code: 'WV', name: 'West Virginia', largestCity: 'Charleston' },
  { code: 'WI', name: 'Wisconsin', largestCity: 'Milwaukee' },
  { code: 'WY', name: 'Wyoming', largestCity: 'Cheyenne' },
  { code: 'DC', name: 'District of Columbia', largestCity: 'Washington' }
];

export default function MapSection({ selectedState, onSelectState, onFilterCategory }) {
  const [selectedOpportunity, setSelectedOpportunity] = useState("Courier driver");
  const [customCity, setCustomCity] = useState('');

  // Reset customCity to first city of selected state automatically
  useEffect(() => {
    if (selectedState && selectedState.topCities && selectedState.topCities.length > 0) {
      setCustomCity(selectedState.topCities[0]);
    } else {
      setCustomCity('');
    }
  }, [selectedState]);

  // Lookup the complete state object including largestCity metadata
  const selectedStateItem = useMemo(() => {
    if (!selectedState) return null;
    return ALL_STATES_ORDERED.find((st) => st.code === selectedState.code) || null;
  }, [selectedState]);

  const activeCity = customCity.trim() || (selectedStateItem ? selectedStateItem.largestCity : '');
  const activeStateName = selectedStateItem ? selectedStateItem.name : '';

  // Generate Search URLs
  const getGoogleJobsUrl = () => {
    if (!selectedStateItem) return '#';
    const query = `${selectedOpportunity} in ${activeCity} ${activeStateName}`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}&ibp=htl;jobs`;
  };

  const getIndeedUrl = () => {
    if (!selectedStateItem) return '#';
    return `https://www.indeed.com/jobs?q=${encodeURIComponent(selectedOpportunity)}&l=${encodeURIComponent(`${activeCity}, ${selectedStateItem.code}`)}`;
  };

  const getCourierGigsUrl = () => {
    if (!selectedStateItem) return '#';
    return `https://www.google.com/search?q=${encodeURIComponent(`${selectedOpportunity} courier gigs in ${activeCity} ${selectedStateItem.code}`)}`;
  };

  const getCBDriverUrl = () => {
    if (!selectedStateItem) return '#';
    return `https://www.cbdriver.com/search?state=${selectedStateItem.code}`;
  };

  const handleStateClick = (st) => {
    if (onSelectState) {
      if (selectedState && selectedState.code === st.code) {
        onSelectState(null);
      } else {
        // Look up full details in US_STATES if it exists
        const fullDetails = US_STATES[st.code] || st;
        onSelectState(fullDetails);
      }
    }
  };

  return (
    <section id="map-section" className="py-8 lg:py-16 bg-[#FAF9F6] border-t border-slate-200/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        {/* Header Block */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-rose-600 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-sans">
              EXPLORE ACTIVE REGIONS
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-tight">
            Explore and search routes &mdash; all 50 states
          </h2>

          <p className="text-slate-600 text-sm max-w-2xl font-normal leading-relaxed font-sans">
            Tap a state on the interactive map or select from the list below to pull up routes, contract listings, and trigger custom job board queries instantly.
          </p>
        </div>

        {/* 2-Column Merged Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Map & Alphabetical Grid Pill list (sticky on desktop) */}
          <div className="lg:col-span-7 lg:sticky lg:top-28 space-y-8">

            {/* Visual Projection SVG Map */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
              <USMap
                selectedState={selectedState}
                onSelectState={onSelectState}
              />
            </div>

            {/* Alphabetical State Grid fallback list (hidden by default) */}
            {/* <div className="hidden bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                OR CHOOSE BY STATE CODE LIST
              </label>

              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {ALL_STATES_ORDERED.map((st) => {
                  const isSelected = selectedState?.code === st.code;
                  return (
                    <button
                      key={st.code}
                      onClick={() => handleStateClick(st)}
                      className={`py-2 px-1 rounded-xl text-xs font-extrabold border transition-all duration-150 cursor-pointer text-center ${
                        isSelected
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20 scale-105'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {st.code}
                    </button>
                  );
                })}
              </div>
            </div> */}

          </div>

          {/* RIGHT COLUMN: Selected State Details & Job Search Tools Panel */}
          <div className="lg:col-span-5">

            {!selectedState ? (
              // View 1: When no state is selected
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4 transition-all duration-300">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                  SELECTED REGION
                </div>
                <h3 className="text-2xl font-extrabold text-[#0b132b] font-serif-heading">
                  Tap a state to begin
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">
                  Hover to see states glow on the map, click to pull up active routes, business contract directories, and local courier search engine links.
                </p>
                <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-semibold">
                  Supports all 50 states and District of Columbia.
                </div>
              </div>
            ) : (
              // View 2: When a state is selected - Merged View
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 transition-all duration-300 relative">

                {/* Deselect close button */}
                <button
                  onClick={() => onSelectState(null)}
                  className="absolute top-6 right-6 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Deselect state"
                >
                  <X className="w-4.5 h-4.5" />
                </button>

                <div className="space-y-5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    SELECTED REGION
                  </div>

                  {/* Title & Stats */}
                  <div>
                    <h3 className="text-3xl font-extrabold text-[#0b132b] font-serif-heading">
                      {selectedState.name}
                    </h3>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {selectedState.code} &middot; Open Routes: {selectedState.openRoutes || 0}
                    </span>
                  </div>

                  {/* 3 Quick Action Links */}
                  <div className="space-y-2.5 pt-2">
                    <button
                      onClick={() => onFilterCategory('open-routes', selectedState)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer group text-left"
                    >
                      <span>Find routes in {selectedState.name}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => onFilterCategory('for-sale', selectedState)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-all cursor-pointer group text-left"
                    >
                      <span>Browse routes for sale in {selectedState.code}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => onFilterCategory('business-hiring', selectedState)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-all cursor-pointer group text-left"
                    >
                      <span>Local courier business directories</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Job Search Generator inside the same Panel */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-[#0b132b] font-serif-heading">
                      Search contract routes in {selectedState.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-snug font-medium">
                      Select route details below to compile live queries for external job boards.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Opportunity Type Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Opportunity Type</label>
                      <select
                        value={selectedOpportunity}
                        onChange={(e) => setSelectedOpportunity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
                      >
                        {OPPORTUNITY_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* City Select Dropdown */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">City (Select a City)</label>
                      <select
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none"
                      >
                        {selectedState.topCities?.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 4 Search Links Cards Rendered in a 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-2">

                    {/* Card 1: Google Jobs */}
                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-2">
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-xs text-[#0b132b]">Google Jobs</h5>
                        <p className="text-[10px] text-slate-400 leading-tight font-medium">Search matching "{selectedOpportunity.toLowerCase()}" gigs in {activeCity}.</p>
                      </div>
                      <a
                        href={getGoogleJobsUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 transition-colors cursor-pointer"
                      >
                        <span>Search Google</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Card 2: Indeed */}
                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-2">
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-xs text-[#0b132b]">Indeed</h5>
                        <p className="text-[10px] text-slate-400 leading-tight font-medium">Search "{selectedOpportunity.toLowerCase()}" listings in {activeCity}.</p>
                      </div>
                      <a
                        href={getIndeedUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 transition-colors cursor-pointer"
                      >
                        <span>Search Indeed</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Card 3: CourierGigs */}
                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-2">
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-xs text-[#0b132b]">CourierGigs</h5>
                        <p className="text-[10px] text-slate-400 leading-tight font-medium">Search active courier gigs in {activeStateName}.</p>
                      </div>
                      <a
                        href={getCourierGigsUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 transition-colors cursor-pointer"
                      >
                        <span>Search Gigs</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Card 4: CBDriver */}
                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-2">
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-xs text-[#0b132b]">CBDriver</h5>
                        <p className="text-[10px] text-slate-400 leading-tight font-medium">Search CBDriver contract jobs in {activeStateName}.</p>
                      </div>
                      <a
                        href={getCBDriverUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 transition-colors cursor-pointer"
                      >
                        <span>Search CBDriver</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
