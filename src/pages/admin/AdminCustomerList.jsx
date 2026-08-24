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
  AlertCircle,
  ChevronLeft,
  ChevronRight
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

  // Pagination states
  const [directoryPage, setDirectoryPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const itemsPerPage = 10;

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
      let ordersList = [];

      // 1. Query `customer_orders` table first
      try {
        const { data: ordersData, error: ordersErr } = await supabase
          .from('customer_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (ordersErr) {
          console.warn("customer_orders fetch warning:", ordersErr);
        } else if (ordersData) {
          ordersList = ordersData;
          setOrders(ordersData);
        }
      } catch (oErr) {
        console.warn("customer_orders fetch exception:", oErr);
      }

      // 2. Query company & customer profiles directly from profiles table
      try {
        const { data: profData, error: profErr } = await supabase
          .from('profiles')
          .select('id, email, role, full_name, created_at, updated_at, city, state_code, phone, is_active, status, avatar_url')
          .range(0, 100);

        if (profErr) {
          console.warn('profiles query warning:', profErr);
        } else if (profData && profData.length > 0) {
          // Sort in JS memory to prevent unindexed Postgres statement timeouts
          profData.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

          // Include company & customer profiles in customer directory
          const customerProfiles = profData.filter(p => {
            const r = String(p.role || '').toLowerCase();
            return r === 'company' || r === 'customer' || (r !== 'driver' && r !== 'admin' && r !== 'superadmin');
          });
          custData = [...customerProfiles];
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

      // Format customer records cleanly and compute delivery count and total saved/spend dynamically
      const finalList = custData.map((c) => {
        // Calculate dynamic delivery stats for this customer profile
        const customerOrders = ordersList.filter(o => o.customer_id === c.id);
        const completedOrders = customerOrders.filter(o => {
          const s = String(o.order_status || o.status || '').toLowerCase();
          return s === 'completed' || s === 'delivered' || s === 'completed_payout';
        });
        const totalSavedSpend = completedOrders.reduce((sum, o) => sum + Number(o.price || 0), 0);

        return {
          id: c.id || `cp-${Math.random()}`,
          full_name: c.full_name || c.name || c.customer_name || 'Customer',
          email: c.email || c.customer_email || '—',
          phone: c.phone || c.customer_phone || '—',
          avatar_url: c.avatar_url || c.avatar || null,
          total_deliveries: completedOrders.length,
          total_saved: totalSavedSpend,
          rating: typeof c.rating === 'number' ? c.rating : parseFloat(c.rating || 5.0),
          created_at: c.created_at || new Date().toISOString(),
          updated_at: c.updated_at || new Date().toISOString()
        };
      });

      setCustomers(finalList);

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

  const totalDirectoryPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const totalOrdersPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;

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
          onClick={() => {
            setActiveTab('directory');
            setDirectoryPage(1);
          }}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${activeTab === 'directory'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Customer Directory ({filteredCustomers.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('orders');
            setOrdersPage(1);
          }}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${activeTab === 'orders'
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
            placeholder={activeTab === 'directory' ? "Search customers by name, email, phone, or ID..." : "Search orders by order ref, pickup, dropoff, or status..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDirectoryPage(1);
              setOrdersPage(1);
            }}
            className={`w-full pl-10 ${searchQuery ? 'pr-10' : 'pr-4'} py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-hidden shadow-2xs`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDirectoryPage(1);
                setOrdersPage(1);
              }}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'directory' ? (
        /* TAB 1: Customer Directory Table */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Customer Directory</h3>
              <p className="text-xs text-slate-400 font-medium">Registered customer accounts & activity summaries (<code className="text-rose-600 font-mono text-[11px]">profiles</code>)</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-full border border-rose-200">
              {filteredCustomers.length} Customers
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
              <p className="text-sm font-bold text-slate-500">No customer profiles found</p>
              <p className="text-xs text-slate-400 mt-1">Try refining your search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Deliveries</th>
                    <th className="px-6 py-4">Total Spend</th>
                    <th className="px-6 py-4">Joined Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCustomers.slice((directoryPage - 1) * itemsPerPage, directoryPage * itemsPerPage).map((cust) => {
                    const initials = getCustomerInitials(cust.full_name);

                    return (
                      <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Customer Avatar & Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 block truncate max-w-[160px]" title={cust.full_name}>
                                {cust.full_name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[140px]">
                                ID: {String(cust.id).substring(0, 12)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-700 block truncate max-w-[180px]" title={cust.email}>
                            {cust.email}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                          {formatPhoneNumber(cust.phone)}
                        </td>

                        {/* Deliveries Completed */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                            {cust.total_deliveries || 0} Orders
                          </span>
                        </td>

                        {/* Total Spend */}
                        <td className="px-6 py-4 font-extrabold text-emerald-600 whitespace-nowrap">
                          ${(cust.total_saved || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Date Joined */}
                        <td className="px-6 py-4 text-slate-400 font-semibold whitespace-nowrap">
                          {cust.created_at ? new Date(cust.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 11, 2026'}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
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

          {/* Directory Pagination Footer */}
          {filteredCustomers.length > 0 && (
            <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
              <div>
                Showing <span className="font-extrabold text-slate-900">{((directoryPage - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-extrabold text-slate-900">{Math.min(directoryPage * itemsPerPage, filteredCustomers.length)}</span> of{' '}
                <span className="font-extrabold text-slate-900">{filteredCustomers.length}</span> customers
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDirectoryPage(prev => Math.max(prev - 1, 1))}
                  disabled={directoryPage === 1 || loading}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 font-black text-rose-600 text-xs shadow-2xs">
                  Page {directoryPage} of {totalDirectoryPages}
                </div>

                <button
                  onClick={() => setDirectoryPage(prev => Math.min(prev + 1, totalDirectoryPages))}
                  disabled={directoryPage >= totalDirectoryPages || loading}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
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
                  {filteredOrders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage).map((ord) => {
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
                        <td className="px-6 py-4 whitespace-nowrap">
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
                        <td className="px-6 py-4 font-extrabold text-emerald-600 text-sm whitespace-nowrap">
                          ${typeof ord.total_amount === 'number' ? ord.total_amount.toFixed(2) : parseFloat(ord.total_amount || 0).toFixed(2)}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${statusLower === 'completed' || statusLower === 'delivered'
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
                        <td className="px-6 py-4 text-slate-400 font-semibold whitespace-nowrap">
                          {ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Aug 11, 2026'}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
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

          {/* Customer Orders Pagination Footer */}
          {filteredOrders.length > 0 && (
            <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
              <div>
                Showing <span className="font-extrabold text-slate-900">{((ordersPage - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-extrabold text-slate-900">{Math.min(ordersPage * itemsPerPage, filteredOrders.length)}</span> of{' '}
                <span className="font-extrabold text-slate-900">{filteredOrders.length}</span> orders
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOrdersPage(prev => Math.max(prev - 1, 1))}
                  disabled={ordersPage === 1 || loading}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 font-black text-rose-600 text-xs shadow-2xs">
                  Page {ordersPage} of {totalOrdersPages}
                </div>

                <button
                  onClick={() => setOrdersPage(prev => Math.min(prev + 1, totalOrdersPages))}
                  disabled={ordersPage >= totalOrdersPages || loading}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
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
                    className="w-12 h-12 rounded-2xl object-cover border border-white/20 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-extrabold text-sm flex items-center justify-center shadow-xs shrink-0">
                    {getCustomerInitials(selectedCustomerModal.full_name)}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold font-serif-heading truncate">
                    {selectedCustomerModal.full_name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium truncate">
                    {selectedCustomerModal.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomerModal(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-semibold text-slate-800 text-left">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Customer ID</span>
                  <span className="font-mono text-slate-900 block truncate">{selectedCustomerModal.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Phone Number</span>
                  <span className="text-slate-900 block">{formatPhoneNumber(selectedCustomerModal.phone)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Total Deliveries</span>
                  <span className="text-rose-600 font-extrabold block">{selectedCustomerModal.total_deliveries} Orders Completed</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Total Spend</span>
                  <span className="text-emerald-600 font-extrabold block">${(selectedCustomerModal.total_saved || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Recent Orders History</span>
                {orders.filter(o => o.customer_id === selectedCustomerModal.id).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No specific orders linked to this customer account yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {orders.filter(o => o.customer_id === selectedCustomerModal.id).map(ord => (
                      <div key={ord.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-rose-600 block">{ord.order_ref || `ORD-${String(ord.id).substring(0, 6)}`}</span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">{ord.pickup_address || 'Pickup'} → {ord.dropoff_address || 'Dropoff'}</span>
                        </div>
                        <span className="font-black text-emerald-600">${typeof ord.total_amount === 'number' ? ord.total_amount.toFixed(2) : parseFloat(ord.total_amount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedCustomerModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Selected Order Details Modal */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start text-left">
              <div>
                <h3 className="text-lg font-extrabold font-serif-heading">
                  Order Details
                </h3>
                <p className="font-mono text-xs font-bold text-rose-400 mt-0.5">
                  {selectedOrderModal.order_ref || `ORD-${String(selectedOrderModal.id).substring(0, 8)}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 text-xs font-semibold text-slate-800 text-left">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Order Status</span>
                <span className="font-extrabold uppercase text-rose-600">{selectedOrderModal.order_status || 'pending'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Customer ID</span>
                <span className="font-mono text-slate-700 text-[11px]">{selectedOrderModal.customer_id || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Pickup Address</span>
                <span className="font-bold text-slate-900 text-right max-w-xs">{selectedOrderModal.pickup_address || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Dropoff Address</span>
                <span className="font-bold text-slate-900 text-right max-w-xs">{selectedOrderModal.dropoff_address || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Vehicle Type</span>
                <span className="font-bold uppercase text-slate-900">{selectedOrderModal.vehicle_type || 'SUV'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Speed Tier</span>
                <span className="font-bold uppercase text-slate-900">{selectedOrderModal.speed_tier || 'express'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400">Total Price</span>
                <span className="font-extrabold text-emerald-600 text-sm">${typeof selectedOrderModal.total_amount === 'number' ? selectedOrderModal.total_amount.toFixed(2) : parseFloat(selectedOrderModal.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 text-[10px] text-slate-400">
                <span>Created: {selectedOrderModal.created_at ? new Date(selectedOrderModal.created_at).toLocaleDateString('en-US') : '—'}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
