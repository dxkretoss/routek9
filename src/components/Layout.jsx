import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ currentUser, onLogout, onOpenPricing }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900 font-sans selection:bg-rose-600 selection:text-white">
      <Navbar currentUser={currentUser} onLogout={onLogout} onOpenPricing={onOpenPricing} />
      <Outlet />
      <Footer />
    </div>
  );
}
