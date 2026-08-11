import React, { useState, useEffect } from 'react';
import * as topojson from 'topojson-client';
import { geoAlbersUsa, geoPath } from 'd3-geo';
import { US_STATES } from '../data/statesData';

// Official US Atlas 10m States TopoJSON URL
const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// FIPS Code to State Abbreviation Mapping
const FIPS_TO_STATE = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE",
  "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA",
  "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
  "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM",
  "36": "NY", "37": "NC", "38": "ND", "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
  "54": "WV", "55": "WI", "56": "WY"
};

export default function USMap({ selectedState, onSelectState }) {
  const [geographies, setGeographies] = useState([]);
  const [hoveredState, setHoveredState] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Load TopoJSON data & generate SVG path strings with Albers USA projection
  useEffect(() => {
    fetch(GEO_URL)
      .then((res) => res.json())
      .then((us) => {
        const projection = geoAlbersUsa().scale(1000).translate([490, 260]);
        const pathGenerator = geoPath().projection(projection);
        
        const features = topojson.feature(us, us.objects.states).features;
        const mappedGeos = features.map((feature) => {
          const fips = String(feature.id).padStart(2, '0');
          const code = FIPS_TO_STATE[fips];
          const pathD = pathGenerator(feature);
          const centroid = pathGenerator.centroid(feature);
          return {
            id: fips,
            code,
            d: pathD,
            centroid: (centroid && !isNaN(centroid[0])) ? centroid : null,
            stateData: US_STATES[code] || null
          };
        }).filter(item => item.d);

        setGeographies(mappedGeos);
      })
      .catch((err) => {
        console.error("Error loading US map TopoJSON:", err);
      });
  }, []);

  const handleMouseMove = (e) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top
    });
  };

  const isNearTop = tooltipPos.y < 85;

  return (
    <div 
      className="relative w-full aspect-[16/10] flex items-center justify-center overflow-visible p-2 select-none"
      onMouseMove={handleMouseMove}
    >
      {/* SVG Glow Filter Definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="state-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Main SVG Map Canvas matching user's rsm-svg class structure */}
      <svg
        viewBox="0 0 980 560"
        className="rsm-svg w-full h-full drop-shadow-xs"
        style={{ width: '100%', height: 'auto' }}
      >
        <g className="rsm-geographies">
          {geographies.map((geo) => {
            const isSelected = selectedState?.code === geo.code;
            const isHovered = hoveredState?.code === geo.code;

            return (
              <g key={geo.id} className="state-group cursor-pointer">
                <path
                  tabIndex={0}
                  className={`rsm-geography state-path ${isSelected ? 'selected' : ''}`}
                  d={geo.d}
                  onClick={() => {
                    if (geo.stateData) onSelectState(geo.stateData);
                  }}
                  onMouseEnter={() => {
                    if (geo.stateData) setHoveredState(geo.stateData);
                  }}
                  onMouseLeave={() => setHoveredState(null)}
                  style={{
                    fill: isSelected ? "#ef4444" : "#efece6",
                    stroke: isSelected ? "#b91c1c" : "#5c6b80",
                    strokeWidth: isSelected ? 1.5 : 0.75,
                    outline: "none",
                    transition: "fill 220ms, filter 220ms, stroke 220ms",
                    filter: isSelected || isHovered ? "url(#state-glow)" : "none",
                    cursor: "pointer",
                  }}
                />

                {/* State 2-Letter Abbreviation Labels directly on map */}
                {geo.code && geo.centroid && (
                  <text
                    x={geo.centroid[0]}
                    y={geo.centroid[1]}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="pointer-events-none font-bold text-[9px] select-none"
                    style={{
                      fill: isSelected ? "#ffffff" : "#475569",
                      fontSize: ["RI", "DC", "DE", "MD", "VT", "NH", "CT", "MA", "NJ"].includes(geo.code) ? "7px" : "9px",
                      fontWeight: 800,
                      fontFamily: "Inter, system-ui, sans-serif",
                      pointerEvents: "none",
                      letterSpacing: "-0.02em"
                    }}
                  >
                    {geo.code}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredState && (
        <div
          className={`absolute z-30 pointer-events-none bg-slate-900/95 text-white text-xs px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700/60 flex flex-col gap-0.5 transition-all duration-100 transform -translate-x-1/2 ${
            isNearTop ? 'translate-y-4' : '-translate-y-full'
          }`}
          style={{
            left: `${tooltipPos.x}px`,
            top: `${isNearTop ? tooltipPos.y + 12 : tooltipPos.y - 12}px`,
          }}
        >
          <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {hoveredState.name} ({hoveredState.code})
          </div>
          <div className="text-[11px] text-slate-300 font-semibold">
            {hoveredState.openRoutes} Open Routes • {hoveredState.routesForSale} For Sale
          </div>
        </div>
      )}

    </div>
  );
}
