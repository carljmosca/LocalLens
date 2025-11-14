export interface ValidationResult {
  isValid: boolean;
  types: string[];
  isTypeRequest: boolean;
  isProximityQuery?: boolean;
  targetType?: string; // Main POI type (e.g., 'park')
  nearbyType?: string; // Nearby POI type (e.g., 'restaurant')
  attributes?: {
    cuisine?: string[];
  };
  nearbyAttributes?: {
    cuisine?: string[];
  };
}

export interface LLMService {
  initialize(): Promise<void>;
  isReady(): boolean;
  validateQuery(query: string): Promise<ValidationResult>;
}
