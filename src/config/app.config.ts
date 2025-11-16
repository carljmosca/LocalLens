/**
 * Application Configuration
 * 
 * Central configuration object for the LocalLens application
 * 
 * Copyright (c) 2025 Mosca IT LLC. All rights reserved.
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
  
  // Search configuration
  search: {
    // Distance in miles for "nearby" searches
    nearbyDistanceMiles: 1.5
  },
  
  // Debug configuration
  debug: {
    // Enable console logging for query processing
    enableLogging: false, // Enabled to debug query issue
    // Whether to show the on-screen mobile debug console (bottom bar). Set false to keep a single Debug Panel.
    showOnScreenConsole: false
  }
};
