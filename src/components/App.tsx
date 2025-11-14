import { useState } from 'react';
import { useLLM } from '../contexts/LLMContext';
import type { QueryResult } from '../types';
import { queryService } from '../services/queryService';
import { AppError, logError, detectBrowser, ErrorCode } from '../utils/errors';
import Header from './Header';
import QueryInterface from './QueryInterface';
import ResultsDisplay from './ResultsDisplay';
import LoadingIndicator from './LoadingIndicator';

/**
 * App Component
 * Root component that orchestrates the LocalLens
 */
function App() {
  const { isLoading: llmLoading, loadingProgress, error: llmError, retry } = useLLM();
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Handle query submission - calls queryService to process the query
  const handleQuerySubmit = async (query: string) => {
    setIsProcessing(true);
    try {
      const result = await queryService.processQuery(query);
      setQueryResult(result);
    } catch (error) {
      // Log the error
      logError(
        error instanceof Error ? error : new Error(String(error)),
        'App.handleQuerySubmit'
      );
      
      // Set error result if something unexpected happens
      const errorMessage = error instanceof AppError 
        ? error.userMessage 
        : 'An unexpected error occurred. Please try again.';
      
      setQueryResult({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading indicator while LLM is initializing
  if (llmLoading) {
    return (
      <div className="app-container">
        <LoadingIndicator message="Initializing AI model..." progress={loadingProgress} />
        <p className="loading-subtext">This may take a moment on first load...</p>
      </div>
    );
  }

  // Show error if LLM initialization failed
  if (llmError) {
    const errorMessage = llmError instanceof AppError 
      ? llmError.userMessage 
      : llmError.message;
    
    // Check if this is a WebGPU compatibility error
    const isCompatibilityError = llmError instanceof AppError && 
      llmError.code === ErrorCode.WEBGPU_UNAVAILABLE;
    
    // Get browser information for compatibility errors
    const browserInfo = isCompatibilityError ? detectBrowser() : null;
    
    return (
      <div className="app-container">
        <div className="error-container">
          <h2>Initialization Error</h2>
          <p className="error-message">{errorMessage}</p>
          
          {browserInfo && (
            <div className="browser-info">
              <strong>Browser Detected:</strong> {browserInfo.name} {browserInfo.version > 0 ? `v${browserInfo.version}` : '(version unknown)'}
              <br />
              <strong>WebGPU Support:</strong> {browserInfo.isSupported ? 'Yes' : 'No'}
            </div>
          )}
          
          <div className="error-actions">
            {!isCompatibilityError && (
              <button onClick={retry} className="btn-primary">
                Retry
              </button>
            )}
            <button onClick={() => window.location.reload()} className="btn-secondary">
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header />
      <main className="main-content" role="main">
        <QueryInterface onSubmit={handleQuerySubmit} isLoading={isProcessing} />
        <ResultsDisplay result={queryResult} />
      </main>
    </div>
  );
}

export default App;
