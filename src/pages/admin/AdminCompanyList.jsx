import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Search,
  Eye,
  User,
  Mail,
  Phone,
  X,
  Calendar,
  ShieldCheck,
  Package,
  AlertTriangle,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminCompanyList({ searchQuery, setSearchQuery }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedCompanyModal, setSelectedCompanyModal] = useState(null);

  // Load Company Profiles from Supabase & localStorage
  const loadCompanies = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profiles with Role = 'company'
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'company')
        .order('created_at', { ascending: false });

      // Read deactivated list from localStorage for instant sync
      const deactivatedList = JSON.parse(localStorage.getItem('rk9_deactivated_drivers') || '[]');

      const list = (profilesData || []).map((p) => {
        const isDeactivated = p.status === 'INACTIVE' ||
          deactivatedList.includes(p.email?.toLowerCase()) ||
          deactivatedList.includes(p.id);

        return {
          ...p,
          company_name: p.full_name || p.company_name || p.email?.split('@')[0] || 'Company',
          city: p.city || 'Houston',
          state_code: p.state_code || 'TX',
          phone: p.phone || '',
          status: isDeactivated ? 'INACTIVE' : 'ACTIVE'
        };
      });

      // 2. Fetch transactions table
      let rawTxs = [];
      try {
        const { data: txsData } = await supabase.from('transactions').select('*');
        rawTxs = txsData || [];
      } catch (txErr) {
        console.warn("Could not load transactions in AdminCompanyList:", txErr);
      }

      const getSubscriptionDetails = (userId, email) => {
        const userSubs = rawTxs.filter(tx => 
          tx.status === 'Succeeded' &&
          (tx.course_id === 'pro-monthly' || tx.course_id === 'pro-yearly' || tx.course_id?.includes('pro')) &&
          ((tx.user_id && String(tx.user_id) === String(userId)) || (tx.email && email && tx.email.toLowerCase() === email.toLowerCase()))
        );

        if (userSubs.length > 0) {
          userSubs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          const latestSub = userSubs[0];
          const createdTime = new Date(latestSub.created_at).getTime();
          const isYearly = latestSub.course_id === 'pro-yearly' || latestSub.description?.toLowerCase().includes('yearly') || latestSub.amount?.includes('299');
          const validityPeriod = isYearly ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
          const msLeft = createdTime + validityPeriod - Date.now();
          const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

          if (msLeft > 0) {
            return {
              isPro: true,
              plan: isYearly ? 'Pro (Yearly)' : 'Pro (Monthly)',
              subscribedAt: new Date(createdTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              nextRenewal: new Date(createdTime + validityPeriod).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              daysLeft,
              amountPaid: latestSub.amount || (isYearly ? '$299.00' : '$29.00')
            };
          }
        }

        return {
          isPro: false,
          plan: 'Free',
          subscribedAt: null,
          nextRenewal: null,
          daysLeft: 0,
          amountPaid: '$0.00'
        };
      };

      const finalList = list.map((c) => {
        const sub = getSubscriptionDetails(c.id, c.email);
        return {
          ...c,
          membership: sub.isPro ? 'Pro' : 'Free',
          subscription: sub
        };
      });

      setCompanies(finalList);
    } catch (err) {
      console.warn("Admin company data load warning:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  // Account Access Status Change Handler (ACTIVE vs INACTIVE)
  const handleAccountStatusChange = async (companyId, companyEmail, newStatus) => {
    setUpdatingId(companyId);
    try {
      // 1. Update local state
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: newStatus } : c));
      if (selectedCompanyModal && selectedCompanyModal.id === companyId) {
        setSelectedCompanyModal(prev => ({ ...prev, status: newStatus }));
      }

      // 2. Update Supabase profiles table
      try {
        const isActiveBool = newStatus === 'ACTIVE';
        await supabase.from('profiles').update({
          status: newStatus,
          is_active: isActiveBool
        }).eq('id', companyId);
      } catch (sbErr) {
        console.warn("Supabase profiles update warning:", sbErr);
      }

      // 3. Also update driver_profiles table for metadata status
      try {
        await supabase.from('driver_profiles').upsert({
          id: companyId,
          status: newStatus
        });
      } catch (sbErr2) {
        console.warn("Supabase driver_profiles update warning:", sbErr2);
      }

      // 3. Sync to localStorage for instant auth enforcement
      try {
        const deactivatedList = JSON.parse(localStorage.getItem('rk9_deactivated_drivers') || '[]');
        let updated = [];
        const cleanEmail = companyEmail ? companyEmail.toLowerCase() : '';

        if (newStatus === 'INACTIVE') {
          updated = Array.from(new Set([...deactivatedList, cleanEmail, companyId]));
        } else {
          updated = deactivatedList.filter(item => item !== cleanEmail && item !== companyId);
        }
        localStorage.setItem('rk9_deactivated_drivers', JSON.stringify(updated));
      } catch (e) {
        console.warn("LocalStorage status sync error:", e);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter companies based on search term
  const filteredCompanies = companies.filter((c) => {
    const q = (searchQuery || '').toLowerCase();
    const name = (c.company_name || c.full_name || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const city = (c.city || '').toLowerCase();
    const state = (c.state_code || '').toLowerCase();

    return name.includes(q) || email.includes(q) || city.includes(q) || state.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-serif-heading tracking-tight">
            Company Directory
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage registered logistics companies, access permissions, & corporate accounts
          </p>
        </div>
        <button
          onClick={loadCompanies}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Search Filter Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by company name, email, city, or state..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* Main Companies Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Corporate Accounts</h3>
            <p className="text-xs text-slate-400 font-medium">Logistics & courier dispatching partners</p>
          </div>
          <span className="px-3 py-1 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-full border border-rose-200">
            {filteredCompanies.length} Companies Listed
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading company profiles...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="p-16 text-center">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No companies found</p>
            <p className="text-xs text-slate-400 mt-1">Try refining your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Date Joined</th>
                  <th className="px-6 py-4 text-center">Account Access</th>
                  <th className="px-6 py-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCompanies.map((comp) => {
                  const isInactive = comp.status === 'INACTIVE';
                  return (
                    <tr key={comp.id} className={`hover:bg-slate-50/60 transition-colors ${isInactive ? 'bg-rose-50/20' : ''}`}>
                      {/* Company Name & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full font-extrabold flex items-center justify-center text-xs shadow-xs ${isInactive ? 'bg-rose-600 text-white' : 'bg-rose-600 text-white'
                            }`}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900">
                              {comp.company_name || comp.full_name || 'Logistics Company'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">{comp.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Member status */}
                      <td className="px-6 py-4 font-bold">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${comp.membership === 'Pro' 
                          ? 'bg-amber-50 text-amber-700 border-amber-300 font-black' 
                          : 'bg-slate-50 text-slate-500 border-slate-300'}`}>
                          {comp.membership === 'Pro' ? '★ Pro' : 'Free'}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4 font-medium text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {(comp.city || comp.state_code)
                              ? `${comp.city || ''}${comp.city && comp.state_code ? ', ' : ''}${comp.state_code || ''}`
                              : 'Houston, TX'}
                          </span>
                        </div>
                      </td>

                      {/* Date Joined */}
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {comp.created_at ? new Date(comp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jul 30, 2026'}
                      </td>

                      {/* Account Access Status Select Dropdown (ACTIVE vs INACTIVE) */}
                      <td className="px-6 py-4 text-center">
                        <div className="relative inline-block">
                          <select
                            value={comp.status || 'ACTIVE'}
                            onChange={(e) => handleAccountStatusChange(comp.id, comp.email, e.target.value)}
                            className={`appearance-none pl-3 pr-7 py-1 rounded-full text-[10px] font-extrabold uppercase border cursor-pointer focus:outline-none transition-all ${isInactive
                              ? 'bg-rose-50 text-rose-700 border-rose-300 font-black'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              }`}
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">DEACTIVATED</option>
                          </select>
                          <ChevronDown className="w-2.5 h-2.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current" />
                        </div>
                      </td>

                      {/* Action Column: View Details Button */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedCompanyModal(comp)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
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

      {/* FULL COMPANY DETAILS MODAL POPUP */}
      {selectedCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white font-serif-heading">
                    {selectedCompanyModal.company_name || selectedCompanyModal.full_name || 'Logistics Company'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-300 font-medium">{selectedCompanyModal.email}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-extrabold text-[10px] uppercase border border-rose-500/30">
                      Company Profile
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCompanyModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">

              {/* Account Status Control Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Account Access Permission
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
                    {selectedCompanyModal.status === 'INACTIVE' ? (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Deactivated (Login Blocked)
                      </span>
                    ) : (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Active Member Account
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedCompanyModal.status || 'ACTIVE'}
                    onChange={(e) => handleAccountStatusChange(selectedCompanyModal.id, selectedCompanyModal.email, e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-extrabold text-xs text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">DEACTIVATED</option>
                  </select>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Name</div>
                  <div className="font-extrabold text-slate-900">{selectedCompanyModal.company_name || selectedCompanyModal.full_name || 'N/A'}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Corporate Email</div>
                  <div className="font-extrabold text-slate-900 truncate">{selectedCompanyModal.email}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operating Metro / Location</div>
                  <div className="font-extrabold text-slate-900 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>
                      {(selectedCompanyModal.city || selectedCompanyModal.state_code)
                        ? `${selectedCompanyModal.city || ''}${selectedCompanyModal.city && selectedCompanyModal.state_code ? ', ' : ''}${selectedCompanyModal.state_code || ''}`
                        : 'Houston, TX'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Registered</div>
                  <div className="font-extrabold text-slate-900 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {selectedCompanyModal.created_at ? new Date(selectedCompanyModal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jul 30, 2026'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscription Membership Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PRO Plan & Billing Details</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1 text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Membership status</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block ${selectedCompanyModal.membership === 'Pro' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {selectedCompanyModal.membership === 'Pro' ? 'Pro Plan' : 'Free Starter'}
                    </span>
                  </div>
                  
                  <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1 text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Amount Paid</span>
                    <span className="font-extrabold text-slate-800">{selectedCompanyModal.subscription?.amountPaid || '$0.00'}</span>
                  </div>

                  {selectedCompanyModal.membership === 'Pro' && (
                    <>
                      <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1 text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Date Subscribed</span>
                        <span className="font-extrabold text-slate-800">{selectedCompanyModal.subscription?.subscribedAt}</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-slate-100 space-y-1 text-left">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Days Remaining / Renewal</span>
                        <span className="font-extrabold text-slate-800">{selectedCompanyModal.subscription?.daysLeft} days left ({selectedCompanyModal.subscription?.nextRenewal})</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Company Info Box */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100/80 space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">Logistics Dispatch Status</div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  This company has full administrative authority to post dispatch orders on the RouteK9 Marketplace and accept bids from certified contract drivers.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            {/* <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedCompanyModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all cursor-pointer shadow-2xs"
              >
                Done / Close
              </button>
            </div> */}

          </div>
        </div>
      )}

    </div>
  );
}
