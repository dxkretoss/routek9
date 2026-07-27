import React from 'react';

export default function Footer({ onSelectState }) {
  return (
    <footer className="bg-[#0b132b] text-white py-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0d1b2a] border-2 border-rose-600 flex flex-col items-center justify-center text-white shadow-xs shrink-0">
              <span className="text-[7px] font-bold uppercase text-slate-300">ROUTE</span>
              <span className="text-xs font-extrabold text-rose-500 leading-none">K9</span>
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white font-sans uppercase">
                ROUTE K9
              </span>
              <p className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase leading-none mt-0.5">
                CONTRACT DRIVERS OF AMERICA
              </p>
            </div>
          </div>

          {/* Simple Info & Copyright */}
          <div className="text-center md:text-right space-y-1">
            <p className="text-xs text-slate-400 font-normal">
              Independent directory. Not affiliated with FedEx, USPS, Amazon, or any listed company.
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              © {new Date().getFullYear()} RouteK9 Pro. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
