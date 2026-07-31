import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  DollarSign,
  Package,
  CheckCircle2,
  XCircle,
  Plus,
  Navigation,
  ShieldCheck,
  Building2,
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
  Bike,
  Car,
  Compass
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DispatchOrdersPage({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'accepted' | 'create'
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [notification, setNotification] = useState(null);

  // Mock Dispatch Orders Database State
  const [orders, setOrders] = useState([
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
      tripType: 'One-way (A -> B)',
      speed: 'Priority (ASAP - 30 min)',
      pickupTime: '2026-07-31 13:30',
      dropoffTime: '2026-07-31 15:00',
      extras: ['Stairs required (+$5)', 'Temperature Controlled'],
      info: 'Gate Code: #4921. Deliver to 3rd floor pharmacy desk. Fragile medical vials.',
      price: 85.50,
      status: 'AVAILABLE', // AVAILABLE | ACCEPTED | COMPLETED | REJECTED
      assignedDriver: null,
      createdAt: '10 mins ago',
      imagePreview: null
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
      tripType: 'One-way (A -> B)',
      speed: 'Standard (Within 2 hours)',
      pickupTime: '2026-07-31 14:00',
      dropoffTime: '2026-07-31 16:30',
      extras: ['Wait time expected (+$5/5min)'],
      info: 'Ask for Warehouse Manager Steve at Bay #4. Heavy engine transmission box (850 lbs).',
      price: 142.00,
      status: 'AVAILABLE',
      assignedDriver: null,
      createdAt: '25 mins ago',
      imagePreview: null
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
      tripType: 'One-way (A -> B)',
      speed: 'Express (Within 60 min)',
      pickupTime: '2026-07-31 12:00',
      dropoffTime: '2026-07-31 13:30',
      extras: [],
      info: 'Court filing envelope. Signature required from Attorney Sarah Jenkins upon delivery.',
      price: 52.80,
      status: 'AVAILABLE',
      assignedDriver: null,
      createdAt: '40 mins ago',
      imagePreview: null
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
      tripType: 'One-way (A -> B)',
      speed: 'Standard (Within 2 hours)',
      pickupTime: '2026-07-31 15:00',
      dropoffTime: '2026-07-31 16:00',
      extras: ['Stairs required (+$5)'],
      info: 'Apt 4B. Leave at doorstep if no answer. Code 8821.',
      price: 24.50,
      status: 'AVAILABLE',
      assignedDriver: null,
      createdAt: '1 hour ago',
      imagePreview: null
    }
  ]);

  // Load dispatch orders dynamically from Supabase
  useEffect(() => {
    async function loadOrdersFromDB() {
      try {
        const { data, error } = await supabase
          .from('dispatch_orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
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
            postedBy: o.posted_by || { name: o.posted_by_name || 'Customer', email: o.posted_by_email || 'user@routek9.com' },
            assignedDriver: o.assigned_driver || o.driver || null,
            createdAt: o.created_at || 'Just now'
          }));

          setOrders(prev => {
            const map = new Map();
            formatted.forEach(item => map.set(item.id, item));
            prev.forEach(item => { if (!map.has(item.id)) map.set(item.id, item); });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn("Using local orders state:", err);
      }
    }
    loadOrdersFromDB();
  }, []);

  // Form State for Porter-Style "Get Instant Delivery Quote & Place Order"
  const [formPickup, setFormPickup] = useState('');
  const [formDropoff, setFormDropoff] = useState('');
  const [formCategory, setFormCategory] = useState('Business'); // Business | Personal
  const [formDeliveryType, setFormDeliveryType] = useState('Medical / Pharmaceutical delivery');
  const [formVehicle, setFormVehicle] = useState('Car'); // Bicycle | Scooter | Car | Van | Truck
  const [formUrgency, setFormUrgency] = useState('Same day'); // Same day | Scheduled | Recurring
  const [formTripType, setFormTripType] = useState('One-way (A -> B)'); // One-way | Round trip
  const [formSpeed, setFormSpeed] = useState('Standard'); // Standard | Express | Priority
  const [formPickupTime, setFormPickupTime] = useState('');
  const [formDropoffTime, setFormDropoffTime] = useState('');
  const [formExtrasStairs, setFormExtrasStairs] = useState(false);
  const [formExtrasWait, setFormExtrasWait] = useState(false);
  const [formInfo, setFormInfo] = useState('');
  const [formImage, setFormImage] = useState(null);

  // Price Calculation logic based on vehicle & parameters
  const VEHICLE_PRICING = {
    Bicycle: { base: 4.00, perMile: 1.20, label: 'Bicycle', desc: 'Small items up to 10 lb', Icon: Bike },
    Scooter: { base: 5.00, perMile: 1.50, label: 'Scooter', desc: 'Food & docs up to 25 lb', Icon: Compass },
    Car: { base: 7.00, perMile: 1.80, label: 'Car', desc: 'Groceries up to 100 lb', Icon: Car },
    Van: { base: 15.00, perMile: 2.40, label: 'Van', desc: 'Bulk up to 800 lb', Icon: Truck },
    Truck: { base: 30.00, perMile: 3.20, label: 'Truck', desc: 'Furniture up to 2000 lb', Icon: Truck }
  };

  const calculateEstPrice = () => {
    const veh = VEHICLE_PRICING[formVehicle] || VEHICLE_PRICING.Car;
    const estMiles = 15.5; // Mock estimated distance
    let total = veh.base + (estMiles * veh.perMile);
    if (formTripType === 'Round trip') total *= 1.8;
    if (formSpeed === 'Express') total += 12;
    if (formSpeed === 'Priority') total += 22;
    if (formExtrasStairs) total += 5;
    if (formExtrasWait) total += 8;
    return total.toFixed(2);
  };

  const [acceptedModalState, setAcceptedModalState] = useState({ isOpen: false, order: null });

  // Driver Accept Order Handler
  const handleAcceptOrder = async (orderId) => {
    const driverName = currentUser?.name || 'Authorized Driver';
    const driverEmail = currentUser?.email || 'driver@routek9.com';
    const driverVehicle = currentUser?.vehicle || 'Delivery Vehicle';
    let acceptedObj = null;

    const driverPayload = { name: driverName, email: driverEmail, vehicle: driverVehicle };

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        acceptedObj = { ...o, status: 'ACCEPTED', assignedDriver: driverPayload };
        return acceptedObj;
      }
      return o;
    }));

    try {
      await supabase
        .from('dispatch_orders')
        .update({ status: 'ACCEPTED', assigned_driver: driverPayload, driver_name: driverName })
        .eq('id', orderId);
    } catch (err) {
      console.warn("Supabase accept update warning:", err);
    }

    if (acceptedObj) {
      setAcceptedModalState({ isOpen: true, order: acceptedObj });
    }
  };

  // Driver Reject Order Handler
  const handleRejectOrder = (orderId) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'REJECTED' };
      }
      return o;
    }));
    setNotification({
      type: 'info',
      message: `Order #${orderId} declined for your dispatch queue.`
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Driver Status Step Toggle ("ACCEPTED" -> "IN_TRANSIT" -> "COMPLETED")
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    }));
    setNotification({
      type: 'success',
      message: `Status updated to '${newStatus.replace('_', ' ')}' for Order #${orderId}`
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Place Order Handler (External Platform / Customer Order Creation)
  const handleCreateDispatchOrder = (e) => {
    e.preventDefault();
    if (!formPickup.trim() || !formDropoff.trim()) {
      alert("Please enter both Pickup and Drop-off locations.");
      return;
    }

    const calculatedPrice = calculateEstPrice();
    const newOrderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const extrasArr = [];
    if (formExtrasStairs) extrasArr.push('Stairs required (+$5)');
    if (formExtrasWait) extrasArr.push('Wait time expected (+$5/5min)');

    const posterInfo = {
      name: currentUser?.name || 'Registered Customer',
      email: currentUser?.email || 'customer@routek9.com',
      role: currentUser?.role || 'Customer'
    };

    const newOrder = {
      id: newOrderId,
      pickup: formPickup.trim(),
      dropoff: formDropoff.trim(),
      distanceMiles: 14.8,
      estTimeMinutes: 25,
      category: formCategory,
      deliveryType: formDeliveryType,
      vehicle: formVehicle,
      urgency: formUrgency,
      tripType: formTripType,
      speed: formSpeed,
      pickupTime: formPickupTime || new Date().toISOString().slice(0, 16).replace('T', ' '),
      dropoffTime: formDropoffTime || 'Asap',
      extras: extrasArr,
      info: formInfo.trim() || 'No special notes provided.',
      price: Number(calculatedPrice),
      status: 'AVAILABLE',
      postedBy: posterInfo,
      assignedDriver: null,
      createdAt: new Date().toISOString(),
      imagePreview: formImage
    };

    setOrders(prev => [newOrder, ...prev]);

    // Async Insert to Supabase DB
    supabase.from('dispatch_orders').insert([{
      id: newOrderId,
      pickup_location: formPickup.trim(),
      dropoff_location: formDropoff.trim(),
      category: formCategory,
      delivery_type: formDeliveryType,
      vehicle: formVehicle,
      price: Number(calculatedPrice),
      status: 'AVAILABLE',
      posted_by: posterInfo,
      posted_by_name: posterInfo.name,
      posted_by_email: posterInfo.email,
      info: formInfo.trim()
    }]).then(({ error }) => {
      if (error) console.warn("Supabase order insert notice:", error.message);
    }).catch(err => console.warn("Supabase insert catch:", err));

    // Reset Form
    setFormPickup('');
    setFormDropoff('');
    setFormInfo('');
    setFormImage(null);

    setNotification({
      type: 'success',
      message: `🚀 Dispatch Order #${newOrderId} placed successfully! It is now live in the Driver Marketplace tab.`
    });
    setActiveTab('marketplace');
    setTimeout(() => setNotification(null), 5000);
  };

  // Filtered Orders for Marketplace
  const availableOrders = orders.filter(o => {
    if (o.status !== 'AVAILABLE') return false;
    if (vehicleFilter !== 'ALL' && o.vehicle.toLowerCase() !== vehicleFilter.toLowerCase()) return false;
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      return (
        o.id.toLowerCase().includes(term) ||
        o.pickup.toLowerCase().includes(term) ||
        o.dropoff.toLowerCase().includes(term) ||
        o.deliveryType.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const acceptedOrders = orders.filter(o => o.status === 'ACCEPTED' || o.status === 'IN_TRANSIT' || o.status === 'COMPLETED');
  const totalEarnings = acceptedOrders.reduce((sum, o) => sum + (o.status === 'COMPLETED' ? o.price : 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Top Header Banner (Light/Navy Dual Design) */}
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
              Accept live Porter-style courier orders, manage active deliveries, or simulate placing new courier dispatches.
            </p>
          </div>

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
              <div className="text-2xl font-extrabold text-amber-400">${totalEarnings.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Global Toast Notification */}
        {notification && (
          <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-fadeIn shadow-lg ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">
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

            <button
              onClick={() => setActiveTab('create')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'create'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
            >
              <Plus className="w-4 h-4 text-rose-500" />
              <span>Place Porter Delivery Order (Demo Form)</span>
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

              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Vehicles</option>
                <option value="Van">Van / Cargo</option>
                <option value="Truck">Truck</option>
                <option value="Car">Car</option>
                <option value="Scooter">Scooter</option>
                <option value="Bicycle">Bicycle</option>
              </select>
            </div>
          )}
        </div>

        {/* ─── TAB 1: AVAILABLE ORDERS MARKETPLACE ───────────────────────────── */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            {availableOrders.length === 0 ? (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-16 text-center space-y-4 shadow-sm">
                <Package className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-lg font-bold text-[#0b132b]">No available dispatch orders match your filter</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                  Try adjusting your search criteria or use the "Place Porter Delivery Order" tab to simulate a new customer order.
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Demo Dispatch Order</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {availableOrders.map(order => (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-slate-200/90 hover:border-slate-300 shadow-lg overflow-hidden flex flex-col justify-between transition-all group hover:-translate-y-0.5"
                  >
                    {/* Top Header Row */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                          {order.id}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                          {order.deliveryType}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-emerald-600 tracking-tight">${order.price.toFixed(2)}</span>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">Driver Payout</span>
                      </div>
                    </div>

                    {/* Order Body Details */}
                    <div className="p-6 space-y-5 flex-1">

                      {/* Pickup & Dropoff Route Card */}
                      <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-rose-300" />

                        {/* Pickup Point */}
                        <div className="flex items-start gap-3 relative z-10">
                          <div className="w-6 h-6 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-600" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Pickup Location</span>
                            <p className="text-xs font-bold text-slate-900">{order.pickup}</p>
                          </div>
                        </div>

                        {/* Drop-off Point */}
                        <div className="flex items-start gap-3 relative z-10 pt-1">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Drop-off Location</span>
                            <p className="text-xs font-bold text-slate-900">{order.dropoff}</p>
                          </div>
                        </div>
                      </div>

                      {/* Specs Badge Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Vehicle</span>
                          <span className="font-extrabold text-[#0b132b]">{order.vehicle}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Distance</span>
                          <span className="font-extrabold text-[#0b132b]">{order.distanceMiles} mi ({order.estTimeMinutes} min)</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Speed</span>
                          <span className="font-extrabold text-amber-600 text-[11px] truncate block">{order.speed}</span>
                        </div>
                      </div>

                      {/* Instructions / Gate Notes */}
                      {order.info && (
                        <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2 font-medium">
                          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>{order.info}</span>
                        </div>
                      )}

                      {/* Extras Tags */}
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
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                      <button
                        onClick={() => handleRejectOrder(order.id)}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 text-slate-400" />
                        <span>Decline</span>
                      </button>

                      <button
                        onClick={() => handleAcceptOrder(order.id)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept Order (${order.price.toFixed(2)})</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: MY ACCEPTED DELIVERIES ─────────────────────────────────── */}
        {activeTab === 'accepted' && (
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
              <div className="space-y-4">
                {acceptedOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                            {order.id}
                          </span>
                          <span className="text-xs font-extrabold text-[#0b132b]">{order.deliveryType}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">Assigned Driver: <strong className="text-slate-800 font-bold">{order.assignedDriver}</strong></p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xl font-black text-emerald-600">${order.price.toFixed(2)}</span>

                        {/* Status Toggle Buttons */}
                        {order.status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'IN_TRANSIT')}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                          >
                            Mark In Transit
                          </button>
                        )}
                        {order.status === 'IN_TRANSIT' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'COMPLETED')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {order.status === 'COMPLETED' && (
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold uppercase">
                            ✓ Delivered & Paid
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-rose-600 uppercase">Pickup Location</span>
                        <p className="font-bold text-slate-800">{order.pickup}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Drop-off Location</span>
                        <p className="font-bold text-slate-800">{order.dropoff}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: PORTER-STYLE INSTANT DELIVERY QUOTE & PLACE ORDER FORM ── */}
        {activeTab === 'create' && (
          <div className="bg-white text-slate-900 rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-10 max-w-4xl mx-auto space-y-8 animate-fadeIn">

            {/* Header Title */}
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0b132b] font-serif-heading">
                  Get an instant delivery quote & place order
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Simulate external platform customer dispatch form (Porter style)
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateDispatchOrder} className="space-y-6">

              {/* Pickup & Drop-off Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Pickup Location *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-rose-600 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 123 Main St, City"
                      value={formPickup}
                      onChange={(e) => setFormPickup(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Drop-off Location *
                  </label>
                  <div className="relative">
                    <Navigation className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 456 Oak Ave, City"
                      value={formDropoff}
                      onChange={(e) => setFormDropoff(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* What are you delivering? (Business vs Personal) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  What are you delivering?
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormCategory('Business')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${formCategory === 'Business'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Business</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategory('Personal')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${formCategory === 'Personal'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Personal</span>
                  </button>
                </div>
              </div>

              {/* Business Delivery Type Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Business Delivery Type
                </label>
                <select
                  value={formDeliveryType}
                  onChange={(e) => setFormDeliveryType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
                >
                  <option value="Medical / Pharmaceutical delivery">Medical / Pharmaceutical delivery</option>
                  <option value="Automotive Parts & Freight">Automotive Parts & Freight</option>
                  <option value="Legal & Confidential Documents">Legal & Confidential Documents</option>
                  <option value="Retail / E-commerce Package">Retail / E-commerce Package</option>
                  <option value="Furniture & Appliance Logistics">Furniture & Appliance Logistics</option>
                </select>
              </div>

              {/* Choose a Vehicle (Radio Card Options matching screenshot) */}
              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Choose a Vehicle
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(VEHICLE_PRICING).map(([key, v]) => {
                    const isSelected = formVehicle === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormVehicle(key)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${isSelected
                            ? 'bg-rose-50/60 border-rose-600 ring-2 ring-rose-600/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <div>
                          <div className="font-extrabold text-xs text-[#0b132b]">{v.label}</div>
                          <div className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{v.desc}</div>
                        </div>
                        <div className="text-[11px] font-extrabold text-rose-600 mt-2">
                          ${v.base} + ${v.perMile}/mi
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* When Do You Need It? */}
              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  When do you need it?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'Same day', title: 'Same day', sub: 'Pick-up today' },
                    { key: 'Scheduled', title: 'Scheduled', sub: 'Pick a date & time' },
                    { key: 'Recurring', title: 'Recurring', sub: 'Repeat on a schedule' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFormUrgency(item.key)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${formUrgency === item.key
                          ? 'bg-rose-50/60 border-rose-600 ring-2 ring-rose-600/30'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <div className="font-extrabold text-xs text-[#0b132b]">{item.title}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trip Type & How Fast */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Trip Type
                  </label>
                  <div className="flex gap-2">
                    {['One-way (A -> B)', 'Round trip'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormTripType(t)}
                        className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${formTripType === t
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    How Fast?
                  </label>
                  <div className="flex gap-2">
                    {[
                      { key: 'Standard', sub: 'Within 2 hours' },
                      { key: 'Express', sub: 'Within 60 min' },
                      { key: 'Priority', sub: 'ASAP 30 min' },
                    ].map(s => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setFormSpeed(s.key)}
                        className={`flex-1 py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${formSpeed === s.key
                            ? 'bg-blue-50 border-blue-600 text-blue-700 font-extrabold ring-2 ring-blue-600/20'
                            : 'bg-slate-50 text-slate-700 border-slate-200 font-bold'
                          }`}
                      >
                        <div className="text-xs">{s.key}</div>
                        <div className="text-[9px] opacity-75">{s.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Extras Checkboxes */}
              <div className="space-y-2">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Extras
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${formExtrasStairs ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-500/20' : 'bg-slate-50 border-slate-200'
                    }`}>
                    <input
                      type="checkbox"
                      checked={formExtrasStairs}
                      onChange={(e) => setFormExtrasStairs(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Stairs required (+$5)</div>
                      <div className="text-[10px] text-slate-500">Driver has to carry items upstairs</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${formExtrasWait ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-500/20' : 'bg-slate-50 border-slate-200'
                    }`}>
                    <input
                      type="checkbox"
                      checked={formExtrasWait}
                      onChange={(e) => setFormExtrasWait(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Wait time expected</div>
                      <div className="text-[10px] text-slate-500">First 10 min free, then $5 per 5 min</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Additional Information
                </label>
                <textarea
                  rows="3"
                  placeholder="Gate codes, apartment number, fragile items, who to ask for..."
                  value={formInfo}
                  onChange={(e) => setFormInfo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Submit Footer Bar */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 font-medium">
                  Est. Price: <strong className="text-xl font-black text-rose-600 ml-1">${calculateEstPrice()} USD</strong>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>Calculate Distance & Place Order</span>
                </button>
              </div>

            </form>

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
                  This job has been assigned to your driver account.
                </p>
              </div>
            </div>

            {/* Order Summary Box */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Order ID</span>
                  <div className="font-extrabold text-rose-600 text-sm">{acceptedModalState.order.id}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Driver Payout</span>
                  <div className="font-black text-emerald-600 text-xl">${acceptedModalState.order.price.toFixed(2)}</div>
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

    </div>
  );
}
