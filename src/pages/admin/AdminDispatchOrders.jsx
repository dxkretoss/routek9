import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  MapPin,
  Clock,
  DollarSign,
  User,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Eye,
  Trash2,
  Loader2,
  X,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
  Sparkles,
  Box,
  Scale,
  Phone,
  Mail,
  Navigation,
  Image as ImageIcon,
  Zap,
  Layers,
  Repeat
} from 'lucide-react';
import { ConfirmModal } from './components/AdminComponents';
import { supabase } from '../../lib/supabase';

export default function AdminDispatchOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Delete Confirm Modal State
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, orderId: null });
  const [deleting, setDeleting] = useState(false);

  // Helper to format vehicle name and resolve UUIDs to readable vehicle types
  const formatVehicleName = (val, vMap = {}) => {
    if (!val) return 'Cargo Van';
    const str = String(val).trim();
    if (vMap[str.toLowerCase()]) return vMap[str.toLowerCase()];
    // If it's a raw UUID and not in map, provide clean fallback
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
      return 'Cargo Van';
    }
    return str;
  };

  // Fetch Dispatch Orders from Supabase DB
  const fetchDispatchOrders = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch profiles and vehicle_types in parallel
      let profilesList = [];
      let vehicleMap = {};
      try {
        const [cpRes, pRes, vRes] = await Promise.allSettled([
          supabase.from('customer_profiles').select('*'),
          supabase.from('profiles').select('id, email, full_name, role, phone'),
          supabase.from('vehicle_types').select('*')
        ]);

        const combinedMap = new Map();
        if (pRes.status === 'fulfilled' && pRes.value.data) {
          pRes.value.data.forEach(p => { if (p.id) combinedMap.set(String(p.id).toLowerCase(), p); });
        }
        if (cpRes.status === 'fulfilled' && cpRes.value.data) {
          cpRes.value.data.forEach(cp => {
            if (cp.id) {
              const existing = combinedMap.get(String(cp.id).toLowerCase()) || {};
              combinedMap.set(String(cp.id).toLowerCase(), { ...existing, ...cp, role: cp.role || 'customer' });
            }
          });
        }
        profilesList = Array.from(combinedMap.values());

        if (vRes.status === 'fulfilled' && vRes.value.data) {
          vRes.value.data.forEach(v => {
            const vName = v.vehicle_name || v.name || v.title || v.type_name;
            if (vName) {
              vehicleMap[String(v.id).toLowerCase()] = vName;
            }
          });
        }
      } catch (profFetchErr) {
        console.warn("Profiles / Vehicles fetch exception:", profFetchErr);
      }

      // 2. Fetch customer orders
      const { data, error } = await supabase
        .from('customer_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        const formatted = data.map(o => {
          // Find poster profile
          const poster = profilesList.find(p => String(p.id).toLowerCase() === String(o.customer_id || '').toLowerCase()) || {
            full_name: o.customer_name || o.sender_name || 'Customer',
            email: o.customer_email || 'customer@routek9.com',
            phone: o.customer_phone || o.sender_phone || '',
            role: 'CUSTOMER'
          };

          // Find driver profile
          const driverProfile = o.driver_id ? profilesList.find(p => p.id === o.driver_id) : null;

          // Determine UI status
          let uiStatus = 'AVAILABLE';
          const statusLower = String(o.order_status || '').toLowerCase();
          if (o.driver_id) {
            if (statusLower === 'in_transit' || statusLower === 'ongoing') uiStatus = 'IN_TRANSIT';
            else if (statusLower === 'completed' || statusLower === 'delivered') uiStatus = 'COMPLETED';
            else uiStatus = 'ACCEPTED';
          } else {
            uiStatus = 'AVAILABLE';
          }

          const vehicleName = formatVehicleName(o.vehicle_type, vehicleMap);

          return {
            ...o,
            id: o.order_ref || `ORD-${o.id.substring(0, 6).toUpperCase()}`,
            order_ref: o.order_ref || `ORD-${o.id.substring(0, 6).toUpperCase()}`,
            rawId: o.id,
            customer_id: o.customer_id,
            pickup: o.pickup_address || 'Unknown Pickup',
            pickup_address: o.pickup_address || 'Unknown Pickup',
            pickup_lat: o.pickup_lat,
            pickup_lng: o.pickup_lng,
            dropoff: o.dropoff_address || 'Unknown Dropoff',
            dropoff_address: o.dropoff_address || 'Unknown Dropoff',
            dropoff_lat: o.dropoff_lat,
            dropoff_lng: o.dropoff_lng,
            distanceMiles: Number(o.distance_miles || 0),
            distance_miles: Number(o.distance_miles || 0),
            estimated_time: o.estimated_time || 'Within 60 min',
            estTimeMinutes: o.estimated_time || 'Within 60 min',
            category: o.category || 'Instant',
            deliveryType: o.delivery_type || o.category || 'Business',
            delivery_type: o.delivery_type || o.category || 'Business',
            vehicle: vehicleName,
            vehicle_type: vehicleName,
            schedule_type: o.schedule_type || 'Same-day',
            scheduled_at: o.scheduled_at,
            trip_type: o.trip_type || 'one_way',
            speed_tier: o.speed_tier || 'standard',
            pkg_length_in: Number(o.pkg_length_in || 0),
            pkg_width_in: Number(o.pkg_width_in || 0),
            pkg_height_in: Number(o.pkg_height_in || 0),
            pkg_weight_lbs: Number(o.pkg_weight_lbs || 0),
            extras_stairs: Boolean(o.extras_stairs),
            extras_wait_time: Boolean(o.extras_wait_time),
            additional_info: o.additional_info || o.special_instructions || o.instructions || '',
            info: o.additional_info || o.special_instructions || o.instructions || 'No special notes.',
            subtotal: Number(o.subtotal || 0),
            service_fee: Number(o.service_fee || 0),
            extras_fee: Number(o.extras_fee || 0),
            total_amount: Number(o.total_amount ?? o.price ?? o.payout ?? 0),
            price: Number(o.total_amount ?? o.price ?? o.payout ?? 0),
            status: uiStatus,
            order_status: o.order_status || 'pending',
            package_photo_urls: Array.isArray(o.package_photo_urls) ? o.package_photo_urls : [],
            package_type_name: o.package_type_name,
            recurring_interval: o.recurring_interval,
            postedBy: {
              id: o.customer_id || '',
              name: poster.full_name || 'Customer',
              email: poster.email || 'customer@routek9.com',
              phone: poster.phone || '',
              role: poster.role || 'CUSTOMER'
            },
            assignedDriver: driverProfile ? {
              id: driverProfile.id,
              name: driverProfile.full_name || 'Assigned Driver',
              email: driverProfile.email || 'driver@routek9.com',
              phone: driverProfile.phone || '+1 (555) 000-0000',
              vehicle: driverProfile.vehicle || vehicleName
            } : null,
            createdAt: o.created_at || new Date().toISOString(),
            updatedAt: o.updated_at
          };
        });
        setOrders(formatted);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to load dispatch orders from database:", err);
      setErrorMsg("Failed to load dispatch orders from database.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatchOrders();
  }, []);

  const showNotification = (msg, isErr = false) => {
    if (isErr) setErrorMsg(msg);
    else setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 4000);
  };

  // Update Status Handler
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const matchedOrder = orders.find(o => o.id === orderId || o.rawId === orderId);
      if (!matchedOrder) return;

      let dbOrderStatus = 'pending';
      let dbDriverId = matchedOrder.assignedDriver?.id || null;
      let dbDeliveryStatus = 'pending'; // 'status' column

      if (newStatus === 'AVAILABLE') {
        dbOrderStatus = 'pending';
        dbDriverId = null;
        dbDeliveryStatus = 'pending';
      } else if (newStatus === 'ACCEPTED') {
        dbOrderStatus = 'accepted';
        dbDeliveryStatus = 'pending';
      } else if (newStatus === 'IN_TRANSIT') {
        dbOrderStatus = 'in_transit';
        dbDeliveryStatus = 'ongoing';
      } else if (newStatus === 'COMPLETED') {
        dbOrderStatus = 'completed';
        dbDeliveryStatus = 'delivered';
      } else if (newStatus === 'CANCELLED') {
        dbOrderStatus = 'cancelled';
        dbDeliveryStatus = 'pending';
      }

      const { error } = await supabase
        .from('customer_orders')
        .update({
          order_status: dbOrderStatus,
          driver_id: dbDriverId,
          status: dbDeliveryStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchedOrder.rawId || matchedOrder.id);

      if (error) {
        throw error;
      }
      setOrders(prev => prev.map(o => (o.rawId === matchedOrder.rawId || o.id === matchedOrder.id) ? { ...o, status: newStatus } : o));
      showNotification(`Order #${orderId} status updated to ${newStatus}`);
    } catch (err) {
      console.error("Update status error:", err);
      showNotification(`Failed to update status in database.`, true);
    }
  };

  // Delete Order Handler
  const handleConfirmDelete = async () => {
    if (!deleteModalState.orderId) return;
    setDeleting(true);
    try {
      const matchedOrder = orders.find(o => o.id === deleteModalState.orderId || o.rawId === deleteModalState.orderId);
      const targetId = matchedOrder ? (matchedOrder.rawId || matchedOrder.id) : deleteModalState.orderId;

      const { error } = await supabase
        .from('customer_orders')
        .delete()
        .eq('id', targetId);

      if (error) {
        throw error;
      }
      setOrders(prev => prev.filter(o => o.rawId !== targetId));
      showNotification(`Order deleted successfully!`);
    } catch (err) {
      console.error("Delete order error:", err);
      showNotification(`Failed to delete order from database.`, true);
    } finally {
      setDeleting(false);
      setDeleteModalState({ isOpen: false, orderId: null });
    }
  };

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = q === '' ||
      o.id.toLowerCase().includes(q) ||
      o.pickup.toLowerCase().includes(q) ||
      o.dropoff.toLowerCase().includes(q) ||
      (o.postedBy?.name && o.postedBy.name.toLowerCase().includes(q)) ||
      (o.postedBy?.email && o.postedBy.email.toLowerCase().includes(q)) ||
      (o.assignedDriver?.name && o.assignedDriver.name.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Calculate Metrics
  const totalVolume = orders.reduce((sum, o) => sum + (o.price || 0), 0);
  const availableCount = orders.filter(o => o.status === 'AVAILABLE').length;
  const activeCount = orders.filter(o => o.status === 'ACCEPTED' || o.status === 'IN_TRANSIT').length;
  const completedCount = orders.filter(o => o.status === 'COMPLETED').length;

  return (
    <div className=" mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-serif-heading tracking-tight">
              Dispatch Orders & Marketplace Monitor
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Real-time administrative view of placed courier dispatches, customer posters, assigned drivers, and live fulfillment statuses.
          </p>
        </div>

        <button
          onClick={fetchDispatchOrders}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
        >
          <span>Refresh Live Orders</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Dispatch Volume</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] font-serif-heading">
            ${totalVolume.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold">{orders.length} total Marketplace orders</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Available Marketplace</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-600 font-serif-heading">
            {availableCount}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold">Open for drivers to accept</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Active Deliveries</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-serif-heading">
            {activeCount}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold">Accepted or currently in transit</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Completed Orders</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-serif-heading">
            {completedCount}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold">Successfully delivered</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order ID, city, customer, driver..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative self-start sm:self-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-3.5 pr-8 py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition-all appearance-none"
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
          <span className="text-xs font-bold">Loading marketplace orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No dispatch orders match filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms or status filter.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0b132b] text-white text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="p-4 rounded-tl-2xl">Order ID</th>
                  <th className="p-4">Posted By (Customer)</th>
                  <th className="p-4">Assigned Driver</th>
                  <th className="p-4">Pickup & Drop-off Route</th>
                  <th className="p-4 text-center">Payout</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center rounded-tr-2xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {paginatedOrders.map((order, idx) => {
                  const isAvailable = order.status === 'AVAILABLE';
                  const isAccepted = order.status === 'ACCEPTED';
                  const isInTransit = order.status === 'IN_TRANSIT';
                  const isCompleted = order.status === 'COMPLETED';

                  return (
                    <tr key={order.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order ID */}
                      <td className="p-4">
                        <div className="font-mono font-extrabold text-rose-600 text-xs bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 inline-block mb-1">
                          {order.id}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase block">{order.category}</div>
                      </td>

                      {/* Posted By (User / Customer) */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{order.postedBy?.name || 'Registered Customer'}</div>
                            <div className="text-[10px] text-slate-400">{order.postedBy?.email || 'N/A'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Driver */}
                      <td className="p-4">
                        {order.assignedDriver ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-[10px] shrink-0">
                              <Truck className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="font-bold text-emerald-950 text-xs">{order.assignedDriver.name}</div>
                              <div className="text-[10px] text-slate-400">{order.assignedDriver.email} · <span className="font-bold text-slate-600">{order.vehicle}</span></div>
                            </div>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 font-bold text-[10px] border border-slate-200 uppercase inline-block">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Pickup & Drop-off Route */}
                      <td className="p-4 max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-start gap-1.5 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            <span className="truncate text-slate-800">{order.pickup}</span>
                          </div>
                          <div className="flex items-start gap-1.5 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="truncate text-slate-600">{order.dropoff}</span>
                          </div>
                        </div>
                      </td>

                      {/* Payout */}
                      <td className="p-4 text-center">
                        <div className="font-extrabold text-[#0b132b] text-sm">${Number(order.total_amount ?? order.price ?? 0).toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{order.distanceMiles} mi</div>
                      </td>

                      {/* Read-Only Live Status Badge */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                            isInTransit ? 'bg-purple-50 text-purple-700 border-purple-300' :
                            isAccepted ? 'bg-amber-50 text-amber-700 border-amber-300' :
                            order.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                            'bg-sky-50 text-sky-700 border-sky-300'
                          }`}
                        >
                          ● {order.status === 'IN_TRANSIT' ? 'IN TRANSIT' : (order.status || 'AVAILABLE')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            title="View Full Order Details"
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Details</span>
                          </button>
                          <button
                            onClick={() => setDeleteModalState({ isOpen: true, orderId: order.id })}
                            title="Delete Order"
                            className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filteredOrders.length > 0 && (
            <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
              <div>
                Showing <span className="font-extrabold text-slate-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-extrabold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of{' '}
                <span className="font-extrabold text-slate-900">{filteredOrders.length}</span> orders
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
      )}

      {/* ── FULL ORDER DETAILS MODAL ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-sm font-extrabold text-rose-600 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200 shadow-2xs">
                  {selectedOrder.order_ref || selectedOrder.id}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-[#0b132b] capitalize">
                      {selectedOrder.delivery_type || selectedOrder.category || 'Package Delivery'}
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {selectedOrder.category || 'Instant'}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${selectedOrder.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                      selectedOrder.status === 'IN_TRANSIT' ? 'bg-indigo-100 text-indigo-800' :
                        selectedOrder.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                      }`}>
                      {selectedOrder.order_status || selectedOrder.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">
                    Posted on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Poster & Driver Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Poster Info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Posted By (Order Creator)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-extrabold text-[9px] uppercase">
                    {selectedOrder.postedBy?.role || 'Customer'}
                  </span>
                </div>
                <div className="font-extrabold text-slate-900 text-sm">{selectedOrder.postedBy?.name || 'Registered Customer'}</div>
                <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{selectedOrder.postedBy?.email || 'N/A'}</span>
                </div>
                {selectedOrder.postedBy?.phone && (
                  <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{selectedOrder.postedBy?.phone}</span>
                  </div>
                )}
                {selectedOrder.customer_id && (
                  <div className="text-[10px] font-mono text-slate-400">
                    ID: {selectedOrder.customer_id}
                  </div>
                )}
              </div>

              {/* Driver Info */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Assigned Driver</span>
                  </div>
                  {selectedOrder.assignedDriver ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[9px] uppercase">
                      Claimed
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[9px] uppercase">
                      Open
                    </span>
                  )}
                </div>
                {selectedOrder.assignedDriver ? (
                  <>
                    <div className="font-extrabold text-emerald-950 text-sm">{selectedOrder.assignedDriver.name}</div>
                    <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{selectedOrder.assignedDriver.email}</span>
                    </div>
                    {selectedOrder.assignedDriver.phone && (
                      <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{selectedOrder.assignedDriver.phone}</span>
                      </div>
                    )}
                    <div className="text-[11px] font-bold text-slate-500">
                      Vehicle: <span className="text-slate-800 font-extrabold">{selectedOrder.assignedDriver.vehicle}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-500 font-bold italic py-2">
                    No driver assigned yet (Order is available on Dispatch Marketplace)
                  </div>
                )}
              </div>
            </div>

            {/* Route & Locations with GPS Coordinates */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Route & Locations</span>
                <span className="text-slate-500 font-bold">{selectedOrder.distance_miles} miles · {selectedOrder.estimated_time}</span>
              </div>
              <div className="space-y-2 text-xs font-semibold">
                <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Pickup Location</span>
                      {(selectedOrder.pickup_lat && selectedOrder.pickup_lng) && (
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          {Number(selectedOrder.pickup_lat).toFixed(4)}, {Number(selectedOrder.pickup_lng).toFixed(4)}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-900 font-bold block mt-0.5">{selectedOrder.pickup}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Drop-off Location</span>
                      {(selectedOrder.dropoff_lat && selectedOrder.dropoff_lng) && (
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          {Number(selectedOrder.dropoff_lat).toFixed(4)}, {Number(selectedOrder.dropoff_lng).toFixed(4)}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-900 font-bold block mt-0.5">{selectedOrder.dropoff}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Dimensions & Requirements Grid */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Package Specifications & Dimensions
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                {/* Dimensions */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dimensions (L×W×H)</span>
                  <span className="font-extrabold text-[#0b132b] text-xs">
                    {(selectedOrder.pkg_length_in || selectedOrder.pkg_width_in || selectedOrder.pkg_height_in) ? (
                      `${selectedOrder.pkg_length_in}" × ${selectedOrder.pkg_width_in}" × ${selectedOrder.pkg_height_in}"`
                    ) : (
                      'Standard'
                    )}
                  </span>
                </div>

                {/* Weight */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Weight</span>
                  <span className="font-extrabold text-[#0b132b] text-xs">
                    {selectedOrder.pkg_weight_lbs ? `${selectedOrder.pkg_weight_lbs} lbs` : 'Standard'}
                  </span>
                </div>

                {/* Vehicle */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Vehicle Type</span>
                  <span className="font-extrabold text-[#0b132b] text-xs capitalize">
                    {selectedOrder.vehicle}
                  </span>
                </div>

                {/* Schedule & Speed */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Speed Tier</span>
                  <span className="font-extrabold text-[#0b132b] text-xs capitalize">
                    {selectedOrder.speed_tier || 'Standard'}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Options & Extras */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Schedule Type</span>
                <span className="font-bold text-slate-800 capitalize">
                  {selectedOrder.schedule_type || 'Same day'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Trip Type</span>
                <span className="font-bold text-slate-800 capitalize">
                  {selectedOrder.trip_type === 'round_trip' ? 'Round Trip' : 'One Way'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Stairs Assistance</span>
                <span className={`font-bold ${selectedOrder.extras_stairs ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {selectedOrder.extras_stairs ? 'Yes (Included)' : 'No'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Extra Wait Time</span>
                <span className={`font-bold ${selectedOrder.extras_wait_time ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {selectedOrder.extras_wait_time ? 'Yes (Included)' : 'No'}
                </span>
              </div>
            </div>

            {/* Manifest Notes & Requirements */}
            {(selectedOrder.additional_info || selectedOrder.info) && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Item Instructions & Special Notes</span>
                </span>
                <p className="font-semibold text-slate-800 leading-relaxed pt-0.5">
                  {selectedOrder.additional_info || selectedOrder.info}
                </p>
              </div>
            )}

            {/* Pricing & Financial Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Pricing & Fees Breakdown</span>
                <span className="font-mono text-emerald-700 font-extrabold text-sm">
                  Total: ${Number(selectedOrder.total_amount || 0).toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">Subtotal</span>
                  <span className="font-bold text-slate-900">${Number(selectedOrder.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">Service Fee</span>
                  <span className="font-bold text-slate-900">${Number(selectedOrder.service_fee || 0).toFixed(2)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">Extras Fee</span>
                  <span className="font-bold text-slate-900">${Number(selectedOrder.extras_fee || 0).toFixed(2)}</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold block">Total Amount / Payout</span>
                  <span className="font-extrabold text-emerald-800">${Number(selectedOrder.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <a
                href={`https://www.google.com/maps/dir/${encodeURIComponent(selectedOrder.pickup)}/${encodeURIComponent(selectedOrder.dropoff)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Open Route in Google Maps</span>
              </a>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-md"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Delete Dispatch Order"
        message={`Are you sure you want to delete order #${deleteModalState.orderId}? This cannot be undone.`}
        confirmLabel="Delete Order"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, orderId: null })}
        loading={deleting}
      />
    </div>
  );
}
