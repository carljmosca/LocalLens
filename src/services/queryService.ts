import { QueryService } from '../types/services';
import type { QueryResult } from '../types/services';
import type { POI } from '../types/poi';
import { lmService } from './lmService';
import { dataService } from './dataService';
import { sqliteService } from './sqliteService';
import { AppError, ErrorCode, logError } from '../utils/errors';
import { appConfig } from '../config/app.config';
import { logger } from '../utils/logger';

/**
 * Query Service implementation
 * Orchestrates LM validation and data retrieval to process user queries
 */
class QueryServiceImpl implements QueryService {
  private readonly TIMEOUT_MS = 3000;

  /**
   * Convert proximity SQL results to grouped POIWithNearby structure
   */
  private async convertProximityResultsToGrouped(
    results: { columns: string[]; values: any[][] }[],
    _targetType: string,
    _nearbyType: string,
    _maxDistance: number
  ) {
    if (!results || results.length === 0 || !results[0].values || results[0].values.length === 0) {
      return [];
    }

    const firstTable = results[0];
    const cols = firstTable.columns;
    
    // Get type_id -> type_name mapping
    const typeMap = new Map<number, string>();
    const typeResults = sqliteService.runQuery('SELECT type_id, type_name FROM poi_types');
    if (typeResults && typeResults[0]) {
      const typeIdIdx = typeResults[0].columns.indexOf('type_id');
      const typeNameIdx = typeResults[0].columns.indexOf('type_name');
      for (const row of typeResults[0].values) {
        typeMap.set(row[typeIdIdx], row[typeNameIdx]);
      }
    }

    // Group by primary POI
    const grouped = new Map<string, any>();
    
    for (const row of firstTable.values) {
      const primaryId = row[cols.indexOf('primary_id')];
      const nearbyId = row[cols.indexOf('nearby_id')];
      const distance = row[cols.indexOf('distance_miles')];
      
      if (!grouped.has(primaryId)) {
        const primaryTypeId = row[cols.indexOf('primary_type_id')];
        grouped.set(primaryId, {
          id: primaryId,
          name: row[cols.indexOf('primary_name')],
          type: typeMap.get(primaryTypeId) || 'unknown',
          location: {
            latitude: row[cols.indexOf('primary_latitude')],
            longitude: row[cols.indexOf('primary_longitude')]
          },
          address: row[cols.indexOf('primary_address')] || '',
          nearbyPOIs: []
        });
      }
      
      const nearbyTypeId = row[cols.indexOf('nearby_type_id')];
      grouped.get(primaryId).nearbyPOIs.push({
        id: nearbyId,
        name: row[cols.indexOf('nearby_name')],
        type: typeMap.get(nearbyTypeId) || 'unknown',
        location: {
          latitude: row[cols.indexOf('nearby_latitude')],
          longitude: row[cols.indexOf('nearby_longitude')]
        },
        address: row[cols.indexOf('nearby_address')] || '',
        distance: Math.round(distance * 100) / 100 // Round to 2 decimals
      });
    }
    
    return Array.from(grouped.values());
  }

  /**
   * Convert SQL query results to POI objects
   */
  private async convertSQLResultsToPOIs(results: { columns: string[]; values: any[][] }[]): Promise<POI[]> {
    if (!results || results.length === 0 || !results[0].values || results[0].values.length === 0) {
      return [];
    }

    const firstTable = results[0];
    const colIndexes = {
      id: firstTable.columns.indexOf('id'),
      name: firstTable.columns.indexOf('name'),
      type_id: firstTable.columns.indexOf('type_id'),
      latitude: firstTable.columns.indexOf('latitude'),
      longitude: firstTable.columns.indexOf('longitude'),
      address: firstTable.columns.indexOf('address')
    };

    // Get type_id -> type_name mapping
    const typeMap = new Map<number, string>();
    const typeResults = sqliteService.runQuery('SELECT type_id, type_name FROM poi_types');
    if (typeResults && typeResults[0]) {
      const typeIdIdx = typeResults[0].columns.indexOf('type_id');
      const typeNameIdx = typeResults[0].columns.indexOf('type_name');
      for (const row of typeResults[0].values) {
        typeMap.set(row[typeIdIdx], row[typeNameIdx]);
      }
    }

    const pois: POI[] = [];
    for (const row of firstTable.values) {
      const typeId = row[colIndexes.type_id];
      const typeName = typeMap.get(typeId) || 'unknown';
      
      pois.push({
        id: row[colIndexes.id],
        name: row[colIndexes.name],
        type: typeName,
        location: {
          latitude: row[colIndexes.latitude],
          longitude: row[colIndexes.longitude]
        },
        address: colIndexes.address >= 0 ? row[colIndexes.address] : ''
      });
    }

    return pois;
  }

  /**
   * Process a user query and return structured results
   * Uses SQL generation and in-browser SQLite execution
   * 
   * @param query - The natural language query from the user
   * @returns QueryResult with POIs, suggestions, types list, or error
   */
  async processQuery(query: string): Promise<QueryResult> {
    try {
      logger.log('=== [DEBUG] Query Processing Started (SQL Mode) ===');
      logger.log('🔍 [DEBUG] User prompt:', query);
      
      // Validate input
      if (!query || query.trim().length === 0) {
        return {
          type: 'suggestions',
          message: 'Please enter a query to search for POIs.',
          suggestions: this.getDefaultSuggestions()
        };
      }

      // Check if LM service is ready
      if (!lmService.isReady()) {
        return {
          type: 'error',
          message: 'AI service is still initializing. Please wait a moment and try again.'
        };
      }

      // Check for type request first (before SQL generation)
      const validationResult = await this.validateQueryWithTimeout(query);
      
      if (validationResult.isTypeRequest) {
        logger.log('📝 [DEBUG] Type request detected');
        return {
          type: 'types',
          types: dataService.getSupportedTypes()
        };
      }

      // Ensure SQLite DB is initialized
      logger.log('🗂️ [DEBUG] Ensuring SQLite DB is initialized...');
      await sqliteService.init();
      
      // Get schema for SQL generation
      // const schemaResp = await fetch('/schema.sql');
      // const schemaText = await schemaResp.text();
      // Instead, use a hardcoded schema or introspect from SQLite DB
      const schemaText = `CREATE TABLE poi_types (type_id INTEGER PRIMARY KEY AUTOINCREMENT, type_name TEXT NOT NULL UNIQUE);
CREATE TABLE pois (id TEXT PRIMARY KEY, name TEXT NOT NULL, type_id INTEGER, address TEXT, latitude REAL, longitude REAL, FOREIGN KEY (type_id) REFERENCES poi_types(type_id));
CREATE TABLE attributes (attribute_id INTEGER PRIMARY KEY AUTOINCREMENT, attribute_name TEXT NOT NULL UNIQUE);
CREATE TABLE poi_attributes (poi_id TEXT, attribute_id INTEGER, PRIMARY KEY (poi_id, attribute_id), FOREIGN KEY (poi_id) REFERENCES pois(id), FOREIGN KEY (attribute_id) REFERENCES attributes(attribute_id));`;
      
      // Generate SQL from natural language
      logger.log('💻 [DEBUG] Generating SQL from query...');
      const sql = await lmService.generateSQL(query, schemaText);
      logger.log('✅ [DEBUG] Generated SQL:', sql);
      
      // Execute SQL query
      logger.log('⚡ [DEBUG] Executing SQL query...');
      const sqlResults = sqliteService.runQuery(sql);
      logger.log('📊 [DEBUG] SQL returned', sqlResults[0]?.values?.length || 0, 'rows');
      
      // Check if this is a proximity query (has primary_id and nearby_id columns)
      const isProximityResult = sqlResults[0]?.columns?.includes('primary_id') && 
                                sqlResults[0]?.columns?.includes('nearby_id');
      
      if (isProximityResult) {
        // Convert to grouped results with nearby POIs
        logger.log('📍 [DEBUG] Processing proximity query results...');
        const poisWithNearby = await this.convertProximityResultsToGrouped(
          sqlResults,
          validationResult.targetType || '',
          validationResult.nearbyType || '',
          2.0 // maxDistance in miles
        );
        
        logger.log('✅ [DEBUG] Converted to', poisWithNearby.length, 'grouped POIs');
        
        if (poisWithNearby.length === 0) {
          return {
            type: 'suggestions',
            message: `No results found for your query in ${appConfig.location.displayName}.`,
            suggestions: this.getDefaultSuggestions()
          };
        }
        
        return {
          type: 'grouped',
          poisWithNearby,
          targetType: validationResult.targetType || '',
          nearbyType: validationResult.nearbyType || '',
          maxDistance: 2.0
        };
      }
      
      // Convert SQL results to POI objects
      const pois = await this.convertSQLResultsToPOIs(sqlResults);
      logger.log('✅ [DEBUG] Converted to', pois.length, 'POI objects');
      
      // Handle no results
      if (pois.length === 0) {
        return {
          type: 'suggestions',
          message: `No results found for your query in ${appConfig.location.displayName}.`,
          suggestions: this.getDefaultSuggestions()
        };
      }

      logger.log('✅ [DEBUG] SQL Query Processing Complete');
      logger.log('✅ [DEBUG] Final results:', pois.map(poi => poi.name));
      
      return {
        type: 'success',
        pois
      };

    } catch (error) {
      // Log the error with context
      logError(
        error instanceof Error ? error : new Error(String(error)),
        'QueryService.processQuery'
      );

      // Handle timeout errors
      if (error instanceof AppError && error.code === ErrorCode.MODEL_TIMEOUT) {
        return {
          type: 'error',
          message: error.userMessage
        };
      }

      // Handle AppError with user-friendly message
      if (error instanceof AppError) {
        return {
          type: 'error',
          message: error.userMessage
        };
      }

      // Generic error fallback
      return {
        type: 'error',
        message: 'An error occurred while processing your query. Please try again.'
      };
    }
  }

  /**
   * Validate query with timeout handling
   * Ensures LM inference completes within the target time
   */
  private async validateQueryWithTimeout(query: string) {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new AppError(
          'Query validation exceeded timeout',
          ErrorCode.QUERY_TIMEOUT,
          'Query processing timed out. Please try again.'
        ));
      }, this.TIMEOUT_MS);
    });

    // Create the validation promise
    const validationPromise = lmService.analyzeQuery(query);

    return Promise.race([validationPromise, timeoutPromise]);
  }

  /**
   * Get default query suggestions for users
   */
  private getDefaultSuggestions(): string[] {
    const types = dataService.getSupportedTypes();
    const exampleTypes = types.slice(0, 3).map(t => t.replace('_', ' '));
    
    return [
      `Try: "Find ${exampleTypes[0] || 'museums'} in ${appConfig.location.city}"`,
      `Try: "Show me ${exampleTypes[1] || 'restaurants'}"`,
      `Try: "Where are the ${exampleTypes[2] || 'parks'}?"`,
      `Try: "Parks with nearby restaurants" (within ${appConfig.search.nearbyDistanceMiles} mile${appConfig.search.nearbyDistanceMiles === 1 ? '' : 's'})`,
      `Try: "Parks with nearby asian restaurants" (specify cuisine/attributes for secondary POIs)`,
      `Try: "Museums near coffee shops" (finds primary POIs with nearby secondary POIs)`,
      'Or ask: "What types are supported?"'
    ];
  }
}

// Export singleton instance
export const queryService = new QueryServiceImpl();
