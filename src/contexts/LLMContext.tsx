import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { llmService } from '../services/llmService';
import type { LLMService } from '../types/llm';
import { AppError, logError } from '../utils/errors';

/**
 * Context value interface for LLM service
 * Provides access to LLM service instance and its initialization state
 */
interface LLMContextValue {
  llmService: LLMService | null;
  isLoading: boolean;
  loadingProgress: number;
  error: Error | null;
  retry: () => void;
}

/**
 * Props for LLMProvider component
 */
interface LLMProviderProps {
  children: ReactNode;
}

// Create context with default values
const LLMContext = createContext<LLMContextValue | undefined>(undefined);

/**
 * LLM Context Provider Component
 * Manages LLM service initialization and provides it to child components
 * 
 * Handles:
 * - LLM service initialization on mount
 * - Loading state during initialization
 * - Error state if initialization fails
 * - Provides LLM service instance to consumers
 * - Provides retry functionality for failed initialization
 */
export const LLMProvider: React.FC<LLMProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    // Lazy load LLM after initial page render for better perceived performance
    const initializeLLM = async () => {
      try {
        setIsLoading(true);
        setLoadingProgress(0);
        setError(null);
        
        console.log('Starting LLM initialization...');
        
        // Simulate progress updates during initialization
        const progressInterval = setInterval(() => {
          setLoadingProgress(prev => {
            if (prev >= 90) return prev;
            return prev + 10;
          });
        }, 300);
        
        await llmService.initialize();
        
        clearInterval(progressInterval);
        setLoadingProgress(100);
        console.log('LLM initialization complete');
        
        // Small delay to show 100% before hiding
        await new Promise(resolve => setTimeout(resolve, 200));
        setIsLoading(false);
      } catch (err) {
        setLoadingProgress(0);
        // Log the error with context
        logError(
          err instanceof Error ? err : new Error('Failed to initialize LLM service'),
          'LLMContext.initializeLLM'
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

    // Defer LLM initialization slightly to allow page to render first
    const timeoutId = setTimeout(() => {
      initializeLLM();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [retryCount]); // Re-run when retryCount changes

  // Retry function to attempt initialization again
  const retry = () => {
    setRetryCount(prev => prev + 1);
  };

  const value: LLMContextValue = {
    llmService,
    isLoading,
    loadingProgress,
    error,
    retry
  };

  return (
    <LLMContext.Provider value={value}>
      {children}
    </LLMContext.Provider>
  );
};

/**
 * Custom hook to consume LLM context
 * Provides easy access to LLM service and its state
 * 
 * @throws Error if used outside of LLMProvider
 * @returns LLMContextValue containing service instance, loading state, error state, and retry function
 */
export const useLLM = (): LLMContextValue => {
  const context = useContext(LLMContext);
  
  if (context === undefined) {
    throw new Error('useLLM must be used within an LLMProvider');
  }
  
  return context;
};
