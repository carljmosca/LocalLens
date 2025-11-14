// Test distance calculations
function calculateDistance(point1, point2) {
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

// Sample locations from the POI data
const maymont = { latitude: 37.5344, longitude: -77.4722 }; // Maymont Park
const roosevelt = { latitude: 37.5523, longitude: -77.4634 }; // The Roosevelt restaurant
const vmfa = { latitude: 37.5553, longitude: -77.4747 }; // Virginia Museum of Fine Arts
const belleIsle = { latitude: 37.5312, longitude: -77.4567 }; // Belle Isle
const lemaire = { latitude: 37.5412, longitude: -77.4356 }; // Lemaire restaurant

console.log('Testing distance calculations:');
console.log('Maymont Park to The Roosevelt:', calculateDistance(maymont, roosevelt).toFixed(3), 'miles');
console.log('Maymont Park to VMFA:', calculateDistance(maymont, vmfa).toFixed(3), 'miles');
console.log('Belle Isle to Lemaire:', calculateDistance(belleIsle, lemaire).toFixed(3), 'miles');
console.log('The Roosevelt to VMFA:', calculateDistance(roosevelt, vmfa).toFixed(3), 'miles');

console.log('\nWithin 1 mile checks:');
console.log('Maymont to Roosevelt within 1 mile:', calculateDistance(maymont, roosevelt) <= 1.0);
console.log('Maymont to VMFA within 1 mile:', calculateDistance(maymont, vmfa) <= 1.0);
console.log('Belle Isle to Lemaire within 1 mile:', calculateDistance(belleIsle, lemaire) <= 1.0);

console.log('\nAll distances:');
console.log('Maymont to Roosevelt:', calculateDistance(maymont, roosevelt));
console.log('Maymont to VMFA:', calculateDistance(maymont, vmfa));
console.log('Belle Isle to Lemaire:', calculateDistance(belleIsle, lemaire));