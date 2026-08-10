import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, MapPin, Truck, ArrowRight, TrendingUp, Building2, ShieldCheck, UserCheck, Users2, DollarSign } from 'lucide-react';
import { vehicleTypes } from '../data/mockRoutes';
import { US_STATES } from '../data/statesData';
import { supabase } from '../lib/supabase';

// Local hero images

import heroImg2 from '../assets/hero_cargo_van.png';
import heroImg3 from '../assets/hero_driver_route.png';
import heroImg4 from '../assets/hero_fleet_trucks.png';
import heroImg5 from '../assets/hero_map_dashboard.png';

// Animated Counter Hook Component
function AnimatedCounter({ end, duration = 1600, prefix = '', suffix = '', decimals = 0 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCount(easedProgress * end);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  const formatted = decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString();

  return <>{prefix}{formatted}{suffix}</>;
}

// Hero carousel slides data
const HERO_SLIDES = [
  { src: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80', alt: 'Delivery truck on an American highway route' },
  { src: heroImg2, alt: 'Cargo van courier on highway at golden hour' },
  { src: heroImg3, alt: 'Professional delivery driver with sprinter van' },
  { src: heroImg4, alt: 'Fleet of delivery trucks at logistics distribution hub' },
  { src: heroImg5, alt: 'Route planning dashboard with GPS map tracking' },
];

export default function Hero({
  searchQuery,
  setSearchQuery,
  selectedVehicle,
  setSelectedVehicle,
  onSearch
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputError, setInputError] = useState(false);
  const searchContainerRef = useRef(null);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);

  // Fetch dynamic Last 7 Days (Weekly) Revenue from Supabase transactions table
  useEffect(() => {
    async function fetchWeeklyRevenue() {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*');

        if (data && !error && data.length > 0) {
          const now = new Date();
          const succeededTx = data.filter(tx => {
            if (tx.status !== 'Succeeded') return false;
            const dStr = tx.created_at || tx.date;
            if (!dStr) return true;
            const txDate = new Date(dStr);
            if (isNaN(txDate.getTime())) return true;
            const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
            return diffDays <= 7 && diffDays >= 0;
          });

          const sum = succeededTx.reduce((acc, tx) => {
            if (tx.amount) {
              const num = parseFloat(tx.amount.replace(/[^0-9.]/g, ''));
              return acc + (isNaN(num) ? 0 : num);
            }
            return acc;
          }, 0);

          if (sum > 0) {
            setWeeklyRevenue(sum);
          }
        }
      } catch (err) {
        console.warn("Could not fetch weekly revenue for hero card:", err);
      }
    }
    fetchWeeklyRevenue();
  }, []);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Click outside listener to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToSlide = useCallback((index) => {
    setActiveSlide(index);
  }, []);

  // Filter states and cities based on search input (e.g. typing "ny", "tex", "hou", "cal")
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length === 0) return [];
    const q = searchQuery.trim().toLowerCase();
    const list = [];

    Object.values(US_STATES).forEach((st) => {
      const isCodeMatch = st.code.toLowerCase().startsWith(q) || st.code.toLowerCase() === q;
      const isNameMatch = st.name.toLowerCase().includes(q);
      const matchingCity = st.topCities ? st.topCities.find((c) => c.toLowerCase().includes(q)) : null;

      if (isCodeMatch || isNameMatch || matchingCity) {
        list.push({
          code: st.code,
          name: st.name,
          city: matchingCity,
          openRoutes: st.openRoutes || 0,
          label: matchingCity ? `${matchingCity}, ${st.code} (${st.name})` : `${st.name} (${st.code})`,
          stateObj: st
        });
      }
    });

    return list.slice(0, 6); // Display top 6 suggestions
  }, [searchQuery]);

  const handleFormSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!searchQuery || searchQuery.trim().length === 0) {
      setInputError(true);
      return;
    }
    setInputError(false);
    setShowSuggestions(false);
    if (onSearch) {
      onSearch();
    }
  };

  const handleSelectSuggestion = (item) => {
    setSearchQuery(item.name);
    setInputError(false);
    setShowSuggestions(false);
  };

  return (
    <section id='hero' className="relative bg-gradient-to-b from-slate-50 via-rose-50/30 to-slate-50 pt-10 pb-12 lg:pt-14 lg:pb-20 border-b border-slate-200/60 z-20">

      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* LEFT — Text & Search */}
          <div className="space-y-6">

            {/* Announcement Pill with Tagline */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-rose-200/80 shadow-xs text-xs font-semibold text-rose-700">
              <span className="flex h-2 w-2 rounded-full bg-rose-600 animate-ping" />
              {/* <span className="font-bold uppercase tracking-wider text-[10px] text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-md">Live</span> */}
              <span>
                America's #1 Contract Driver & Courier Route Platform
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-slate-900 tracking-tight leading-[1.12] font-serif-heading">
              Find & Own <span className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 bg-clip-text text-transparent font-serif-heading">Delivery Routes</span> Nationwide
            </h1>

            {/* Short Subtitle */}
            <p className="text-lg text-slate-600 font-normal max-w-lg leading-relaxed">
              Explore courier routes, calculate real profit, and connect with logistics companies across all 50+ states.
            </p>

            {/* Search Bar Form */}
            <form onSubmit={handleFormSubmit} className="bg-white p-3 sm:p-4 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 flex flex-col sm:flex-row gap-3 max-w-xl relative z-30 items-start">

              <div className="flex-1 relative w-full" ref={searchContainerRef}>
                <div className="relative flex items-center">
                  <Search className={`w-5 h-5 absolute left-3.5 z-10 pointer-events-none ${inputError ? 'text-red-500' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    placeholder="City or state (e.g. NY, Texas, Houston)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (inputError) setInputError(false);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className={`w-full pl-11 pr-4 py-3.5 border rounded-xl text-sm transition-all font-medium focus:outline-none ${inputError
                      ? 'border-red-500 ring-2 ring-red-500/20 focus:ring-red-500 focus:border-red-500 text-red-900 bg-red-50/20'
                      : 'border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:bg-white'
                      }`}
                  />
                </div>

                {inputError && (
                  <p className="text-red-500 text-xs font-semibold mt-1.5 pl-1 animate-fadeIn">
                    please select city or state
                  </p>
                )}

                {/* Floating Autocomplete Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-[115%] left-0 w-full sm:w-[380px] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-[999] animate-fadeIn">
                    <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {suggestions.map((item) => (
                        <li
                          key={`${item.code}-${item.city || 'state'}`}
                          onClick={() => handleSelectSuggestion(item)}
                          className="px-4 py-3 hover:bg-rose-50/80 cursor-pointer transition-colors flex items-center justify-between group gap-2"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-rose-100 group-hover:text-rose-600 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0 transition-colors">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                                {item.label}
                              </div>
                              <div className="text-xs text-slate-400 font-medium truncate">
                                {item.openRoutes} Active Routes Available
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="w-full sm:w-44 relative flex items-center">
                <Truck className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
                <select
                  value={selectedVehicle}
                  onChange={(e) => setSelectedVehicle(e.target.value)}
                  className="w-full pl-11 pr-8 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all font-medium appearance-none cursor-pointer"
                >
                  {vehicleTypes.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-base shadow-lg shadow-rose-600/30 hover:shadow-xl hover:shadow-rose-600/40 transition-all flex items-center justify-center gap-2.5 transform active:scale-95 cursor-pointer shrink-0"
              >
                <span>Search</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            {/* Mini Stats Row with Animated Counters */}
            <div className="flex flex-wrap gap-6 pt-2 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <AnimatedCounter end={50} suffix="+ States" />
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-rose-500" />
                <AnimatedCounter end={350} suffix="+ Routes" />
              </span>
              <span className="flex items-center gap-1.5">
                <Users2 className="w-3.5 h-3.5 text-rose-500" />
                <AnimatedCounter end={4500} suffix="+ Drivers" />
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-rose-500" />
                <AnimatedCounter end={3800} suffix="+ Companies" />
              </span>
            </div>
          </div>

          {/* RIGHT — Hero Image Carousel with Dot Navigation */}
          <div className="hidden lg:block relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-300/40 border border-slate-200/60 bg-slate-900 min-h-[420px]">

              {/* Image Slides with Crossfade */}
              {HERO_SLIDES.map((slide, index) => (
                <img
                  key={index}
                  src={slide.src}
                  alt={slide.alt}
                  className={`absolute inset-0 w-full h-[420px] object-cover transition-opacity duration-700 ease-in-out ${index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                />
              ))}

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent pointer-events-none z-20" />

              {/* Dot Navigation */}
              <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-2 rounded-full">
                {HERO_SLIDES.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    className={`rounded-full transition-all duration-300 cursor-pointer ${index === activeSlide
                      ? 'w-6 h-2.5 bg-rose-500 shadow-sm shadow-rose-500/40'
                      : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
                      }`}
                  />
                ))}
              </div>

              {/* Floating stat cards on image with Animated Counters */}
              <div className="absolute bottom-5 left-5 right-5 flex gap-3 z-30">

                <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg flex-1 text-center">
                  <div className="text-xl sm:text-2xl font-extrabold text-rose-600 font-serif-heading">
                    <AnimatedCounter end={weeklyRevenue} prefix="$" decimals={2} />
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Weekly Revenue</div>
                </div>

                <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg flex-1 text-center">
                  <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 font-serif-heading">
                    <AnimatedCounter end={35} suffix="%" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Net Margin</div>
                </div>

                <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-lg flex-1 text-center">
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900 font-serif-heading">
                    <AnimatedCounter end={50} suffix="+" />
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">States Covered</div>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
