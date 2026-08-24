import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Eye,
  X,
  ShoppingBag,
  Users,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  FileCheck,
  HeartPulse
} from 'lucide-react';
import { supabase, fetchCprNotaryBookings } from '../../lib/supabase';

export default function AdminCprNotaryBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'confirmed', 'cancelled'
  const [serviceTab, setServiceTab] = useState('cpr'); // 'cpr', 'notary', 'all'
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const itemsPerPage = 10;

  // Load Bookings & join customer_profiles + cpr_notary_services titles
  const loadBookings = async (pageToLoad = currentPage) => {
    setLoading(true);
    const p = typeof pageToLoad === 'number' ? pageToLoad : currentPage;
    setCurrentPage(p);
    const from = (p - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    try {
      let query = supabase
        .from('cpr_bookings')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, count, error } = await query.range(from, to);

      let rawBookings = [];
      if (!error && data) {
        rawBookings = data;
        if (count !== null && count !== undefined) {
          setTotalBookingsCount(count);
        }
      } else {
        const fallback = await fetchCprNotaryBookings();
        rawBookings = fallback || [];
        setTotalBookingsCount(rawBookings.length);
      }

      // 1. Fetch customer_profiles table to resolve customer_id -> full_name, email, phone
      const customerIds = [...new Set(rawBookings.map(b => b.customer_id).filter(Boolean))];
      let customerMap = {};
      if (customerIds.length > 0) {
        try {
          const { data: custData } = await supabase
            .from('customer_profiles')
            .select('id, full_name, email, phone')
            .in('id', customerIds);

          if (custData && Array.isArray(custData)) {
            customerMap = custData.reduce((acc, cust) => {
              acc[cust.id] = cust;
              return acc;
            }, {});
          }
        } catch (cErr) {
          console.warn("Notice fetching customer_profiles:", cErr);
        }
      }

      // 2. Fetch cpr_notary_services table to resolve service_type ID -> service title
      let serviceMap = {};
      try {
        const { data: servData } = await supabase
          .from('cpr_notary_services')
          .select('id, title, category');

        if (servData && Array.isArray(servData)) {
          serviceMap = servData.reduce((acc, s) => {
            if (s.id) {
              acc[s.id] = s;
            }
            return acc;
          }, {});
        }
      } catch (sErr) {
        console.warn("Notice fetching cpr_notary_services titles:", sErr);
      }

      // 3. Enrich rawBookings with customer profile details & cpr_notary_services titles
      const enrichedBookings = rawBookings.map(b => {
        const cust = customerMap[b.customer_id] || {};
        const serv = serviceMap[b.service_type] || {};

        // Title mapped from cpr_notary_services table title column
        const displayTitle = serv.title || formatServiceLabel(b.service_type);

        // Category read from service_category column in cpr_bookings
        const rawCat = b.service_category || b.serviceCategory;
        const cat = rawCat ? String(rawCat).trim().toLowerCase() : (serv.category ? String(serv.category).toLowerCase() : null);

        return {
          ...b,
          category: cat,
          service_title: displayTitle,
          customer_name: cust.full_name || (cust.email ? cust.email.split('@')[0] : null),
          customer_email: cust.email || '',
          customer_phone: cust.phone || ''
        };
      });

      setBookings(enrichedBookings);
      setTotalBookingsCount(enrichedBookings.length);
    } catch (err) {
      console.error("Error loading cpr_bookings:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings(1);
  }, [statusFilter]);

  // Filter Bookings locally by Service Tab & Search Query
  const filteredBookings = bookings.filter((item) => {
    const q = searchQuery.trim().toLowerCase();

    // 1. Service Category Tab Filter ('cpr' vs 'notary' vs 'all')
    let matchesTab = true;
    if (serviceTab === 'cpr') {
      matchesTab = item.category === 'cpr';
    } else if (serviceTab === 'notary') {
      matchesTab = item.category === 'notary';
    }

    // 2. Search Query Filter
    const matchesSearch =
      !q ||
      (item.booking_ref || '').toLowerCase().includes(q) ||
      (item.customer_name || '').toLowerCase().includes(q) ||
      (item.customer_email || '').toLowerCase().includes(q) ||
      (item.address || '').toLowerCase().includes(q) ||
      (item.service_title || '').toLowerCase().includes(q) ||
      (item.service_type || '').toLowerCase().includes(q) ||
      (item.customer_id || '').toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  // Dynamic category counts calculated strictly from service_category column
  const cprCount = bookings.filter(b => b.category === 'cpr').length;
  const notaryCount = bookings.filter(b => b.category === 'notary').length;

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Aug 11, 2026';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Aug 11, 2026';
    }
  };

  const formatCustomerName = (customerId) => {
    if (!customerId) return 'User (guest)';
    const shortId = String(customerId).substring(0, 8);
    return `User (${shortId}...)`;
  };

  function formatServiceLabel(serviceType) {
    if (!serviceType) return 'CPR / Notary Service';
    const st = String(serviceType).toLowerCase();
    if (st.startsWith('cpr_')) {
      const num = st.replace('cpr_', '');
      return `CPR & First Aid (Course #${num})`;
    }
    if (st.startsWith('notary_')) {
      const num = st.replace('notary_', '');
      return `Mobile Notary (Tier #${num})`;
    }
    if (st.includes('-')) {
      return 'CPR / Notary Course';
    }
    return String(serviceType);
  }

  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
          COMPLETED
        </span>
      );
    }
    if (s === 'confirmed') {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
          CONFIRMED
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wider">
          CANCELLED
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
        {status ? String(status).toUpperCase() : 'PENDING'}
      </span>
    );
  };

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Top Controls: Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-serif-heading tracking-tight">
            CPR & Notary Bookings
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Displaying customer bookings with service titles from <code className="text-rose-600 font-mono text-[11px]">cpr_notary_services</code>
          </p>
        </div>

        <button
          onClick={() => loadBookings(currentPage)}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-2 text-xs"
          title="Refresh List"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Primary Category Switch Tabs (CPR vs Notary) */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => {
            setServiceTab('cpr');
            setCurrentPage(1);
          }}
          className={`px-5 py-2.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${serviceTab === 'cpr'
            ? 'border-rose-600 text-rose-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>CPR Bookings ({cprCount})</span>
        </button>

        <button
          onClick={() => {
            setServiceTab('notary');
            setCurrentPage(1);
          }}
          className={`px-5 py-2.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${serviceTab === 'notary'
            ? 'border-rose-600 text-rose-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Notary Bookings ({notaryCount})</span>
        </button>

        <button
          onClick={() => {
            setServiceTab('all');
            setCurrentPage(1);
          }}
          className={`px-5 py-2.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${serviceTab === 'all'
            ? 'border-rose-600 text-rose-600'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>All Bookings ({bookings.length})</span>
        </button>
      </div>

      {/* Search Input & Status Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search orders by customer name, email, booking ref, address, or service title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 ${searchQuery ? 'pr-10' : 'pr-4'} py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-hidden shadow-2xs`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start md:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-emerald-700'}`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('confirmed')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'confirmed' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-500 hover:text-blue-700'}`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'cancelled' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-500 hover:text-rose-700'}`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">
              {serviceTab === 'cpr' ? 'CPR Training Orders' : serviceTab === 'notary' ? "Notary Orders" : 'All Customer Orders'}
            </h3>
          </div>
          <span className="px-3 py-1 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-full border border-rose-200">
            {filteredBookings.length} Orders Listed
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading customer orders...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-16 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No {serviceTab.toUpperCase()} bookings found</p>
            <p className="text-xs text-slate-400 mt-1">Try refining your search query or switching tabs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-4">BOOKING REF</th>
                  <th className="px-4 py-4">CUSTOMER NAME</th>
                  <th className="px-4 py-4">LOCATION / ADDRESS</th>
                  <th className="px-4 py-4">SERVICE / CLASS TYPE</th>
                  <th className="px-4 py-4">TOTAL AMOUNT</th>
                  <th className="px-4 py-4">STATUS</th>
                  <th className="px-4 py-4">ORDER DATE</th>
                  <th className="px-4 py-4 text-right">ADMIN ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                {filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((ord) => {
                  const custName = ord.customer_name || formatCustomerName(ord.customer_id);
                  const shortCustId = ord.customer_id ? String(ord.customer_id).substring(0, 12) + '...' : '—';
                  const serviceDisplay = ord.service_title || formatServiceLabel(ord.service_type);

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Order Ref Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full text-xs whitespace-nowrap inline-block">
                          {ord.booking_ref || `CPR-${String(ord.id).substring(0, 5).toUpperCase()}`}
                        </span>
                      </td>

                      {/* Customer Name & ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="min-w-0">
                          <span className="font-extrabold text-slate-900 block truncate max-w-[150px]" title={custName}>
                            {custName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[130px]" title={ord.customer_id}>
                            {shortCustId}
                          </span>
                        </div>
                      </td>

                      {/* Pickup & Dropoff Location */}
                      <td className="px-4 py-3.5 max-w-[180px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-900 font-bold truncate" title={ord.address || 'RouteK9 Training Center, Oakland'}>
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{ord.address || 'RouteK9 Training Center, Oakland'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Service / Class Title mapped from cpr_notary_services */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 truncate max-w-[220px]" title={serviceDisplay}>
                          {serviceDisplay}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                          {ord.attendees || 1} ATTENDEE • {(parseFloat(ord.duration_hours) || 3).toFixed(1)} HRS
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-4 py-3.5 font-black text-emerald-600 text-sm whitespace-nowrap">
                        ${parseFloat(ord.total_price || 0).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {renderStatusBadge(ord.status)}
                      </td>

                      {/* Order Date */}
                      <td className="px-4 py-3.5 text-slate-500 font-bold whitespace-nowrap">
                        {formatDate(ord.scheduled_at || ord.created_at)}
                      </td>

                      {/* Admin Actions Button */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedBooking(ord)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold text-[10px] shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
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

        {/* Pagination Footer */}
        {filteredBookings.length > 0 && (
          <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
            <div>
              Showing <span className="font-extrabold text-slate-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
              <span className="font-extrabold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredBookings.length)}</span> of{' '}
              <span className="font-extrabold text-slate-900">{filteredBookings.length}</span> orders
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const prevP = Math.max(currentPage - 1, 1);
                  setCurrentPage(prevP);
                }}
                disabled={currentPage === 1 || loading}
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
                }}
                disabled={currentPage >= totalPages || loading}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* READ-ONLY DETAILS MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-5 relative">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base font-extrabold text-[#0b132b] font-serif-heading">
                  Order Details
                </div>
                <div className="font-mono text-xs font-bold text-rose-600">
                  {selectedBooking.booking_ref}
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50/75 p-4 rounded-2xl border border-slate-200/80 text-xs font-semibold">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Status</span>
                <span>{renderStatusBadge(selectedBooking.status)}</span>
              </div>

              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Customer Name</span>
                <span className="font-extrabold text-slate-900">{selectedBooking.customer_name || 'Customer'}</span>
              </div>

              {selectedBooking.customer_email && (
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Customer Email</span>
                  <span className="font-mono text-rose-600 font-bold">{selectedBooking.customer_email}</span>
                </div>
              )}

              {selectedBooking.category && (
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">Service Category</span>
                  <span className="font-extrabold uppercase text-rose-600">{selectedBooking.category}</span>
                </div>
              )}

              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Service / Class Title</span>
                <span className="font-bold text-slate-900 text-right max-w-xs">{selectedBooking.service_title}</span>
              </div>

              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Customer ID</span>
                <span className="font-mono text-[11px] text-slate-700">{selectedBooking.customer_id}</span>
              </div>

              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Scheduled At</span>
                <span className="font-bold text-slate-900">{formatDate(selectedBooking.scheduled_at)}</span>
              </div>

              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Location Address</span>
                <span className="font-bold text-slate-900 text-right max-w-xs">{selectedBooking.address || '—'}</span>
              </div>

              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Attendees</span>
                <span className="font-bold text-slate-900">{selectedBooking.attendees} person(s)</span>
              </div>

              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Price / Person</span>
                <span className="font-bold text-slate-900">${parseFloat(selectedBooking.price_per_person || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Duration (Hours)</span>
                <span className="font-bold text-slate-900">{selectedBooking.duration_hours} hrs</span>
              </div>

              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500">Total Price</span>
                <span className="font-extrabold text-emerald-600 text-sm">${parseFloat(selectedBooking.total_price || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between pt-1 text-[10px] text-slate-400 font-medium">
                <span>Created: {formatDate(selectedBooking.created_at)}</span>
                <span>Updated: {formatDate(selectedBooking.updated_at)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedBooking(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
