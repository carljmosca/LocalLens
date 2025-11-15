/**
 * LocalLens Application Entry Point
 * 
 * Copyright (c) 2025 Mosca IT LLC. All rights reserved.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App'
import ErrorBoundary from './components/ErrorBoundary'
import { PWAUtils } from './utils/pwa'
import './index.css'

// Initialize PWA functionality
PWAUtils.registerServiceWorker().then((registration) => {
  if (registration) {
    console.log('LocalLens is ready for offline use!');
  }
});

PWAUtils.initInstallPrompt();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
