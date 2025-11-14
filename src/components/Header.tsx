import React from 'react';

/**
 * Header Component
 * Displays the application title and description
 */
const Header: React.FC = () => {
  return (
    <header className="app-header" role="banner">
      <h1>LocalLens</h1>
      <p className="app-description">
        Search for Points of Interest in Richmond, VA using natural language queries.
        Ask about museums, hospitals, parks, restaurants, and coffee shops.
      </p>
    </header>
  );
};

export default Header;
