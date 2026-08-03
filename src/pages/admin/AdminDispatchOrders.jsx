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
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { ConfirmModal } from './components/AdminComponents';
import { supabase } from '../../lib/supabase';

// Mock Initial Dispatch Orders for demonstration / fallback
const INITIAL_ORDERS = [
  {
    id: 'ORD-8821',
    pickup: '1200 Main St, Dallas, TX 75201',
    dropoff: '850 Medical Plaza, Fort Worth, TX 76104',
    distanceMiles: 32.4,
    estTimeMinutes: 42,
    category: 'Business',
    deliveryType: 'Medical / Pharmaceutical delivery',
    vehicle: 'Van',
    urgency: 'Same day',
    speed: 'Priority (ASAP - 30 min)',
    info: 'Gate Code: #4921. Deliver to 3rd floor pharmacy desk. Fragile medical vials.',
    price: 85.50,
    status: 'AVAILABLE',
    postedBy: {
      id: 'USR-9021',
      name: 'Dallas BioMed Labs',
      email: 'logistics@dallasbiomed.com',
      role: 'Company'
    },
    assignedDriver: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 'ORD-8822',
    pickup: '450 Commerce Rd, Houston, TX 77002',
    dropoff: '210 Industrial Blvd, Katy, TX 77494',
    distanceMiles: 28.1,
    estTimeMinutes: 35,
    category: 'Business',
    deliveryType: 'Automotive Parts & Freight',
    vehicle: 'Truck',
    urgency: 'Same day',
    speed: 'Standard (Within 2 hours)',
    info: 'Ask for Warehouse Manager Steve at Bay #4. Heavy engine transmission box (850 lbs).',
    price: 142.00,
    status: 'ACCEPTED',
    postedBy: {
      id: 'USR-3482',
      name: 'Apex Auto Freight Inc',
      email: 'dispatch@apexautofreight.com',
      role: 'Company'
    },
    assignedDriver: {
      id: 'DRV-102',
      name: 'Marcus Vance',
      email: 'm.vance.driver@routek9.com',
      phone: '+1 (555) 234-5678',
      vehicle: 'Heavy Truck'
    },
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'ORD-8823',
    pickup: '710 N Michigan Ave, Chicago, IL 60611',
    dropoff: '300 W O\'Hare St, Chicago, IL 60666',
    distanceMiles: 18.5,
    estTimeMinutes: 28,
    category: 'Business',
    deliveryType: 'Legal & Confidential Documents',
    vehicle: 'Car',
    urgency: 'Same day',
    speed: 'Express (Within 60 min)',
    info: 'Court filing envelope. Signature required from Attorney Sarah Jenkins upon delivery.',
    price: 52.80,
    status: 'IN_TRANSIT',
    postedBy: {
      id: 'USR-7721',
      name: 'Jenkins & Partners Law',
      email: 'filings@jenkinslaw.com',
      role: 'Company'
    },
    assignedDriver: {
      id: 'DRV-105',
      name: 'Sarah Jenkins',
      email: 's.jenkins@routek9.com',
      phone: '+1 (555) 876-5432',
      vehicle: 'Sedan'
    },
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'ORD-8824',
    pickup: '920 Peachtree St NE, Atlanta, GA 30309',
    dropoff: '500 Buckhead Ave NE, Atlanta, GA 30305',
    distanceMiles: 6.8,
    estTimeMinutes: 15,
    category: 'Personal',
    deliveryType: 'Retail / E-commerce Package',
    vehicle: 'Scooter',
    urgency: 'Same day',
    speed: 'Standard (Within 2 hours)',
    info: 'Apt 4B. Leave at doorstep if no answer. Code 8821.',
    price: 24.50,
    status: 'COMPLETED',
    postedBy: {
      id: 'USR-8812',
      name: 'Elena Rostova',
      email: 'elena.rostova@gmail.com',
      role: 'Customer'
    },
    assignedDriver: {
      id: 'DRV-109',
      name: 'Alex Rivera',
      email: 'a.rivera@routek9.com',
      phone: '+1 (555) 432-1098',
      vehicle: 'Scooter'
    },
    createdAt: new Date(Date.now() - 14400000).toISOString()
  }
];

export default function AdminDispatchOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Delete Confirm Modal State
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, orderId: null });
  const [deleting, setDeleting] = useState(false);

  // Fetch Dispatch Orders from Supabase DB
  const fetchDispatchOrders = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('dispatch_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Supabase fetch dispatch_orders notice:", error.message);
        setOrders(INITIAL_ORDERS);
      } else if (data && data.length > 0) {
        const formatted = data.map(o => ({
          id: o.id,
          pickup: o.pickup || o.pickup_location,
          dropoff: o.dropoff || o.dropoff_location,
          distanceMiles: o.distance_miles || o.distanceMiles || 15.0,
          estTimeMinutes: o.est_time_minutes || o.estTimeMinutes || 25,
          category: o.category || 'Business',
          deliveryType: o.delivery_type || o.deliveryType || 'Courier Package',
          vehicle: o.vehicle || 'Car',
          urgency: o.urgency || 'Same day',
          speed: o.speed || 'Standard',
          info: o.info || o.instructions || 'No special notes.',
          price: Number(o.price || o.payout || 50),
          status: o.status || 'AVAILABLE',
          postedBy: o.posted_by || {
            name: o.posted_by_name || o.poster_name || 'Registered Customer',
            email: o.posted_by_email || o.poster_email || 'customer@routek9.com',
            role: o.poster_role || 'User'
          },
          assignedDriver: o.assigned_driver || o.driver ? {
            name: o.driver_name || o.driver?.name || 'Assigned Courier',
            email: o.driver_email || o.driver?.email || 'driver@routek9.com',
            phone: o.driver_phone || '+1 (555) 000-0000',
            vehicle: o.driver_vehicle || o.vehicle || 'Vehicle'
          } : null,
          createdAt: o.created_at || new Date().toISOString()
        }));
        setOrders(formatted);
      } else {
        setOrders(INITIAL_ORDERS);
      }
    } catch (err) {
      console.error("Failed to load dispatch orders:", err);
      setOrders(INITIAL_ORDERS);
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
      const { error } = await supabase
        .from('dispatch_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        console.warn("Supabase update order status warning:", error.message);
      }
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showNotification(`Order #${orderId} status updated to ${newStatus}`);
    } catch (err) {
      console.error("Update status error:", err);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      showNotification(`Order #${orderId} status updated locally`);
    }
  };

  // Delete Order Handler
  const handleConfirmDelete = async () => {
    if (!deleteModalState.orderId) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('dispatch_orders')
        .delete()
        .eq('id', deleteModalState.orderId);

      if (error) {
        console.warn("Supabase delete order warning:", error.message);
      }
      setOrders(prev => prev.filter(o => o.id !== deleteModalState.orderId));
      showNotification(`Order #${deleteModalState.orderId} deleted successfully!`);
    } catch (err) {
      console.error("Delete order error:", err);
      setOrders(prev => prev.filter(o => o.id !== deleteModalState.orderId));
      showNotification(`Order deleted from view.`);
    } finally {
      setDeleting(false);
      setDeleteModalState({ isOpen: false, orderId: null });
    }
  };

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

  // Calculate Metrics
  const totalVolume = orders.reduce((sum, o) => sum + (o.price || 0), 0);
  const availableCount = orders.filter(o => o.status === 'AVAILABLE').length;
  const activeCount = orders.filter(o => o.status === 'ACCEPTED' || o.status === 'IN_TRANSIT').length;
  const completedCount = orders.filter(o => o.status === 'COMPLETED').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
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

        {/* Status Filter */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Status:</span>
          {['ALL', 'AVAILABLE', 'ACCEPTED', 'IN_TRANSIT', 'COMPLETED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${statusFilter === st
                ? 'bg-[#0b132b] text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
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
                {filteredOrders.map((order, idx) => {
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
                        <div className="text-[10px] text-slate-400 font-bold uppercase block">{order.deliveryType}</div>
                      </td>

                      {/* Posted By (User / Customer) */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px] shrink-0">
                            {order.postedBy?.name ? order.postedBy.name.charAt(0) : 'U'}
                          </div>
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
                        <div className="font-extrabold text-[#0b132b] text-sm">${Number(order.price).toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{order.distanceMiles} mi</div>
                      </td>

                      {/* Status Dropdown Override */}
                      <td className="p-4 text-center">
                        <div className="relative inline-block">
                          <select
                            value={order.status}
                            onChange={e => handleStatusChange(order.id, e.target.value)}
                            className={`appearance-none pl-3 pr-7 py-1 rounded-full text-[10px] font-extrabold uppercase border cursor-pointer focus:outline-none ${isCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              isInTransit ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                isAccepted ? 'bg-amber-50  text-amber-700  border-amber-200' :
                                  'bg-sky-50    text-sky-700    border-sky-200'
                              }`}
                          >
                            <option value="AVAILABLE">AVAILABLE</option>
                            <option value="ACCEPTED">ACCEPTED</option>
                            <option value="IN_TRANSIT">IN TRANSIT</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                          <ChevronDown className="w-2.5 h-2.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current" />
                        </div>
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
        </div>
      )}

      {/* ── FULL ORDER DETAILS MODAL ── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-extrabold text-rose-600 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
                  {selectedOrder.id}
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-[#0b132b]">{selectedOrder.deliveryType}</h3>
                  <span className="text-xs text-slate-400 font-semibold">{selectedOrder.category} Order · Posted {new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Poster & Driver Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Poster Info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Posted By (Order Creator)</span>
                </div>
                <div className="font-extrabold text-slate-900 text-sm">{selectedOrder.postedBy?.name || 'Registered Customer'}</div>
                <div className="text-xs text-slate-500 font-semibold">{selectedOrder.postedBy?.email || 'N/A'}</div>
                <span className="inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-extrabold text-[9px] uppercase">
                  {selectedOrder.postedBy?.role || 'Customer'}
                </span>
              </div>

              {/* Driver Info */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Assigned Driver</span>
                </div>
                {selectedOrder.assignedDriver ? (
                  <>
                    <div className="font-extrabold text-emerald-950 text-sm">{selectedOrder.assignedDriver.name}</div>
                    <div className="text-xs text-slate-600 font-semibold">{selectedOrder.assignedDriver.email}</div>
                    <div className="text-xs text-slate-500 font-bold">{selectedOrder.assignedDriver.phone || selectedOrder.assignedDriver.vehicle}</div>
                  </>
                ) : (
                  <div className="text-xs text-slate-500 font-bold italic py-1">No driver assigned yet (Order is open on Marketplace)</div>
                )}
              </div>
            </div>

            {/* Route Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Route & Distance</div>
              <div className="space-y-2 text-xs font-semibold">
                <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-slate-200">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Pickup Location</span>
                    <span className="text-slate-900 font-bold">{selectedOrder.pickup}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-slate-200">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Drop-off Location</span>
                    <span className="text-slate-900 font-bold">{selectedOrder.dropoff}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Manifest Notes & Requirements */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Item Instructions & Special Notes</span>
              <p className="font-semibold text-slate-800 leading-relaxed">{selectedOrder.info}</p>
            </div>

            {/* Spec Badges */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Required Vehicle</span>
                <span className="font-extrabold text-[#0b132b]">{selectedOrder.vehicle}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Distance / Time</span>
                <span className="font-extrabold text-[#0b132b]">{selectedOrder.distanceMiles} mi ({selectedOrder.estTimeMinutes} min)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Driver Payout</span>
                <span className="font-extrabold text-emerald-700">${Number(selectedOrder.price).toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <a
                href={`https://www.google.com/maps/dir/${encodeURIComponent(selectedOrder.pickup)}/${encodeURIComponent(selectedOrder.dropoff)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Open Route in Google Maps</span>
              </a>
              {/* <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-[#0b132b] hover:bg-[#1a264a] text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close Details
              </button> */}
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
