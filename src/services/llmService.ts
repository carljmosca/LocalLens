import { pipeline } from '@huggingface/transformers';
import type { LLMService, ValidationResult } from '../types/llm';
import { AppError, ErrorCode, logError, checkWebGPUAvailability } from '../utils/errors';

/**
 * LLM Service implementation using Hugging Face Transformers with WebGPU support
 * Handles query validation and POI type extraction using a local browser-based model
 */
class LLMServiceImpl implements LLMService {
  private model: any = null;
  private ready: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private supportedTypes = ['museum', 'hospital', 'park', 'restaurant', 'coffee_shop'];

  /**
   * Initialize the WebGPU LLM model
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
          console.log('Browser detected:', {
            name: webgpuCheck.browserInfo.name,
            version: webgpuCheck.browserInfo.version,
            supported: webgpuCheck.browserInfo.isSupported
          });
        }
        
        if (!webgpuCheck.available) {
          throw webgpuCheck.error;
        }

        console.log('Initializing LLM model with WebGPU...');
        
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
        console.log('LLM model initialized successfully');
      } catch (error) {
        this.ready = false;
        
        // If it's already an AppError, just log and rethrow
        if (error instanceof AppError) {
          logError(error, 'LLMService.initialize');
          throw error;
        }
        
        // Convert to AppError for model loading failures
        const appError = new AppError(
          `Failed to initialize LLM model: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.MODEL_LOAD_FAILED,
          'Failed to load AI model. Please refresh the page to try again.'
        );
        
        logError(appError, 'LLMService.initialize');
        throw appError;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Check if the LLM service is ready to process queries
   */
  isReady(): boolean {
    return this.ready;
  }

  /**
   * Validate a user query and extract POI types
   * Uses LLM to extract nouns, then matches against supported types from data
   * Returns validation result with extracted types and flags
   */
  async validateQuery(query: string): Promise<ValidationResult> {
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

      // Extract nouns from the query using LLM
      const nouns = await this.extractNouns(query);
      console.log('Nouns extracted from query:', nouns);
      
      // Match nouns against supported types
      const types = this.matchNounsToTypes(nouns, this.supportedTypes);
      console.log('Matched POI types:', types);

      return {
        isValid: types.length > 0,
        types,
        isTypeRequest: false
      };
    } catch (error) {
      // Log error but return invalid result for graceful handling
      logError(
        error instanceof Error ? error : new Error(String(error)),
        'LLMService.validateQuery'
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
   * Uses LLM to extract nouns, then matches against supported types
   */
  async extractPOITypes(query: string): Promise<string[]> {
    const nouns = await this.extractNouns(query);
    return this.matchNounsToTypes(nouns, this.supportedTypes);
  }

  /**
   * Extract nouns from query using the LLM
   * Returns the key nouns that might represent POI types
   */
  async extractNouns(query: string): Promise<string[]> {
    if (!this.ready || !this.model) {
      console.log('LLM not ready, returning empty array');
      return [];
    }

    try {
      // FLAN-T5 works best with direct instructions
      const prompt = `Extract the main nouns from this query: ${query}`;

      console.log('Extracting nouns with LLM...');
      
      const result = await this.model(prompt, {
        max_new_tokens: 15,
        temperature: 0.1,
        do_sample: false
      });

      // FLAN-T5 returns the generated text directly
      const generatedText = result[0]?.generated_text || '';
      console.log('Extracted nouns:', generatedText);
      
      // Split by comma or "and" and clean up
      const nouns = generatedText
        .split(/,|\sand\s/)
        .map((n: string) => n.trim().toLowerCase())
        .filter((n: string) => n.length > 0);
      
      return nouns;
    } catch (error) {
      console.error('Error extracting nouns:', error);
      return [];
    }
  }

  /**
   * Match extracted nouns against supported POI types
   * Handles plurals and variations
   */
  private matchNounsToTypes(nouns: string[], supportedTypes: string[]): string[] {
    const matchedTypes: string[] = [];
    
    for (const noun of nouns) {
      for (const type of supportedTypes) {
        // Normalize the type for comparison (handle underscores)
        const typeNormalized = type.replace('_', ' ').toLowerCase();
        const typeSingular = typeNormalized.replace(/s$/, ''); // Remove trailing 's'
        const nounSingular = noun.replace(/s$/, '');
        
        // Check if noun matches type (with or without plural)
        if (noun === typeNormalized || 
            noun === type.toLowerCase() ||
            nounSingular === typeSingular ||
            noun.includes(typeNormalized) ||
            typeNormalized.includes(noun)) {
          matchedTypes.push(type);
          break;
        }
      }
    }
    
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
    return [...this.supportedTypes];
  }
}

// Export singleton instance
export const llmService = new LLMServiceImpl();
