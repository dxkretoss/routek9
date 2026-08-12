import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// React Hook to load vehicle classes dynamically from database
export function useVehicleClasses() {
  const [vehicleClasses, setVehicleClasses] = useState(() => {
    try {
      const stored = localStorage.getItem('routek9_vehicle_types');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(v => v.vehicle_name);
        }
      }
    } catch (e) {
      console.warn("Failed to read vehicle types from cache:", e);
    }
    return []; // No static fallbacks!
  });

  useEffect(() => {
    let active = true;
    supabase
      .from('vehicle_types')
      .select('vehicle_name')
      .order('vehicle_name', { ascending: true })
      .then(({ data, error }) => {
        if (active && !error && data && data.length > 0) {
          const classes = data.map(v => v.vehicle_name);
          setVehicleClasses(classes);
          localStorage.setItem('routek9_vehicle_types', JSON.stringify(data));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return vehicleClasses;
}

export const COMPANY_FLEET_OPTION = "Company Fleet / Multi-Vehicle";
