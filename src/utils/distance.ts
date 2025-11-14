import type { Location, POI } from '../types/poi';
import { appConfig } from '../config/app.config';

/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param point1 - First location
 * @param point2 - Second location
 * @returns Distance in miles
 */
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 3959; // Earth's radius in miles
  
  const lat1Rad = point1.latitude * (Math.PI / 180);
  const lat2Rad = point2.latitude * (Math.PI / 180);
  const deltaLatRad = (point2.latitude - point1.latitude) * (Math.PI / 180);
  const deltaLonRad = (point2.longitude - point1.longitude) * (Math.PI / 180);
  
  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Find POIs of a specific type that are within the configured nearby distance of POIs of another type
 * @param targetPOIs - POIs to search near (e.g., parks)
 * @param nearbyPOIs - POIs to find nearby (e.g., restaurants)
 * @param maxDistance - Maximum distance in miles (defaults to config value)
 * @returns Array of target POIs with their nearby POIs including distances
 */
export function findPOIsWithNearby(
  targetPOIs: POI[], 
  nearbyPOIs: POI[], 
  maxDistance: number = appConfig.search.nearbyDistanceMiles
): Array<POI & { nearbyPOIs: Array<POI & { distance: number }> }> {
  return targetPOIs.map(targetPOI => {
    const nearby = nearbyPOIs
      .map(nearbyPOI => {
        const distance = calculateDistance(targetPOI.location, nearbyPOI.location);
        return { ...nearbyPOI, distance };
      })
      .filter(nearbyPOI => nearbyPOI.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance); // Sort by distance, closest first
    
    return {
      ...targetPOI,
      nearbyPOIs: nearby
    };
  }).filter(poi => poi.nearbyPOIs.length > 0); // Only return POIs that have nearby matches
}

/**
 * Check if a POI is within the specified distance of another POI
 * @param poi1 - First POI
 * @param poi2 - Second POI
 * @param maxDistance - Maximum distance in miles
 * @returns True if POIs are within the specified distance
 */
export function isWithinDistance(poi1: POI, poi2: POI, maxDistance: number): boolean {
  const distance = calculateDistance(poi1.location, poi2.location);
  return distance <= maxDistance;
}

/**
 * Filter POIs by attributes (e.g., cuisine type)
 * @param pois - Array of POIs to filter
 * @param requestedAttributes - Array of attribute strings to match
 * @returns Filtered array of POIs that match the requested attributes
 */
export function filterPOIsByAttributes(pois: POI[], requestedAttributes: string[]): POI[] {
  if (!requestedAttributes || requestedAttributes.length === 0) {
    return pois;
  }
  
  return pois.filter(poi => {
    if (!poi.attributes) {
      return false;
    }
    
    // Check if any requested attribute matches any POI attribute
    const matches = requestedAttributes.some(reqAttr => 
      poi.attributes!.some(poiAttr => {
        const reqLower = reqAttr.toLowerCase();
        const poiLower = poiAttr.toLowerCase();
        const match = poiLower.includes(reqLower) || reqLower.includes(poiLower);
        return match;
      })
    );
    
    return matches;
  });
}

/**
 * Format distance for display
 * @param distance - Distance in miles
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 0.1) {
    return 'Less than 0.1 miles';
  } else if (distance < 1) {
    return `${distance.toFixed(1)} miles`;
  } else {
    return `${distance.toFixed(1)} miles`;
  }
}