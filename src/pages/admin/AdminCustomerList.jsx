import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Eye,
  X,
  Package,
  Loader2,
  Star,
  ShoppingBag,
  MapPin,
  Clock,
  Truck,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPhoneNumber } from './components/AdminComponents';

export default function AdminCustomerList({ searchQuery, setSearchQuery }) {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'orders'
  const [selectedCustomerModal, setSelectedCustomerModal] = useState(null);
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);
  const [loading, setLoading] = useState(true);

  function getCustomerInitials(name) {
    if (!name) return 'C';
    const cleanName = name.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  // Load Customer Profiles & Customer Orders from Supabase
  const loadData = async () => {
    setLoading(true);
    try {
      let custData = [];

      // 1. Query `customer_profiles` table
      try {
        const { data: cpData, error: cpErr } = await supabase
          .from('customer_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (cpErr) {
          console.warn('customer_profiles query warning:', cpErr);
        } else if (cpData && cpData.length > 0) {
          custData = [...cpData];
        }
      } catch (err) {
        console.warn('customer_profiles fetch exception:', err);
      }

      // 2. Query non-driver/company/admin profiles from `profiles`
      try {
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profData && profData.length > 0) {
          const customerProfiles = profData.filter(p => {
            const r = (p.role || '').toLowerCase();
            return r !== 'driver' && r !== 'company' && r !== 'admin' && r !== 'superadmin';
          });

          const existingKeys = new Set(custData.map(c => (c.email ? c.email.toLowerCase() : c.id)));
          customerProfiles.forEach(p => {
            const key = p.email ? p.email.toLowerCase() : p.id;
            if (key && !existingKeys.has(key)) {
              custData.push(p);
              existingKeys.add(key);
            }
          });
        }
      } catch (profErr) {
        console.warn('profiles query notice:', profErr);
      }

      // 3. Check localStorage cache fallback for customer profiles
      try {
        const localSaved = JSON.parse(localStorage.getItem('rk9_admin_custom_customers') || '[]');
        if (Array.isArray(localSaved) && localSaved.length > 0) {
          const existingKeys = new Set(custData.map(c => (c.email ? c.email.toLowerCase() : c.id)));
          localSaved.forEach(c => {
            const key = c.email ? c.email.toLowerCase() : c.id;
            if (key && !existingKeys.has(key)) {
              custData.push(c);
              existingKeys.add(key);
            }
          });
        }
      } catch (locErr) {
        console.warn('localStorage customer query notice:', locErr);
      }

      // Format customer records cleanly
      const finalList = custData.map((c) => {
        return {
          id: c.id || `cp-${Math.random()}`,
          full_name: c.full_name || c.name || c.customer_name || 'Customer',
          email: c.email || c.customer_email || '—',
          phone: c.phone || c.customer_phone || '—',
          avatar_url: c.avatar_url || c.avatar || null,
          total_deliveries: typeof c.total_deliveries === 'number' ? c.total_deliveries : parseInt(c.total_deliveries || 0, 10),
          total_saved: typeof c.total_saved === 'number' ? c.total_saved : parseFloat(c.total_saved || 0),
          rating: typeof c.rating === 'number' ? c.rating : parseFloat(c.rating || 5.0),
          created_at: c.created_at || new Date().toISOString(),
          updated_at: c.updated_at || new Date().toISOString()
        };
      });

      setCustomers(finalList);

      // 4. Query `customer_orders` table
      try {
        const { data: ordersData, error: ordersErr } = await supabase
          .from('customer_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (ordersErr) {
          console.warn("customer_orders fetch warning:", ordersErr);
        } else if (ordersData) {
          setOrders(ordersData);
        }
      } catch (oErr) {
        console.warn("customer_orders fetch exception:", oErr);
      }

    } catch (err) {
      console.warn("Admin customer data load warning:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter customers based on search term
  const filteredCustomers = customers.filter((c) => {
    const q = (searchQuery || '').toLowerCase();
    const name = (c.full_name || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    const id = (c.id || '').toLowerCase();

    return name.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);
  });

  // Filter customer orders based on search term
  const filteredOrders = orders.filter((o) => {
    const q = (searchQuery || '').toLowerCase();
    const ref = (o.order_ref || '').toLowerCase();
    const cat = (o.category || '').toLowerCase();
    const pAddr = (o.pickup_address || '').toLowerCase();
    const dAddr = (o.dropoff_address || '').toLowerCase();
    const status = (o.order_status || '').toLowerCase();
    const id = (o.id || o.customer_id || '').toLowerCase();

    return (
      ref.includes(q) ||
      cat.includes(q) ||
      pAddr.includes(q) ||
      dAddr.includes(q) ||
      status.includes(q) ||
      id.includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-serif-heading tracking-tight">
            Customer Management
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage registered mobile app customers, track customer orders, & account details
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
            activeTab === 'directory'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Customer Directory ({filteredCustomers.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Customer Orders ({orders.length})
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
                ? "Search by customer name, email, phone, or ID..."
                : "Search orders by order ref, pickup, dropoff, or status..."
            }
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 ${searchQuery ? 'pr-10' : 'pr-4'} py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-2xs`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-100 transition-all"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Customer Directory */}
      {activeTab === 'directory' ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Customer Directory</h3>
              <p className="text-xs text-slate-400 font-medium">View registered mobile app customer profiles & account details</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-full border border-rose-200">
              {filteredCustomers.length} Customers Listed
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading customer profiles...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-16 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No customers found</p>
              <p className="text-xs text-slate-400 mt-1">Try refining your search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Deliveries</th>
                    <th className="px-6 py-4">Total Saved</th>
                    <th className="px-6 py-4">Date Joined</th>
                    <th className="px-6 py-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCustomers.map((cust) => {
                    return (
                      <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Customer Name & Email */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {cust.avatar_url ? (
                              <img
                                src={cust.avatar_url}
                                alt={cust.full_name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {getCustomerInitials(cust.full_name)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 block truncate">{cust.full_name}</span>
                              <span className="text-[10px] text-slate-400 font-medium block truncate">{cust.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Contact Phone */}
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {cust.phone && cust.phone !== '—' ? formatPhoneNumber(cust.phone) : '—'}
                        </td>

                        {/* Deliveries */}
                        <td className="px-6 py-4 font-bold text-slate-800">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs">
                            {cust.total_deliveries || 0}
                          </span>
                        </td>

                        {/* Total Saved */}
                        <td className="px-6 py-4 font-extrabold text-emerald-600">
                          ${(cust.total_saved || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Date Joined */}
                        <td className="px-6 py-4 text-slate-400 font-semibold">
                          {cust.created_at ? new Date(cust.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 11, 2026'}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedCustomerModal(cust)}
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
        </div>
      ) : (
        /* TAB 2: Customer Orders Monitor */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Customer Orders Monitor</h3>
              <p className="text-xs text-slate-400 font-medium">Real-time orders placed by mobile app customers (<code className="text-rose-600 font-mono text-[11px]">customer_orders</code>)</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-full border border-rose-200">
              {filteredOrders.length} Orders Listed
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading customer orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-16 text-center">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No customer orders found</p>
              <p className="text-xs text-slate-400 mt-1">No orders have been submitted yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Order Ref</th>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Pickup & Dropoff</th>
                    <th className="px-6 py-4">Vehicle / Speed</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Order Date</th>
                    <th className="px-6 py-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredOrders.map((ord) => {
                    const statusLower = (ord.order_status || 'pending').toLowerCase();
                    const matchedCustomer = customers.find(c => String(c.id).toLowerCase() === String(ord.customer_id || '').toLowerCase());
                    const custName = matchedCustomer ? matchedCustomer.full_name : (ord.customer_id ? `User (${String(ord.customer_id).substring(0, 8)}...)` : 'Customer');
                    const custEmail = matchedCustomer ? matchedCustomer.email : null;

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Order Ref */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap inline-block">
                            {ord.order_ref || `ORD-${String(ord.id).substring(0, 6)}`}
                          </span>
                        </td>

                        {/* Customer Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-900 block truncate max-w-[150px]" title={custName}>
                              {custName}
                            </span>
                            {custEmail ? (
                              <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[150px]" title={custEmail}>
                                {custEmail}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[150px]">
                                {ord.customer_id ? String(ord.customer_id).substring(0, 10) + '...' : ''}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Pickup & Dropoff Address */}
                        <td className="px-6 py-4 max-w-[200px]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-900 font-bold truncate" title={ord.pickup_address}>
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{ord.pickup_address || 'Pickup Address'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 font-medium truncate text-[11px]" title={ord.dropoff_address}>
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span className="truncate">{ord.dropoff_address || 'Dropoff Address'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Vehicle & Speed Tier */}
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-slate-800 uppercase text-[11px] block">
                              {ord.vehicle_type || 'SUV'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {ord.speed_tier || 'express'} • {ord.category || 'package'}
                            </span>
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="px-6 py-4 font-extrabold text-emerald-600 text-sm">
                          ${typeof ord.total_amount === 'number' ? ord.total_amount.toFixed(2) : parseFloat(ord.total_amount || 0).toFixed(2)}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            statusLower === 'completed' || statusLower === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : statusLower === 'in_progress' || statusLower === 'active'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : statusLower === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {ord.order_status || 'pending'}
                          </span>
                        </td>

                        {/* Order Date */}
                        <td className="px-6 py-4 text-slate-400 font-semibold">
                          {ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 11, 2026'}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedOrderModal(ord)}
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
      )}

      {/* MODAL 1: Selected Customer Details Modal */}
      {selectedCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Dark Header Banner */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start text-left">
              <div className="flex items-center gap-3.5 flex-1">
                {selectedCustomerModal.avatar_url ? (
                  <img
                    src={selectedCustomerModal.avatar_url}
                    alt={selectedCustomerModal.full_name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-rose-500 shadow-md shrink-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-extrabold text-white font-serif-heading">
                    {selectedCustomerModal.full_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-300 font-medium">{selectedCustomerModal.email}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-[10px] uppercase border border-rose-500/30">
                      Customer Profile
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 custom-modal-scrollbar">
              {/* Grid of Profile Details */}
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</div>
                  <div className="font-extrabold text-slate-900">{selectedCustomerModal.full_name}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</div>
                  <div className="font-extrabold text-slate-900">{selectedCustomerModal.phone ? formatPhoneNumber(selectedCustomerModal.phone) : 'Not provided'}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Deliveries</div>
                  <div className="font-extrabold text-slate-900 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-rose-500" />
                    <span>{selectedCustomerModal.total_deliveries || 0} completed</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Savings</div>
                  <div className="font-extrabold text-emerald-600">${(selectedCustomerModal.total_saved || 0).toFixed(2)}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Rating</div>
                  <div className="font-extrabold text-amber-600 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{(selectedCustomerModal.rating || 5.0).toFixed(1)} / 5.0</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Registered</div>
                  <div className="font-extrabold text-slate-900">
                    {selectedCustomerModal.created_at ? new Date(selectedCustomerModal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 11, 2026'}
                  </div>
                </div>
              </div>

              {/* Customer Account ID Card */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-2 text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Mobile App Customer Metadata
                </span>
                <div className="text-xs font-mono font-bold text-slate-700 break-all">
                  Supabase User ID: {selectedCustomerModal.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Selected Customer Order Details Modal */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Dark Header Banner */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start text-left">
              <div className="flex items-center gap-3.5 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white font-serif-heading flex items-center gap-2">
                    <span>Order Ref: {selectedOrderModal.order_ref || `ORD-${String(selectedOrderModal.id).substring(0, 6)}`}</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-300 font-mono">ID: {selectedOrderModal.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-[10px] uppercase border border-rose-500/30">
                      {selectedOrderModal.order_status || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 custom-modal-scrollbar">
              {/* Pickup & Dropoff Address Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-left">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Route Delivery Locations
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" /> Pickup Location
                    </span>
                    <div className="font-bold text-slate-900">{selectedOrderModal.pickup_address || 'N/A'}</div>
                    {selectedOrderModal.pickup_lat && (
                      <div className="text-[10px] font-mono text-slate-400">Lat: {selectedOrderModal.pickup_lat}, Lng: {selectedOrderModal.pickup_lng}</div>
                    )}
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-600" /> Dropoff Location
                    </span>
                    <div className="font-bold text-slate-900">{selectedOrderModal.dropoff_address || 'N/A'}</div>
                    {selectedOrderModal.dropoff_lat && (
                      <div className="text-[10px] font-mono text-slate-400">Lat: {selectedOrderModal.dropoff_lat}, Lng: {selectedOrderModal.dropoff_lng}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Package Specifications & Pricing Grid */}
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category & Vehicle</div>
                  <div className="font-extrabold text-slate-900 uppercase">
                    {selectedOrderModal.category || 'Package'} • {selectedOrderModal.vehicle_type || 'SUV'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery Speed</div>
                  <div className="font-extrabold text-slate-900 uppercase">
                    {selectedOrderModal.speed_tier || 'Express'} ({selectedOrderModal.schedule_type || 'scheduled'})
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Package Dimensions (H×W×L)</div>
                  <div className="font-extrabold text-slate-900">
                    {selectedOrderModal.pkg_height_in || 0}" × {selectedOrderModal.pkg_width_in || 0}" × {selectedOrderModal.pkg_length_in || 0}"
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Package Weight</div>
                  <div className="font-extrabold text-slate-900">{selectedOrderModal.pkg_weight_lbs || 0} lbs</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Distance & Est. Time</div>
                  <div className="font-extrabold text-slate-900">
                    {selectedOrderModal.distance_miles || 0} miles • {selectedOrderModal.estimated_time || 'N/A'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</div>
                  <div className="font-extrabold text-emerald-600 text-sm">
                    ${typeof selectedOrderModal.total_amount === 'number' ? selectedOrderModal.total_amount.toFixed(2) : parseFloat(selectedOrderModal.total_amount || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Pricing & Fees Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Payment & Fee Breakdown
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-slate-400 font-medium">Subtotal:</span> <strong className="text-slate-900">${selectedOrderModal.subtotal || 0}</strong></div>
                  <div><span className="text-slate-400 font-medium">Service Fee:</span> <strong className="text-slate-900">${selectedOrderModal.service_fee || 0}</strong></div>
                  <div><span className="text-slate-400 font-medium">Extras Fee:</span> <strong className="text-slate-900">${selectedOrderModal.extras_fee || 0}</strong></div>
                </div>
              </div>

              {/* Order Metadata */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1 text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Order Identifiers
                </span>
                <div className="text-xs font-mono font-bold text-slate-700">Customer ID: {selectedOrderModal.customer_id || 'N/A'}</div>
                <div className="text-xs font-mono font-bold text-slate-700">Driver ID: {selectedOrderModal.driver_id || 'Unassigned'}</div>
                <div className="text-xs font-mono font-semibold text-slate-500">Placed At: {selectedOrderModal.created_at ? new Date(selectedOrderModal.created_at).toLocaleString() : 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
