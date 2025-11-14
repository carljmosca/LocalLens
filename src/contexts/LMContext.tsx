import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { lmService } from '../services/lmService';
import { dataService } from '../services/dataService';
import { AppError, logError } from '../utils/errors';

/**
 * Context value type for Language Model operations
 */
interface LMContextValue {
  isLoading: boolean;
  loadingProgress: number;
  error: Error | null;
  retry: () => void;
}

/**
 * Props for LMProvider component
 */
interface LMProviderProps {
  children: ReactNode;
}

// Create context with default values
const LMContext = createContext<LMContextValue | undefined>(undefined);

/**
 * LM Context Provider Component
 * Manages LM service initialization and provides it to child components
 * 
 * Handles:
 * - LM service initialization on mount
 * - Loading state during initialization
 * - Error state if initialization fails
 * - Provides LM service instance to consumers
 * - Provides retry functionality for failed initialization
 */
export const LMProvider: React.FC<LMProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    // Lazy load LM after initial page render for better perceived performance
    const initializeLM = async () => {
      try {
        setIsLoading(true);
        setLoadingProgress(0);
        setError(null);
        
        // Simulate progress updates during initialization
        const progressInterval = setInterval(() => {
          setLoadingProgress(prev => {
            if (prev >= 80) return prev;
            return prev + 10;
          });
        }, 300);
        
        // Initialize LM service in parallel with data loading
        await Promise.all([
          lmService.initialize(),
          dataService.loadPOIs()
        ]);
        
        clearInterval(progressInterval);
        setLoadingProgress(100);
        
        // Small delay to show 100% before hiding
        await new Promise(resolve => setTimeout(resolve, 200));
        setIsLoading(false);
      } catch (err) {
        setLoadingProgress(0);
        // Log detailed error information for debugging
        logError(
          err instanceof Error ? err : new Error(String(err)),
          'LMProvider.initializeLM'
        );
        
        // Set user-friendly error
        const error = err instanceof AppError 
          ? err 
          : new AppError(
              err instanceof Error ? err.message : 'Unknown error',
              'MODEL_LOAD_FAILED',
              'Failed to load AI model. Please refresh the page to try again.'
            );
        
        setError(error);
        setIsLoading(false);
      }
    };

    // Defer LM initialization slightly to allow page to render first
    const timeoutId = setTimeout(() => {
      initializeLM();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [retryCount]); // Re-run when retryCount changes

  // Retry function to attempt initialization again
  const retry = () => {
    setRetryCount(prev => prev + 1);
  };

  const value: LMContextValue = {
    isLoading,
    loadingProgress,
    error,
    retry
  };

  return (
    <LMContext.Provider value={value}>
      {children}
    </LMContext.Provider>
  );
};

/**
 * Custom hook to consume LM context
 * Provides easy access to LM service and its state
 * 
 * @throws Error if used outside of LMProvider
 * @returns LMContextValue containing service instance, loading state, error state, and retry function
 */
export const useLM = (): LMContextValue => {
  const context = useContext(LMContext);
  
  if (context === undefined) {
    throw new Error('useLM must be used within a LMProvider');
  }
  
  return context;
};
