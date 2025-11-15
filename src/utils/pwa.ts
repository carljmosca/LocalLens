/**
 * Progressive Web App Utilities
 * 
 * Service worker registration, installation prompts, and PWA management
 * 
 * Copyright (c) 2025 Mosca IT LLC. All rights reserved.
 */

// Service Worker utilities for PWA functionality

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export class PWAUtils {
  private static deferredPrompt: BeforeInstallPromptEvent | null = null;
  private static installCallbacks: Array<(canInstall: boolean) => void> = [];

  /**
   * Register the service worker
   */
  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered successfully:', registration);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, prompt user to refresh
                this.notifyUpdate();
              }
            });
          }
        });

        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Initialize PWA installation prompt handling
   */
  static initInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();
      
      // Save the event for later use
      this.deferredPrompt = event;
      
      // Notify components that app can be installed
      this.installCallbacks.forEach(callback => callback(true));
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.deferredPrompt = null;
      this.installCallbacks.forEach(callback => callback(false));
    });
  }

  /**
   * Show the install prompt
   */
  static async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      // Show the install prompt
      await this.deferredPrompt.prompt();
      
      // Wait for user response
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }

      // Reset the deferred prompt
      this.deferredPrompt = null;
      this.installCallbacks.forEach(callback => callback(false));

      return choiceResult.outcome === 'accepted';
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }

  /**
   * Check if the app can be installed
   */
  static canInstall(): boolean {
    return !!this.deferredPrompt;
  }

  /**
   * Register a callback for install availability changes
   */
  static onInstallAvailabilityChange(callback: (canInstall: boolean) => void): () => void {
    this.installCallbacks.push(callback);
    
    // Call immediately with current state
    callback(this.canInstall());

    // Return unsubscribe function
    return () => {
      const index = this.installCallbacks.indexOf(callback);
      if (index > -1) {
        this.installCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Check if the app is running as PWA
   */
  static isRunningAsPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  /**
   * Notify user about app update
   */
  private static notifyUpdate(): void {
    if (confirm('A new version is available. Reload to update?')) {
      window.location.reload();
    }
  }

  /**
   * Cache AI model for offline use
   */
  static async cacheAIModel(url: string, modelName: string): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      return new Promise((resolve, reject) => {
        const messageChannel = new MessageChannel();
        const controller = navigator.serviceWorker.controller;
        
        if (!controller) {
          reject(new Error('Service worker controller not available'));
          return;
        }

        messageChannel.port1.onmessage = (event) => {
          if (event.data.type === 'MODEL_CACHED') {
            console.log(`AI Model ${modelName} cached successfully`);
            resolve();
          } else if (event.data.type === 'MODEL_CACHE_FAILED') {
            console.error(`Failed to cache AI Model ${modelName}:`, event.data.error);
            reject(new Error(event.data.error));
          }
        };

        controller.postMessage({
          type: 'CACHE_AI_MODEL',
          url: url,
          modelName: modelName
        }, [messageChannel.port2]);
      });
    } else {
      throw new Error('Service worker not available');
    }
  }

  /**
   * Get network status
   */
  static isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Listen for network status changes
   */
  static onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
}