import React, { useState, useMemo } from 'react';
import RouteCard from './RouteCard';
import { routeCategories, vehicleTypes } from '../data/mockRoutes';
import { Search, Filter, X, Truck, CheckCircle2, SlidersHorizontal } from 'lucide-react';

export default function RouteList({ 
  routes, 
  activeCategory, 
  setActiveCategory, 
  selectedState, 
  onClearState,
  onViewDetails 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('All Vehicles');

  // Filter routes based on Category, Selected State, Vehicle type, and Search input
  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      // Category filter
      if (activeCategory !== 'all' && r.category !== activeCategory) {
        return false;
      }
      // State filter
      if (selectedState && r.stateCode !== selectedState.code) {
        return false;
      }
      // Vehicle filter
      if (vehicleFilter !== 'All Vehicles' && !r.vehicleRequired.toLowerCase().includes(vehicleFilter.toLowerCase())) {
        return false;
      }
      // Text search
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(query);
        const matchCity = r.city.toLowerCase().includes(query);
        const matchState = r.stateName.toLowerCase().includes(query);
        const matchCompany = r.company.toLowerCase().includes(query);
        const matchType = r.routeType.toLowerCase().includes(query);
        if (!matchTitle && !matchCity && !matchState && !matchCompany && !matchType) {
          return false;
        }
      }
      return true;
    });
  }, [routes, activeCategory, selectedState, vehicleFilter, searchTerm]);

  return (
    <section id="routes-section" className="py-16 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest text-rose-600 mb-1">
              LIVE MARKETPLACE DIRECTORY
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {selectedState ? `Routes & Listings in ${selectedState.name}` : 'All Contract & Courier Listings'}
            </h2>
          </div>

          {/* Active State Filter Pill if selected */}
          {selectedState && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
              <span>State Filter: {selectedState.name} ({selectedState.code})</span>
              <button 
                onClick={onClearState} 
                className="p-0.5 rounded-full hover:bg-rose-200 text-rose-700 cursor-pointer"
                title="Show all states"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-8 space-y-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {routeCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search & Vehicle Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100">
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search route specs, keywords, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="sm:col-span-4 relative">
              <select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none cursor-pointer"
              >
                {vehicleTypes.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Route Cards Grid */}
        {filteredRoutes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoutes.map((route) => (
              <RouteCard 
                key={route.id} 
                route={route} 
                onViewDetails={onViewDetails} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Matching Listings Found</h3>
            <p className="text-xs text-slate-500 mb-4">
              Try resetting your filters or selecting a different state on the map.
            </p>
            <button
              onClick={() => {
                onClearState();
                setActiveCategory('all');
                setSearchTerm('');
                setVehicleFilter('All Vehicles');
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Reset All Filters
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
