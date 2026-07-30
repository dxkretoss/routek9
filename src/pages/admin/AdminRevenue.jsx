import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Download,
  Search,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import { RecentTransactionsTable } from './components/AdminComponents';

export default function AdminRevenue() {
  const [filterPeriod, setFilterPeriod] = useState('30d');
  const [txSearch, setTxSearch] = useState('');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0b132b] font-serif-heading">Revenue Analytics</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Stripe transaction history and financial performance summary</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs cursor-pointer focus:outline-none"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="year">This Year (2026)</option>
          </select>

          <button
            onClick={() => alert("Exporting financial statement report...")}
            className="px-4 py-2 bg-[#0b132b] hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Revenue KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0b132b]">$18,450.00</div>
          <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+24.5% vs previous period</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Monthly Revenue (MRR)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0b132b]">$4,930.00</div>
          <div className="text-[10px] font-medium text-slate-500">170 active PRO subscriptions</div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Course Sales</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0b132b]">$13,520.00</div>
          <div className="text-[10px] font-medium text-slate-500">One-time course purchases</div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Avg Order Value</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#0b132b]">$46.80</div>
          <div className="text-[10px] font-medium text-slate-500">Powered by Stripe Checkout</div>
        </div>
      </div>

      {/* Revenue Growth Chart */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-7 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Revenue Growth Overview</h3>
            <p className="text-[10px] text-slate-400 font-medium">Monthly revenue trend from Stripe checkout sessions</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            Stripe Sync Active
          </span>
        </div>

        <div className="h-56 bg-slate-50 rounded-2xl p-5 flex items-end justify-between gap-3 border border-slate-100">
          {[
            { month: 'Jan', amount: 1450, height: '35%' },
            { month: 'Feb', amount: 2100, height: '48%' },
            { month: 'Mar', amount: 2800, height: '58%' },
            { month: 'Apr', amount: 3400, height: '68%' },
            { month: 'May', amount: 4200, height: '78%' },
            { month: 'Jun', amount: 4900, height: '88%' },
            { month: 'Jul', amount: 5600, height: '98%' },
          ].map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <div className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded shadow-2xs border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                ${item.amount}
              </div>
              <div
                className="w-full bg-gradient-to-t from-rose-600 to-rose-500 group-hover:from-rose-500 group-hover:to-rose-400 rounded-t-xl transition-all shadow-md shadow-rose-500/20"
                style={{ height: item.height }}
              />
              <span className="text-[11px] font-bold text-slate-500">{item.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Stripe Transaction History</h3>
            <p className="text-[10px] text-slate-400 font-medium">Completed purchases and active subscription checkouts</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by buyer email..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <RecentTransactionsTable />
      </div>
    </div>
  );
}
