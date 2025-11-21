// Comprehensive error handling and graceful degradation for hardware integration

export interface HardwareError {
  type: 'bluetooth' | 'camera' | 'printer' | 'permission' | 'network' | 'unknown';
  code: string;
  message: string;
  userMessage: string;
  recovery?: {
    action: string;
    callback?: () => void;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class HardwareErrorHandler {
  private static instance: HardwareErrorHandler;
  private errorHistory: HardwareError[] = [];
  private maxHistorySize = 50;

  static getInstance(): HardwareErrorHandler {
    if (!this.instance) {
      this.instance = new HardwareErrorHandler();
    }
    return this.instance;
  }

  // Bluetooth Scale Error Handling
  static handleBluetoothError(error: any, context: string = ''): HardwareError {
    let hardwareError: HardwareError;

    if (error.name === 'NotFoundError') {
      hardwareError = {
        type: 'bluetooth',
        code: 'BLUETOOTH_NO_DEVICE',
        message: `No Bluetooth scale found. ${context}`,
        userMessage: 'No Bluetooth scale was found. Please ensure your scale is turned on and in pairing mode.',
        recovery: {
          action: 'Try connecting again or use manual weight entry'
        },
        severity: 'medium'
      };
    } else if (error.name === 'NotAllowedError') {
      hardwareError = {
        type: 'permission',
        code: 'BLUETOOTH_PERMISSION_DENIED',
        message: `Bluetooth permission denied. ${context}`,
        userMessage: 'Bluetooth access was denied. Please enable Bluetooth permissions in your browser settings.',
        recovery: {
          action: 'Enable Bluetooth permissions and try again'
        },
        severity: 'high'
      };
    } else if (error.name === 'NotSupportedError') {
      hardwareError = {
        type: 'bluetooth',
        code: 'BLUETOOTH_NOT_SUPPORTED',
        message: `Web Bluetooth not supported. ${context}`,
        userMessage: 'Your device or browser does not support Bluetooth connectivity.',
        recovery: {
          action: 'Use manual weight entry instead'
        },
        severity: 'high'
      };
    } else if (error.name === 'NetworkError') {
      hardwareError = {
        type: 'bluetooth',
        code: 'BLUETOOTH_CONNECTION_FAILED',
        message: `Bluetooth connection failed. ${context}`,
        userMessage: 'Failed to connect to Bluetooth scale. The scale may be out of range or already connected to another device.',
        recovery: {
          action: 'Move closer to scale and try reconnecting'
        },
        severity: 'medium'
      };
    } else if (error.message?.includes('GATT')) {
      hardwareError = {
        type: 'bluetooth',
        code: 'BLUETOOTH_GATT_ERROR',
        message: `GATT service error. ${context}`,
        userMessage: 'Communication with the Bluetooth scale failed. The scale may not be compatible.',
        recovery: {
          action: 'Try a different scale or use manual entry'
        },
        severity: 'medium'
      };
    } else {
      hardwareError = {
        type: 'bluetooth',
        code: 'BLUETOOTH_UNKNOWN_ERROR',
        message: `Unknown Bluetooth error: ${error.message}. ${context}`,
        userMessage: 'An unexpected Bluetooth error occurred. Please try again.',
        recovery: {
          action: 'Restart the app or use manual weight entry'
        },
        severity: 'low'
      };
    }

    this.getInstance().logError(hardwareError);
    return hardwareError;
  }

  // Camera Error Handling
  static handleCameraError(error: any, context: string = ''): HardwareError {
    let hardwareError: HardwareError;

    if (error.name === 'NotAllowedError') {
      hardwareError = {
        type: 'permission',
        code: 'CAMERA_PERMISSION_DENIED',
        message: `Camera permission denied. ${context}`,
        userMessage: 'Camera access was denied. Please enable camera permissions in your browser settings.',
        recovery: {
          action: 'Enable camera permissions and reload the page'
        },
        severity: 'high'
      };
    } else if (error.name === 'NotFoundError') {
      hardwareError = {
        type: 'camera',
        code: 'CAMERA_NOT_FOUND',
        message: `No camera found. ${context}`,
        userMessage: 'No camera was found on this device.',
        recovery: {
          action: 'Use manual barcode entry instead'
        },
        severity: 'high'
      };
    } else if (error.name === 'NotSupportedError') {
      hardwareError = {
        type: 'camera',
        code: 'CAMERA_NOT_SUPPORTED',
        message: `Camera not supported. ${context}`,
        userMessage: 'Your device or browser does not support camera access.',
        recovery: {
          action: 'Use manual barcode entry instead'
        },
        severity: 'high'
      };
    } else if (error.name === 'NotReadableError') {
      hardwareError = {
        type: 'camera',
        code: 'CAMERA_HARDWARE_ERROR',
        message: `Camera hardware error. ${context}`,
        userMessage: 'Camera is already in use by another application or there is a hardware issue.',
        recovery: {
          action: 'Close other apps using camera and try again'
        },
        severity: 'medium'
      };
    } else if (error.name === 'OverconstrainedError') {
      hardwareError = {
        type: 'camera',
        code: 'CAMERA_CONSTRAINTS_ERROR',
        message: `Camera constraints not supported. ${context}`,
        userMessage: 'The requested camera settings are not supported by your device.',
        recovery: {
          action: 'Try with different camera settings'
        },
        severity: 'low'
      };
    } else {
      hardwareError = {
        type: 'camera',
        code: 'CAMERA_UNKNOWN_ERROR',
        message: `Unknown camera error: ${error.message}. ${context}`,
        userMessage: 'An unexpected camera error occurred. Please try again.',
        recovery: {
          action: 'Reload the page or use manual barcode entry'
        },
        severity: 'low'
      };
    }

    this.getInstance().logError(hardwareError);
    return hardwareError;
  }

  // Printer Error Handling
  static handlePrinterError(error: any, context: string = ''): HardwareError {
    let hardwareError: HardwareError;

    if (error.name === 'NotAllowedError') {
      hardwareError = {
        type: 'permission',
        code: 'PRINT_PERMISSION_DENIED',
        message: `Print permission denied. ${context}`,
        userMessage: 'Printing was blocked by your browser. Please allow pop-ups for label printing.',
        recovery: {
          action: 'Enable pop-ups and try printing again'
        },
        severity: 'medium'
      };
    } else if (error.message?.includes('popup')) {
      hardwareError = {
        type: 'printer',
        code: 'PRINT_POPUP_BLOCKED',
        message: `Print popup blocked. ${context}`,
        userMessage: 'Pop-up blocker prevented the print dialog from opening.',
        recovery: {
          action: 'Disable pop-up blocker for this site and try again'
        },
        severity: 'medium'
      };
    } else {
      hardwareError = {
        type: 'printer',
        code: 'PRINT_UNKNOWN_ERROR',
        message: `Print error: ${error.message}. ${context}`,
        userMessage: 'An error occurred while trying to print. You can download the label instead.',
        recovery: {
          action: 'Download label as PDF and print manually'
        },
        severity: 'low'
      };
    }

    this.getInstance().logError(hardwareError);
    return hardwareError;
  }

  // Network/Security Error Handling
  static handleSecurityError(error: any, context: string = ''): HardwareError {
    let hardwareError: HardwareError;

    if (error.message?.includes('HTTPS') || !window.isSecureContext) {
      hardwareError = {
        type: 'network',
        code: 'HTTPS_REQUIRED',
        message: `HTTPS required for hardware access. ${context}`,
        userMessage: 'Hardware features require a secure HTTPS connection. Please access this site via HTTPS.',
        recovery: {
          action: 'Switch to HTTPS version of this site'
        },
        severity: 'critical'
      };
    } else {
      hardwareError = {
        type: 'unknown',
        code: 'SECURITY_ERROR',
        message: `Security error: ${error.message}. ${context}`,
        userMessage: 'A security error prevented hardware access.',
        recovery: {
          action: 'Check browser security settings'
        },
        severity: 'high'
      };
    }

    this.getInstance().logError(hardwareError);
    return hardwareError;
  }

  // Log error to history
  private logError(error: HardwareError): void {
    this.errorHistory.unshift({
      ...error,
      message: `${new Date().toISOString()}: ${error.message}`
    });

    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }

    // Log to console for debugging
    console.error('Hardware Error:', error);

    // Send to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'hardware_error', {
        error_type: error.type,
        error_code: error.code,
        error_severity: error.severity
      });
    }
  }

  // Get error history
  getErrorHistory(): HardwareError[] {
    return [...this.errorHistory];
  }

  // Clear error history
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  // Get error count by type
  getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.errorHistory.forEach(error => {
      stats[error.type] = (stats[error.type] || 0) + 1;
    });
    return stats;
  }
}

// Graceful Degradation Utilities
export class HardwareDegradation {
  // Check if device supports hardware features
  static checkHardwareSupport(): {
    bluetooth: boolean;
    camera: boolean;
    print: boolean;
    touch: boolean;
    isSecure: boolean;
    deviceType: 'desktop' | 'tablet' | 'mobile';
  } {
    const userAgent = navigator.userAgent.toLowerCase();
    
    return {
      bluetooth: 'bluetooth' in navigator,
      camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      print: typeof window.print === 'function',
      touch: 'ontouchstart' in window,
      isSecure: window.isSecureContext,
      deviceType: this.getDeviceType()
    };
  }

  private static getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/ipad|android(?!.*mobile)|tablet/.test(userAgent)) {
      return 'tablet';
    } else if (/iphone|android.*mobile|mobile/.test(userAgent)) {
      return 'mobile';
    } else {
      return 'desktop';
    }
  }

  // Get recommended fallback strategy
  static getRecommendedFallbacks(hardwareSupport: ReturnType<typeof this.checkHardwareSupport>): {
    weight: 'hardware' | 'manual' | 'both';
    barcode: 'hardware' | 'manual' | 'both';
    printing: 'browser' | 'download' | 'both';
  } {
    return {
      weight: hardwareSupport.bluetooth ? 'both' : 'manual',
      barcode: hardwareSupport.camera ? 'both' : 'manual',
      printing: hardwareSupport.print ? 'both' : 'download'
    };
  }

  // Safari 12 specific compatibility check
  static checkSafari12Compatibility(): {
    isCompatible: boolean;
    version: string | null;
    warnings: string[];
  } {
    const userAgent = navigator.userAgent;
    const warnings: string[] = [];
    
    // Check if Safari
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    
    if (!isSafari) {
      warnings.push('Not running on Safari - compatibility not guaranteed for iPad Air 2013');
    }
    
    // Extract Safari version
    const versionMatch = userAgent.match(/Version\/([0-9]+\.[0-9]+)/);
    const version = versionMatch ? versionMatch[1] : null;
    
    if (version) {
      const majorVersion = parseInt(version.split('.')[0]);
      
      if (majorVersion < 12) {
        warnings.push('Safari version is older than 12 - hardware features may not work');
      }
    }
    
    // Check for iPad Air 2013 indicators
    if (/iPad/.test(userAgent)) {
      const memory = (navigator as any).deviceMemory;
      if (memory && memory < 2) {
        warnings.push('Low memory device detected - reduced performance expected');
      }
    }
    
    // Check secure context
    if (!window.isSecureContext) {
      warnings.push('HTTPS required for camera and Bluetooth access');
    }
    
    return {
      isCompatible: warnings.length === 0,
      version,
      warnings
    };
  }
}

// Error Recovery Strategies
export const HardwareRecovery = {
  // Bluetooth recovery
  async retryBluetoothConnection(maxRetries: number = 3): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Wait between retries
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
        
        // Attempt connection (this would be called from the actual hook)
        console.log(`Bluetooth connection attempt ${i + 1}/${maxRetries}`);
        return true; // Return true if successful
      } catch (error) {
        console.error(`Bluetooth retry ${i + 1} failed:`, error);
        if (i === maxRetries - 1) {
          throw error; // Re-throw on final attempt
        }
      }
    }
    return false;
  },

  // Camera recovery
  async retryCameraAccess(constraints?: MediaStreamConstraints): Promise<MediaStream | null> {
    const fallbackConstraints = [
      constraints,
      { video: { facingMode: 'environment' } },
      { video: { width: 640, height: 480 } },
      { video: true }
    ].filter(Boolean);

    for (const constraint of fallbackConstraints) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraint as MediaStreamConstraints);
        return stream;
      } catch (error) {
        console.warn('Camera constraint failed, trying fallback:', error);
      }
    }

    return null;
  },

  // Print recovery
  downloadAsBackup(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

// Export default error handler instance
export default HardwareErrorHandler;