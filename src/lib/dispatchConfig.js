/**
 * Centralized Dispatch & Notification Configuration for RouteK9
 * Changing the radius value here will automatically update all dispatch feeds, 
 * proximity queries, database notifications, and browser alert guards across the entire app.
 */

export const DEFAULT_DISPATCH_RADIUS_MILES = 25;

/**
 * Helper to compute Haversine great-circle distance between two GPS coordinates in miles
 */
export function calculateDistanceMiles(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lat1 === undefined || lon1 === null || lon1 === undefined) return null;
  if (lat2 === null || lat2 === undefined || lon2 === null || lon2 === undefined) return null;
  const pLat1 = typeof lat1 === 'number' ? lat1 : parseFloat(String(lat1));
  const pLon1 = typeof lon1 === 'number' ? lon1 : parseFloat(String(lon1));
  const pLat2 = typeof lat2 === 'number' ? lat2 : parseFloat(String(lat2));
  const pLon2 = typeof lon2 === 'number' ? lon2 : parseFloat(String(lon2));
  if (isNaN(pLat1) || isNaN(pLon1) || isNaN(pLat2) || isNaN(pLon2)) return null;

  const R = 3958.8; // Earth's radius in miles
  const dLat = (pLat2 - pLat1) * (Math.PI / 180);
  const dLon = (pLon2 - pLon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pLat1 * (Math.PI / 180)) *
    Math.cos(pLat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
