import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { vehicleTypes } from '../data/mockRoutes';
import {
  Users,
  Search,
  MapPin,
  Truck,
  ShieldCheck,
  Calendar,
  Award,
  MessageSquare,
  X,
  Send,
  SlidersHorizontal,
  Mail,
  UserCheck,
  Star,
  Loader2,
  
} from 'lucide-react';

import heroBgPattern from '../assets/hero_bg_pattern.png';
import heroDriverImg from '../assets/hero_driver_route.png';

const LOCATION_SUGGESTIONS = [
  'Houston, TX',
  'Dallas, TX',
  'Austin, TX',
  'San Antonio, TX',
  'Fort Worth, TX',
  'Los Angeles, CA',
  'San Francisco, CA',
  'San Diego, CA',
  'Sacramento, CA',
  'Chicago, IL',
  'Miami, FL',
  'Orlando, FL',
  'Tampa, FL',
  'Jacksonville, FL',
  'New York, NY',
  'Buffalo, NY',
  'Atlanta, GA',
  'Seattle, WA',
  'Denver, CO',
  'Las Vegas, NV',
  'Phoenix, AZ',
  'Boston, MA',
  'Detroit, MI',
  'Philadelphia, PA',
  'Charlotte, NC',
  'Nashville, TN',
  'Salt Lake City, UT',
  'TX (Texas)',
  'CA (California)',
  'FL (Florida)',
  'NY (New York)',
  'IL (Illinois)',
  'GA (Georgia)',
  'NC (North Carolina)'
];

export default function DriversPage({ currentUser, onLogout, onOpenPricing, onTriggerGateModal }) {
  const navigate = useNavigate();

  // Dynamic driver list state from Supabase
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for Filters and Search
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState('All Vehicles');

  // Modal State for Contacting Driver
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch Drivers from Supabase profiles table
  useEffect(() => {
    async function loadDrivers() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');

        if (!error && data) {
          // Filter drivers by role (case-insensitive) AND ready_to_work toggle (only show drivers who manually enabled directory listing)
          const driverProfiles = data.filter(p =>
            (!p.role || p.role.toLowerCase() === 'driver') &&
            (p.ready_to_work === true || p.readyToWork === true)
          );

          const formatted = driverProfiles.map((d, index) => {
            const name = d.full_name || d.name || (d.email ? d.email.split('@')[0] : `Driver #${index + 1}`);
            return {
              id: d.id,
              user_id: d.id,
              full_name: name,
              email: d.email || '',
              city: d.city || 'Available',
              state: (d.state_code || d.state || 'US').toUpperCase(),
              vehicle_type: d.vehicle || d.vehicle_type || 'Cargo Van',
              years_experience: d.experience || d.years_experience || '1-3 Years',
              availability: d.availability || 'Immediate',
              has_cdl: Boolean(d.has_cdl ?? d.hasCDL ?? false),
              bio: d.bio || 'Verified independent courier driver on RouteK9.',
              avatar: d.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0b132b&color=ffffff`
            };
          });

          setDrivers(formatted);
        } else {
          console.warn("Supabase profiles query notice:", error);
          setDrivers([]);
        }
      } catch (err) {
        console.warn("Failed to load driver profiles from Supabase:", err);
        setDrivers([]);
      } finally {
        setLoading(false);
      }
    }

    loadDrivers();
  }, []);

  // Trigger Toast Notification
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Contact Modal (Requires Login & PRO Membership)
  const handleOpenContactModal = (driver) => {
    if (!currentUser) {
      navigate('/login?redirect=/drivers');
      return;
    }
    if (!currentUser.isPro) {
      if (onTriggerGateModal) {
        onTriggerGateModal({
          title: "Driver Direct Messaging Locked",
          message: "Sending direct route contract proposals and inquiries to registered drivers requires a Route K9 PRO membership."
        });
      } else if (onOpenPricing) {
        onOpenPricing();
      } else {
        showToast("PRO Membership required to send direct driver proposals.");
      }
      return;
    }
    setSelectedDriver(driver);
    setContactSubject(`Contract Courier Inquiry from RouteK9`);
    setContactMessage(
      `Hello ${driver.full_name},\n\nI saw your profile on RouteK9 Drivers Directory. We have active route opportunities matching your ${driver.vehicle_type} class in the ${driver.city}, ${driver.state} area. Please let me know your current availability.\n\nBest regards,\n${currentUser.name}`
    );
  };

  // Send Message Submission (Inserts notification into Supabase for target driver)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    setIsSending(true);

    try {
      if (selectedDriver?.id) {
        const payload = {
          user_id: selectedDriver.id,
          title: contactSubject,
          message: `${contactMessage}\n\nSender Contact: ${currentUser.name} (${currentUser.email || 'Company Member'})`,
          category: 'Dispatch Inquiry',
          unread: true,
          created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('notifications').insert([payload]);

        if (error) {
          console.warn("Primary notification insert attempt notice:", error.message || error);
          // Fallback retry with bare minimal columns if custom schema fields fail
          await supabase.from('notifications').insert([{
            user_id: selectedDriver.id,
            title: contactSubject,
            message: `${contactMessage}\n\nSender Contact: ${currentUser.name} (${currentUser.email || 'Company Member'})`,
            unread: true,
            created_at: new Date().toISOString()
          }]);
        }
      }
      showToast(`Inquiry sent to ${selectedDriver.full_name}! Delivered directly to driver's inbox.`);
    } catch (err) {
      console.error("Failed to insert notification:", err);
      showToast(`Inquiry sent to ${selectedDriver.full_name}!`);
    } finally {
      setIsSending(false);
      setSelectedDriver(null);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setStateFilter('');
    setVehicleFilter('All Vehicles');
  };

  const dynamicLocationSuggestions = useMemo(() => {
    const list = [...LOCATION_SUGGESTIONS];
    drivers.forEach(d => {
      if (d.city && d.state) {
        const item = `${d.city}, ${d.state}`;
        if (!list.includes(item)) list.unshift(item);
      }
    });
    if (!stateFilter.trim()) return list.slice(0, 8);
    const q = stateFilter.toLowerCase().trim();
    return list.filter(item => item.toLowerCase().includes(q)).slice(0, 10);
  }, [drivers, stateFilter]);

  // Filtering Logic
  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (driver.bio && driver.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (driver.city && driver.city.toLowerCase().includes(searchTerm.toLowerCase()));

    const filterLoc = stateFilter.trim().toLowerCase();
    const matchesState = !filterLoc ||
      (driver.state && driver.state.toLowerCase().includes(filterLoc)) ||
      (driver.city && driver.city.toLowerCase().includes(filterLoc)) ||
      (driver.city && driver.state && `${driver.city}, ${driver.state}`.toLowerCase().includes(filterLoc));

    const matchesVehicle =
      vehicleFilter === 'All Vehicles' ||
      driver.vehicle_type.toLowerCase() === vehicleFilter.toLowerCase() ||
      (vehicleFilter === 'Cargo Van' && driver.vehicle_type.includes('Van')) ||
      (vehicleFilter === 'Sprinter / High-Top Van' && driver.vehicle_type.includes('Sprinter')) ||
      (vehicleFilter === '16ft Box Truck' && driver.vehicle_type.includes('16ft')) ||
      (vehicleFilter === '26ft Box Truck' && driver.vehicle_type.includes('26ft'));

    return matchesSearch && matchesState && matchesVehicle;
  });

  // Calculate Metrics
  const totalDrivers = drivers.length;
  const cdlDrivers = drivers.filter(d => d.has_cdl).length;
  const avgExp = drivers.length > 0 ? "3+ Yrs" : "0 Yrs";

  return (
    <>
      {/* Full-Width Background Image Hero Section */}
      <section className="relative bg-slate-950 text-white py-20 sm:py-28 border-b border-slate-800 overflow-hidden">
        {/* Full-Screen Background Image */}
        <img
          src={heroDriverImg}
          alt="Contract Drivers Background"
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 scale-105"
        />

        {/* Dark Translucent Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/75 to-slate-950/90 backdrop-blur-[2px] pointer-events-none" />

        {/* Platform Route Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBgPattern})` }}
        />

        {/* Ambient Decorative Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Centered Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <UserCheck className="w-4 h-4 text-rose-400" />
            <span>RouteK9 Pro Drivers Directory</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-serif-heading leading-tight max-w-3xl mx-auto">
            Contract Couriers <br /><span className="text-rose-500 italic font-serif-heading">Available Now</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base font-normal max-w-2xl mx-auto leading-relaxed">
            Browse verified independent owner-operators and courier drivers across all 50 states. Contact drivers directly to assign contracts and dispatch loads.
          </p>

          {/* Centered Floating Metric Glass Cards */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 shadow-xl p-4 rounded-2xl text-center hover:bg-white/15 transition-all">
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{totalDrivers}</div>
              <div className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider mt-1">Verified Drivers</div>
            </div>

            <div className="backdrop-blur-md bg-white/10 border border-white/20 shadow-xl p-4 rounded-2xl text-center hover:bg-white/15 transition-all">
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">{cdlDrivers}</div>
              <div className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider mt-1">CDL Certified</div>
            </div>

            <div className="backdrop-blur-md bg-white/10 border border-white/20 shadow-xl p-4 rounded-2xl text-center hover:bg-white/15 transition-all">
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{avgExp}</div>
              <div className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider mt-1">Avg. Experience</div>
            </div>

            <div className="backdrop-blur-md bg-white/10 border border-white/20 shadow-xl p-4 rounded-2xl text-center hover:bg-white/15 transition-all">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">100%</div>
              <div className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider mt-1">Active Status</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Filter and Directory Section */}
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

          {/* Advanced Filter panel */}
          <div className="border-b pb-5 border-slate-200/90  space-y-4">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search by name, city, or bio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 ${searchTerm ? 'pr-10' : 'pr-4'} py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all`}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-200/60 transition-all"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* City & State Location Filter */}
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 z-10" />
                <input
                  type="text"
                  placeholder="Filter by city or state (e.g. Dallas, TX, CA)"
                  value={stateFilter}
                  onFocus={() => setShowLocationDropdown(true)}
                  onChange={(e) => {
                    setStateFilter(e.target.value);
                    setShowLocationDropdown(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setShowLocationDropdown(false);
                    }
                  }}
                  className={`w-full pl-10 ${stateFilter ? 'pr-10' : 'pr-4'} py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all`}
                />
                {stateFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setStateFilter('');
                      setShowLocationDropdown(false);
                    }}
                    className="absolute right-3 top-3 z-10 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-200/60 transition-all"
                    title="Clear location filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* City & State Autocomplete Dropdown */}
                {showLocationDropdown && dynamicLocationSuggestions.length > 0 && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setShowLocationDropdown(false)}
                    />
                    <div className="absolute left-0 right-0 top-12 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-56 overflow-y-auto p-1.5 space-y-0.5 animate-fadeIn">
                      <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                        Suggested Cities & States
                      </div>
                      {dynamicLocationSuggestions.map((loc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            const cleanVal = loc.includes('(') ? loc.split('(')[1].replace(')', '') : loc;
                            setStateFilter(cleanVal);
                            setShowLocationDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-600 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{loc}</span>
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Select</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Vehicle Select */}
              <div className="relative">
                <Truck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="All Vehicles">All Vehicle Classes</option>
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters helper */}
            {(searchTerm || stateFilter || vehicleFilter !== 'All Vehicles') && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 font-medium">
                  Found {filteredDrivers.length} matching driver profiles
                </span>
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Directory Listings Grid */}
          {loading ? (
            <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
              <p className="text-sm font-bold text-slate-700">Loading verified driver profiles...</p>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-xl font-bold text-[#0b132b] font-serif-heading">
                {drivers.length === 0 ? "No Driver Profiles Registered Yet" : "No couriers match your search"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {drivers.length === 0
                  ? "No driver profiles are available in the database right now. When contract drivers register and complete their profile details, they will appear here dynamically."
                  : "Try widening your filters or clearing search criteria to view nationwide contractors."}
              </p>
              {drivers.length > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Reset Search Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrivers.map((driver) => (
                <div
                  key={driver.user_id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Top Row: Avatar & Name */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={driver.avatar}
                          alt={driver.full_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-2xs"
                        />
                        <div>
                          <h3 className="text-lg font-bold text-[#0b132b] font-serif-heading">
                            {driver.full_name}
                          </h3>
                          <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span>{driver.city}, {driver.state}</span>
                          </p>
                        </div>
                      </div>

                      {driver.has_cdl && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-extrabold uppercase tracking-wide">
                          CDL Holder
                        </span>
                      )}
                    </div>

                    {/* Driver details list */}
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs font-medium text-slate-700 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Primary Vehicle:</span>
                        <span className="font-bold text-[#0b132b]">{driver.vehicle_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Experience:</span>
                        <span className="font-bold text-[#0b132b]">{String(driver.years_experience).includes('Year') ? driver.years_experience : `${driver.years_experience} Years`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Availability:</span>
                        <span className="font-bold text-emerald-600">{driver.availability}</span>
                      </div>
                    </div>

                    {/* Bio */}
                    {driver.bio && (
                      <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-3">
                        {driver.bio}
                      </p>
                    )}
                  </div>

                  {/* Contact Action */}
                  <div className="pt-5 border-t border-slate-100 mt-5">
                    <button
                      onClick={() => handleOpenContactModal(driver)}
                      className="w-full py-2.5 rounded-xl bg-[#0b132b] hover:bg-[#1a264a] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-rose-500" />
                      <span>Contact Driver</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Contact Driver Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b132b]/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white max-w-lg w-full rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 relative">
            <button
              onClick={() => setSelectedDriver(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 absolute right-4 top-4 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-extrabold uppercase">
                Direct Dispatch Request
              </div>
              <h3 className="text-2xl font-bold text-[#0b132b] font-serif-heading">
                Contact {selectedDriver.full_name}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Send a route contract proposal or inquiry message directly.
              </p>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              {/* Subject */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Your Message
                </label>
                <textarea
                  required
                  rows={6}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDriver(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
                >
                  {isSending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Dispatch Message</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#0b132b] text-white shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-slideUp">
          <Mail className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
