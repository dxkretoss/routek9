import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Menu, X, LogOut, LayoutDashboard, GraduationCap, Bell, Users, Crown, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Navbar({ currentUser, onLogout, onOpenPricing }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }

    async function loadUnreadCount() {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('unread', true)
          .or(`user_id.eq.${currentUser.id},user_id.is.null`);

        if (!error) {
          setUnreadCount(count || 0);
        }
      } catch (err) {
        console.warn("Could not load unread notifications count:", err);
      }
    }

    loadUnreadCount();
  }, [currentUser]);

  // Controls visibility of optional nav links (set to false/hidden)
  const showBuyRoute = false;
  const showWhosHiring = false;

  const isLinkActive = (path, targetHash) => {
    if (path !== '/' && path !== '/#hero') {
      return pathname.startsWith(path);
    }
    if (pathname === '/') {
      if (!targetHash && !hash) return true;
      if (targetHash === '#hero' && (!hash || hash === '#hero')) return true;
      return hash === targetHash;
    }
    return false;
  };

  const renderLink = (label, path, targetHash, isAnchor = false) => {
    const active = isLinkActive(path, targetHash);
    const cls = `relative py-2 transition-colors hover:text-rose-600 ${active ? 'text-rose-600 font-bold' : 'text-slate-600 font-semibold'
      }`;

    if (isAnchor) {
      return (
        <a href={`${path}${targetHash ?? ''}`} className={cls}>
          {label}
          {active && <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-rose-600 rounded-full" />}
        </a>
      );
    }

    return (
      <Link to={`${path}${targetHash ?? ''}`} className={cls}>
        {label}
        {active && <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-rose-600 rounded-full" />}
      </Link>
    );
  };

  const userRole = currentUser?.role?.toLowerCase();
  const isAdmin = userRole === 'admin';
  const isCompany = userRole === 'company';
  const isDriver = userRole === 'driver';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            {/* Circle Badge Logo */}
            <img src='src/assets/logo.png' className="h-11" />
          </Link>

          {/* Desktop Navigation Links Container */}
          <nav className="hidden xl:flex items-center">

            {/* Nav Links Container */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              {renderLink('Home', '/', '#hero')}
              {renderLink('Calculator', '/', '#calculator-section', true)}
              {renderLink('Find Routes', '/', '#map-section', true)}
              {renderLink('Gov Contracts', '/', '#government-contracts-section', true)}
              {renderLink('Route Planner', '/planner')}
              {currentUser && !isCompany && !isAdmin && renderLink('Dispatch Orders', '/dispatch-orders')}
              {showBuyRoute && renderLink('Buy a Route', '/', '#buy-a-route-section', true)}
              {(!currentUser || !isDriver) && renderLink('Drivers', '/drivers')}
              {(!currentUser || !isCompany) && renderLink('Companies', '/companies')}
              {/* {renderLink('Growth', '/growth')} */}
              {!isAdmin && renderLink('Training', '/training')}
              {!isAdmin && renderLink('Certification', '/certification')}
              {showWhosHiring && renderLink("Who's Hiring", '/', '#whos-hiring-section', true)}
            </div>

          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">

            {currentUser ? (
              <div className="flex items-center gap-2">

                {/* Subscription Plan Status / Upgrade Button */}
                {currentUser?.isPro ? (
                  <button
                    onClick={onOpenPricing}
                    title="You are a PRO Member. Click to manage plan."
                    className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 font-extrabold text-xs flex items-center gap-1.5 hover:bg-amber-500/20 transition-all cursor-pointer shadow-2xs"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>PRO Member</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenPricing}
                    className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-700 hover:to-amber-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    <span>Upgrade to Pro</span>
                  </button>
                )}

                {/* Notification Bell Button -> Redirects to Dashboard Inbox */}
                <Link
                  to="/dashboard?tab=inbox"
                  title="Inbox & Notifications"
                  className="relative p-2.5 rounded-full border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-600 text-[8px] font-extrabold text-white flex items-center justify-center ring-2 ring-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Avatar Circle with Hover Dropdown */}
                <div className="relative group">
                  <Link
                    to="/dashboard"
                    title="User Profile & Account"
                    className="w-9 h-9 rounded-full bg-[#0b132b] hover:border-rose-500 text-white font-extrabold text-xs shadow-sm transition-all flex items-center justify-center border border-slate-200/50 cursor-pointer overflow-hidden"
                  >
                    {(currentUser.avatarUrl || currentUser.avatar_url || currentUser.avatar) ? (
                      <img
                        src={currentUser.avatarUrl || currentUser.avatar_url || currentUser.avatar}
                        alt="User Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </Link>

                  {/* Hover Dropdown Menu */}
                  <div className="absolute right-0 top-full pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-2 space-y-1">

                      {/* User Info Header */}
                      <div className="px-3 py-2.5 border-b border-slate-100 space-y-0.5">
                        <p className="text-xs font-extrabold text-[#0b132b] truncate">
                          {currentUser.name || 'Account Member'}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate font-medium">
                          {currentUser.email || 'member@routek9.com'}
                        </p>
                      </div>

                      {/* My Dashboard Link */}
                      <Link
                        to="/dashboard?tab=profile"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-600 hover:bg-rose-50/70 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-500 group-hover:text-rose-600" />
                        <span>My Dashboard</span>
                      </Link>

                      {/* Log Out Option */}
                      <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Log Out</span>
                      </button>

                    </div>
                  </div>
                </div>

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
                  Register?
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
          <Link to="/planner" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">Route Planner</Link>
          {currentUser && !isCompany && !isAdmin && (
            <Link to="/dispatch-orders" onClick={() => setMobileMenuOpen(false)} className="py-2 text-rose-600 font-extrabold flex items-center justify-between">
              <span>Dispatch Orders</span>
              <span className="px-2 py-0.5 text-[9px] bg-rose-600 text-white rounded-full font-bold uppercase">LIVE</span>
            </Link>
          )}
          <a href="/#government-contracts-section" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">Gov Contracts</a>

          {showBuyRoute && (
            <a href="/#buy-a-route-section" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">Buy a Route</a>
          )}

          <a href="/#calculator-section" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">Profit Calculator</a>
          <Link to="/dashboard?tab=inbox" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-800 flex items-center justify-between">
            <span>Inbox & Notifications</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] bg-rose-600 text-white rounded-full font-bold">{unreadCount} New</span>
            )}
          </Link>
          {(!currentUser || !isDriver) && (
            <Link to="/drivers" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">
              Drivers Directory
            </Link>
          )}
          {(!currentUser || !isCompany) && (
            <Link to="/companies" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">
              Companies Directory
            </Link>
          )}
          {/* <Link to="/growth" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">
            Growth Paths
          </Link> */}
          {!isAdmin && (
            <Link to="/training" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">
              Training Courses
            </Link>
          )}
          {!isAdmin && (
            <Link to="/certification" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">
              Get Certified
            </Link>
          )}
          <button
            onClick={() => { setMobileMenuOpen(false); onOpenPricing(); }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-extrabold text-xs flex items-center justify-between shadow-xs my-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-200" />
              <span>{currentUser?.isPro ? 'PRO Member (Manage Plan)' : 'Upgrade to PRO'}</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold uppercase">
              {currentUser?.isPro ? 'PRO ACTIVE' : '$29/MO'}
            </span>
          </button>

          {/* <Link to="/training" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-rose-600 font-extrabold">Training Library</Link> */}

          {showWhosHiring && (
            <a href="/#whos-hiring-section" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">Who's Hiring</a>
          )}

          {/* <a href="/#faq-section" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-800">FAQ</a> */}

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {currentUser ? (
              <>
                <Link
                  to="/dashboard?tab=profile"
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
