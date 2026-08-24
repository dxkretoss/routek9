import React, { useState, useEffect } from 'react';
import {
  Truck,
  ShieldCheck,
  MapPin,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  DollarSign,
  FileText,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  X,
  Award,
  AlertTriangle,
  Calendar,
  Sparkles,
  Building2,
  Globe
} from 'lucide-react';
import { supabase, updateDriverVerification, fetchAllRouteBids, updateBidStatus, fetchDriverCertifications } from '../../lib/supabase';
import { formatPhoneNumber } from './components/AdminComponents';

export default function AdminDriverList({ users = [], driversCount = 0, searchQuery, setSearchQuery, onRefresh }) {
  const [drivers, setDrivers] = useState([]);
  const [bids, setBids] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('drivers'); // 'drivers', 'routes', or 'bids'
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [selectedRouteModal, setSelectedRouteModal] = useState(null);
  const [selectedDriverModal, setSelectedDriverModal] = useState(null);
  const [driverCerts, setDriverCerts] = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [selectedDriverRoutesModal, setSelectedDriverRoutesModal] = useState(null);
  const [expandedRouteId, setExpandedRouteId] = useState(null);
  const [activeDriverModal, setActiveDriverModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, vehicleFilter]);
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

  // Group Saved Routes by Driver
  const groupedRoutesByDriver = React.useMemo(() => {
    const groupsMap = {};
    routes.forEach((r) => {
      const key = (r.user_id || r.driverName || 'unknown').toLowerCase();
      if (!groupsMap[key]) {
        const matchingDriver = drivers.find(d =>
          (r.user_id && String(d.id) === String(r.user_id)) ||
          (d.email && d.email.toLowerCase() === key) ||
          (d.full_name && d.full_name.toLowerCase() === key)
        );
        groupsMap[key] = {
          key,
          driverName: matchingDriver?.full_name || r.driverName || 'Route Driver',
          driverEmail: matchingDriver?.email || '',
          driverAvatar: matchingDriver?.avatar_url || matchingDriver?.avatar || matchingDriver?.profile_picture || null,
          driverMembership: matchingDriver?.membership || 'Free',
          userId: r.user_id,
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
  }, [routes, drivers]);

  const filteredGroupedRoutes = groupedRoutesByDriver.filter(g => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.driverName.toLowerCase().includes(q) ||
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

  const [totalDriversCount, setTotalDriversCount] = useState(driversCount || 295);

  // Load Driver Profiles (10 items per page range)
  const loadData = async (targetPage = currentPage) => {
    setLoading(true);
    setFetchError(null);
    try {
      const from = (targetPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('profiles')
        .select('id, email, role, full_name, created_at, updated_at, city, state_code, vehicle, dot_number, phone, is_active, status, experience, availability, has_cdl, ready_to_work, website_url', { count: 'exact' })
        .or('role.eq.driver,role.is.null')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        const q = searchQuery.trim();
        query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,city.ilike.%${q}%,state_code.ilike.%${q}%`);
      }

      if (vehicleFilter && vehicleFilter !== 'all') {
        query = query.ilike('vehicle', `%${vehicleFilter}%`);
      }

      const { data: pageProfiles, count: fetchedCount, error: pErr } = await query.range(from, to);

      if (pErr) throw pErr;

      if (fetchedCount !== null) {
        setTotalDriversCount(fetchedCount);
      }

      const pageItems = pageProfiles || [];

      // Format drivers for display
      const rawDrivers = pageItems.map((p) => {
        const isDeactivated = p.status === 'INACTIVE' || p.is_active === false;

        return {
          ...p,
          full_name: p.full_name || (p.email ? p.email.split('@')[0] : 'Driver'),
          vehicle: p.vehicle || 'Cargo Van',
          city: p.city || 'Houston',
          state_code: p.state_code || 'TX',
          phone: p.phone || '',
          verified: Boolean(p.verified || false),
          status: isDeactivated ? 'INACTIVE' : 'ACTIVE',
          ready_to_work: p.ready_to_work !== false,
          website_url: p.website_url || '',
          experience: p.experience || '1-3 Years',
          availability: p.availability || 'Immediate',
          has_cdl: Boolean(p.has_cdl || false),
          bio: p.bio || '',
          dot_number: p.dot_number || '',
          membership: p.membership || 'Free'
        };
      });

      setDrivers(rawDrivers);
      setLoading(false);

      // Secondary non-blocking background hydration (Routes & Bids)
      (async () => {
        try {
          // Route Bids
          const bidsData = await fetchAllRouteBids();
          setBids(bidsData || []);

          // Saved Routes
          const { data: routesData } = await supabase.from('routes').select('*').limit(50);
          if (routesData) {
            const driverIdsSet = new Set(rawDrivers.map(d => d.id));
            const driverOnlyRoutes = routesData.filter(r =>
              !r.company_id || driverIdsSet.has(r.user_id) || driverIdsSet.has(r.company_id)
            );
            setRoutes(driverOnlyRoutes.map(r => ({
              id: r.id,
              user_id: r.user_id,
              title: r.title || 'Saved Courier Route',
              driverName: r.driver_name || 'Solo Driver',
              vehicle: 'Cargo Van',
              stopsCount: r.stops_count || 0,
              distanceMiles: r.distance_miles || 0,
              durationMinutes: r.duration_minutes || 0,
              status: r.status || 'ACTIVE',
              stops: r.stops_data || [],
              createdAt: r.created_at
            })));
          }
        } catch (subErr) {
          console.warn("Background hydration notice:", subErr);
        }
      })();

    } catch (err) {
      console.warn("Admin data load warning:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(currentPage);
  }, [searchQuery, vehicleFilter]);

  // Fetch Certifications dynamically from Supabase database when modal opens
  useEffect(() => {
    if (selectedDriverModal?.id) {
      setCertsLoading(true);
      fetchDriverCertifications(selectedDriverModal.id)
        .then(certs => setDriverCerts(certs || []))
        .catch(err => {
          console.warn("Fetch certs notice:", err);
          setDriverCerts([]);
        })
        .finally(() => setCertsLoading(false));
    } else {
      setDriverCerts([]);
    }
  }, [selectedDriverModal?.id]);

  // Account Access Status Change Handler (ACTIVE vs INACTIVE)
  const handleAccountStatusChange = async (driverId, driverEmail, newStatus) => {
    setUpdatingId(driverId);
    try {
      // 1. Update State
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: newStatus } : d));
      if (selectedDriverModal && selectedDriverModal.id === driverId) {
        setSelectedDriverModal(prev => ({ ...prev, status: newStatus }));
      }

      // 2. Update Supabase profiles table
      try {
        const isActiveBool = newStatus === 'ACTIVE';
        await supabase.from('profiles').update({
          status: newStatus,
          is_active: isActiveBool
        }).eq('id', driverId);
      } catch (sbErr) {
        console.warn("Supabase profiles update warning:", sbErr);
      }

      // 3. Also update driver_profiles table
      try {
        await supabase.from('driver_profiles').upsert({
          id: driverId,
          status: newStatus
        });
      } catch (sbErr2) {
        console.warn("Supabase driver_profiles update warning:", sbErr2);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // 1-Click Verification Toggle Handler
  const handleToggleVerification = async (driverId, currentVerified) => {
    setUpdatingId(driverId);
    const newStatus = !currentVerified;
    const res = await updateDriverVerification(driverId, newStatus);
    if (res.success) {
      setDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, verified: newStatus } : d))
      );
      if (selectedDriverModal && selectedDriverModal.id === driverId) {
        setSelectedDriverModal(prev => ({ ...prev, verified: newStatus }));
      }
    }
    setUpdatingId(null);
  };

  // Bid Status Update Handler (Approve / Reject)
  const handleUpdateBid = async (bidId, newStatus) => {
    setUpdatingId(bidId);
    const res = await updateBidStatus(bidId, newStatus);
    if (res.success) {
      setBids((prev) =>
        prev.map((b) => (b.id === bidId ? { ...b, status: newStatus } : b))
      );
    }
    setUpdatingId(null);
  };

  // Filter Drivers
  const filteredDrivers = drivers.filter((d) => {
    if (!d) return false;
    const q = (searchQuery || '').trim().toLowerCase();
    const matchesSearch = !q
      ? true
      : (d.full_name || d.name || '').toLowerCase().includes(q) ||
      (d.email || '').toLowerCase().includes(q) ||
      (d.city || '').toLowerCase().includes(q) ||
      (d.state_code || d.state || '').toLowerCase().includes(q);

    const matchesVehicle = vehicleFilter === 'all' || (d.vehicle || '').toLowerCase().includes(vehicleFilter.toLowerCase());
    return matchesSearch && matchesVehicle;
  });

  // Pagination Calculations (10 drivers per page)
  const displayTotalCount = totalDriversCount || driversCount || 295;
  const totalPages = Math.ceil(displayTotalCount / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, displayTotalCount);
  const paginatedDrivers = drivers;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-serif-heading tracking-tight">
            Driver Management
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage registered contract drivers, monitor active delivery routes, & verify certifications
          </p>
        </div>
        <button
          onClick={() => loadData(currentPage)}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${activeTab === 'drivers'
            ? 'border-rose-600 text-rose-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Driver Directory ({displayTotalCount})
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${activeTab === 'routes'
            ? 'border-rose-600 text-rose-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Saved Routes ({routes.length})
        </button>
        {/* <button
          onClick={() => setActiveTab('bids')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${activeTab === 'bids'
            ? 'border-rose-600 text-rose-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Route Bids ({bids.length})
        </button> */}
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Syncing Supabase Database...</p>
        </div>
      ) : activeTab === 'drivers' ? (

        /* Drivers Table View */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Driver Directory</h3>
              <p className="text-xs text-slate-400 font-medium">Verify driver profiles, manage access status, & monitor fleet compliance</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search drivers or location..."
                value={searchQuery}
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

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Driver Name</th>
                  <th className="px-6 py-4">Vehicle Type</th>
                  {/* <th className="px-6 py-4">Location</th> */}
                  <th className="px-6 py-4">Directory Listing</th>
                  <th className="px-6 py-4 text-center">Account Access</th>
                  <th className="px-6 py-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedDrivers.map((driver, idx) => {
                  const isInactive = driver.status === 'INACTIVE';
                  const uniqueKey = driver.id ? `${driver.id}_${idx}` : `drv_${driver.email || idx}`;
                  return (
                    <tr key={uniqueKey} className={`hover:bg-slate-50/60 transition-colors ${isInactive ? 'bg-rose-50/20' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {driver.avatar_url || driver.avatar ? (
                            <img
                              src={driver.avatar_url || driver.avatar}
                              alt={driver.full_name || 'Driver'}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-full font-extrabold flex items-center justify-center text-xs shadow-xs shrink-0 ${isInactive ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
                              }`}>
                              {(driver.full_name || driver.email || 'D').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-extrabold text-slate-900 flex items-center gap-2">
                              <span>{driver.full_name || 'Driver'}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${driver.membership === 'Pro'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 font-black'
                                : 'bg-slate-50 text-slate-500 border-slate-300'}`}>
                                {driver.membership === 'Pro' ? '★ Pro' : 'Free'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">{driver.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-slate-700">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px]">
                          <Truck className="w-3.5 h-3.5 text-rose-600" />
                          <span>{driver.vehicle || 'Cargo Van'}</span>
                        </div>
                      </td>

                      {/* <td className="px-6 py-4 font-medium text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {(driver.city || driver.state_code)
                              ? `${driver.city || ''}${driver.city && driver.state_code ? ', ' : ''}${driver.state_code || ''}`
                              : 'Houston, TX'}
                          </span>
                        </div>
                      </td> */}

                      <td className="px-6 py-4 font-bold">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${driver.ready_to_work !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-black'
                          : 'bg-slate-100 text-slate-500 border-slate-300'
                          }`}>
                          {driver.ready_to_work !== false ? '● Listed' : '○ Hidden'}
                        </span>
                      </td>

                      {/* Account Access Status Select Dropdown (Active vs Inactive) */}
                      <td className="px-6 py-4 text-center">
                        <div className="relative inline-block">
                          <select
                            value={driver.status || 'ACTIVE'}
                            onChange={(e) => handleAccountStatusChange(driver.id, driver.email, e.target.value)}
                            className={`appearance-none pl-3 pr-7 py-1 rounded-full text-[10px] font-extrabold uppercase border cursor-pointer focus:outline-none transition-all ${isInactive
                              ? 'bg-rose-50 text-rose-700 border-rose-300 font-black'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              }`}
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">DEACTIVATED</option>
                          </select>
                          <ChevronDown className="w-2.5 h-2.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current" />
                        </div>
                      </td>

                      {/* Admin Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Route Button if driver set a route */}
                          {(() => {
                            const driverRoutes = routes.filter(r =>
                              (r.user_id && String(r.user_id) === String(driver.id)) ||
                              (r.driverName && driver.full_name && r.driverName.toLowerCase() === driver.full_name.toLowerCase()) ||
                              (r.driverName && driver.email && r.driverName.toLowerCase() === driver.email.toLowerCase())
                            ).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

                            return driverRoutes.length > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedDriverRoutesModal({
                                    driverName: driver.full_name || 'Driver',
                                    driverEmail: driver.email,
                                    driverAvatar: driver.avatar_url || driver.avatar,
                                    routes: driverRoutes
                                  });
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Truck className="w-3.5 h-3.5 text-white" />
                                <span>View Routes ({driverRoutes.length})</span>
                              </button>
                            );
                          })()}
                          {/* View Details Button */}
                          <button
                            onClick={() => setSelectedDriverModal(driver)}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
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

          {/* Pagination Footer Controls (10 Drivers per page) */}
          {displayTotalCount > 0 && (
            <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
              <div>
                Showing <span className="font-extrabold text-slate-900">{drivers.length > 0 ? startIndex + 1 : 0}</span> to{' '}
                <span className="font-extrabold text-slate-900">{Math.min(startIndex + drivers.length, displayTotalCount)}</span> of{' '}
                <span className="font-extrabold text-slate-900">{displayTotalCount}</span> drivers
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const nextP = Math.max(currentPage - 1, 1);
                    setCurrentPage(nextP);
                    loadData(nextP);
                  }}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 font-black text-rose-600 text-xs shadow-2xs">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => {
                    const nextP = Math.min(currentPage + 1, totalPages);
                    setCurrentPage(nextP);
                    loadData(nextP);
                  }}
                  disabled={currentPage >= totalPages}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

      ) : activeTab === 'routes' ? (

        /* Saved Driver Routes View */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Saved Driver Routes</h3>
              <p className="text-xs text-slate-400 font-medium">Grouped by registered driver with creation dates, timestamps, & stop histories</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search routes by ID or title..."
                value={searchQuery}
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

          {groupedRoutesByDriver.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400 font-medium">
              No saved driver routes found in database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Driver Name</th>
                    <th className="px-6 py-4">Total Routes Created</th>
                    <th className="px-6 py-4">Latest Route ID</th>
                    <th className="px-6 py-4">Latest Created Date & Time</th>
                    <th className="px-6 py-4">Latest Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredGroupedRoutes.map((group, idx) => {
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

                    const groupKey = group.key ? `${group.key}_${idx}` : `grp_${idx}`;

                    return (
                      <tr key={groupKey} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <div className="flex items-center gap-3">
                            {group.driverAvatar ? (
                              <img
                                src={group.driverAvatar}
                                alt={group.driverName || 'Driver'}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shadow-2xs shrink-0">
                                {(group.driverName || group.driverEmail || 'D').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                <span>{group.driverName}</span>
                                {group.driverMembership === 'Pro' && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-300">
                                    ★ Pro
                                  </span>
                                )}
                              </div>
                              {group.driverEmail && (
                                <div className="text-[11px] text-slate-400 font-medium">{group.driverEmail}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-extrabold text-slate-800">
                          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-xs">
                            {group.routes.length} {group.routes.length === 1 ? 'Route' : 'Routes Created'}
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
                              setSelectedDriverRoutesModal({
                                driverName: group.driverName,
                                routes: group.routes
                              });
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>View All Routes ({group.routes.length}) →</span>
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

        /* Bids & Applications View */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Driver Bids & Route Applications</h3>
            <p className="text-xs text-slate-400 font-medium">Real-time driver submissions stored in Supabase</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Applicant Driver</th>
                  <th className="px-6 py-4">Target Route / Contract</th>
                  <th className="px-6 py-4">Bid Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {bids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-slate-900">{bid.driver_name || 'Driver Applicant'}</div>
                      <div className="text-[11px] text-slate-400 font-medium">{bid.driver_email}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {bid.route_title || 'Courier Route'}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-emerald-600">
                      ${bid.bid_amount || 250}/day
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${bid.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : bid.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                        {bid.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleUpdateBid(bid.id, 'approved')}
                        disabled={updatingId === bid.id}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateBid(bid.id, 'rejected')}
                        disabled={updatingId === bid.id}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-bold text-xs cursor-pointer"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      )}

      {/* Selected Route Detail Modal */}
      {selectedRouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Route Details</span>
                <h3 className="text-xl font-extrabold text-[#0b132b] font-serif-heading flex items-center gap-2">
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
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Driver</span>
                <span className="font-extrabold text-[#0b132b] truncate block">{selectedRouteModal.driverName}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Distance</span>
                <span className="font-extrabold text-[#0b132b]">{selectedRouteModal.distanceMiles} mi</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Drive Time</span>
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
                        s.status === 'ongoing' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                        {s.status || 'pending'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRouteModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div> */}
          </div>
        </div>
      )}

      {/* ── DRIVER DETAILS MODAL ── */}
      {selectedDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/60 backdrop-blur-xs animate-fadeIn">
          <style>{`
            .custom-modal-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-modal-scrollbar::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 10px;
            }
            .custom-modal-scrollbar::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 10px;
            }
            .custom-modal-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
          `}</style>

          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start text-left">
              <div className="flex items-center gap-3.5 flex-1">
                <div className={`w-12 h-12 bg-rose-600 rounded-2xl font-black text-lg flex items-center justify-center shadow-md shrink-0 ${selectedDriverModal.status === 'INACTIVE' ? 'bg-rose-600' : 'bg-[#0b132b]'}`}>
                  {(selectedDriverModal.full_name || selectedDriverModal.email || 'D').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-extrabold text-white font-serif-heading truncate max-w-[250px]">
                      {selectedDriverModal.full_name || 'Driver Profile'}
                    </h3>
                    {selectedDriverModal.verified && (
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" title="Verified Driver" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-300 font-medium truncate max-w-[250px]">{selectedDriverModal.email}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-[10px] uppercase border border-rose-500/30 shrink-0">
                      Driver Profile
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriverModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-4"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 custom-modal-scrollbar">

              {/* Account Status Control Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-left">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Account Access Permission
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                    {selectedDriverModal.status === 'INACTIVE' ? (
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
                    value={selectedDriverModal.status || 'ACTIVE'}
                    onChange={(e) => handleAccountStatusChange(selectedDriverModal.id, selectedDriverModal.email, e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-extrabold text-xs text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">DEACTIVATED</option>
                  </select>
                </div>
              </div>

              {/* Profile Grid Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</span>
                  <div className="flex items-center gap-2 font-extrabold text-slate-800">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedDriverModal.phone ? formatPhoneNumber(selectedDriverModal.phone) : 'Not Provided'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location / Market</span>
                  <div className="flex items-center gap-2 font-extrabold text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>
                      {(selectedDriverModal.city || selectedDriverModal.state_code)
                        ? `${selectedDriverModal.city || ''}${selectedDriverModal.city && selectedDriverModal.state_code ? ', ' : ''}${selectedDriverModal.state_code || ''}`
                        : 'Not Provided'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle Type</span>
                  <div className="flex items-center gap-2 font-extrabold text-slate-800">
                    <Truck className="w-3.5 h-3.5 text-rose-600" />
                    <span>{selectedDriverModal.vehicle ? selectedDriverModal.vehicle : 'Not Specified'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Member Since</span>
                  <div className="flex items-center gap-2 font-extrabold text-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedDriverModal.created_at ? new Date(selectedDriverModal.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Directory Listing Pitch & Driving Experience Card */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Directory Listing & Driver Qualifications
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${selectedDriverModal.ready_to_work !== false
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}>
                    {selectedDriverModal.ready_to_work !== false ? '● Listed on Directory' : '○ Hidden from Directory'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Driving Experience</span>
                    <span className="font-extrabold text-slate-800">{selectedDriverModal.experience || '1-3 Years'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Dispatch Availability</span>
                    <span className="font-extrabold text-emerald-700">{selectedDriverModal.availability || 'Immediate'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Commercial CDL Status</span>
                    <span className="font-extrabold text-slate-800">
                      {selectedDriverModal.has_cdl ? 'CDL Holder ✓' : 'Standard License'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">USDOT / MC Number</span>
                    <span className="font-extrabold text-slate-800">{selectedDriverModal.dot_number || 'N/A'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1 col-span-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Company Website URL</span>
                    <span className="font-extrabold text-slate-800 truncate block">
                      {selectedDriverModal.website_url ? (
                        <a
                          href={selectedDriverModal.website_url.startsWith('http') ? selectedDriverModal.website_url : `https://${selectedDriverModal.website_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>{selectedDriverModal.website_url}</span>
                        </a>
                      ) : 'Not Provided'}
                    </span>
                  </div>
                </div>

                {selectedDriverModal.bio ? (
                  <div className="pt-2 border-t border-rose-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Driver Bio & Directory Listing Pitch</span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                      {selectedDriverModal.bio}
                    </p>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic pt-1">
                    No custom bio pitch provided by driver yet.
                  </div>
                )}
              </div>

              {/* Connected Companies & Fleets Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Connected Companies & Fleets ({selectedDriverModal.connectedCompanies?.length || 0})
                </span>
                {selectedDriverModal.connectedCompanies && selectedDriverModal.connectedCompanies.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedDriverModal.connectedCompanies.map((compName, idx) => (
                      <span key={idx} className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1.5 border border-emerald-200">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{compName} (Active Contract)</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 font-medium py-1">
                    Not connected to any company fleet.
                  </div>
                )}
              </div>

              {/* Compliance Credentials & Badges (100% Dynamic from Supabase) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Compliance Credentials & Badges</span>
                {certsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-bold py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                    <span>Fetching certifications from database...</span>
                  </div>
                ) : driverCerts.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {driverCerts.map((cert, idx) => (
                      <span key={cert.id || idx} className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 text-[11px] font-bold flex items-center gap-1.5 border border-blue-200 animate-fadeIn">
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                        <span>{cert.course_name || 'Verified Certificate'}</span>
                        {cert.cert_number && <span className="text-[9px] font-mono opacity-75 font-bold">({cert.cert_number})</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 font-medium py-1">
                    No compliance certifications recorded in database for this driver profile.
                  </div>
                )}
              </div>

              {/* Subscription Membership Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">PRO Plan & Billing Details</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1 text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Membership status</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block ${selectedDriverModal.membership === 'Pro' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {selectedDriverModal.membership === 'Pro' ? 'Pro Plan' : 'Free Starter'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1 text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Amount Paid</span>
                    <span className="font-extrabold text-slate-800">{selectedDriverModal.subscription?.amountPaid || '$0.00'}</span>
                  </div>

                  {selectedDriverModal.membership === 'Pro' && (
                    <>
                      <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1 text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Date Subscribed</span>
                        <span className="font-extrabold text-slate-800">{selectedDriverModal.subscription?.subscribedAt}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1 text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Days Remaining / Renewal</span>
                        <span className="font-extrabold text-slate-800">{selectedDriverModal.subscription?.daysLeft} days left ({selectedDriverModal.subscription?.nextRenewal})</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

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
      {/* ── DRIVER ALL ROUTES MODAL ── */}
      {selectedDriverRoutesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 font-extrabold text-base flex items-center justify-center text-white shrink-0">
                  {(selectedDriverRoutesModal.driverName || 'D').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white font-serif-heading flex items-center gap-2">
                    <span>{selectedDriverRoutesModal.driverName}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold uppercase border border-rose-500/30">
                      {selectedDriverRoutesModal.routes.length} Saved {selectedDriverRoutesModal.routes.length === 1 ? 'Route' : 'Routes'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">All delivery routes created and saved by this driver with date, time, & stop details</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedDriverRoutesModal(null);
                  setExpandedRouteId(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Routes List */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[75vh] text-left custom-modal-scrollbar">
              {selectedDriverRoutesModal.routes.map((route, rIdx) => {
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
                          <span>Created: {formattedDateTime}</span>
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
