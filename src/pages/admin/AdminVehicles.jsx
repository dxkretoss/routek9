import React, { useState, useEffect } from 'react';
import {
  Plus,
  Truck,
  DollarSign,
  Trash2,
  Edit,
  CheckCircle2,
  Loader2,
  X,
  Layers,
  AlertCircle,
  RefreshCw,
  Car,
  Search,
  Weight,
  ToggleLeft,
  ToggleRight,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Add Form states
  const [newName, setNewName] = useState('');
  const [newBasePrice, setNewBasePrice] = useState('7.00');
  const [newPerMile, setNewPerMile] = useState('1.80');
  const [newMaxWeight, setNewMaxWeight] = useState('99999');
  const [newDescription, setNewDescription] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Edit Form states
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBasePrice, setEditBasePrice] = useState('7.00');
  const [editPerMile, setEditPerMile] = useState('1.80');
  const [editMaxWeight, setEditMaxWeight] = useState('99999');
  const [editDescription, setEditDescription] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, id: null, name: '' });
  const [deleting, setDeleting] = useState(false);

  // Load Vehicles from Supabase
  const loadVehicles = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('vehicle_types')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn("vehicle_types table query error:", error.message);
        setErrorMsg("Failed to query vehicle_types table from Supabase.");
      } else {
        setVehicles(data || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to query vehicle_types table.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const triggerToast = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Add Vehicle
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      triggerToast("Please enter a vehicle name", true);
      return;
    }

    setSubmitting(true);
    try {
      const basePriceNum = parseFloat(newBasePrice) || 0.00;
      const perMileNum = parseFloat(newPerMile) || 0.00;
      const maxWeightNum = parseFloat(newMaxWeight) || 0.00;

      const payload = {
        vehicle_name: newName.trim(),
        base_price: basePriceNum,
        per_mile: perMileNum,
        max_weight_lbs: maxWeightNum,
        description: newDescription.trim() || null,
        is_active: newIsActive
      };

      const { data, error } = await supabase
        .from('vehicle_types')
        .insert([payload])
        .select('*');

      if (error) throw error;

      triggerToast("Vehicle class added successfully!");
      setShowAddModal(false);
      setNewName('');
      setNewBasePrice('7.00');
      setNewPerMile('1.80');
      setNewMaxWeight('99999');
      setNewDescription('');
      setNewIsActive(true);
      loadVehicles();
    } catch (err) {
      console.error(err);
      triggerToast(`Add failed: ${err.message}`, true);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const startEditVehicle = (veh) => {
    setEditingId(veh.id);
    setEditName(veh.vehicle_name || '');
    setEditBasePrice(String(veh.base_price !== null && veh.base_price !== undefined ? veh.base_price : '7.00'));
    setEditPerMile(String(veh.per_mile !== null && veh.per_mile !== undefined ? veh.per_mile : '1.80'));
    setEditMaxWeight(String(veh.max_weight_lbs !== null && veh.max_weight_lbs !== undefined ? veh.max_weight_lbs : '99999'));
    setEditDescription(veh.description || '');
    setEditIsActive(veh.is_active !== false);
    setShowEditModal(true);
  };

  // Save Edit
  const handleEditVehicle = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      triggerToast("Vehicle name is required", true);
      return;
    }

    setUpdating(true);
    try {
      const basePriceNum = parseFloat(editBasePrice) || 0.00;
      const perMileNum = parseFloat(editPerMile) || 0.00;
      const maxWeightNum = parseFloat(editMaxWeight) || 0.00;

      const payload = {
        vehicle_name: editName.trim(),
        base_price: basePriceNum,
        per_mile: perMileNum,
        max_weight_lbs: maxWeightNum,
        description: editDescription.trim() || null,
        is_active: editIsActive
      };

      // Optimistic update
      setVehicles(prev => prev.map(v => v.id === editingId ? { ...v, ...payload } : v));

      const { data, error } = await supabase
        .from('vehicle_types')
        .update(payload)
        .eq('id', editingId)
        .select('*');

      if (error) throw error;

      if (!data || data.length === 0) {
        console.warn("Supabase returned 0 updated rows. Check RLS policies on vehicle_types table if persistent.");
      }

      triggerToast("Vehicle class updated successfully!");
      setShowEditModal(false);
      loadVehicles();
    } catch (err) {
      console.error(err);
      triggerToast(`Update failed: ${err.message}`, true);
    } finally {
      setUpdating(false);
    }
  };

  // Toggle Active / Inactive
  const handleToggleActive = async (veh) => {
    const nextActive = veh.is_active === false ? true : false;
    setTogglingId(veh.id);

    // Optimistic UI update
    setVehicles(prev => prev.map(v => v.id === veh.id ? { ...v, is_active: nextActive } : v));

    try {
      const { data, error } = await supabase
        .from('vehicle_types')
        .update({ is_active: nextActive })
        .eq('id', veh.id)
        .select('*');

      if (error) throw error;
      triggerToast(`Vehicle set to ${nextActive ? 'Active' : 'Inactive'}`);
      loadVehicles();
    } catch (err) {
      console.error("Toggle error:", err);
      // Revert on failure
      setVehicles(prev => prev.map(v => v.id === veh.id ? { ...v, is_active: !nextActive } : v));
      triggerToast(`Status update failed: ${err.message}`, true);
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Action
  const startDeleteVehicle = (veh) => {
    setDeleteModalState({ isOpen: true, id: veh.id, name: veh.vehicle_name });
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('vehicle_types')
        .delete()
        .eq('id', deleteModalState.id);

      if (error) throw error;

      triggerToast("Vehicle deleted successfully!");
      setDeleteModalState({ isOpen: false, id: null, name: '' });
      loadVehicles();
    } catch (err) {
      console.error(err);
      triggerToast(`Delete failed: ${err.message}`, true);
    } finally {
      setDeleting(false);
    }
  };

  // Filtered vehicles
  const filteredVehicles = vehicles.filter(v => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (v.vehicle_name || '').toLowerCase().includes(q) ||
      (v.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-serif-heading tracking-tight">
            Vehicle Class & Rate Management
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure vehicle classes, set base prices, per-mile rates, max weights, and manage dispatch visibility
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadVehicles}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-2"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vehicle Class</span>
          </button>
        </div>
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

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Active Vehicle Classes</h3>
            <p className="text-xs text-slate-400 font-medium">Platform vehicle types, base rates, & payload capacities</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vehicle classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-100 transition-all"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {loading && vehicles.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Querying vehicle classes from Supabase...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400 font-medium space-y-2">
            <Truck className="w-8 h-8 mx-auto text-slate-300" />
            <p>No vehicle classes found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Vehicle Name</th>
                  <th className="px-6 py-4">Base Price</th>
                  <th className="px-6 py-4">Per Mile Rate</th>
                  <th className="px-6 py-4">Max Weight (lbs)</th>
                  <th className="px-6 py-4 text-center">ACTIVE STATUS</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                {filteredVehicles.map((v) => {
                  const isActive = v.is_active !== false;
                  const basePrice = Number(v.base_price ?? v.vehicle_rate ?? 0).toFixed(2);
                  const perMile = Number(v.per_mile ?? 0).toFixed(2);
                  const maxWeight = Number(v.max_weight_lbs ?? 0).toLocaleString();

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Vehicle Name & Icon */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-50 to-amber-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                            <Car className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block truncate max-w-[220px]">
                              {v.vehicle_name}
                            </span>
                            {v.description && (
                              <span className="text-[10px] text-slate-400 font-normal block truncate max-w-[220px]">
                                {v.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Base Price */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-black text-emerald-600 text-sm">
                          ${basePrice}
                        </span>
                      </td>

                      {/* Per Mile Rate */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-extrabold text-slate-700 text-xs">
                          ${perMile} <span className="text-[10px] text-slate-400 font-semibold">/ mi</span>
                        </span>
                      </td>

                      {/* Max Weight */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                          <Weight className="w-3 h-3 text-slate-400" />
                          <span>{maxWeight} lbs</span>
                        </span>
                      </td>

                      {/* Active / Inactive Toggle Switch */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(v)}
                          disabled={togglingId === v.id}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isActive ? 'bg-[#00c569]' : 'bg-slate-300'
                          } ${togglingId === v.id ? 'opacity-50 cursor-wait' : ''}`}
                          title={`Toggle ${isActive ? 'Inactive' : 'Active'}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => startEditVehicle(v)}
                          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
                          title="Edit Vehicle Class"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => startDeleteVehicle(v)}
                          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-all shadow-2xs cursor-pointer"
                          title="Delete Vehicle Class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ADD VEHICLE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">
                Add New Vehicle Class
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Define a primary vehicle type, pricing rates, and payload specifications
              </p>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-4 text-left text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Vehicle Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 26ft Box Truck"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Base Price ($) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="7.00"
                      value={newBasePrice}
                      onChange={(e) => setNewBasePrice(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Per Mile Rate ($/mi) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="1.80"
                      value={newPerMile}
                      onChange={(e) => setNewPerMile(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Max Weight Capacity (lbs) *</label>
                <div className="relative">
                  <Weight className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    placeholder="99999"
                    value={newMaxWeight}
                    onChange={(e) => setNewMaxWeight(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Optional vehicle capacity or specification notes..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-extrabold text-slate-800 block text-xs">Active Status</span>
                  <span className="text-[10px] text-slate-400 font-medium">Visible to drivers and dispatchers</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNewIsActive(!newIsActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    newIsActive ? 'bg-[#00c569]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      newIsActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Vehicle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VEHICLE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-6 relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">
                Edit Vehicle Class
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Update vehicle name, base price, per-mile rate, and payload limit
              </p>
            </div>

            <form onSubmit={handleEditVehicle} className="space-y-4 text-left text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Vehicle Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Base Price ($) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={editBasePrice}
                      onChange={(e) => setEditBasePrice(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Per Mile Rate ($/mi) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={editPerMile}
                      onChange={(e) => setEditPerMile(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Max Weight Capacity (lbs) *</label>
                <div className="relative">
                  <Weight className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={editMaxWeight}
                    onChange={(e) => setEditMaxWeight(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description (Optional)</label>
                <textarea
                  rows="2"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-xs"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-extrabold text-slate-800 block text-xs">Active Status</span>
                  <span className="text-[10px] text-slate-400 font-medium">Visible to drivers and dispatchers</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditIsActive(!editIsActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    editIsActive ? 'bg-[#00c569]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      editIsActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 space-y-5 text-center relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-[#0b132b] font-serif-heading">Delete Vehicle Class?</h4>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to delete <strong className="text-slate-900 font-bold">{deleteModalState.name}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDeleteModalState({ isOpen: false, id: null, name: '' })}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
