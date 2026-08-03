import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Search,
  Eye,
  User,
  Mail,
  Phone,
  X,
  Calendar,
  ShieldCheck,
  Package,
  AlertTriangle,
  Loader2,
  ChevronDown,
  Truck,
  CheckCircle2,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminCompanyList({ searchQuery, setSearchQuery }) {
  const [companies, setCompanies] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'routes'
  const [selectedRouteModal, setSelectedRouteModal] = useState(null);
  const [selectedCompanyModal, setSelectedCompanyModal] = useState(null);
  const [activeDriverModal, setActiveDriverModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  function getFriendlyZoneName(stop, stopsList = []) {
    if (!stop) return '';
    if (stop.zoneName) return stop.zoneName;
    if (!stop.zoneId) return '';
    if (stop.zoneId.startsWith('zone-')) {
      return stop.zoneId.replace('zone-', 'Zone ');
    }
    const uniqueZoneIds = Array.from(new Set(stopsList.map(s => s.zoneId).filter(Boolean)));
    const index = uniqueZoneIds.indexOf(stop.zoneId);
    return index >= 0 ? `Zone ${index + 1}` : 'Zone';
  }

  function getCompanyInitials(name) {
    if (!name) return 'C';
    const cleanName = name.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  // Load Company Profiles from Supabase & localStorage
  const loadCompanies = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profiles with Role = 'company'
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'company')
        .order('created_at', { ascending: false });

      // Read deactivated list from localStorage for instant sync
      const deactivatedList = JSON.parse(localStorage.getItem('rk9_deactivated_drivers') || '[]');

      const list = (profilesData || []).map((p) => {
        const isDeactivated = p.status === 'INACTIVE' ||
          deactivatedList.includes(p.email?.toLowerCase()) ||
          deactivatedList.includes(p.id);

        return {
          ...p,
          company_name: p.full_name || p.company_name || p.email?.split('@')[0] || 'Company',
          city: p.city || 'Houston',
          state_code: p.state_code || 'TX',
          phone: p.phone || '',
          status: isDeactivated ? 'INACTIVE' : 'ACTIVE'
        };
      });

      // 2. Fetch transactions table
      let rawTxs = [];
      try {
        const { data: txsData } = await supabase.from('transactions').select('*');
        rawTxs = txsData || [];
      } catch (txErr) {
        console.warn("Could not load transactions in AdminCompanyList:", txErr);
      }

      const getSubscriptionDetails = (userId, email) => {
        const userSubs = rawTxs.filter(tx =>
          tx.status === 'Succeeded' &&
          (tx.course_id === 'pro-monthly' || tx.course_id === 'pro-yearly' || tx.course_id?.includes('pro')) &&
          ((tx.user_id && String(tx.user_id) === String(userId)) || (tx.email && email && tx.email.toLowerCase() === email.toLowerCase()))
        );

        if (userSubs.length > 0) {
          userSubs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          const latestSub = userSubs[0];
          const createdTime = new Date(latestSub.created_at).getTime();
          const isYearly = latestSub.course_id === 'pro-yearly' || latestSub.description?.toLowerCase().includes('yearly') || latestSub.amount?.includes('299');
          const validityPeriod = isYearly ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
          const msLeft = createdTime + validityPeriod - Date.now();
          const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

          if (msLeft > 0) {
            return {
              isPro: true,
              plan: isYearly ? 'Pro (Yearly)' : 'Pro (Monthly)',
              subscribedAt: new Date(createdTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              nextRenewal: new Date(createdTime + validityPeriod).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              daysLeft,
              amountPaid: latestSub.amount || (isYearly ? '$299.00' : '$29.00')
            };
          }
        }

        return {
          isPro: false,
          plan: 'Free',
          subscribedAt: null,
          nextRenewal: null,
          daysLeft: 0,
          amountPaid: '$0.00'
        };
      };

      const finalList = list.map((c) => {
        const sub = getSubscriptionDetails(c.id, c.email);
        return {
          ...c,
          membership: sub.isPro ? 'Pro' : 'Free',
          subscription: sub
        };
      });

      setCompanies(finalList);

      // Fetch corporate routes
      try {
        const { data: routesData, error: routesErr } = await supabase
          .from('routes')
          .select('*')
          .not('company_id', 'is', null)
          .order('created_at', { ascending: false });

        if (!routesErr && routesData) {
          const mappedRoutes = routesData.map(r => {
            const creator = finalList.find(c => c.id === r.company_id || c.id === r.user_id);
            return {
              id: r.id,
              title: r.title || 'Corporate Dispatched Route',
              companyId: r.company_id || r.user_id,
              companyName: creator ? creator.company_name : 'Partner Company',
              stopsCount: r.stops_count || (r.stops_data ? r.stops_data.length : 0),
              distanceMiles: r.distance_miles || 0,
              durationMinutes: r.duration_minutes || 0,
              createdAt: r.created_at,
              stops: r.stops_data || []
            };
          });
          setRoutes(mappedRoutes);
        }
      } catch (rErr) {
        console.warn("Could not load corporate routes in AdminCompanyList:", rErr);
      }
    } catch (err) {
      console.warn("Admin company data load warning:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  // Account Access Status Change Handler (ACTIVE vs INACTIVE)
  const handleAccountStatusChange = async (companyId, companyEmail, newStatus) => {
    setUpdatingId(companyId);
    try {
      // 1. Update local state
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: newStatus } : c));
      if (selectedCompanyModal && selectedCompanyModal.id === companyId) {
        setSelectedCompanyModal(prev => ({ ...prev, status: newStatus }));
      }

      // 2. Update Supabase profiles table
      try {
        const isActiveBool = newStatus === 'ACTIVE';
        await supabase.from('profiles').update({
          status: newStatus,
          is_active: isActiveBool
        }).eq('id', companyId);
      } catch (sbErr) {
        console.warn("Supabase profile status update error:", sbErr);
      }

      // 3. Sync to localStorage for instant auth enforcement
      try {
        const deactivatedList = JSON.parse(localStorage.getItem('rk9_deactivated_drivers') || '[]');
        let updated = [];
        const cleanEmail = companyEmail ? companyEmail.toLowerCase() : '';

        if (newStatus === 'INACTIVE') {
          updated = Array.from(new Set([...deactivatedList, cleanEmail, companyId]));
        } else {
          updated = deactivatedList.filter(item => item !== cleanEmail && item !== companyId);
        }
        localStorage.setItem('rk9_deactivated_drivers', JSON.stringify(updated));
      } catch (e) {
        console.warn("LocalStorage status sync error:", e);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter companies based on search term
  const filteredCompanies = companies.filter((c) => {
    const q = (searchQuery || '').toLowerCase();
    const name = (c.company_name || c.full_name || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const city = (c.city || '').toLowerCase();
    const state = (c.state_code || '').toLowerCase();

    return name.includes(q) || email.includes(q) || city.includes(q) || state.includes(q);
  });

  const filteredRoutes = routes.filter((r) => {
    const q = (searchQuery || '').toLowerCase();
    return (
      (r.title || '').toLowerCase().includes(q) ||
      (r.companyName || '').toLowerCase().includes(q) ||
      (r.id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-serif-heading tracking-tight">
            Company Management
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage registered companies, monitor corporate dispatched routes, & access permissions
          </p>
        </div>
        <button
          onClick={loadCompanies}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all ${activeTab === 'directory'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Company Directory
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all ${activeTab === 'routes'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Corporate Dispatched Routes ({routes.length})
        </button>
      </div>

      {/* Search Filter Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={
              activeTab === 'directory'
                ? "Search by company name, email, city, or state..."
                : "Search routes by ID, title, or company..."
            }
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-2xs"
          />
        </div>
      </div>

      {activeTab === 'directory' ? (
        /* Directory Tab Content */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Corporate Accounts</h3>
              <p className="text-xs text-slate-400 font-medium">Logistics & courier dispatching partners</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-full border border-rose-200">
              {filteredCompanies.length} Companies Listed
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading company profiles...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-16 text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No companies found</p>
              <p className="text-xs text-slate-400 mt-1">Try refining your search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Company Name</th>
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Date Joined</th>
                    <th className="px-6 py-4 text-center">Account Access</th>
                    <th className="px-6 py-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCompanies.map((comp) => {
                    const isInactive = comp.status === 'INACTIVE';
                    return (
                      <tr key={comp.id} className={`hover:bg-slate-50/60 transition-colors ${isInactive ? 'bg-rose-50/20' : ''}`}>
                        {/* Company Name & Email */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                              {getCompanyInitials(comp.company_name)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 block truncate">{comp.company_name}</span>
                              <span className="text-[10px] text-slate-400 font-medium block truncate">{comp.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${comp.membership === 'Pro' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {comp.membership || 'Free'}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {comp.city ? `${comp.city}, ${comp.state_code}` : 'TX, USA'}
                        </td>

                        {/* Date Joined */}
                        <td className="px-6 py-4 text-slate-400 font-semibold">
                          {comp.created_at ? new Date(comp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jul 30, 2026'}
                        </td>

                        {/* Account Access Toggle */}
                        <td className="px-6 py-4 text-center">
                          <button
                            disabled={updatingId === comp.id}
                            onClick={() => handleAccountStatusChange(comp.id, comp.email, isInactive ? 'ACTIVE' : 'INACTIVE')}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all tracking-wider ${isInactive
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              } disabled:opacity-50`}
                          >
                            {updatingId === comp.id ? 'Updating...' : isInactive ? 'Deactivated' : 'Active'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedCompanyModal(comp)}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold text-[10px] shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Routes Tab Content */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Dispatched Routes Monitor</h3>
              <p className="text-xs text-slate-400 font-medium">Saved corporate dispatches & delivery zone plans</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-full border border-rose-200">
              {filteredRoutes.length} Corporate Routes
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading dispatched routes...</p>
            </div>
          ) : filteredRoutes.length === 0 ? (
            <div className="p-16 text-center">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No dispatched routes found</p>
              <p className="text-xs text-slate-400 mt-1">No company has planned routes yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Route ID</th>
                    <th className="px-6 py-4">Dispatched By</th>
                    <th className="px-6 py-4">Route Title</th>
                    <th className="px-6 py-4">Stops</th>
                    <th className="px-6 py-4">Distance</th>
                    <th className="px-6 py-4">Drive Time</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRoutes.map((route) => (
                    <tr key={route.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-rose-600">{route.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 truncate max-w-[120px]">{route.companyName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 truncate max-w-[180px]">{route.title}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{route.stopsCount} stops</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">{route.distanceMiles} mi</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">{route.durationMinutes} min</td>
                      <td className="px-6 py-4 text-slate-400 font-semibold">{new Date(route.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedRouteModal(route)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold text-[10px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Stops</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Selected Company Details Modal */}
      {selectedCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start text-left">
              <div className="flex items-center gap-3.5 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white font-serif-heading">
                    {selectedCompanyModal.company_name || selectedCompanyModal.full_name || 'Logistics Company'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-300 font-medium">{selectedCompanyModal.email}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-[10px] uppercase border border-rose-500/30">
                      Company Profile
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompanyModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 custom-modal-scrollbar">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-left">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Account Access Permission
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                    {selectedCompanyModal.status === 'INACTIVE' ? (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Deactivated (Login Blocked)
                      </span>
                    ) : (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Active Member Account
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCompanyModal.status || 'ACTIVE'}
                    onChange={(e) => handleAccountStatusChange(selectedCompanyModal.id, selectedCompanyModal.email, e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 text-xs font-extrabold uppercase border rounded-xl bg-white border-slate-300 cursor-pointer focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">DEACTIVATED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Name</div>
                  <div className="font-extrabold text-slate-900">{selectedCompanyModal.company_name || selectedCompanyModal.full_name || 'N/A'}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Support Phone</div>
                  <div className="font-extrabold text-slate-900">{selectedCompanyModal.phone || 'Not provided'}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Office Location</div>
                  <div className="font-extrabold text-slate-900">{selectedCompanyModal.city ? `${selectedCompanyModal.city}, ${selectedCompanyModal.state_code}` : 'USA'}</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Registered</div>
                  <div className="font-extrabold text-slate-900">
                    {selectedCompanyModal.created_at ? new Date(selectedCompanyModal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jul 30, 2026'}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">PRO Plan & Billing Details</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1 text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Membership status</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block ${selectedCompanyModal.membership === 'Pro' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {selectedCompanyModal.membership === 'Pro' ? 'Pro Plan' : 'Free Starter'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100/80 space-y-1 text-left">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">Logistics Dispatch Status</div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  This company has full administrative authority to post dispatch orders on the RouteK9 Marketplace and accept bids from certified contract drivers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Route Detail Modal */}
      {selectedRouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Corporate Dispatched Route</span>
                <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading flex items-center gap-1.5">
                  <span>{selectedRouteModal.title}</span>
                  <span className="font-mono text-xs text-rose-600 font-bold">({selectedRouteModal.id})</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedRouteModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Dispatched By</span>
                <span className="font-extrabold text-[#0b132b] truncate block">{selectedRouteModal.companyName}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Distance</span>
                <span className="font-extrabold text-[#0b132b]">{selectedRouteModal.distanceMiles} mi</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Drive Time</span>
                <span className="font-extrabold text-[#0b132b]">{selectedRouteModal.durationMinutes} min</span>
              </div>
            </div>

            {selectedRouteModal.stops && selectedRouteModal.stops.length > 0 && (
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stop Addresses & Dispatches ({selectedRouteModal.stops.length} stops):</span>
                <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedRouteModal.stops.map((s, idx) => (
                    <li key={idx} className="flex items-start justify-between gap-3 text-[11px] font-semibold text-slate-700 bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center shrink-0 font-bold mt-0.5">{s.step || idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-slate-800 font-semibold" title={s.label}>{s.label}</div>
                          {(s.zoneName || s.zoneId || s.driverName) && (
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {(s.zoneName || s.zoneId) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-rose-50 text-[9px] font-bold text-rose-700 border border-rose-100">
                                  {getFriendlyZoneName(s, selectedRouteModal.stops || [])}
                                </span>
                              )}
                              {s.driverName && (
                                <button
                                  type="button"
                                  onClick={() => setActiveDriverModal({ name: s.driverName, phone: s.driverPhone })}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-50 text-[9px] font-bold text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors"
                                  title="Click to view driver contact details"
                                >
                                  {s.driverName}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border shrink-0 ${s.status === 'complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        s.status === 'ongoing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                        {s.status || 'pending'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Driver Info Modal Popup */}
      {activeDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0b132b] uppercase tracking-wider">Driver Contact Details</h3>
              <button
                type="button"
                onClick={() => setActiveDriverModal(null)}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-base">
                👤
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">{activeDriverModal.name}</h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Contract Driver</span>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</span>
                <span className="font-extrabold text-slate-800 text-xs">{activeDriverModal.phone || 'No phone number provided'}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {activeDriverModal.phone && (
                <a
                  href={`tel:${activeDriverModal.phone}`}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <span>Call Driver</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setActiveDriverModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
