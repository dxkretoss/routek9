import React from 'react';
import { Truck, MapPin, ShieldCheck, Mail, Phone, Heart } from 'lucide-react';
import { US_STATES } from '../data/statesData';

export default function Footer({ onSelectState }) {
  const topStates = ['NV', 'CA', 'TX', 'FL', 'NY', 'IL', 'GA', 'WA', 'CO', 'OH'];

  return (
    <footer className="bg-slate-900 text-white pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/30">
                <Truck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Route<span className="text-rose-500">K9</span>
              </span>
            </div>
            
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              The premier nationwide marketplace for independent courier contract routes, turnkey delivery businesses for sale, and local commercial logistics contracts.
            </p>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" /> Verified Listings
              </span>
              <span>•</span>
              <span>All 50 US States</span>
            </div>
          </div>

          {/* Col 2: Top States Quick Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-500 mb-4">
              Top States Directory
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-300">
              {topStates.map((code) => {
                const state = US_STATES[code];
                return (
                  <li key={code}>
                    <button
                      onClick={() => {
                        onSelectState(state);
                        window.scrollTo({ top: document.getElementById('map-section')?.offsetTop - 80, behavior: 'smooth' });
                      }}
                      className="hover:text-rose-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-rose-500" />
                      {state.name} ({state.code}) Routes
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-500 mb-4">
              Contract Types
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-300">
              <li><a href="#routes-section" className="hover:text-rose-400 transition-colors">Dedicated Linehaul</a></li>
              <li><a href="#routes-section" className="hover:text-rose-400 transition-colors">Medical & Stat Courier</a></li>
              <li><a href="#routes-section" className="hover:text-rose-400 transition-colors">FedEx & Amazon Delivery</a></li>
              <li><a href="#routes-section" className="hover:text-rose-400 transition-colors">Turnkey Routes for Sale</a></li>
              <li><a href="#routes-section" className="hover:text-rose-400 transition-colors">Cargo Van Contracts</a></li>
              <li><a href="#routes-section" className="hover:text-rose-400 transition-colors">Box Truck Linehauls</a></li>
            </ul>
          </div>

          {/* Col 4: Platform & Support */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-500 mb-4">
              Platform & Legal
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-300">
              <li><a href="#map-section" className="hover:text-rose-400 transition-colors">Interactive US Map</a></li>
              <li><a href="#routes-section" className="hover:text-rose-400 transition-colors">Post a Route Listing</a></li>
              <li><span className="text-slate-400">Carrier Verification</span></li>
              <li><span className="text-slate-400">Terms of Service</span></li>
              <li><span className="text-slate-400">Privacy Policy</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <div>
            © {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME || 'RouteK9 Inc.'}. All rights reserved.
          </div>
          
          <div className="flex items-center gap-2">
            <span>Powered by React + Vite + Tailwind CSS</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
