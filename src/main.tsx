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
import { logger } from './utils/logger'
import { appConfig } from './config/app.config'
import './index.css'

// Initialize on-screen logging for mobile debugging only when explicitly enabled
if (appConfig.debug.enableLogging && appConfig.debug.showOnScreenConsole) {
  logger.log('🔧 Debug mode + on-screen console enabled - initializing on-screen logging');
  // Initialize after a short delay to ensure DOM is ready
  setTimeout(() => {
    logger.initOnScreenLogging();
    logger.log('📱 On-screen debug console initialized');
    logger.log('💡 Triple-tap top-left corner to toggle debug panel');
  }, 1000);
}

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
