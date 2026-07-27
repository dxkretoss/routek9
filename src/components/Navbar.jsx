import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Menu, X, LogOut, LayoutDashboard, GraduationCap, Bell, Users } from 'lucide-react';

export default function Navbar({ currentUser, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Controls visibility of optional nav links (set to false/hidden)
  const showBuyRoute = false;
  const showWhosHiring = false;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            {/* Circle Badge Logo */}
            <div className="w-11 h-11 rounded-full bg-[#0d1b2a] border-2 border-rose-600 flex flex-col items-center justify-center text-white shadow-xs relative overflow-hidden shrink-0">
              <span className="text-[7px] font-bold uppercase tracking-tighter text-slate-300">ROUTE</span>
              <span className="text-xs font-extrabold tracking-tight text-rose-500 leading-none">K9</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#0b132b] font-sans">
                  ROUTE K9
                </span>
                <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-rose-50 text-rose-600 rounded-full border border-rose-200">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                CONTRACT DRIVERS OF AMERICA
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links Container */}
          <nav className="hidden xl:flex items-center">

            {/* Nav Links Pills Container */}
            <div className="flex items-center gap-4 px-5 py-2 rounded-full bg-slate-100/80 border border-slate-200/70 text-xs font-semibold text-slate-700">
              {/* <Link to="/" className="hover:text-rose-600 transition-colors">Home</Link> */}
              <a href="/#map-section" className="hover:text-rose-600 transition-colors flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                Find Routes
              </a>
              <a href="/#government-contracts-section" className="hover:text-rose-600 transition-colors">Gov Contracts</a>

              {/* Buy a Route (Hidden) */}
              <a href="/#buy-a-route-section" className={`hover:text-rose-600 transition-colors ${showBuyRoute ? 'inline-block' : 'hidden'}`}>
                Buy a Route
              </a>

              <a href="/#calculator-section" className="hover:text-rose-600 transition-colors">Profit Calculator</a>
              {/* <Link to="/notifications" className="hover:text-rose-600 transition-colors flex items-center gap-1 font-semibold">
                <Bell className="w-3.5 h-3.5 text-rose-600" />
                Notifications
              </Link> */}
              <Link to="/drivers" className="hover:text-rose-600 transition-colors flex items-center gap-1 font-semibold">
                <Users className="w-3.5 h-3.5 text-rose-600" />
                Drivers Directory
              </Link>
              <Link to="/training" className="hover:text-rose-600 transition-colors text-rose-600 font-extrabold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                Training
              </Link>

              {/* Who's Hiring (Hidden) */}
              <a href="/#whos-hiring-section" className={`hover:text-rose-600 transition-colors ${showWhosHiring ? 'inline-block' : 'hidden'}`}>
                Who's Hiring
              </a>

              <a href="/#faq-section" className="hover:text-rose-600 transition-colors">FAQ</a>
            </div>

          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">

            {currentUser ? (
              <div className="flex items-center gap-2">

                {/* Single Clean "My Dashboard" Button */}
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 rounded-full bg-[#0b132b] hover:bg-[#1a264a] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4 text-rose-500" />
                  <span>My Dashboard</span>
                </Link>

                {/* Notification Bell Button */}
                <Link
                  to="/notifications"
                  title="Notifications"
                  className="relative p-2.5 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-600 text-[8px] font-extrabold text-white flex items-center justify-center ring-2 ring-white animate-pulse">3</span>
                </Link>

                {/* Log Out Button */}
                <button
                  onClick={onLogout}
                  title="Log out"
                  className="p-2.5 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>

              </div>
            ) : (
              <>
                {/* Log in Button -> /login */}
                <Link
                  to="/login"
                  className="px-5 py-2.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-[#0b132b] font-medium text-xs shadow-2xs transition-all cursor-pointer inline-flex items-center justify-center"
                >
                  Log in
                </Link>

                {/* Not a member? Button -> /signup */}
                <Link
                  to="/signup"
                  className="px-5 py-2.5 rounded-full bg-[#0b132b] hover:bg-[#1a264a] text-white font-medium text-xs shadow-sm transition-all cursor-pointer inline-flex items-center justify-center"
                >
                  Not a member?
                </Link>
              </>
            )}

          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="xl:hidden flex items-center gap-2">
            {!currentUser && (
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-full border border-slate-300 bg-white text-xs font-medium text-[#0b132b]"
              >
                Log in
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 text-xs font-semibold text-slate-700">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">Home</Link>
          <a href="/#map-section" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">Find Routes</a>
          <a href="/#government-contracts-section" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">Gov Contracts</a>

          {showBuyRoute && (
            <a href="/#buy-a-route-section" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">Buy a Route</a>
          )}

          <a href="/#calculator-section" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">Profit Calculator</a>
          <Link to="/notifications" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-800 flex items-center justify-between">
            <span>Notifications</span>
            <span className="px-2 py-0.5 text-[10px] bg-rose-600 text-white rounded-full font-bold">3 New</span>
          </Link>
          <Link to="/drivers" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">
            Drivers Directory
          </Link>
          <Link to="/training" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-rose-600 font-extrabold">Training Library</Link>

          {showWhosHiring && (
            <a href="/#whos-hiring-section" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">Who's Hiring</a>
          )}

          <a href="/#faq-section" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">FAQ</a>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-full bg-[#0b132b] text-white font-medium text-xs text-center"
                >
                  My Dashboard
                </Link>
                <button
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  className="w-full py-2 rounded-full bg-rose-50 text-rose-600 text-xs font-bold"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-full bg-[#0b132b] text-white font-medium text-xs text-center"
              >
                Not a member? Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
