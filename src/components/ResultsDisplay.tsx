import React from 'react';
import type { QueryResult } from '../types';
import POICard from './POICard';
import { appConfig } from '../config/app.config';

/**
 * Props for ResultsDisplay component
 */
interface ResultsDisplayProps {
  result: QueryResult | null;
}

/**
 * ResultsDisplay Component
 * Renders different views based on QueryResult type
 */
const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  // No results yet
  if (!result) {
    return (
      <section className="results-display" role="region" aria-label="Search results">
        <p className="info-message" role="status">
          Enter a query to search for Points of Interest in {appConfig.location.displayName}.
        </p>
      </section>
    );
  }

  // Success - display POI list
  if (result.type === 'success') {
    if (result.pois.length === 0) {
      return (
        <section className="results-display" role="region" aria-label="Search results">
          <p className="info-message" role="status">No results found. Try a different query.</p>
        </section>
      );
    }

    return (
      <section className="results-display success-result" role="region" aria-label="Search results">
        <div className="results-header">
          <h2 className="results-title">
            <span className="success-icon" aria-hidden="true">✓</span>
            Results ({result.pois.length})
          </h2>
        </div>
        <div className="poi-list" role="list" aria-label={`${result.pois.length} points of interest found`}>
          {result.pois.map((poi) => (
            <POICard key={poi.id} poi={poi} />
          ))}
        </div>
      </section>
    );
  }

  // Suggestions - display help text
  if (result.type === 'suggestions') {
    return (
      <section className="results-display" role="region" aria-label="Search suggestions">
        <div className="suggestions-container" role="complementary">
          <p className="help-message" role="status">{result.message}</p>
          {result.suggestions && result.suggestions.length > 0 && (
            <div className="suggestions-list">
              <h3>Try these queries:</h3>
              <ul aria-label="Suggested queries">
                {result.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Types - display supported POI types
  if (result.type === 'types') {
    return (
      <section className="results-display" role="region" aria-label="Supported POI types">
        <div className="types-container">
          <h2>Supported POI Types</h2>
          <ul className="types-list" role="list" aria-label="Available POI categories">
            {result.types.map((type) => (
              <li key={type} className="type-item" role="listitem">
                {type.replace('_', ' ')}
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  // Error - display error message
  if (result.type === 'error') {
    return (
      <section className="results-display error-result" role="region" aria-label="Error message">
        <div className="error-container" role="alert">
          <div className="error-icon" aria-hidden="true">⚠</div>
          <p className="error-message">{result.message}</p>
        </div>
      </section>
    );
  }

  return null;
};

export default ResultsDisplay;
