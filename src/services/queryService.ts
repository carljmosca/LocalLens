import { QueryService, QueryResult } from '../types/services';
import { llmService } from './llmService';
import { dataService } from './dataService';
import { AppError, ErrorCode, logError } from '../utils/errors';
import { appConfig } from '../config/app.config';
import { findPOIsWithNearby, filterPOIsByAttributes } from '../utils/distance';

/**
 * Query Service implementation
 * Orchestrates LLM validation and data retrieval to process user queries
 */
class QueryServiceImpl implements QueryService {
  private readonly TIMEOUT_MS = 3000;

  /**
   * Process a user query and return structured results
   * Integrates LLM validation with data retrieval
   * 
   * @param query - The natural language query from the user
   * @returns QueryResult with POIs, suggestions, types list, or error
   */
  async processQuery(query: string): Promise<QueryResult> {
    try {
      console.log('=== Query Processing Started ===');
      console.log('User query:', query);
      
      // Validate input
      if (!query || query.trim().length === 0) {
        return {
          type: 'suggestions',
          message: 'Please enter a query to search for POIs.',
          suggestions: this.getDefaultSuggestions()
        };
      }

      // Check if LLM service is ready
      if (!llmService.isReady()) {
        return {
          type: 'error',
          message: 'AI service is still initializing. Please wait a moment and try again.'
        };
      }

      // Validate query with timeout
      console.log('Validating query with LLM...');
      const validationResult = await this.validateQueryWithTimeout(query);
      console.log('Validation result:', validationResult);

      // Handle type request (user asking for supported types)
      if (validationResult.isTypeRequest) {
        console.log('Type request detected');
        return {
          type: 'types',
          types: dataService.getSupportedTypes()
        };
      }

      // Handle invalid query (no valid POI types found)
      if (!validationResult.isValid || validationResult.types.length === 0) {
        console.log('No valid POI types found in query');
        return {
          type: 'suggestions',
          message: 'I couldn\'t identify any valid POI types in your query.',
          suggestions: this.getDefaultSuggestions()
        };
      }

      // Ensure POI data is loaded before querying
      console.log('Ensuring POI data is loaded...');
      await dataService.loadPOIs();
      
      // Handle proximity queries (e.g., "parks with nearby restaurants")
      if (validationResult.isProximityQuery && validationResult.targetType && validationResult.nearbyType) {
        console.log('Processing proximity query:', {
          target: validationResult.targetType,
          nearby: validationResult.nearbyType,
          distance: `${appConfig.search.nearbyDistanceMiles} miles`,
          targetAttributes: validationResult.attributes?.cuisine,
          nearbyAttributes: validationResult.nearbyAttributes?.cuisine
        });
        
        let targetPOIs = dataService.queryPOIs([validationResult.targetType]);
        let nearbyPOIs = dataService.queryPOIs([validationResult.nearbyType]);
        
        console.log(`Found ${targetPOIs.length} ${validationResult.targetType}s and ${nearbyPOIs.length} ${validationResult.nearbyType}s before attribute filtering`);
        
        // Apply attribute filtering to target POIs if specified
        if (validationResult.attributes?.cuisine && validationResult.attributes.cuisine.length > 0) {
          console.log('Filtering target POIs by attributes:', validationResult.attributes.cuisine);
          targetPOIs = filterPOIsByAttributes(targetPOIs, validationResult.attributes.cuisine);
          console.log(`${targetPOIs.length} ${validationResult.targetType}s remain after attribute filtering`);
        }
        
        // Apply attribute filtering to nearby POIs if specified
        if (validationResult.nearbyAttributes?.cuisine && validationResult.nearbyAttributes.cuisine.length > 0) {
          console.log('Filtering nearby POIs by attributes:', validationResult.nearbyAttributes.cuisine);
          nearbyPOIs = filterPOIsByAttributes(nearbyPOIs, validationResult.nearbyAttributes.cuisine);
          console.log(`${nearbyPOIs.length} ${validationResult.nearbyType}s remain after attribute filtering`);
        }
        
        const poisWithNearby = findPOIsWithNearby(targetPOIs, nearbyPOIs);
        console.log(`Found ${poisWithNearby.length} ${validationResult.targetType}s with nearby ${validationResult.nearbyType}s`);
        
        if (poisWithNearby.length === 0) {
          const targetDisplay = validationResult.targetType.replace('_', ' ');
          const nearbyDisplay = validationResult.nearbyType.replace('_', ' ');
          const nearbyAttrText = validationResult.nearbyAttributes?.cuisine?.length 
            ? ` ${validationResult.nearbyAttributes.cuisine.join(', ')}` 
            : '';
          const targetAttrText = validationResult.attributes?.cuisine?.length 
            ? ` ${validationResult.attributes.cuisine.join(', ')}` 
            : '';
          
          return {
            type: 'suggestions',
            message: `No${targetAttrText} ${targetDisplay}s found with${nearbyAttrText} ${nearbyDisplay}s within ${appConfig.search.nearbyDistanceMiles} mile${appConfig.search.nearbyDistanceMiles === 1 ? '' : 's'} in ${appConfig.location.displayName}.`,
            suggestions: [
              `Try: "Find ${targetDisplay}s in ${appConfig.location.city}"`,
              `Try: "Show me ${nearbyDisplay}s"`,
              'Try increasing the search distance or searching for different POI types or attributes'
            ]
          };
        }
        
        console.log('=== Proximity Query Processing Complete ===');
        return {
          type: 'grouped',
          poisWithNearby,
          targetType: validationResult.targetType,
          nearbyType: validationResult.nearbyType,
          maxDistance: appConfig.search.nearbyDistanceMiles
        };
      }
      
      // Regular query processing
      console.log('Querying POIs with types:', validationResult.types);
      let pois = dataService.queryPOIs(validationResult.types);
      console.log('POIs found before filtering:', pois.length);
      
      // Filter by attributes if specified (e.g., cuisine, style, etc.)
      // Only filter if we have attributes AND at least one POI has attributes
      if (validationResult.attributes?.cuisine && validationResult.attributes.cuisine.length > 0) {
        const requestedAttributes = validationResult.attributes.cuisine;
        
        // Check if any POIs actually have attributes
        const poisWithAttributes = pois.filter(poi => poi.attributes && poi.attributes.length > 0);
        
        // Only apply attribute filtering if some POIs have attributes
        if (poisWithAttributes.length > 0) {
          console.log('Filtering by attributes:', requestedAttributes);
          console.log('Requested attributes (lowercase):', requestedAttributes.map(a => a.toLowerCase()));
          
          pois = pois.filter(poi => {
            if (!poi.attributes || poi.attributes.length === 0) {
              console.log(`POI "${poi.name}" has no attributes, excluding`);
              return false;
            }
            
            // Check if any requested attribute matches any POI attribute
            const matches = requestedAttributes.some(reqAttr => 
              poi.attributes!.some(poiAttr => {
                const reqLower = reqAttr.toLowerCase();
                const poiLower = poiAttr.toLowerCase();
                const match = poiLower.includes(reqLower) || reqLower.includes(poiLower);
                if (match) {
                  console.log(`Match found: "${reqAttr}" matches "${poiAttr}" in "${poi.name}"`);
                }
                return match;
              })
            );
            
            if (!matches) {
              console.log(`POI "${poi.name}" attributes ${JSON.stringify(poi.attributes)} don't match ${JSON.stringify(requestedAttributes)}`);
            }
            
            return matches;
          });
          console.log('POIs found after attribute filter:', pois.length);
        } else {
          console.log('No POIs have attributes, skipping attribute filter');
        }
      }

      // Handle no results found
      if (pois.length === 0) {
        return {
          type: 'suggestions',
          message: `No ${validationResult.types.join(' or ')} found in ${appConfig.location.displayName}.`,
          suggestions: this.getDefaultSuggestions()
        };
      }

      // Return successful results
      console.log('=== Query Processing Complete ===');
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
   * Ensures LLM inference completes within the target time
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

    const validationPromise = llmService.validateQuery(query);

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
