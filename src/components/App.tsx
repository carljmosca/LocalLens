import { useState } from 'react';
import { LMProvider, useLM } from '../contexts/LMContext';
import type { QueryResult } from '../types';
import { queryService } from '../services/queryService';
import { AppError, logError, detectBrowser, ErrorCode } from '../utils/errors';
import Header from './Header';
import QueryInterface from './QueryInterface';
import ResultsDisplay from './ResultsDisplay';
import LoadingIndicator from './LoadingIndicator';

/**
 * App Content Component
 * Main application content that uses LM context
 */
const AppContent: React.FC = () => {
  const { isLoading: lmLoading, loadingProgress, error: lmError, retry } = useLM();
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentQuery, setCurrentQuery] = useState<string>('');

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

  // Handle POI type button clicks
  const handleTypeClick = (type: string) => {
    const displayType = type.replace('_', ' ');
    const newQuery = `show me ${displayType}`;
    setCurrentQuery(newQuery);
    // Automatically submit the query
    handleQuerySubmit(newQuery);
  };

  // Show loading indicator while lm is initializing
  if (lmLoading) {
    return (
      <div className="app-container">
        <LoadingIndicator message="Initializing AI model and loading data..." progress={loadingProgress} />
        <p className="loading-subtext">This may take a moment on first load...</p>
      </div>
    );
  }

  // Show error if LM initialization failed
  if (lmError) {
    const errorMessage = lmError instanceof AppError 
      ? lmError.userMessage 
      : lmError.message;
    
    // Check if this is a WebGPU compatibility error
    const isCompatibilityError = lmError instanceof AppError && 
      lmError.code === ErrorCode.WEBGPU_UNAVAILABLE;
    
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
        <QueryInterface 
          onSubmit={handleQuerySubmit} 
          isLoading={isProcessing} 
          initialQuery={currentQuery}
          onQueryChange={setCurrentQuery}
        />
        <ResultsDisplay 
          result={queryResult} 
          onTypeClick={handleTypeClick}
        />
      </main>
    </div>
  );
};

/**
 * App Component
 * Root component that provides LM context to the application
 */
function App() {
  return (
    <LMProvider>
      <AppContent />
    </LMProvider>
  );
}

export default App;
