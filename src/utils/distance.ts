import type { Location } from '../types/poi';

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