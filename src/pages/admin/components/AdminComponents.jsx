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
  ArrowUpRight,
  AlertTriangle,
  X
} from 'lucide-react';

// ─── Custom Confirm Modal ─────────────────────────────────────────
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', confirmColor = 'rose', loading = false }) {
  if (!isOpen) return null;

  const btnBgMap = {
    rose: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30',
    amber: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30',
    blue: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-md p-6 sm:p-7 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100/80 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading tracking-tight truncate">
              {title || 'Confirm Action'}
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {message || 'Are you sure you want to proceed with this action?'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer ${btnBgMap[confirmColor] || btnBgMap.rose}`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card Skeleton ──────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-2xl bg-slate-200" />
        <div className="w-12 h-4 rounded-full bg-slate-200" />
      </div>
      <div className="h-8 w-24 rounded-lg bg-slate-200 mt-2" />
      <div className="h-3 w-32 rounded bg-slate-100" />
    </div>
  );
}

// ─── Table Row Skeleton ─────────────────────────────────────────
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="divide-y divide-slate-100 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 rounded bg-slate-200" />
              <div className="h-2.5 w-44 rounded bg-slate-100" />
            </div>
          </div>
          <div className="hidden sm:block h-6 w-20 rounded-full bg-slate-200" />
          <div className="hidden md:block h-3.5 w-24 rounded bg-slate-200" />
          <div className="hidden lg:block h-3.5 w-20 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

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
          {course.description}
        </p>
      </div>
    </div>
  );
}

// ─── Recent Transactions Table ──────────────────────────────────
export function RecentTransactionsTable() {
  const transactions = [
    { id: 'tx_101', email: 'john.driver@gmail.com', desc: 'Route K9 PRO Membership (Monthly)', amount: '$29.00', date: 'Jul 31, 2026', status: 'Succeeded' },
    { id: 'tx_102', email: 'sarah.courier@yahoo.com', desc: 'HIPAA Medical Courier Certification', amount: '$49.00', date: 'Jul 30, 2026', status: 'Succeeded' },
    { id: 'tx_103', email: 'mike.fleet@logistics.com', desc: 'TSA Airport Security Clearance Course', amount: '$99.00', date: 'Jul 29, 2026', status: 'Succeeded' },
    { id: 'tx_104', email: 'alex.trans@gmail.com', desc: 'Route K9 PRO Membership (Yearly)', amount: '$299.00', date: 'Jul 28, 2026', status: 'Succeeded' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-500">
            <th className="px-6 py-3.5">Customer Email</th>
            <th className="px-6 py-3.5">Description</th>
            <th className="px-6 py-3.5">Amount</th>
            <th className="px-6 py-3.5">Date</th>
            <th className="px-6 py-3.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-xs">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-bold text-slate-900">{tx.email}</td>
              <td className="px-6 py-4 text-slate-600 font-medium">{tx.desc}</td>
              <td className="px-6 py-4 font-extrabold text-emerald-600">{tx.amount}</td>
              <td className="px-6 py-4 text-slate-400 font-medium">{tx.date}</td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase border border-emerald-200">
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

// ─── Section Header ─────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-serif-heading tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── User List Section ──────────────────────────────────────────
export function UserListSection({
  users,
  loading,
  error,
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  onRefresh,
  sortField,
  setSortField,
  sortDir,
  setSortDir,
  title,
  subtitle
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        action={
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <span>Refresh Data</span>
          </button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Search by name, email, city, or state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-2xs"
          />
        </div>


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
          <TableSkeleton rows={6} />
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
