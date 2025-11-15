import { pipeline } from '@huggingface/transformers';
import type { LMService, ValidationResult } from '../types/lm';
import { AppError, ErrorCode, logError, checkWebGPUAvailability } from '../utils/errors';
import { dataService } from './dataService';
import { logger } from '../utils/logger';

/**
 * LM Service implementation using Hugging Face Transformers with WebGPU support
 * Handles query validation and POI type extraction using a local browser-based model
 */
class LMServiceImpl implements LMService {
  private model: any = null;
  private ready: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the WebGPU LM model
   * Loads a text generation model optimized for running in the browser
   */
  async initialize(): Promise<void> {
    // Return existing initialization promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return immediately if already initialized
    if (this.ready) {
      return Promise.resolve();
    }

    this.initializationPromise = (async () => {
      try {
        // Check WebGPU availability with browser detection
        const webgpuCheck = checkWebGPUAvailability();
        
        // Log browser information
        if (webgpuCheck.browserInfo) {
          logger.log('Browser detected:', {
            name: webgpuCheck.browserInfo.name,
            version: webgpuCheck.browserInfo.version,
            supported: webgpuCheck.browserInfo.isSupported
          });
        }
        
        if (!webgpuCheck.available) {
          throw webgpuCheck.error;
        }

        logger.log('🤖 [DEBUG] Initializing LM model with WebGPU...');
        
        // Set ONNX Runtime log level to suppress warnings
        // This reduces console noise from internal optimization decisions
        if (typeof (globalThis as any).ort !== 'undefined') {
          (globalThis as any).ort.env.logLevel = 'error';
        }
        
        // Initialize a text2text generation pipeline with WebGPU device
        // Using FLAN-T5-small which is instruction-tuned and better at NLP tasks
        this.model = await pipeline(
          'text2text-generation',
          'Xenova/flan-t5-small',
          {
            device: 'webgpu',
            dtype: 'fp32'
          }
        );

        this.ready = true;
        logger.log('✅ [DEBUG] LM model initialized successfully');
      } catch (error) {
        this.ready = false;
        
        // If it's already an AppError, just log and rethrow
        if (error instanceof AppError) {
          logError(error, 'LMService.initialize');
          throw error;
        }
        
        // Convert to AppError for model loading failures
        const appError = new AppError(
          `Failed to initialize LM model: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.MODEL_LOAD_FAILED,
          'Failed to load AI model. Please refresh the page to try again.'
        );
        
        logError(appError, 'LMService.initialize');
        throw appError;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Check if the LL service is ready to process queries
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Validate a user query and extract POI types
   * Uses LM to extract nouns, then matches against supported types from data
   * Returns validation result with extracted types and flags
   */
  async analyzeQuery(query: string): Promise<ValidationResult> {
    // Handle empty or whitespace-only queries
    if (!query || query.trim().length === 0) {
      return {
        isValid: false,
        types: [],
        isTypeRequest: false
      };
    }

    try {
      // Check if user is requesting list of supported types
      const typeRequestPatterns = [
        /what.*types.*supported/i,
        /list.*types/i,
        /show.*types/i,
        /valid.*types/i,
        /available.*types/i,
        /which.*types/i,
        /what.*can.*search/i,
        /what.*poi/i
      ];

      const isTypeRequest = typeRequestPatterns.some(pattern => pattern.test(query));

      if (isTypeRequest) {
        return {
          isValid: true,
          types: [],
          isTypeRequest: true
        };
      }

      // Check for proximity queries (e.g., "parks with nearby restaurants", "museums near cafes")
      const proximityPatterns = [
        /(.+?)\s+(?:with|having|that have)\s+nearby\s+(.+)/i,
        /(.+?)\s+near\s+(.+)/i,
        /(.+?)\s+close to\s+(.+)/i,
        /(.+?)\s+around\s+(.+)/i
      ];

      let isProximityQuery = false;
      let targetType: string | undefined;
      let nearbyType: string | undefined;
      let targetAttributes: string[] = [];
      let nearbyAttributes: string[] = [];

      for (const pattern of proximityPatterns) {
        const match = query.match(pattern);
        if (match) {
          isProximityQuery = true;
          
          // Extract nouns and adjectives for both parts
          const targetPart = await this.extractNounsAndAdjectives(match[1]);
          const nearbyPart = await this.extractNounsAndAdjectives(match[2]);
          
          // Match nouns to POI types
          const targetTypes = this.matchNounsToTypes(targetPart.nouns, dataService.getSupportedTypes());
          const nearbyTypes = this.matchNounsToTypes(nearbyPart.nouns, dataService.getSupportedTypes());
          
          if (targetTypes.length > 0) targetType = targetTypes[0];
          if (nearbyTypes.length > 0) nearbyType = nearbyTypes[0];
          
          // Common query verbs to filter out from attributes
          const commonVerbs = ['show', 'find', 'get', 'list', 'display', 'search', 'locate', 'give', 'tell'];
          
          // Filter adjectives that are not POI types (these become attributes)
          // Also filter out common query verbs
          targetAttributes = targetPart.adjectives.filter(adj => {
            const adjLower = adj.toLowerCase();
            // Filter out common verbs (exact match or starting with verb)
            if (commonVerbs.some(verb => adjLower === verb || adjLower.startsWith(verb + ' '))) {
              return false;
            }
            // Filter out POI types
            return !dataService.getSupportedTypes().some(type => {
              const typeNormalized = type.replace('_', ' ').toLowerCase();
              const typeSingular = typeNormalized.replace(/s$/, '');
              const adjSingular = adjLower.replace(/s$/, '');
              return adjLower === typeNormalized || 
                     adjLower === type.toLowerCase() ||
                     adjSingular === typeSingular;
            });
          });
          
          nearbyAttributes = nearbyPart.adjectives.filter(adj => {
            const adjLower = adj.toLowerCase();
            // Filter out common verbs (exact match or starting with verb)
            if (commonVerbs.some(verb => adjLower === verb || adjLower.startsWith(verb + ' '))) {
              return false;
            }
            // Filter out POI types
            return !dataService.getSupportedTypes().some(type => {
              const typeNormalized = type.replace('_', ' ').toLowerCase();
              const typeSingular = typeNormalized.replace(/s$/, '');
              const adjSingular = adjLower.replace(/s$/, '');
              return adjLower === typeNormalized || 
                     adjLower === type.toLowerCase() ||
                     adjSingular === typeSingular;
            });
          });
          
          logger.log('🎯 [DEBUG] Proximity query detected:', {
            target: targetType,
            nearby: nearbyType,
            targetAttributes,
            nearbyAttributes,
            original: query
          });
          break;
        }
      }

      if (isProximityQuery && targetType && nearbyType) {
        return {
          isValid: true,
          types: [targetType, nearbyType],
          isTypeRequest: false,
          isProximityQuery: true,
          targetType,
          nearbyType,
          attributes: targetAttributes.length > 0 ? { cuisine: targetAttributes } : undefined,
          nearbyAttributes: nearbyAttributes.length > 0 ? { cuisine: nearbyAttributes } : undefined
        };
      }

      // Extract nouns and adjectives from the query using LM
      const { nouns, adjectives } = await this.extractNounsAndAdjectives(query);
      logger.log('🔍 [DEBUG] Nouns extracted from query:', nouns);
      logger.log('🔍 [DEBUG] Adjectives extracted from query:', adjectives);
      
      // Match nouns against supported types
      const types = this.matchNounsToTypes(nouns, dataService.getSupportedTypes());
      logger.log('🎯 [DEBUG] Matched POI types:', types);

      // Common query verbs and words to filter out
      const commonQueryWords = ['show', 'find', 'get', 'list', 'display', 'search', 'locate', 'give', 'tell', 'me', 'the', 'a', 'an'];
      
      // Filter out adjectives that are actually POI types, their plurals, or common query words
      const actualAdjectives = adjectives.filter(adj => {
        const adjLower = adj.toLowerCase();
        
        // Filter out common query words
        if (commonQueryWords.includes(adjLower)) {
          return false;
        }
        
        // Filter out multi-word phrases containing query verbs (like "show library")
        if (commonQueryWords.some(word => adjLower.includes(word))) {
          return false;
        }
        
        // Check if this adjective is actually a POI type
        const isPoiType = dataService.getSupportedTypes().some(type => {
          const typeNormalized = type.replace('_', ' ').toLowerCase();
          const typeSingular = typeNormalized.replace(/s$/, '');
          const adjSingular = adjLower.replace(/s$/, '');
          return adjLower === typeNormalized || 
                 adjLower === type.toLowerCase() ||
                 adjSingular === typeSingular;
        });
        return !isPoiType;
      });
      
      logger.log('🎨 [DEBUG] Actual adjectives (after filtering POI types):', actualAdjectives);

      return {
        isValid: types.length > 0,
        types,
        isTypeRequest: false,
        attributes: actualAdjectives.length > 0 ? { cuisine: actualAdjectives } : undefined
      };
    } catch (error) {
      // Log error but return invalid result for graceful handling
      logError(
        error instanceof Error ? error : new Error(String(error)),
        'LMService.analyzeQuery'
      );
      
      // Return invalid result but don't throw - allow graceful handling
      return {
        isValid: false,
        types: [],
        isTypeRequest: false
      };
    }
  }

  /**
   * Extract POI types from a natural language query
   * Uses LM to extract nouns, then matches against supported types
   */
  async extractPOITypes(query: string): Promise<string[]> {
    const { nouns } = await this.extractNounsAndAdjectives(query);
    return this.matchNounsToTypes(nouns, dataService.getSupportedTypes());
  }

  /**
   * Extract nouns and adjectives from query using the LM
   * Returns both nouns (POI types) and adjectives (attributes like cuisine)
   */
  async extractNounsAndAdjectives(query: string): Promise<{ nouns: string[], adjectives: string[] }> {
    if (!this.ready || !this.model) {
      logger.log('⚠️ [DEBUG] LM not ready, returning empty arrays');
      return { nouns: [], adjectives: [] };
    }

    try {
      // Normalize query to lowercase to avoid capitalization issues with the model
      const normalizedQuery = query.toLowerCase();
      logger.log('🤖 [DEBUG] Extracting nouns and adjectives with LM...');
      
      // Extract nouns
      const nounPrompt = `Extract only the nouns from this query: ${normalizedQuery}`;
      const nounResult = await this.model(nounPrompt, {
        max_new_tokens: 15,
        temperature: 0.1,
        do_sample: false
      });
      const nounText = nounResult[0]?.generated_text || '';
      logger.log('🔍 [DEBUG] Extracted nouns:', nounText);
      
      const nouns = nounText
        .split(/,|\sand\s/)
        .map((n: string) => n.trim().toLowerCase())
        .filter((n: string) => n.length > 0);
      
      // Extract adjectives
      const adjPrompt = `Extract only the adjectives from this query: ${normalizedQuery}`;
      const adjResult = await this.model(adjPrompt, {
        max_new_tokens: 15,
        temperature: 0.1,
        do_sample: false
      });
      const adjText = adjResult[0]?.generated_text || '';
      logger.log('🔍 [DEBUG] Extracted adjectives:', adjText);
      
      const adjectives = adjText
        .split(/,|\sand\s/)
        .map((a: string) => a.trim().toLowerCase())
        .filter((a: string) => a.length > 0);
      
      return { nouns, adjectives };
    } catch (error) {
      console.error('Error extracting nouns and adjectives:', error);
      return { nouns: [], adjectives: [] };
    }
  }

  /**
   * Match extracted nouns against supported POI types
   * Handles plurals and variations
   */
  private matchNounsToTypes(nouns: string[], supportedTypes: string[]): string[] {
    const matchedTypes: string[] = [];
    
    logger.log('🔍 [DEBUG] Matching nouns to types');
    logger.log('  Nouns to match:', nouns);
    logger.log('  Supported types:', supportedTypes);
    
    for (const noun of nouns) {
      let matched = false;
      for (const type of supportedTypes) {
        // Normalize the type for comparison (handle underscores)
        const typeNormalized = type.replace('_', ' ').toLowerCase();
        const typeSingular = typeNormalized.replace(/s$/, ''); // Remove trailing 's'
        const nounSingular = noun.replace(/s$/, '');
        
        logger.log(`  Comparing noun "${noun}" (singular: "${nounSingular}") with type "${type}" (normalized: "${typeNormalized}", singular: "${typeSingular}")`);
        
        // Check if noun matches type (with or without plural)
        if (noun === typeNormalized || 
            noun === type.toLowerCase() ||
            nounSingular === typeSingular ||
            noun.includes(typeNormalized) ||
            typeNormalized.includes(noun)) {
          logger.log(`    ✅ MATCH FOUND: "${noun}" matches "${type}"`);
          matchedTypes.push(type);
          matched = true;
          break;
        }
      }
      if (!matched) {
        logger.log(`  ❌ No match found for noun: "${noun}"`);
      }
    }
    
    logger.log('🎯 [DEBUG] Final matched types:', matchedTypes);
    return [...new Set(matchedTypes)]; // Remove duplicates
  }





  /**
   * Generate helpful suggestions when no valid POI types are found
   * Returns example queries to guide the user
   */
  generateSuggestions(): string[] {
    return [
      'Try: "Find museums in Richmond"',
      'Try: "Show me restaurants"',
      'Try: "Where are the parks?"',
      'Try: "Find coffee shops near me"',
      'Try: "List hospitals"',
      'Or ask: "What types are supported?"'
    ];
  }

  /**
   * Get the list of supported POI types
   */
  getSupportedTypes(): string[] {
    return dataService.getSupportedTypes();
  }
}

// Export singleton instance
export const lmService = new LMServiceImpl();
