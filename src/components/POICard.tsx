import React from 'react';
import type { POI } from '../types';

/**
 * Props for POICard component
 */
interface POICardProps {
  poi: POI;
}

/**
 * POICard Component
 * Displays individual POI information in a card format
 * Memoized to prevent unnecessary re-renders
 */
const POICard: React.FC<POICardProps> = React.memo(({ poi }) => {
  return (
    <article className="poi-card" role="article" aria-label={`${poi.name} - ${poi.type}`}>
      <div className="poi-header">
        <h3 className="poi-name">{poi.name}</h3>
        <span className="poi-type-badge" role="status">{poi.type.replace('_', ' ')}</span>
      </div>
      <div className="poi-details">
        {poi.attributes && poi.attributes.length > 0 && (
          <div className="poi-attributes">
            {poi.attributes.map((attr, index) => (
              <span key={index} className="poi-attribute-tag">{attr}</span>
            ))}
          </div>
        )}
        {poi.address && (
          <p className="poi-address">
            <strong>Address:</strong> {poi.address}
          </p>
        )}
      </div>
    </article>
  );
});

POICard.displayName = 'POICard';

export default POICard;
