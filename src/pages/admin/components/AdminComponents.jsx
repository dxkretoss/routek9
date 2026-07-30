import React from 'react';
import {
  Users,
  Truck,
  Building2,
  BookOpen,
  MapPin,
  TrendingUp,
  Loader2,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Calendar,
  CreditCard,
  ArrowUpRight
} from 'lucide-react';

// ─── Stat Card ──────────────────────────────────────────────────
export function StatCard({ label, value, subtext, icon: Icon, color = 'rose', onClick }) {
  const iconBgMap = {
    rose: 'bg-rose-100 text-rose-600',
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 text-left transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer group relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-11 h-11 rounded-2xl ${iconBgMap[color]} flex items-center justify-center shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
          <ArrowUpRight className="w-3 h-3" />
          <span>+14%</span>
        </div>
      </div>
      <div className="text-3xl font-extrabold text-[#0b132b] tracking-tight">{value}</div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">{label}</div>
      {subtext && (
        <div className="text-[10px] font-medium text-slate-400 mt-1">{subtext}</div>
      )}
    </button>
  );
}

// ─── Role Badge ─────────────────────────────────────────────────
export function RoleBadge({ role }) {
  if (role === 'driver') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider">
        <Truck className="w-3 h-3" />
        Driver
      </span>
    );
  }
  if (role === 'company') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wider">
        <Building2 className="w-3 h-3" />
        Company
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider">
      <Users className="w-3 h-3" />
      {role || 'User'}
    </span>
  );
}

// ─── User Table ─────────────────────────────────────────────────
export function UserTable({ users, compact = false }) {
  return (
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50/50">
          <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">User</th>
          <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
          {!compact && <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider hidden md:table-cell">Location</th>}
          {!compact && <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Vehicle</th>}
          <th className="px-6 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider hidden md:table-cell">Joined</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {users.map((user) => (
          <tr key={user.id} className="hover:bg-rose-50/30 transition-colors">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  <span className="text-xs font-extrabold text-slate-600">
                    {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#0b132b] truncate">{user.full_name || 'No Name'}</div>
                  <div className="text-[10px] text-slate-400 font-medium truncate">{user.email || '—'}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 hidden sm:table-cell">
              <RoleBadge role={user.role} />
            </td>
            {!compact && (
              <td className="px-6 py-4 hidden md:table-cell">
                <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{user.city || '—'}{user.state_code ? `, ${user.state_code}` : ''}</span>
                </div>
              </td>
            )}
            {!compact && (
              <td className="px-6 py-4 hidden lg:table-cell">
                <span className="text-xs text-slate-600 font-medium">{user.vehicle || '—'}</span>
              </td>
            )}
            <td className="px-6 py-4 hidden md:table-cell">
              <span className="text-[10px] text-slate-400 font-medium">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Course Card ────────────────────────────────────────────────
export function CourseCard({ course, detailed = false }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md hover:shadow-lg transition-all p-5 space-y-3 group">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-rose-600" />
        </div>
        <span className="text-lg font-extrabold text-rose-600">${course.price}</span>
      </div>

      <div>
        <h4 className="text-sm font-extrabold text-[#0b132b] group-hover:text-rose-600 transition-colors">
          {course.title}
        </h4>
        <p className="text-[10px] text-slate-500 font-medium mt-1 line-clamp-2">
          {course.subtitle || course.description}
        </p>
      </div>

      {detailed && (
        <>
          <div className="text-[10px] text-slate-400 font-medium">
            {course.access}
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-extrabold uppercase">
              {course.projectedPay}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Admin Activity Log Feed ────────────────────────────────────
export function AdminActivityFeed({ logs = [] }) {
  const defaultLogs = logs.length ? logs : [
    { id: 1, action: "Admin Session Login", detail: "Admin routek9@admin.com logged in successfully", time: "Just now", icon: Activity, type: "system" },
    { id: 2, action: "Payment Verified", detail: "PRO Membership ($29/mo) processed via Stripe", time: "12 mins ago", icon: CreditCard, type: "payment" },
    { id: 3, action: "Driver Approved", detail: "Verified HIPAA & Bloodborne Pathogen cert for John D.", time: "45 mins ago", icon: CheckCircle2, type: "user" },
    { id: 4, action: "Course Price Audit", detail: "Master Contractor Training confirmed at $49.00 USD", time: "2 hours ago", icon: BookOpen, type: "course" },
    { id: 5, action: "Security Check", detail: "Platform RLS & SSL Certificates status verified Active", time: "4 hours ago", icon: ShieldCheck, type: "security" },
  ];

  return (
    <div className="space-y-3">
      {defaultLogs.map((log) => {
        const Icon = log.icon || Activity;
        return (
          <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3 hover:bg-white hover:border-slate-200 transition-all">
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0b132b] truncate">{log.action}</span>
                <span className="text-[10px] text-slate-400 font-medium">{log.time}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{log.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Revenue Transactions Table ─────────────────────────────────
export function RecentTransactionsTable() {
  const transactions = [
    { id: "tx_101", user: "John (driver@routek9.com)", item: "Master Contractor Training", amount: "$49.00", date: "Jul 30, 2026", status: "Paid" },
    { id: "tx_102", user: "Route Partner (partner@routek9.com)", item: "PRO Membership (Monthly)", amount: "$29.00", date: "Jul 30, 2026", status: "Paid" },
    { id: "tx_103", user: "Dakshn (dakshn@gmail.com)", item: "HIPAA Certification Exam", amount: "$25.00", date: "Jul 29, 2026", status: "Paid" },
    { id: "tx_104", user: "Test Driver (test@gmail.com)", item: "PRO Membership (Monthly)", amount: "$29.00", date: "Jul 29, 2026", status: "Paid" },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="px-6 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Transaction ID</th>
            <th className="px-6 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Item Purchased</th>
            <th className="px-6 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-xs font-semibold">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-rose-50/20 transition-colors">
              <td className="px-6 py-3.5 font-mono text-slate-500 text-[11px]">{tx.id}</td>
              <td className="px-6 py-3.5 font-bold text-slate-800">{tx.user}</td>
              <td className="px-6 py-3.5 text-slate-600">{tx.item}</td>
              <td className="px-6 py-3.5 font-extrabold text-[#0b132b]">{tx.amount}</td>
              <td className="px-6 py-3.5">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-extrabold uppercase">
                  {tx.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Settings Row ───────────────────────────────────────────────
export function SettingsRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-b-0">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <span className="text-xs font-medium text-slate-500 text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

// ─── User List Section ──────────────────────────────────────────
export function UserListSection({
  users, loading, error, searchQuery, setSearchQuery,
  roleFilter, setRoleFilter, onRefresh,
  sortField, setSortField, sortDir, setSortDir,
  title, subtitle, showRoleFilter
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0b132b] font-serif-heading">{title}</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">{subtitle} ({users.length} found)</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Loader2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path strokeLinecap="round" d="m21 21-4.3-4.3" strokeWidth="2"/></svg>
          <input
            type="text"
            placeholder="Search by name, email, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all"
          />
        </div>

        {showRoleFilter && (
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="driver">Drivers Only</option>
            <option value="company">Companies Only</option>
          </select>
        )}

        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-rose-500 focus:outline-none cursor-pointer"
        >
          <option value="created_at">Date Joined</option>
          <option value="full_name">Name</option>
          <option value="email">Email</option>
        </select>

        <button
          onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
          className="px-2.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-all text-xs font-bold cursor-pointer"
          title={`Sort ${sortDir === 'asc' ? 'Descending' : 'Ascending'}`}
        >
          {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-bold">Loading users from Supabase...</span>
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-xs font-bold text-rose-600">{error}</p>
            <p className="text-[10px] text-slate-400">Make sure Supabase RLS policies allow admin SELECT on profiles.</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No users found</p>
            <p className="text-[10px] text-slate-400 mt-1">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <UserTable users={users} />
          </div>
        )}
      </div>
    </div>
  );
}
