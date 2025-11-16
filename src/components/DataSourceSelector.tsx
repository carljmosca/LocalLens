/**
 * Copyright (c) 2025 Mosca IT LLC. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { appConfig } from '../config/app.config';
import { logger } from '../utils/logger';

/**
 * Data Source Selector Component
 * Allows users to switch between different POI data files
 * Triggers a full page reload to reinitialize all services with new data
 */
export const DataSourceSelector: React.FC = () => {
  const [currentSource, setCurrentSource] = useState<string>(() => {
    // Check localStorage for saved preference
    return localStorage.getItem('locallens-data-source') || dataService.getCurrentDataSource();
  });

  useEffect(() => {
    setCurrentSource(localStorage.getItem('locallens-data-source') || dataService.getCurrentDataSource());
  }, []);

  const handleSourceChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSource = event.target.value;
    
    // Store the selection in localStorage for persistence
    localStorage.setItem('locallens-data-source', newSource);
    
    logger.log('🔄 Switching data source to:', newSource);
    
    // Clear service worker cache for POI data files to force fresh fetch
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          // Delete all POI JSON files from cache
          for (const request of keys) {
            if (request.url.includes('.json') && 
                (request.url.includes('pois') || request.url.includes('poi'))) {
              await cache.delete(request);
              logger.log('🗑️ Cleared cache for:', request.url);
            }
          }
        }
        logger.log('✅ Cache cleared for POI data files');
      } catch (err) {
        logger.warn('Failed to clear cache:', err);
      }
    }
    
    logger.log('🔄 Reloading application...');
    
    // Reload the page to reinitialize everything with new data
    window.location.reload();
  };

  // Only show if there are multiple data sources
  if (appConfig.data.availableDataSources.length <= 1) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 16px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '10px',
      fontSize: '15px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      margin: '10px 0'
    }}>
      <label htmlFor="data-source-selector" style={{ fontWeight: '600', color: 'white', fontSize: '15px' }}>
        📍 Data Source:
      </label>
      <select
        id="data-source-selector"
        value={currentSource}
        onChange={handleSourceChange}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          border: '2px solid white',
          background: 'white',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: '600',
          color: '#667eea',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {appConfig.data.availableDataSources.map((source) => (
          <option key={source.file} value={source.file}>
            {source.name}
          </option>
        ))}
      </select>
    </div>
  );
};
