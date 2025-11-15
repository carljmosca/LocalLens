/**
 * Copyright (c) 2025 Mosca IT LLC. All rights reserved.
 */

import { appConfig } from '../config/app.config';

/**
 * Logger utility that respects debug configuration
 * Provides a clean API without requiring conditional checks everywhere
 */
class Logger {
  private get isEnabled(): boolean {
    return appConfig.debug.enableLogging;
  }

  log(...args: any[]): void {
    if (this.isEnabled) {
      console.log(...args);
    }
  }

  info(...args: any[]): void {
    if (this.isEnabled) {
      console.info(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.isEnabled) {
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    // Always log errors regardless of debug setting
    console.error(...args);
  }

  debug(...args: any[]): void {
    if (this.isEnabled) {
      console.debug(...args);
    }
  }

  group(label: string): void {
    if (this.isEnabled) {
      console.group(label);
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
    }
  }
}

// Export singleton instance
export const logger = new Logger();
