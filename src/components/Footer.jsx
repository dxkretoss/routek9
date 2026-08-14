import React from 'react';

export default function Footer({ onSelectState }) {
  return (
    <footer className="bg-[#0b132b] text-white py-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img src='src/assets/footerlogo.png' className="h-11" />
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
