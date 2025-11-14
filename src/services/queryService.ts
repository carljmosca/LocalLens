import { QueryService, QueryResult } from '../types/services';
import { llmService } from './llmService';
import { dataService } from './dataService';
import { AppError, ErrorCode, logError } from '../utils/errors';

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

      // Query POIs from data service
      console.log('Querying POIs with types:', validationResult.types);
      let pois = dataService.queryPOIs(validationResult.types);
      console.log('POIs found before filtering:', pois.length);
      
      // Filter by attributes if specified (e.g., cuisine, style, etc.)
      if (validationResult.attributes?.cuisine && validationResult.attributes.cuisine.length > 0) {
        const requestedAttributes = validationResult.attributes.cuisine;
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
      }

      // Handle no results found
      if (pois.length === 0) {
        return {
          type: 'suggestions',
          message: `No ${validationResult.types.join(' or ')} found in Richmond, VA.`,
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
    return [
      'Try: "Find museums in Richmond"',
      'Try: "Show me restaurants"',
      'Try: "Where are the parks?"',
      'Try: "Find coffee shops near me"',
      'Try: "List hospitals"',
      'Or ask: "What types are supported?"'
    ];
  }
}

// Export singleton instance
export const queryService = new QueryServiceImpl();
