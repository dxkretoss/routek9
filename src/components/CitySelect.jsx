import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, ChevronDown, CheckCircle2, Plus, X } from 'lucide-react';
import { STATE_METRO_CITIES } from '../data/statesData';

export default function CitySelect({
  value = '',
  onChange,
  stateCode = '',
  placeholder = 'e.g. Houston',
  className = '',
  inputClassName = '',
  disabled = false,
  required = false,
  placement = 'auto', // 'auto', 'top', 'bottom'
  maxHeight = 'max-h-52',
  id
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Available cities for the given state, or popular general fallback cities
  const availableCities = useMemo(() => {
    const code = (stateCode || '').trim().toUpperCase();
    if (code && STATE_METRO_CITIES[code]) {
      return STATE_METRO_CITIES[code];
    }
    // Fallback: all major US metro cities
    return [
      "Houston", "Dallas", "Austin", "San Antonio", "Los Angeles", "San Diego",
      "San Francisco", "Chicago", "Miami", "Orlando", "Atlanta", "Phoenix",
      "Denver", "Seattle", "New York City", "Philadelphia", "Boston", "Las Vegas"
    ];
  }, [stateCode]);

  // Filter cities by what user has typed so far
  const filteredCities = useMemo(() => {
    const q = (value || '').toLowerCase().trim();
    if (!q) return availableCities;
    return availableCities.filter(c => c.toLowerCase().includes(q));
  }, [availableCities, value]);

  // Check if typed value matches an exact city
  const isExactMatch = useMemo(() => {
    const q = (value || '').toLowerCase().trim();
    return availableCities.some(c => c.toLowerCase() === q);
  }, [availableCities, value]);

  // Auto-Placement (upwards vs downwards)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (placement === 'top') {
        setOpenUpward(true);
      } else if (placement === 'bottom') {
        setOpenUpward(false);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const estimatedHeight = 240;

        if (spaceBelow < estimatedHeight && spaceAbove > 160) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }
    }
  }, [isOpen, placement]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCity = (cityName) => {
    if (onChange) onChange(cityName);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    if (onChange) onChange(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef} id={id}>
      <div className="relative">
        <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className={`w-full pl-10 pr-9 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all disabled:opacity-50 ${
            isOpen ? 'ring-2 ring-rose-500/30 border-rose-500 bg-white' : 'hover:border-slate-300'
          } ${inputClassName}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setIsOpen(prev => !prev);
            if (!isOpen) inputRef.current?.focus();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-rose-500' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {stateCode && (
            <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Suggested Cities for {stateCode}</span>
              <span className="text-[9px] text-slate-400 font-normal lowercase italic">or type custom</span>
            </div>
          )}

          <div className={`${maxHeight} overflow-y-auto custom-scrollbar p-1`}>
            {/* Custom typed option if not exact match */}
            {value.trim() && !isExactMatch && (
              <button
                type="button"
                onClick={() => handleSelectCity(value.trim())}
                className="w-full px-3 py-2 text-left text-xs font-bold rounded-xl transition-colors flex items-center justify-between cursor-pointer bg-rose-50/50 hover:bg-rose-50 text-rose-600 border border-dashed border-rose-200 mb-1"
              >
                <div className="flex items-center gap-2 truncate">
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Use custom city: <strong className="font-extrabold underline">{value.trim()}</strong></span>
                </div>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-rose-100 rounded text-rose-700 shrink-0 ml-1">Custom</span>
              </button>
            )}

            {filteredCities.length === 0 && !value.trim() ? (
              <div className="py-3 px-4 text-xs text-slate-400 text-center font-medium italic">
                No cities found. Type any custom city.
              </div>
            ) : (
              filteredCities.map((city, idx) => {
                const isSelected = value.trim().toLowerCase() === city.toLowerCase();
                return (
                  <button
                    key={`${city}-${idx}`}
                    type="button"
                    onClick={() => handleSelectCity(city)}
                    className={`w-full px-3.5 py-2 text-left text-xs font-bold rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50 text-rose-600 font-extrabold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-rose-500' : 'text-slate-400'}`} />
                      <span className="truncate">{city}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
