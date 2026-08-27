import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import CustomSelect from '../components/CustomSelect';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Search, 
  SlidersHorizontal, 
  MessageSquare, 
  Send, 
  X, 
  CheckCircle2,
  Building,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import PhoneInputPkg from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const PhoneInput = PhoneInputPkg?.default || PhoneInputPkg;

import heroBgPattern from '../assets/hero_bg_pattern.png';
import heroFleetImg from '../assets/hero_fleet_trucks.png';

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

export default function CompaniesPage({ currentUser, onLogout, onOpenPricing, onTriggerGateModal }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [contractFilter, setContractFilter] = useState('All Contracts');
  const [selectedCompany, setSelectedCompany] = useState(null); // for Contact modal
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const handleContactCompany = (company) => {
    if (!currentUser) {
      navigate('/login?redirect=/companies');
      return;
    }
    if (!currentUser.isPro) {
      if (onTriggerGateModal) {
        onTriggerGateModal({
          title: "Courier Company Direct Inquiry Locked",
          message: "Contacting verified courier companies and submitting direct route contract applications requires an active Route K9 PRO membership."
        });
      } else if (onOpenPricing) {
        onOpenPricing();
      } else {
        navigate('/pricing');
      }
      return;
    }
    setSelectedCompany(company);
  };
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    vehicle: currentUser?.vehicle || 'Cargo Van',
    message: ''
  });
  const [contactSuccess, setContactSuccess] = useState(false);

  // Sync contactForm with currentUser when profile loads
  useEffect(() => {
    if (currentUser) {
      setContactForm((prev) => ({
        ...prev,
        name: prev.name || currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : ''),
        email: prev.email || currentUser.email || '',
        phone: currentUser.phone || prev.phone || '',
        vehicle: currentUser.vehicle || prev.vehicle || 'Cargo Van'
      }));
    }
  }, [currentUser]);

  // Fetch Courier Companies from Supabase profiles and company_profiles tables
  useEffect(() => {
    async function loadCompanies() {
      setLoading(true);
      try {
        // 1. Fetch company_profiles metadata table (lightweight select)
        let companyMeta = [];
        try {
          const { data: cData } = await supabase
            .from('company_profiles')
            .select('user_id, company_name, city, state, contract_types, service_area, description, website, phone, contact_email');
          if (Array.isArray(cData)) companyMeta = cData;
        } catch (cmErr) {
          console.warn("company_profiles notice in CompaniesPage:", cmErr);
        }

        const metaMap = (companyMeta || []).reduce((acc, curr) => {
          const key = curr.user_id || curr.id;
          if (key) acc[key] = curr;
          return acc;
        }, {});

        // 2. Fetch profiles with lightweight schema columns (exclude heavy avatar_url blobs)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, role, full_name, city, state_code, phone, status, is_active, created_at')
          .eq('role', 'company')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          // Filter profiles by role = 'company' or where metadata exists in company_profiles
          let companyProfiles = data.filter(p => {
            const role = String(p.role || '').toLowerCase().trim();
            const isCompanyRole = role === 'company' || role === 'corporate' || role === 'business' || Boolean(metaMap[p.id]);
            const isNotInactive = p.status !== 'INACTIVE' && p.is_active !== false;
            return isCompanyRole && isNotInactive;
          });

          // Fallback if profiles table role wasn't set to company
          if (companyProfiles.length === 0 && companyMeta.length > 0) {
            companyProfiles = companyMeta.map(cm => ({
              id: cm.user_id || cm.id,
              ...cm
            }));
          }

          const formatted = companyProfiles.map((p, index) => {
            const meta = metaMap[p.id] || metaMap[p.user_id] || {};
            const name = meta.company_name || p.company_name || p.full_name || p.name || (p.email ? p.email.split('@')[0] : `Logistics Partner #${index + 1}`);
            const stateStr = (meta.state || p.state_code || p.state || 'TX').toUpperCase();
            const cityStr = meta.city || p.city || 'Regional Hub';

            return {
              id: p.id || p.user_id || `comp-${index}`,
              user_id: p.id || p.user_id || `comp-${index}`,
              company_name: name,
              email: meta.contact_email || meta.email || p.email || '',
              city: cityStr,
              state: stateStr,
              state_code: stateStr,
              contract_types: meta.contract_types || p.contract_types || p.vehicle || 'Medical Specimen, Scheduled Cargo Routes, On-Demand',
              service_area: meta.service_area || p.service_area || p.availability || 'Regional & Statewide Logistics',
              description: meta.description || p.description || 'Verified courier logistics and route contracting company on RouteK9.',
              website: meta.website || p.website_url || p.website || p.dot_number || '',
              phone: meta.phone || p.phone || '',
              logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0b132b&color=ffffff`
            };
          });

          setCompanies(formatted);
        } else {
          console.warn("Supabase profiles query notice for companies:", error);
          setCompanies([]);
        }
      } catch (err) {
        console.error("Error loading companies from Supabase:", err);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    }

    loadCompanies();
  }, []);

  // Available contract options for filter
  const contractOptions = [
    'All Contracts',
    'Medical Specimen',
    'On-Demand',
    'Scheduled Cargo Routes',
    'Pharmacy Delivery',
    'E-Commerce',
    'Same-Day Freight'
  ];

  const handleClearFilters = () => {
    setSearchTerm('');
    setStateFilter('');
    setContractFilter('All Contracts');
  };

  const dynamicLocationSuggestions = useMemo(() => {
    const list = [...LOCATION_SUGGESTIONS];
    companies.forEach(c => {
      if (c.city && c.state_code) {
        const item = `${c.city}, ${c.state_code}`;
        if (!list.includes(item)) list.unshift(item);
      }
    });
    if (!stateFilter.trim()) return list.slice(0, 8);
    const q = stateFilter.toLowerCase().trim();
    return list.filter(item => item.toLowerCase().includes(q)).slice(0, 10);
  }, [companies, stateFilter]);

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch = 
      c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const filterLoc = stateFilter.trim().toLowerCase();
    const matchesState = !filterLoc ||
      (c.state && c.state.toLowerCase().includes(filterLoc)) ||
      (c.state_code && c.state_code.toLowerCase().includes(filterLoc)) ||
      (c.city && c.city.toLowerCase().includes(filterLoc)) ||
      (c.city && (c.state_code || c.state) && `${c.city}, ${c.state_code || c.state}`.toLowerCase().includes(filterLoc));
    
    const matchesContract = contractFilter === 'All Contracts' || 
      (c.contract_types && c.contract_types.toLowerCase().includes(contractFilter.toLowerCase()));

    return matchesSearch && matchesState && matchesContract;
  });

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, stateFilter, contractFilter]);

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedCompanies = filteredCompanies.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany) return;

    const targetUserId = selectedCompany.user_id || selectedCompany.id;

    // Build notification record for Company's Supabase Inbox
    const notifPayload = {
      user_id: targetUserId,
      title: `Contract Courier Inquiry from ${contactForm.name || 'Independent Driver'}`,
      message: `Driver Name: ${contactForm.name}\nEmail: ${contactForm.email}\nPhone: ${contactForm.phone || 'N/A'}\nVehicle Type: ${contactForm.vehicle}\n\nMessage / Pitch:\n${contactForm.message}`,
      category: 'Dispatch Inquiry',
      unread: true,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('notifications').insert([notifPayload]);
      if (error) {
        console.warn("Supabase notification insert warning:", error);
        // Fallback retry without extra fields
        await supabase.from('notifications').insert([{
          user_id: targetUserId,
          title: `Contract Courier Inquiry from ${contactForm.name || 'Driver'}`,
          message: contactForm.message || 'Driver contacted you from Companies Directory.',
          unread: true
        }]);
      }
    } catch (err) {
      console.warn("Could not save notification to Supabase:", err);
    }

    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setSelectedCompany(null);
      setContactForm({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        vehicle: currentUser?.vehicle || 'Cargo Van',
        message: ''
      });
    }, 2500);
  };

  return (
    <>

      {/* Full-Width Background Image Hero Section */}
      <section className="relative bg-slate-950 text-white py-20 sm:py-28 border-b border-slate-800 overflow-hidden">
        {/* Full-Screen Background Image */}
        <img
          src={heroFleetImg}
          alt="Active Courier Companies Background"
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
            <Building className="w-4 h-4 text-rose-400" />
            <span>Hiring Directory</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-serif-heading leading-tight max-w-3xl mx-auto">
            Partner with Active <br /><span className="text-rose-500 italic font-serif-heading">Courier Companies</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base font-normal max-w-2xl mx-auto leading-relaxed">
            Connect directly with delivery, medical logistics, and expedited freight companies hiring independent owner-operator drivers. Filter profiles by state or contract type and reach out instantly.
          </p>

          {/* Centered Floating Metric Glass Cards */}
          <div className="pt-4 grid grid-cols-3 gap-3 max-w-2xl mx-auto">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 shadow-xl p-4 rounded-2xl text-center hover:bg-white/15 transition-all">
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{companies.length}</div>
              <div className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider mt-1">Total Partners</div>
            </div>

            <div className="backdrop-blur-md bg-white/10 border border-white/20 shadow-xl p-4 rounded-2xl text-center hover:bg-white/15 transition-all">
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">85+</div>
              <div className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider mt-1">Open Seats</div>
            </div>

            <div className="backdrop-blur-md bg-white/10 border border-white/20 shadow-xl p-4 rounded-2xl text-center hover:bg-white/15 transition-all">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">6+</div>
              <div className="text-[10px] font-extrabold text-slate-200 uppercase tracking-wider mt-1">Active States</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Filter and Companies List */}
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Advanced Filter panel */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0b132b] border-b border-slate-100 pb-3">
              <SlidersHorizontal className="w-4 h-4 text-rose-600" />
              <span>Filter Courier Companies</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search by company name, city or keyword..."
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

              {/* Contract Select */}
              <div className="w-full">
                <CustomSelect
                  options={contractOptions}
                  value={contractFilter}
                  onChange={(val) => setContractFilter(val)}
                  placeholder="All Contract Specializations"
                  icon={Building2}
                  searchable={false}
                  buttonClassName="py-2.5"
                />
              </div>
            </div>

            {/* Clear Filters helper */}
            {(searchTerm || stateFilter || contractFilter !== 'All Contracts') && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 font-medium">
                  Found {filteredCompanies.length} matching company profiles
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
            <div className="bg-white rounded-3xl p-16 text-center space-y-4 border border-slate-200/90 shadow-sm flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
              <p className="text-xs font-extrabold text-[#0b132b] uppercase tracking-wider">Loading Courier Companies Directory...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
              <Building2 className="w-14 h-14 text-slate-300 mx-auto" />
              <h3 className="text-xl font-bold text-[#0b132b] font-serif-heading">No Courier Companies Listed Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                No courier logistics companies match your filter criteria or have registered on RouteK9 yet. Registered company profiles will appear here as soon as they complete their business setup.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2 mt-2"
              >
                <span>Reset Search Filters</span>
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedCompanies.map((c) => {
                // Get initials
                const initials = c.company_name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <article 
                    key={c.user_id} 
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Logo and Headings */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center font-serif-heading font-bold text-rose-600 text-lg shadow-2xs">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-[#0b132b] truncate font-serif-heading">{c.company_name}</h3>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{[c.city, c.state].filter(Boolean).join(', ')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Detail metrics list */}
                      <div className="bg-slate-50/50 rounded-2xl p-3.5 space-y-2.5 text-xs border border-slate-100">
                        {c.contract_types && (
                          <div className="grid grid-cols-[80px_1fr] gap-2">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Contracts</span>
                            <span className="text-slate-800 font-bold">{c.contract_types}</span>
                          </div>
                        )}
                        {c.service_area && (
                          <div className="grid grid-cols-[80px_1fr] gap-2 border-t border-slate-100/80 pt-2.5">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Area</span>
                            <span className="text-slate-800 font-bold">{c.service_area}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {c.description && (
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-4 pt-1">
                          {c.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 pt-5 mt-4 border-t border-slate-100">
                      {/* Action trigger: Contact */}
                      <button
                        onClick={() => handleContactCompany(c)}
                        className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Contact Company</span>
                      </button>

                      {/* Website external link */}
                      {c.website && (
                        <a
                          href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>Visit Website</span>
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
              </div>

              {/* Pagination Controls */}
              {filteredCompanies.length > itemsPerPage && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/80">
                  <div className="text-xs font-semibold text-slate-500">
                    Showing <span className="font-extrabold text-slate-900">{((safePage - 1) * itemsPerPage) + 1}</span> to{' '}
                    <span className="font-extrabold text-slate-900">{Math.min(safePage * itemsPerPage, filteredCompanies.length)}</span> of{' '}
                    <span className="font-extrabold text-slate-900">{filteredCompanies.length}</span> companies
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.max(prev - 1, 1));
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                      disabled={safePage === 1}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                      title="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        if (
                          totalPages > 7 &&
                          pageNum !== 1 &&
                          pageNum !== totalPages &&
                          Math.abs(pageNum - safePage) > 1
                        ) {
                          if (pageNum === 2 || pageNum === totalPages - 1) {
                            return <span key={pageNum} className="text-xs text-slate-400 px-1 font-bold">...</span>;
                          }
                          return null;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => {
                              setCurrentPage(pageNum);
                              window.scrollTo({ top: 350, behavior: 'smooth' });
                            }}
                            className={`w-8 h-8 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                              safePage === pageNum
                                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => {
                        setCurrentPage(prev => Math.min(prev + 1, totalPages));
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                      disabled={safePage >= totalPages}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
                      title="Next Page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Premium Contact Dialog Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-4 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
            
            <button
              onClick={() => setSelectedCompany(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {contactSuccess ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
                <h3 className="text-xl font-bold text-[#0b132b] font-serif-heading">Message Sent!</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Your message has been sent to <strong>{selectedCompany.company_name}</strong>. The company representative will contact you via email or phone shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600">Send Inquiry</div>
                  <h3 className="text-lg font-bold text-[#0b132b] font-serif-heading leading-snug">
                    Contact {selectedCompany.company_name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Introduce yourself as an independent contractor driver to submit your credentials.
                  </p>
                </div>

                <form onSubmit={handleContactSubmit} className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                    <input
                      required
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                      <input
                        required
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
                      <PhoneInput
                        country={'us'}
                        value={contactForm.phone}
                        onChange={(val) => setContactForm({ ...contactForm, phone: val })}
                        inputStyle={{
                          width: '100%',
                          height: '38px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: '#f8fafc',
                          borderColor: '#e2e8f0',
                          borderRadius: '0.75rem',
                          paddingLeft: '44px',
                          color: '#1e293b'
                        }}
                        buttonStyle={{
                          backgroundColor: '#f8fafc',
                          borderColor: '#e2e8f0',
                          borderTopLeftRadius: '0.75rem',
                          borderBottomLeftRadius: '0.75rem',
                          paddingLeft: '2px'
                        }}
                        dropdownStyle={{
                          borderRadius: '0.75rem',
                          zIndex: 1000
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vehicle Type</label>
                    <select
                      value={contactForm.vehicle}
                      onChange={(e) => setContactForm({ ...contactForm, vehicle: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Cargo Van">Cargo Van / Sprinter</option>
                      <option value="Box Truck">Box Truck (12ft - 26ft)</option>
                      <option value="Sedan / Hybrid">Sedan / Hybrid Crossover</option>
                      <option value="SUV / Pickup">SUV / Pickup Truck</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Message / Pitch</label>
                    <textarea
                      required
                      rows={3}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Hi, I am interested in your routed contracts. I am HIPAA certified and have 3 years of courier experience..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 mt-2 rounded-xl bg-[#0b132b] hover:bg-[#1a264a] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
