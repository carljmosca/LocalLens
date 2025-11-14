import React from 'react';
import type { POIWithNearby } from '../types/services';
import { formatDistance } from '../utils/distance';

/**
 * Props for GroupedPOICard component
 */
interface GroupedPOICardProps {
  poiWithNearby: POIWithNearby;
  targetType: string;
  nearbyType: string;
}

/**
 * GroupedPOICard Component
 * Displays a primary POI with its nearby POIs grouped together
 */
const GroupedPOICard: React.FC<GroupedPOICardProps> = ({ 
  poiWithNearby, 
  targetType, 
  nearbyType 
}) => {
  const { nearbyPOIs, ...primaryPOI } = poiWithNearby;
  const targetDisplay = targetType.replace('_', ' ');
  const nearbyDisplay = nearbyType.replace('_', ' ');

  return (
    <article className="grouped-poi-card" role="article" aria-label={`${primaryPOI.name} with nearby ${nearbyDisplay}s`}>
      {/* Primary POI Header */}
      <div className="primary-poi-section">
        <div className="poi-header">
          <h3 className="poi-name">{primaryPOI.name}</h3>
          <span className="poi-type-badge primary" role="status">{targetDisplay}</span>
        </div>
        
        <div className="poi-details">
          {primaryPOI.attributes && primaryPOI.attributes.length > 0 && (
            <div className="poi-attributes">
              {primaryPOI.attributes.map((attr, index) => (
                <span key={index} className="poi-attribute-tag">{attr}</span>
              ))}
            </div>
          )}
          {primaryPOI.address && (
            <p className="poi-address">
              <strong>Address:</strong>{' '}
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(primaryPOI.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="address-link"
                aria-label={`Open ${primaryPOI.address} in Google Maps`}
              >
                {primaryPOI.address}
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Nearby POIs Section */}
      <div className="nearby-pois-section">
        <h4 className="nearby-header">
          Nearby {nearbyDisplay}s ({nearbyPOIs.length})
        </h4>
        <div className="nearby-pois-list">
          {nearbyPOIs.map((nearbyPOI) => (
            <div key={nearbyPOI.id} className="nearby-poi-item">
              <div className="nearby-poi-info">
                <div className="nearby-poi-header">
                  <span className="nearby-poi-name">{nearbyPOI.name}</span>
                  <span className="distance-badge">{formatDistance(nearbyPOI.distance)}</span>
                </div>
                
                {nearbyPOI.attributes && nearbyPOI.attributes.length > 0 && (
                  <div className="nearby-poi-attributes">
                    {nearbyPOI.attributes.map((attr, index) => (
                      <span key={index} className="nearby-attribute-tag">{attr}</span>
                    ))}
                  </div>
                )}
                
                {nearbyPOI.address && (
                  <p className="nearby-poi-address">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nearbyPOI.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="address-link nearby-address-link"
                      aria-label={`Open ${nearbyPOI.address} in Google Maps`}
                    >
                      {nearbyPOI.address}
                    </a>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
};

export default GroupedPOICard;