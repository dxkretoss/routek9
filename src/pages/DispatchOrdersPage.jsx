import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  DollarSign,
  Package,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileText,
  Upload,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  Check,
  ChevronRight,
  Info,
  Car,
  Navigation,
  Loader2,
  RefreshCw,
  Eye,
  X,
  Scale,
  Box,
  Layers,
  ExternalLink,
  Compass,
  Map as MapIcon,
  Globe
} from 'lucide-react';
import { supabase, fetchCustomerOrdersFromDb, updateCustomerOrderStatusInDb, updateCustomerStatusColumnInDb } from '../lib/supabase';

export default function DispatchOrdersPage({ currentUser, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'accepted'
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);
  const [acceptedModalState, setAcceptedModalState] = useState({ isOpen: false, order: null });
  const [claimFailedModalState, setClaimFailedModalState] = useState({ isOpen: false, order: null });
  const [declinedOrderIds, setDeclinedOrderIds] = useState([]);
  const [selectedOrderDetailModal, setSelectedOrderDetailModal] = useState(null);

  // Helper function to safely format dynamic values with '-' fallback
  const getDynamicVal = (val, formatter = null) => {
    if (val === null || val === undefined || String(val).trim() === '') {
      return '-';
    }
    return formatter ? formatter(val) : String(val).trim();
  };

  // Helper to map DB row from `customer_orders` to 100% dynamic UI order object
  const mapDbOrderToUiOrder = (row) => {
    const extras = [];
    if (row.extras_stairs) extras.push('Stairs required (+$5)');
    if (row.extras_wait_time) extras.push('Wait time expected (+$5/5min)');

    // Dynamic package dimensions & weight tag
    const h = row.pkg_height_in;
    const w = row.pkg_width_in;
    const l = row.pkg_length_in;
    const weight = row.pkg_weight_lbs;
    const hasDims = (h !== null && h !== undefined && h !== '') || (w !== null && w !== undefined && w !== '') || (l !== null && l !== undefined && l !== '');
    const hasWeight = weight !== null && weight !== undefined && weight !== '';
    if (hasDims || hasWeight) {
      const dimsStr = hasDims ? `${h || 0}"×${w || 0}"×${l || 0}"` : '';
      const weightStr = hasWeight ? `${weight} lbs` : '';
      const pkgTag = [dimsStr, weightStr].filter(Boolean).join(' • ');
      if (pkgTag) extras.push(`Pkg: ${pkgTag}`);
    }

    if (row.recurring_interval && String(row.recurring_interval).trim() !== '') {
      extras.push(`Recurring: ${row.recurring_interval}`);
    }

    // Standardize status for UI display
    const rawStatus = (row.order_status || '').toLowerCase();
    let uiStatus = 'AVAILABLE';
    if (rawStatus === 'pending' || rawStatus === 'available' || !rawStatus) {
      uiStatus = 'AVAILABLE';
    } else if (rawStatus === 'accepted') {
      uiStatus = 'ACCEPTED';
    } else if (rawStatus === 'in_transit' || rawStatus === 'in_progress' || rawStatus === 'active') {
      uiStatus = 'IN_TRANSIT';
    } else if (rawStatus === 'completed' || rawStatus === 'delivered') {
      uiStatus = 'COMPLETED';
    } else if (rawStatus === 'rejected' || rawStatus === 'declined' || rawStatus === 'cancelled') {
      uiStatus = 'REJECTED';
    }

    // Dynamic Vehicle Text
    const vehicleText = getDynamicVal(row.vehicle_type, (v) => String(v).toUpperCase());

    // Dynamic Speed Tier Text
    const speedTierText = getDynamicVal(row.speed_tier, (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1));
    const estTimeText = row.estimated_time && String(row.estimated_time).trim() !== '' ? String(row.estimated_time).trim() : null;
    let speedFormatted = speedTierText;
    if (speedTierText !== '-' && estTimeText) {
      speedFormatted = `${speedTierText} (${estTimeText})`;
    } else if (speedTierText === '-' && estTimeText) {
      speedFormatted = estTimeText;
    }

    // Dynamic Delivery Type Text
    let deliveryTypeText = '-';
    if (row.delivery_type && String(row.delivery_type).trim() !== '') {
      deliveryTypeText = String(row.delivery_type).trim();
    } else if (row.category && String(row.category).trim() !== '') {
      deliveryTypeText = String(row.category).trim();
    }

    // 1. Dynamic Driver Payout Amount
    let numericPrice = 0;
    if (row.total_amount !== null && row.total_amount !== undefined && row.total_amount !== '') {
      const parsed = typeof row.total_amount === 'number' ? row.total_amount : parseFloat(String(row.total_amount));
      if (!isNaN(parsed)) numericPrice = parsed;
    }
    const priceDisplay = numericPrice > 0
      ? `$${numericPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : (row.total_amount ? `$${row.total_amount}` : '-');

    // 2. Dynamic Distance Miles
    let numericDist = 0;
    if (row.distance_miles !== null && row.distance_miles !== undefined && row.distance_miles !== '') {
      const parsed = typeof row.distance_miles === 'number' ? row.distance_miles : parseFloat(String(row.distance_miles));
      if (!isNaN(parsed)) numericDist = parsed;
    }
    const distanceDisplay = numericDist > 0
      ? `${numericDist.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} mi`
      : (row.distance_miles ? `${row.distance_miles} mi` : '-');

    // Dynamic Info Notes
    let infoNotes = null;
    if (row.additional_info && String(row.additional_info).trim() !== '') {
      infoNotes = String(row.additional_info).trim();
    }

    const scheduledAtDisplay = row.scheduled_at
      ? `Scheduled: ${new Date(row.scheduled_at).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`
      : null;

    // Dynamic Order ID / Ref
    const displayId = row.order_ref && String(row.order_ref).trim() !== ''
      ? String(row.order_ref).trim()
      : (row.id ? `ORD-${String(row.id).substring(0, 6).toUpperCase()}` : '-');

    return {
      rawId: row.id || '-',
      id: displayId,
      orderRef: getDynamicVal(row.order_ref),
      pickup: getDynamicVal(row.pickup_address),
      dropoff: getDynamicVal(row.dropoff_address),
      distanceMiles: numericDist,
      distanceDisplay: distanceDisplay,
      estTimeMinutes: getDynamicVal(row.estimated_time),
      category: getDynamicVal(row.category),
      deliveryType: deliveryTypeText,
      vehicle: vehicleText,
      urgency: getDynamicVal(row.schedule_type, (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1)),
      tripType: row.trip_type === 'one_way' ? 'One-Way' : (row.trip_type === 'round_trip' ? 'Round-Trip' : getDynamicVal(row.trip_type)),
      speed: speedFormatted,
      extras: extras,
      info: infoNotes,
      scheduledAt: scheduledAtDisplay,
      price: numericPrice,
      priceDisplay: priceDisplay,
      status: uiStatus,
      rawStatus: getDynamicVal(row.order_status),
      dbStatus: getDynamicVal(row.status) || 'pending',
      assignedDriver: row.driver_id ? { name: row.driver_id === currentUser?.id ? (currentUser?.name || currentUser?.email || 'You') : 'Another Driver', id: row.driver_id } : null,
      assignedDriverName: row.driver_id ? (row.driver_id === currentUser?.id ? (currentUser?.name || currentUser?.email || 'You') : 'Another Driver') : '-',
      createdAt: row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
      rawRow: row
    };
  };

  // Helper to generate direct Google Maps Directions URL (opens in browser tab immediately)
  const getGoogleMapsDirectionsUrl = (order) => {
    if (!order) return '#';
    const pLat = order.rawRow?.pickup_lat;
    const pLng = order.rawRow?.pickup_lng;
    const dLat = order.rawRow?.dropoff_lat;
    const dLng = order.rawRow?.dropoff_lng;

    const origin = (pLat !== null && pLat !== undefined && pLng !== null && pLng !== undefined && pLat !== '' && pLng !== '')
      ? `${pLat},${pLng}`
      : encodeURIComponent(order.pickup !== '-' ? order.pickup : '');

    const destination = (dLat !== null && dLat !== undefined && dLng !== null && dLng !== undefined && dLat !== '' && dLng !== '')
      ? `${dLat},${dLng}`
      : encodeURIComponent(order.dropoff !== '-' ? order.dropoff : '');

    return `https://www.google.com/maps/dir/${origin}/${destination}`;
  };

  // Fetch live orders from Supabase database table `customer_orders`
  const loadOrdersFromDb = async (showToast = false) => {
    setLoading(true);
    try {
      const dbRows = await fetchCustomerOrdersFromDb();
      if (Array.isArray(dbRows)) {
        const mappedList = dbRows.map(mapDbOrderToUiOrder);
        setOrders(mappedList);
        if (showToast) {
          setNotification({ type: 'success', message: `Refreshed ${mappedList.length} order(s) from Supabase database!` });
        }
      }
    } catch (err) {
      console.warn('Error loading orders from Supabase DB:', err);
      setNotification({ type: 'error', message: 'Failed to fetch customer orders from database.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdersFromDb();
  }, []);

  // Live real-time subscription to database changes in customer_orders table
  useEffect(() => {
    const channel = supabase
      .channel('customer-orders-realtime-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_orders'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newUiOrder = mapDbOrderToUiOrder(payload.new);
            setOrders(prev => {
              if (prev.some(o => o.rawId === payload.new.id)) return prev;
              return [newUiOrder, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedUiOrder = mapDbOrderToUiOrder(payload.new);
            setOrders(prev => prev.map(o => o.rawId === payload.new.id ? updatedUiOrder : o));
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.rawId !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Load driver-specific declined orders from localStorage
  useEffect(() => {
    const driverId = getActiveDriverId();
    const stored = localStorage.getItem(`routek9_declined_orders_${driverId}`);
    if (stored) {
      try {
        setDeclinedOrderIds(JSON.parse(stored));
      } catch (e) {
        console.warn("Parse declined orders error:", e);
      }
    } else {
      setDeclinedOrderIds([]);
    }
  }, [currentUser]);

  // Dynamically extract unique vehicle types available in orders list
  const availableVehicleOptions = Array.from(
    new Set(orders.map(o => o.vehicle).filter(v => v && v !== '-'))
  );

  // Filtered Orders for Marketplace
  const availableOrders = orders.filter(o => {
    if (o.status !== 'AVAILABLE') return false;
    if (declinedOrderIds.includes(o.rawId)) return false; // Exclude orders declined by this driver
    if (vehicleFilter !== 'ALL' && o.vehicle.toLowerCase() !== vehicleFilter.toLowerCase()) return false;
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      return (
        o.id.toLowerCase().includes(term) ||
        (o.orderRef && o.orderRef.toLowerCase().includes(term)) ||
        o.pickup.toLowerCase().includes(term) ||
        o.dropoff.toLowerCase().includes(term) ||
        o.deliveryType.toLowerCase().includes(term) ||
        o.category.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Helper to validate and retrieve active logged-in driver ID
  const getActiveDriverId = () => {
    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    if (currentUser?.id && isUuid(currentUser.id)) {
      return currentUser.id;
    }
    return 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
  };

  const activeDriverId = getActiveDriverId();
  const acceptedOrders = orders.filter(o =>
    (o.status === 'ACCEPTED' || o.status === 'IN_TRANSIT' || o.status === 'COMPLETED') &&
    o.assignedDriver?.id === activeDriverId
  );
  const totalEarnings = acceptedOrders.reduce((sum, o) => sum + (o.status === 'COMPLETED' ? o.price : 0), 0);

  // Handler: Accept Order
  const handleAcceptOrder = async (orderToAccept) => {
    const targetId = typeof orderToAccept === 'string' ? orderToAccept : orderToAccept.rawId || orderToAccept.id;
    const matchedOrder = orders.find(o => o.rawId === targetId || o.id === targetId);

    if (!matchedOrder) return;

    // Validate or generate UUID for driver_id column
    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    let driverUuid = currentUser?.id;
    if (!isUuid(driverUuid)) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        driverUuid = crypto.randomUUID();
      } else {
        driverUuid = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
      }
    }

    const driverName = currentUser?.name || currentUser?.email || `Driver (${driverUuid.substring(0, 8)})`;

    // Pre-check: Fetch the latest status from Supabase to prevent double claim
    try {
      const { data: latestOrder, error: checkError } = await supabase
        .from('customer_orders')
        .select('status, driver_id')
        .eq('id', matchedOrder.rawId)
        .maybeSingle();

      if (checkError) {
        console.warn("Check status error:", checkError.message);
      }

      if (latestOrder) {
        const dbStatus = (latestOrder.status || '').toLowerCase();
        if (dbStatus === 'accepted' || dbStatus === 'in_transit' || dbStatus === 'in_progress' || dbStatus === 'completed' || latestOrder.driver_id) {
          // Open Claim Failed Modal
          setClaimFailedModalState({ isOpen: true, order: matchedOrder });

          setNotification({
            type: 'error',
            message: `Claim failed: Order ${matchedOrder.id} has already been accepted by another driver.`
          });

          // Instantly sync local state to reflect that it is accepted by someone else
          setOrders(prev => prev.map(o => {
            if (o.rawId === matchedOrder.rawId) {
              return {
                ...o,
                status: 'CLAIMED_BY_OTHER',
                rawStatus: dbStatus,
                assignedDriver: { name: 'Another Driver', id: latestOrder.driver_id || 'other_driver' }
              };
            }
            return o;
          }));
          return;
        }
      }
    } catch (err) {
      console.warn("Pre-check error:", err);
    }

    // 1. Update Database in Supabase (status -> 'accepted', driver_id -> driverUuid)
    const dbRes = await updateCustomerOrderStatusInDb(matchedOrder.rawId || matchedOrder.id, 'accepted', driverUuid);

    if (dbRes && !dbRes.success) {
      setNotification({
        type: 'error',
        message: `DB update failed: Row-Level Security (RLS) policies on 'customer_orders' table likely block updates. Please run the SQL command in Supabase SQL Editor to allow updates.`
      });
      return;
    }

    const assignedId = dbRes?.driverId || driverUuid;

    // 2. Update Local State
    setOrders(prev => prev.map(o => {
      if (o.rawId === matchedOrder.rawId || o.id === matchedOrder.id) {
        return {
          ...o,
          status: 'ACCEPTED',
          rawStatus: 'accepted',
          assignedDriverName: driverName,
          assignedDriver: { name: driverName, id: assignedId }
        };
      }
      return o;
    }));

    // 3. Trigger Modal & Toast
    setAcceptedModalState({
      isOpen: true,
      order: {
        ...matchedOrder,
        status: 'ACCEPTED',
        assignedDriverName: driverName
      }
    });
    setNotification({
      type: 'success',
      message: `Order ${matchedOrder.id} status updated to ACCEPTED & driver_id set to ${assignedId} in database!`
    });
  };

  // Handler: Decline / Reject Order
  const handleRejectOrder = (orderId) => {
    const matchedOrder = orders.find(o => o.rawId === orderId || o.id === orderId);
    if (!matchedOrder) return;

    const targetRawId = matchedOrder.rawId;
    const driverId = getActiveDriverId();

    // Save to localStorage for this specific driver
    const updatedDeclined = [...new Set([...declinedOrderIds, targetRawId])];
    setDeclinedOrderIds(updatedDeclined);
    localStorage.setItem(`routek9_declined_orders_${driverId}`, JSON.stringify(updatedDeclined));

    // Update local state to filter out immediately
    setOrders(prev => prev.map(o => {
      if (o.rawId === targetRawId) {
        return { ...o, status: 'REJECTED' };
      }
      return o;
    }));

    setNotification({ type: 'info', message: `Order ${matchedOrder.id} has been declined and hidden.` });
  };

  // Handler: Update Order Status (IN_TRANSIT, COMPLETED)
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const matchedOrder = orders.find(o => o.rawId === orderId || o.id === orderId);
    if (!matchedOrder) return;

    const dbStatus = newStatus.toLowerCase();

    // Determine driver UUID
    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    let driverUuid = matchedOrder.assignedDriver?.id || currentUser?.id;
    if (!isUuid(driverUuid)) {
      driverUuid = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
    }

    // 1. Update Database
    const dbRes = await updateCustomerOrderStatusInDb(matchedOrder.rawId || matchedOrder.id, dbStatus, driverUuid);

    if (dbRes && !dbRes.success) {
      setNotification({
        type: 'error',
        message: `DB update failed: Row-Level Security (RLS) policies block updates on 'customer_orders' table.`
      });
      return;
    }

    // 2. Update Local State
    setOrders(prev => prev.map(o => {
      if (o.rawId === matchedOrder.rawId || o.id === matchedOrder.id) {
        return { ...o, status: newStatus, rawStatus: dbStatus };
      }
      return o;
    }));

    const statusMsg = newStatus === 'IN_TRANSIT' ? 'is now marked In Transit' : 'is completed & payout earned!';
    setNotification({ type: 'success', message: `Order ${matchedOrder.id} ${statusMsg}` });
  };

  const handleUpdateDbStatusColumn = async (orderId, newDbStatus) => {
    const matchedOrder = orders.find(o => o.rawId === orderId || o.id === orderId);
    if (!matchedOrder) return;

    // 1. Update Database status column
    const dbRes = await updateCustomerStatusColumnInDb(matchedOrder.rawId || matchedOrder.id, newDbStatus);

    if (dbRes && !dbRes.success) {
      setNotification({
        type: 'error',
        message: `DB update failed: Row-Level Security (RLS) policies block updates on 'customer_orders' table.`
      });
      return;
    }

    // 2. Update Local State
    setOrders(prev => prev.map(o => {
      if (o.rawId === matchedOrder.rawId || o.id === matchedOrder.id) {
        return { ...o, dbStatus: newDbStatus };
      }
      return o;
    }));

    setNotification({ type: 'success', message: `Order ${matchedOrder.id} status updated to ${newDbStatus.toUpperCase()} in database!` });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Top Header Banner */}
        <div className="bg-[#0b132b] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <Truck className="w-3.5 h-3.5" />
              <span>Driver On-Demand Dispatch Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-serif-heading">
              Dispatch Orders & Marketplace
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
              Live courier orders fetched directly from <code className="text-rose-400 font-mono text-xs">customer_orders</code> database table.
            </p>
          </div>

          {/* Header Action & Quick Stats */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">


            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl p-4 shrink-0 backdrop-blur-md">
              <div className="text-center px-3 border-r border-white/15">
                <div className="text-[10px] font-bold text-slate-300 uppercase">Available</div>
                <div className="text-2xl font-extrabold text-rose-400">{availableOrders.length}</div>
              </div>
              <div className="text-center px-3 border-r border-white/15">
                <div className="text-[10px] font-bold text-slate-300 uppercase">Accepted</div>
                <div className="text-2xl font-extrabold text-emerald-400">{acceptedOrders.length}</div>
              </div>
              <div className="text-center px-3">
                <div className="text-[10px] font-bold text-slate-300 uppercase">Earnings</div>
                <div className="text-2xl font-extrabold text-amber-400">${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Toast Notification */}
        {notification && (
          <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-fadeIn shadow-lg ${notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'marketplace'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <Package className="w-4 h-4" />
              <span>Available Marketplace ({availableOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('accepted')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'accepted'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>My Deliveries ({acceptedOrders.length})</span>
            </button>
          </div>

          {activeTab === 'marketplace' && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search city, ID, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs"
                />
              </div>

              {/* Dynamic Vehicle Filter Dropdown */}
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Vehicles</option>
                {availableVehicleOptions.map(veh => (
                  <option key={veh} value={veh}>{veh}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Loading State Spinner */}
        {loading ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-16 text-center space-y-4 shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-rose-600 mx-auto" />
            <h3 className="text-base font-bold text-[#0b132b]">Fetching live dispatch orders from Supabase...</h3>
            <p className="text-xs text-slate-400 font-medium">Connecting to <code className="text-rose-600 font-mono">customer_orders</code> database table.</p>
          </div>
        ) : null}

        {/* ─── TAB 1: AVAILABLE ORDERS MARKETPLACE ───────────────────────────── */}
        {!loading && activeTab === 'marketplace' && (
          <div className="space-y-6">
            {availableOrders.length === 0 ? (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-16 text-center space-y-4 shadow-sm">
                <Package className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-lg font-bold text-[#0b132b]">No available dispatch orders match your filter</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                  Try adjusting your search criteria or re-syncing database records.
                </p>
                <button
                  onClick={() => loadOrdersFromDb(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Database</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {availableOrders.map(order => (
                  <div
                    key={order.rawId || order.id}
                    className="bg-white rounded-3xl border border-slate-200/90 hover:border-slate-300 shadow-lg overflow-hidden flex flex-col justify-between transition-all group hover:-translate-y-0.5"
                  >
                    {/* Top Header Row */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 shrink-0">
                            {order.id}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider truncate max-w-[200px]" title={order.deliveryType}>
                            {order.deliveryType}
                          </span>
                        </div>
                        {order.scheduledAt && (
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-extrabold mt-0.5">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>{order.scheduledAt}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">
                          {order.priceDisplay !== '-' ? order.priceDisplay : `$${order.price.toFixed(2)}`}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Driver Payout</span>
                      </div>
                    </div>

                    {/* Order Body Details */}
                    <div className="p-6 space-y-5 flex-1">

                      {/* Pickup & Dropoff Route Card */}
                      <div className="bg-slate-50/60 hover:bg-slate-50/80 p-4 pr-24 rounded-2xl border border-slate-200/60 relative transition-colors space-y-4">
                        {/* Connecting Line */}
                        <div className="absolute left-[25px] top-9 bottom-9 w-px border-l border-dashed border-slate-300" />

                        {/* Pickup Point */}
                        <div className="flex items-start gap-4">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100 shrink-0 mt-1.5 ml-1 relative z-10" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Pickup Location</span>
                            <p className="text-xs font-bold text-slate-800 line-clamp-2" title={order.pickup}>{order.pickup}</p>
                          </div>
                        </div>

                        {/* Drop-off Point */}
                        <div className="flex items-start gap-4">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0 mt-1.5 ml-1 relative z-10" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Drop-off Location</span>
                            <p className="text-xs font-bold text-slate-800 line-clamp-2" title={order.dropoff}>{order.dropoff}</p>
                          </div>
                        </div>

                        {/* Direct Google Maps Route Launcher Button */}
                        <a
                          href={getGoogleMapsDirectionsUrl(order)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute right-4 top-1/2 -translate-y-1/2 px-3.5 py-2.5 rounded-xl border border-rose-200/80 bg-rose-50/80 hover:bg-rose-100/90 text-rose-600 font-extrabold text-[10px] tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md active:scale-95 z-10"
                          title="Open live Google Maps driving directions in new tab"
                        >
                          <Navigation className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                          <span>Map</span>
                        </a>
                      </div>

                      {/* Specs Badge Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex flex-col items-center justify-center min-h-[52px]">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Vehicle</span>
                          <span className="font-extrabold text-[#0b132b] text-xs">{order.vehicle}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex flex-col items-center justify-center min-h-[52px]">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Distance</span>
                          <span className="font-extrabold text-[#0b132b] text-xs truncate block max-w-full">
                            {order.distanceDisplay !== '-' ? order.distanceDisplay : (order.distanceMiles > 0 ? `${order.distanceMiles} mi` : '-')}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex flex-col items-center justify-center min-h-[52px]">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Trip Type</span>
                          <span className="font-extrabold text-rose-600 text-xs truncate block max-w-full" title={order.tripType}>
                            {order.tripType}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex flex-col items-center justify-center min-h-[52px]">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Speed / Tier</span>
                          <span className="font-extrabold text-amber-600 text-[11px] truncate block max-w-full" title={order.speed}>{order.speed}</span>
                        </div>
                      </div>

                      {/* Instructions / Info Notes */}
                      {order.info && (
                        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2 font-medium">
                          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-3">{order.info}</span>
                        </div>
                      )}

                      {/* Extras & Dimensions Tags */}
                      {order.extras && order.extras.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {order.extras.map((extra, idx) => (
                            <span key={idx} className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                              + {extra}
                            </span>
                          ))}
                        </div>
                      )}

                    </div>

                    {/* Action Buttons Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedOrderDetailModal(order)}
                        className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                        title="View full order details"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Details</span>
                      </button>

                      <button
                        onClick={() => handleRejectOrder(order.rawId || order.id)}
                        className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Decline</span>
                      </button>

                      <button
                        onClick={() => handleAcceptOrder(order)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="truncate">Accept Order</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: MY ACCEPTED DELIVERIES ─────────────────────────────────── */}
        {!loading && activeTab === 'accepted' && (
          <div className="space-y-6">
            {acceptedOrders.length === 0 ? (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-16 text-center space-y-4 shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-lg font-bold text-[#0b132b]">No accepted deliveries yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                  Browse the Available Marketplace tab to review open courier dispatch jobs and accept them.
                </p>
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Browse Open Orders</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                        <th className="px-6 py-4">Order ID & Type</th>
                        <th className="px-6 py-4">Pickup Location</th>
                        <th className="px-6 py-4">Drop-off Location</th>
                        <th className="px-6 py-4">Payout</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                      {acceptedOrders.map(order => (
                        <tr key={order.rawId || order.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4.5">
                            <div className="space-y-1">
                              <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block">
                                {order.id}
                              </span>
                              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide truncate max-w-[150px]">
                                {order.deliveryType}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4.5 max-w-xs">
                            <span className="text-slate-900 font-bold line-clamp-2" title={order.pickup}>
                              {order.pickup}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 max-w-xs">
                            <span className="text-slate-900 font-bold line-clamp-2" title={order.dropoff}>
                              {order.dropoff}
                            </span>
                          </td>
                          <td className="px-6 py-4.5">
                            <span className="text-sm font-black text-emerald-600">
                              {order.priceDisplay !== '-' ? order.priceDisplay : `$${order.price.toFixed(2)}`}
                            </span>
                          </td>
                          <td className="px-6 py-4.5 text-right space-x-2 whitespace-nowrap">
                            {/* Status Dropdown Selection */}
                            <select
                              value={order.dbStatus}
                              onChange={(e) => handleUpdateDbStatusColumn(order.rawId || order.id, e.target.value)}
                              className={`px-3 py-2 rounded-xl border font-extrabold text-[10px] tracking-wider uppercase transition-all cursor-pointer inline-flex items-center focus:outline-hidden ${
                                order.dbStatus === 'delivered'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/75'
                                  : order.dbStatus === 'ongoing'
                                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/75'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/75'
                              }`}
                            >
                              <option value="pending">Pending</option>
                              <option value="ongoing">Ongoing</option>
                              <option value="delivered">Delivered</option>
                            </select>

                            {/* Map Directions Button */}
                            <a
                              href={getGoogleMapsDirectionsUrl(order)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-600 font-extrabold text-[10px] tracking-wider uppercase transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
                              title="Open live Google Maps driving directions"
                            >
                              <Navigation className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>Map</span>
                            </a>

                            {/* Details Button */}
                            <button
                              onClick={() => setSelectedOrderDetailModal(order)}
                              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] tracking-wider uppercase transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
                              title="View full order specifications"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>Details</span>
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
        )}

      </div>

      {/* ACCEPTED ORDER SUCCESS POP-UP MODAL */}
      {acceptedModalState.isOpen && acceptedModalState.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-6">

            {/* Top Header Badge */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#0b132b] font-serif-heading">
                  Order Successfully Accepted!
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  This dispatch job has been assigned to your driver account and saved in database.
                </p>
              </div>
            </div>

            {/* Order Summary Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Order Ref / ID</span>
                  <div className="font-extrabold text-rose-600 text-sm">{acceptedModalState.order.id}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Driver Payout</span>
                  <div className="font-black text-emerald-600 text-xl">{acceptedModalState.order.priceDisplay !== '-' ? acceptedModalState.order.priceDisplay : `$${acceptedModalState.order.price.toFixed(2)}`}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-rose-600 uppercase">Pickup Location:</span>
                  <p className="font-bold text-slate-900">{acceptedModalState.order.pickup}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Drop-off Location:</span>
                  <p className="font-bold text-slate-900">{acceptedModalState.order.dropoff}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setAcceptedModalState({ isOpen: false, order: null });
                  setActiveTab('accepted');
                }}
                className="w-full sm:flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Go to My Deliveries</span>
              </button>

              <button
                onClick={() => setAcceptedModalState({ isOpen: false, order: null })}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
              >
                Keep Browsing
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CLAIM FAILED POP-UP MODAL */}
      {claimFailedModalState.isOpen && claimFailedModalState.order && (
        <div
          onClick={() => setClaimFailedModalState({ isOpen: false, order: null })}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-6 relative"
          >
            {/* Close Button */}
            <button
              onClick={() => setClaimFailedModalState({ isOpen: false, order: null })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Header Badge */}
            <div className="text-center space-y-3 pb-2">
              <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-md">
                <XCircle className="w-8 h-8 text-rose-600 animate-bounce" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#0b132b] font-serif-heading">
                  Order Already Claimed!
                </h3>
                <p className="text-xs text-rose-600 font-semibold mt-1 leading-relaxed">
                  This dispatch job has already been accepted by another driver and cannot be assigned to your account.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* FULL ORDER SPECIFICATIONS & DETAILS MODAL */}
      {selectedOrderDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Dark Header Banner */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start text-left">
              <div className="flex items-center gap-3.5 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-white font-serif-heading ">
                      Order Ref: {selectedOrderDetailModal.id}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* <span className="text-xs text-slate-300 font-mono">UUID: {selectedOrderDetailModal.rawId}</span> */}
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-[10px] uppercase border border-rose-500/30">
                      {selectedOrderDetailModal.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderDetailModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 custom-modal-scrollbar">
              {/* Pickup & Dropoff Address Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Route Delivery Locations
                  </span>
                  <a
                    href={getGoogleMapsDirectionsUrl(selectedOrderDetailModal)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#0b132b] hover:bg-slate-800 text-white text-[10px] font-extrabold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Navigation className="w-3 h-3 text-rose-400" />
                    <span>View Map & Directions</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-600" /> Pickup Location
                    </span>
                    <div className="font-bold text-slate-900">{selectedOrderDetailModal.pickup}</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {selectedOrderDetailModal.rawRow?.pickup_lat !== null && selectedOrderDetailModal.rawRow?.pickup_lat !== undefined && selectedOrderDetailModal.rawRow?.pickup_lat !== ''
                        ? `Lat: ${selectedOrderDetailModal.rawRow.pickup_lat}, Lng: ${selectedOrderDetailModal.rawRow.pickup_lng}`
                        : '-'}
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-emerald-600" /> Dropoff Location
                    </span>
                    <div className="font-bold text-slate-900">{selectedOrderDetailModal.dropoff}</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {selectedOrderDetailModal.rawRow?.dropoff_lat !== null && selectedOrderDetailModal.rawRow?.dropoff_lat !== undefined && selectedOrderDetailModal.rawRow?.dropoff_lat !== ''
                        ? `Lat: ${selectedOrderDetailModal.rawRow.dropoff_lat}, Lng: ${selectedOrderDetailModal.rawRow.dropoff_lng}`
                        : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Specifications & Pricing Grid */}
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category & Vehicle</div>
                  <div className="font-extrabold text-slate-900">
                    {selectedOrderDetailModal.category} • {selectedOrderDetailModal.vehicle}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery Speed / Tier</div>
                  <div className="font-extrabold text-slate-900">
                    {selectedOrderDetailModal.speed}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Package Dimensions (H×W×L)</div>
                  <div className="font-extrabold text-slate-900">
                    {selectedOrderDetailModal.rawRow?.pkg_height_in || selectedOrderDetailModal.rawRow?.pkg_width_in || selectedOrderDetailModal.rawRow?.pkg_length_in
                      ? `${selectedOrderDetailModal.rawRow?.pkg_height_in || 0}" × ${selectedOrderDetailModal.rawRow?.pkg_width_in || 0}" × ${selectedOrderDetailModal.rawRow?.pkg_length_in || 0}"`
                      : '-'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Package Weight</div>
                  <div className="font-extrabold text-slate-900">
                    {selectedOrderDetailModal.rawRow?.pkg_weight_lbs !== null && selectedOrderDetailModal.rawRow?.pkg_weight_lbs !== undefined && selectedOrderDetailModal.rawRow?.pkg_weight_lbs !== ''
                      ? `${selectedOrderDetailModal.rawRow.pkg_weight_lbs} lbs`
                      : '-'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Distance & Schedule</div>
                  <div className="font-extrabold text-slate-900">
                    {selectedOrderDetailModal.distanceDisplay} • {selectedOrderDetailModal.urgency}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</div>
                  <div className="font-extrabold text-emerald-600 text-sm">
                    {selectedOrderDetailModal.priceDisplay}
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrderDetailModal.info && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                    Special Delivery Instructions
                  </span>
                  <div className="text-xs font-semibold text-amber-900">{selectedOrderDetailModal.info}</div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
