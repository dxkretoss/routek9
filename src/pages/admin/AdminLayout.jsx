import React, { useState, useEffect } from 'react';
import adminLoginLogo from '../../assets/adminloginlogo.png';
import footerLogo from '../../assets/footerlogo.png';
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
  Activity,
  HelpCircle,
  Package,
  ShieldCheck,
  Users,
  Car,
  HeartPulse,
  Calendar,
  PackageCheck,
  FileText,
  LifeBuoy
} from 'lucide-react';

import AdminLoginPage from './AdminLoginPage';
import AdminDashboard from './AdminDashboard';
import AdminDriverList from './AdminDriverList';
import AdminCustomerList from './AdminCustomerList';
import AdminCompanyList from './AdminCompanyList';
import AdminCourses from './AdminCourses';
import AdminExamQuestions from './AdminExamQuestions';
import AdminDispatchOrders from './AdminDispatchOrders';
import AdminRevenue from './AdminRevenue';
import AdminSettings from './AdminSettings';
import AdminGovContracts from './AdminGovContracts';
import AdminVehicles from './AdminVehicles';
import AdminCprNotary from './AdminCprNotary';
import AdminCprNotaryBookings from './AdminCprNotaryBookings';
import AdminPackages from './AdminPackages';
import AdminLegalPages from './AdminLegalPages';
import AdminSupportTickets from './AdminSupportTickets';

// ─── SIDEBAR NAV CONFIG ─────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'drivers', label: 'Driver List', icon: Truck },
  { key: 'customers', label: 'Customer List', icon: Users },
  { key: 'companies', label: 'Company List', icon: Building2 },
  { key: 'packages', label: 'Package & Pricing', icon: PackageCheck },
  { key: 'gov_contracts', label: 'Gov Contracts', icon: ShieldCheck },
  { key: 'dispatch_orders', label: 'Dispatch Orders', icon: Package },
  { key: 'vehicles', label: 'Vehicle Management', icon: Car },
  { key: 'cpr_notary', label: 'CPR & Notary Services', icon: HeartPulse },
  { key: 'cpr_notary_bookings', label: 'CPR & Notary Bookings', icon: Calendar },
  { key: 'courses', label: 'Courses', icon: BookOpen },
  { key: 'exam_questions', label: 'Exam Questions', icon: HelpCircle },
  { key: 'legal_pages', label: 'Legal Pages', icon: FileText },
  { key: 'support_tickets', label: 'Support Tickets', icon: LifeBuoy },
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const ADMIN_SESSION_KEY = 'routek9_admin_auth';
const ADMIN_TOKEN_KEY = 'routek9_admin_token';
const ADMIN_EXP_KEY = 'routek9_admin_exp';

function validateAdminToken() {
  const isAuth = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  const exp = sessionStorage.getItem(ADMIN_EXP_KEY);

  if (!isAuth || !token || !exp) return false;
  if (!token.startsWith('rk9_adm_tok_')) return false;
  if (Date.now() > parseInt(exp, 10)) {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_EXP_KEY);
    return false;
  }
  return true;
}

// ─── MAIN ADMIN LAYOUT ────────────────────────────────────────
export default function AdminLayout({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Admin Auth & Token Validation State ─────────
  const [isAdminAuth, setIsAdminAuth] = useState(() => validateAdminToken());

  // Periodically validate token expiration
  useEffect(() => {
    const interval = setInterval(() => {
      if (!validateAdminToken()) {
        setIsAdminAuth(false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Section/Sidebar State ────
  const getInitialSection = () => searchParams.get('section') || 'dashboard';
  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Data State ───────────────
  const [drivers, setDrivers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [driversCount, setDriversCount] = useState(0);
  const [companiesCount, setCompaniesCount] = useState(0);
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
    if (!validateAdminToken()) {
      setIsAdminAuth(false);
      return;
    }
    setActiveSection(key);
    setSearchParams({ section: key }, { replace: true });
    setMobileSidebarOpen(false);
  };

  // ── Admin Login Handler ──────
  const handleAdminLogin = () => {
    const token = 'rk9_adm_tok_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    const exp = String(Date.now() + 8 * 3600 * 1000);
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    sessionStorage.setItem(ADMIN_EXP_KEY, exp);
    setIsAdminAuth(true);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_EXP_KEY);
    setIsAdminAuth(false);
    if (onLogout) {
      onLogout();
    }
    navigate('/admin', { replace: true });
  };

  // ── Fetch dynamic data from Supabase ─
  const fetchSupabaseData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch lightweight profile metadata for total counts
      let driverCount = 295;
      let companyCount = 64;
      try {
        const { data: roleCounts, error: cErr } = await supabase
          .from('profiles')
          .select('id, role');
        if (!cErr && roleCounts && Array.isArray(roleCounts)) {
          const driversList = roleCounts.filter(u => {
            const r = String(u.role || '').toLowerCase();
            return r === 'driver' || !r || r === 'user';
          });
          const companiesList = roleCounts.filter(u => String(u.role || '').toLowerCase() === 'company');
          driverCount = driversList.length;
          companyCount = companiesList.length;
        }
      } catch (cErr) {
        console.warn("AdminLayout count notice:", cErr);
      }

      setDriversCount(driverCount);
      setCompaniesCount(companyCount);
    } catch (err) {
      console.error('Admin: Error fetching data:', err);
      setError(err.message || 'Failed to fetch data from Supabase.');
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
  const SidebarContent = ({ isMobile = false } = {}) => {
    const collapsed = sidebarCollapsed && !isMobile;
    return (
      <div className="flex flex-col h-full">
        {/* Brand */}
        <div className={`p-5 border-b border-white/10 ${collapsed ? 'flex justify-center px-2' : ''}`}>
          <Link to="/admin?section=dashboard" className="flex items-center gap-3">
            {collapsed ? (
              <img src={adminLoginLogo} className='h-8 w-auto object-contain' />
            ) : (
              <img src={footerLogo} className='h-11 w-auto object-contain' />
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${isActive
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-rose-400'}`} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Admin User Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {!collapsed && (
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
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-rose-600/10 hover:text-rose-400 transition-all cursor-pointer ${collapsed ? 'justify-center' : ''}`}
            title="Admin Logout"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Admin Logout</span>}
          </button>
        </div>
      </div>
    );
  };

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
        return <AdminDriverList users={getFilteredItems(drivers)} driversCount={driversCount} {...listProps} />;
      case 'customers':
        return <AdminCustomerList searchQuery={searchQuery} setSearchQuery={setSearchQuery} onRefresh={fetchSupabaseData} />;
      case 'companies':
        return <AdminCompanyList users={getFilteredItems(companies)} {...listProps} />;
      case 'packages':
        return <AdminPackages />;
      case 'gov_contracts':
        return <AdminGovContracts />;
      case 'courses':
        return <AdminCourses />;
      case 'exam_questions':
        return <AdminExamQuestions />;
      case 'dispatch_orders':
        return <AdminDispatchOrders />;
      case 'vehicles':
        return <AdminVehicles />;
      case 'cpr_notary':
        return <AdminCprNotary />;
      case 'cpr_notary_bookings':
        return <AdminCprNotaryBookings />;
      case 'legal_pages':
        return <AdminLegalPages />;
      case 'support_tickets':
        return <AdminSupportTickets />;
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
            <SidebarContent isMobile={true} />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0b132b] border-r border-white/5 transition-all duration-300 shrink-0 sticky top-0 h-screen ${sidebarCollapsed ? 'w-[72px]' : 'w-64'
          }`}
      >
        <SidebarContent isMobile={false} />
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
