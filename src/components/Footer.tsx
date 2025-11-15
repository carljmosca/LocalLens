/**
 * Footer Component
 * 
 * Displays copyright information and app metadata
 * 
 * Copyright (c) 2025 Mosca IT LLC. All rights reserved.
 */
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-content">
        <p className="copyright">
          © 2025 <span className="company-name">Mosca IT LLC</span>. All rights reserved.
        </p>
        <p className="app-info">
          LocalLens v1.0 - AI-Powered Point of Interest Search
        </p>
      </div>
    </footer>
  );
};

export default Footer;