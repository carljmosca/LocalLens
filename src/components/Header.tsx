import React, { useEffect, useState } from 'react';
import { appConfig } from '../config/app.config';
import { dataService } from '../services/dataService';
import { InstallPrompt } from './InstallPrompt';

/**
 * Header Component
 * Displays the application title and description
 * Dynamically shows available POI types from the data
 * Includes PWA installation prompt
 */
const Header: React.FC = () => {
  const [poiTypes, setPoiTypes] = useState<string[]>([]);

  useEffect(() => {
    // Get supported POI types from the data service
    const types = dataService.getSupportedTypes();
    setPoiTypes(types);
  }, []);

  // Format POI types for display (show first 3, then "and more")
  const formatPoiTypes = () => {
    if (poiTypes.length === 0) return '';
    
    const displayTypes = poiTypes
      .slice(0, 3)
      .map(type => type.replace('_', ' '))
      .join(', ');
    
    if (poiTypes.length > 3) {
      return `${displayTypes}, and more`;
    }
    
    return displayTypes;
  };

  return (
    <header className="app-header" role="banner">
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          zIndex: 10 
        }}>
          <InstallPrompt />
        </div>
        <h1>{appConfig.app.name}</h1>
      </div>
      <p className="app-description">
        {appConfig.app.description} in {appConfig.location.displayName}.
        {poiTypes.length > 0 && (
          <> Ask about {formatPoiTypes()}. Type "what types are supported?" to see all available categories.</>
        )}
      </p>
    </header>
  );
};

export default Header;
