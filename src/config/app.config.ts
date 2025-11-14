/**
 * Application Configuration
 * Centralized configuration for the LocalLens application
 */

export const appConfig = {
  // Location information
  location: {
    city: 'Richmond',
    state: 'VA',
    displayName: 'Richmond, VA'
  },
  
  // Application metadata
  app: {
    name: 'LocalLens',
    description: 'Search for Points of Interest using natural language queries'
  },
  
  // Data source
  data: {
    poisJsonPath: '/src/data/pois.json'
  }
};
