import React, { useState, useEffect } from 'react';
import {
  Building2,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  MapPin,
  Calendar,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  fetchGovContractsFromDb,
  syncGovContractsFromSamApi,
  addGovContractToDb,
  deleteGovContractFromDb
} from '../../lib/govContracts';

export default function AdminGovContracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  
  // Custom Delete Modal State
  const [deleteTargetContract, setDeleteTargetContract] = useState(null);

  const [formData, setFormData] = useState({
    noticeId: '',
    title: '',
    agency: '',
    office: '',
    type: 'Solicitation',
    setAside: 'Total Small Business Set-Aside',
    postedDate: new Date().toISOString().split('T')[0],
    responseDeadline: '',
    placeOfPerformance: '',
    estimatedValue: '$180,000 – $450,000 / yr',
    url: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchGovContractsFromDb();
      setContracts(data || []);
    } catch (err) {
      console.error("Error loading admin gov contracts:", err);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  // Sync / Refresh contracts from SAM.gov API and save to database
  const handleRefreshAndSave = async () => {
    setSyncing(true);
    showToast("Connecting to SAM.gov API and fetching latest contracts...", "info");
    try {
      const res = await syncGovContractsFromSamApi();
      setContracts(res.list || []);
      if (res.error) {
        showToast(res.error, "warning");
      } else {
        showToast(`Successfully refreshed live API! ${res.list.length} contracts in database.`, "success");
      }
    } catch (err) {
      console.error("Sync error:", err);
      showToast("API sync notice: Could not fetch contracts from SAM.gov API.", "warning");
    } finally {
      setSyncing(false);
    }
  };

  const showToast = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Open modal for Adding new contract
  const handleOpenAddModal = () => {
    setEditingContract(null);
    const newNoticeId = `36C24524Q${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      noticeId: newNoticeId,
      title: '',
      agency: '',
      office: '',
      type: 'Solicitation',
      setAside: 'Total Small Business Set-Aside',
      postedDate: new Date().toISOString().split('T')[0],
      responseDeadline: '',
      placeOfPerformance: '',
      estimatedValue: '$200,000 – $450,000 / yr',
      url: `https://sam.gov/search/?index=opp&keyword=${newNoticeId}`
    });
    setIsModalOpen(true);
  };

  // Open modal for Editing contract
  const handleOpenEditModal = (item) => {
    setEditingContract(item);
    setFormData({
      noticeId: item.noticeId || '',
      title: item.title || '',
      agency: item.agency || '',
      office: item.office || '',
      type: item.type || 'Solicitation',
      setAside: item.setAside || 'Small Business Set-Aside',
      postedDate: item.postedDate || new Date().toISOString().split('T')[0],
      responseDeadline: item.responseDeadline || '',
      placeOfPerformance: item.placeOfPerformance || '',
      estimatedValue: item.estimatedValue || '',
      url: item.url || ''
    });
    setIsModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.noticeId) {
      showToast("Please provide both Solicitation Number and Title.", "warning");
      return;
    }

    const res = await addGovContractToDb(formData);
    if (res.success) {
      setContracts(res.list);
      setIsModalOpen(false);
      showToast(editingContract ? "Contract updated in database." : "New government contract added and saved in database!", "success");
    } else {
      showToast("Failed to save contract to database.", "warning");
    }
  };

  // Confirm Delete Action from Custom Modal
  const confirmDeleteContract = async () => {
    if (!deleteTargetContract) return;
    const targetId = deleteTargetContract.noticeId || deleteTargetContract.id;
    const targetTitle = deleteTargetContract.title;
    
    setDeleteTargetContract(null);
    const res = await deleteGovContractFromDb(targetId);
    if (res.success) {
      setContracts(res.list);
      showToast(`Deleted "${targetTitle}" from database.`, "info");
    }
  };

  // Filter contracts
  // Filter contracts
  const filteredContracts = contracts.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.noticeId || '').toLowerCase().includes(q) ||
      (c.title || '').toLowerCase().includes(q) ||
      (c.agency || '').toLowerCase().includes(q) ||
      (c.placeOfPerformance || '').toLowerCase().includes(q)
    );
  });

  // Pagination Calculations (10 items per page)
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when searching or when contracts change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, contracts.length]);

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContracts = filteredContracts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-md transition-all ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
          notification.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
          'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner & Main Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 font-sans">
              Admin Government API Connection
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading">
            Government Contracts Database
          </h2>
          <p className="text-slate-500 text-xs mt-1 max-w-xl font-medium">
            Connect to SAM.gov API to fetch, update, and persist federal courier contracts in the database for public users.
          </p>
        </div>

        {/* Action Buttons: Add Button & Refresh/Update API Button */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contract</span>
          </button>

          <button
            onClick={handleRefreshAndSave}
            disabled={syncing}
            className="px-4 py-2.5 rounded-xl bg-[#0b132b] hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-rose-400 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Connecting & Saving...' : 'Refresh SAM.gov API'}</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total DB Contracts</div>
            <div className="text-2xl font-extrabold text-[#0b132b] mt-1">{contracts.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">NAICS Code</div>
            <div className="text-2xl font-extrabold text-[#0b132b] mt-1">492110</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Database Status</div>
            <div className="text-sm font-extrabold text-emerald-600 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Connected & Saved</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#0b132b] p-4 rounded-2xl border border-slate-800 shadow-2xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by solicitation #, contract title, agency, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none font-medium"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-xs text-rose-400 hover:text-rose-300 font-bold cursor-pointer">
            Clear
          </button>
        )}
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 min-w-[340px]">Contract Opportunity & Solicitation #</th>
                <th className="py-3.5 px-4 min-w-[150px]">Est. Value</th>
                <th className="py-3.5 px-4 min-w-[150px]">Location</th>
                <th className="py-3.5 px-4 min-w-[110px]">Deadline</th>
                <th className="py-3.5 px-4 text-right min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
                    Loading database contracts...
                  </td>
                </tr>
              ) : filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">
                    No government contracts found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedContracts.map((item) => (
                  <tr key={item.noticeId || item.id} className="hover:bg-slate-50/80 transition-colors group">
                    
                    {/* Combined Title, Solicitation # & Agency */}
                    <td className="py-4 px-4 space-y-1.5">
                      <div className="font-bold text-sm text-[#0b132b] leading-snug">
                        {item.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-extrabold border border-slate-200/80 shrink-0">
                          Notice #{item.noticeId}
                        </span>
                        <div className="flex items-center gap-1 min-w-0">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.agency}</span>
                        </div>
                      </div>
                    </td>

                    {/* Est. Value */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-extrabold text-emerald-600 text-xs flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item.estimatedValue || 'Custom Quote'}</span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4 text-slate-700 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{item.placeOfPerformance || 'Nationwide'}</span>
                      </div>
                    </td>

                    {/* Deadline */}
                    <td className="py-4 px-4 text-slate-600 font-bold whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.responseDeadline || 'Open'}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        title="Edit Contract"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteTargetContract(item)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        title="Delete Contract"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          title="View on SAM.gov"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredContracts.length > 0 && (
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="text-slate-500 font-semibold">
              Showing <span className="font-extrabold text-slate-900">{startIndex + 1}</span> to{' '}
              <span className="font-extrabold text-slate-900">{Math.min(startIndex + itemsPerPage, filteredContracts.length)}</span> of{' '}
              <span className="font-extrabold text-slate-900">{filteredContracts.length}</span> contracts
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-bold transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-bold transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#0b132b] font-serif-heading">
                  {editingContract ? 'Edit Government Contract' : 'Add Government Contract'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  This contract will be saved directly into the database for all users.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Solicitation # / Notice ID *</label>
                  <input
                    type="text"
                    required
                    value={formData.noticeId}
                    onChange={(e) => setFormData({ ...formData, noticeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    placeholder="e.g. 36C24524Q0189"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Est. Value</label>
                  <input
                    type="text"
                    value={formData.estimatedValue}
                    onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    placeholder="e.g. $240,000 – $480,000 / yr"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Contract Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  placeholder="e.g. VA Healthcare System - Daily Courier & Medical Specimen Transport"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Agency / Department</label>
                  <input
                    type="text"
                    value={formData.agency}
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    placeholder="e.g. Department of Veterans Affairs"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Contracting Office</label>
                  <input
                    type="text"
                    value={formData.office}
                    onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    placeholder="e.g. 245-NETWORK CONTRACT OFFICE 05"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Place of Performance / Location</label>
                  <input
                    type="text"
                    value={formData.placeOfPerformance}
                    onChange={(e) => setFormData({ ...formData, placeOfPerformance: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    placeholder="e.g. Baltimore, MD 21201"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Response Deadline</label>
                  <input
                    type="text"
                    value={formData.responseDeadline}
                    onChange={(e) => setFormData({ ...formData, responseDeadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    placeholder="e.g. 2026-08-15"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-slate-700 mb-1">SAM.gov / Opportunity Link</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  placeholder="https://sam.gov/search/..."
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  {editingContract ? 'Save Changes' : 'Save to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Dialog Modal */}
      {deleteTargetContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-[#0b132b] font-serif-heading">
                Delete Government Contract?
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Are you sure you want to delete <span className="font-extrabold text-slate-900 font-mono text-[11px] block mt-1 py-1 px-2.5 rounded-lg bg-slate-100 truncate border border-slate-200">{deleteTargetContract.title}</span>
              </p>
              <p className="text-[11px] text-rose-600 font-semibold pt-1">
                This action will permanently remove the contract from the database.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetContract(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteContract}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Contract</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
