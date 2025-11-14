export type POIType = 'museum' | 'hospital' | 'park' | 'restaurant' | 'coffee_shop';

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
}
