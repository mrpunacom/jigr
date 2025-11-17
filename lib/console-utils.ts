/**
 * Console Utilities - Clean Testing Experience
 * 
 * Provides filtered console logging to reduce noise during testing
 * while maintaining important error and success messages.
 */

type LogLevel = 'error' | 'warn' | 'info' | 'success' | 'debug'

interface LogConfig {
  showDebug: boolean
  showInfo: boolean
  showAuth: boolean
  showAPI: boolean
  environment: 'development' | 'production' | 'testing'
}

// Configuration based on environment
const getLogConfig = (): LogConfig => {
  const env = process.env.NODE_ENV || 'development'
  
  if (env === 'production') {
    return {
      showDebug: false,
      showInfo: false,
      showAuth: false,
      showAPI: false,
      environment: 'production'
    }
  }
  
  return {
    showDebug: true,
    showInfo: true,
    showAuth: true,
    showAPI: true,
    environment: env as 'development' | 'production'
  }
}

const config = getLogConfig()

/**
 * Filtered console logging that respects testing mode
 */
export const logger = {
  error: (message: string, ...args: any[]) => {
    console.error(`❌ ${message}`, ...args)
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️ ${message}`, ...args)
  },
  
  success: (message: string, ...args: any[]) => {
    console.log(`✅ ${message}`, ...args)
  },
  
  info: (message: string, ...args: any[]) => {
    if (config.showInfo) {
      console.log(`ℹ️ ${message}`, ...args)
    }
  },
  
  debug: (message: string, ...args: any[]) => {
    if (config.showDebug) {
      console.log(`🔍 ${message}`, ...args)
    }
  },
  
  auth: (message: string, ...args: any[]) => {
    if (config.showAuth) {
      console.log(`🔐 ${message}`, ...args)
    }
  },
  
  api: (message: string, ...args: any[]) => {
    if (config.showAPI) {
      console.log(`🌐 ${message}`, ...args)
    }
  },
  
  champion: (message: string, ...args: any[]) => {
    // Champion messages always show (they're important for testing)
    console.log(`🏆 CHAMPION: ${message}`, ...args)
  }
}

/**
 * Enable quiet mode for clean testing
 */
export const enableQuietMode = () => {
  if (typeof window !== 'undefined') {
    // Override console.log globally to suppress all logs except errors and warnings
    const originalLog = console.log
    const originalInfo = console.info
    
    console.log = (...args: any[]) => {
      // Suppress all console.log calls in quiet mode
      // Only allow through explicit error/warning messages
      const message = args.join(' ')
      if (message.includes('❌') || message.includes('⚠️')) {
        originalLog(...args)
      }
      // Champion messages are suppressed too for cleaner testing
    }
    
    console.info = (...args: any[]) => {
      // Suppress info logs in quiet mode
    }
    
    // Store originals for restoration
    ;(window as any).originalConsole = { log: originalLog, info: originalInfo }
    
    // Show notification that quiet mode is enabled
    originalLog(`🔇 Quiet mode enabled - console.log calls suppressed`)
    originalLog(`🔊 To re-enable debug logs, use jigrLogger.verbose()`)
  }
}

/**
 * Auto-enable quiet mode by default for production-like experience
 */
export const autoEnableQuietMode = () => {
  // Removed automatic quiet mode - let developer control it manually
}

/**
 * Disable quiet mode to see all logs
 */
export const disableQuietMode = () => {
  if (typeof window !== 'undefined') {
    // Restore original console functions
    const originalConsole = (window as any).originalConsole
    if (originalConsole) {
      console.log = originalConsole.log
      console.info = originalConsole.info
    }
    
    console.log(`🔊 Debug logging re-enabled`)
  }
}

/**
 * Console utilities for testing
 */
export const testUtils = {
  clearConsole: () => {
    if (typeof window !== 'undefined') {
      console.clear()
      console.log(`🧹 Console cleared for testing`)
    }
  },
  
  showOnlyErrors: () => {
    enableQuietMode()
  },
  
  showAll: () => {
    disableQuietMode()
  },
  
  getCurrentMode: () => {
    const originalConsole = typeof window !== 'undefined' && (window as any).originalConsole
    return originalConsole ? 'quiet' : 'verbose'
  }
}

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as any).jigrLogger = {
    quiet: enableQuietMode,
    verbose: disableQuietMode,
    clear: testUtils.clearConsole,
    mode: testUtils.getCurrentMode
  }
}