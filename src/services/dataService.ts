import { POI } from '../types/poi';
import { DataService } from '../types/services';
import { AppError, ErrorCode, logError } from '../utils/errors';

interface POIData {
  supportedTypes: string[];
  pois: POI[];
}

class DataServiceImpl implements DataService {
  private pois: POI[] = [];
  private supportedTypes: string[] = [];
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * Load POI data from the JSON file
   * Cached after first load to improve performance
   * @throws {AppError} If data loading or parsing fails
   */
  async loadPOIs(): Promise<void> {
    // Return cached data if already loaded
    if (this.isLoaded) {
      return Promise.resolve();
    }

    // Return existing promise if load is in progress
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Create new load promise
    this.loadPromise = this._loadPOIsInternal();
    return this.loadPromise;
  }

  /**
   * Internal method to load POI data
   * @private
   */
  private async _loadPOIsInternal(): Promise<void> {
    try {
      // Use relative path that works with base path in production
      const response = await fetch(`${import.meta.env.BASE_URL}pois.json`);
      
      if (!response.ok) {
        throw new AppError(
          `Failed to fetch POI data: ${response.status} ${response.statusText}`,
          ErrorCode.DATA_FETCH_ERROR,
          'Failed to load POI data. Please refresh the page.'
        );
      }

      const data: POIData = await response.json();

      // Validate data structure
      if (!data.supportedTypes || !Array.isArray(data.supportedTypes)) {
        throw new AppError(
          'Invalid data structure: missing supportedTypes',
          ErrorCode.DATA_VALIDATION_ERROR,
          'POI data is malformed. Please contact support.'
        );
      }

      if (!data.pois || !Array.isArray(data.pois)) {
        throw new AppError(
          'Invalid data structure: missing pois array',
          ErrorCode.DATA_VALIDATION_ERROR,
          'POI data is malformed. Please contact support.'
        );
      }

      // Validate each POI has required fields
      for (const poi of data.pois) {
        if (!poi.id || !poi.name || !poi.type || !poi.location || !poi.address) {
          throw new AppError(
            `Invalid POI structure: ${JSON.stringify(poi)}`,
            ErrorCode.DATA_VALIDATION_ERROR,
            'POI data is malformed. Please contact support.'
          );
        }

        if (typeof poi.location.latitude !== 'number' || typeof poi.location.longitude !== 'number') {
          throw new AppError(
            `Invalid location data for POI: ${poi.id}`,
            ErrorCode.DATA_VALIDATION_ERROR,
            'POI data is malformed. Please contact support.'
          );
        }
      }

      this.supportedTypes = data.supportedTypes;
      this.pois = data.pois;
      this.isLoaded = true;

    } catch (error) {
      // Reset load promise on error to allow retry
      this.loadPromise = null;
      
      // If it's already an AppError, just log and rethrow
      if (error instanceof AppError) {
        logError(error, 'DataService.loadPOIs');
        throw error;
      }

      // Handle JSON parse errors or network errors
      const appError = new AppError(
        `Error loading POI data: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.DATA_PARSE_ERROR,
        'Failed to load POI data. Please refresh the page.'
      );
      
      logError(appError, 'DataService.loadPOIs');
      throw appError;
    }
  }

  /**
   * Query POIs by type
   * @param types - Array of POI types to filter by
   * @returns Array of POIs matching the specified types
   */
  queryPOIs(types: string[]): POI[] {
    try {
      console.log('DataService.queryPOIs called with types:', types);
      
      if (!this.isLoaded) {
        console.warn('DataService: queryPOIs called before data is loaded');
        return [];
      }

      if (!types || types.length === 0) {
        console.log('DataService: No types provided, returning empty array');
        return [];
      }

      // Normalize types to lowercase for case-insensitive matching
      const normalizedTypes = types.map(t => t.toLowerCase());
      console.log('Normalized types:', normalizedTypes);

      const filteredPOIs = this.pois.filter(poi => {
        const matches = normalizedTypes.includes(poi.type.toLowerCase());
        if (matches) {
          console.log(`POI "${poi.name}" (${poi.type}) matches`);
        }
        return matches;
      });

      console.log(`DataService: Returning ${filteredPOIs.length} POIs`);
      return filteredPOIs;
    } catch (error) {
      logError(
        error instanceof Error ? error : new Error(String(error)),
        'DataService.queryPOIs'
      );
      return [];
    }
  }

  /**
   * Get the list of supported POI types
   * @returns Array of supported POI type strings
   */
  getSupportedTypes(): string[] {
    return [...this.supportedTypes];
  }
}

// Export singleton instance
export const dataService = new DataServiceImpl();
