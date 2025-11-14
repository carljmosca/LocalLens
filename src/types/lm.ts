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

/**
 * Language Model Service interface for query analysis and POI type extraction
 */
export interface LMService {
  /**
   * Initialize the language model
   * @returns Promise that resolves when model is ready
   */
  initialize(): Promise<void>;

  /**
   * Check if the language model is ready for use
   * @returns True if model is initialized and ready
   */
  isReady(): boolean;

  /**
   * Analyze a user query to extract POI types and determine intent
   * @param query - The user's natural language query
   * @returns Promise with validation result including POI types and attributes
   */
  analyzeQuery(query: string): Promise<ValidationResult>;
}
