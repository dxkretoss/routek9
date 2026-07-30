import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  LayoutDashboard,
  Truck,
  Building2,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  UserCircle,
  DollarSign,
  Activity
} from 'lucide-react';

import AdminLoginPage from './AdminLoginPage';
import AdminDashboard from './AdminDashboard';
import AdminDriverList from './AdminDriverList';
import AdminCompanyList from './AdminCompanyList';
import AdminCourses from './AdminCourses';
import AdminRevenue from './AdminRevenue';
import AdminSettings from './AdminSettings';

// ─── SIDEBAR NAV CONFIG ─────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'drivers', label: 'Driver List', icon: Truck },
  { key: 'companies', label: 'Company List', icon: Building2 },
  { key: 'courses', label: 'Courses', icon: BookOpen },
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const ADMIN_SESSION_KEY = 'routek9_admin_auth';

// ─── MAIN ADMIN LAYOUT ────────────────────────────────────────
export default function AdminLayout({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Admin Auth State ─────────
  const [isAdminAuth, setIsAdminAuth] = useState(() => {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  });

  // ── Section/Sidebar State ────
  const getInitialSection = () => searchParams.get('section') || 'dashboard';
  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Data State ───────────────
  const [drivers, setDrivers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // ── Sync URL params to state ──
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && SIDEBAR_ITEMS.some(s => s.key === section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const handleSectionChange = (key) => {
    setActiveSection(key);
    setSearchParams({ section: key }, { replace: true });
    setMobileSidebarOpen(false);
  };

  // ── Admin Login Handler ──────
  const handleAdminLogin = () => {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    setIsAdminAuth(true);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdminAuth(false);
  };

  // ── Fetch dynamic data from Supabase ─
  const fetchSupabaseData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch profiles table
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .order(sortField, { ascending: sortDir === 'asc' });

      if (profilesErr) throw profilesErr;

      // 2. Fetch driver_profiles table
      const { data: driverProfilesData } = await supabase
        .from('driver_profiles')
        .select('*');

      // 3. Fetch company_profiles table
      const { data: companyProfilesData } = await supabase
        .from('company_profiles')
        .select('*');

      const rawProfiles = profilesData || [];
      const rawDriverProfiles = driverProfilesData || [];
      const rawCompanyProfiles = companyProfilesData || [];

      // Helper to check if a user is an admin
      const isAdminUser = (u) => {
        return u.role === 'admin' || (u.email && u.email.toLowerCase() === 'routek9@admin.com');
      };

      // Combine drivers from profiles + driver_profiles (exclude admins)
      const driversCombined = [
        ...rawProfiles.filter(u => !isAdminUser(u) && (u.role === 'driver' || !u.role || u.role === 'user')),
        ...rawDriverProfiles.map(d => ({
          id: d.id || d.user_id || `dp-${Math.random()}`,
          full_name: d.full_name || d.name || d.driver_name || 'Driver',
          email: d.email || '—',
          city: d.city || '—',
          state_code: d.state_code || d.state || '—',
          vehicle: d.vehicle || d.vehicle_type || 'Cargo Van',
          role: 'driver',
          created_at: d.created_at || new Date().toISOString()
        }))
      ];

      // Deduplicate drivers by ID or email (excluding admins)
      const uniqueDrivers = Array.from(
        new Map(driversCombined.filter(d => !isAdminUser(d)).map(item => [item.email || item.id, item])).values()
      );

      // Combine companies from profiles + company_profiles (exclude admins)
      const companiesCombined = [
        ...rawProfiles.filter(u => !isAdminUser(u) && u.role === 'company'),
        ...rawCompanyProfiles.map(c => ({
          id: c.id || c.user_id || `cp-${Math.random()}`,
          full_name: c.company_name || c.full_name || c.name || 'Company',
          email: c.email || '—',
          city: c.city || '—',
          state_code: c.state_code || c.state || '—',
          vehicle: c.fleet_type || 'Company Fleet',
          role: 'company',
          created_at: c.created_at || new Date().toISOString()
        }))
      ];

      const uniqueCompanies = Array.from(
        new Map(companiesCombined.filter(c => !isAdminUser(c)).map(item => [item.email || item.id, item])).values()
      );

      setAllUsers(rawProfiles);
      setDrivers(uniqueDrivers);
      setCompanies(uniqueCompanies);
    } catch (err) {
      console.error('Admin: Error fetching data:', err);
      setError(err.message || 'Failed to fetch data from Supabase. Check RLS policies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminAuth) {
      fetchSupabaseData();
    }
  }, [isAdminAuth, sortField, sortDir]);

  // ── Search Filtering ─────────
  const getFilteredItems = (items) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.trim().toLowerCase();
    return items.filter(u =>
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.city || '').toLowerCase().includes(q) ||
      (u.state_code || '').toLowerCase().includes(q)
    );
  };

  // ─── Show Login if NOT Authenticated ────────────────────────
  if (!isAdminAuth) {
    return <AdminLoginPage onAdminLogin={handleAdminLogin} />;
  }

  // ─── Sidebar Content ──────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-600/20 border-2 border-rose-600 flex flex-col items-center justify-center text-white shadow-xs shrink-0">
            <span className="text-[6px] font-bold uppercase tracking-tighter text-slate-300">ROUTE</span>
            <span className="text-[10px] font-extrabold tracking-tight text-rose-500 leading-none">K9</span>
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <div className="text-sm font-extrabold text-white tracking-tight">ROUTE K9</div>
              <div className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Admin Panel</div>
            </div>
          )}
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleSectionChange(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-rose-400'}`} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Admin User Footer */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-rose-600/20 border border-rose-600/50 flex items-center justify-center shrink-0">
              <UserCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{currentUser?.name || 'Admin'}</div>
              <div className="text-[10px] text-slate-500 truncate">{currentUser?.email || ''}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleAdminLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-rose-600/10 hover:text-rose-400 transition-all cursor-pointer ${sidebarCollapsed ? 'justify-center' : ''}`}
          title="Admin Logout"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!sidebarCollapsed && <span>Admin Logout</span>}
        </button>
      </div>
    </div>
  );

  // ─── Shared data props for list pages ───────────────────────
  const listProps = {
    loading,
    error,
    searchQuery,
    setSearchQuery,
    onRefresh: fetchSupabaseData,
    sortField,
    setSortField,
    sortDir,
    setSortDir,
  };

  // ─── Render Active Section ─────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <AdminDashboard
            drivers={drivers}
            companies={companies}
            allUsers={allUsers}
            loading={loading}
            error={error}
            onNavigate={handleSectionChange}
          />
        );
      case 'drivers':
        return <AdminDriverList users={getFilteredItems(drivers)} {...listProps} />;
      case 'companies':
        return <AdminCompanyList users={getFilteredItems(companies)} {...listProps} />;
      case 'courses':
        return <AdminCourses />;
      case 'revenue':
        return <AdminRevenue />;
      case 'settings':
        return <AdminSettings currentUser={currentUser} totalUsers={drivers.length + companies.length} usersError={error} onRefresh={fetchSupabaseData} />;
      default:
        return (
          <AdminDashboard
            drivers={drivers}
            companies={companies}
            allUsers={allUsers}
            loading={loading}
            error={error}
            onNavigate={handleSectionChange}
          />
        );
    }
  };

  // ─── Main Layout Render ────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-[#FAF9F6] font-sans antialiased selection:bg-rose-600 selection:text-white">

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0b132b] shadow-2xl z-10 flex flex-col">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer z-20"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0b132b] border-r border-white/5 transition-all duration-300 shrink-0 sticky top-0 h-screen ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <SidebarContent />
        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#0b132b] border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-rose-600 transition-all cursor-pointer shadow-md z-10"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-extrabold text-[#0b132b] tracking-tight font-serif-heading capitalize">
                  {SIDEBAR_ITEMS.find(s => s.key === activeSection)?.label || 'Dashboard'}
                </h1>
                <p className="text-[10px] text-slate-400 font-medium">RouteK9 Administration Console</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/" className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors">
                ← Back to Site
              </Link>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Admin Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
