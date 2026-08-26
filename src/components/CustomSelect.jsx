import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, CheckCircle2, Search, X } from 'lucide-react';

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  searchable = undefined,
  searchPlaceholder = 'Search...',
  icon: Icon = null,
  className = '',
  buttonClassName = '',
  maxHeight = 'max-h-52',
  placement = 'auto', // 'auto', 'bottom', 'top'
  disabled = false,
  id
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Determine dropdown placement (upwards vs downwards)
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (placement === 'top') {
        setOpenUpward(true);
      } else if (placement === 'bottom') {
        setOpenUpward(false);
      } else {
        // Auto-calculate available space
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const estimatedHeight = 260;

        if (spaceBelow < estimatedHeight && spaceAbove > 180) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }
    }
  }, [isOpen, placement]);

  // Normalize options to { value, label, sublabel }
  const normalizedOptions = React.useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { value: opt, label: String(opt) };
      }
      if (opt && typeof opt === 'object') {
        // e.g. { code: 'TX', name: 'Texas' }
        if (opt.code && opt.name) {
          return {
            value: opt.code,
            label: `${opt.code} - ${opt.name}`,
            searchText: `${opt.code} ${opt.name}`
          };
        }
        return {
          value: opt.value !== undefined ? opt.value : opt.id || opt.key,
          label: opt.label || opt.name || opt.title || String(opt.value || ''),
          sublabel: opt.sublabel || opt.description,
          searchText: `${opt.label || opt.name || ''} ${opt.value || ''} ${opt.sublabel || ''}`
        };
      }
      return { value: '', label: '' };
    });
  }, [options]);

  const isSearchEnabled = searchable !== undefined ? searchable : normalizedOptions.length > 7;

  // Find currently selected option
  const selectedOption = React.useMemo(() => {
    return normalizedOptions.find(opt => String(opt.value).toLowerCase() === String(value || '').toLowerCase());
  }, [normalizedOptions, value]);

  // Filter options by search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(opt => {
      const searchTarget = (opt.searchText || opt.label || String(opt.value)).toLowerCase();
      return searchTarget.includes(q);
    });
  }, [normalizedOptions, searchQuery]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && isSearchEnabled && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, isSearchEnabled]);

  const handleSelect = (optValue) => {
    if (onChange) onChange(optValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef} id={id}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none flex items-center justify-between text-left cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? 'ring-2 ring-rose-500/30 border-rose-500 bg-white' : 'hover:border-slate-300'
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
          {Icon && (
            <span className="text-slate-400 shrink-0 flex items-center justify-center">
              {React.isValidElement(Icon) ? (
                Icon
              ) : (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null)) ? (
                <Icon className="w-4 h-4" />
              ) : null}
            </span>
          )}
          <span className={`truncate ${selectedOption ? 'text-slate-800 font-bold' : 'text-slate-400 font-normal'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-rose-500' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {isSearchEnabled && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/70 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-rose-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          <div className={`${maxHeight} overflow-y-auto custom-scrollbar p-1`}>
            {filteredOptions.length === 0 ? (
              <div className="py-3 px-4 text-xs text-slate-400 text-center font-medium italic">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = selectedOption && String(selectedOption.value).toLowerCase() === String(opt.value).toLowerCase();
                return (
                  <button
                    key={`${opt.value}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full px-3.5 py-2 text-left text-xs font-bold rounded-xl transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-rose-50 text-rose-600 font-extrabold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="truncate flex-1 min-w-0 pr-2">
                      <span className="block truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="block text-[10px] text-slate-400 font-medium truncate mt-0.5">{opt.sublabel}</span>
                      )}
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
