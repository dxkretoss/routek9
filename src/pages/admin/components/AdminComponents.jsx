import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
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
  X,
  Eye
} from 'lucide-react';

// ─── Phone Number Formatter ──────────────────────────────────────
export function formatPhoneNumber(phone) {
  if (!phone) return 'N/A';
  const raw = String(phone).trim();
  if (!raw) return 'N/A';

  if (raw.startsWith('+')) return raw;

  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw;

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return `+${digits}`;
}

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

export function RecentTransactionsTable({ searchQuery = '', filterPeriod = 'all', transactionsList }) {
  const [dbTransactions, setDbTransactions] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTxModal, setSelectedTxModal] = useState(null);

  useEffect(() => {
    async function fetchTxAndProfiles() {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setDbTransactions(data);
        }

        // Fetch profiles map for customer lookup
        const { data: profData } = await supabase.from('profiles').select('id, email, full_name, role, city, state_code, phone');
        if (profData) {
          const map = {};
          profData.forEach(p => {
            if (p.email) map[p.email.toLowerCase()] = p;
            if (p.id) map[p.id] = p;
          });
          setProfilesMap(map);
        }
      } catch (err) {
        console.warn("Failed to fetch transactions:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTxAndProfiles();
  }, []);

  const mockTransactions = [
    { id: 'tx_101', email: 'john.driver@gmail.com', description: 'Route K9 PRO Membership (Monthly)', amount: '$29.00', created_at: '2026-07-31T12:00:00Z', status: 'Succeeded' },
    { id: 'tx_102', email: 'sarah.courier@yahoo.com', description: 'HIPAA Medical Courier Certification', amount: '$49.00', created_at: '2026-07-30T12:00:00Z', status: 'Succeeded' },
    { id: 'tx_103', email: 'mike.fleet@logistics.com', description: 'TSA Airport Security Clearance Course', amount: '$99.00', created_at: '2026-07-29T12:00:00Z', status: 'Succeeded' },
    { id: 'tx_104', email: 'alex.trans@gmail.com', description: 'Route K9 PRO Membership (Yearly)', amount: '$299.00', created_at: '2026-07-28T12:00:00Z', status: 'Succeeded' },
    { id: 'tx_105', email: 'routek9company@yopmail.com', description: 'Route K9 PRO Membership (Monthly)', amount: '$29.00', created_at: '2026-08-05T09:00:00Z', status: 'Succeeded' },
    { id: 'tx_106', email: 'routetestdriver@yopmail.com', description: 'Master Contractor Training', amount: '$49.00', created_at: '2026-08-03T11:00:00Z', status: 'Succeeded' }
  ];

  let rawList = transactionsList || dbTransactions;

  if (searchQuery.trim().length > 0) {
    const query = searchQuery.toLowerCase().trim();
    rawList = rawList.filter(tx =>
      (tx.email || '').toLowerCase().includes(query) ||
      (tx.description || tx.desc || '').toLowerCase().includes(query) ||
      (tx.id || '').toLowerCase().includes(query)
    );
  }

  const filtered = rawList;

  if (loading && dbTransactions.length === 0 && !transactionsList) {
    return (
      <div className="py-8 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
        <span>Loading Stripe transactions...</span>
      </div>
    );
  }

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
            <th className="px-6 py-3.5 text-right">Admin Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-xs">
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">
                No Stripe transactions found matching your criteria.
              </td>
            </tr>
          ) : (
            filtered.map((tx) => {
              const formattedDate = new Date(tx.created_at || tx.date || Date.now()).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              return (
                <tr key={tx.id || Math.random()} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{tx.email}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{tx.description || tx.desc || 'RouteK9 Item'}</td>
                  <td className="px-6 py-4 font-extrabold text-emerald-600">{tx.amount}</td>
                  <td className="px-6 py-4 text-slate-400 font-medium">{formattedDate}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase border border-emerald-200">
                      {tx.status || 'Succeeded'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedTxModal(tx)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-700 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Selected Transaction Details Modal */}
      {selectedTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Dark Header */}
            <div className="p-6 bg-[#0b132b] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400">
                      Stripe Payment Receipt
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedTxModal.status || 'Succeeded'}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white font-serif-heading">
                    {selectedTxModal.email || 'Customer Receipt'}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedTxModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Transaction Summary Grid */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount Paid</div>
                  <div className="text-lg font-extrabold text-emerald-600">{selectedTxModal.amount}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transaction ID</div>
                  <div className="font-extrabold text-slate-800 font-mono text-[11px] truncate" title={selectedTxModal.id}>
                    {selectedTxModal.id || 'tx_live_stripe'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 col-span-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purchased Item / Description</div>
                  <div className="font-extrabold text-slate-900">{selectedTxModal.description || selectedTxModal.desc || 'RouteK9 Service Purchase'}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Date</div>
                  <div className="font-extrabold text-slate-800">
                    {new Date(selectedTxModal.created_at || selectedTxModal.date || Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Gateway</div>
                  <div className="font-extrabold text-slate-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Stripe Checkout</span>
                  </div>
                </div>
              </div>

              {/* Customer Profile Match Card */}
              {(() => {
                const matchedProf = profilesMap[selectedTxModal.email?.toLowerCase()] || (selectedTxModal.user_id ? profilesMap[selectedTxModal.user_id] : null);
                return (
                  <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-2 text-left">
                    <div className="text-[10px] font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Customer Profile Match</span>
                    </div>

                    {matchedProf ? (
                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase block font-bold">Full Name</span>
                          <span className="font-extrabold text-slate-900">{matchedProf.full_name || matchedProf.name || 'Member'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 uppercase block font-bold">Account Role</span>
                          <span className="font-extrabold text-slate-900 capitalize">{matchedProf.role || 'Driver'}</span>
                        </div>
                        {matchedProf.phone && (
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase block font-bold">Phone Number</span>
                            <span className="font-extrabold text-slate-800">{formatPhoneNumber(matchedProf.phone)}</span>
                          </div>
                        )}
                        {matchedProf.city && (
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase block font-bold">Location</span>
                            <span className="font-extrabold text-slate-800">{matchedProf.city}, {matchedProf.state_code || 'US'}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 font-medium">
                        Buyer Email: <strong className="text-slate-800">{selectedTxModal.email}</strong> (Guest or direct Stripe Checkout customer).
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Fulfillment Status Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-medium leading-relaxed text-left flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Fulfillment Status:</strong> Digital access unlocked immediately upon Stripe webhook confirmation. User permissions active.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
