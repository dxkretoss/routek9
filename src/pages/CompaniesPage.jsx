import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MOCK_COMPANIES } from '../data/mockCompanies';
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
  Building
} from 'lucide-react';

import heroBgPattern from '../assets/hero_bg_pattern.png';
import heroFleetImg from '../assets/hero_fleet_trucks.png';

export default function CompaniesPage({ currentUser, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [contractFilter, setContractFilter] = useState('All Contracts');
  const [selectedCompany, setSelectedCompany] = useState(null); // for Contact modal
  const [contactForm, setContactForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    vehicle: currentUser?.vehicle || 'Cargo Van',
    message: ''
  });
  const [contactSuccess, setContactSuccess] = useState(false);

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

  const filteredCompanies = MOCK_COMPANIES.filter((c) => {
    const matchesSearch = 
      c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesState = !stateFilter || (c.state && c.state.toUpperCase() === stateFilter.toUpperCase());
    
    const matchesContract = contractFilter === 'All Contracts' || 
      (c.contract_types && c.contract_types.toLowerCase().includes(contractFilter.toLowerCase()));

    return matchesSearch && matchesState && matchesContract;
  });

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setSelectedCompany(null);
      setContactForm({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        phone: '',
        vehicle: currentUser?.vehicle || 'Cargo Van',
        message: ''
      });
    }, 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900 font-sans selection:bg-rose-600 selection:text-white">
      <Navbar currentUser={currentUser} onLogout={onLogout} />

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
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{MOCK_COMPANIES.length}</div>
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                />
              </div>

              {/* State Filter */}
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Filter by state code (e.g. TX, CA)"
                  maxLength={2}
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
                />
              </div>

              {/* Contract Select */}
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <select
                  value={contractFilter}
                  onChange={(e) => setContractFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all appearance-none cursor-pointer"
                >
                  {contractOptions.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
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
          {filteredCompanies.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-xl font-bold text-[#0b132b] font-serif-heading">No companies match your filters</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try widening your search terms or clearing state filters to view nationwide opportunities.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((c) => {
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
                        onClick={() => setSelectedCompany(c)}
                        className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Contact Company</span>
                      </button>

                      {/* Website external link */}
                      {c.website && (
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-white"
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
          )}

        </div>
      </main>

      {/* Footer */}
      <Footer />

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
                      <input
                        required
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        placeholder="(555) 555-5555"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
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
    </div>
  );
}
