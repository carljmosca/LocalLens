import React, { useEffect, useState } from 'react';
import { appConfig } from '../config/app.config';
import { dataService } from '../services/dataService';

/**
 * Header Component
 * Displays the application title and description
 * Dynamically shows available POI types from the data
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
      <h1>{appConfig.app.name}</h1>
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
