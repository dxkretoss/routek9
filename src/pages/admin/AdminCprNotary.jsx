import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit,
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
  RefreshCw,
  HeartPulse,
  FileText,
  ShieldCheck,
  Award,
  Activity,
  Briefcase,
  FileCheck,
  Car,
  Sliders,
  Check,
  ChevronDown
} from 'lucide-react';
import {
  fetchCprNotaryServices,
  createCprNotaryService,
  updateCprNotaryService,
  toggleCprNotaryServiceStatus,
  deleteCprNotaryService
} from '../../lib/supabase';

// Available Lucide Icon mappings corresponding to Material/Feather icon keys
const ICON_OPTIONS = [
  { key: 'health_and_safety', label: 'Health & Safety', Icon: Activity },
  { key: 'medical_services', label: 'Medical Services', Icon: HeartPulse },
  { key: 'assignment', label: 'Assignment / Document', Icon: FileText },
  { key: 'directions_car', label: 'Car / Mobile Notary', Icon: Car },
  { key: 'file_check', label: 'Verified Document', Icon: FileCheck },
  { key: 'shield_check', label: 'Shield & Security', Icon: ShieldCheck },
  { key: 'award', label: 'Award / Certificate', Icon: Award },
  { key: 'briefcase', label: 'Professional Briefcase', Icon: Briefcase }
];

function getIconComponent(iconName) {
  const matched = ICON_OPTIONS.find(opt => opt.key === iconName);
  return matched ? matched.Icon : HeartPulse;
}

// Safely parse dynamic_fields JSONB column
function parseDynamicFields(rawFields) {
  if (!rawFields) return [];
  if (Array.isArray(rawFields)) return rawFields;
  if (typeof rawFields === 'string') {
    try {
      const parsed = JSON.parse(rawFields);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function AdminCprNotary() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'cpr' | 'notary'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null); // null = Create, object = Edit
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Delete Modal State
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, id: null, title: '' });
  const [deleting, setDeleting] = useState(false);

  // Form Fields State
  const [formCategory, setFormCategory] = useState('cpr');
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIconName, setFormIconName] = useState('health_and_safety');
  const [formBasePrice, setFormBasePrice] = useState('65.00');
  const [formPerUnitPrice, setFormPerUnitPrice] = useState('0.00');
  const [formPriceUnit, setFormPriceUnit] = useState('per person');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDynamicFields, setFormDynamicFields] = useState([]);

  // Load Services from Supabase (Strictly Dynamic Data)
  const loadServices = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchCprNotaryServices();
      setServices(data || []);
    } catch (err) {
      console.error("Error querying cpr_notary_services:", err);
      setErrorMsg("Failed to query 'cpr_notary_services' table in Supabase.");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const triggerToast = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4500);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4500);
    }
  };

  // Handle Category Change
  const handleCategoryChange = (newCat) => {
    setFormCategory(newCat);
    if (newCat === 'cpr') {
      if (formPriceUnit !== 'per person' && formPriceUnit !== 'per visit') {
        setFormPriceUnit('per person');
      }
    } else {
      if (!['per signature', 'per visit', 'per signing', 'per act'].includes(formPriceUnit)) {
        setFormPriceUnit('per signature');
      }
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingService(null);
    setFormCategory('cpr');
    setFormTitle('');
    setFormSubtitle('');
    setFormDescription('');
    setFormIconName('health_and_safety');
    setFormBasePrice('65.00');
    setFormPerUnitPrice('0.00');
    setFormPriceUnit('per person');
    setFormIsActive(true);
    setFormDynamicFields([
      { key: 'attendees', label: 'Number of Attendees', type: 'number', required: true, default: 1, options: [] }
    ]);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (service) => {
    setEditingService(service);
    const cat = service.category || 'cpr';
    setFormCategory(cat);
    setFormTitle(service.title || '');
    setFormSubtitle(service.subtitle || '');
    setFormDescription(service.description || '');
    setFormIconName(service.icon_name || 'health_and_safety');
    setFormBasePrice(String(service.base_price ?? '0.00'));
    setFormPerUnitPrice(String(service.per_unit_price ?? '0.00'));
    setFormPriceUnit(service.price_unit || (cat === 'cpr' ? 'per person' : 'per signature'));
    setFormIsActive(service.is_active ?? true);
    setFormDynamicFields(parseDynamicFields(service.dynamic_fields));
    setShowModal(true);
  };

  // Handle Form Submit (Create / Update in Supabase)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      triggerToast("Service Title is required", true);
      return;
    }

    setSubmitting(true);
    const servicePayload = {
      category: formCategory,
      title: formTitle.trim(),
      subtitle: formSubtitle.trim(),
      description: formDescription.trim(),
      icon_name: formIconName,
      base_price: parseFloat(formBasePrice) || 0.00,
      per_unit_price: parseFloat(formPerUnitPrice) || 0.00,
      price_unit: formPriceUnit,
      is_active: formIsActive,
      dynamic_fields: formDynamicFields
    };

    try {
      if (editingService) {
        const res = await updateCprNotaryService(editingService.id, servicePayload);
        if (!res.success) throw new Error(res.error);
        triggerToast("Service updated successfully in Supabase!");
      } else {
        const res = await createCprNotaryService(servicePayload);
        if (!res.success) throw new Error(res.error);
        triggerToast("Service created successfully in Supabase!");
      }
      setShowModal(false);
      loadServices();
    } catch (err) {
      console.error(err);
      triggerToast(`Operation failed: ${err.message}`, true);
    } finally {
      setSubmitting(false);
    }
  };

  // Inline Active Status Toggle in Supabase
  const handleToggleActive = async (service) => {
    const newStatus = !service.is_active;
    setTogglingId(service.id);

    try {
      const res = await toggleCprNotaryServiceStatus(service.id, newStatus);
      if (!res.success) throw new Error(res.error || 'Failed to update status');

      // Update local state with new status
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, is_active: newStatus } : s));
      triggerToast(`"${service.title}" status updated to ${newStatus ? 'Active' : 'Inactive'}`);
    } catch (err) {
      console.error(err);
      triggerToast(`Toggle failed: ${err.message}`, true);
    } finally {
      setTogglingId(null);
    }
  };

  // Confirm Delete from Supabase
  const handleConfirmDelete = async () => {
    setDeleting(true);

    try {
      const res = await deleteCprNotaryService(deleteModalState.id);
      if (!res.success) throw new Error(res.error);

      triggerToast("Service deleted successfully from Supabase!");
      setDeleteModalState({ isOpen: false, id: null, title: '' });
      loadServices();
    } catch (err) {
      console.error(err);
      triggerToast(`Delete failed: ${err.message}`, true);
    } finally {
      setDeleting(false);
    }
  };

  // Filter & Search items
  const filteredServices = services.filter(service => {
    // Search query
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      (service.title || '').toLowerCase().includes(query) ||
      (service.subtitle || '').toLowerCase().includes(query);

    // Category filter
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;

    // Status filter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && service.is_active) ||
      (statusFilter === 'inactive' && !service.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-serif-heading tracking-tight">
              CPR & Notary Services Management
            </h2>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200">
              {services.length} Live Services
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage dynamic mobile CPR certifications and Notary public services.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadServices}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all shadow-2xs cursor-pointer"
            title="Refresh Services List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Service</span>
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

      {/* Filter Bar & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title or subtitle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:outline-hidden focus:border-rose-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          {/* Category Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${categoryFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All Categories
            </button>
            <button
              onClick={() => setCategoryFilter('cpr')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${categoryFilter === 'cpr' ? 'bg-rose-600 text-white shadow-2xs font-extrabold' : 'text-slate-500 hover:text-rose-600'}`}
            >
              CPR
            </button>
            <button
              onClick={() => setCategoryFilter('notary')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${categoryFilter === 'notary' ? 'bg-blue-600 text-white shadow-2xs font-extrabold' : 'text-slate-500 hover:text-blue-600'}`}
            >
              Notary
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-emerald-700'}`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${statusFilter === 'inactive' ? 'bg-slate-700 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Querying Supabase cpr_notary_services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <HeartPulse className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-700">No services found in database.</p>
            {services.length > 0 ? (
              <button
                onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setStatusFilter('all'); }}
                className="text-xs text-rose-600 hover:underline font-extrabold cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={handleOpenCreateModal}
                className="text-xs text-rose-600 hover:underline font-extrabold cursor-pointer"
              >
                + Add First Service Record
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                  <th className="px-6 py-4">Service Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Base Price ($)</th>
                  <th className="px-6 py-4">Per-Unit Price ($)</th>
                  <th className="px-6 py-4">Active Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                {filteredServices.map((service) => {
                  const IconComp = getIconComponent(service.icon_name);
                  const isCpr = service.category === 'cpr';

                  return (
                    <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Service Details */}
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${isCpr ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-snug">{service.title}</div>
                            {service.subtitle && (
                              <div className="text-[11px] text-slate-500 font-medium">{service.subtitle}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${isCpr ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {isCpr ? 'CPR Training' : 'Notary Public'}
                        </span>
                      </td>

                      {/* Base Price */}
                      <td className="px-6 py-4 font-extrabold text-slate-900 whitespace-nowrap">
                        ${parseFloat(service.base_price || 0).toFixed(2)}
                      </td>

                      {/* Per-Unit Price */}
                      <td className="px-6 py-4 font-bold text-slate-600 whitespace-nowrap">
                        {isCpr ? (
                          `$${(parseFloat(service.per_unit_price || 0) > 0 ? parseFloat(service.per_unit_price) : parseFloat(service.base_price || 0)).toFixed(2)} / ${service.price_unit || 'per person'}`
                        ) : (
                          parseFloat(service.per_unit_price || 0) > 0
                            ? `$${parseFloat(service.per_unit_price).toFixed(2)} / ${service.price_unit || 'per signature'}`
                            : '—'
                        )}
                      </td>

                      {/* Active Status Inline Toggle */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(service)}
                            disabled={togglingId === service.id}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${service.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                            title={service.is_active ? 'Click to Deactivate' : 'Click to Activate'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${service.is_active ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                          </button>
                          {togglingId === service.id && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600 shrink-0" />
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditModal(service)}
                          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                          title="Edit Service"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteModalState({ isOpen: true, id: service.id, title: service.title })}
                          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                          title="Delete Service"
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

      {/* CREATE & EDIT SERVICE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl p-5 sm:p-6 space-y-3 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer z-10"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleSubmitForm} className="space-y-3 text-left text-xs">
              {/* 1. Basic Info Section */}
              <div className="space-y-2.5 bg-slate-50/75 p-3.5 rounded-2xl border border-slate-200/80">
                <h4 className="text-[11px] font-extrabold text-[#0b132b] uppercase tracking-wider">1. Basic Information</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category Dropdown */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Service Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-rose-500 text-xs"
                    >
                      <option value="cpr">CPR Training (cpr)</option>
                      <option value="notary">Notary Public (notary)</option>
                    </select>
                  </div>

                  {/* Icon Selector */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Display Icon Key *</label>
                    <select
                      value={formIconName}
                      onChange={(e) => setFormIconName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-rose-500 text-xs"
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label} ({opt.key})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Service Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CPR / AED — Adult, Child & Infant"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-rose-500 text-xs"
                  />
                </div>

                {/* Subtitle / Duration */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Subtitle / Course Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 3 hrs certification course"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-rose-500 text-xs"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Detailed description of the service..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-rose-500 text-xs resize-none"
                  />
                </div>
              </div>

              {/* 2. Pricing Configuration */}
              <div className="space-y-2.5 bg-slate-50/75 p-3.5 rounded-2xl border border-slate-200/80">
                <h4 className="text-[11px] font-extrabold text-[#0b132b] uppercase tracking-wider">2. Pricing & Rate Unit</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Base Price */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Base Price ($) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formBasePrice}
                        onChange={(e) => setFormBasePrice(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-rose-500 text-xs"
                      />
                    </div>
                  </div>

                  {/* Per Unit Price */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Per-Unit Price ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formPerUnitPrice}
                        onChange={(e) => setFormPerUnitPrice(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-rose-500 text-xs"
                      />
                    </div>
                  </div>

                  {/* Price Unit Selector (price_unit column) */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Price Unit *</label>
                    <select
                      value={formPriceUnit}
                      onChange={(e) => setFormPriceUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-hidden focus:border-rose-500 text-xs"
                    >
                      {formCategory === 'cpr' ? (
                        <>
                          <option value="per person">per person</option>
                          <option value="per visit">per visit</option>
                        </>
                      ) : (
                        <>
                          <option value="per signature">per signature</option>
                          <option value="per visit">per visit</option>
                          <option value="per signing">per signing</option>
                          <option value="per act">per act</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  <span>{editingService ? 'Save Updates' : 'Create Service'}</span>
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
              <h4 className="text-base font-extrabold text-[#0b132b] font-serif-heading">Delete Service?</h4>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to delete <strong className="text-slate-900 font-bold">{deleteModalState.title}</strong>? This action cannot be undone in Supabase.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setDeleteModalState({ isOpen: false, id: null, title: '' })}
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
