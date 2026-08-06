import React, { useState, useEffect } from 'react';
import { Building2, ExternalLink, DollarSign, Calendar, MapPin, Lock, FileX, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchGovContractsFromDb } from '../lib/govContracts';

export default function GovernmentContractsSection({ currentUser, onOpenPricing, onTriggerGateModal }) {
  const [contracts, setContracts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load saved government contracts from database
  useEffect(() => {
    loadSavedContracts();
  }, []);

  const loadSavedContracts = async () => {
    try {
      const dbContracts = await fetchGovContractsFromDb();
      setContracts(dbContracts || []);
    } catch (err) {
      console.warn("Failed to load saved database contracts:", err);
    }
  };

  const getValidSamUrl = (item) => {
    if (item.url && item.url.startsWith("https://sam.gov/")) {
      return item.url;
    }
    if (item.noticeId) {
      return `https://sam.gov/opp/${item.noticeId}/view`;
    }
    return `https://sam.gov/search/?index=opp&sort=-modifiedDate&page=1&keyword=492110`;
  };

  // Pagination Calculations
  const totalPages = Math.ceil(contracts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContracts = contracts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      const el = document.getElementById('government-contracts-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="government-contracts-section" className="py-16 sm:py-24 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10 space-y-3">

          {/* Badge Line */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-rose-600 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600 font-sans">
              GOVERNMENT CONTRACTS
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0b132b] tracking-tight font-serif-heading leading-tight">
            Federal courier contracts — NAICS 492110
          </h2>

          {/* Subtitle */}
          <p className="text-slate-600 text-sm max-w-2xl font-normal leading-relaxed font-sans">
            Verified NAICS 492110 courier contracts from SAM.gov database. SAM entity registration required to bid.
          </p>

        </div>

        {/* Clean SAM.gov Contracts Table Grid */}
        <div className="bg-slate-50 rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 px-4 min-w-[340px]">Contract Opportunity & Solicitation #</th>
                  <th className="pb-3 px-4 min-w-[150px]">Est. Value</th>
                  <th className="pb-3 px-4 min-w-[150px]">Location</th>
                  <th className="pb-3 px-4 min-w-[110px]">Deadline</th>
                  <th className="pb-3 px-4 text-right min-w-[150px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 px-4 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-2xs">
                          <FileX className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-extrabold text-[#0b132b] tracking-tight font-serif-heading">
                          No Government Contracts Available Right Now
                        </h3>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          There are currently no open government courier contracts. New opportunities are updated regularly, so please check back soon!
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedContracts.map((item) => (
                    <tr key={item.noticeId} className="hover:bg-white transition-colors group">

                      {/* Combined Title, Solicitation # & Agency */}
                      <td className="py-4 px-4 space-y-1.5">
                        <div className="font-bold text-sm text-[#0b132b] group-hover:text-rose-600 transition-colors leading-snug">
                          {item.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 font-mono text-[10px] font-extrabold shrink-0">
                            Notice #{item.noticeId}
                          </span>
                          <div className="flex items-center gap-1 min-w-0">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{item.agency}</span>
                          </div>
                        </div>
                      </td>

                      {/* Est. Value Column */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-emerald-600 text-xs flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{item.estimatedValue}</span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4 text-slate-700 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{item.placeOfPerformance}</span>
                        </div>
                      </td>

                      {/* Deadline */}
                      <td className="py-4 px-4 text-slate-600 font-bold whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.responseDeadline}</span>
                        </div>
                      </td>

                      {/* Action Link (100% SINGLE LINE BUTTON) */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        {currentUser?.isPro ? (
                          <a
                            href={getValidSamUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0b132b] hover:bg-rose-600 text-white font-extrabold text-xs shadow-xs transition-all duration-150 cursor-pointer"
                          >
                            <span>Bid on SAM.gov</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (onTriggerGateModal) {
                                onTriggerGateModal({
                                  title: "Government Procurement Contacts Locked",
                                  message: "Accessing direct procurement officer phone numbers, emails, and SAM.gov bid links requires a Route K9 PRO membership."
                                });
                              } else if (onOpenPricing) {
                                onOpenPricing();
                              }
                            }}
                            className="whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-300/80 text-amber-800 font-extrabold text-xs shadow-2xs transition-all cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Unlock Contact (PRO)</span>
                          </button>
                        )}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {contracts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="text-slate-500 font-semibold">
                Showing <span className="font-extrabold text-slate-900">{startIndex + 1}</span> to{' '}
                <span className="font-extrabold text-slate-900">{Math.min(startIndex + itemsPerPage, contracts.length)}</span> of{' '}
                <span className="font-extrabold text-slate-900">{contracts.length}</span> contracts
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
                        className={`w-8 h-8 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${currentPage === pageNum
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

      </div>
    </section>
  );
}
