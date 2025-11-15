// POI types are now dynamically loaded from the data file
// This allows for flexible addition of new types without code changes
export type POIType = string;

export interface Location {
  latitude: number;
  longitude: number;
}

export interface POI {
  id: string;
  name: string;
  type: POIType;
  location: Location;
  address: string;
  attributes?: string[];
}
