import React from 'react';
import USMap from './USMap';
import StateDetailCard from './StateDetailCard';

export default function MapSection({ selectedState, onSelectState, onFilterCategory }) {
  return (
    <section id="map-section" className="py-16 lg:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 space-y-2">
          
          {/* Badge line */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-0.5 bg-rose-600 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
              EVERY STATE
            </span>
          </div>

          {/* Main Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Explore contract routes on the map
          </h2>

          {/* Subtitle */}
          <p className="text-slate-600 text-sm max-w-2xl font-normal leading-relaxed">
            Tap a state to see open routes, listings for sale, and businesses hiring couriers.
          </p>

        </div>

        {/* 2-Column Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Map Column */}
          <div className="lg:col-span-7">
            <USMap 
              selectedState={selectedState} 
              onSelectState={onSelectState} 
            />
          </div>

          {/* Selected State Side Card Column */}
          <div className="lg:col-span-5">
            <StateDetailCard 
              state={selectedState} 
              onSelectState={onSelectState}
              onFilterCategory={onFilterCategory} 
            />
          </div>

        </div>

      </div>
    </section>
  );
}
