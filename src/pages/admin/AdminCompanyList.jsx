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
  ChevronUp,
  Globe,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPhoneNumber } from './components/AdminComponents';

export default function AdminCompanyList({ searchQuery = '', setSearchQuery }) {
  const [companies, setCompanies] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'routes'
  const [selectedRouteModal, setSelectedRouteModal] = useState(null);
  const [selectedCompanyModal, setSelectedCompanyModal] = useState(null);
  const [activeDriverModal, setActiveDriverModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedCompanyRoutesModal, setSelectedCompanyRoutesModal] = useState(null);
  const [expandedRouteId, setExpandedRouteId] = useState(null);

  // Server-Side Range Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCompaniesCount, setTotalCompaniesCount] = useState(64);
  const itemsPerPage = 10;

  // Reset search when active tab changes
  useEffect(() => {
    if (setSearchQuery) setSearchQuery('');
  }, [activeTab]);

  // Reset search when leaving/unmounting company list page
  useEffect(() => {
    return () => {
      if (setSearchQuery) setSearchQuery('');
    };
  }, []);

  // Group Corporate Dispatched Routes by Company
  const groupedRoutesByCompany = React.useMemo(() => {
    const groupsMap = {};
    routes.forEach((r) => {
      const key = (r.companyId || r.companyName || 'unknown').toLowerCase();
      if (!groupsMap[key]) {
        const matchingCompany = companies.find(c =>
          (r.companyId && String(c.id) === String(r.companyId)) ||
          (c.company_name && c.company_name.toLowerCase() === key) ||
          (c.full_name && c.full_name.toLowerCase() === key) ||
          (c.email && c.email.toLowerCase() === key)
        );
        groupsMap[key] = {
          key,
          companyName: matchingCompany?.company_name || r.companyName || 'Partner Company',
          companyEmail: matchingCompany?.email || '',
          companyAvatar: matchingCompany?.avatar_url || null,
          companyMembership: matchingCompany?.membership || 'Free',
          companyId: r.companyId,
          routes: []
        };
      }
      groupsMap[key].routes.push(r);
    });

    const groups = Object.values(groupsMap).map(g => {
      g.routes.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      const latest = g.routes[0];
      return {
        ...g,
        latestRoute: latest,
        latestCreatedAt: latest?.createdAt
      };
    });

    return groups.sort((a, b) => new Date(b.latestCreatedAt || 0) - new Date(a.latestCreatedAt || 0));
  }, [routes, companies]);

  const filteredGroupedRoutes = groupedRoutesByCompany.filter(g => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.companyName.toLowerCase().includes(q) ||
      g.routes.some(r => r.id?.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q))
    );
  });

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

  const pageCacheRef = React.useRef({});

  // Background hydration for transactions, company_drivers, and routes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [txsRes, cdRes, routesRes] = await Promise.allSettled([
          supabase.from('transactions').select('amount, status, course_id, user_id, email, created_at').eq('status', 'Succeeded').limit(200),
          supabase.from('company_drivers').select('company_id, full_name, name, email, phone').eq('status', 'ACTIVE').limit(200),
          supabase.from('routes').select('id, title, company_id, user_id, stops_count, distance_miles, duration_minutes, created_at').not('company_id', 'is', null).order('created_at', { ascending: false }).limit(50)
        ]);

        if (!isMounted) return;

        if (routesRes.status === 'fulfilled' && routesRes.value?.data) {
          const mappedRoutes = routesRes.value.data.map(r => ({
            id: r.id,
            title: r.title || 'Corporate Dispatched Route',
            companyId: r.company_id || r.user_id,
            companyName: 'Partner Company',
            stopsCount: r.stops_count || 0,
            distanceMiles: r.distance_miles || 0,
            durationMinutes: r.duration_minutes || 0,
            createdAt: r.created_at,
            stops: []
          }));
          setRoutes(mappedRoutes);
        }
      } catch (e) {
        console.warn("Background company hydration notice:", e);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load Company Profiles from Supabase & Cache
  const loadCompanies = async (pageToLoad = currentPage) => {
    const p = typeof pageToLoad === 'number' ? pageToLoad : currentPage;
    setCurrentPage(p);
    const cacheKey = `comp_${p}_${(searchQuery || '').trim().toLowerCase()}`;

    // Instant cache hit
    if (pageCacheRef.current[cacheKey]) {
      setCompanies(pageCacheRef.current[cacheKey].data);
      if (typeof pageCacheRef.current[cacheKey].count === 'number') {
        setTotalCompaniesCount(pageCacheRef.current[cacheKey].count);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    const from = (p - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    try {
      // 1. Fetch company_profiles metadata and profiles in parallel
      const [metaRes, profRes] = await Promise.allSettled([
        supabase
          .from('company_profiles')
          .select('user_id, company_name, contact_name, city, state, phone, contact_email, website, contract_types, service_area, description')
          .limit(200),
        supabase
          .from('profiles')
          .select('id, email, role, full_name, city, state_code, phone, status, is_active, created_at, experience, dot_number, website_url, ready_to_work')
          .eq('role', 'company')
          .order('created_at', { ascending: false })
          .range(from, to)
      ]);

      const companyMeta = (metaRes.status === 'fulfilled' && metaRes.value?.data) ? metaRes.value.data : [];
      const metaMap = companyMeta.reduce((acc, curr) => {
        const key = curr.user_id || curr.id;
        if (key) acc[key] = curr;
        return acc;
      }, {});

      const rawProfiles = (profRes.status === 'fulfilled' && profRes.value?.data) ? profRes.value.data : [];

      const list = rawProfiles.map((p) => {
        const meta = metaMap[p.id] || {};
        const isDeactivated = p.status === 'INACTIVE' || p.is_active === false;

        return {
          ...p,
          company_name: meta.company_name || p.full_name || p.company_name || p.email?.split('@')[0] || 'Company',
          contact_name: meta.contact_name || p.full_name || 'Primary Contact',
          city: p.city || meta.city || 'Houston',
          state_code: p.state_code || meta.state || 'TX',
          phone: p.phone || meta.phone || '',
          contact_email: meta.contact_email || p.email || '',
          status: isDeactivated ? 'INACTIVE' : 'ACTIVE',
          ready_to_work: p.ready_to_work !== false,
          website_url: p.website_url || meta.website || '',
          contract_types: meta.contract_types || p.vehicle || p.contract_types || 'Medical Specimen, Scheduled Routes',
          service_area: meta.service_area || p.availability || p.service_area || 'Regional & Statewide Logistics',
          experience: p.experience || '',
          dot_number: p.dot_number || p.dotNumber || '',
          bio: meta.description || p.bio || p.description || '',
          membership: 'Free',
          subscription: { isPro: false, plan: 'Free', subscribedAt: null, nextRenewal: null, daysLeft: 0, amountPaid: '$0.00' },
          connectedDrivers: []
        };
      });

      pageCacheRef.current[cacheKey] = {
        data: list,
        count: totalCompaniesCount
      };

      setCompanies(list);
      setLoading(false);

      // Async background count
      if (p === 1) {
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'company')
          .then(res => {
            if (typeof res.count === 'number') {
              setTotalCompaniesCount(res.count);
              if (pageCacheRef.current[cacheKey]) {
                pageCacheRef.current[cacheKey].count = res.count;
              }
            }
          })
          .catch(() => { });
      }
    } catch (err) {
      console.warn("AdminCompanyList load error:", err);
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
          Company Directory ({totalCompaniesCount || 64})
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

      {activeTab === 'directory' ? (
        /* Directory Tab Content */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Corporate Accounts</h3>
              <p className="text-xs text-slate-400 font-medium">Logistics & courier dispatching partners</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by company name, email, city, or state..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-100 transition-all"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading Company Profiles...</p>
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
                            {comp.avatar_url ? (
                              <img
                                src={comp.avatar_url}
                                alt={comp.company_name}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {getCompanyInitials(comp.company_name)}
                              </div>
                            )}
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
                          <div className="flex items-center justify-end gap-2">
                            {(() => {
                              const compRoutes = routes.filter(r =>
                                (r.companyId && String(r.companyId) === String(comp.id)) ||
                                (r.company_id && String(r.company_id) === String(comp.id)) ||
                                (r.user_id && String(r.user_id) === String(comp.id)) ||
                                (r.companyEmail && comp.email && r.companyEmail.toLowerCase() === comp.email.toLowerCase()) ||
                                (r.email && comp.email && r.email.toLowerCase() === comp.email.toLowerCase())
                              ).sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));

                              return compRoutes.length > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedCompanyRoutesModal({
                                      companyName: comp.company_name,
                                      companyEmail: comp.email,
                                      companyAvatar: comp.avatar_url,
                                      routes: compRoutes
                                    });
                                  }}
                                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-[10px] shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Truck className="w-3 h-3 text-white" />
                                  <span>View Routes ({compRoutes.length})</span>
                                </button>
                              );
                            })()}
                            <button
                              onClick={() => setSelectedCompanyModal(comp)}
                              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold text-[10px] shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Details</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
            <div>
              Showing <span className="font-extrabold text-slate-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
              <span className="font-extrabold text-slate-900">{Math.min(currentPage * itemsPerPage, totalCompaniesCount || 64)}</span> of{' '}
              <span className="font-extrabold text-slate-900">{totalCompaniesCount || 64}</span> companies
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const prevP = Math.max(currentPage - 1, 1);
                  loadCompanies(prevP);
                }}
                disabled={currentPage === 1 || loading}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 font-black text-rose-600 text-xs shadow-2xs">
                Page {currentPage} of {Math.ceil((totalCompaniesCount || 64) / itemsPerPage) || 1}
              </div>

              <button
                onClick={() => {
                  const totalP = Math.ceil((totalCompaniesCount || 64) / itemsPerPage) || 1;
                  const nextP = Math.min(currentPage + 1, totalP);
                  loadCompanies(nextP);
                }}
                disabled={currentPage >= (Math.ceil((totalCompaniesCount || 64) / itemsPerPage) || 1) || loading}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Routes Tab Content */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Dispatched Routes Monitor</h3>
              <p className="text-xs text-slate-400 font-medium">Grouped by registered company with creation dates, timestamps, & stop histories</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search routes by ID, title, or company..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-100 transition-all"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading dispatched routes...</p>
            </div>
          ) : groupedRoutesByCompany.length === 0 ? (
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
                    <th className="px-6 py-4">Dispatched By</th>
                    <th className="px-6 py-4">Total Routes Dispatched</th>
                    <th className="px-6 py-4">Latest Route ID</th>
                    <th className="px-6 py-4">Latest Created Date & Time</th>
                    <th className="px-6 py-4">Latest Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredGroupedRoutes.map((group) => {
                    const latestRoute = group.latestRoute || group.routes[0];
                    const routeStops = latestRoute?.stops || [];
                    const completedCount = routeStops.filter(s => s.status === 'complete').length;
                    const ongoingCount = routeStops.filter(s => s.status === 'ongoing').length;
                    const allComplete = routeStops.length > 0 && completedCount === routeStops.length;
                    const anyOngoing = ongoingCount > 0 || completedCount > 0;
                    const overallStatus = latestRoute?.status || (allComplete ? 'complete' : anyOngoing ? 'ongoing' : 'pending');

                    const formattedTime = latestRoute?.createdAt
                      ? new Date(latestRoute.createdAt).toLocaleString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      : 'N/A';

                    return (
                      <tr key={group.key} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <div className="flex items-center gap-3">
                            {group.companyAvatar ? (
                              <img
                                src={group.companyAvatar}
                                alt={group.companyName}
                                className="w-8 h-8 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shadow-2xs shrink-0">
                                {getCompanyInitials(group.companyName)}
                              </div>
                            )}
                            <div>
                              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                <span>{group.companyName}</span>
                                {group.companyMembership === 'Pro' && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-300">
                                    ★ Pro
                                  </span>
                                )}
                              </div>
                              {group.companyEmail && (
                                <div className="text-[11px] text-slate-400 font-medium">{group.companyEmail}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-slate-800">
                          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-xs">
                            {group.routes.length} {group.routes.length === 1 ? 'Route' : 'Routes Dispatched'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-rose-600">
                          {latestRoute?.id || 'RTE-0000'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-semibold">
                          {formattedTime}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${String(overallStatus).toLowerCase() === 'complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            String(overallStatus).toLowerCase() === 'ongoing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {overallStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCompanyRoutesModal({
                                companyName: group.companyName,
                                routes: group.routes
                              });
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                          >
                            <span>View All Dispatched Routes ({group.routes.length})</span>
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
                  <div className="font-extrabold text-slate-900">{selectedCompanyModal.phone ? formatPhoneNumber(selectedCompanyModal.phone) : 'Not provided'}</div>
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

              {/* Directory Listing Pitch & Company Qualifications Card */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Directory Listing & Corporate Profile
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${selectedCompanyModal.ready_to_work !== false
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}>
                    {selectedCompanyModal.ready_to_work !== false ? '● Listed on Directory' : '○ Hidden from Directory'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Contract Types Offered</span>
                    <span className="font-extrabold text-slate-800">{selectedCompanyModal.contract_types || 'Medical Specimen, Scheduled Routes'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Service Area / Operating Region</span>
                    <span className="font-extrabold text-emerald-700">{selectedCompanyModal.service_area || 'Regional & Statewide Logistics'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">USDOT / MC Number</span>
                    <span className="font-extrabold text-slate-800">{selectedCompanyModal.dot_number || 'N/A'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Company Website URL</span>
                    <span className="font-extrabold text-slate-800 truncate block">
                      {selectedCompanyModal.website_url ? (
                        <a
                          href={selectedCompanyModal.website_url.startsWith('http') ? selectedCompanyModal.website_url : `https://${selectedCompanyModal.website_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>{selectedCompanyModal.website_url}</span>
                        </a>
                      ) : 'Not Provided'}
                    </span>
                  </div>
                </div>

                {selectedCompanyModal.bio ? (
                  <div className="pt-2 border-t border-rose-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Company Overview & Contracting Pitch Summary</span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                      {selectedCompanyModal.bio}
                    </p>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic pt-1">
                    No company overview pitch provided yet.
                  </div>
                )}
              </div>

              {/* Connected Fleet Drivers Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Connected Fleet Drivers ({selectedCompanyModal.connectedDrivers?.length || 0})
                </span>
                {selectedCompanyModal.connectedDrivers && selectedCompanyModal.connectedDrivers.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedCompanyModal.connectedDrivers.map((d, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1.5 border border-emerald-200">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{d.name} ({d.email || d.phone || 'Active Contract'})</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 font-medium py-1">
                    No drivers currently connected to this company fleet.
                  </div>
                )}
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

      {/* ── COMPANY ALL ROUTES MODAL ── */}
      {selectedCompanyRoutesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 font-extrabold text-base flex items-center justify-center text-white shrink-0">
                  {getCompanyInitials(selectedCompanyRoutesModal.companyName)}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white font-serif-heading flex items-center gap-2">
                    <span>{selectedCompanyRoutesModal.companyName}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold uppercase border border-rose-500/30">
                      {selectedCompanyRoutesModal.routes.length} Corporate {selectedCompanyRoutesModal.routes.length === 1 ? 'Route' : 'Routes'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">All corporate dispatches & delivery zone plans created by this company with date, time, & stop details</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCompanyRoutesModal(null);
                  setExpandedRouteId(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Routes List */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[75vh] text-left custom-modal-scrollbar">
              {selectedCompanyRoutesModal.routes.map((route, rIdx) => {
                const routeStops = route.stops || [];
                const completedCount = routeStops.filter(s => s.status === 'complete').length;
                const ongoingCount = routeStops.filter(s => s.status === 'ongoing').length;
                const allComplete = routeStops.length > 0 && completedCount === routeStops.length;
                const anyOngoing = ongoingCount > 0 || completedCount > 0;
                const statusText = route.status || (allComplete ? 'complete' : anyOngoing ? 'ongoing' : 'pending');

                const formattedDateTime = route.createdAt
                  ? new Date(route.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  : 'Date unavailable';

                const isExpanded = expandedRouteId === route.id;

                return (
                  <div
                    key={route.id || rIdx}
                    className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-3 shadow-xs hover:bg-slate-50/90 transition-all"
                  >
                    {/* Route Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            {route.id}
                          </span>
                          <h4 className="text-sm font-extrabold text-[#0b132b]">{route.title}</h4>
                        </div>
                        <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 pt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Dispatched: {formattedDateTime}</span>
                        </div>
                      </div>

                      <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-[10px] font-black uppercase border ${String(statusText).toLowerCase() === 'complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                        String(statusText).toLowerCase() === 'ongoing' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                        ● {statusText}
                      </span>
                    </div>

                    {/* Metrics Bar */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Stops</span>
                        <span className="font-extrabold text-[#0b132b]">{route.stopsCount || routeStops.length} Stops</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Distance</span>
                        <span className="font-extrabold text-[#0b132b]">{route.distanceMiles} mi</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Drive Time</span>
                        <span className="font-extrabold text-[#0b132b]">{route.durationMinutes} min</span>
                      </div>
                    </div>

                    {/* Expandable Stops Section */}
                    {routeStops.length > 0 && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => setExpandedRouteId(isExpanded ? null : route.id)}
                          className="w-full text-left px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <span>View Stop Details & Addresses ({routeStops.length} stops)</span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isExpanded && (
                          <div className="mt-2.5 bg-white p-3 rounded-2xl border border-slate-200 space-y-2 animate-fadeIn text-xs">
                            {(() => {
                              const hasZones = routeStops.some(s => s.zoneName || s.zoneId);

                              if (!hasZones) {
                                return (
                                  <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {routeStops.map((s, idx) => (
                                      <li key={idx} className="flex items-start justify-between gap-3 text-[11px] font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                                        <div className="flex items-start gap-2 min-w-0 flex-1">
                                          <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center shrink-0 font-bold mt-0.5">
                                            {s.step || idx + 1}
                                          </span>
                                          <div className="min-w-0 flex-1">
                                            <div className="truncate text-slate-800 font-semibold" title={s.label}>{s.label}</div>
                                            {s.driverName && (
                                              <button
                                                type="button"
                                                onClick={() => setActiveDriverModal({ name: s.driverName, phone: s.driverPhone })}
                                                className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white text-[9px] font-bold text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors mt-1"
                                              >
                                                {s.driverName}
                                              </button>
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
                                );
                              }

                              const zoneGroupsMap = {};
                              routeStops.forEach((s, idx) => {
                                const zName = getFriendlyZoneName(s, routeStops) || 'Unzoned';
                                if (!zoneGroupsMap[zName]) {
                                  zoneGroupsMap[zName] = {
                                    zoneName: zName,
                                    driverName: s.driverName || '',
                                    driverPhone: s.driverPhone || '',
                                    stops: []
                                  };
                                }
                                zoneGroupsMap[zName].stops.push({ ...s, originalIdx: idx });
                              });

                              const zoneGroups = Object.values(zoneGroupsMap);

                              return (
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                  {zoneGroups.map((group, gIdx) => (
                                    <div key={gIdx} className="bg-slate-50/80 rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2">
                                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-extrabold border border-rose-200">
                                            {group.zoneName}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-bold">
                                            ({group.stops.length} {group.stops.length === 1 ? 'stop' : 'stops'})
                                          </span>
                                        </div>
                                        {group.driverName && (
                                          <button
                                            type="button"
                                            onClick={() => setActiveDriverModal({ name: group.driverName, phone: group.driverPhone })}
                                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 cursor-pointer transition-colors"
                                          >
                                            <span>Driver: {group.driverName}</span>
                                          </button>
                                        )}
                                      </div>

                                      <ul className="space-y-1.5">
                                        {group.stops.map((s, idx) => (
                                          <li key={idx} className="flex items-start justify-between gap-2 text-[11px] font-semibold text-slate-700 bg-white p-2 rounded-lg border border-slate-200/60">
                                            <div className="flex items-start gap-2 min-w-0 flex-1">
                                              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center shrink-0 font-bold mt-0.5">{s.step || s.originalIdx + 1}</span>
                                              <span className="truncate block leading-snug" title={s.label}>{s.label}</span>
                                            </div>
                                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border shrink-0 ${s.status === 'complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                              s.status === 'ongoing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-slate-100 text-slate-600 border-slate-200'
                                              }`}>
                                              {s.status || 'pending'}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Active Driver Info Modal Popup (highest z-index to float over all open modals) */}
      {activeDriverModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
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
