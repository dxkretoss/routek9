import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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

export default function AdminCustomerList({ searchQuery = '', setSearchQuery }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabFromUrl === 'orders' ? 'orders' : 'directory'
  );
  const [customers, setCustomers] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCustomerModal, setSelectedCustomerModal] = useState(null);
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [directoryPage, setDirectoryPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const itemsPerPage = 10;

  // Sync URL search param changes to activeTab
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab === 'orders') {
      setActiveTab('orders');
    } else {
      setActiveTab('directory');
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === 'directory') setDirectoryPage(1);
    if (newTab === 'orders') setOrdersPage(1);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (newTab === 'orders') {
        next.set('tab', 'orders');
      } else {
        next.delete('tab');
      }
      return next;
    }, { replace: true });
  };

  // Reset search when active tab changes
  useEffect(() => {
    if (setSearchQuery) setSearchQuery('');
  }, [activeTab]);

  // Reset search when leaving/unmounting customer list page
  useEffect(() => {
    return () => {
      if (setSearchQuery) setSearchQuery('');
    };
  }, []);

  function getCustomerInitials(name) {
    if (!name) return 'C';
    const cleanName = name.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  function getProfileFullName(p) {
    if (!p) return null;
    if (p.full_name && String(p.full_name).trim() !== '') return String(p.full_name).trim();
    if (p.name && String(p.name).trim() !== '') return String(p.name).trim();
    if (p.first_name || p.last_name) {
      const combined = `${p.first_name || ''} ${p.last_name || ''}`.trim();
      if (combined) return combined;
    }
    if (p.email && String(p.email).includes('@')) {
      const handle = String(p.email).split('@')[0];
      return handle
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }
    return null;
  }

  function getOrderCustomerDetails(ord, allProfilesList = [], customersList = []) {
    if (!ord) return { name: 'Customer', email: null, phone: null, avatar_url: null };

    const matchedProfile = (allProfilesList || []).find(p => String(p.id).toLowerCase() === String(ord.customer_id || '').toLowerCase())
      || (customersList || []).find(c => String(c.id).toLowerCase() === String(ord.customer_id || '').toLowerCase());

    const profileName = getProfileFullName(matchedProfile);

    const name = ord.customer_name
      || ord.sender_name
      || ord.recipient_name
      || ord.contact_name
      || ord.user_name
      || ord.name
      || ord.full_name
      || profileName
      || (ord.customer_email ? String(ord.customer_email).split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : null)
      || (ord.customer_id ? `Customer (${String(ord.customer_id).substring(0, 8)})` : 'Customer');

    const email = ord.customer_email
      || ord.sender_email
      || ord.email
      || (matchedProfile ? matchedProfile.email : null);

    const phone = ord.customer_phone
      || ord.sender_phone
      || ord.phone
      || (matchedProfile ? matchedProfile.phone : null);

    return {
      name,
      email,
      phone,
      avatar_url: matchedProfile?.avatar_url || null,
      profile: matchedProfile
    };
  }

  // In-memory cache for instant switching
  const customersCacheRef = React.useRef(null);

  // Load Customer Profiles & Customer Orders from Supabase
  const loadData = async (forceRefresh = false) => {
    if (!forceRefresh && customersCacheRef.current) {
      setCustomers(customersCacheRef.current.customers || []);
      setOrders(customersCacheRef.current.orders || []);
      setAllProfiles(customersCacheRef.current.allProfiles || []);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let custData = [];
      let ordersList = [];
      let customerProfilesList = [];

      // Execute customer_orders and customer_profiles in parallel
      const [ordersRes, cpRes] = await Promise.allSettled([
        supabase
          .from('customer_orders')
          .select('id, customer_id, sender_name, sender_phone, recipient_name, recipient_phone, pickup_address, dropoff_address, order_status, status, price, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('customer_profiles')
          .select('id, full_name, email, phone, avatar_url, created_at, updated_at')
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
        ordersList = ordersRes.value.data;
        setOrders(ordersList);
      }

      if (cpRes.status === 'fulfilled' && cpRes.value?.data) {
        customerProfilesList = cpRes.value.data;
      }

      // Build customer directory records from customer_profiles
      const custDirMap = new Map();
      customerProfilesList.forEach(c => {
        const key = String(c.id || c.email || Math.random()).toLowerCase();
        custDirMap.set(key, c);
      });

      // Also ensure all customers who placed orders are added to directory
      ordersList.forEach(ord => {
        const email = ord.customer_email || ord.sender_email || ord.email;
        const name = ord.customer_name || ord.sender_name || (email ? email.split('@')[0] : 'Customer');
        const phone = ord.customer_phone || ord.sender_phone || ord.phone || '';
        const id = ord.customer_id || (email ? `cust-${email}` : `ord-cust-${ord.id}`);
        const key = String(id).toLowerCase();

        if (!custDirMap.has(key)) {
          let matched = null;
          if (email) {
            matched = Array.from(custDirMap.values()).find(c => c.email && c.email.toLowerCase() === email.toLowerCase());
          }
          if (!matched) {
            custDirMap.set(key, {
              id: id,
              user_id: ord.customer_id || id,
              full_name: name,
              email: email || '',
              phone: phone,
              created_at: ord.created_at || new Date().toISOString(),
              status: 'ACTIVE',
              is_active: true,
              role: 'customer'
            });
          }
        }
      });

      custData = Array.from(custDirMap.values());

      // Format customer records cleanly and compute delivery count and total saved/spend dynamically
      const finalList = custData.map((c) => {
        const customerOrders = ordersList.filter(o => String(o.customer_id).toLowerCase() === String(c.id).toLowerCase());
        const completedOrders = customerOrders.filter(o => {
          const s = String(o.order_status || o.status || '').toLowerCase();
          return s === 'completed' || s === 'delivered' || s === 'completed_payout';
        });
        const totalSavedSpend = completedOrders.reduce((sum, o) => sum + Number(o.price || o.total_amount || 0), 0);

        return {
          id: c.id || `cp-${Math.random()}`,
          full_name: getProfileFullName(c) || c.full_name || c.name || c.customer_name || 'Customer',
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

      // Save to cache for instant rendering
      customersCacheRef.current = {
        customers: finalList,
        orders: ordersList,
        allProfiles: customerProfilesList
      };

      setCustomers(finalList);
      setAllProfiles(customerProfilesList);

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
    const custInfo = getOrderCustomerDetails(o, allProfiles, customers);
    const custName = (custInfo.name || '').toLowerCase();
    const custEmail = (custInfo.email || '').toLowerCase();
    const custPhone = (custInfo.phone || '').toLowerCase();

    return (
      ref.includes(q) ||
      cat.includes(q) ||
      pAddr.includes(q) ||
      dAddr.includes(q) ||
      status.includes(q) ||
      id.includes(q) ||
      custName.includes(q) ||
      custEmail.includes(q) ||
      custPhone.includes(q)
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
          onClick={() => handleTabChange('directory')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${activeTab === 'directory'
            ? 'border-rose-600 text-rose-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Customer Directory ({filteredCustomers.length})
        </button>

        <button
          onClick={() => handleTabChange('orders')}
          className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${activeTab === 'orders'
            ? 'border-rose-600 text-rose-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Customer Orders ({orders.length})
        </button>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'directory' ? (
        /* TAB 1: Customer Directory Table */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Customer Directory</h3>
              <p className="text-xs text-slate-400 font-medium">Registered customer accounts & activity summaries</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search customers by name, email, phone, or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDirectoryPage(1);
                  setOrdersPage(1);
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDirectoryPage(1);
                    setOrdersPage(1);
                  }}
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
              <p className="text-xs font-bold text-slate-500">Loading Customer Profiles...</p>
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
                        {/* Customer Avatar & Name & Email */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 block truncate max-w-[180px]" title={cust.full_name}>
                                {cust.full_name}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium block truncate max-w-[180px]" title={cust.email}>
                                {cust.email || '—'}
                              </span>
                            </div>
                          </div>
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
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Customer Orders Monitor</h3>
              <p className="text-xs text-slate-400 font-medium">Real-time orders placed by mobile app customers</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders by order ref, pickup, dropoff, or status..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDirectoryPage(1);
                  setOrdersPage(1);
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setDirectoryPage(1);
                    setOrdersPage(1);
                  }}
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
                    const custInfo = getOrderCustomerDetails(ord, allProfiles, customers);
                    const custName = custInfo.name;
                    const custEmail = custInfo.email;
                    const custPhone = custInfo.phone;
                    const custAvatar = custInfo.avatar_url;

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
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                              {custAvatar ? (
                                <img src={custAvatar} alt={custName} className="w-full h-full object-cover" />
                              ) : (
                                <span>{getCustomerInitials(custName)}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 block truncate max-w-[170px]" title={custName}>
                                {custName}
                              </span>
                              {custEmail ? (
                                <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[170px]" title={custEmail}>
                                  {custEmail}
                                </span>
                              ) : custPhone ? (
                                <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[170px]">
                                  {formatPhoneNumber(custPhone)}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[170px]">
                                  {ord.customer_id ? String(ord.customer_id).substring(0, 10) + '...' : ''}
                                </span>
                              )}
                            </div>
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
              {(() => {
                const modalCust = getOrderCustomerDetails(selectedOrderModal, allProfiles, customers);
                return (
                  <>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-400">Customer Name</span>
                      <span className="font-extrabold text-slate-900">{modalCust.name}</span>
                    </div>
                    {modalCust.email && (
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400">Customer Email</span>
                        <span className="font-semibold text-slate-700">{modalCust.email}</span>
                      </div>
                    )}
                    {modalCust.phone && (
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400">Customer Phone</span>
                        <span className="font-semibold text-slate-700">{formatPhoneNumber(modalCust.phone)}</span>
                      </div>
                    )}
                  </>
                );
              })()}
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
