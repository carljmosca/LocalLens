import { POI } from './poi';

export interface POIWithNearby extends POI {
  nearbyPOIs: Array<POI & { distance: number }>;
}

export interface DataService {
  loadPOIs(): Promise<void>;
  queryPOIs(types: string[]): POI[];
  getSupportedTypes(): string[];
}

export type QueryResult = 
  | { type: 'success'; pois: POI[] }
  | { type: 'grouped'; poisWithNearby: POIWithNearby[]; targetType: string; nearbyType: string; maxDistance: number }
  | { type: 'suggestions'; message: string; suggestions: string[] }
  | { type: 'types'; types: string[] }
  | { type: 'error'; message: string };

export interface QueryService {
  processQuery(query: string): Promise<QueryResult>;
}
