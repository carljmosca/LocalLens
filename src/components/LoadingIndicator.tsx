import React from 'react';

/**
 * Props for LoadingIndicator component
 */
interface LoadingIndicatorProps {
  message?: string;
  progress?: number;
}

/**
 * LoadingIndicator Component
 * Displays a loading spinner with optional message and progress bar
 */
const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message = 'Loading...', 
  progress 
}) => {
  return (
    <div className="loading-indicator" role="status" aria-live="polite">
      <div className="spinner"></div>
      <p>{message}</p>
      {progress !== undefined && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingIndicator;
