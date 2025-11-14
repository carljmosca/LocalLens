import { POI } from './poi';

export interface DataService {
  loadPOIs(): Promise<void>;
  queryPOIs(types: string[]): POI[];
  getSupportedTypes(): string[];
}

export type QueryResult = 
  | { type: 'success'; pois: POI[] }
  | { type: 'suggestions'; message: string; suggestions: string[] }
  | { type: 'types'; types: string[] }
  | { type: 'error'; message: string };

export interface QueryService {
  processQuery(query: string): Promise<QueryResult>;
}
