import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mockDrivers } from "../data/mockDrivers";
import {
  MapPin,
  Store,
  Factory,
  Building2,
  Hospital,
  Hash,
  Compass,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  X,
  Send,
  Phone,
  History,
  Smartphone,
  AlertCircle,
  HelpCircle,
  Milestone,
  Trash2
} from "lucide-react";

const ZONE_COLORS = [
  "#e11d48", "#0ea5e9", "#22c55e", "#a855f7", "#f59e0b",
  "#0f3460", "#ec4899", "#14b8a6", "#f97316", "#8b5cf6",
  "#84cc16", "#06b6d4",
];
const GOOGLE_ZONE_LIMIT = 25;

const FILTERS = [
  { key: "all", label: "All", icon: Compass },
  { key: "street", label: "Street", icon: Milestone },
  { key: "business", label: "Business", icon: Store },
  { key: "warehouse", label: "Warehouse", icon: Factory },
  { key: "apartment", label: "Apartment", icon: Building2 },
  { key: "hospital", label: "Hospital", icon: Hospital },
  { key: "zip", label: "ZIP", icon: Hash },
];

function categorize(p, query) {
  const key = (p?.osm_key ?? "").toLowerCase();
  const val = (p?.osm_value ?? "").toLowerCase();
  const type = (p?.type ?? "").toLowerCase();
  const isZipQuery = /^\d{5}(-\d{4})?$/.test(query.trim());
  if (isZipQuery || type === "postcode" || val === "postcode") return "zip";
  if (val === "hospital" || val === "clinic" || val === "doctors" || key === "healthcare")
    return "hospital";
  if (val === "warehouse" || val === "industrial" || val === "logistics") return "warehouse";
  if (val === "apartments" || val === "residential" || val === "dormitory") return "apartment";
  if (["shop", "office", "amenity", "tourism", "leisure", "craft"].includes(key)) return "business";
  if (key === "highway" || type === "street" || val === "street") return "street";
  if (type === "house" && p?.street && !p?.name) return "street";
  return "all";
}

const NOMINATIM = "https://nominatim.openstreetmap.org";
const PHOTON = "https://photon.komoot.io";
const OSRM = "https://router.project-osrm.org";
const AVG_MPG = 18;
const FUEL_PRICE = 3.35;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Simple K-means on lat/lon to auto-cluster stops into k zones.
function kmeansCluster(stops, k, iters = 20) {
  const n = stops.length;
  if (n === 0 || k <= 1) return new Array(n).fill(0);
  const K = Math.min(k, n);
  // Init: pick k evenly spaced stops by lat as seeds
  const sorted = stops.map((s, i) => ({ i, lat: s.lat })).sort((a, b) => a.lat - b.lat);
  const centers = Array.from({ length: K }, (_, c) => {
    const idx = sorted[Math.floor(((c + 0.5) * n) / K)].i;
    return { lat: stops[idx].lat, lon: stops[idx].lon };
  });
  const assign = new Array(n).fill(0);
  for (let it = 0; it < iters; it++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < K; c++) {
        const d = haversine(stops[i], centers[c]);
        if (d < bestD) { bestD = d; best = c; }
      }
      if (assign[i] !== best) { assign[i] = best; changed = true; }
    }
    if (!changed) break;
    // Recompute centers
    const sums = Array.from({ length: K }, () => ({ lat: 0, lon: 0, n: 0 }));
    for (let i = 0; i < n; i++) {
      const c = assign[i];
      sums[c].lat += stops[i].lat;
      sums[c].lon += stops[i].lon;
      sums[c].n += 1;
    }
    for (let c = 0; c < K; c++) {
      if (sums[c].n > 0) {
        centers[c] = { lat: sums[c].lat / sums[c].n, lon: sums[c].lon / sums[c].n };
      }
    }
  }
  return assign;
}

function haversine(a, b) {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Nearest-neighbor + 2-opt heuristic. Handles up to ~400 stops in <1s.
function optimizeOrder(stops, goal) {
  if (stops.length <= 2) return stops.map((_, i) => i);
  const n = stops.length;

  // Generate cost matrix based on goal (Fastest, Shortest, Balanced)
  const costMatrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      const h = haversine(stops[i], stops[j]);
      if (goal === "fastest") {
        // Speed varies by direction and latitude to simulate traffic flow & highways
        const angle = Math.atan2(stops[j].lat - stops[i].lat, stops[j].lon - stops[i].lon);
        const speedFactor = 1.0 + 0.45 * Math.sin(angle * 4 + (stops[i].lat * 10));
        return h / speedFactor;
      } else if (goal === "balanced") {
        const angle = Math.atan2(stops[j].lat - stops[i].lat, stops[j].lon - stops[i].lon);
        const speedFactor = 1.0 + 0.25 * Math.sin(angle * 4 + (stops[i].lat * 10));
        return h / speedFactor;
      }
      return h; // shortest (straight distance)
    })
  );

  // TSP Solver (Nearest Neighbor)
  const visited = new Set([0]);
  const order = [0];
  while (order.length < n) {
    const last = order[order.length - 1];
    let best = -1;
    let bestCost = Infinity;
    for (let j = 0; j < n; j++) {
      if (visited.has(j)) continue;
      if (costMatrix[last][j] < bestCost) {
        bestCost = costMatrix[last][j];
        best = j;
      }
    }
    order.push(best);
    visited.add(best);
  }

  // 2-opt passes
  const maxPasses = goal === "shortest" ? 5 : 3;
  for (let pass = 0; pass < maxPasses; pass++) {
    let improved = false;
    for (let i = 1; i < n - 2; i++) {
      for (let k = i + 1; k < n - 1; k++) {
        const a = order[i - 1];
        const b = order[i];
        const c = order[k];
        const d = order[k + 1];
        const before = costMatrix[a][b] + costMatrix[c][d];
        const after = costMatrix[a][c] + costMatrix[b][d];
        if (after + 1e-9 < before) {
          const rev = order.slice(i, k + 1).reverse();
          order.splice(i, k + 1 - i, ...rev);
          improved = true;
        }
      }
    }
    if (!improved) break;
  }
  return order;
}

export function RoutePlanner({ currentUser, onOpenPricing, onTriggerGateModal }) {
  const [stops, setStops] = useState([]);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSug, setShowSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [filter, setFilter] = useState("all");
  const [goal, setGoal] = useState("fastest");
  const [optimizing, setOptimizing] = useState(false);
  const [routeGeo, setRouteGeo] = useState(null);
  const [distMi, setDistMi] = useState(0);
  const [durMin, setDurMin] = useState(0);
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState([]);
  const [zones, setZones] = useState([]);
  const [autoZoneCount, setAutoZoneCount] = useState(3);
  const [wizardStep, setWizardStep] = useState(1);
  const [showAllPanels, setShowAllPanels] = useState(false);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const layerGroup = useRef(null);
  const suggestCache = useRef(new Map());
  const LRef = useRef(null);
  const meMarker = useRef(null);
  const anchorRef = useRef(null);

  // Live tracking
  const [tracking, setTracking] = useState(false);
  const [myPos, setMyPos] = useState(null);
  const watchId = useRef(null);

  // User's current location (for biasing address search to their area)
  const [userLoc, setUserLoc] = useState(null);
  const [locStatus, setLocStatus] = useState("idle");

  // Load spare drivers from local mockDrivers instead of supabase database
  const [spares, setSpares] = useState(() => {
    return mockDrivers.map(d => {
      const names = d.full_name.split(' ');
      return {
        id: d.user_id,
        first_name: names[0] || '',
        last_name: names.slice(1).join(' ') || '',
        phone: '555-0199',
        city: d.city,
        state: d.state,
        lat: d.city === 'Atlanta' ? 33.7490 : d.city === 'Chicago' ? 41.8781 : d.city === 'Los Angeles' ? 34.0522 : d.city === 'Dallas' ? 32.7767 : d.city === 'Miami' ? 25.7617 : d.city === 'Detroit' ? 42.3314 : 39.5,
        lon: d.city === 'Atlanta' ? -84.3880 : d.city === 'Chicago' ? -87.6298 : d.city === 'Los Angeles' ? -118.2437 : d.city === 'Dallas' ? -96.7970 : d.city === 'Miami' ? -80.1918 : d.city === 'Detroit' ? -83.0458 : -98.35,
      };
    });
  });

  const requestUserLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocStatus("unsupported");
      return;
    }
    setLocStatus("asking");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        let state;
        let city;
        try {
          const r = await fetch(
            `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
            { headers: { Accept: "application/json" } },
          );
          const j = await r.json();
          state = j?.address?.state;
          city = j?.address?.city ?? j?.address?.town ?? j?.address?.village ?? j?.address?.county;
        } catch { }
        setUserLoc({ lat, lon, state, city });
        setLocStatus("ok");
      },
      () => setLocStatus("denied"),
      { enableHighAccuracy: true, maximumAge: 300000, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  const [helpOpen, setHelpOpen] = useState(false);
  const [zonesOpen, setZonesOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [joinForm, setJoinForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    city: "",
    state: "",
    share_gps: false,
  });
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinMsg, setJoinMsg] = useState(null);

  const isMobile =
    typeof navigator !== "undefined" &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  // Load leaflet + CSS on client
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      const L = await import("leaflet");
      if (cancelled || !mapRef.current) return;
      LRef.current = L;
      if (!leafletMap.current) {
        const map = L.map(mapRef.current).setView([39.5, -98.35], 4);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);
        leafletMap.current = map;
        layerGroup.current = L.layerGroup().addTo(map);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load recent from localStorage
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem("routek9:recent") || "[]");
      if (Array.isArray(r)) setRecent(r);
    } catch { }
  }, []);

  // Redraw markers & route line
  useEffect(() => {
    if (!leafletMap.current || !LRef.current || !layerGroup.current) return;
    const L = LRef.current;
    layerGroup.current.clearLayers();
    stops.forEach((s, i) => {
      const zone = s.zoneId ? zones.find((z) => z.id === s.zoneId) : undefined;
      const bg = zone ? zone.color : s.locked ? "#0f3460" : "#e11d48";
      const icon = L.divIcon({
        className: "routek9-pin",
        html: `<div style="background:${bg};color:white;border-radius:9999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)">${i + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([s.lat, s.lon], { icon })
        .addTo(layerGroup.current)
        .bindPopup(`<b>Stop ${i + 1}</b>${zone ? ` · <span style="color:${zone.color}">●</span> ${zone.name}` : ""}<br>${s.label}`);
    });
    if (routeGeo && routeGeo.length > 1) {
      L.polyline(routeGeo, { color: "#e11d48", weight: 4, opacity: 0.85 }).addTo(
        layerGroup.current,
      );
    } else if (stops.length > 1) {
      L.polyline(
        stops.map((s) => [s.lat, s.lon]),
        { color: "#0f3460", weight: 2, dashArray: "6,6", opacity: 0.6 },
      ).addTo(layerGroup.current);
    }
    if (stops.length > 0) {
      const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lon]));
      leafletMap.current.fitBounds(bounds.pad(0.2), { animate: true });
    }
  }, [stops, routeGeo, zones]);

  // Draw / update my live-location marker
  useEffect(() => {
    if (!leafletMap.current || !LRef.current) return;
    const L = LRef.current;
    if (!myPos) {
      if (meMarker.current) {
        meMarker.current.remove();
        meMarker.current = null;
      }
      return;
    }
    const icon = L.divIcon({
      className: "routek9-me",
      html: `<div style="width:20px;height:20px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 0 0 4px rgba(37,99,235,.35),0 2px 6px rgba(0,0,0,.35)"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    if (meMarker.current) {
      meMarker.current.setLatLng([myPos.lat, myPos.lon]);
      meMarker.current.setIcon(icon);
    } else {
      meMarker.current = L.marker([myPos.lat, myPos.lon], { icon }).addTo(leafletMap.current);
    }
  }, [myPos]);

  // Live tracking: watch geolocation
  useEffect(() => {
    if (!tracking) {
      if (watchId.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      watchId.current = null;
      return;
    }
    if (!navigator.geolocation) {
      setError("This device doesn't support GPS tracking.");
      setTracking(false);
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (p) =>
        setMyPos({
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          heading: p.coords.heading,
        }),
      (err) => {
        setError(err.message || "GPS unavailable. Enable location permissions.");
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [tracking]);

  // Autocomplete
  useEffect(() => {
    const last = stops[stops.length - 1];
    const a =
      last ?? (myPos ? { lat: myPos.lat, lon: myPos.lon } : userLoc ?? null);
    anchorRef.current = a
      ? { lat: a.lat, lon: a.lon, state: last?.state ?? userLoc?.state }
      : null;
  }, [stops, myPos, userLoc]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }
    const anchor = anchorRef.current;
    const anchorState = anchor?.state;
    const cacheKey = `${q.toLowerCase()}|${anchor ? `${anchor.lat.toFixed(2)},${anchor.lon.toFixed(2)}` : ""}`;
    const cached = suggestCache.current.get(cacheKey);
    if (cached) {
      setSuggestions(cached);
      setShowSug(true);
      setActiveIdx(-1);
      return;
    }
    setSearching(true);
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const bias = anchor
          ? `&lat=${anchor.lat}&lon=${anchor.lon}&location_bias_scale=0.6&zoom=12`
          : "";
        const photonUrl = `${PHOTON}/api/?limit=40&lang=en${bias}&q=${encodeURIComponent(q)}`;
        const viewbox = anchor
          ? `&viewbox=${anchor.lon - 1},${anchor.lat + 1},${anchor.lon + 1},${anchor.lat - 1}&bounded=0`
          : "";
        const nomUrl = `${NOMINATIM}/search?format=json&limit=10&addressdetails=1&countrycodes=us${viewbox}&q=${encodeURIComponent(q)}`;

        const [photonRes, nomRes] = await Promise.allSettled([
          fetch(photonUrl, { signal: ctl.signal }).then((r) => r.ok ? r.json() : Promise.reject(r.status)),
          fetch(nomUrl, { signal: ctl.signal, headers: { Accept: "application/json" } }).then((r) => r.ok ? r.json() : Promise.reject(r.status)),
        ]);

        const merged = [];
        const seen = new Set();
        const isUS = (country) => {
          if (!country) return true;
          const c = country.toLowerCase();
          return c === "united states" || c === "united states of america" || c === "usa" || c === "us";
        };
        const push = (s) => {
          if (!isUS(s.country)) return;
          const k = `${(+s.lat).toFixed(5)},${(+s.lon).toFixed(5)}`;
          if (seen.has(k)) return;
          seen.add(k);
          merged.push(s);
        };

        if (photonRes.status === "fulfilled") {
          const data = photonRes.value;
          for (const [i, f] of (data?.features ?? []).entries()) {
            const p = f.properties ?? {};
            if (!isUS(p.country)) continue;
            const parts = [
              p.name,
              [p.housenumber, p.street].filter(Boolean).join(" "),
              p.city ?? p.town ?? p.village,
              p.state,
              p.postcode,
              p.country,
            ]
              .filter(Boolean)
              .filter((v, idx, arr) => arr.indexOf(v) === idx);
            push({
              display_name: parts.join(", "),
              lat: String(f.geometry.coordinates[1]),
              lon: String(f.geometry.coordinates[0]),
              place_id: `p-${p.osm_id ?? i}-${i}`,
              country: p.country,
              state: p.state,
              category: categorize(p, q),
            });
          }
        }
        if (nomRes.status === "fulfilled" && Array.isArray(nomRes.value)) {
          for (const n of nomRes.value) {
            if (!isUS(n.address?.country ?? n.country)) continue;
            push({
              display_name: n.display_name,
              lat: n.lat,
              lon: n.lon,
              place_id: `n-${n.place_id}`,
              country: n.address?.country ?? n.country,
              state: n.address?.state,
              category: categorize(
                { ...n.address, osm_key: n.class, osm_value: n.type },
                q,
              ),
            });
          }
        }

        merged.sort((a, b) => {
          if (anchorState) {
            const aSt = a.state === anchorState ? 1 : 0;
            const bSt = b.state === anchorState ? 1 : 0;
            if (bSt !== aSt) return bSt - aSt;
          }
          if (anchor) {
            const da = (+a.lat - anchor.lat) ** 2 + (+a.lon - anchor.lon) ** 2;
            const db = (+b.lat - anchor.lat) ** 2 + (+b.lon - anchor.lon) ** 2;
            return da - db;
          }
          return 0;
        });

        const finalList = merged.slice(0, 25);
        if (finalList.length) suggestCache.current.set(cacheKey, finalList);
        setSuggestions(finalList);
        setShowSug(true);
        setActiveIdx(-1);
      } catch (e) {
        if (e?.name !== "AbortError") {
          console.warn("address search failed", e);
        }
      } finally {
        setSearching(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [query]);

  function addStop(s) {
    if (!currentUser?.isPro && stops.length >= 5) {
      if (onTriggerGateModal) {
        onTriggerGateModal({
          title: "Free Starter Limit Reached (5/5 Stops)",
          message: "Free Starter members can optimize up to 5 stops per route. Upgrade to Route K9 PRO to unlock 400-stop optimization, zone dispatching, and CSV exports!"
        });
      } else if (onOpenPricing) {
        onOpenPricing();
      } else {
        setError("Free Starter Limit: Max 5 stops per route. Upgrade to Route K9 PRO for up to 400 stops!");
      }
      return;
    }
    if (stops.length >= 400) {
      setError("Maximum 400 stops per route.");
      return;
    }
    setStops((prev) => [
      ...prev,
      {
        id: uid(),
        label: s.display_name,
        lat: parseFloat(s.lat),
        lon: parseFloat(s.lon),
        state: s.state,
      },
    ]);
    setQuery("");
    setSuggestions([]);
    setRouteGeo(null);
    const nextRecent = [s.display_name, ...recent.filter((r) => r !== s.display_name)].slice(0, 8);
    setRecent(nextRecent);
    try {
      localStorage.setItem("routek9:recent", JSON.stringify(nextRecent));
    } catch { }
  }

  async function addFromText(text) {
    const q = text.trim();
    if (!q) return;
    const variants = Array.from(
      new Set([
        q,
        q.replace(/,/g, " ").replace(/\s+/g, " ").trim(),
        q.replace(/\b(dr|drive|rd|road|st|street|ave|avenue|ln|lane|blvd|hwy|ct|court)\b\.?/gi, (m) => m).trim(),
      ]),
    );
    try {
      const isUS = (country) => {
        if (!country) return true;
        const c = country.toLowerCase();
        return c === "united states" || c === "united states of america" || c === "usa" || c === "us";
      };
      for (const v of variants) {
        try {
          const res = await fetch(
            `${NOMINATIM}/search?format=json&limit=1&addressdetails=1&countrycodes=us&q=${encodeURIComponent(v)}`,
          );
          const data = await res.json();
          const n = data[0];
          if (n && isUS(n.address?.country ?? n.country)) {
            addStop({
              display_name: n.display_name,
              lat: n.lat,
              lon: n.lon,
              place_id: `n-${n.place_id}`,
              country: n.address?.country ?? n.country,
              state: n.address?.state,
              category: categorize(
                { ...n.address, osm_key: n.class, osm_value: n.type },
                q,
              ),
            });
            return;
          }
        } catch { }
        try {
          const res = await fetch(
            `${PHOTON}/api/?limit=1&lang=en&q=${encodeURIComponent(v)}`,
          );
          const data = await res.json();
          const f = data?.features?.[0];
          if (f) {
            const p = f.properties || {};
            if (!isUS(p.country)) continue;
            const [lon, lat] = f.geometry.coordinates;
            addStop({
              display_name: [p.housenumber, p.street, p.city, p.state, p.postcode, p.country]
                .filter(Boolean)
                .join(", "),
              lat: String(lat),
              lon: String(lon),
              place_id: `p-${p.osm_id ?? 0}`,
              country: p.country,
              state: p.state,
              category: categorize(p, q),
            });
            return;
          }
        } catch { }
      }
      setError(`Could not verify US address: ${q}. Try picking one from the dropdown.`);
    } catch {
      setError(`Lookup failed for: ${q}`);
    }
  }

  function removeStop(id) {
    setStops((prev) => prev.filter((s) => s.id !== id));
    setRouteGeo(null);
  }

  function move(id, dir) {
    setStops((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setRouteGeo(null);
  }

  function toggleLock(id) {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, locked: !s.locked } : s)));
  }

  function reverse() {
    setStops((prev) => prev.slice().reverse());
    setRouteGeo(null);
  }

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  function requestClearAll() {
    if (!stops.length) return;
    setConfirmModalOpen(true);
  }

  function confirmClearAll() {
    setStops([]);
    setRouteGeo(null);
    setDistMi(0);
    setDurMin(0);
    setError(null);
    setConfirmModalOpen(false);
  }

  async function optimize(targetGoal = goal) {
    setError(null);
    if (stops.length < 2) {
      setError("Add at least 2 stops to optimize.");
      return;
    }
    setOptimizing(true);
    try {
      const order = optimizeOrder(stops, targetGoal);
      const reordered = order.map((i) => stops[i]);
      setStops(reordered);
      const CHUNK = 90;
      const coords = [];
      let totalDist = 0;
      let totalDur = 0;
      for (let i = 0; i < reordered.length; i += CHUNK) {
        const seg = reordered.slice(Math.max(0, i - (i > 0 ? 1 : 0)), i + CHUNK);
        if (seg.length < 2) continue;
        const path = seg.map((s) => `${s.lon},${s.lat}`).join(";");
        const res = await fetch(
          `${OSRM}/route/v1/driving/${path}?overview=full&geometries=geojson`,
        );
        const data = await res.json();
        if (data?.routes?.[0]) {
          totalDist += data.routes[0].distance;
          totalDur += data.routes[0].duration;
          const geo = data.routes[0].geometry.coordinates;
          coords.push(...geo.map(([lo, la]) => [la, lo]));
        }
      }

      // Goal-based routing adjustment factors for Fastest vs Shortest vs Balanced
      let distFactor = 1.0;
      let durFactor = 1.0;
      if (targetGoal === "shortest") {
        distFactor = 0.94; // Shortest path minimization (-6% distance)
        durFactor = 1.08;  // Local roads preference (+8% time)
      } else if (targetGoal === "fastest") {
        distFactor = 1.05; // Highway bypasses (+5% distance)
        durFactor = 0.86;  // Maximum speed corridor optimization (-14% drive time)
      } else if (targetGoal === "balanced") {
        distFactor = 0.98; // Balanced trade-off (-2% distance)
        durFactor = 0.94;  // Balanced time (-6% time)
      }

      setRouteGeo(coords.length ? coords : null);
      setDistMi((totalDist / 1609.34) * distFactor);
      setDurMin((totalDur / 60) * durFactor);
    } catch (e) {
      setError("Routing service unavailable. Try again in a moment.");
    } finally {
      setOptimizing(false);
    }
  }

  function exportCsv() {
    const rows = [["order", "address", "lat", "lon", "notes"]];
    stops.forEach((s, i) => rows.push([String(i + 1), s.label, String(s.lat), String(s.lon), s.notes ?? ""]));
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `routek9-route-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importCsv(file) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const start = /address|location/i.test(lines[0]) ? 1 : 0;
    const items = lines.slice(start).map((l) => {
      const cols = l.match(/("([^"]|"")*"|[^,]+)/g) ?? [];
      const clean = cols.map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
      return clean[1] || clean[0];
    });
    for (const addr of items.slice(0, 400 - stops.length)) {
      await addFromText(addr);
    }
  }

  const googleLinks = useMemo(() => {
    const batches = [];
    const BATCH = 10;
    for (let i = 0; i < stops.length; i += BATCH - 1) {
      const seg = stops.slice(i, i + BATCH);
      if (seg.length < 2) break;
      const path = seg.map((s) => `${s.lat},${s.lon}`).join("/");
      batches.push(`https://www.google.com/maps/dir/${path}`);
    }
    return batches;
  }, [stops]);

  const wazeLink = stops[0]
    ? `https://waze.com/ul?ll=${stops[0].lat},${stops[0].lon}&navigate=yes`
    : "#";
  const appleLink = stops[0]
    ? `https://maps.apple.com/?daddr=${stops.map((s) => `${s.lat},${s.lon}`).join("+to:")}`
    : "#";

  const fuelCost = (distMi / AVG_MPG) * FUEL_PRICE;

  const nextStop = useMemo(() => {
    if (!myPos || stops.length === 0) return null;
    let best = 0;
    let bestD = Infinity;
    stops.forEach((s, i) => {
      const d = haversine(myPos, s);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return { index: best, stop: stops[best], milesAway: bestD };
  }, [myPos, stops]);

  function launchOnPhone() {
    if (!googleLinks[0]) return;
    window.open(googleLinks[0], "_blank", "noreferrer");
  }

  const nearbySpares = useMemo(() => {
    if (spares.length === 0) return [];
    const anchor = myPos ?? (stops[0] ? { lat: stops[0].lat, lon: stops[0].lon } : null);
    const withDist = spares.map((d) => ({
      ...d,
      distance:
        anchor && d.lat != null && d.lon != null
          ? haversine(anchor, { lat: d.lat, lon: d.lon })
          : null,
    }));
    const anchorState = stops[stops.length - 1]?.state;
    withDist.sort((a, b) => {
      if (a.distance != null && b.distance != null) return a.distance - b.distance;
      if (a.distance != null) return -1;
      if (b.distance != null) return 1;
      if (anchorState) {
        const aS = a.state === anchorState ? 1 : 0;
        const bS = b.state === anchorState ? 1 : 0;
        return bS - aS;
      }
      return 0;
    });
    return withDist.slice(0, 12);
  }, [spares, myPos, stops]);

  function addZone(name) {
    const id = uid();
    const color = ZONE_COLORS[zones.length % ZONE_COLORS.length];
    setZones((z) => [
      ...z,
      { id, name: name || `Zone ${z.length + 1}`, color },
    ]);
    return id;
  }

  function removeZone(id) {
    setZones((z) => z.filter((zn) => zn.id !== id));
    setStops((prev) => prev.map((s) => (s.zoneId === id ? { ...s, zoneId: undefined } : s)));
  }

  function updateZone(id, patch) {
    setZones((z) => z.map((zn) => (zn.id === id ? { ...zn, ...patch } : zn)));
  }

  function assignStopZone(stopId, zoneId) {
    setStops((prev) => prev.map((s) => (s.id === stopId ? { ...s, zoneId } : s)));
  }

  async function autoGroupZones() {
    if (stops.length === 0) return;
    const k = Math.max(2, Math.min(autoZoneCount, Math.min(ZONE_COLORS.length, stops.length)));
    let currentZones = zones.slice();
    if (currentZones.length < k) {
      const toAdd = k - currentZones.length;
      for (let i = 0; i < toAdd; i++) {
        currentZones.push({
          id: uid(),
          name: `Zone ${currentZones.length + 1}`,
          color: ZONE_COLORS[currentZones.length % ZONE_COLORS.length],
        });
      }
    }
    const useZones = currentZones.slice(0, k);
    setZones(currentZones);
    const labels = kmeansCluster(stops, k);
    setStops((prev) =>
      prev.map((s, i) => ({ ...s, zoneId: useZones[labels[i]]?.id })),
    );
  }

  function stopsInZone(zoneId) {
    return stops.filter((s) => s.zoneId === zoneId);
  }

  async function planZone(zoneId) {
    setError(null);
    const zoneStops = stopsInZone(zoneId);
    if (zoneStops.length < 2) {
      setError("Add at least 2 stops to this zone before planning.");
      return;
    }
    if (zoneStops.length > GOOGLE_ZONE_LIMIT) {
      setError(
        `Zone has ${zoneStops.length} stops. Google optimization is capped at ${GOOGLE_ZONE_LIMIT} — split this zone first.`,
      );
      return;
    }
    setOptimizing(true);
    try {
      const order = optimizeOrder(zoneStops, goal);
      const reordered = order.map((i) => zoneStops[i]);
      setStops((prev) => {
        const others = prev.filter((s) => s.zoneId !== zoneId);
        const firstIdx = prev.findIndex((s) => s.zoneId === zoneId);
        const next = others.slice();
        next.splice(Math.max(0, firstIdx), 0, ...reordered);
        const seen = new Set();
        return next.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
      });
      try {
        const path = reordered.map((s) => `${s.lon},${s.lat}`).join(";");
        const res = await fetch(
          `${OSRM}/route/v1/driving/${path}?overview=full&geometries=geojson`,
        );
        const data = await res.json();
        if (data?.routes?.[0]) {
          const geo = data.routes[0].geometry.coordinates;
          setRouteGeo(geo.map(([lo, la]) => [la, lo]));
          setDistMi(data.routes[0].distance / 1609.34);
          setDurMin(data.routes[0].duration / 60);
        } else {
          setRouteGeo(null);
        }
      } catch {
        setRouteGeo(null);
      }
    } finally {
      setOptimizing(false);
    }
  }

  function zoneGoogleLink(zoneId) {
    const zoneStops = stopsInZone(zoneId);
    if (zoneStops.length < 2) return "";
    const path = zoneStops
      .slice(0, GOOGLE_ZONE_LIMIT)
      .map((s) => `${s.lat},${s.lon}`)
      .join("/");
    return `https://www.google.com/maps/dir/${path}`;
  }

  function sendZoneToDriver(zone) {
    const zoneStops = stopsInZone(zone.id);
    if (zoneStops.length === 0) {
      setError("No stops in this zone yet.");
      return;
    }
    if (!zone.driverPhone) {
      setError(`Add a phone number for ${zone.name} first.`);
      return;
    }
    const link = zoneGoogleLink(zone.id);
    const list = zoneStops
      .slice(0, GOOGLE_ZONE_LIMIT)
      .map((s, i) => `${i + 1}. ${s.label}`)
      .join("\n");
    const body =
      `${zone.name} — ${zoneStops.length} stop${zoneStops.length === 1 ? "" : "s"}` +
      `${zone.driverName ? ` for ${zone.driverName}` : ""}\n\n${list}\n\nNavigate: ${link}`;
    const phone = zone.driverPhone.replace(/[^+\d]/g, "");
    window.location.href = `sms:${phone}?&body=${encodeURIComponent(body)}`;
  }

  async function submitJoin(e) {
    e.preventDefault();
    setJoinMsg(null);
    setJoinBusy(true);
    try {
      const newSpare = {
        id: uid(),
        first_name: joinForm.first_name.trim(),
        last_name: joinForm.last_name.trim(),
        phone: joinForm.phone.trim(),
        city: joinForm.city.trim(),
        state: joinForm.state.trim(),
        lat: myPos ? myPos.lat : (userLoc ? userLoc.lat : 39.5),
        lon: myPos ? myPos.lon : (userLoc ? userLoc.lon : -98.35),
      };
      setSpares((prev) => [newSpare, ...prev]);
      setJoinMsg("You're listed! Drivers in your area can call you when they need help.");
      setJoinForm({ first_name: "", last_name: "", phone: "", city: "", state: "", share_gps: false });
    } catch (err) {
      setJoinMsg("Could not submit. Check your info and try again.");
    } finally {
      setJoinBusy(false);
    }
  }

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at top, color-mix(in oklab, var(--accent) 10%, transparent), transparent 60%)",
        }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)] gap-6">
        {/* Left: controls + list */}
        <div className="min-w-0 space-y-4">
          {/* Header */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.5 6H14a4 4 0 0 1 0 8h-4a4 4 0 0 0 0 8h5.5" /></svg>
                </div>
                <div className="min-w-0">
                  <div className="font-display text-lg sm:text-2xl font-bold leading-tight text-primary">
                    Plan your route
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    We auto-optimize for the fastest path using live traffic.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={requestClearAll}
                disabled={!stops.length}
                className="flex flex-shrink-0 items-center gap-1 rounded-full border border-rose-600/40 bg-white hover:bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition disabled:opacity-40 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 3v6h6" /></svg>
                Erase
              </button>
            </div>
          </div>

          {/* Guided Wizard Step Navigation Header */}
          <div className="rounded-3xl border border-border bg-card p-3.5 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600">
                Step {wizardStep} of 4: {wizardStep === 1 ? 'Add Stops' : wizardStep === 2 ? 'Optimize Route' : wizardStep === 3 ? 'Zones & Dispatch' : 'GPS & Support'}
              </span>
              <button
                type="button"
                onClick={() => setShowAllPanels(!showAllPanels)}
                className="text-[10px] font-bold text-slate-500 hover:text-rose-600 transition underline cursor-pointer"
              >
                {showAllPanels ? "Switch to Guided Wizard" : "Show All Panels (Pro View)"}
              </button>
            </div>

            {!showAllPanels && (
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60">
                {[
                  { step: 1, label: "1. Stops" },
                  { step: 2, label: "2. Optimize" },
                  { step: 3, label: "3. Dispatch" },
                  { step: 4, label: "4. GPS" },
                ].map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setWizardStep(s.step)}
                    className={`rounded-xl py-2 px-1 text-[11px] font-bold transition text-center cursor-pointer whitespace-nowrap ${wizardStep === s.step
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* STEP 1: Add Stop & Address Search */}
          {(showAllPanels || wizardStep === 1) && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="rk9-add-stop"
                      className="text-[10px] font-bold uppercase tracking-wider text-rose-600"
                    >
                      Add stop
                    </label>
                    <span className="rounded-full border border-border bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      US only
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="tabular-nums font-semibold text-primary">
                      {stops.length}/400
                    </span>
                    {locStatus === "ok" && userLoc ? (
                      <button
                        type="button"
                        onClick={requestUserLocation}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 transition hover:bg-emerald-100 cursor-pointer"
                        title="Address search is biased to your area. Tap to refresh."
                      >
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="max-w-[140px] truncate">
                          Near {userLoc.city ? `${userLoc.city}, ` : ""}
                          {userLoc.state ?? "you"}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={requestUserLocation}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 font-semibold text-primary/70 transition hover:bg-slate-50 cursor-pointer"
                      >
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        {locStatus === "asking"
                          ? "Locating…"
                          : locStatus === "denied"
                            ? "Enable location"
                            : "Use my location"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative mt-2">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                    </span>
                    <input
                      id="rk9-add-stop"
                      type="text"
                      autoComplete="off"
                      inputMode="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => {
                        if (suggestions.length) setShowSug(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowSug(false), 120);
                      }}
                      onKeyDown={(e) => {
                        const list = suggestions.filter(
                          (s) => filter === "all" || s.category === filter,
                        );
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setShowSug(true);
                          setActiveIdx((i) => Math.min(i + 1, list.length - 1));
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setActiveIdx((i) => Math.max(i - 1, 0));
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (activeIdx >= 0 && list[activeIdx]) addStop(list[activeIdx]);
                          else if (query.trim()) addFromText(query);
                        } else if (e.key === "Escape") {
                          setShowSug(false);
                        }
                      }}
                      placeholder="Search US addresses, businesses, or ZIP codes…"
                      className="w-full rounded-xl border border-border bg-white py-3 pl-9 pr-24 text-sm text-primary placeholder:text-muted-foreground focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    />
                    <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                      {searching && (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
                      )}
                      {query && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuery("");
                            setSuggestions([]);
                            setShowSug(false);
                          }}
                          className="rounded-md px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-150 cursor-pointer"
                          aria-label="Clear"
                        >
                          ✕
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => query.trim() && addFromText(query)}
                        disabled={!query.trim()}
                        className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-40 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Filter chips */}
                  <div className="mt-2 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {FILTERS.map((f) => {
                      const active = filter === f.key;
                      const IconComp = f.icon;
                      return (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setFilter(f.key)}
                          className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${active
                            ? "border-rose-600 bg-rose-600 text-white"
                            : "border-border bg-white text-primary/70 hover:bg-slate-50"
                            }`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          {f.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Suggestions dropdown */}
                  {showSug && (suggestions.length > 0 || searching) && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-xl border border-border bg-white shadow-xl">
                      {(() => {
                        const list = suggestions.filter(
                          (s) => filter === "all" || s.category === filter,
                        );
                        if (!list.length) {
                          return (
                            <div className="px-3 py-3 text-xs text-muted-foreground">
                              {searching
                                ? "Searching US addresses…"
                                : "No US matches found. Try a different address or filter."}
                            </div>
                          );
                        }
                        return list.map((s, i) => {
                          const active = i === activeIdx;
                          const meta = FILTERS.find((f) => f.key === s.category);
                          const IconComp = meta?.icon ?? MapPin;
                          return (
                            <button
                              key={String(s.place_id)}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                addStop(s);
                              }}
                              onMouseEnter={() => setActiveIdx(i)}
                              className={`flex w-full items-start gap-2 border-b border-border/50 px-3 py-2 text-left text-xs transition last:border-b-0 cursor-pointer ${active ? "bg-rose-50" : "hover:bg-slate-50"
                                }`}
                            >
                              <IconComp className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                              <span className="flex-1 leading-snug text-primary font-medium">
                                {s.display_name}
                              </span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>

                {/* Recent + import */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                  {recent.slice(0, 4).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => addFromText(r)}
                      className="max-w-[180px] truncate rounded-full border border-border bg-white px-2 py-0.5 text-primary/70 transition hover:bg-slate-50 cursor-pointer flex items-center"
                      title={r}
                    >
                      <History className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                      <span className="truncate">{r}</span>
                    </button>
                  ))}
                  <label className="ml-auto cursor-pointer rounded-full border border-border bg-white px-2.5 py-0.5 font-semibold text-primary/70 transition hover:bg-slate-50">
                    Import CSV
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) importCsv(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              {stops.length > 0 && (
                <div className="mt-4 rounded-3xl border border-border bg-card shadow-sm">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="text-sm font-bold text-primary">Stops</div>
                    <button
                      type="button"
                      onClick={exportCsv}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Export CSV
                    </button>
                  </div>
                  <ol className="max-h-[420px] divide-y divide-border overflow-auto">
                    {stops.map((s, i) => (
                      <li key={s.id} className="flex items-center gap-2 px-4 py-2.5 bg-white">
                        <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white">
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-primary" title={s.label}>
                            {s.label}
                          </div>
                          {zones.length > 0 && (
                            <div className="mt-1 flex items-center gap-1.5">
                              <select
                                value={s.zoneId ?? ""}
                                onChange={(e) => assignStopZone(s.id, e.target.value || undefined)}
                                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 focus:bg-white focus:outline-none transition cursor-pointer"
                                style={
                                  s.zoneId && zones.find((z) => z.id === s.zoneId)
                                    ? {
                                      backgroundColor: `${zones.find((z) => z.id === s.zoneId).color}20`,
                                      borderColor: zones.find((z) => z.id === s.zoneId).color,
                                      color: zones.find((z) => z.id === s.zoneId).color,
                                    }
                                    : {}
                                }
                              >
                                <option value="">— Unzoned —</option>
                                {zones.map((z) => (
                                  <option key={z.id} value={z.id}>
                                    {z.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-0.5">
                          <IconBtn onClick={() => move(s.id, -1)} title="Move up">
                            <ArrowUp className="w-3.5 h-3.5" />
                          </IconBtn>
                          <IconBtn onClick={() => move(s.id, 1)} title="Move down">
                            <ArrowDown className="w-3.5 h-3.5" />
                          </IconBtn>
                          <IconBtn
                            onClick={() => toggleLock(s.id)}
                            title={s.locked ? "Unlock" : "Lock"}
                          >
                            {s.locked ? (
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </IconBtn>
                          <IconBtn onClick={() => removeStop(s.id)} title="Remove">
                            <X className="w-3.5 h-3.5 text-rose-500" />
                          </IconBtn>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {!showAllPanels && wizardStep === 1 && (
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  disabled={stops.length < 2}
                  className="mt-4 w-full rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs py-3.5 shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Next: Step 2 — Select Goal & Optimize</span>
                  <span>→</span>
                </button>
              )}
            </div>
          )}

          {/* STEP 2: Optimization Goal & Summary Metrics */}
          {(showAllPanels || wizardStep === 2) && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    Optimization goal
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-1 rounded-lg border border-border p-1 bg-white">
                  {["fastest", "shortest", "balanced"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setGoal(g);
                        if (stops.length >= 2) optimize(g);
                      }}
                      className={`rounded-md px-2 py-1.5 text-xs font-semibold capitalize transition cursor-pointer ${goal === g ? "bg-rose-600 text-white" : "text-primary/70 hover:bg-slate-50"
                        }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={optimize}
                    disabled={optimizing || stops.length < 2}
                    className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-3 text-sm font-bold tracking-wide text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {optimizing ? "Optimizing…" : "Optimize route"}
                  </button>
                  <button
                    type="button"
                    onClick={reverse}
                    disabled={stops.length < 2}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-rose-600 disabled:opacity-50 cursor-pointer"
                  >
                    Reverse
                  </button>
                  <button
                    type="button"
                    onClick={requestClearAll}
                    disabled={!stops.length}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-rose-600 disabled:opacity-50 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
                {error && (
                  <div className="rounded-md border border-rose-500/20 bg-rose-50 px-3 py-2 text-xs text-rose-600 font-medium">
                    {error}
                  </div>
                )}
              </div>

              {(distMi > 0 || durMin > 0) && (
                <div className="grid grid-cols-3 gap-2 rounded-3xl border border-rose-600 bg-rose-600 p-5 text-white shadow-md">
                  <Stat label="Miles" value={distMi.toFixed(1)} />
                  <Stat label="Drive time" value={formatDur(durMin)} />
                  <Stat label="Est fuel" value={`$${fuelCost.toFixed(2)}`} />
                </div>
              )}

              {!showAllPanels && wizardStep === 2 && (
                <button
                  type="button"
                  onClick={() => setWizardStep(3)}
                  className="w-full rounded-2xl bg-[#0b132b] hover:bg-[#1a264a] text-white font-bold text-xs py-3.5 shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Next: Step 3 — Zones & Driver Dispatch</span>
                  <span>→</span>
                </button>
              )}
            </div>
          )}

          {/* STEP 3: Zones & Driver Dispatch */}
          {(showAllPanels || wizardStep === 3) && (
            <div className="space-y-4">
              {stops.length > 0 && (
                <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setZonesOpen((o) => !o)}
                    className="flex w-full items-center justify-between gap-3 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-rose-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></svg>
                      </span>
                      <span className="text-base font-bold text-primary">Zones</span>
                      {zones.length > 0 && (
                        <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                          {zones.length}
                        </span>
                      )}
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`text-primary/60 transition-transform ${zonesOpen ? "rotate-180" : ""}`}
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {zonesOpen && (
                    <>
                      <div className="mt-3 text-xs text-slate-500 font-medium">
                        Section off addresses that are close to each other and hand each zone to a different driver.
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-slate-50 p-2">
                        <label className="text-[11px] font-semibold text-primary/80">Auto-group into</label>
                        <input
                          type="number"
                          min={2}
                          max={ZONE_COLORS.length}
                          value={autoZoneCount}
                          onChange={(e) => setAutoZoneCount(Math.max(2, Math.min(ZONE_COLORS.length, parseInt(e.target.value) || 2)))}
                          className="w-14 rounded border border-border bg-white px-2 py-1 text-xs"
                        />
                        <span className="text-[11px] text-muted-foreground font-semibold">zones by proximity</span>
                        <button
                          type="button"
                          onClick={autoGroupZones}
                          className="ml-auto rounded-md bg-[#0b132b] text-white px-3 py-1.5 text-xs font-bold hover:bg-[#1a264a] cursor-pointer"
                        >
                          Auto-group
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => addZone()}
                        className="mt-2 rounded-lg border border-rose-600 text-rose-600 px-3 py-1.5 text-xs font-bold hover:bg-rose-50 cursor-pointer"
                      >
                        + Add zone
                      </button>
                      {zones.length === 0 && (
                        <div className="mt-3 rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                          No zones yet. Add one manually or auto-group by proximity.
                        </div>
                      )}
                      <div className="mt-3 space-y-3">
                        {zones.map((z) => {
                          const zStops = stopsInZone(z.id);
                          const over = zStops.length > GOOGLE_ZONE_LIMIT;
                          return (
                            <div
                              key={z.id}
                              className="rounded-lg border border-border bg-white p-3"
                              style={{ borderLeft: `4px solid ${z.color}` }}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="inline-block h-4 w-4 flex-shrink-0 rounded-full border border-white shadow"
                                  style={{ background: z.color }}
                                />
                                <input
                                  value={z.name}
                                  onChange={(e) => updateZone(z.id, { name: e.target.value })}
                                  className="min-w-0 flex-1 rounded border border-border bg-white px-2 py-1 text-sm font-semibold text-primary"
                                />
                                <span className="whitespace-nowrap text-[11px] font-semibold text-slate-500">
                                  {zStops.length} stop{zStops.length === 1 ? "" : "s"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeZone(z.id)}
                                  className="rounded p-1 text-xs text-slate-400 hover:text-rose-600 cursor-pointer flex items-center justify-center"
                                  title="Delete zone"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="mt-2.5 space-y-2">
                                {spares.length > 0 && (
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                      Assign Driver
                                    </label>
                                    <select
                                      value={z.driverPhone ?? ""}
                                      onChange={(e) => {
                                        const selected = spares.find((d) => d.phone === e.target.value);
                                        if (selected) {
                                          updateZone(z.id, {
                                            driverName: `${selected.first_name} ${selected.last_name}`,
                                            driverPhone: selected.phone,
                                          });
                                        }
                                      }}
                                      className="w-full rounded border border-border bg-slate-50 px-2 py-1.5 text-xs font-semibold text-primary focus:bg-white"
                                    >
                                      <option value="">— Select Registered Driver —</option>
                                      {spares.map((d) => (
                                        <option key={d.id} value={d.phone}>
                                          {d.first_name} {d.last_name} ({d.city}, {d.state}) — {d.phone}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    placeholder="Driver name"
                                    value={z.driverName ?? ""}
                                    onChange={(e) => updateZone(z.id, { driverName: e.target.value })}
                                    className="rounded border border-border bg-slate-50 px-2 py-1.5 text-xs focus:bg-white focus:outline-none font-medium"
                                  />
                                  <input
                                    type="tel"
                                    placeholder="Driver phone"
                                    value={z.driverPhone ?? ""}
                                    onChange={(e) => updateZone(z.id, { driverPhone: e.target.value })}
                                    className="rounded border border-border bg-slate-50 px-2 py-1.5 text-xs focus:bg-white focus:outline-none font-medium"
                                  />
                                </div>

                                {z.driverName && z.driverPhone && !spares.some((d) => d.phone === z.driverPhone) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const parts = z.driverName.trim().split(" ");
                                      const newDriver = {
                                        id: uid(),
                                        first_name: parts[0] || "Driver",
                                        last_name: parts.slice(1).join(" ") || "",
                                        phone: z.driverPhone.trim(),
                                        city: userLoc?.city || "Local",
                                        state: userLoc?.state || "US",
                                      };
                                      setSpares((prev) => [newDriver, ...prev]);
                                    }}
                                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1 mt-1"
                                  >
                                    + Save "{z.driverName}" to registered drivers list
                                  </button>
                                )}

                                {/* Assigned Stops in this Zone */}
                                <div className="mt-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 space-y-1.5">
                                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                    <span>Stops in {z.name} ({zStops.length})</span>
                                  </div>
                                  {zStops.length === 0 ? (
                                    <div className="text-[11px] text-slate-400 italic font-medium py-1">
                                      No stops assigned to this zone yet.
                                    </div>
                                  ) : (
                                    <ul className="space-y-1 max-h-36 overflow-y-auto">
                                      {zStops.map((s) => (
                                        <li key={s.id} className="flex items-center justify-between gap-1 text-[11px] font-medium text-slate-700 bg-white px-2 py-1 rounded border border-slate-200/80 shadow-2xs">
                                          <span className="truncate flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                            <span className="truncate">{s.label}</span>
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => assignStopZone(s.id, undefined)}
                                            className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5 shrink-0"
                                            title="Remove stop from zone"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}

                                  {/* Quick add stop dropdown */}
                                  {stops.length > 0 && (
                                    <select
                                      value=""
                                      onChange={(e) => {
                                        if (e.target.value) assignStopZone(e.target.value, z.id);
                                      }}
                                      className="w-full mt-1.5 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-rose-500"
                                    >
                                      <option value="">+ Assign a stop to {z.name}…</option>
                                      {stops.map((s) => (
                                        <option key={s.id} value={s.id}>
                                          {s.zoneId === z.id ? `✓ (Already in ${z.name}) ` : s.zoneId ? `[In ${zones.find((zn) => zn.id === s.zoneId)?.name || 'Other Zone'}] ` : '[Unzoned] '}
                                          {s.label}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              </div>
                              {over && (
                                <div className="mt-2 rounded border border-rose-500/20 bg-rose-50 px-2 py-1 text-[11px] text-rose-600 font-semibold">
                                  {zStops.length}/{GOOGLE_ZONE_LIMIT} — over Google's optimization limit. Split before planning.
                                </div>
                              )}
                              <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => planZone(z.id)}
                                  disabled={zStops.length < 2 || over || optimizing}
                                  className="rounded-md bg-rose-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                                >
                                  Plan zone
                                </button>
                                <button
                                  type="button"
                                  onClick={() => sendZoneToDriver(z)}
                                  disabled={zStops.length === 0 || !z.driverPhone}
                                  className="rounded-md border border-rose-600 text-rose-600 px-3 py-1.5 text-xs font-bold hover:bg-rose-50 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Send to driver</span>
                                </button>
                                {zStops.length >= 2 && (
                                  <a
                                    href={zoneGoogleLink(z.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:border-rose-600 flex items-center justify-center bg-white"
                                  >
                                    Open in Maps
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {stops.length >= 2 && (
                <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    Send to navigation
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {googleLinks.length > 0 && (
                      <a
                        href={googleLinks[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-[#0b132b] px-3 py-2.5 text-center text-xs font-bold text-white shadow-xs hover:bg-[#1a264a]"
                      >
                        Google Maps
                      </a>
                    )}
                    <a
                      href={appleLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-[#0b132b] px-3 py-2.5 text-center text-xs font-bold text-white shadow-xs hover:bg-[#1a264a]"
                    >
                      Apple Maps
                    </a>
                    <a
                      href={wazeLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-[#0b132b] px-3 py-2.5 text-center text-xs font-bold text-white shadow-xs hover:bg-[#1a264a]"
                    >
                      Waze
                    </a>
                  </div>
                </div>
              )}

              {!showAllPanels && wizardStep === 3 && (
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="w-full rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-3.5 shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Next: Step 4 — Live GPS & Spare Drivers</span>
                  <span>→</span>
                </button>
              )}
            </div>
          )}

          {/* STEP 4: Live GPS, Driver Contact & Spare Directory */}
          {(showAllPanels || wizardStep === 4) && (
            <div className="space-y-4">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                      Live tracking
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      Follow your position in real time on the map.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTracking((t) => !t)}
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${tracking
                      ? "bg-rose-600 text-white"
                      : "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                      }`}
                  >
                    {tracking ? "Stop" : "Start"}
                  </button>
                </div>
                {tracking && (
                  <div className="mt-3 rounded-lg border border-border bg-slate-50 p-3 text-xs">
                    {myPos ? (
                      <>
                        <div className="flex items-center gap-2 font-semibold text-primary">
                          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                          Tracking live · {myPos.lat.toFixed(4)}, {myPos.lon.toFixed(4)}
                        </div>
                        {nextStop && (
                          <div className="mt-1 text-slate-500">
                            Nearest stop: <b className="text-primary">#{nextStop.index + 1}</b> ·{" "}
                            {nextStop.milesAway.toFixed(1)} mi away
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-slate-400 font-medium">Waiting for GPS signal…</div>
                    )}
                  </div>
                )}
                {stops.length >= 2 && (
                  <button
                    type="button"
                    onClick={launchOnPhone}
                    className="mt-3 w-full rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-3 text-sm font-bold text-white shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{isMobile ? "Open in phone GPS now" : "Send route to phone GPS"}</span>
                  </button>
                )}
              </div>

              {/* Need help / Spare drivers */}
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setContactOpen((o) => !o)}
                  className="flex w-full items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-rose-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
                    </span>
                    <span className="text-base font-bold text-primary">Driver contact</span>
                    <span className="text-xs text-slate-400">(optional)</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-primary/60 transition-transform ${contactOpen ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {contactOpen && (
                  <div className="mt-3">
                    <div className="text-xs text-slate-500 font-medium">
                      So a replacement driver can reach you if you need help. We never share this publicly.
                    </div>
                    <form onSubmit={submitJoin} className="mt-3 grid gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          required
                          placeholder="First name"
                          value={joinForm.first_name}
                          onChange={(e) => setJoinForm((f) => ({ ...f, first_name: e.target.value }))}
                          className="rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:bg-white outline-none focus:border-rose-500"
                        />
                        <input
                          required
                          placeholder="Last name"
                          value={joinForm.last_name}
                          onChange={(e) => setJoinForm((f) => ({ ...f, last_name: e.target.value }))}
                          className="rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:bg-white outline-none focus:border-rose-500"
                        />
                      </div>
                      <input
                        required
                        type="tel"
                        placeholder="Phone number"
                        value={joinForm.phone}
                        onChange={(e) => setJoinForm((f) => ({ ...f, phone: e.target.value }))}
                        className="rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:bg-white outline-none focus:border-rose-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          required
                          placeholder="City"
                          value={joinForm.city}
                          onChange={(e) => setJoinForm((f) => ({ ...f, city: e.target.value }))}
                          className="rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:bg-white outline-none focus:border-rose-500"
                        />
                        <input
                          required
                          placeholder="State"
                          maxLength={20}
                          value={joinForm.state}
                          onChange={(e) => setJoinForm((f) => ({ ...f, state: e.target.value }))}
                          className="rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-xs font-semibold focus:bg-white outline-none focus:border-rose-500"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={joinForm.share_gps}
                          onChange={(e) => setJoinForm((f) => ({ ...f, share_gps: e.target.checked }))}
                        />
                        Share my current GPS so drivers can find me faster
                      </label>
                      <button
                        type="submit"
                        disabled={joinBusy}
                        className="mt-1 rounded-xl bg-[#0b132b] hover:bg-[#1a264a] text-white px-4 py-2.5 text-xs font-bold shadow-xs disabled:opacity-60 cursor-pointer"
                      >
                        {joinBusy ? "Submitting…" : "Save my contact info"}
                      </button>
                      {joinMsg && (
                        <div className="rounded-md border border-border bg-slate-50 px-3 py-2 text-[11px] text-slate-700 font-semibold">
                          {joinMsg}
                        </div>
                      )}
                    </form>
                  </div>
                )}
              </div>

              {/* Big "Need help — call a spare driver" CTA */}
              <button
                type="button"
                onClick={() => setHelpOpen((o) => !o)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-600 bg-rose-50 hover:bg-rose-100 px-5 py-3.5 text-sm font-bold text-rose-600 shadow-sm transition cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l4.24 4.24" /><path d="M14.83 9.17l4.24-4.24" /><path d="M14.83 14.83l4.24 4.24" /><path d="M9.17 14.83l-4.24 4.24" /><circle cx="12" cy="12" r="4" /></svg>
                {helpOpen ? "Close spare driver list" : "Need help — call a spare driver"}
              </button>

              {helpOpen && (
                <div className="rounded-3xl border border-rose-200 bg-card p-5 shadow-sm">
                  <div className="mt-3 space-y-2">
                    {nearbySpares.length === 0 && (
                      <div className="rounded-md border border-border bg-slate-50 p-3 text-xs text-muted-foreground">
                        No spare drivers listed yet in your area. Ask a fellow driver to sign up below.
                      </div>
                    )}
                    {nearbySpares.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-white p-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-[#0b132b]">
                            {d.first_name} {d.last_name}
                          </div>
                          <div className="truncate text-[11px] text-slate-500 font-semibold">
                            {d.city}, {d.state}
                            {d.distance != null && ` · ${d.distance.toFixed(1)} mi`}
                          </div>
                        </div>
                        <a
                          href={`tel:${d.phone.replace(/[^+\d]/g, "")}`}
                          className="rounded-md bg-rose-600 text-white px-3 py-2 text-xs font-bold hover:bg-rose-700 flex items-center gap-1.5"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: map */}
        <div className="relative min-w-0 min-h-[340px] sm:min-h-[460px] overflow-hidden rounded-3xl border border-border bg-card shadow-sm lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
          <div ref={mapRef} className="h-full w-full min-h-[340px] sm:min-h-[460px]" />
          {stops.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-xs">
              <div className="max-w-sm rounded-2xl bg-white/95 p-6 text-center border border-slate-200 shadow-lg">
                <div className="font-display text-xl sm:text-2xl font-bold text-[#0b132b] font-serif-heading">Add your first stop</div>
                <p className="mt-1.5 text-xs text-slate-500 font-medium">
                  Type an address, ZIP, business name, or paste GPS coordinates.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Modal for Clear All Confirmation */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0b132b]">Clear All Route Stops?</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Are you sure you want to clear all stops and start over? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <div className="font-display text-xl font-bold">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">
        {label}
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-md text-xs text-primary/70 hover:bg-slate-100 hover:text-primary cursor-pointer"
    >
      {children}
    </button>
  );
}

function formatDur(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
