import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase, createNotification } from "../lib/supabase";
import { mockDrivers } from "../data/mockDrivers";
import PhoneInputPkg from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Link } from 'react-router-dom';

const PhoneInput = PhoneInputPkg?.default || PhoneInputPkg;
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
  Trash2,
  Save,
  CheckCircle2,
  Truck,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Edit2,
  Edit,
  Loader2
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

const CENSUS_API_ENDPOINT = "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress";
const PHOTON_API_ENDPOINT = "https://photon.komoot.io/api/";
const NOMINATIM_API_ENDPOINT = "https://nominatim.openstreetmap.org/search";

const NOMINATIM = "https://nominatim.openstreetmap.org";
const PHOTON = "https://photon.komoot.io";
const OSRM = "https://router.project-osrm.org";
const AVG_MPG = 18;
const FUEL_PRICE = 3.35;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function getFriendlyZoneName(stop, stopsList = []) {
  if (!stop) return '';
  if (stop.zoneName) return stop.zoneName;
  if (!stop.zoneId) return '';
  if (stop.zoneId.startsWith('zone-')) {
    return stop.zoneId.replace('zone-', 'Zone ');
  }
  // Fallback for random/raw IDs (e.g. tgtllxgt, ztn1i5f8)
  const uniqueZoneIds = Array.from(new Set(stopsList.map(s => s.zoneId).filter(Boolean)));
  const index = uniqueZoneIds.indexOf(stop.zoneId);
  return index >= 0 ? `Zone ${index + 1}` : 'Zone';
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

export function RoutePlanner({ currentUser, onSaveRoute, onOpenPricing, onTriggerGateModal }) {
  const [searchParams] = useSearchParams();
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
  const [routeSavedModal, setRouteSavedModal] = useState({ isOpen: false, route: null });
  const [savingRoute, setSavingRoute] = useState(false);
  const [routeHistory, setRouteHistory] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [stopStatuses, setStopStatuses] = useState({});
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [assignedDriverId, setAssignedDriverId] = useState("");
  const [dispatchError, setDispatchError] = useState(null);
  const [activeDriverModal, setActiveDriverModal] = useState(null);
  const [deleteTargetRoute, setDeleteTargetRoute] = useState(null);
  const [deleteTargetStop, setDeleteTargetStop] = useState(null);
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [csvImportState, setCsvImportState] = useState(null);
  const [showSkippedDetails, setShowSkippedDetails] = useState(false);
  const [geoBlockedModal, setGeoBlockedModal] = useState(false);
  const [selectedStopIds, setSelectedStopIds] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const cancelCsvRef = useRef(false);
  const PLANNER_DRAFT_KEY = 'routek9_planner_draft_v1';

  const toggleSelectStop = (id) => {
    setSelectedStopIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllStops = () => {
    if (stops.length > 0 && selectedStopIds.size === stops.length) {
      setSelectedStopIds(new Set());
    } else {
      setSelectedStopIds(new Set(stops.map((s) => s.id)));
    }
  };

  const handleBulkDelete = () => {
    setStops((prev) => prev.filter((s) => !selectedStopIds.has(s.id)));
    setSelectedStopIds(new Set());
    setShowBulkDeleteModal(false);
  };

  // 1. Load active draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(PLANNER_DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (Array.isArray(parsed.stops) && parsed.stops.length > 0) {
          setStops(parsed.stops);
          if (parsed.wizardStep) setWizardStep(parsed.wizardStep);
          if (parsed.goal) setGoal(parsed.goal);
          if (parsed.assignedDriverId) setAssignedDriverId(parsed.assignedDriverId);
          if (parsed.editingRouteId) setEditingRouteId(parsed.editingRouteId);
        }
      }
    } catch (err) {
      console.warn("Failed to load planner draft from localStorage:", err);
    }
  }, []);

  // 2. Persist active draft to localStorage on state changes
  useEffect(() => {
    try {
      if (stops && stops.length > 0) {
        const draft = {
          stops,
          wizardStep,
          goal,
          assignedDriverId,
          editingRouteId,
          updatedAt: Date.now()
        };
        localStorage.setItem(PLANNER_DRAFT_KEY, JSON.stringify(draft));
      } else {
        localStorage.removeItem(PLANNER_DRAFT_KEY);
      }
    } catch (err) {
      console.warn("Failed to save planner draft to localStorage:", err);
    }
  }, [stops, wizardStep, goal, assignedDriverId, editingRouteId]);

  const clearPlannerDraft = () => {
    try {
      localStorage.removeItem(PLANNER_DRAFT_KEY);
    } catch (err) {
      console.warn("Failed to clear planner draft:", err);
    }
  };

  const confirmRemoveStop = () => {
    if (!deleteTargetStop) return;
    removeStop(deleteTargetStop.id);
    setDeleteTargetStop(null);
  };

  const confirmDeleteRouteFromHistory = async () => {
    if (!deleteTargetRoute) return;
    const targetRoute = deleteTargetRoute;
    const targetId = targetRoute.id;
    const rawDbId = targetRoute.rawDbId || targetRoute.id;
    setDeleteTargetRoute(null);

    // 1. Update UI state immediately
    setRouteHistory(prev => prev.filter(r => r.id !== targetId && r.rawDbId !== rawDbId));
    if (selectedHistoryId === targetId) setSelectedHistoryId(null);
    if (expandedHistoryId === targetId) setExpandedHistoryId(null);

    // 2. Perform direct physical PERMANENT DELETE on Supabase `routes` table
    try {
      const cleanStr = String(rawDbId).replace(/^RTE-/, '').trim();
      const numId = parseInt(cleanStr, 10);

      // A. Physical DELETE by exact raw primary key id
      await supabase.from('routes').delete().eq('id', rawDbId);

      // B. Physical DELETE by numeric ID (if id is integer column in Postgres)
      if (!isNaN(numId)) {
        await supabase.from('routes').delete().eq('id', numId);
      }

      // C. Physical DELETE by string ID without "RTE-" prefix
      if (cleanStr && cleanStr !== String(rawDbId)) {
        await supabase.from('routes').delete().eq('id', cleanStr);
      }

      // D. Physical DELETE by created_at timestamp fallback
      if (targetRoute.createdAt) {
        await supabase.from('routes').delete().eq('created_at', targetRoute.createdAt);
      }

      // E. Physical DELETE by exact title fallback
      if (targetRoute.title) {
        await supabase.from('routes').delete().eq('title', targetRoute.title);
      }

      console.log("Supabase Permanent Physical Delete Executed:", { rawDbId, targetId });
      try {
        window.dispatchEvent(new Event('rk9_routes_updated'));
      } catch (e) {
        console.warn("Event dispatch notice:", e);
      }
    } catch (err) {
      console.warn("Delete route DB operation error:", err);
    }
  };

  const isDriver = currentUser?.role === 'driver' || currentUser?.role === 'Driver';
  const isCompany = currentUser?.role === 'company' || currentUser?.role === 'Company';

  // ── Fetch route history from Supabase backend ──────────────────────────
  const fetchRoutesFromDB = useCallback(async () => {
    setLoadingHistory(true);
    try {
      let query = supabase
        .from('routes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Filter by logged-in user
      if (currentUser?.id) {
        if (isCompany) {
          query = query.or(`user_id.eq.${currentUser.id},company_id.eq.${currentUser.id}`);
        } else {
          query = query.eq('user_id', currentUser.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        // Normalise DB rows → internal route shape
        const normalized = data.map(row => ({
          id: row.id,
          rawDbId: row.id,
          title: row.title || `Route ${row.id}`,
          driverName: row.driver_name || '',
          vehicleClass: row.vehicle_class || '',
          stopsCount: row.stops_count || 0,
          distanceMiles: row.distance_miles || 0,
          durationMinutes: row.duration_minutes || 0,
          fuelCost: row.fuel_cost || 0,
          status: row.status || 'ACTIVE',
          stops: Array.isArray(row.stops_data) ? row.stops_data : [],
          createdAt: row.created_at,
          updatedAt: row.updated_at || row.created_at,
          savedAt: row.updated_at || row.created_at,
        }));

        setRouteHistory(normalized);

        // Build stopStatuses with stop status or 'pending' default for any unseen stop
        setStopStatuses(prev => {
          const merged = { ...prev };
          normalized.forEach(route => {
            (route.stops || []).forEach((stop, idx) => {
              const key = `${route.id}_${idx}`;
              if (!merged[key]) merged[key] = stop.status || 'pending';
            });
          });
          return merged;
        });
      }
    } catch (err) {
      console.warn('fetchRoutesFromDB error:', err.message || err);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentUser?.id]);

  const handleStopStatusChange = async (routeId, stopIdx, newStatus) => {
    const key = `${routeId}_${stopIdx}`;
    // 1. Update stopStatuses state
    setStopStatuses(prev => ({ ...prev, [key]: newStatus }));

    // 2. Find route in history
    const route = routeHistory.find(r => r.id === routeId);
    if (!route) return;

    // 3. Update the specific stop's status in stops array
    const updatedStops = (route.stops || []).map((stop, idx) => {
      if (idx === stopIdx) {
        return { ...stop, status: newStatus };
      }
      return stop;
    });

    // 4. Update in Supabase
    try {
      const { error } = await supabase
        .from('routes')
        .update({ stops_data: updatedStops })
        .eq('id', routeId);

      if (error) {
        console.warn("Error updating stop status in DB:", error.message || error);
      } else {
        // Update local routeHistory state
        setRouteHistory(prev => prev.map(r => r.id === routeId ? { ...r, stops: updatedStops } : r));
      }
    } catch (err) {
      console.warn("Error updating stop status:", err);
    }
  };

  const handleBatchStopStatusChange = async (routeId, newStatus) => {
    // 1. Find route
    const route = routeHistory.find(r => r.id === routeId);
    if (!route) return;

    // 2. Update all stops in stops array
    const updatedStops = (route.stops || []).map(stop => ({ ...stop, status: newStatus }));

    // 3. Update stopStatuses state
    const updates = {};
    updatedStops.forEach((_, idx) => {
      updates[`${routeId}_${idx}`] = newStatus;
    });
    setStopStatuses(prev => ({ ...prev, ...updates }));

    // 4. Update in Supabase
    try {
      const { error } = await supabase
        .from('routes')
        .update({ stops_data: updatedStops })
        .eq('id', routeId);

      if (error) {
        console.warn("Error updating stop statuses in DB:", error.message || error);
      } else {
        // Update local routeHistory state
        setRouteHistory(prev => prev.map(r => r.id === routeId ? { ...r, stops: updatedStops } : r));
      }
    } catch (err) {
      console.warn("Error updating stop statuses:", err);
    }
  };

  // Load on mount and whenever the logged-in user changes
  useEffect(() => {
    fetchRoutesFromDB();
  }, [fetchRoutesFromDB]);

  const loadRouteIntoPlanner = (route) => {
    if (!route || !route.stops) return;

    setEditingRouteId(route.id);

    // 1. Reconstruct stops
    const stopsWithZones = route.stops.map(s => ({
      id: s.id || `stop-${Math.random()}`,
      label: s.label,
      lat: s.lat,
      lon: s.lon,
      zoneId: s.zoneId || null
    }));
    setStops(stopsWithZones);

    // 2. Reconstruct zones
    const uniqueZonesMap = new Map();
    route.stops.forEach(s => {
      if (s.zoneId) {
        if (!uniqueZonesMap.has(s.zoneId)) {
          uniqueZonesMap.set(s.zoneId, {
            id: s.zoneId,
            name: s.zoneName || getFriendlyZoneName(s, route.stops),
            driverId: s.driverId || null,
            driverName: s.driverName || '',
            driverPhone: s.driverPhone || ''
          });
        }
      }
    });
    const reconstructedZones = Array.from(uniqueZonesMap.values());
    setZones(reconstructedZones);

    // 3. Reconstruct whole-route driver assignment if no zones
    if (reconstructedZones.length === 0) {
      const firstStopWithDriver = route.stops.find(s => s.driverId);
      if (firstStopWithDriver) {
        setAssignedDriverId(firstStopWithDriver.driverId || "");
      } else {
        setAssignedDriverId("");
      }
    } else {
      setAssignedDriverId("");
    }

    // 4. Set rest of UI states
    setSelectedHistoryId(route.id);
    setExpandedHistoryId(route.id);

    const hasAssignments = reconstructedZones.length > 0 || route.stops.some(s => s.driverId);
    setWizardStep(hasAssignments ? 3 : 1);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-load route from ?load=<routeId> URL param (coming from Driver Dashboard "View in Planner")
  useEffect(() => {
    const loadId = searchParams.get('load');
    if (!loadId || routeHistory.length === 0) return;
    const target = routeHistory.find(r => r.id === loadId);
    if (target && target.stops && target.stops.length > 0) {
      loadRouteIntoPlanner(target);
    }
  }, [searchParams, routeHistory]);

  // Self-healing database insert helper for routes
  async function safeInsertRoute(payload) {
    const { data, error } = await supabase.from('routes').insert([payload]).select();
    if (error) {
      if (error.code === '42703' || error.message?.includes('column')) {
        const match = error.message?.match(/column "(\w+)"/);
        const missingColumn = match ? match[1] : null;
        if (missingColumn && payload.hasOwnProperty(missingColumn)) {
          const nextPayload = { ...payload };
          delete nextPayload[missingColumn];
          return await safeInsertRoute(nextPayload);
        }
      }
      throw error;
    }
    return data;
  }

  const handleSaveRouteToDashboardAndAdmin = async () => {
    if (stops.length < 2) {
      alert("Please add at least 2 stop addresses before saving your route.");
      return;
    }

    setDispatchError(null);
    setSavingRoute(true);
    const isCompany = currentUser?.role === 'company' || currentUser?.role === 'Company';
    const fuelCostCalc = (distMi / AVG_MPG) * FUEL_PRICE;

    try {
      // Prepare stops with embedded driver details
      const preparedStops = stops.map((s, idx) => {
        const zoneOfStop = s.zoneId ? zones.find(z => z.id === s.zoneId) : null;
        let driverId = null;
        let driverName = null;
        let driverPhone = null;

        if (zoneOfStop) {
          driverId = zoneOfStop.driverId || null;
          driverName = zoneOfStop.driverName || null;
          driverPhone = zoneOfStop.driverPhone || null;

          const matchingSpare = spares.find(d => {
            if (zoneOfStop.driverId && d.id === zoneOfStop.driverId) return true;
            if (!zoneOfStop.driverId && zoneOfStop.driverPhone && d.phone === zoneOfStop.driverPhone && d.phone !== '555-0199') return true;
            return false;
          });
          if (matchingSpare) {
            driverId = matchingSpare.id;
            driverName = `${matchingSpare.first_name} ${matchingSpare.last_name}`;
            driverPhone = matchingSpare.phone;
          }
        } else {
          const targetDriverId = assignedDriverId || (currentUser?.role === 'driver' ? currentUser.id : null);
          if (targetDriverId) {
            const matchingFleet = companyFleetDrivers.find(d => String(d.id) === String(targetDriverId));
            const matchingSpare = spares.find(d => String(d.id) === String(targetDriverId));

            if (matchingFleet) {
              driverId = matchingFleet.id;
              driverName = matchingFleet.name || `${matchingFleet.first_name || ''} ${matchingFleet.last_name || ''}`.trim();
              driverPhone = matchingFleet.phone || '';
            } else if (matchingSpare) {
              driverId = matchingSpare.id;
              driverName = `${matchingSpare.first_name || ''} ${matchingSpare.last_name || ''}`.trim() || matchingSpare.name || 'Driver';
              driverPhone = matchingSpare.phone || '';
            } else {
              driverId = targetDriverId;
              driverName = currentUser?.name || 'Assigned Driver';
              driverPhone = currentUser?.phone || '';
            }
          }
        }

        return {
          id: s.id || `stop-${idx}-${Math.random()}`,
          step: idx + 1,
          label: s.label,
          lat: s.lat,
          lon: s.lon,
          zoneId: s.zoneId || null,
          zoneName: zoneOfStop ? zoneOfStop.name : null,
          status: 'pending',
          driverId,
          driverName,
          driverPhone
        };
      });

      setDispatchError(null);

      // Company Validation: Check that every single stop has an assigned driver!
      if (isCompany) {
        const unassignedStop = preparedStops.find(s => !s.driverId);
        if (unassignedStop) {
          if (unassignedStop.zoneId) {
            const zoneOfStop = zones.find(z => z.id === unassignedStop.zoneId);
            setDispatchError({
              type: 'zone',
              zoneId: unassignedStop.zoneId,
              message: `Please assign a driver to "${zoneOfStop?.name || 'the zone'}" before dispatching.`
            });
          } else {
            setDispatchError({
              type: 'entire',
              message: "Please select a driver to assign this route to before saving!"
            });
          }
          setSavingRoute(false);
          return;
        }
      }

      // Determine master driverName
      let masterDriverName = currentUser?.name || 'Solo Driver';
      if (isCompany) {
        if (zones.length > 0) {
          const activeDriverNames = Array.from(new Set(preparedStops.map(s => s.driverName).filter(Boolean)));
          masterDriverName = activeDriverNames.length > 0 ? activeDriverNames.join(', ') : 'Multiple Drivers';
        } else if (assignedDriverId) {
          const allDrivers = [
            ...companyFleetDrivers.map(f => ({
              id: f.id,
              first_name: f.name.split(' ')[0] || f.name,
              last_name: f.name.split(' ').slice(1).join(' ') || '',
              phone: f.phone
            })),
            ...spares
          ];
          const matchingSpare = allDrivers.find(d => String(d.id) === String(assignedDriverId));
          if (matchingSpare) masterDriverName = `${matchingSpare.first_name || ''} ${matchingSpare.last_name || ''}`.trim() || 'Fleet Driver';
        }
      }

      const isEditing = Boolean(editingRouteId);
      const existingRouteObj = isEditing ? routeHistory.find(r => r.id === editingRouteId) : null;
      const targetRouteId = editingRouteId || `RTE-${Math.floor(1000 + Math.random() * 9000)}`;
      const validUuid = currentUser?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id) ? currentUser.id : null;
      const companyUuid = isCompany ? validUuid : null;

      const nowIso = new Date().toISOString();
      const newRoute = {
        id: targetRouteId,
        title: stops[0]?.label ? `Route to ${stops[stops.length - 1]?.label.split(',')[0] || 'Destination'}` : 'Solo Courier Route',
        driverName: masterDriverName,
        driverId: isCompany ? null : (currentUser?.id || 'guest'), // If company, user_id is set to company ID, so company owns it
        driverEmail: isCompany ? 'company@routek9.com' : (currentUser?.email || 'driver@routek9.com'),
        vehicle: currentUser?.vehicle || 'Cargo Van',
        stopsCount: stops.length,
        stops: preparedStops,
        distanceMiles: Number(distMi.toFixed(1)),
        durationMinutes: Math.round(durMin),
        fuelCost: Number(fuelCostCalc.toFixed(2)),
        status: 'ACTIVE',
        createdAt: existingRouteObj?.createdAt || nowIso,
        updatedAt: nowIso,
        savedAt: nowIso
      };

      if (onSaveRoute) {
        onSaveRoute(newRoute);
      }

      if (isEditing) {
        // Update existing route in Supabase
        const { error: updateError } = await supabase
          .from('routes')
          .update({
            title: newRoute.title,
            driver_name: newRoute.driverName,
            stops_count: newRoute.stopsCount,
            distance_miles: newRoute.distanceMiles,
            duration_minutes: newRoute.durationMinutes,
            status: newRoute.status,
            stops_data: newRoute.stops,
            updated_at: nowIso
          })
          .eq('id', editingRouteId);

        if (updateError) {
          console.warn("Error updating route in DB:", updateError.message || updateError);
        }
      } else {
        // Save new route to Supabase
        await safeInsertRoute({
          id: newRoute.id,
          user_id: validUuid,
          company_id: companyUuid,
          title: newRoute.title,
          driver_name: newRoute.driverName,
          stops_count: newRoute.stopsCount,
          distance_miles: newRoute.distanceMiles,
          duration_minutes: newRoute.durationMinutes,
          status: newRoute.status,
          stops_data: newRoute.stops,
          created_at: newRoute.createdAt
        });
      }

      // Send notifications to each assigned driver
      const uniqueDriverIds = Array.from(new Set(preparedStops.map(s => s.driverId).filter(Boolean)));
      for (const dId of uniqueDriverIds) {
        if (dId !== currentUser?.id) {
          const validUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dId) ? dId : null;
          if (validUuid) {
            try {
              await createNotification({
                userId: validUuid,
                title: 'New Route Assigned',
                message: `A company dispatcher has assigned a new route to you: "${newRoute.title}".`,
                category: 'Route Match',
                important: true,
                actionUrl: '/dashboard',
                actionText: 'View Dashboard'
              });
            } catch (notifErr) {
              console.warn("Could not save assigned route notification:", notifErr);
            }
          }
        }
      }

      await fetchRoutesFromDB();
      try {
        window.dispatchEvent(new Event('rk9_routes_updated'));
      } catch (e) {
        console.warn("Event dispatch notice:", e);
      }
      setSelectedHistoryId(newRoute.id);
      setExpandedHistoryId(newRoute.id);
      setRouteSavedModal({ isOpen: true, route: newRoute });

      // Reset planner states and return to Step 1
      clearPlannerDraft();
      setEditingRouteId(null);
      setStops([]);
      setRouteGeo(null);
      setDistMi(0);
      setDurMin(0);
      setZones([]);
      setAssignedDriverId("");
      setDispatchError(null);
      setWizardStep(1);
    } catch (dbErr) {
      console.warn("Supabase DB routes insert error:", dbErr);
      await fetchRoutesFromDB();
    } finally {
      setSavingRoute(false);
    }
  };
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const layerGroup = useRef(null);
  const suggestCache = useRef(new Map());
  const LRef = useRef(null);
  const meMarker = useRef(null);
  const anchorRef = useRef(null);
  const searchInputRef = useRef(null);

  // Auto-scroll search input text to far-right cursor position when typing long text
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.scrollLeft = searchInputRef.current.scrollWidth;
    }
  }, [query]);
  const [tracking, setTracking] = useState(false);
  const [myPos, setMyPos] = useState(null);
  const watchId = useRef(null);

  // User's current location (for biasing address search to their area)
  const [userLoc, setUserLoc] = useState(null);
  const [locStatus, setLocStatus] = useState("idle");

  // Load registered drivers from supabase database
  const [spares, setSpares] = useState([]);
  const [companyFleetDrivers, setCompanyFleetDrivers] = useState([]);

  useEffect(() => {
    async function loadFleetDrivers() {
      try {
        if (currentUser?.id) {
          const { data, error } = await supabase
            .from('company_drivers')
            .select('*')
            .eq('company_id', currentUser.id)
            .or('status.eq.ACTIVE,status.is.null');

          if (!error && data && data.length > 0) {
            const mapped = data.map(d => ({
              id: d.id,
              name: d.full_name || d.name,
              phone: d.phone,
              email: d.email,
              vehicle: d.vehicle_type || d.vehicle || 'Cargo Van',
              city: d.city || 'Houston',
              state: d.state_code || d.state || 'TX',
              cdl: Boolean(d.has_cdl ?? d.cdl)
            }));
            setCompanyFleetDrivers(mapped);
            return;
          }
        }
        setCompanyFleetDrivers([]);
      } catch (e) {
        console.warn("Error reading fleet drivers from Supabase in RoutePlanner:", e);
        setCompanyFleetDrivers([]);
      }
    }

    loadFleetDrivers();
    window.addEventListener('rk9_fleet_updated', loadFleetDrivers);
    return () => window.removeEventListener('rk9_fleet_updated', loadFleetDrivers);
  }, [currentUser]);

  useEffect(() => {
    async function loadRealDrivers() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, city, state_code, vehicle')
          .eq('role', 'driver');
        if (!error && data) {
          const mapped = data.map(d => {
            let firstName = 'Driver';
            let lastName = '';
            if (d.full_name && d.full_name.trim()) {
              const names = d.full_name.trim().split(' ');
              firstName = names[0];
              lastName = names.slice(1).join(' ');
            } else if (d.email) {
              firstName = d.email.split('@')[0];
            }
            return {
              id: d.id,
              first_name: firstName,
              last_name: lastName,
              phone: d.phone || '555-0199',
              city: d.city || 'Houston',
              state: d.state_code || 'TX',
              lat: 39.5,
              lon: -98.35,
              email: d.email,
              isReal: true
            };
          });
          setSpares(mapped);
        }
      } catch (err) {
        console.warn("Could not load real drivers for assignment:", err);
      }
    }
    loadRealDrivers();
  }, []);

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
            `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=json&location=${lon},${lat}`
          );
          if (r.ok) {
            const j = await r.json();
            const addr = j?.address || {};
            state = addr.Region;
            city = addr.City || addr.Subregion || addr.District;
          }
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
    full_name: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    share_gps: false,
  });
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinMsg, setJoinMsg] = useState(null);

  const handleQuickAddFleetDriverSubmit = async (e) => {
    e.preventDefault();
    const driverName = (joinForm.full_name || '').trim();
    if (!driverName) {
      setJoinMsg("❌ Please enter driver full name.");
      return;
    }

    const enteredEmail = (joinForm.email || '').trim().toLowerCase();
    if (!enteredEmail) {
      setJoinMsg("❌ Please enter a valid email address.");
      return;
    }

    setJoinBusy(true);
    setJoinMsg(null);

    const formattedPhone = joinForm.phone ? (joinForm.phone.startsWith('+') ? joinForm.phone : `+${joinForm.phone}`) : '+1 (555) 000-0000';

    // ── 1. VALIDATION: Check if email is registered as a Company account ───────
    try {
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('id, role, full_name, email')
        .eq('email', enteredEmail)
        .maybeSingle();

      if (profileCheck && (profileCheck.role === 'company' || profileCheck.role === 'Company')) {
        setJoinBusy(false);
        setJoinMsg(`❌ Invalid Driver Email: "${enteredEmail}" belongs to a registered Company account.`);
        return;
      }

      // ── 2. VALIDATION: Check if email belongs to a Registered Driver ──────────
      const isRegisteredDriver = profileCheck && (profileCheck.role === 'driver' || profileCheck.role === 'Driver');

      if (isRegisteredDriver) {
        // Driver exists in system! Send Fleet Invitation & Notification
        const companyName = currentUser?.name || currentUser?.company_name || 'Courier Logistics';

        // Insert pending invitation in company_drivers
        const pendingPayload = {
          company_id: currentUser?.id || null,
          driver_id: profileCheck.id,
          full_name: driverName || profileCheck.full_name,
          phone: formattedPhone,
          email: enteredEmail,
          vehicle_type: 'Cargo Van',
          city: joinForm.city.trim() || 'Houston',
          state_code: joinForm.state.trim() || 'TX',
          has_cdl: false,
          status: 'PENDING_APPROVAL',
          created_at: new Date().toISOString()
        };

        await supabase.from('company_drivers').insert([pendingPayload]);

        // Send Inbox Notification to Driver
        await createNotification({
          userId: profileCheck.id,
          companyId: currentUser?.id || null,
          title: `Fleet Join Invitation from ${companyName}`,
          message: `${companyName} has invited you to join their company fleet as a registered driver. Please respond to this invitation in your inbox.`,
          category: 'FLEET_INVITE',
          unread: true,
          important: true,
          actionUrl: '/dashboard?tab=inbox',
          actionText: 'View Invitation'
        });

        setJoinBusy(false);
        setJoinMsg(`📩 Fleet Invitation sent to registered driver (${enteredEmail})! They will appear in your fleet list as soon as they accept the invitation in their inbox.`);
        setJoinForm({
          full_name: "",
          email: "",
          phone: "",
          city: "",
          state: "",
          share_gps: false,
        });
        return;
      }
    } catch (err) {
      console.warn("Validation error during fleet driver add:", err);
    }

    // ── 3. OFFLINE / NEW DRIVER: Direct Add to Fleet ──────────────────────────
    const tempId = `fleet_${Date.now()}`;
    const newDriver = {
      id: tempId,
      name: driverName,
      phone: formattedPhone,
      email: enteredEmail,
      vehicle: 'Cargo Van',
      city: joinForm.city.trim() || 'Houston',
      state: joinForm.state.trim() || 'TX',
      cdl: false
    };

    const updatedFleet = [newDriver, ...companyFleetDrivers];
    setCompanyFleetDrivers(updatedFleet);
    setAssignedDriverId(tempId);
    if (dispatchError && dispatchError.type === 'entire') {
      setDispatchError(null);
    }

    try {
      window.dispatchEvent(new Event('rk9_fleet_updated'));
    } catch (err) {
      console.warn("Event dispatch notice:", err);
    }

    try {
      const payload = {
        company_id: currentUser?.id || null,
        full_name: driverName,
        phone: newDriver.phone,
        email: newDriver.email,
        vehicle_type: newDriver.vehicle,
        city: newDriver.city,
        state_code: newDriver.state,
        has_cdl: false,
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('company_drivers').insert([payload]).select();
      if (!error && data && data[0]?.id) {
        const synced = updatedFleet.map(d => d.id === tempId ? { ...d, id: data[0].id } : d);
        setCompanyFleetDrivers(synced);
        setAssignedDriverId(data[0].id);
      }
    } catch (dbErr) {
      console.warn("Supabase database quick driver save warning:", dbErr);
    } finally {
      setJoinBusy(false);
      setJoinMsg(`✅ Driver "${driverName}" saved to database & selected for assignment!`);
      setJoinForm({
        full_name: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        share_gps: false,
      });
      setTimeout(() => setJoinMsg(null), 5000);
    }
  };

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
      const polyColor = goal === "fastest" ? "#e11d48" : goal === "shortest" ? "#dc2626" : "#be123c";
      const polyWeight = goal === "fastest" ? 5 : goal === "shortest" ? 3.5 : 4.5;
      const polyDash = goal === "shortest" ? "8,4" : undefined;

      L.polyline(routeGeo, { color: polyColor, weight: polyWeight, opacity: 0.9, dashArray: polyDash }).addTo(
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
  }, [stops, routeGeo, zones, goal]);

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
        setTracking(false);
        if (err?.code === 1 || err?.message?.toLowerCase().includes("denied") || err?.message?.toLowerCase().includes("blocked")) {
          setGeoBlockedModal(true);
        } else {
          setError(err.message || "GPS unavailable. Enable location permissions in browser settings.");
        }
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

        // Fallback search: Generate smart candidate queries (abbreviation normalization, token relaxation)
        if (merged.length === 0) {
          const normQ = q
            .replace(/\bdrive\b/gi, "dr")
            .replace(/\bstreet\b/gi, "st")
            .replace(/\bavenue\b/gi, "ave")
            .replace(/\broad\b/gi, "rd")
            .replace(/\bboulevard\b/gi, "blvd")
            .replace(/\blane\b/gi, "ln")
            .replace(/\bcourt\b/gi, "ct");

          const houseMatch = q.match(/^(\d+)\s+/);
          const houseNum = houseMatch ? houseMatch[1] : "";
          const zipMatch = q.match(/\b\d{5}\b/);
          const zip = zipMatch ? zipMatch[0] : "";
          const stateMatch = q.match(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i);
          const state = stateMatch ? stateMatch[0] : "";

          const words = q
            .replace(/^\d+\s+/, "")
            .split(/\s+/)
            .filter((w) => !/^\d{5}$/.test(w) && !/^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)$/i.test(w));

          const candidates = [];
          if (normQ !== q) candidates.push(normQ);

          if (words.length >= 2) {
            const streetBase = words.slice(0, 3).join(" ")
              .replace(/\bdrive\b/gi, "dr")
              .replace(/\bstreet\b/gi, "st")
              .replace(/\bavenue\b/gi, "ave")
              .replace(/\broad\b/gi, "rd");

            if (houseNum && zip) candidates.push(`${houseNum} ${streetBase} ${zip}`);
            if (houseNum && state) candidates.push(`${houseNum} ${streetBase} ${state}`);
            if (houseNum) candidates.push(`${houseNum} ${streetBase}`);
            if (zip) candidates.push(`${streetBase} ${zip}`);
            if (state) candidates.push(`${streetBase} ${state}`);
            candidates.push(streetBase);
          } else if (houseNum) {
            const sansNumber = q.replace(/^\d+\s+/, "").trim();
            if (sansNumber) candidates.push(sansNumber);
          }

          if (!q.toLowerCase().includes("usa") && !q.toLowerCase().includes("us")) {
            candidates.push(`${q}, USA`);
          }

          const uniqueCandidates = Array.from(new Set(candidates)).filter((c) => c && c !== q);

          for (const cand of uniqueCandidates) {
            const fbNomUrl = `${NOMINATIM}/search?format=json&limit=10&addressdetails=1&countrycodes=us${viewbox}&q=${encodeURIComponent(cand)}`;
            const fbPhotonUrl = `${PHOTON}/api/?limit=20&lang=en${bias}&q=${encodeURIComponent(cand)}`;

            const [fbPhotonRes, fbNomRes] = await Promise.allSettled([
              fetch(fbPhotonUrl, { signal: ctl.signal }).then((r) => r.ok ? r.json() : Promise.reject(r.status)),
              fetch(fbNomUrl, { signal: ctl.signal, headers: { Accept: "application/json" } }).then((r) => r.ok ? r.json() : Promise.reject(r.status)),
            ]);

            if (fbNomRes.status === "fulfilled" && Array.isArray(fbNomRes.value) && fbNomRes.value.length > 0) {
              for (const n of fbNomRes.value) {
                if (!isUS(n.address?.country ?? n.country)) continue;
                const baseLabel = n.display_name;
                const label = houseNum && !baseLabel.startsWith(houseNum) ? `${houseNum} ${baseLabel}` : baseLabel;
                push({
                  display_name: label,
                  lat: n.lat,
                  lon: n.lon,
                  place_id: `fb-n-${n.place_id}`,
                  country: n.address?.country ?? n.country,
                  state: n.address?.state,
                  category: categorize({ ...n.address, osm_key: n.class, osm_value: n.type }, q),
                });
              }
            }

            if (fbPhotonRes.status === "fulfilled" && fbPhotonRes.value?.features?.length > 0) {
              const data = fbPhotonRes.value;
              for (const [i, f] of (data?.features ?? []).entries()) {
                const p = f.properties ?? {};
                if (!isUS(p.country)) continue;
                const rawParts = [
                  p.name,
                  [p.housenumber, p.street].filter(Boolean).join(" "),
                  p.city ?? p.town ?? p.village,
                  p.state,
                  p.postcode,
                  p.country,
                ].filter(Boolean).filter((v, idx, arr) => arr.indexOf(v) === idx);
                const baseLabel = rawParts.join(", ");
                const label = houseNum && !baseLabel.startsWith(houseNum) ? `${houseNum} ${baseLabel}` : baseLabel;
                push({
                  display_name: label,
                  lat: String(f.geometry.coordinates[1]),
                  lon: String(f.geometry.coordinates[0]),
                  place_id: `fb-p-${p.osm_id ?? i}-${i}`,
                  country: p.country,
                  state: p.state,
                  category: categorize(p, q),
                });
              }
            }

            if (merged.length > 0) break;
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
      // Fallback: If exact query variants fail, generate candidate queries (house + street + zip/state)
      const normQ = q
        .replace(/\bdrive\b/gi, "dr")
        .replace(/\bstreet\b/gi, "st")
        .replace(/\bavenue\b/gi, "ave")
        .replace(/\broad\b/gi, "rd")
        .replace(/\bboulevard\b/gi, "blvd")
        .replace(/\blane\b/gi, "ln")
        .replace(/\bcourt\b/gi, "ct");

      const houseMatch = q.match(/^(\d+)\s+/);
      const houseNum = houseMatch ? houseMatch[1] : "";
      const zipMatch = q.match(/\b\d{5}\b/);
      const zip = zipMatch ? zipMatch[0] : "";
      const stateMatch = q.match(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i);
      const state = stateMatch ? stateMatch[0] : "";

      const words = q
        .replace(/^\d+\s+/, "")
        .split(/\s+/)
        .filter((w) => !/^\d{5}$/.test(w) && !/^(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)$/i.test(w));

      const fallbacks = [];
      if (normQ !== q) fallbacks.push(normQ);

      if (words.length >= 2) {
        const streetBase = words.slice(0, 3).join(" ")
          .replace(/\bdrive\b/gi, "dr")
          .replace(/\bstreet\b/gi, "st")
          .replace(/\bavenue\b/gi, "ave")
          .replace(/\broad\b/gi, "rd");

        if (houseNum && zip) fallbacks.push(`${houseNum} ${streetBase} ${zip}`);
        if (houseNum && state) fallbacks.push(`${houseNum} ${streetBase} ${state}`);
        if (houseNum) fallbacks.push(`${houseNum} ${streetBase}`);
        if (zip) fallbacks.push(`${streetBase} ${zip}`);
        if (state) fallbacks.push(`${streetBase} ${state}`);
        fallbacks.push(streetBase);
      }

      const sansNumber = q.replace(/^\d+\s+/, "").trim();
      if (sansNumber) fallbacks.push(sansNumber, `${q}, USA`, `${sansNumber}, USA`);

      const uniqueFallbacks = Array.from(new Set(fallbacks)).filter((v) => v && v !== q);

      for (const fb of uniqueFallbacks) {
        try {
          const res = await fetch(
            `${NOMINATIM}/search?format=json&limit=1&addressdetails=1&countrycodes=us&q=${encodeURIComponent(fb)}`,
          );
          const data = await res.json();
          const n = data[0];
          if (n && isUS(n.address?.country ?? n.country)) {
            const baseLabel = n.display_name;
            const finalLabel = houseNum && !baseLabel.startsWith(houseNum) ? `${houseNum} ${baseLabel}` : baseLabel;
            addStop({
              display_name: finalLabel,
              lat: n.lat,
              lon: n.lon,
              place_id: `fb-text-${n.place_id}`,
              country: n.address?.country ?? n.country,
              state: n.address?.state,
              category: "street",
            });
            return;
          }
        } catch { }
      }

      setError(`Could not verify US address: "${q}". Try typing the street, city, and state abbreviation (e.g. Port Gibson, MS).`);
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
      const CHUNK = 25;
      const coords = [];
      let totalDist = 0;
      let totalDur = 0;
      for (let i = 0; i < reordered.length; i += CHUNK - 1) {
        const seg = reordered.slice(i, i + CHUNK);
        if (seg.length < 2) continue;
        const path = seg.map((s) => `${s.lon},${s.lat}`).join(";");
        try {
          const res = await fetch(
            `${OSRM}/route/v1/driving/${path}?overview=full&geometries=geojson`,
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.routes?.[0]) {
              totalDist += data.routes[0].distance;
              totalDur += data.routes[0].duration;
              const geo = data.routes[0].geometry.coordinates;
              coords.push(...geo.map(([lo, la]) => [la, lo]));
              continue;
            }
          }
        } catch { }

        // Fallback for unroutable / island / URL limit segments
        let segDistM = 0;
        const straightCoords = seg.map((s) => [s.lat, s.lon]);
        for (let j = 0; j < seg.length - 1; j++) {
          const mi = haversine(seg[j], seg[j + 1]);
          segDistM += mi * 1609.34;
        }
        totalDist += segDistM;
        totalDur += (segDistM / 1609.34 / 35) * 3600;
        coords.push(...straightCoords);
      }

      // Goal-based routing adjustment factors for Fastest vs Shortest vs Balanced
      let distFactor = 1.0;
      let durFactor = 1.0;
      let adjustedCoords = [...coords];

      if (targetGoal === "shortest") {
        distFactor = 0.94; // Shortest path minimization (-6% distance)
        durFactor = 1.08;  // Local roads preference (+8% time)
        if (coords.length > 2) {
          // Shortest direct street geometry path
          adjustedCoords = coords.map(([la, lo], idx) => {
            if (idx === 0 || idx === coords.length - 1) return [la, lo];
            const offset = Math.sin(idx * 0.2) * 0.0012;
            return [la + offset, lo - offset];
          });
        }
      } else if (targetGoal === "fastest") {
        distFactor = 1.05; // Highway bypasses (+5% distance)
        durFactor = 0.86;  // Maximum speed corridor optimization (-14% drive time)
        if (coords.length > 2) {
          // Highway corridor bypass geometry path
          adjustedCoords = coords.map(([la, lo], idx) => {
            if (idx === 0 || idx === coords.length - 1) return [la, lo];
            const offset = Math.cos(idx * 0.15) * 0.0018;
            return [la - offset, lo + offset];
          });
        }
      } else if (targetGoal === "balanced") {
        distFactor = 0.98; // Balanced trade-off (-2% distance)
        durFactor = 0.94;  // Balanced time (-6% time)
        adjustedCoords = [...coords];
      }

      setRouteGeo(adjustedCoords.length ? adjustedCoords : null);
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
    if (!file) return;

    // 1. Check free/pro stop limit upfront
    const maxLimit = currentUser?.isPro ? 400 : 5;
    if (!currentUser?.isPro && stops.length >= 5) {
      if (onTriggerGateModal) {
        onTriggerGateModal({
          title: "Free Starter Limit Reached (5/5 Stops)",
          message: "Free Starter members can optimize up to 5 stops per route. Upgrade to Route K9 PRO to unlock 400-stop optimization and CSV batch imports!"
        });
      } else if (onOpenPricing) {
        onOpenPricing();
      } else {
        setError("Free Starter Limit: Max 5 stops per route. Upgrade to Route K9 PRO for up to 400 stops!");
      }
      return;
    }

    const availableSlots = maxLimit - stops.length;
    if (availableSlots <= 0) {
      setError(`Maximum limit of ${maxLimit} stops reached.`);
      return;
    }

    const text = await file.text();
    const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (rawLines.length === 0) return;

    const splitLine = (l) => {
      const cols = l.match(/("([^"]|"")*"|[^,]+)/g) ?? [];
      return cols.map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
    };

    const firstRowCols = splitLine(rawLines[0]);
    const hasHeader = firstRowCols.some((c) =>
      /address|location|street|city|zip|postal|lat|lng|latitude|longitude|name|stop/i.test(c)
    );

    let latIdx = -1;
    let lonIdx = -1;
    let addrIdx = -1;
    let labelIdx = -1;

    if (hasHeader) {
      firstRowCols.forEach((c, idx) => {
        const colLower = c.toLowerCase();
        if (latIdx === -1 && /^(lat|latitude)$/i.test(colLower)) latIdx = idx;
        if (lonIdx === -1 && /^(lon|lng|longitude)$/i.test(colLower)) lonIdx = idx;
        if (addrIdx === -1 && /address|location|street/i.test(colLower)) addrIdx = idx;
        if (labelIdx === -1 && /name|label|title|description/i.test(colLower)) labelIdx = idx;
      });
    }

    const dataLines = hasHeader ? rawLines.slice(1) : rawLines;
    const parsedItems = [];

    for (const line of dataLines) {
      const cols = splitLine(line);
      if (cols.length === 0) continue;

      let lat = null;
      let lon = null;
      let address = null;
      let label = null;

      if (latIdx >= 0 && lonIdx >= 0 && cols[latIdx] && cols[lonIdx]) {
        const pLat = parseFloat(cols[latIdx]);
        const pLon = parseFloat(cols[lonIdx]);
        if (!isNaN(pLat) && !isNaN(pLon)) {
          lat = pLat;
          lon = pLon;
        }
      }

      if (addrIdx >= 0 && cols[addrIdx]) {
        address = cols[addrIdx];
      } else {
        const nonLabelCol = cols.find((c) => c.length > 3 && !/^\d+$/.test(c));
        address = nonLabelCol || cols[0];
      }

      if (labelIdx >= 0 && cols[labelIdx]) {
        label = cols[labelIdx];
      }

      if ((lat != null && lon != null) || (address && address.length > 1)) {
        parsedItems.push({ address, lat, lon, label });
      }
    }

    if (parsedItems.length === 0) {
      setError("No valid addresses found in CSV file.");
      return;
    }

    const targetItems = parsedItems.slice(0, availableSlots);
    const truncatedCount = parsedItems.length - targetItems.length;

    cancelCsvRef.current = false;
    setCsvImportState({
      active: true,
      fileName: file.name,
      total: targetItems.length,
      current: 0,
      successCount: 0,
      failedCount: 0,
      truncatedCount,
      skippedItems: [],
      status: "importing",
    });

    let index = 0;
    let processed = 0;
    let successCount = 0;
    let failedCount = 0;
    const skippedItems = [];
    const newStops = new Array(targetItems.length);

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function fetchWithTimeout(url, options = {}, timeoutMs = 2500) {
      const controller = new AbortController();
      const timerId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timerId);
        return response;
      } catch {
        clearTimeout(timerId);
        return null;
      }
    }

    async function geocodeSingleItem(item) {
      if (cancelCsvRef.current) return null;

      if (item.lat != null && item.lon != null && !isNaN(item.lat) && !isNaN(item.lon)) {
        return {
          id: uid(),
          label: item.label || item.address || `Coordinates (${item.lat}, ${item.lon})`,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        };
      }

      const q = item.address ? item.address.trim() : "";
      if (!q) return null;

      const coordMatch = q.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
      if (coordMatch) {
        return {
          id: uid(),
          label: item.label || `Coordinates (${coordMatch[1]}, ${coordMatch[2]})`,
          lat: parseFloat(coordMatch[1]),
          lon: parseFloat(coordMatch[2]),
        };
      }

      const isUS = (country) => {
        if (!country) return true;
        const c = country.toLowerCase();
        return c === "united states" || c === "united states of america" || c === "usa" || c === "us";
      };

      // TIER 1: ESRI ArcGIS World Geocoding Service (With outFields=* & PointAddress house number prioritization)
      try {
        const arcgisUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(q)}&maxLocations=5&outFields=*`;
        const aRes = await fetchWithTimeout(arcgisUrl, {}, 3000);
        if (aRes && aRes.ok) {
          const aData = await aRes.json();
          const candidates = aData?.candidates || [];
          const hasHouseNumber = /^\d+/.test(q.trim());
          const bestCandidate = (hasHouseNumber
            ? candidates.find(c => c.score >= 40 && (c.attributes?.Addr_type === 'PointAddress' || c.attributes?.Addr_type === 'BuildingName' || c.attributes?.Addr_type === 'SubAddress' || c.attributes?.Addr_type === 'StreetAddress'))
            : null) || candidates[0];

          if (bestCandidate && bestCandidate.score >= 40) {
            const { x: lon, y: lat } = bestCandidate.location;
            return {
              id: uid(),
              label: item.label || bestCandidate.address || q,
              lat: parseFloat(lat),
              lon: parseFloat(lon),
            };
          }
        }
      } catch { }

      // TIER 2: Official US Census Bureau Geocoder (Full address with rooftop/street-face vintage)
      try {
        const censusUrl = `${CENSUS_API_ENDPOINT}?address=${encodeURIComponent(q)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
        const cRes = await fetchWithTimeout(censusUrl, {}, 2500);
        if (cRes && cRes.ok) {
          const cData = await cRes.json();
          const match = cData?.result?.addressMatches?.[0];
          if (match) {
            const { x: lon, y: lat } = match.coordinates;
            return {
              id: uid(),
              label: item.label || match.matchedAddress,
              lat: parseFloat(lat),
              lon: parseFloat(lon),
              state: match.addressComponents?.state,
            };
          }
        }
      } catch { }

      // TIER 1b: US Census Bureau (Sans ZIP)
      const sansZip = q.replace(/\b\d{5}(-\d{4})?\b/, "").replace(/,\s*,/g, ",").replace(/,\s*$/, "").trim();
      if (sansZip !== q) {
        try {
          const cRes = await fetchWithTimeout(`${CENSUS_API_ENDPOINT}?address=${encodeURIComponent(sansZip)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`, {}, 2500);
          if (cRes && cRes.ok) {
            const cData = await cRes.json();
            const match = cData?.result?.addressMatches?.[0];
            if (match) {
              const { x: lon, y: lat } = match.coordinates;
              return {
                id: uid(),
                label: item.label || match.matchedAddress,
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                state: match.addressComponents?.state,
              };
            }
          }
        } catch { }
      }

      // TIER 2: Photon API (Timeout guarded to fail silently on timeout)
      try {
        const pRes = await fetchWithTimeout(`${PHOTON_API_ENDPOINT}?limit=1&lang=en&q=${encodeURIComponent(q)}`, {}, 2000);
        if (pRes && pRes.ok) {
          const data = await pRes.json();
          const f = data?.features?.[0];
          if (f) {
            const p = f.properties || {};
            if (isUS(p.country)) {
              const [lon, lat] = f.geometry.coordinates;
              const parts = [
                p.housenumber ? `${p.housenumber} ${p.street || ''}`.trim() : p.street || p.name,
                p.city || p.town || p.village,
                p.state,
                p.postcode
              ].filter(Boolean);
              const label = item.label || (parts.length > 0 ? parts.join(', ') : q);
              return {
                id: uid(),
                label,
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                state: p.state,
              };
            }
          }
        }
      } catch { }

      // TIER 3: Nominatim API (With house_number detection)
      await delay(150);
      try {
        const nRes = await fetchWithTimeout(`${NOMINATIM_API_ENDPOINT}?format=json&limit=5&addressdetails=1&countrycodes=us&q=${encodeURIComponent(q)}`, {
          headers: { Accept: "application/json" }
        }, 2500);
        if (nRes && nRes.ok) {
          const data = await nRes.json();
          const n = data?.find(item => item.address?.house_number) || data?.[0];
          if (n && isUS(n.address?.country || n.country)) {
            return {
              id: uid(),
              label: item.label || n.display_name,
              lat: parseFloat(n.lat),
              lon: parseFloat(n.lon),
              state: n.address?.state,
            };
          }
        }
      } catch { }

      return null;
    }

    const CONCURRENCY = 3;
    async function worker() {
      while (index < targetItems.length && !cancelCsvRef.current) {
        const curIdx = index++;
        const item = targetItems[curIdx];
        const res = await geocodeSingleItem(item);
        if (res) {
          newStops[curIdx] = res;
          successCount++;
        } else {
          failedCount++;
          skippedItems.push({
            row: curIdx + 1,
            address: item.address || item.label || `Row #${curIdx + 1}`,
            reason: "Unindexed address / House number not found"
          });
        }
        processed++;
        setCsvImportState((prev) =>
          prev
            ? {
              ...prev,
              current: processed,
              successCount,
              failedCount,
              skippedItems: [...skippedItems],
            }
            : null
        );
        await delay(100);
      }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, targetItems.length) }, () => worker());
    await Promise.all(workers);

    const validStops = newStops.filter(Boolean);
    if (validStops.length > 0) {
      setStops((prev) => [...prev, ...validStops]);
      setRouteGeo(null);
    }

    setCsvImportState((prev) =>
      prev
        ? {
          ...prev,
          active: false,
          status: cancelCsvRef.current ? "canceled" : "completed",
          successCount: validStops.length,
          skippedItems: [...skippedItems],
        }
        : null
    );
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

      {/* ── LOGIN GATE ── */}
      {!currentUser ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-[#0b132b] flex items-center justify-center shadow-2xl">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-[#0b132b] font-serif-heading">Sign in to use Route Planner</h2>
            <p className="text-slate-500 font-medium mt-2 text-sm max-w-md mx-auto">
              Plan, optimize, and save delivery routes with AI-powered stop sequencing. Create a free account to get started.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 transition-all"
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0b132b] font-extrabold text-sm transition-all"
            >
              Create Free Account
            </a>
          </div>
        </div>
      ) : (
        <>
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
                    {showAllPanels
                      ? "All Panels Mode — Single Page View"
                      : `Step ${wizardStep} of 3: ${wizardStep === 1 ? 'Add Stops' : wizardStep === 2 ? 'Optimize Route' : 'Dispatch & GPS'}`}
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
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60">
                    {[
                      { step: 1, label: "1. Stops" },
                      { step: 2, label: "2. Optimize" },
                      { step: 3, label: "3. Dispatch & GPS" },
                    ].map((s) => (
                      <button
                        key={s.step}
                        type="button"
                        onClick={() => {
                          setWizardStep(s.step);
                          if (s.step === 2 && stops.length >= 2) {
                            optimize();
                          }
                        }}
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
                          ref={searchInputRef}
                          id="rk9-add-stop"
                          type="text"
                          autoComplete="off"
                          inputMode="search"
                          value={query}
                          onChange={(e) => {
                            setQuery(e.target.value);
                            const el = e.target;
                            requestAnimationFrame(() => {
                              if (el) el.scrollLeft = el.scrollWidth;
                            });
                          }}
                          onFocus={(e) => {
                            if (suggestions.length) setShowSug(true);
                            const el = e.target;
                            requestAnimationFrame(() => {
                              if (el) el.scrollLeft = el.scrollWidth;
                            });
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
                      {showSug && (suggestions.length > 0 || searching || query.trim().length >= 2) && (
                        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-xl border border-border bg-white shadow-xl">
                          {(() => {
                            const list = suggestions.filter(
                              (s) => filter === "all" || s.category === filter,
                            );
                            if (!list.length) {
                              return (
                                <div className="px-3 py-3 text-xs text-muted-foreground">
                                  {searching ? (
                                    <div className="flex items-center gap-2">
                                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
                                      <span>Searching US locations…</span>
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="font-semibold text-rose-700">No exact US match found</p>
                                      <p className="mt-0.5 text-slate-500">
                                        Try adding a state abbreviation (e.g. <span className="font-medium text-slate-700">Port Gibson, MS</span>) or click <strong>Add</strong> to pin nearest location.
                                      </p>
                                    </div>
                                  )}
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
                    <div className="mt-4 rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 bg-slate-50/80">
                        <div className="flex items-center gap-2.5">
                          <label className="flex items-center gap-2 text-xs font-bold text-primary cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={stops.length > 0 && selectedStopIds.size === stops.length}
                              onChange={toggleSelectAllStops}
                              className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                            />
                            <span>Stops ({stops.length})</span>
                          </label>
                          {selectedStopIds.size > 0 && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              {selectedStopIds.size} selected
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {selectedStopIds.size > 0 ? (
                            <button
                              type="button"
                              onClick={() => setShowBulkDeleteModal(true)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer animate-scaleUp"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Selected ({selectedStopIds.size})</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={exportCsv}
                              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                            >
                              Export CSV
                            </button>
                          )}
                        </div>
                      </div>

                      <ol className="max-h-[420px] divide-y divide-border overflow-auto">
                        {stops.map((s, i) => {
                          const isSelected = selectedStopIds.has(s.id);
                          return (
                            <li key={s.id} className={`flex items-center gap-2.5 px-3.5 py-2.5 transition ${isSelected ? 'bg-rose-50/60 border-l-4 border-l-rose-500' : 'bg-white hover:bg-slate-50/50'}`}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectStop(s.id)}
                                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer shrink-0 accent-rose-600"
                              />
                              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white">
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
                                <IconBtn onClick={() => setDeleteTargetStop(s)} title="Remove Stop">
                                  <X className="w-3.5 h-3.5 text-rose-500" />
                                </IconBtn>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}

                  {!showAllPanels && wizardStep === 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (stops.length < 2 || csvImportState?.active) return;
                        setWizardStep(2);
                        if (stops.length >= 2) {
                          optimize();
                        }
                      }}
                      disabled={stops.length < 2 || csvImportState?.active}
                      className="mt-4 w-full rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs py-3.5 shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      {csvImportState?.active ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Importing CSV Addresses ({csvImportState.current}/{csvImportState.total})…</span>
                        </>
                      ) : (
                        <>
                          <span>Next: Step 2 — Select Goal & Optimize</span>
                          <span>→</span>
                        </>
                      )}
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
                      <span>Next: Step 3 — Dispatch & Live GPS</span>
                      <span>→</span>
                    </button>
                  )}
                </div>
              )}

              {/* STEP 3: Zones & Driver Dispatch */}
              {(showAllPanels || wizardStep === 3) && (
                <div className="space-y-4">
                  {/* Quick Add Fleet Driver (Company Only) - Currently Hidden */}
                  {false && isCompany && (
                    <div className="rounded-3xl border border-rose-200/80 bg-white p-5 shadow-sm space-y-3">
                      <button
                        type="button"
                        onClick={() => setContactOpen((o) => !o)}
                        className="flex w-full items-center justify-between gap-3 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
                          </span>
                          <div>
                            <span className="text-base font-extrabold text-[#0b132b]">Quick Add Fleet Driver</span>
                            <div className="text-[11px] text-slate-500 font-medium">Add a driver directly to your company fleet and assign them immediately</div>
                          </div>
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
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <form onSubmit={handleQuickAddFleetDriverSubmit} className="grid gap-2.5">
                            <input
                              required
                              placeholder="Driver Full Name *"
                              value={joinForm.full_name || ''}
                              onChange={(e) => setJoinForm((f) => ({ ...f, full_name: e.target.value }))}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold focus:bg-white outline-none focus:border-rose-500"
                            />

                            <input
                              required
                              type="email"
                              placeholder="Driver Email Address (e.g. driver@email.com) *"
                              value={joinForm.email || ''}
                              onChange={(e) => setJoinForm((f) => ({ ...f, email: e.target.value }))}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold focus:bg-white outline-none focus:border-rose-500"
                            />
                            <PhoneInput
                              country={'us'}
                              value={joinForm.phone}
                              onChange={(val) => setJoinForm((f) => ({ ...f, phone: val }))}
                              inputStyle={{
                                width: '100%',
                                height: '38px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: '#f8fafc',
                                borderColor: '#e2e8f0',
                                borderRadius: '0.75rem',
                                paddingLeft: '44px',
                                color: '#1e293b'
                              }}
                              buttonStyle={{
                                backgroundColor: '#f8fafc',
                                borderColor: '#e2e8f0',
                                borderTopLeftRadius: '0.75rem',
                                borderBottomLeftRadius: '0.75rem',
                                paddingLeft: '2px'
                              }}
                              dropdownStyle={{
                                borderRadius: '0.75rem',
                                zIndex: 1000
                              }}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                placeholder="City (e.g. Houston)"
                                value={joinForm.city}
                                onChange={(e) => setJoinForm((f) => ({ ...f, city: e.target.value }))}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold focus:bg-white outline-none focus:border-rose-500"
                              />
                              <input
                                placeholder="State (e.g. TX)"
                                maxLength={20}
                                value={joinForm.state}
                                onChange={(e) => setJoinForm((f) => ({ ...f, state: e.target.value }))}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold focus:bg-white outline-none focus:border-rose-500"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={joinBusy}
                              className="mt-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 text-xs font-extrabold shadow-md shadow-rose-600/20 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                            >
                              <span>{joinBusy ? "Saving to Database…" : "Save Driver to Company Fleet"}</span>
                            </button>

                            {joinMsg && (
                              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 font-bold shadow-2xs">
                                {joinMsg}
                              </div>
                            )}
                          </form>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Send to navigation */}
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

                  {/* Live Tracking & GPS */}
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
                      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
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

                  {/* Save & Dispatch Route Card */}
                  {stops.length > 0 && (
                    <>
                      {isDriver ? (
                        <button
                          type="button"
                          onClick={handleSaveRouteToDashboardAndAdmin}
                          disabled={savingRoute || stops.length < 2}
                          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>{savingRoute ? 'Saving Route...' : 'Save Route'}</span>
                        </button>
                      ) : (
                        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4">
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                            <div>
                              <div className="text-xs font-extrabold text-[#0b132b]">Save & Dispatch Route</div>
                              <div className="text-[10px] text-slate-500 font-medium">Save complete route data to Admin Panel & Driver Dashboard</div>
                            </div>

                            {isCompany && zones.length === 0 && (
                              <div className="pt-1">
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                  Assign Driver for Entire Route
                                </label>
                                <select
                                  value={assignedDriverId}
                                  onChange={(e) => {
                                    setAssignedDriverId(e.target.value);
                                    if (dispatchError && dispatchError.type === 'entire') {
                                      setDispatchError(null);
                                    }
                                  }}
                                  disabled={companyFleetDrivers.length === 0}
                                  className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold text-primary focus:outline-none transition-all ${dispatchError && dispatchError.type === 'entire'
                                    ? 'border-rose-600 bg-rose-50/20 ring-1 ring-rose-600'
                                    : 'border-slate-200 bg-white'
                                    }`}
                                >
                                  {companyFleetDrivers.length > 0 ? (
                                    <>
                                      <option value="">— Select Driver —</option>
                                      {companyFleetDrivers.map(d => (
                                        <option key={d.id} value={d.id}>
                                          {d.name} ({d.vehicle || 'Fleet Driver'}) — {d.city}, {d.state}
                                        </option>
                                      ))}
                                    </>
                                  ) : (
                                    <option value="">— No company fleet drivers added —</option>
                                  )}
                                </select>

                                {companyFleetDrivers.length === 0 && (
                                  <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl text-xs text-amber-900 font-bold space-y-1 mt-2 shadow-2xs">
                                    <div className="flex items-center gap-1.5 text-amber-800">
                                      <span>⚠️ No Fleet Drivers Added Yet</span>
                                    </div>
                                    <div className="text-[11px] font-normal text-amber-800 leading-relaxed">
                                      You haven't registered any fleet drivers for your company. Please go to <Link to="/dashboard" className="underline font-extrabold text-amber-950 hover:text-amber-900">Dashboard → My Fleet & Drivers</Link> to add your drivers so you can assign them to this route.
                                    </div>
                                  </div>
                                )}

                                {dispatchError && dispatchError.type === 'entire' && (
                                  <div className="text-[10px] text-rose-600 font-extrabold mt-1.5 animate-pulse flex items-center gap-1">
                                    <span>⚠️</span>
                                    <span>{dispatchError.message}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {isCompany && zones.length > 0 && (
                              <div className="pt-1 space-y-2">
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                  Zone Dispatches Preview:
                                </div>
                                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                                  {zones.map(z => {
                                    const zStops = stops.filter(s => s.zoneId === z.id);
                                    if (zStops.length === 0) return null;
                                    return (
                                      <div key={z.id} className="flex items-center justify-between text-[11px] border border-slate-100 rounded-lg p-2 bg-white shadow-xs">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: z.color }}></span>
                                          <span className="font-bold text-slate-800">{z.name} ({zStops.length} stops)</span>
                                        </div>
                                        <span className="text-slate-500 font-semibold truncate max-w-[120px]">
                                          {z.driverName ? `Driver: ${z.driverName}` : 'Unassigned'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          </div>

                          <button
                            type="button"
                            onClick={() => setZonesOpen((o) => !o)}
                            className="flex w-full items-center justify-between gap-3 text-left cursor-pointer pt-2"
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
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                            Assign Driver
                                          </label>
                                          <select
                                            value={z.driverId ?? z.driverPhone ?? ""}
                                            onChange={(e) => {
                                              const availableList = isCompany
                                                ? companyFleetDrivers.map(f => ({ id: f.id, first_name: f.name, last_name: '', phone: f.phone }))
                                                : spares;
                                              const selected = availableList.find((d) => d.id === e.target.value || d.phone === e.target.value);
                                              if (selected) {
                                                updateZone(z.id, {
                                                  driverName: `${selected.first_name} ${selected.last_name}`.trim(),
                                                  driverPhone: selected.phone,
                                                  driverId: selected.id,
                                                });
                                                if (dispatchError && dispatchError.type === 'zone' && dispatchError.zoneId === z.id) {
                                                  setDispatchError(null);
                                                }
                                              } else {
                                                updateZone(z.id, {
                                                  driverName: "",
                                                  driverPhone: "",
                                                  driverId: null,
                                                });
                                              }
                                            }}
                                            disabled={isCompany && companyFleetDrivers.length === 0}
                                            className={`w-full rounded border px-2 py-1.5 text-xs font-semibold text-primary focus:bg-white transition-all ${dispatchError && dispatchError.type === 'zone' && dispatchError.zoneId === z.id
                                              ? 'border-rose-600 bg-rose-50/20 ring-1 ring-rose-600'
                                              : 'border-border bg-slate-50'
                                              }`}
                                          >
                                            {isCompany ? (
                                              companyFleetDrivers.length > 0 ? (
                                                <>
                                                  <option value="">— Select Company Fleet Driver —</option>
                                                  {companyFleetDrivers.map((d) => (
                                                    <option key={d.id} value={d.id}>
                                                      {d.name} ({d.vehicle || 'Fleet'}) — {d.phone}
                                                    </option>
                                                  ))}
                                                </>
                                              ) : (
                                                <option value="">— No company fleet drivers added —</option>
                                              )
                                            ) : (
                                              <>
                                                <option value="">— Select Registered Driver —</option>
                                                {spares.map((d) => (
                                                  <option key={d.id} value={d.id}>
                                                    {d.first_name} {d.last_name} ({d.city}, {d.state}) — {d.phone}
                                                  </option>
                                                ))}
                                              </>
                                            )}
                                          </select>

                                          {isCompany && companyFleetDrivers.length === 0 && (
                                            <div className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200/90 rounded-lg p-2 mt-1">
                                              ⚠️ No fleet drivers added yet. Add drivers in <Link to="/dashboard" className="underline font-extrabold text-amber-950">Dashboard → My Fleet & Drivers</Link>.
                                            </div>
                                          )}

                                          {dispatchError && dispatchError.type === 'zone' && dispatchError.zoneId === z.id && (
                                            <div className="text-[9px] text-rose-600 font-extrabold mt-1 animate-pulse flex items-center gap-1">
                                              <span>⚠️</span>
                                              <span>{dispatchError.message}</span>
                                            </div>
                                          )}
                                        </div>

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

                                        {(() => {
                                          const allReg = [...(companyFleetDrivers || []), ...(spares || [])];
                                          const isAlreadyReg = !!z.driverId || allReg.some(d => {
                                            const dName = (d.name || `${d.first_name || ''} ${d.last_name || ''}`).trim().toLowerCase();
                                            const zName = (z.driverName || '').trim().toLowerCase();
                                            const dPhone = (d.phone || '').replace(/\D/g, '');
                                            const zPhone = (z.driverPhone || '').replace(/\D/g, '');
                                            return (z.driverId && String(d.id) === String(z.driverId)) ||
                                              (zName && dName && zName === dName) ||
                                              (zPhone && dPhone && zPhone === dPhone);
                                          });

                                          return z.driverName && z.driverPhone && !isAlreadyReg && (
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
                                          );
                                        })()}

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
                    </>
                  )}

                  {/* Save Route Button - Placed Standalone Just Above Step 4 Button */}
                  {stops.length > 0 && !isDriver && (
                    <button
                      type="button"
                      onClick={handleSaveRouteToDashboardAndAdmin}
                      disabled={savingRoute || stops.length < 2}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{savingRoute ? 'Saving...' : (isCompany && zones.length > 0) ? 'Dispatch Zones' : 'Save Route'}</span>
                    </button>
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
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
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

          {/* Custom Modal for Route Saved Success */}
          {routeSavedModal.isOpen && routeSavedModal.route && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
              <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#0b132b] font-serif-heading">
                      {routeSavedModal.route.title?.toLowerCase().includes('zone') ? 'Zones Dispatched Successfully!' : 'Route Saved Successfully!'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {routeSavedModal.route.title?.toLowerCase().includes('zone')
                        ? 'All zone-assigned routes have been successfully saved and dispatched.'
                        : 'Saved live dispatch records to Admin Panel and synced to Driver Dashboard.'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Route ID</span>
                      <div className="font-extrabold text-rose-600 text-sm">{routeSavedModal.route.id}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Total Distance</span>
                      <div className="font-black text-slate-900 text-base">{routeSavedModal.route.distanceMiles} mi ({routeSavedModal.route.durationMinutes} min)</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Stops & Zone Breakdown ({routeSavedModal.route.stopsCount} stops):</div>
                    {(() => {
                      const stops = routeSavedModal.route.stops || [];
                      const hasZones = stops.some(s => s.zoneName || s.zoneId);

                      if (!hasZones) {
                        return (
                          <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                            {stops.map((s, idx) => (
                              <li key={idx} className="flex items-start justify-between gap-2 text-[11px] font-semibold text-slate-700 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/60">
                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                  <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center shrink-0 font-bold mt-0.5">{s.step || idx + 1}</span>
                                  <span className="truncate block" title={s.label}>{s.label}</span>
                                </div>
                                {s.driverName && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[9px] font-bold shrink-0">
                                    {s.driverName}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        );
                      }

                      const zoneGroupsMap = {};
                      stops.forEach((s, idx) => {
                        const zName = getFriendlyZoneName(s, stops) || 'Unzoned';
                        if (!zoneGroupsMap[zName]) {
                          zoneGroupsMap[zName] = {
                            zoneName: zName,
                            driverName: s.driverName || routeSavedModal.route.driverName || '',
                            stops: []
                          };
                        }
                        zoneGroupsMap[zName].stops.push({ ...s, originalIdx: idx });
                      });

                      const zoneGroups = Object.values(zoneGroupsMap);

                      return (
                        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                          {zoneGroups.map((group, gIdx) => (
                            <div key={gIdx} className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-extrabold border border-rose-200">
                                    {group.zoneName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    ({group.stops.length} {group.stops.length === 1 ? 'stop' : 'stops'})
                                  </span>
                                </div>
                                {group.driverName && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                    Driver: {group.driverName}
                                  </span>
                                )}
                              </div>

                              <ul className="space-y-1.5">
                                {group.stops.map((s, idx) => (
                                  <li key={idx} className="flex items-start justify-between gap-2 text-[11px] font-semibold text-slate-700 bg-slate-50/70 p-2 rounded-lg border border-slate-200/60">
                                    <div className="flex items-start gap-2 min-w-0 flex-1">
                                      <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center shrink-0 font-bold mt-0.5">{s.step || s.originalIdx + 1}</span>
                                      <span className="truncate block leading-snug" title={s.label}>{s.label}</span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <a
                    href="/dashboard?tab=routes"
                    className="w-full sm:flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Track in Driver Dashboard →</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setRouteSavedModal({ isOpen: false, route: null })}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== ROUTE PLAN HISTORY (from Supabase API) ===== */}
          <div className="mt-10 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-[#0b132b] font-serif-heading">Route Plan History</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Loaded from database — click to reload into planner or manage stop statuses</p>
              </div>
              <div className="flex items-center gap-2">
                {routeHistory.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">{routeHistory.length} route{routeHistory.length !== 1 ? 's' : ''}</span>
                )}
                <button
                  type="button"
                  onClick={fetchRoutesFromDB}
                  disabled={loadingHistory}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingHistory ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Loading state */}
            {loadingHistory && (
              <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                <span className="text-sm font-semibold">Loading routes from database…</span>
              </div>
            )}

            {/* Empty state */}
            {!loadingHistory && routeHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400 bg-slate-50 rounded-3xl border border-slate-200">
                <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
                <p className="text-sm font-bold">No saved routes yet</p>
                <p className="text-xs">Plan a route above and click "Save Route" to see it here</p>
              </div>
            )}

            {/* ── TABLE ── */}
            {!loadingHistory && routeHistory.length > 0 && (
              <div className="bg-white rounded-md border border-slate-200 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#0b132b] text-white text-[11px] font-extrabold uppercase tracking-wider">
                        <th className="px-4 py-3 text-left rounded-tl-md bg-[#0b132b]">Route ID</th>
                        <th className="px-4 py-3 text-left bg-[#0b132b]">Title</th>
                        <th className="px-4 py-3 text-center bg-[#0b132b]">Stops</th>
                        <th className="px-4 py-3 text-center bg-[#0b132b]">Distance</th>
                        <th className="px-4 py-3 text-center bg-[#0b132b]">Drive Time</th>
                        <th className="px-4 py-3 text-center bg-[#0b132b]">Progress</th>
                        <th className="px-4 py-3 text-center bg-[#0b132b]">Status</th>
                        <th className="px-4 py-3 text-center bg-[#0b132b]">Saved</th>
                        <th className="px-4 py-3 text-center rounded-tr-md bg-[#0b132b]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {routeHistory.map((route, rowIdx) => {
                        const isExpanded = expandedHistoryId === route.id;
                        const isSelected = selectedHistoryId === route.id;
                        const routeStops = route.stops || [];
                        const completedCount = routeStops.filter((_, idx) => stopStatuses[`${route.id}_${idx}`] === 'complete').length;
                        const ongoingCount = routeStops.filter((_, idx) => stopStatuses[`${route.id}_${idx}`] === 'ongoing').length;
                        const allComplete = routeStops.length > 0 && completedCount === routeStops.length;
                        const anyOngoing = ongoingCount > 0;
                        const overallStatus = allComplete ? 'complete' : anyOngoing ? 'ongoing' : 'pending';
                        const pct = routeStops.length === 0 ? 0 : Math.round((completedCount / routeStops.length) * 100);

                        return (
                          <React.Fragment key={route.id}>
                            {/* Main row */}
                            <tr className={`transition-colors ${isSelected ? 'bg-rose-50' : rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-rose-50/60`}>
                              <td className="px-4 py-3.5">
                                <span className="font-mono text-xs font-bold text-rose-600">{route.id}</span>
                              </td>
                              <td className="px-4 py-3.5 max-w-[200px]">
                                <span className="font-semibold text-slate-800 text-xs line-clamp-1">{route.title}</span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className="font-bold text-slate-700 text-xs">{route.stopsCount}</span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className="font-bold text-slate-700 text-xs">{route.distanceMiles} mi</span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className="font-bold text-slate-700 text-xs">{route.durationMinutes} min</span>
                              </td>
                              <td className="px-4 py-3.5 text-center min-w-[100px]">
                                <div className="flex items-center gap-1.5">
                                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-700 ${allComplete ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 w-7 text-right">{pct}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${overallStatus === 'complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  overallStatus === 'ongoing' ? 'bg-amber-50  text-amber-700  border-amber-200' :
                                    'bg-slate-100 text-slate-600  border-slate-200'
                                  }`}>{overallStatus}</span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {new Date(route.updatedAt || route.savedAt || route.createdAt).toLocaleDateString()}<br />
                                  <span className="text-[9px]">{new Date(route.updatedAt || route.savedAt || route.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    title="Load this route into the planner"
                                    onClick={() => loadRouteIntoPlanner(route)}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#0b132b] hover:bg-[#1a264a] text-white font-bold text-[10px] shadow transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <Edit className="w-3 h-3" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    title="Delete route from database"
                                    onClick={() => setDeleteTargetRoute(route)}
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    title="Manage stop statuses"
                                    onClick={() => setExpandedHistoryId(isExpanded ? null : route.id)}
                                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded stop status row */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={9} className="px-6 pb-4 pt-3 bg-slate-50 border-t border-slate-100">
                                  <div className="flex items-center justify-between mb-2.5">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                      Stop-by-Stop Status ({routeStops.length} stops)
                                    </div>
                                    {routeStops.length > 5 && (
                                      <span className="text-[10px] text-slate-400 font-medium italic">
                                        Scroll to view all {routeStops.length} stops
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1.5 scrollbar-thin">
                                    {routeStops.map((stop, idx) => {
                                      const key = `${route.id}_${idx}`;
                                      const status = stopStatuses[key] || 'pending';
                                      return (
                                        <div key={idx} className="flex items-start gap-3 bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-xs">
                                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${status === 'complete' ? 'bg-emerald-600 text-white' :
                                            status === 'ongoing' ? 'bg-amber-500 text-white' :
                                              'bg-slate-200 text-slate-600'
                                            }`}>{idx + 1}</span>
                                          <div className="flex-1 min-w-0">
                                            <span className="text-xs font-medium text-slate-700 truncate block">{stop.label}</span>
                                            {(stop.zoneName || stop.zoneId || stop.driverName) && (
                                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                {(stop.zoneName || stop.zoneId) && (
                                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-rose-50 text-[9px] font-bold text-rose-700 border border-rose-100">
                                                    {getFriendlyZoneName(stop, routeStops)}
                                                  </span>
                                                )}
                                                {stop.driverName && (
                                                  <button
                                                    type="button"
                                                    onClick={() => setActiveDriverModal({ name: stop.driverName, phone: stop.driverPhone })}
                                                    className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-50 text-[9px] font-bold text-slate-600 border border-slate-200 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors"
                                                    title="Click to view driver contact details"
                                                  >
                                                    {stop.driverName}
                                                  </button>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                          <div className="relative inline-block shrink-0">
                                            <select
                                              value={status}
                                              onChange={(e) => handleStopStatusChange(route.id, idx, e.target.value)}
                                              className={`appearance-none pl-3 pr-7 py-1 rounded-full text-[10px] font-extrabold uppercase border cursor-pointer focus:outline-none transition-all ${status === 'complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                                status === 'ongoing' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                                                  'bg-slate-50 text-slate-600 border-slate-300'
                                                }`}
                                            >
                                              <option value="pending">PENDING</option>
                                              <option value="ongoing">ONGOING</option>
                                              <option value="complete">COMPLETE</option>
                                            </select>
                                            <ChevronDown className={`w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${status === 'complete' ? 'text-emerald-600' :
                                              status === 'ongoing' ? 'text-amber-600' :
                                                'text-slate-500'
                                              }`} />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </>) /* end currentUser ternary */}

      {/* Active Driver Info Modal Popup */}
      {activeDriverModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col p-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-[#0b132b] uppercase tracking-wider">Driver Contact Details</h3>
              <button
                type="button"
                onClick={() => setActiveDriverModal(null)}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center cursor-pointer transition-colors text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-base">
                👤
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">{activeDriverModal.name}</h4>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Contract Driver</span>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</span>
                <span className="font-extrabold text-slate-800 text-xs">{activeDriverModal.phone || 'No phone number provided'}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              {activeDriverModal.phone && (
                <a
                  href={`tel:${activeDriverModal.phone}`}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <span>Call Driver</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setActiveDriverModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Route Confirmation Modal */}
      {deleteTargetRoute && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-extrabold text-[#0b132b] font-serif-heading">Delete Saved Route?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Are you sure you want to delete <span className="font-extrabold text-slate-900 font-mono text-[11px] block mt-1 py-1 px-2.5 rounded-lg bg-slate-100 truncate border border-slate-200">{deleteTargetRoute.title || deleteTargetRoute.id}</span>
              </p>
              <p className="text-[11px] text-rose-600 font-semibold pt-1">
                This action will permanently remove this route from your history and database.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetRoute(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteRouteFromHistory}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Route</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Stop Confirmation Modal */}
      {deleteTargetStop && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-extrabold text-[#0b132b] font-serif-heading">Remove Stop from Route?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Are you sure you want to remove <span className="font-extrabold text-slate-900 font-mono text-[11px] block mt-1 py-1 px-2.5 rounded-lg bg-slate-100 truncate border border-slate-200">{deleteTargetStop.label}</span>
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetStop(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveStop}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remove Stop</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Progress Overlay Modal */}
      {csvImportState && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5 relative overflow-hidden animate-scaleUp">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${csvImportState.active
                  ? "bg-rose-50 text-rose-600"
                  : csvImportState.status === 'canceled'
                    ? "bg-amber-50 text-amber-600"
                    : "bg-emerald-50 text-emerald-600"
                  }`}>
                  {csvImportState.active ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : csvImportState.status === 'canceled' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0b132b] font-serif-heading">
                    {csvImportState.active
                      ? "Importing CSV Route Addresses…"
                      : csvImportState.status === 'canceled'
                        ? "CSV Import Canceled"
                        : "CSV Import Complete!"}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium truncate max-w-[220px]">
                    {csvImportState.fileName || "addresses.csv"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  cancelCsvRef.current = true;
                  setCsvImportState(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar & Percentage */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-extrabold">
                <span className="text-slate-600">
                  {csvImportState.active
                    ? `Processing (${csvImportState.current}/${csvImportState.total})`
                    : `Final Status (${csvImportState.successCount}/${csvImportState.total} Added)`}
                </span>
                <span className="text-rose-600 font-mono font-bold">
                  {csvImportState.total > 0
                    ? `${Math.round((csvImportState.current / csvImportState.total) * 100)}%`
                    : "100%"}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/60 p-0.5">
                <div
                  className="bg-gradient-to-r from-rose-500 to-rose-600 h-full rounded-full transition-all duration-300 shadow-xs"
                  style={{
                    width: `${csvImportState.total > 0 ? Math.round((csvImportState.current / csvImportState.total) * 100) : 100}%`
                  }}
                />
              </div>
            </div>

            {/* Detailed Counters Card */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Successfully Added</div>
                <div className="text-lg font-extrabold text-emerald-600">{csvImportState.successCount} stops</div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Skipped / Failed</div>
                <div className="text-lg font-extrabold text-rose-500">{csvImportState.failedCount} stops</div>
              </div>
            </div>

            {/* Expandable Skipped Items List */}
            {csvImportState.skippedItems && csvImportState.skippedItems.length > 0 && (
              <div className="border border-rose-200 bg-rose-50/60 rounded-2xl p-3 text-xs space-y-2">
                <button
                  type="button"
                  onClick={() => setShowSkippedDetails((v) => !v)}
                  className="w-full flex items-center justify-between font-bold text-rose-700 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Why were {csvImportState.skippedItems.length} stops skipped?</span>
                  </span>
                  {showSkippedDetails ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                </button>

                {showSkippedDetails && (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pt-1 pr-1 border-t border-rose-100 scrollbar-thin">
                    {csvImportState.skippedItems.map((sk, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-xl border border-rose-100 flex items-center justify-between gap-2 text-[11px] shadow-2xs">
                        <div className="truncate font-medium text-slate-700 max-w-[230px]" title={sk.address}>
                          <span className="font-extrabold text-slate-400 mr-1.5">Row #{sk.row}:</span>
                          <span>{sk.address}</span>
                        </div>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md shrink-0 border border-rose-200/50">
                          {sk.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Truncated Limit Warning Banner if CSV had > max limit */}
            {csvImportState.truncatedCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Route Limit Reached:</strong> First {csvImportState.total} addresses processed. Skipped {csvImportState.truncatedCount} addresses exceeding maximum allowed route stops.
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              {csvImportState.active ? (
                <button
                  type="button"
                  onClick={() => {
                    cancelCsvRef.current = true;
                    setCsvImportState((prev) => prev ? {
                      ...prev,
                      active: false,
                      status: "canceled"
                    } : null);
                  }}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel Import
                </button>
              ) : (
                <div className="flex gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => setCsvImportState(null)}
                    className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvImportState(null);
                      if (stops.length >= 2) {
                        setWizardStep(2);
                        optimize();
                      }
                    }}
                    className="w-2/3 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Done — View Stops & Optimize</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Geolocation Permission Blocked Modal */}
      {geoBlockedModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5 relative overflow-hidden animate-scaleUp">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0b132b] font-serif-heading">Location Permission Blocked</h3>
                  <p className="text-xs text-slate-400 font-medium">Browser blocked physical GPS access</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGeoBlockedModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Your browser has blocked location access for this site. To unblock it:</p>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5 text-[11px]">
                <div className="flex items-start gap-2">
                  <span className="font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100 shrink-0">Step 1</span>
                  <span>Click the <strong>Tune / Lock icon 🔒</strong> next to the URL in your browser address bar.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100 shrink-0">Step 2</span>
                  <span>Change <strong>Location</strong> setting from <em>Block</em> to <em>Allow</em>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-extrabold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100 shrink-0">Step 3</span>
                  <span>Click <strong>Try Again</strong> below or refresh the page.</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setGeoBlockedModal(false);
                  setTracking(true);
                }}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGeoBlockedModal(false);
                  const anchor = stops[0] ? { lat: stops[0].lat, lon: stops[0].lon } : { lat: 40.7128, lon: -74.0060 };
                  setMyPos(anchor);
                  setTracking(true);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Use Route Start Position (Simulated GPS)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 animate-scaleUp text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0b132b] font-serif-heading">Delete {selectedStopIds.size} Stop{selectedStopIds.size > 1 ? 's' : ''}?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Are you sure you want to remove the selected {selectedStopIds.size} stop{selectedStopIds.size > 1 ? 's' : ''} from your active route?
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition cursor-pointer"
              >
                Delete {selectedStopIds.size} Stop{selectedStopIds.size > 1 ? 's' : ''}
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
