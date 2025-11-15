import React, { useState, useEffect } from 'react';
import { PWAUtils } from '../utils/pwa';

interface InstallPromptProps {
  className?: string;
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px'
  },
  installButton: {
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  installButtonDisabled: {
    background: '#9ca3af',
    cursor: 'not-allowed'
  },
  networkStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 0.2s ease'
  },
  networkOnline: {
    background: '#dcfce7',
    color: '#166534'
  },
  networkOffline: {
    background: '#fee2e2',
    color: '#991b1b'
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    transition: 'all 0.2s ease'
  },
  dotOnline: {
    background: '#22c55e'
  },
  dotOffline: {
    background: '#ef4444'
  }
};

export const InstallPrompt: React.FC<InstallPromptProps> = ({ className = '' }) => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Set up install availability listener
    const unsubscribeInstall = PWAUtils.onInstallAvailabilityChange(setCanInstall);
    
    // Set up network status listener
    const unsubscribeNetwork = PWAUtils.onNetworkChange(setIsOnline);

    return () => {
      unsubscribeInstall();
      unsubscribeNetwork();
    };
  }, []);

  const handleInstall = async () => {
    if (!canInstall || isInstalling) return;

    setIsInstalling(true);
    try {
      await PWAUtils.showInstallPrompt();
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // Don't show if already running as PWA
  if (PWAUtils.isRunningAsPWA()) {
    return null;
  }

  return (
    <div className={className} style={styles.container}>
      {/* Install Button */}
      {canInstall && (
        <button
          onClick={handleInstall}
          disabled={isInstalling}
          style={{
            ...styles.installButton,
            ...(isInstalling ? styles.installButtonDisabled : {})
          }}
          aria-label="Install LocalLens app"
        >
          {isInstalling ? 'Installing...' : '📱 Install App'}
        </button>
      )}

      {/* Network Status Indicator */}
      <div style={{
        ...styles.networkStatus,
        ...(isOnline ? styles.networkOnline : styles.networkOffline)
      }}>
        <span style={{
          ...styles.statusDot,
          ...(isOnline ? styles.dotOnline : styles.dotOffline)
        }}></span>
        {isOnline ? 'Online' : 'Offline'}
      </div>
    </div>
  );
};