import React, { useState, useEffect } from 'react';
import {
  Truck,
  Building2,
  BookOpen,
  DollarSign,
  Loader2,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  Eye,
  ArrowRight,
  Phone,
  Package
} from 'lucide-react';
import { getCourses } from '../../lib/courses';
import { supabase } from '../../lib/supabase';
import {
  StatCard,
  StatCardSkeleton,
  TableSkeleton,
  CourseCard,
  formatPhoneNumber
} from './components/AdminComponents';

export default function AdminDashboard({ drivers = [], companies = [], allUsers = [], driversCount = 0, companiesCount = 0, customersCount = 0, loading, error, onNavigate }) {
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Counts
  const [driverCount, setDriverCount] = useState(driversCount || drivers.length || 0);
  const [companyCount, setCompanyCount] = useState(companiesCount || companies.length || 0);
  const [customerCount, setCustomerCount] = useState(customersCount || 0);

  // Top 5 lists initialized from incoming props
  const [recentDrivers, setRecentDrivers] = useState(() => (drivers && drivers.length > 0 ? drivers.slice(0, 5) : []));
  const [recentCompanies, setRecentCompanies] = useState(() => (companies && companies.length > 0 ? companies.slice(0, 5) : []));
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [loadingStats, setLoadingStats] = useState(() => !(drivers && drivers.length > 0));

  // Sync with incoming props if they arrive later
  useEffect(() => {
    if (driversCount && !driverCount) setDriverCount(driversCount);
    if (companiesCount && !companyCount) setCompanyCount(companiesCount);
    if (customersCount && !customerCount) setCustomerCount(customersCount);
    if (drivers && drivers.length > 0 && recentDrivers.length === 0) {
      setRecentDrivers(drivers.slice(0, 5));
    }
    if (companies && companies.length > 0 && recentCompanies.length === 0) {
      setRecentCompanies(companies.slice(0, 5));
    }
  }, [drivers, companies, driversCount, companiesCount, customersCount]);

  useEffect(() => {
    let isMounted = true;

    async function loadAllDashboardData() {
      try {
        setLoadingStats(recentDrivers.length === 0);

        // 1. Prepare fast 5-item parallel queries (without slow exact count table scans)
        const driversPromise = supabase
          .from('profiles')
          .select('id, email, role, full_name, city, state_code, vehicle, is_active, status, created_at, avatar_url')
          .or('role.eq.driver,role.is.null')
          .order('created_at', { ascending: false })
          .limit(5);

        const companiesPromise = supabase
          .from('profiles')
          .select('id, email, role, full_name, city, state_code, is_active, status, created_at, avatar_url')
          .eq('role', 'company')
          .order('created_at', { ascending: false })
          .limit(5);

        const companyMetaPromise = supabase
          .from('company_profiles')
          .select('user_id, company_name, contact_email, city, state')
          .limit(5);

        const customersPromise = supabase
          .from('customer_profiles')
          .select('id, full_name, email, phone, created_at, avatar_url', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(5);

        const revenuePromise = supabase
          .from('transactions')
          .select('amount, status');

        const coursesPromise = getCourses();

        // 2. Execute ALL requests simultaneously in parallel
        const [dRes, cRes, cmRes, custRes, revRes, coursesRes] = await Promise.allSettled([
          driversPromise,
          companiesPromise,
          companyMetaPromise,
          customersPromise,
          revenuePromise,
          coursesPromise
        ]);

        if (!isMounted) return;

        // ── Process Drivers ──
        if (dRes.status === 'fulfilled' && dRes.value?.data && dRes.value.data.length > 0) {
          setRecentDrivers(dRes.value.data);
        }

        // ── Process Companies & Enriched Metadata ──
        if (cRes.status === 'fulfilled' && cRes.value?.data && cRes.value.data.length > 0) {
          const metaList = (cmRes.status === 'fulfilled' && cmRes.value?.data) ? cmRes.value.data : [];
          const metaMap = metaList.reduce((acc, curr) => {
            const key = curr.user_id || curr.id;
            if (key) acc[key] = curr;
            return acc;
          }, {});

          const enriched = cRes.value.data.map(p => {
            const meta = metaMap[p.id] || {};
            const isDeactivated = p.status === 'INACTIVE' || p.is_active === false;
            return {
              ...p,
              full_name: meta.company_name || p.full_name || p.company_name || p.email?.split('@')[0] || 'Company',
              email: meta.contact_email || p.email || '',
              city: p.city || meta.city || 'Houston',
              state_code: p.state_code || meta.state || 'TX',
              member: 'FREE',
              status: isDeactivated ? 'INACTIVE' : 'ACTIVE',
              created_at: p.created_at
            };
          });
          setRecentCompanies(enriched);
        }

        // ── Process Customers ──
        if (custRes.status === 'fulfilled') {
          const cpData = custRes.value?.data;
          const cpCount = custRes.value?.count;
          if (typeof cpCount === 'number' && cpCount > 0) {
            setCustomerCount(cpCount);
          }
          if (cpData && cpData.length > 0) {
            setRecentCustomers(cpData.map(c => ({
              ...c,
              full_name: c.full_name || c.name || (c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : null) || c.email?.split('@')[0] || 'Customer',
              email: c.email || '',
              phone: c.phone || '',
              total_deliveries: c.total_deliveries || c.total_orders || 0,
              total_saved: c.total_saved || c.total_spend || 0,
              created_at: c.created_at
            })));
          } else {
            // Fallback to customer_orders table
            try {
              const { data: ordData, count: ordCount } = await supabase
                .from('customer_orders')
                .select('id, customer_id, sender_name, sender_phone, created_at, price', { count: 'exact' })
                .order('created_at', { ascending: false })
                .limit(5);

              if (typeof ordCount === 'number' && ordCount > 0) {
                setCustomerCount(ordCount);
              }

              if (ordData && ordData.length > 0 && isMounted) {
                setRecentCustomers(ordData.map(o => ({
                  id: o.id,
                  full_name: o.sender_name || 'Customer',
                  email: '—',
                  phone: o.sender_phone || '',
                  total_deliveries: 1,
                  total_saved: Number(o.price || 0),
                  created_at: o.created_at
                })));
              }
            } catch (e) {
              console.warn("Customer orders fallback notice:", e);
            }
          }
        }

        // ── Process Revenue ──
        if (revRes.status === 'fulfilled' && Array.isArray(revRes.value?.data)) {
          const succeededTx = revRes.value.data.filter(tx => (tx.status || 'Succeeded').toLowerCase() === 'succeeded');
          const sum = succeededTx.reduce((acc, tx) => {
            const amtStr = String(tx.amount || '0');
            const num = parseFloat(amtStr.replace(/[^0-9.]/g, ''));
            return acc + (isNaN(num) ? 0 : num);
          }, 0);
          setTotalRevenue(sum);
        }

        // ── Process Courses ──
        if (coursesRes.status === 'fulfilled') {
          setCourses(coursesRes.value || []);
        }

      } catch (err) {
        console.warn("Dashboard data load notice:", err);
      } finally {
        if (isMounted) {
          setLoadingCourses(false);
          setLoadingStats(false);
        }
      }
    }

    loadAllDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalDrivers = driverCount || driversCount || drivers.length || 0;
  const totalCompanies = companyCount || companiesCount || companies.length || 0;
  const totalCustomers = customerCount || 0;
  const totalCourses = courses.length;
  const displayedCourses = courses.slice(0, 3);
  const isOverallLoading = (loading && !driverCount) || loadingStats;

  function getInitials(name, email) {
    if (name && typeof name === 'string' && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (email && typeof email === 'string' && email.includes('@')) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Key Performance Indicators (KPI Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isOverallLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total Drivers"
              value={totalDrivers}
              subtext="Registered contract couriers"
              icon={Truck}
              color="blue"
              onClick={() => onNavigate && onNavigate('drivers')}
            />
            <StatCard
              label="Total Customers"
              value={totalCustomers}
              subtext="Mobile app customer accounts"
              icon={Users}
              color="purple"
              badge="APP"
              onClick={() => onNavigate && onNavigate('customers')}
            />
            <StatCard
              label="Total Companies"
              value={totalCompanies}
              subtext="Hiring logistics partners"
              icon={Building2}
              color="emerald"
              onClick={() => onNavigate && onNavigate('companies')}
            />
            <StatCard
              label="Total Revenue"
              value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`}
              subtext="Course & subscription sales"
              icon={DollarSign}
              color="rose"
              onClick={() => onNavigate && onNavigate('revenue')}
            />
          </>
        )}
      </div>

      {/* Main Grid: 3 Recent Tables (Drivers, Companies, Customers) */}
      <div className="space-y-8">

        {/* ── 1. RECENT DRIVERS (TOP 5) ── */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-rose-600" />
                <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Recent Drivers</h3>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Top 5 newest contract couriers registered on RouteK9</p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('drivers')}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View All Drivers ({totalDrivers})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {isOverallLoading ? (
              <TableSkeleton rows={3} />
            ) : recentDrivers.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 font-medium">No drivers registered yet.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Driver Name</th>
                    <th className="px-6 py-4">Vehicle Type</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Date Joined</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {recentDrivers.map((driver) => {
                    const initials = getInitials(driver.full_name, driver.email);
                    const isActive = driver.is_active !== false && String(driver.status || '').toUpperCase() !== 'INACTIVE';
                    return (
                      <tr key={driver.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {driver.avatar_url ? (
                              <img src={driver.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 block truncate max-w-[170px]" title={driver.full_name || 'Driver'}>
                                {driver.full_name || 'Driver'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium block truncate max-w-[170px]" title={driver.email}>
                                {driver.email || '—'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                            <Truck className="w-3 h-3 text-rose-500" />
                            <span>{driver.vehicle || 'Cargo Van'}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-semibold">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{driver.city || '—'}{driver.state_code ? `, ${driver.state_code}` : ''}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-semibold">
                          {formatDisplayDate(driver.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => onNavigate && onNavigate('drivers')}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── 2. RECENT COMPANIES (TOP 5) ── */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Recent Companies</h3>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Top 5 newest corporate partners & logistics dispatchers</p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('companies')}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View All Companies ({totalCompanies})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {isOverallLoading ? (
              <TableSkeleton rows={3} />
            ) : recentCompanies.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 font-medium">No companies registered yet.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Company Name</th>
                    <th className="px-6 py-4">Member Tier</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Date Joined</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {recentCompanies.map((comp) => {
                    const initials = getInitials(comp.full_name || comp.name, comp.email);
                    const isActive = comp.is_active !== false && String(comp.status || '').toUpperCase() !== 'INACTIVE';
                    return (
                      <tr key={comp.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {comp.avatar_url ? (
                              <img src={comp.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                                {initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 block truncate max-w-[180px]" title={comp.full_name || comp.name || 'Company'}>
                                {comp.full_name || comp.name || 'Company'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium block truncate max-w-[180px]" title={comp.email}>
                                {comp.email || '—'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {comp.member || 'FREE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-semibold">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{comp.city || '—'}{comp.state_code ? `, ${comp.state_code}` : ''}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-semibold">
                          {formatDisplayDate(comp.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => onNavigate && onNavigate('companies')}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── 3. RECENT CUSTOMERS (TOP 5) ── */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Recent Customers</h3>
                <span className="px-2 py-0.5 text-[9px] font-black bg-rose-50 text-rose-600 border border-rose-200 rounded-md">APP</span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Top 5 newest mobile app customer registrations</p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('customers')}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View All Customers ({totalCustomers})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {isOverallLoading ? (
              <TableSkeleton rows={3} />
            ) : recentCustomers.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 font-medium">No customers registered yet.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Deliveries</th>
                    <th className="px-6 py-4">Total Spend</th>
                    <th className="px-6 py-4">Date Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {recentCustomers.map((cust) => {
                    const initials = getInitials(cust.full_name, cust.email);
                    return (
                      <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {cust.avatar_url ? (
                              <img src={cust.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                {initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 block truncate max-w-[180px]" title={cust.full_name || 'Customer'}>
                                {cust.full_name || 'Customer'}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium block truncate max-w-[180px]" title={cust.email}>
                                {cust.email || '—'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-semibold">
                          {formatPhoneNumber(cust.phone)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                            {cust.total_deliveries || 0} Orders
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-extrabold text-emerald-600">
                          ${(cust.total_saved || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-semibold">
                          {formatDisplayDate(cust.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => onNavigate && onNavigate('customers')}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── 4. AVAILABLE COURSES SECTION ── */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden space-y-4 p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-extrabold text-[#0b132b] font-serif-heading">Available Platform Courses</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Training courses and certifications available for contract drivers</p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('courses')}
              className="text-xs font-extrabold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Manage Courses ({totalCourses})</span>
              <span>→</span>
            </button>
          </div>

          {loadingCourses ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
              <div className="h-36 bg-slate-100 rounded-2xl" />
              <div className="h-36 bg-slate-100 rounded-2xl" />
              <div className="h-36 bg-slate-100 rounded-2xl" />
            </div>
          ) : displayedCourses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              No active courses found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedCourses.map(course => (
                <CourseCard key={course.id} course={course} detailed />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
