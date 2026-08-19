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
  Users
} from 'lucide-react';
import { fetchCprNotaryBookings } from '../../lib/supabase';

export default function AdminCprNotaryBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Load Bookings from Supabase (100% Dynamic)
  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await fetchCprNotaryBookings();
      setBookings(data || []);
    } catch (err) {
      console.error("Error loading cpr_bookings:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Filter Bookings
  const filteredBookings = bookings.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (item.booking_ref || '').toLowerCase().includes(q) ||
      (item.address || '').toLowerCase().includes(q) ||
      (item.service_type || '').toLowerCase().includes(q) ||
      (item.customer_id || '').toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all' ||
      (item.status || '').toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Controls: Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-serif-heading tracking-tight">
            CPR Bookings
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Displaying dynamic customer bookings
          </p>
        </div>

        <button
          onClick={loadBookings}
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-2 text-xs"
          title="Refresh List"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Search Input & Status Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search orders by booking ref, address, customer ID, or status..."
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

      {/* Main Table Card (Exact Customer Orders Monitor style) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Customer Orders Monitor</h3>
            <p className="text-xs text-slate-400 font-medium">Real-time orders placed by mobile app customers (<code className="text-rose-600 font-mono text-[11px]">cpr_bookings</code>)</p>
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
            <p className="text-sm font-bold text-slate-500">No customer bookings found</p>
            <p className="text-xs text-slate-400 mt-1">Try refining your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">BOOKING REF</th>
                  <th className="px-6 py-4">CUSTOMER NAME</th>
                  <th className="px-6 py-4">PICKUP & DROPOFF</th>
                  <th className="px-6 py-4">VEHICLE / SPEED</th>
                  <th className="px-6 py-4">TOTAL AMOUNT</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4">ORDER DATE</th>
                  <th className="px-6 py-4 text-right">ADMIN ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                {filteredBookings.map((ord) => {
                  const custName = formatCustomerName(ord.customer_id);
                  const shortCustId = ord.customer_id ? String(ord.customer_id).substring(0, 12) + '...' : '—';
                  const serviceDisplay = (ord.service_type || 'CPR Service').toUpperCase();

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Order Ref Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full text-xs whitespace-nowrap inline-block">
                          {ord.booking_ref || `CPR-${String(ord.id).substring(0, 5).toUpperCase()}`}
                        </span>
                      </td>

                      {/* Customer Name & ID */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="min-w-0">
                          <span className="font-extrabold text-slate-900 block truncate max-w-[160px]" title={custName}>
                            {custName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[140px]" title={ord.customer_id}>
                            {shortCustId}
                          </span>
                        </div>
                      </td>

                      {/* Pickup & Dropoff Location */}
                      <td className="px-6 py-4 max-w-[220px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-900 font-bold truncate" title={ord.address || 'RouteK9 Training Center, Oakland'}>
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{ord.address || 'RouteK9 Training Center, Oakland'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle / Speed (Service & Attendees info) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 truncate max-w-[180px]" title={serviceDisplay}>
                          {serviceDisplay}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                          {ord.attendees || 1} ATTENDEE • {(parseFloat(ord.duration_hours) || 3).toFixed(1)} HRS
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-6 py-4 font-black text-emerald-600 text-base whitespace-nowrap">
                        ${parseFloat(ord.total_price || 0).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(ord.status)}
                      </td>

                      {/* Order Date */}
                      <td className="px-6 py-4 text-slate-500 font-bold whitespace-nowrap">
                        {formatDate(ord.scheduled_at || ord.created_at)}
                      </td>

                      {/* Admin Actions Button */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedBooking(ord)}
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
                <span className="text-slate-500">Service Type</span>
                <span className="font-bold text-slate-900">{selectedBooking.service_type}</span>
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
