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
  Car
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form states
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('');
  const [newRate, setNewRate] = useState('0.00');
  const [submitting, setSubmitting] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [editRate, setEditRate] = useState('0.00');
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
        .order('vehicle_name', { ascending: true });

      if (error) {
        // Fallback to static list for demo purposes if table not found
        console.warn("vehicle_types table query error:", error.message);
        setErrorMsg("Table 'vehicle_types' does not exist in Supabase yet. Please run the SQL setup script to create it.");
        setVehicles([
          { id: '1', vehicle_name: 'Cargo Van', vehicle_type: 'cargo_van', vehicle_rate: 1.20 },
          { id: '2', vehicle_name: 'Sprinter / High-Top Van', vehicle_type: 'sprinter_van', vehicle_rate: 1.50 },
          { id: '3', vehicle_name: '16ft Box Truck', vehicle_type: 'box_truck_16', vehicle_rate: 2.00 },
          { id: '4', vehicle_name: '26ft Box Truck', vehicle_type: 'box_truck_26', vehicle_rate: 2.50 },
          { id: '5', vehicle_name: 'Pickup Truck / SUV', vehicle_type: 'pickup_suv', vehicle_rate: 1.10 },
          { id: '6', vehicle_name: 'Passenger Car / Sedan', vehicle_type: 'sedan', vehicle_rate: 0.90 }
        ]);
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
      triggerToast("Please fill all required fields", true);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        vehicle_name: newName.trim(),
        vehicle_rate: parseFloat(newRate) || 0.00
      };

      const { data, error } = await supabase
        .from('vehicle_types')
        .insert(payload)
        .select('*');

      if (error) throw error;

      triggerToast("Vehicle added successfully!");
      setShowAddModal(false);
      setNewName('');
      setNewType('');
      setNewRate('0.00');
      loadVehicles();
    } catch (err) {
      console.error(err);
      triggerToast(`Add failed: ${err.message}`, true);
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Vehicle Action
  const startEditVehicle = (veh) => {
    setEditingId(veh.id);
    setEditName(veh.vehicle_name);
    setEditType(veh.vehicle_type);
    setEditRate(String(veh.vehicle_rate));
    setShowEditModal(true);
  };

  // Save Edit
  const handleEditVehicle = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      triggerToast("Name is required", true);
      return;
    }

    setUpdating(true);
    try {
      const payload = {
        vehicle_name: editName.trim(),
        vehicle_rate: parseFloat(editRate) || 0.00
      };

      const { error } = await supabase
        .from('vehicle_types')
        .update(payload)
        .eq('id', editingId);

      if (error) throw error;

      triggerToast("Vehicle updated successfully!");
      setShowEditModal(false);
      loadVehicles();
    } catch (err) {
      console.error(err);
      triggerToast(`Update failed: ${err.message}`, true);
    } finally {
      setUpdating(false);
    }
  };

  // Delete Vehicle Action
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-serif-heading tracking-tight">
            Vehicle Class & Rate Management ({vehicles.length})
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Define primary vehicle types, set base rates (fees), and manage what is displayed to drivers during onboarding and order dispatching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadVehicles}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all shadow-2xs cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer"
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
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex flex-col gap-2.5 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        </div>
      )}



      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading && vehicles.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Querying vehicle classes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                  <th className="px-6 py-4">Vehicle Name</th>
                  <th className="px-6 py-4">Base Payout Rate</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                          <Car className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900">{v.vehicle_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 text-sm">
                      ${parseFloat(v.vehicle_rate).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => startEditVehicle(v)}
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Edit Vehicle Class"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => startDeleteVehicle(v)}
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Delete Vehicle Class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD VEHICLE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">
                Add New Vehicle Class
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Define a primary vehicle type that drivers can choose.
              </p>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-4 text-left text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Vehicle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 26ft Box Truck"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-rose-500 transition-all text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Base Payout Rate ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-rose-500 transition-all text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-6 relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">
                Edit Vehicle Class
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Update base payout rate or vehicle class name.
              </p>
            </div>

            <form onSubmit={handleEditVehicle} className="space-y-4 text-left text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Vehicle Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-rose-500 transition-all text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Base Payout Rate ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editRate}
                    onChange={(e) => setEditRate(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-rose-500 transition-all text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
