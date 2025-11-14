/**
 * Error Utilities
 * Provides custom error classes and error handling utilities for the LocalLens
 */

/**
 * Custom Application Error class
 * Extends Error with additional context for better error handling and user messaging
 */
export class AppError extends Error {
  /**
   * @param message - Technical error message for logging
   * @param code - Error code for categorization
   * @param userMessage - User-friendly error message to display in UI
   */
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'AppError';
    
    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Error codes for categorizing different types of errors
 */
export enum ErrorCode {
  // WebGPU and LLM errors
  WEBGPU_UNAVAILABLE = 'WEBGPU_UNAVAILABLE',
  MODEL_LOAD_FAILED = 'MODEL_LOAD_FAILED',
  MODEL_INFERENCE_FAILED = 'MODEL_INFERENCE_FAILED',
  MODEL_TIMEOUT = 'MODEL_TIMEOUT',
  
  // Data errors
  DATA_FETCH_ERROR = 'DATA_FETCH_ERROR',
  DATA_PARSE_ERROR = 'DATA_PARSE_ERROR',
  DATA_VALIDATION_ERROR = 'DATA_VALIDATION_ERROR',
  
  // Query errors
  QUERY_VALIDATION_ERROR = 'QUERY_VALIDATION_ERROR',
  QUERY_PROCESSING_ERROR = 'QUERY_PROCESSING_ERROR',
  QUERY_TIMEOUT = 'QUERY_TIMEOUT',
  
  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

/**
 * Create a user-friendly error message based on error code
 */
export function getUserFriendlyMessage(code: string): string {
  const messages: Record<string, string> = {
    [ErrorCode.WEBGPU_UNAVAILABLE]: 'WebGPU is not available. Please use Chrome 113+ or Edge 113+.',
    [ErrorCode.MODEL_LOAD_FAILED]: 'Failed to load AI model. Please refresh the page to try again.',
    [ErrorCode.MODEL_INFERENCE_FAILED]: 'Unable to process query. Please try rephrasing.',
    [ErrorCode.MODEL_TIMEOUT]: 'Query processing timed out. Please try again.',
    [ErrorCode.DATA_FETCH_ERROR]: 'Failed to load POI data. Please refresh the page.',
    [ErrorCode.DATA_PARSE_ERROR]: 'POI data is malformed. Please contact support.',
    [ErrorCode.DATA_VALIDATION_ERROR]: 'POI data is malformed. Please contact support.',
    [ErrorCode.QUERY_VALIDATION_ERROR]: 'Unable to validate query. Please try again.',
    [ErrorCode.QUERY_PROCESSING_ERROR]: 'An error occurred while processing your query. Please try again.',
    [ErrorCode.QUERY_TIMEOUT]: 'Query processing timed out. Please try again.',
    [ErrorCode.NETWORK_ERROR]: 'Network error occurred. Please check your connection and try again.',
    [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
  };
  
  return messages[code] || messages[ErrorCode.UNKNOWN_ERROR];
}

/**
 * Log error with context for debugging
 * Logs technical details to console while keeping user-facing messages clean
 */
export function logError(error: Error | AppError, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';
  
  console.error(`${timestamp} ${contextStr} Error:`, {
    name: error.name,
    message: error.message,
    code: error instanceof AppError ? error.code : 'UNKNOWN',
    stack: error.stack
  });
}

/**
 * Browser compatibility information
 */
export interface BrowserInfo {
  name: string;
  version: number;
  isSupported: boolean;
}

/**
 * Detect browser name and version
 * Returns browser information for compatibility checking
 */
export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent;
  let name = 'Unknown';
  let version = 0;
  let isSupported = false;

  // Detect Chrome
  const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
  if (chromeMatch && !userAgent.includes('Edg')) {
    name = 'Chrome';
    version = parseInt(chromeMatch[1], 10);
    isSupported = version >= 113;
  }
  // Detect Edge
  else if (userAgent.includes('Edg')) {
    const edgeMatch = userAgent.match(/Edg\/(\d+)/);
    if (edgeMatch) {
      name = 'Edge';
      version = parseInt(edgeMatch[1], 10);
      isSupported = version >= 113;
    }
  }
  // Detect other browsers
  else if (userAgent.includes('Firefox')) {
    name = 'Firefox';
    const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
    if (firefoxMatch) {
      version = parseInt(firefoxMatch[1], 10);
    }
    isSupported = false; // Firefox doesn't support WebGPU yet
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'Safari';
    const safariMatch = userAgent.match(/Version\/(\d+)/);
    if (safariMatch) {
      version = parseInt(safariMatch[1], 10);
    }
    isSupported = false; // Safari has limited WebGPU support
  }

  return { name, version, isSupported };
}

/**
 * Get detailed compatibility error message with browser information
 */
function getCompatibilityMessage(browserInfo: BrowserInfo): string {
  const { name, version } = browserInfo;
  
  let message = 'WebGPU is not available. ';
  
  if (name === 'Chrome' && version > 0 && version < 113) {
    message += `You are using Chrome ${version}. Please update to Chrome 113 or later.`;
  } else if (name === 'Edge' && version > 0 && version < 113) {
    message += `You are using Edge ${version}. Please update to Edge 113 or later.`;
  } else if (name === 'Firefox') {
    message += 'Firefox does not currently support WebGPU. Please use Chrome 113+ or Edge 113+.';
  } else if (name === 'Safari') {
    message += 'Safari has limited WebGPU support. Please use Chrome 113+ or Edge 113+ for the best experience.';
  } else if (name === 'Unknown') {
    message += 'Your browser does not support WebGPU. Please use Chrome 113+ or Edge 113+.';
  } else {
    message += 'Please use Chrome 113+ or Edge 113+.';
  }
  
  return message;
}

/**
 * Check if WebGPU is available in the current browser
 * Includes browser version detection and detailed error messages
 */
export function checkWebGPUAvailability(): { available: boolean; error?: AppError; browserInfo?: BrowserInfo } {
  const browserInfo = detectBrowser();
  
  if (!(navigator as any).gpu) {
    const compatibilityMessage = getCompatibilityMessage(browserInfo);
    
    return {
      available: false,
      browserInfo,
      error: new AppError(
        `WebGPU is not supported in this browser: ${browserInfo.name} ${browserInfo.version}`,
        ErrorCode.WEBGPU_UNAVAILABLE,
        compatibilityMessage
      )
    };
  }
  
  return { available: true, browserInfo };
}

/**
 * Wrap async function with error handling
 * Catches errors and converts them to AppError with proper logging
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string,
  errorCode: string = ErrorCode.UNKNOWN_ERROR
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // If it's already an AppError, just log and rethrow
    if (error instanceof AppError) {
      logError(error, context);
      throw error;
    }
    
    // Convert to AppError
    const appError = new AppError(
      error instanceof Error ? error.message : String(error),
      errorCode,
      getUserFriendlyMessage(errorCode)
    );
    
    logError(appError, context);
    throw appError;
  }
}
