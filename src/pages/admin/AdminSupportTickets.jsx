import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  X,
  AlertTriangle,
  Clock,
  MessageSquare,
  RefreshCw,
  Tag,
  Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
  const [selectedTicketModal, setSelectedTicketModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load support_tickets from Supabase database
  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Supabase support_tickets notice:", error);
      }

      setTickets(data || []);
    } catch (err) {
      console.error("Error loading support tickets:", err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Update Status in Supabase support_tickets table
  const handleStatusChange = async (ticketId, newStatus) => {
    setUpdatingId(ticketId);
    try {
      // 1. Optimistic local update
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t));
      if (selectedTicketModal && selectedTicketModal.id === ticketId) {
        setSelectedTicketModal(prev => ({ ...prev, status: newStatus, updated_at: new Date().toISOString() }));
      }

      // 2. Supabase DB Update
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) {
        console.error("Error updating ticket status in Supabase:", error);
        // Rollback on failure
        loadTickets();
      }
    } catch (err) {
      console.error("Error updating ticket status:", err);
      loadTickets();
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtered tickets memory calculation
  const filteredTickets = tickets.filter(t => {
    if (!t) return false;
    const q = (searchQuery || '').trim().toLowerCase();
    const matchesSearch = !q
      ? true
      : (t.full_name || '').toLowerCase().includes(q) ||
        (t.contact_info || '').toLowerCase().includes(q) ||
        (t.issue_type || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || String(t.status || '').toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination Calculations
  const totalTickets = filteredTickets.length;
  const totalPages = Math.ceil(totalTickets / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0b132b] font-serif-heading tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-rose-600" />
            <span>Support Tickets Management</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor incoming user support inquiries, update ticket status, & inspect issue details
          </p>
        </div>
        <button
          onClick={loadTickets}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Tickets</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1">
        {['ALL', 'OPEN', 'CLOSED'].map((st) => {
          const count = st === 'ALL' ? tickets.length : tickets.filter(t => String(t.status || '').toUpperCase() === st).length;
          return (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                statusFilter === st
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {st} ({count})
            </button>
          );
        })}
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, contact info, issue type, or description..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded-full hover:bg-slate-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Tickets Table */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Syncing Support Tickets from Supabase...</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b132b] font-serif-heading">Support Ticket Requests</h3>
              <p className="text-xs text-slate-400 font-medium">Manage ticket status from Open to Closed in real-time</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-full border border-rose-200">
              {filteredTickets.length} Tickets Found
            </span>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400 font-medium space-y-2">
              <LifeBuoy className="w-8 h-8 mx-auto text-slate-300" />
              <p>No support tickets match your filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Applicant / User</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Issue Type</th>
                    <th className="px-6 py-4">Description Snippet</th>
                    <th className="px-6 py-4">Submitted Date</th>
                    <th className="px-6 py-4 text-center">Ticket Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedTickets.map((ticket, idx) => {
                    const statusUpper = String(ticket.status || 'OPEN').toUpperCase();
                    const formattedDate = ticket.created_at
                      ? new Date(ticket.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'N/A';

                    return (
                      <tr key={ticket.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {(ticket.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span className="font-extrabold text-slate-900">{ticket.full_name || 'User'}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-medium text-slate-700 font-mono text-[11px]">
                          {ticket.contact_info || 'N/A'}
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px] uppercase border border-slate-200">
                            {ticket.issue_type || 'General'}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-medium text-slate-600 max-w-xs truncate">
                          {ticket.description || 'No description available'}
                        </td>

                        <td className="px-6 py-4 text-slate-500 font-semibold text-[11px]">
                          {formattedDate}
                        </td>

                        {/* Interactive Status Selector */}
                        <td className="px-6 py-4 text-center">
                          <div className="relative inline-block">
                            <select
                              value={statusUpper}
                              onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                              disabled={updatingId === ticket.id}
                              className={`appearance-none pl-3 pr-7 py-1 rounded-full text-[10px] font-extrabold uppercase border cursor-pointer focus:outline-none transition-all ${
                                statusUpper === 'OPEN'
                                  ? 'bg-rose-50 text-rose-700 border-rose-300 font-black'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 font-black'
                              }`}
                            >
                              <option value="OPEN">OPEN</option>
                              <option value="CLOSED">CLOSED</option>
                            </select>
                            <ChevronDown className="w-2.5 h-2.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current" />
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedTicketModal(ticket)}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer inline-flex"
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
            </div>
          )}

          {/* Pagination Footer */}
          {totalTickets > 0 && (
            <div className="p-4 bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
              <div>
                Showing <span className="font-extrabold text-slate-900">{startIndex + 1}</span> to{' '}
                <span className="font-extrabold text-slate-900">{Math.min(endIndex, totalTickets)}</span> of{' '}
                <span className="font-extrabold text-slate-900">{totalTickets}</span> tickets
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 font-black text-rose-600 text-xs shadow-2xs">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white font-extrabold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ticket Inspection Modal */}
      {selectedTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden space-y-6 p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-extrabold">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 font-serif-heading">Support Ticket Details</h3>
                  <p className="text-xs text-slate-400 font-medium">Ticket ID: {selectedTicketModal.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicketModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">Applicant Name</span>
                  <span className="font-extrabold text-slate-900 text-sm">{selectedTicketModal.full_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">Contact Info</span>
                  <span className="font-bold text-rose-600 text-xs font-mono">{selectedTicketModal.contact_info || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">Issue Category</span>
                  <span className="font-extrabold text-slate-800">{selectedTicketModal.issue_type || 'General'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">Ticket Status</span>
                  <select
                    value={String(selectedTicketModal.status || 'OPEN').toUpperCase()}
                    onChange={(e) => handleStatusChange(selectedTicketModal.id, e.target.value)}
                    className="mt-1 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-white border border-slate-300 text-rose-600 focus:outline-none cursor-pointer"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">Detailed Issue Message</span>
                <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed max-h-48 overflow-y-auto">
                  {selectedTicketModal.description || 'No description text provided.'}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTicketModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
