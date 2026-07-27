import React, { useState } from 'react';
import { MapPin, Search, ExternalLink, Building2 } from 'lucide-react';
import { US_STATES } from '../data/statesData';

const BUSINESS_TYPES = [
  "Hospitals",
  "Pharmacies",
  "Automotive Repair Shops",
  "Medical & Dental Offices",
  "Law Firms",
  "Print & Copy Shops",
  "Manufacturing & Warehouses",
  "Florists",
  "Restaurants & Catering",
  "Auto Parts Stores",
  "Medical Laboratories",
  "Banks & Credit Unions"
];

const STATE_OPTIONS = [
  { code: 'AL', name: 'Alabama', largestCity: 'Birmingham', cities: ["Birmingham", "Montgomery", "Huntsville", "Mobile", "Tuscaloosa"] },
  { code: 'AK', name: 'Alaska', largestCity: 'Anchorage', cities: ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan"] },
  { code: 'AZ', name: 'Arizona', largestCity: 'Phoenix', cities: ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale"] },
  { code: 'AR', name: 'Arkansas', largestCity: 'Little Rock', cities: ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro"] },
  { code: 'CA', name: 'California', largestCity: 'Los Angeles', cities: ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Fresno", "Oakland", "Long Beach"] },
  { code: 'CO', name: 'Colorado', largestCity: 'Denver', cities: ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood"] },
  { code: 'CT', name: 'Connecticut', largestCity: 'Bridgeport', cities: ["Bridgeport", "Stamford", "New Haven", "Hartford", "Waterbury"] },
  { code: 'DE', name: 'Delaware', largestCity: 'Wilmington', cities: ["Wilmington", "Dover", "Newark", "Middletown"] },
  { code: 'FL', name: 'Florida', largestCity: 'Miami', cities: ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "St. Petersburg"] },
  { code: 'GA', name: 'Georgia', largestCity: 'Atlanta', cities: ["Atlanta", "Augusta", "Columbus", "Savannah", "Athens"] },
  { code: 'HI', name: 'Hawaii', largestCity: 'Honolulu', cities: ["Honolulu", "Pearl City", "Hilo", "Kailua", "Waipahu"] },
  { code: 'ID', name: 'Idaho', largestCity: 'Boise', cities: ["Boise", "Meridian", "Nampa", "Idaho Falls", "Pocatello"] },
  { code: 'IL', name: 'Illinois', largestCity: 'Chicago', cities: ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield"] },
  { code: 'IN', name: 'Indiana', largestCity: 'Indianapolis', cities: ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel"] },
  { code: 'IA', name: 'Iowa', largestCity: 'Des Moines', cities: ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City"] },
  { code: 'KS', name: 'Kansas', largestCity: 'Wichita', cities: ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka"] },
  { code: 'KY', name: 'Kentucky', largestCity: 'Louisville', cities: ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington"] },
  { code: 'LA', name: 'Louisiana', largestCity: 'New Orleans', cities: ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette", "Lake Charles"] },
  { code: 'ME', name: 'Maine', largestCity: 'Portland', cities: ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn"] },
  { code: 'MD', name: 'Maryland', largestCity: 'Baltimore', cities: ["Baltimore", "Columbia", "Germantown", "Silver Spring", "Annapolis"] },
  { code: 'MA', name: 'Massachusetts', largestCity: 'Boston', cities: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell"] },
  { code: 'MI', name: 'Michigan', largestCity: 'Detroit', cities: ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Lansing", "Ann Arbor"] },
  { code: 'MN', name: 'Minnesota', largestCity: 'Minneapolis', cities: ["Minneapolis", "St. Paul", "Rochester", "Duluth", "Bloomington"] },
  { code: 'MS', name: 'Mississippi', largestCity: 'Jackson', cities: ["Jackson", "Gulfport", "Southaven", "Biloxi", "Hattiesburg"] },
  { code: 'MO', name: 'Missouri', largestCity: 'Kansas City', cities: ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence"] },
  { code: 'MT', name: 'Montana', largestCity: 'Billings', cities: ["Billings", "Missoula", "Great Falls", "Bozeman", "Helena"] },
  { code: 'NE', name: 'Nebraska', largestCity: 'Omaha', cities: ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney"] },
  { code: 'NV', name: 'Nevada', largestCity: 'Las Vegas', cities: ["Las Vegas", "Reno", "Henderson", "North Las Vegas", "Sparks"] },
  { code: 'NH', name: 'New Hampshire', largestCity: 'Manchester', cities: ["Manchester", "Nashua", "Concord", "Dover", "Rochester"] },
  { code: 'NJ', name: 'New Jersey', largestCity: 'Newark', cities: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Edison", "Trenton"] },
  { code: 'NM', name: 'New Mexico', largestCity: 'Albuquerque', cities: ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell"] },
  { code: 'NY', name: 'New York', largestCity: 'New York City', cities: ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany"] },
  { code: 'NC', name: 'North Carolina', largestCity: 'Charlotte', cities: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem"] },
  { code: 'ND', name: 'North Dakota', largestCity: 'Fargo', cities: ["Fargo", "Bismarck", "Grand Forks", "Minot", "Williston"] },
  { code: 'OH', name: 'Ohio', largestCity: 'Columbus', cities: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton"] },
  { code: 'OK', name: 'Oklahoma', largestCity: 'Oklahoma City', cities: ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Edmond"] },
  { code: 'OR', name: 'Oregon', largestCity: 'Portland', cities: ["Portland", "Salem", "Eugene", "Gresham", "Hillsboro"] },
  { code: 'PA', name: 'Pennsylvania', largestCity: 'Philadelphia', cities: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton"] },
  { code: 'RI', name: 'Rhode Island', largestCity: 'Providence', cities: ["Providence", "Warwick", "Cranston", "Pawtucket"] },
  { code: 'SC', name: 'South Carolina', largestCity: 'Charleston', cities: ["Charleston", "Columbia", "North Charleston", "Mount Pleasant", "Greenville"] },
  { code: 'SD', name: 'South Dakota', largestCity: 'Sioux Falls', cities: ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings"] },
  { code: 'TN', name: 'Tennessee', largestCity: 'Nashville', cities: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville"] },
  { code: 'TX', name: 'Texas', largestCity: 'Houston', cities: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso", "Arlington"] },
  { code: 'UT', name: 'Utah', largestCity: 'Salt Lake City', cities: ["Salt Lake City", "West Valley City", "Provo", "West Jordan", "Orem", "Ogden"] },
  { code: 'VT', name: 'Vermont', largestCity: 'Burlington', cities: ["Burlington", "South Burlington", "Rutland", "Barre", "Montpelier"] },
  { code: 'VA', name: 'Virginia', largestCity: 'Virginia Beach', cities: ["Virginia Beach", "Chesapeake", "Norfolk", "Richmond", "Roanoke", "Alexandria"] },
  { code: 'WA', name: 'Washington', largestCity: 'Seattle', cities: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent"] },
  { code: 'WV', name: 'West Virginia', largestCity: 'Charleston', cities: ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Wheeling"] },
  { code: 'WI', name: 'Wisconsin', largestCity: 'Milwaukee', cities: ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine"] },
  { code: 'WY', name: 'Wyoming', largestCity: 'Cheyenne', cities: ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs"] },
  { code: 'DC', name: 'District of Columbia', largestCity: 'Washington', cities: ["Washington"] }
];

export default function LocalCourierDirectorySection() {
  const [selectedBusinessType, setSelectedBusinessType] = useState("Hospitals");
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const currentState = STATE_OPTIONS.find((s) => s.code === selectedStateCode) || null;
  const cityList = currentState ? currentState.cities : ["Houston", "Los Angeles", "Chicago", "Miami", "Dallas", "Phoenix", "Seattle"];
  const activeCity = selectedCity || (currentState ? currentState.largestCity : 'Houston');

  const handleStateChange = (e) => {
    const newCode = e.target.value;
    setSelectedStateCode(newCode);
    const newSt = STATE_OPTIONS.find((s) => s.code === newCode);
    if (newSt) {
      setSelectedCity(newSt.largestCity);
    } else {
      setSelectedCity('');
    }
  };

  const getGoogleMapsSearchUrl = () => {
    if (!currentState) return '#';
    const query = `${selectedBusinessType} near ${activeCity}, ${currentState.name}`;
    return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  };

  return (
    <section id="local-courier-section" className="py-10 sm:py-14 bg-[#FAF9F6] border-t border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="space-y-3">
          
          {/* Badge Line */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-rose-600 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-sans">
              DIRECTORY
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-tight">
            Find local businesses that need couriers
          </h2>

          {/* Subtitle */}
          <p className="text-slate-600 text-sm max-w-2xl font-normal leading-relaxed font-sans">
            Hospitals, labs, legal firms, and local businesses that contract directly with couriers. Select a type and location.
          </p>

        </div>

        {/* Main Form Container */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          
          {/* 1. BUSINESS TYPE Pill Buttons Row */}
          <div className="space-y-3">
            <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">
              BUSINESS TYPE
            </label>
            
            <div className="flex flex-wrap items-center gap-2">
              {BUSINESS_TYPES.map((bType) => {
                const isSelected = selectedBusinessType === bType;
                return (
                  <button
                    key={bType}
                    onClick={() => setSelectedBusinessType(bType)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {bType}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. STATE Dropdown & CITY Dropdown Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            
            {/* STATE Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">
                STATE
              </label>
              <div className="relative">
                <select
                  value={selectedStateCode}
                  onChange={handleStateChange}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none appearance-none cursor-pointer pr-10 shadow-2xs"
                >
                  <option value="">Select a state...</option>
                  {STATE_OPTIONS.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* CITY Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-widest text-slate-400 font-sans">
                CITY (SELECT A CITY)
              </label>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={!currentState}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none appearance-none cursor-pointer pr-10 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="">{currentState ? `e.g. ${currentState.largestCity}` : 'Select a state first...'}</option>
                  {cityList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

          </div>

          {/* 3. Helper Note or Results Action */}
          {!currentState ? (
            <p className="text-xs italic text-slate-500 font-sans">
              Select a state above to load the map.
            </p>
          ) : (
            <div className="pt-2">
              <a
                href={getGoogleMapsSearchUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                <span>Search {selectedBusinessType} in {activeCity}, {currentState.name} on Google Maps</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* 4. Bottom Disclaimer */}
          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-medium leading-relaxed font-sans">
            Results and contact details come directly from Google Maps and update in real time — we don't store or alter any business's phone number, email, or listing.
          </div>

        </div>

      </div>
    </section>
  );
}
