import React, { useState } from 'react';
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
  Navigation
} from 'lucide-react';

export default function DispatchOrdersPage({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'accepted'
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

  const [acceptedModalState, setAcceptedModalState] = useState({ isOpen: false, order: null });

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
                  Try adjusting your search criteria.
                </p>
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
                        <p className="text-[11px] text-slate-500 font-medium mt-1">Assigned Driver: <strong className="text-slate-800 font-bold">{order?.assignedDriver?.name}</strong></p>
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
