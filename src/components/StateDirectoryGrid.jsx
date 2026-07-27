import React, { useState } from 'react';

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

export default function StateDirectoryGrid({ onSelectState }) {
  const [selectedOpportunity, setSelectedOpportunity] = useState("Courier driver");
  const [selectedStateItem, setSelectedStateItem] = useState(null);
  const [customCity, setCustomCity] = useState('');

  const handleStateClick = (st) => {
    setSelectedStateItem(st);
    if (onSelectState) {
      onSelectState(st);
    }
  };

  const activeCity = customCity.trim() || (selectedStateItem ? selectedStateItem.largestCity : '');
  const activeStateName = selectedStateItem ? selectedStateItem.name : '';

  // Generate Search URLs
  const getGoogleJobsUrl = () => {
    const query = `${selectedOpportunity} in ${activeCity} ${activeStateName}`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}&ibp=htl;jobs`;
  };

  const getIndeedUrl = () => {
    return `https://www.indeed.com/jobs?q=${encodeURIComponent(selectedOpportunity)}&l=${encodeURIComponent(`${activeCity}, ${selectedStateItem?.code || ''}`)}`;
  };

  const getCourierGigsUrl = () => {
    return `https://www.google.com/search?q=${encodeURIComponent(`CourierGigs ${selectedOpportunity} ${activeStateName}`)}`;
  };

  const getCBDriverUrl = () => {
    return `https://www.cbdriver.com/search?state=${selectedStateItem?.code || ''}`;
  };

  return (
    <section id="find-a-route-section" className="py-16 sm:py-20 bg-[#FAF9F6] border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header matching screenshot 1 */}
        <div className="mb-10 space-y-3">

          {/* Badge Line */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-rose-600 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-sans">
              FIND ROUTES
            </span>
          </div>

          {/* Headline matching screenshot 1 */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-tight">
            Search open contract routes — all 50 states
          </h2>

          {/* Subtitle matching screenshot 1 */}
          <p className="text-slate-600 text-sm sm:text-base max-w-4xl font-normal leading-relaxed font-sans">
            Pick the opportunity you want, tap a state, add a city if you like — and Route K9 opens Google Jobs, Indeed, CourierGigs, and CBDriver already searched for you.
          </p>

        </div>

        {/* Main Card Container matching screenshot 1, 2, 3 */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-8">

          {/* 1. OPPORTUNITY TYPE Selector */}
          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">
              OPPORTUNITY TYPE
            </label>
            <div className="relative max-w-md">
              <select
                value={selectedOpportunity}
                onChange={(e) => setSelectedOpportunity(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-[#0b132b] focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all appearance-none cursor-pointer pr-10"
              >
                {OPPORTUNITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* 2. TAP A STATE Grid */}
          <div className="space-y-3">
            <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">
              TAP A STATE
            </label>

            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-2">
              {ALL_STATES_ORDERED.map((st) => {
                const isSelected = selectedStateItem?.code === st.code;
                return (
                  <button
                    key={st.code}
                    onClick={() => handleStateClick(st)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-all duration-150 cursor-pointer text-center ${isSelected
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                      : 'bg-white text-slate-800 border-slate-200/90 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                  >
                    {st.code}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. CITY (OPTIONAL — DEFAULTS TO LARGEST CITY) */}
          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">
              CITY (OPTIONAL — DEFAULTS TO LARGEST CITY)
            </label>
            <input
              type="text"
              placeholder="e.g. Houston"
              value={selectedStateItem && !customCity ? selectedStateItem.largestCity : customCity}
              onChange={(e) => setCustomCity(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200/90 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
            />
          </div>

          {/* 4. Results Section: Unselected vs Selected */}
          {!selectedStateItem ? (
            <p className="text-xs italic text-slate-500 pt-2 font-sans">
              Select a state above to generate your search links.
            </p>
          ) : (
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Card 1: Google Jobs */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-[#0b132b] font-serif-heading">
                    Google Jobs
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Opens Google's Jobs tab with "{selectedOpportunity.toLowerCase()}" listings in {activeCity}, {activeStateName}.
                  </p>
                </div>
                <a
                  href={getGoogleJobsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Search Google Jobs</span>
                  <span>→</span>
                </a>
              </div>

              {/* Card 2: Indeed */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-[#0b132b] font-serif-heading">
                    Indeed
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Searches Indeed for "{selectedOpportunity.toLowerCase()}" jobs in {activeCity}, {activeStateName}.
                  </p>
                </div>
                <a
                  href={getIndeedUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Search Indeed</span>
                  <span>→</span>
                </a>
              </div>

              {/* Card 3: CourierGigs */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-[#0b132b] font-serif-heading">
                    CourierGigs
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    CourierGigs contracts filtered to {activeStateName}.
                  </p>
                </div>
                <a
                  href={getCourierGigsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Search CourierGigs</span>
                  <span>→</span>
                </a>
              </div>

              {/* Card 4: CBDriver */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-[#0b132b] font-serif-heading">
                    CBDriver
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    CBDriver contract jobs in {activeCity}, {activeStateName}.
                  </p>
                </div>
                <a
                  href={getCBDriverUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Search CBDriver</span>
                  <span>→</span>
                </a>
              </div>

            </div>
          )}

        </div>

      </div>
    </section>
  );
}
