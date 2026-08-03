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
  User,
  Mail,
  Phone,
  X,
  Award,
  AlertTriangle,
  Calendar,
  Sparkles
} from 'lucide-react';
import { supabase, updateDriverVerification, fetchAllRouteBids, updateBidStatus, fetchDriverCertifications } from '../../lib/supabase';

export default function AdminDriverList({ searchQuery, setSearchQuery }) {
  const [drivers, setDrivers] = useState([]);
  const [bids, setBids] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('drivers'); // 'drivers', 'routes', or 'bids'
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [selectedRouteModal, setSelectedRouteModal] = useState(null);
  const [selectedDriverModal, setSelectedDriverModal] = useState(null);
  const [driverCerts, setDriverCerts] = useState([]);
  const [certsLoading, setCertsLoading] = useState(false);

  // Load Driver Profiles, Bids, and Saved Routes from Supabase & localStorage
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profiles with Role = 'driver'
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'driver')
        .order('created_at', { ascending: false });

      // 2. Fetch Driver Profiles metadata
      const { data: driverMeta } = await supabase
        .from('driver_profiles')
        .select('*');

      const metaMap = (driverMeta || []).reduce((acc, curr) => {
        const key = curr.id || curr.user_id || curr.driver_id;
        if (key) acc[key] = curr;
        return acc;
      }, {});

      // Read deactivated list from localStorage for sync
      const deactivatedList = JSON.parse(localStorage.getItem('rk9_deactivated_drivers') || '[]');

      const combinedDrivers = (profilesData || []).map((p) => {
        const isDeactivated = p.status === 'INACTIVE' ||
          metaMap[p.id]?.status === 'INACTIVE' ||
          deactivatedList.includes(p.email?.toLowerCase()) ||
          deactivatedList.includes(p.id);

        const vehicleVal = p.vehicle || metaMap[p.id]?.vehicle_type || p.vehicle_type || 'Cargo Van';
        const cityVal = p.city || metaMap[p.id]?.city || 'Houston';
        const stateVal = p.state_code || metaMap[p.id]?.state_code || 'TX';

        return {
          ...p,
          vehicle: vehicleVal,
          city: cityVal,
          state_code: stateVal,
          phone: metaMap[p.id]?.phone || p.phone || p.phone_number || '',
          verified: metaMap[p.id]?.verified || p.verified || false,
          status: isDeactivated ? 'INACTIVE' : 'ACTIVE'
        };
      });

      // 2.5 Fetch transactions table
      let rawTxs = [];
      try {
        const { data: txsData } = await supabase.from('transactions').select('*');
        rawTxs = txsData || [];
      } catch (txErr) {
        console.warn("Could not load transactions in AdminDriverList:", txErr);
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

      const finalDrivers = combinedDrivers.map(d => {
        const sub = getSubscriptionDetails(d.id, d.email);
        return {
          ...d,
          membership: sub.isPro ? 'Pro' : 'Free',
          subscription: sub
        };
      });

      setDrivers(finalDrivers);

      // 3. Fetch Route Bids from Supabase
      const bidsData = await fetchAllRouteBids();
      setBids(bidsData || []);

      // 4. Fetch Saved Routes from Supabase DB
      try {
        const { data: routesData } = await supabase
          .from('routes')
          .select('*')
          .order('created_at', { ascending: false });

        if (routesData) {
          setRoutes(routesData.map(r => ({
            id: r.id,
            user_id: r.user_id,
            title: r.title || 'Saved Courier Route',
            driverName: r.driver_name || 'Solo Driver',
            vehicle: 'Cargo Van',
            stopsCount: r.stops_count || (r.stops_data ? r.stops_data.length : 0),
            distanceMiles: r.distance_miles || 0,
            durationMinutes: r.duration_minutes || 0,
            status: r.status || 'ACTIVE',
            stops: r.stops_data || [],
            createdAt: r.created_at
          })));
        }
      } catch (rErr) {
        console.warn("Could not load Supabase routes for admin:", rErr);
      }

    } catch (err) {
      console.warn("Admin data load warning:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

      // 3. Sync to localStorage for instant auth blocking
      try {
        const deactivatedList = JSON.parse(localStorage.getItem('rk9_deactivated_drivers') || '[]');
        let updated = [];
        const cleanEmail = driverEmail ? driverEmail.toLowerCase() : '';

        if (newStatus === 'INACTIVE') {
          updated = Array.from(new Set([...deactivatedList, cleanEmail, driverId]));
        } else {
          updated = deactivatedList.filter(item => item !== cleanEmail && item !== driverId);
        }
        localStorage.setItem('rk9_deactivated_drivers', JSON.stringify(updated));
      } catch (e) {
        console.warn("LocalStorage status sync error:", e);
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
    const matchesSearch = searchQuery
      ? d.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.city?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    const matchesVehicle = vehicleFilter === 'all' || d.vehicle?.toLowerCase().includes(vehicleFilter.toLowerCase());
    return matchesSearch && matchesVehicle;
  });

  return (
    <div className="space-y-6">
      {/* Search & Sub-Nav Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'drivers' ? 'bg-[#0b132b] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            Driver Directory ({drivers.length})
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'routes' ? 'bg-[#0b132b] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            Saved Routes ({routes.length})
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${activeTab === 'bids' ? 'bg-[#0b132b] text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            Route Bids ({bids.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search drivers or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
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
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Driver Directory</h3>
              <p className="text-xs text-slate-400 font-medium">Verify driver profiles, manage access status, & monitor fleet compliance</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-full border border-rose-200">
              {filteredDrivers.length} Drivers Listed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Driver Name</th>
                  <th className="px-6 py-4">Vehicle Type</th>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-center">Account Access</th>
                  <th className="px-6 py-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDrivers.map((driver) => {
                  const isInactive = driver.status === 'INACTIVE';
                  return (
                    <tr key={driver.id} className={`hover:bg-slate-50/60 transition-colors ${isInactive ? 'bg-rose-50/20' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full font-extrabold flex items-center justify-center text-xs shadow-xs ${isInactive ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
                            }`}>
                            {(driver.full_name || driver.email || 'D').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900">
                              {driver.full_name || 'Driver'}
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

                      <td className="px-6 py-4 font-bold">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${driver.membership === 'Pro' 
                          ? 'bg-amber-50 text-amber-700 border-amber-300 font-black' 
                          : 'bg-slate-50 text-slate-500 border-slate-300'}`}>
                          {driver.membership === 'Pro' ? '★ Pro' : 'Free'}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {(driver.city || driver.state_code)
                              ? `${driver.city || ''}${driver.city && driver.state_code ? ', ' : ''}${driver.state_code || ''}`
                              : 'Houston, TX'}
                          </span>
                        </div>
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
                            const driverRoute = routes.find(r => r.user_id === driver.id || r.driverName?.toLowerCase() === driver.full_name?.toLowerCase());
                            return driverRoute && (
                              <button
                                onClick={() => {
                                  setSearchQuery('');
                                  setSelectedRouteModal(driverRoute);
                                  setActiveTab('routes');
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Truck className="w-3.5 h-3.5 text-white" />
                                <span>View Route</span>
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
        </div>

      ) : activeTab === 'routes' ? (

        /* Saved Driver Routes View */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Saved Driver Routes</h3>
              <p className="text-xs text-slate-400 font-medium">Live driver routes optimized and stored in Supabase database</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-full border border-rose-200">
              {routes.length} Saved Routes
            </span>
          </div>

          {routes.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400 font-medium">
              No saved driver routes found in database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Route ID</th>
                    <th className="px-6 py-4">Driver Name</th>
                    <th className="px-6 py-4">Stops</th>
                    <th className="px-6 py-4">Distance</th>
                    <th className="px-6 py-4">Drive Time</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {routes.map((route) => {
                    const routeStops = route.stops || [];
                    const completedCount = routeStops.filter(s => s.status === 'complete').length;
                    const ongoingCount = routeStops.filter(s => s.status === 'ongoing').length;
                    const allComplete = routeStops.length > 0 && completedCount === routeStops.length;
                    const anyOngoing = ongoingCount > 0 || completedCount > 0;
                    const overallStatus = allComplete ? 'complete' : anyOngoing ? 'ongoing' : 'pending';

                    return (
                      <tr key={route.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-rose-600">
                          {route.id}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {route.driverName}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {route.stopsCount} stops
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {route.distanceMiles} mi
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {route.durationMinutes} min
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${overallStatus === 'complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              overallStatus === 'ongoing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {overallStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(route.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedRouteModal(route)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all cursor-pointer shadow-xs"
                          >
                            View Stops Detail →
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
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stop Addresses ({selectedRouteModal.stops.length} stops):</span>
                <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedRouteModal.stops.map((s, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center shrink-0 font-bold">{s.step || idx + 1}</span>
                        <span className="truncate" title={s.label}>{s.label}</span>
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
                <div className={`w-12 h-12 rounded-2xl font-black text-lg flex items-center justify-center shadow-md shrink-0 ${selectedDriverModal.status === 'INACTIVE' ? 'bg-rose-600' : 'bg-[#0b132b]'}`}>
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
                    <span>{selectedDriverModal.phone ? selectedDriverModal.phone : 'Not Provided'}</span>
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
    </div>
  );
}
