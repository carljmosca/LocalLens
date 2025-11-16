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
  private currentDataSource: string = 'pois.json';

  /**
   * Load POI data from the JSON file
   * Cached after first load to improve performance
   * @param dataSourceFile - Optional custom data source file (defaults to current or pois.json)
   * @throws {AppError} If data loading or parsing fails
   */
  async loadPOIs(dataSourceFile?: string): Promise<void> {
    // If no source specified, use current source (don't reset to default)
    const requestedSource = dataSourceFile || this.currentDataSource || 'pois.json';
    
    // If requesting a different data source, invalidate cache
    if (requestedSource !== this.currentDataSource) {
      this.isLoaded = false;
      this.loadPromise = null;
      this.currentDataSource = requestedSource;
    }

    // Return cached data if already loaded
    if (this.isLoaded) {
      return Promise.resolve();
    }

    // Return existing promise if load is in progress
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Create new load promise
    this.loadPromise = this._loadPOIsInternal(requestedSource);
    return this.loadPromise;
  }

  /**
   * Internal method to load POI data
   * @param dataSourceFile - The data source file to load
   * @private
   */
  private async _loadPOIsInternal(dataSourceFile: string): Promise<void> {
    try {
      // Use relative path that works with base path in production
      // Add cache-busting parameter to force fresh fetch
      const cacheBuster = `?t=${Date.now()}`;
      const url = `${import.meta.env.BASE_URL}${dataSourceFile}${cacheBuster}`;
      console.log('🌐 [DEBUG] Fetching POI data from:', url);
      
      const response = await fetch(url, {
        cache: 'no-store' // Tell browser not to use cache
      });
      
      console.log('🌐 [DEBUG] Response status:', response.status, 'Type:', response.type);
      
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

      console.log('📦 [DEBUG] Loaded POI data:', {
        supportedTypes: data.supportedTypes,
        poisCount: data.pois.length,
        poisTypes: data.pois.map(p => p.type)
      });
      
      this.supportedTypes = data.supportedTypes;
      this.pois = data.pois;
      this.isLoaded = true;
      
      console.log('✅ [DEBUG] Data assigned to service. this.pois.length =', this.pois.length);

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
   * Get the list of supported POI types
   * @returns Array of supported POI type strings
   */
  getSupportedTypes(): string[] {
    return [...this.supportedTypes];
  }

  /**
   * Get the currently loaded data source
   * @returns The current data source file name
   */
  getCurrentDataSource(): string {
    return this.currentDataSource;
  }
}

// Export singleton instance
export const dataService = new DataServiceImpl();
