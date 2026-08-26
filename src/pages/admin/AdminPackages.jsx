import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Layers,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle2,
  Loader2,
  X,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Truck,
  Mail,
  Utensils,
  Inbox,
  FileText,
  Box,
  PackageCheck
} from 'lucide-react';
import {
  fetchPackageCategories,
  createPackageCategory,
  updatePackageCategory,
  togglePackageCategoryActive,
  deletePackageCategory,
  fetchPackageTypes,
  createPackageType,
  updatePackageType,
  togglePackageTypeActive,
  deletePackageType
} from '../../lib/supabase';

// Helper to map string icon key to Lucide Icon component
function renderPackageIcon(iconName, className = "w-4 h-4") {
  switch (iconName) {
    case 'markunread':
    case 'mail':
      return <Mail className={className} />;
    case 'takeout_dining':
    case 'utensils':
      return <Utensils className={className} />;
    case 'all_inbox':
    case 'inbox':
      return <Inbox className={className} />;
    case 'local_shipping':
    case 'truck':
      return <Truck className={className} />;
    case 'description':
    case 'filetext':
      return <FileText className={className} />;
    case 'box':
      return <Box className={className} />;
    case 'package_check':
      return <PackageCheck className={className} />;
    case 'inventory_2':
    case 'package':
    default:
      return <Package className={className} />;
  }
}

const ICON_OPTIONS = [
  { key: 'inventory_2', label: 'Package Box (inventory_2)', icon: Package },
  { key: 'markunread', label: 'Envelope / Letter (markunread)', icon: Mail },
  { key: 'takeout_dining', label: 'Takeout / Food (takeout_dining)', icon: Utensils },
  { key: 'all_inbox', label: 'All Inbox / Flat (all_inbox)', icon: Inbox },
  { key: 'local_shipping', label: 'Local Shipping / Freight (local_shipping)', icon: Truck },
  { key: 'description', label: 'Document / Paper (description)', icon: FileText },
  { key: 'box', label: 'Standard Box (box)', icon: Box },
];

// Fallback seed data in case Supabase tables are not yet populated
// Fallback seed data matching database package_categories & package_types
const FALLBACK_CATEGORIES = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    title: 'Documents & Letters',
    description: 'Envelopes, legal documents, certificates, and flat items.',
    icon_name: 'markunread',
    display_order: 1,
    is_active: true
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    title: 'Parcels & Boxes',
    description: 'Small to large boxed goods, ecommerce orders, and electronics.',
    icon_name: 'inventory_2',
    display_order: 2,
    is_active: true
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    title: 'Freight & Heavy Cargo',
    description: 'Palletized goods, industrial items, and heavy cargo.',
    icon_name: 'local_shipping',
    display_order: 3,
    is_active: true
  }
];

const FALLBACK_PACKAGE_TYPES = [
  {
    id: '748ab508-390a-46ea-b90b-4f7958754c34',
    category_id: 'a1111111-1111-1111-1111-111111111111',
    name: 'Envelope / Letter',
    subtitle: 'Flat document pouch up to 1 lb',
    description: 'Ideal for legal, financial, or personal documents.',
    max_weight_lbs: 1.00,
    max_dimensions_cm: '30x20 cm',
    base_price: 5.00,
    per_mile_price: 1.20,
    icon_name: 'markunread',
    display_order: 1,
    is_active: true,
    created_at: '2026-08-19 11:44:28.911942+00',
    updated_at: '2026-08-19 11:44:28.911942+00',
    package_categories: { title: 'Documents & Letters' }
  },
  {
    id: 'c27e1bc6-4b3f-4432-8817-6177dbecc115',
    category_id: 'a2222222-2222-2222-2222-222222222222',
    name: 'Small Box',
    subtitle: 'Up to 10 lbs',
    description: 'Fits small electronics, shoes, groceries.',
    max_weight_lbs: 10.00,
    max_dimensions_cm: '30x30x30 cm',
    base_price: 8.50,
    per_mile_price: 1.50,
    icon_name: 'inventory_2',
    display_order: 1,
    is_active: true,
    created_at: '2026-08-19 11:44:28.911942+00',
    updated_at: '2026-08-19 11:44:28.911942+00',
    package_categories: { title: 'Parcels & Boxes' }
  },
  {
    id: '57100d03-7d51-4037-9a65-1a15d54be98f',
    category_id: 'a2222222-2222-2222-2222-222222222222',
    name: 'Medium Box',
    subtitle: 'Up to 30 lbs',
    description: 'Fits medium appliances, multiple items.',
    max_weight_lbs: 30.00,
    max_dimensions_cm: '50x50x50 cm',
    base_price: 14.00,
    per_mile_price: 1.80,
    icon_name: 'takeout_dining',
    display_order: 2,
    is_active: true,
    created_at: '2026-08-19 11:44:28.911942+00',
    updated_at: '2026-08-19 11:44:28.911942+00',
    package_categories: { title: 'Parcels & Boxes' }
  },
  {
    id: '0c3dfa04-3e84-41a3-ae2b-80d9c8527610',
    category_id: 'a2222222-2222-2222-2222-222222222222',
    name: 'Large Box',
    subtitle: 'Up to 70 lbs',
    description: 'Fits large packages, heavy equipment.',
    max_weight_lbs: 70.00,
    max_dimensions_cm: '80x80x80 cm',
    base_price: 22.00,
    per_mile_price: 2.20,
    icon_name: 'all_inbox',
    display_order: 3,
    is_active: true,
    created_at: '2026-08-19 11:44:28.911942+00',
    updated_at: '2026-08-19 11:44:28.911942+00',
    package_categories: { title: 'Parcels & Boxes' }
  },
  {
    id: '4bcc2002-1ea4-4eca-96ba-66bda3b3d169',
    category_id: 'a3333333-3333-3333-3333-333333333333',
    name: 'Heavy Freight / Pallet',
    subtitle: 'Up to 300 lbs',
    description: 'Requires van or truck for transport.',
    max_weight_lbs: 300.00,
    max_dimensions_cm: '120x100x120 cm',
    base_price: 55.00,
    per_mile_price: 3.50,
    icon_name: 'local_shipping',
    display_order: 1,
    is_active: true,
    created_at: '2026-08-19 11:44:28.911942+00',
    updated_at: '2026-08-19 11:44:28.911942+00',
    package_categories: { title: 'Freight & Heavy Cargo' }
  }
];

export default function AdminPackages() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State: 'types' or 'categories'
  const activeTab = searchParams.get('tab') === 'categories' ? 'categories' : 'types';

  const setActiveTab = (tabKey) => {
    const currentSection = searchParams.get('section') || 'packages';
    setSearchParams({ section: currentSection, tab: tabKey }, { replace: true });
  };

  // Data States
  const [categories, setCategories] = useState([]);
  const [packageTypes, setPackageTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Filters & Search State for Package Types Tab
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Notification / Toast States
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Modal States - Package Type
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState(null); // null if adding new
  const [typeForm, setTypeForm] = useState({
    category_id: '',
    name: '',
    subtitle: '',
    description: '',
    base_price: '14.00',
    per_mile_price: '1.80',
    max_weight_lbs: '30.0',
    max_dimensions_cm: '50x50x50 cm',
    icon_name: 'inventory_2',
    display_order: '1',
    is_active: true
  });
  const [submittingType, setSubmittingType] = useState(false);

  // Modal States - Package Category
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null if adding new
  const [categoryForm, setCategoryForm] = useState({
    title: '',
    description: '',
    icon_name: 'inventory_2',
    display_order: '1',
    is_active: true
  });
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Modal States - Delete Confirmation
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    itemType: 'package_type', // 'package_type' | 'category'
    id: null,
    title: ''
  });
  const [deleting, setDeleting] = useState(false);

  // Trigger Toast Alert
  const triggerToast = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // Load Data dynamically from Supabase
  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [catData, typeData] = await Promise.all([
        fetchPackageCategories(),
        fetchPackageTypes()
      ]);

      setCategories(catData || []);
      setPackageTypes(typeData || []);
      setIsUsingFallback(false);
    } catch (err) {
      console.warn("Error loading package data from Supabase:", err);
      setErrorMsg(`Database connection error: ${err.message || 'Failed to fetch package data.'}`);
      setCategories([]);
      setPackageTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ────────────────────────────────────────────────────────────────
  // PACKAGE TYPES CRUD HANDLERS
  // ────────────────────────────────────────────────────────────────

  const openAddTypeModal = () => {
    const defaultCatId = categories.length > 0 ? categories[0].id : '';
    setEditingType(null);
    setTypeForm({
      category_id: defaultCatId,
      name: '',
      subtitle: '',
      description: '',
      base_price: '14.00',
      per_mile_price: '1.80',
      max_weight_lbs: '30.0',
      max_dimensions_cm: '50x50x50 cm',
      icon_name: 'inventory_2',
      display_order: String(packageTypes.length + 1),
      is_active: true
    });
    setShowTypeModal(true);
  };

  const openEditTypeModal = (pkgType) => {
    setEditingType(pkgType);
    setTypeForm({
      category_id: pkgType.category_id || '',
      name: pkgType.name || '',
      subtitle: pkgType.subtitle || '',
      description: pkgType.description || '',
      base_price: String(pkgType.base_price !== undefined ? pkgType.base_price : '0.00'),
      per_mile_price: String(pkgType.per_mile_price !== undefined ? pkgType.per_mile_price : '0.00'),
      max_weight_lbs: String(pkgType.max_weight_lbs !== undefined ? pkgType.max_weight_lbs : '0'),
      max_dimensions_cm: pkgType.max_dimensions_cm || '',
      icon_name: pkgType.icon_name || 'inventory_2',
      display_order: String(pkgType.display_order || 1),
      is_active: pkgType.is_active !== undefined ? pkgType.is_active : true
    });
    setShowTypeModal(true);
  };

  const handleSavePackageType = async (e) => {
    e.preventDefault();
    if (!typeForm.name.trim()) {
      triggerToast("Package name is required", true);
      return;
    }
    if (!typeForm.category_id) {
      triggerToast("Please select a Category", true);
      return;
    }

    setSubmittingType(true);
    try {
      if (editingType) {
        // Update via Supabase
        const res = await updatePackageType(editingType.id, typeForm);
        if (res.success) {
          triggerToast(`Package type "${typeForm.name}" updated successfully!`);
          setShowTypeModal(false);
          await loadData();
        } else {
          triggerToast(`Failed to update package type: ${res.error || 'Database error'}`, true);
        }
      } else {
        // Create via Supabase
        const res = await createPackageType(typeForm);
        if (res.success) {
          triggerToast(`Package type "${typeForm.name}" created successfully!`);
          setShowTypeModal(false);
          await loadData();
        } else {
          triggerToast(`Failed to create package type: ${res.error || 'Database error'}`, true);
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast(`Failed to save package type: ${err.message}`, true);
    } finally {
      setSubmittingType(false);
    }
  };

  const handleToggleTypeActive = async (pkgType) => {
    const newStatus = !pkgType.is_active;
    // Optimistically update UI immediately
    setPackageTypes(prev => prev.map(t => t.id === pkgType.id ? { ...t, is_active: newStatus } : t));

    const res = await togglePackageTypeActive(pkgType.id, newStatus);
    if (res.success) {
      triggerToast(`"${pkgType.name}" status set to ${newStatus ? 'Active' : 'Inactive'}`);
    } else {
      // Revert UI if Supabase update failed (e.g. RLS policy error)
      setPackageTypes(prev => prev.map(t => t.id === pkgType.id ? { ...t, is_active: pkgType.is_active } : t));
      triggerToast(`Database Update Blocked: ${res.error || 'Please run RLS policy query in Supabase SQL Editor.'}`, true);
    }
  };

  // ────────────────────────────────────────────────────────────────
  // PACKAGE CATEGORIES CRUD HANDLERS
  // ────────────────────────────────────────────────────────────────

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({
      title: '',
      description: '',
      icon_name: 'inventory_2',
      display_order: String(categories.length + 1),
      is_active: true
    });
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      title: cat.title || '',
      description: cat.description || '',
      icon_name: cat.icon_name || 'inventory_2',
      display_order: String(cat.display_order || 1),
      is_active: cat.is_active !== undefined ? cat.is_active : true
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.title.trim()) {
      triggerToast("Category title is required", true);
      return;
    }

    setSubmittingCategory(true);
    try {
      if (editingCategory) {
        // Update via Supabase
        const res = await updatePackageCategory(editingCategory.id, categoryForm);
        if (res.success) {
          triggerToast(`Category "${categoryForm.title}" updated successfully!`);
          setShowCategoryModal(false);
          await loadData();
        } else {
          triggerToast(`Failed to update category: ${res.error || 'Database error'}`, true);
        }
      } else {
        // Create via Supabase
        const res = await createPackageCategory(categoryForm);
        if (res.success) {
          triggerToast(`Category "${categoryForm.title}" created successfully!`);
          setShowCategoryModal(false);
          await loadData();
        } else {
          triggerToast(`Failed to create category: ${res.error || 'Database error'}`, true);
        }
      }
    } catch (err) {
      console.error(err);
      triggerToast(`Failed to save category: ${err.message}`, true);
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleToggleCategoryActive = async (cat) => {
    const newStatus = !cat.is_active;
    // Optimistically update UI immediately
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: newStatus } : c));

    const res = await togglePackageCategoryActive(cat.id, newStatus);
    if (res.success) {
      triggerToast(`Category "${cat.title}" set to ${newStatus ? 'Active' : 'Inactive'}`);
    } else {
      // Revert UI if Supabase update failed
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: cat.is_active } : c));
      triggerToast(`Database Update Blocked: ${res.error || 'Please run RLS policy query in Supabase SQL Editor.'}`, true);
    }
  };

  // ────────────────────────────────────────────────────────────────
  // DELETE HANDLERS
  // ────────────────────────────────────────────────────────────────

  const openDeleteModal = (itemType, id, title) => {
    setDeleteModalState({
      isOpen: true,
      itemType,
      id,
      title
    });
  };

  const confirmDelete = async () => {
    if (!deleteModalState.id) return;
    setDeleting(true);
    try {
      if (deleteModalState.itemType === 'package_type') {
        const res = await deletePackageType(deleteModalState.id);
        if (res.success) {
          triggerToast(`Package type "${deleteModalState.title}" deleted.`);
          await loadData();
        } else {
          triggerToast(`Failed to delete package type: ${res.error || 'Database error'}`, true);
        }
      } else {
        const res = await deletePackageCategory(deleteModalState.id);
        if (res.success) {
          triggerToast(`Category "${deleteModalState.title}" deleted.`);
          await loadData();
        } else {
          triggerToast(`Failed to delete category: ${res.error || 'Database error'}`, true);
        }
      }
      setDeleteModalState({ isOpen: false, itemType: 'package_type', id: null, title: '' });
    } catch (err) {
      console.error(err);
      triggerToast(`Delete failed: ${err.message}`, true);
    } finally {
      setDeleting(false);
    }
  };

  // ────────────────────────────────────────────────────────────────
  // FILTERING LOGIC
  // ────────────────────────────────────────────────────────────────

  const filteredPackageTypes = packageTypes.filter(pkg => {
    // Filter by category dropdown
    if (selectedCategoryFilter !== 'ALL' && pkg.category_id !== selectedCategoryFilter) {
      return false;
    }
    // Filter by search query (name or subtitle)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = pkg.name?.toLowerCase().includes(q);
      const subMatch = pkg.subtitle?.toLowerCase().includes(q);
      const catMatch = pkg.package_categories?.title?.toLowerCase().includes(q);
      if (!nameMatch && !subMatch && !catMatch) return false;
    }
    return true;
  });

  // Calculate Stat Summaries
  const totalPackageTypesCount = packageTypes.length;
  const activePackageTypesCount = packageTypes.filter(p => p.is_active).length;
  const totalCategoriesCount = categories.length;
  const avgBasePrice = packageTypes.length > 0
    ? (packageTypes.reduce((acc, curr) => acc + (parseFloat(curr.base_price) || 0), 0) / packageTypes.length).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-sm font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner & Refresh Button */}
      <div className='flex justify-between'>
        <div>
          <h2 className="text-2xl font-black text-[#0b132b] font-serif-heading tracking-tight">
            Package Listing & Pricing Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure package sizes, tiers, base rates, and distance fees for the RouteK9 Flutter app.
          </p>
        </div>



        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            title="Reload latest state from Supabase"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {activeTab === 'types' ? (
            <button
              onClick={openAddTypeModal}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Package Type</span>
            </button>
          ) : (
            <button
              onClick={openAddCategoryModal}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Category</span>
            </button>
          )}
        </div>
      </div>



      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Package Types</div>
            <div className="text-2xl font-black text-[#0b132b] mt-0.5">{totalPackageTypesCount}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Tiers</div>
            <div className="text-2xl font-black text-[#0b132b] mt-0.5">{activePackageTypesCount}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Categories</div>
            <div className="text-2xl font-black text-[#0b132b] mt-0.5">{totalCategoriesCount}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Base Price</div>
            <div className="text-2xl font-black text-[#0b132b] mt-0.5">${avgBasePrice}</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('types')}
          className={`pb-3 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === 'types'
            ? 'border-rose-600 text-rose-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
        >
          <Package className="w-4 h-4" />
          <span>Package Types & Pricing ({packageTypes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 px-6 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === 'categories'
            ? 'border-rose-600 text-rose-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
        >
          <Layers className="w-4 h-4" />
          <span>Package Categories ({categories.length})</span>
        </button>
      </div>

      {/* TAB 1: PACKAGE TYPES & PRICING */}
      {activeTab === 'types' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search package name or specs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
                <Filter className="w-4 h-4 text-slate-400" />
                <span>Filter Category:</span>
              </div>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full md:w-56 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all"
              >
                <option value="ALL">All Categories ({packageTypes.length})</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Package Types Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
                <p className="text-xs font-medium">Loading package types...</p>
              </div>
            ) : filteredPackageTypes.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Package className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No package types found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No matching package tiers found for the current search or category filter. Try clearing filters or create a new package type.
                </p>
                <button
                  onClick={openAddTypeModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Package Type</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      <th className="py-3.5 px-4">Icon</th>
                      <th className="py-3.5 px-4">Package Name</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Subtitle</th>
                      <th className="py-3.5 px-4">Description</th>
                      <th className="py-3.5 px-4">Max Weight</th>
                      <th className="py-3.5 px-4">Max Dimensions</th>
                      <th className="py-3.5 px-4">Base Price ($)</th>
                      <th className="py-3.5 px-4">Per-Mile Price ($/mi)</th>
                      <th className="py-3.5 px-4 text-center">Active Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    {filteredPackageTypes.map((pkg) => {
                      const categoryTitle = pkg.package_categories?.title ||
                        categories.find(c => c.id === pkg.category_id)?.title || 'Uncategorized';

                      return (
                        <tr key={pkg.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Icon Key */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                                {renderPackageIcon(pkg.icon_name, "w-4 h-4 text-slate-700")}
                              </div>
                              <span className="font-mono text-[11px] text-slate-500">{pkg.icon_name}</span>
                            </div>
                          </td>

                          {/* Package Name */}
                          <td className="py-4 px-4 whitespace-nowrap font-extrabold text-slate-900 text-sm">
                            {pkg.name}
                          </td>

                          {/* Category Tag */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                              {categoryTitle}
                            </span>
                          </td>

                          {/* Subtitle */}
                          <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-medium">
                            {pkg.subtitle || '—'}
                          </td>

                          {/* Description */}
                          <td className="py-4 px-4 text-slate-500 max-w-xs truncate" title={pkg.description}>
                            {pkg.description || '—'}
                          </td>

                          {/* Max Weight */}
                          <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900">
                            {pkg.max_weight_lbs ? `${pkg.max_weight_lbs} lbs` : '—'}
                          </td>

                          {/* Max Dimensions */}
                          <td className="py-4 px-4 whitespace-nowrap font-mono text-slate-700 text-xs">
                            {pkg.max_dimensions_cm || '—'}
                          </td>

                          {/* Base Price ($) */}
                          <td className="py-4 px-4 whitespace-nowrap font-extrabold text-emerald-600">
                            ${parseFloat(pkg.base_price || 0).toFixed(2)}
                          </td>

                          {/* Per-Mile Price ($/mi) */}
                          <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-800">
                            ${parseFloat(pkg.per_mile_price || 0).toFixed(2)}/mi
                          </td>

                          {/* Active Status Toggle */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleToggleTypeActive(pkg)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${pkg.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                              title={pkg.is_active ? "Click to deactivate package tier" : "Click to activate package tier"}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${pkg.is_active ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditTypeModal(pkg)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all cursor-pointer"
                                title="Edit Package Type & Pricing"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => openDeleteModal('package_type', pkg.id, pkg.name)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all cursor-pointer"
                                title="Delete Package Type"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PACKAGE CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
                <p className="text-xs font-medium">Loading package categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Layers className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No package categories found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Create package categories (e.g., Documents, Parcels, Freight) to group package sizes in the mobile app.
                </p>
                <button
                  onClick={openAddCategoryModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      <th className="py-3.5 px-4">Icon</th>
                      <th className="py-3.5 px-4">Category Title</th>
                      <th className="py-3.5 px-4">Description</th>
                      <th className="py-3.5 px-4 text-center">Active Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Icon */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                              {renderPackageIcon(cat.icon_name, "w-4 h-4 text-rose-600")}
                            </div>
                            <span className="font-mono text-[11px] text-slate-500">{cat.icon_name}</span>
                          </div>
                        </td>

                        {/* Title */}
                        <td className="py-4 px-4 whitespace-nowrap font-extrabold text-slate-900 text-sm">
                          {cat.title}
                        </td>

                        {/* Description */}
                        <td className="py-4 px-4 text-slate-500 max-w-md">
                          {cat.description || '—'}
                        </td>

                        {/* Active Toggle */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleToggleCategoryActive(cat)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${cat.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            title={cat.is_active ? "Click to deactivate category" : "Click to activate category"}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${cat.is_active ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditCategoryModal(cat)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => openDeleteModal('category', cat.id, cat.title)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: ADD / EDIT PACKAGE TYPE MODAL */}
      {/* ──────────────────────────────────────────────────────────────── */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingType ? 'Edit Package Type & Pricing' : 'Add New Package Type'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure tier limits and pricing calculation rates</p>
                </div>
              </div>
              <button
                onClick={() => setShowTypeModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackageType} className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category <span className="text-rose-600">*</span>
                </label>
                <select
                  value={typeForm.category_id}
                  onChange={(e) => setTypeForm({ ...typeForm, category_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                >
                  <option value="" disabled>-- Select Package Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title} {!cat.is_active ? '(Inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Package Name & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Package Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Medium Box"
                    value={typeForm.name}
                    onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Up to 30 lbs"
                    value={typeForm.subtitle}
                    onChange={(e) => setTypeForm({ ...typeForm, subtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fits medium household appliances, retail goods, and boxed items."
                  value={typeForm.description}
                  onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              {/* Base Shipping Fee ($) & Per-Mile Rate ($/mi) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Base Shipping Fee ($) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="14.00"
                      value={typeForm.base_price}
                      onChange={(e) => setTypeForm({ ...typeForm, base_price: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Per-Mile Rate ($/mi) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="1.80"
                      value={typeForm.per_mile_price}
                      onChange={(e) => setTypeForm({ ...typeForm, per_mile_price: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                    />
                  </div>
                </div>
              </div>

              {/* Weight Limit (lbs) & Dimensions (cm) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Weight Limit (lbs)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="30.0"
                    value={typeForm.max_weight_lbs}
                    onChange={(e) => setTypeForm({ ...typeForm, max_weight_lbs: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Dimensions (cm)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50x50x50 cm"
                    value={typeForm.max_dimensions_cm}
                    onChange={(e) => setTypeForm({ ...typeForm, max_dimensions_cm: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>
              </div>

              {/* Icon Picker & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Icon Key
                  </label>
                  <select
                    value={typeForm.icon_name}
                    onChange={(e) => setTypeForm({ ...typeForm, icon_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>


              </div>




              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingType}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submittingType ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingType ? 'Update Package Type' : 'Create Package Type'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: ADD / EDIT PACKAGE CATEGORY MODAL */}
      {/* ──────────────────────────────────────────────────────────────── */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingCategory ? 'Edit Package Category' : 'Add New Category'}
                  </h3>
                  <p className="text-xs text-slate-500">Group related package tiers for mobile UI rendering</p>
                </div>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              {/* Category Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Documents & Letters"
                  value={categoryForm.title}
                  onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              {/* Category Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Envelopes, certificates, legal papers, and flat items."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              </div>

              {/* Icon Picker & Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Icon Key
                  </label>
                  <select
                    value={categoryForm.icon_name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={categoryForm.display_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, display_order: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-900">Active Status</div>
                  <div className="text-[11px] text-slate-500">Enable or disable category in mobile app</div>
                </div>

                <button
                  type="button"
                  onClick={() => setCategoryForm({ ...categoryForm, is_active: !categoryForm.is_active })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${categoryForm.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${categoryForm.is_active ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submittingCategory ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: DELETE CONFIRMATION DIALOG */}
      {/* ──────────────────────────────────────────────────────────────── */}
      {deleteModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Delete {deleteModalState.itemType === 'package_type' ? 'Package Type' : 'Category'}?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteModalState.title}"</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModalState({ isOpen: false, itemType: 'package_type', id: null, title: '' })}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
