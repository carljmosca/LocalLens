import React, { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Props for QueryInterface component
 */
interface QueryInterfaceProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

/**
 * QueryInterface Component
 * Provides text input and submit button for user queries
 * Includes debouncing for optional enhancement
 */
const QueryInterface: React.FC<QueryInterfaceProps> = ({ onSubmit, isLoading }) => {
  const [query, setQuery] = useState<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Validate non-empty query
    if (query.trim()) {
      onSubmit(query.trim());
    }
  }, [query, onSubmit]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  return (
    <section className="query-interface" role="search">
      <form onSubmit={handleSubmit} aria-label="POI search form">
        <div className="input-group">
          <input
            type="text"
            className="query-input"
            placeholder="e.g., Find museums near parks, Show me coffee shops..."
            value={query}
            onChange={handleInputChange}
            disabled={isLoading}
            aria-label="POI search query"
            aria-required="true"
            autoComplete="off"
          />
          <button
            type="submit"
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || !query.trim()}
            aria-label="Submit search query"
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className="button-spinner" aria-hidden="true"></span>
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>
    </section>
  );
};

export default QueryInterface;
