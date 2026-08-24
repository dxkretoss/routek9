import React from 'react';
import { Link } from 'react-router-dom';
import footerLogo from '../assets/footerlogo.png';

export default function Footer({ onSelectState }) {
  return (
    <footer className="bg-[#0b132b] text-white py-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/">
              <img src={footerLogo} className="h-11 hover:opacity-90 transition-opacity" alt="RouteK9 Logo" />
            </Link>
          </div>

          {/* Nav Links & Legal Info */}
          <div className="flex flex-col items-center md:items-end space-y-2">
            {/* <div className="flex items-center gap-6 text-xs font-semibold text-slate-300">
              <Link to="/terms" className="hover:text-rose-400 transition-colors">
                Terms & Conditions
              </Link>
              <span className="text-slate-700">•</span>
              <Link to="/privacy" className="hover:text-emerald-400 transition-colors">
                Privacy Policy
              </Link>
            </div> */}
            <p className="text-xs text-slate-400 font-normal text-center md:text-right">
              Independent directory. Not affiliated with FedEx, USPS, Amazon, or any listed company.
            </p>
            <p className="text-[10px] text-slate-500 font-medium text-center md:text-right">
              © {new Date().getFullYear()} RouteK9 Pro. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
