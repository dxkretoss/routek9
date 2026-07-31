import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, MapPin, Search, CheckCircle2, XCircle, Loader2, DollarSign, FileText } from 'lucide-react';
import { supabase, updateDriverVerification, fetchAllRouteBids, updateBidStatus } from '../../lib/supabase';

export default function AdminDriverList({ searchQuery, setSearchQuery }) {
  const [drivers, setDrivers] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('drivers'); // 'drivers' or 'bids'
  const [vehicleFilter, setVehicleFilter] = useState('all');

  // Load Driver Profiles and Bids from Supabase
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
        acc[curr.id] = curr;
        return acc;
      }, {});

      const combinedDrivers = (profilesData || []).map((p) => ({
        ...p,
        vehicle: metaMap[p.id]?.vehicle_type || 'Cargo Van',
        city: metaMap[p.id]?.city || 'Houston',
        state_code: metaMap[p.id]?.state_code || 'TX',
        verified: metaMap[p.id]?.verified || false
      }));

      setDrivers(combinedDrivers);

      // 3. Fetch Route Bids from Supabase
      const bidsData = await fetchAllRouteBids();
      setBids(bidsData);
    } catch (err) {
      console.warn("Admin data load warning:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1-Click Verification Toggle Handler
  const handleToggleVerification = async (driverId, currentVerified) => {
    setUpdatingId(driverId);
    const newStatus = !currentVerified;
    const res = await updateDriverVerification(driverId, newStatus);
    if (res.success) {
      setDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, verified: newStatus } : d))
      );
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

  const filteredDrivers = drivers.filter((d) => {
    const q = (searchQuery || '').toLowerCase();
    const matchSearch =
      (d.full_name || '').toLowerCase().includes(q) ||
      (d.email || '').toLowerCase().includes(q) ||
      (d.city || '').toLowerCase().includes(q) ||
      (d.state_code || '').toLowerCase().includes(q);

    const matchVehicle =
      vehicleFilter === 'all' ||
      (d.vehicle || '').toLowerCase().includes(vehicleFilter.toLowerCase());

    return matchSearch && matchVehicle;
  });

  return (
    <div className="space-y-6">
      
      {/* Tab Switcher & Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'drivers'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Registered Drivers ({drivers.length})
          </button>

          <button
            onClick={() => setActiveTab('bids')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'bids'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Route Applications & Bids ({bids.length})
          </button>
        </div>

        {/* Filters */}
        {activeTab === 'drivers' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">All Vehicles</option>
              <option value="Cargo Van">Cargo Van</option>
              <option value="Sprinter">Sprinter Van</option>
              <option value="Box Truck">Box Truck</option>
              <option value="SUV">SUV / Sedan</option>
            </select>
          </div>
        )}

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
              <p className="text-xs text-slate-400 font-medium">Verify driver profiles & monitor fleet compliance</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-full border border-rose-200">
              {filteredDrivers.length} Active Drivers
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Driver Name</th>
                  <th className="px-6 py-4">Vehicle Type</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Verification Status</th>
                  <th className="px-6 py-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                          {(driver.full_name || driver.email || 'D').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <span>{driver.full_name || 'Driver'}</span>
                            {driver.verified && (
                              <ShieldCheck className="w-4 h-4 text-emerald-500" title="Verified Driver" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">{driver.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px]">
                        <Truck className="w-3.5 h-3.5 text-rose-600" />
                        <span>{driver.vehicle}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{driver.city}, {driver.state_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {driver.verified ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified Badge
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase border border-amber-200">
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleVerification(driver.id, driver.verified)}
                        disabled={updatingId === driver.id}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          driver.verified
                            ? 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                        }`}
                      >
                        {updatingId === driver.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                        ) : driver.verified ? (
                          'Revoke Badge'
                        ) : (
                          'Grant Verified Badge'
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                        bid.status === 'approved'
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
    </div>
  );
}
