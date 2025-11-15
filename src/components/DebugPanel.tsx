/**
 * Copyright (c) 2025 Mosca IT LLC. All rights reserved.
 */

import React, { useEffect, useState } from 'react';
import { logger } from '../utils/logger';
import { appConfig } from '../config/app.config';
import SQLGeneratorDebug from './SQLGeneratorDebug';

/**
 * Debug Panel for mobile debugging
 * Shows device info, errors, and provides quick debugging tools
 */
export const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    // Only show in debug mode
    if (!appConfig.debug.enableLogging) return;

    // Collect device information
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      touchPoints: navigator.maxTouchPoints,
      webGPU: 'gpu' in navigator ? 'Available' : 'Not Available',
      serviceWorker: 'serviceWorker' in navigator ? 'Supported' : 'Not Supported',
    };
    setDeviceInfo(info);

    // Capture errors
    const errorHandler = (event: ErrorEvent) => {
      const errorMsg = `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
      setErrors(prev => [...prev, errorMsg].slice(-10)); // Keep last 10 errors
      logger.error('Uncaught error:', errorMsg);
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const errorMsg = `Unhandled promise rejection: ${event.reason}`;
      setErrors(prev => [...prev, errorMsg].slice(-10));
      logger.error('Unhandled rejection:', errorMsg);
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    // Triple-tap on screen edge to toggle debug panel
    let tapCount = 0;
    let tapTimer: NodeJS.Timeout;
    const handleTap = (e: TouchEvent) => {
      if (e.touches[0].clientX < 50 && e.touches[0].clientY < 50) {
        tapCount++;
        clearTimeout(tapTimer);
        if (tapCount === 3) {
          setIsVisible(prev => !prev);
          logger.toggleDebugConsole();
          tapCount = 0;
        }
        tapTimer = setTimeout(() => { tapCount = 0; }, 500);
      }
    };
    document.addEventListener('touchstart', handleTap);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
      document.removeEventListener('touchstart', handleTap);
    };
  }, []);

  if (!appConfig.debug.enableLogging || !isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      color: '#0f0',
      padding: '10px',
      fontSize: '11px',
      fontFamily: 'monospace',
      zIndex: 999998,
      maxHeight: '50vh',
      overflow: 'auto',
      borderBottom: '2px solid #0f0'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <strong>🔧 Debug Panel</strong>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ 
            background: '#f00', 
            color: '#fff', 
            border: 'none', 
            padding: '2px 8px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>

      <details open>
        <summary style={{ cursor: 'pointer', marginBottom: '5px' }}>📱 Device Info</summary>
        <div style={{ paddingLeft: '10px', fontSize: '10px' }}>
          {Object.entries(deviceInfo).map(([key, value]) => (
            <div key={key}>
              <strong>{key}:</strong> {String(value)}
            </div>
          ))}
        </div>
      </details>

      <details style={{ marginTop: 10 }}>
        <summary style={{ cursor: 'pointer', marginBottom: '5px' }}>🧾 SQL Generator</summary>
        <div style={{ paddingLeft: '10px' }}>
          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>
            Quick tool: generate SQL from a natural language request using the in-browser LM.
          </div>
          <SQLGeneratorDebug />
        </div>
      </details>

      {errors.length > 0 && (
        <details open style={{ marginTop: '10px' }}>
          <summary style={{ cursor: 'pointer', marginBottom: '5px', color: '#f00' }}>
            ❌ Errors ({errors.length})
          </summary>
          <div style={{ paddingLeft: '10px', fontSize: '10px', color: '#f00' }}>
            {errors.map((error, idx) => (
              <div key={idx} style={{ marginBottom: '5px', wordBreak: 'break-word' }}>
                {error}
              </div>
            ))}
          </div>
        </details>
      )}

      <div style={{ marginTop: '10px', fontSize: '9px', color: '#888' }}>
        💡 Tip: Triple-tap top-left corner to toggle this panel
      </div>
    </div>
  );
};
