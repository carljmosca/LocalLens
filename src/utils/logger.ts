/**
 * Copyright (c) 2025 Mosca IT LLC. All rights reserved.
 */

import { appConfig } from '../config/app.config';

/**
 * Logger utility that respects debug configuration
 * Provides a clean API without requiring conditional checks everywhere
 * Includes on-screen logging for mobile debugging
 */
class Logger {
  private logContainer: HTMLDivElement | null = null;
  private logBuffer: string[] = [];
  private maxBufferSize = 100;

  private get isEnabled(): boolean {
    return appConfig.debug.enableLogging;
  }

  /**
   * Initialize on-screen logging for mobile debugging
   * Call this to enable visual console on mobile devices
   */
  initOnScreenLogging(): void {
    if (this.logContainer) return; // Already initialized

    this.logContainer = document.createElement('div');
    this.logContainer.id = 'mobile-debug-console';
    this.logContainer.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      max-height: 40vh;
      background: rgba(0, 0, 0, 0.95);
      color: #0f0;
      font-family: 'Courier New', monospace;
      font-size: 10px;
      padding: 10px;
      overflow-y: auto;
      z-index: 999999;
      border-top: 2px solid #0f0;
      display: none;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      padding-bottom: 5px;
      border-bottom: 1px solid #0f0;
    `;
    header.innerHTML = `
      <span>📱 Debug Console</span>
      <button id="clear-debug-log" style="background: #0f0; color: #000; border: none; padding: 2px 8px; cursor: pointer;">Clear</button>
      <button id="close-debug-log" style="background: #f00; color: #fff; border: none; padding: 2px 8px; cursor: pointer;">Close</button>
    `;

    const logContent = document.createElement('pre');
    logContent.id = 'debug-log-content';
    logContent.style.cssText = 'margin: 0; white-space: pre-wrap; word-wrap: break-word;';

    this.logContainer.appendChild(header);
    this.logContainer.appendChild(logContent);
    document.body.appendChild(this.logContainer);

    // Add event listeners
    document.getElementById('clear-debug-log')?.addEventListener('click', () => {
      this.logBuffer = [];
      this.updateLogDisplay();
    });

    document.getElementById('close-debug-log')?.addEventListener('click', () => {
      if (this.logContainer) {
        this.logContainer.style.display = 'none';
      }
    });

    // Show container
    this.logContainer.style.display = 'block';

    // Display buffered logs
    this.updateLogDisplay();
  }

  /**
   * Toggle on-screen debug console visibility
   */
  toggleDebugConsole(): void {
    if (!this.logContainer) {
      this.initOnScreenLogging();
      return;
    }
    this.logContainer.style.display = 
      this.logContainer.style.display === 'none' ? 'block' : 'none';
  }

  private formatLogMessage(level: string, args: any[]): string {
    const timestamp = new Date().toLocaleTimeString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    return `[${timestamp}] ${level}: ${message}`;
  }

  private addToBuffer(level: string, args: any[]): void {
    const message = this.formatLogMessage(level, args);
    this.logBuffer.push(message);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
    this.updateLogDisplay();
  }

  private updateLogDisplay(): void {
    const logContent = document.getElementById('debug-log-content');
    if (logContent) {
      logContent.textContent = this.logBuffer.join('\n');
      // Auto-scroll to bottom
      logContent.scrollTop = logContent.scrollHeight;
    }
  }

  log(...args: any[]): void {
    if (this.isEnabled) {
      console.log(...args);
      this.addToBuffer('LOG', args);
    }
  }

  info(...args: any[]): void {
    if (this.isEnabled) {
      console.info(...args);
      this.addToBuffer('INFO', args);
    }
  }

  warn(...args: any[]): void {
    if (this.isEnabled) {
      console.warn(...args);
      this.addToBuffer('WARN', args);
    }
  }

  error(...args: any[]): void {
    // Always log errors regardless of debug setting
    console.error(...args);
    this.addToBuffer('ERROR', args);
  }

  debug(...args: any[]): void {
    if (this.isEnabled) {
      console.debug(...args);
      this.addToBuffer('DEBUG', args);
    }
  }

  group(label: string): void {
    if (this.isEnabled) {
      console.group(label);
      this.addToBuffer('GROUP', [label]);
    }
  }

  groupEnd(): void {
    if (this.isEnabled) {
      console.groupEnd();
    }
  }

  table(data: any): void {
    if (this.isEnabled) {
      console.table(data);
      this.addToBuffer('TABLE', [data]);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
