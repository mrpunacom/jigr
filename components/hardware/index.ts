// Hardware Integration Components
// Export all hardware components for easy importing

// Hooks
export { useBluetoothScale } from '@/hooks/useBluetoothScale';
export { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

// Core Hardware Components
export { default as BluetoothScaleConnector } from './BluetoothScaleConnector';
export { default as WeightDisplay } from './WeightDisplay';
export { default as BarcodeScanner } from './BarcodeScanner';
export { default as LabelPrinter } from './LabelPrinter';

// Fallback Components
export { default as HardwareFallback } from './ManualEntryFallbacks';
export { 
  ManualWeightEntry, 
  ManualBarcodeEntry, 
  HardwareStatus 
} from './ManualEntryFallbacks';

// Diagnostics and Testing
export { default as HardwareDiagnostics } from './HardwareDiagnostics';

// Utilities
export {
  generateBarcodeImage,
  generateQRCodeImage,
  generateContainerLabel,
  generateItemLabel,
  printLabel,
  downloadLabel,
  validateBarcode,
  type LabelData
} from '@/lib/label-generator';

export {
  HardwareErrorHandler,
  HardwareDegradation,
  HardwareRecovery,
  type HardwareError
} from '@/lib/hardware-error-handling';

export {
  HardwareSecurity,
  type SecurityCheck,
  type PermissionStatus
} from '@/lib/hardware-security';

// Type definitions for hardware integration
export interface HardwareConfig {
  bluetooth: {
    enabled: boolean;
    autoConnect: boolean;
    retryAttempts: number;
  };
  camera: {
    enabled: boolean;
    preferredFacing: 'user' | 'environment';
    resolution: {
      width: number;
      height: number;
    };
  };
  printing: {
    enabled: boolean;
    defaultFormat: 'container' | 'item';
    autoDownloadOnFail: boolean;
  };
  fallbacks: {
    enableManualEntry: boolean;
    enableHistory: boolean;
    maxHistorySize: number;
  };
  security: {
    requireHTTPS: boolean;
    validatePermissions: boolean;
    enableDiagnostics: boolean;
  };
}

// Default hardware configuration for iPad Air 2013
export const DEFAULT_HARDWARE_CONFIG: HardwareConfig = {
  bluetooth: {
    enabled: true,
    autoConnect: false,
    retryAttempts: 3
  },
  camera: {
    enabled: true,
    preferredFacing: 'environment',
    resolution: {
      width: 1280,
      height: 720
    }
  },
  printing: {
    enabled: true,
    defaultFormat: 'container',
    autoDownloadOnFail: true
  },
  fallbacks: {
    enableManualEntry: true,
    enableHistory: true,
    maxHistorySize: 10
  },
  security: {
    requireHTTPS: true,
    validatePermissions: true,
    enableDiagnostics: true
  }
};

// iPad Air 2013 specific optimizations
export const IPAD_AIR_2013_CONFIG: Partial<HardwareConfig> = {
  camera: {
    enabled: true,
    preferredFacing: 'environment',
    resolution: {
      width: 640,
      height: 480 // Lower resolution for better performance
    }
  },
  bluetooth: {
    enabled: true,
    autoConnect: false,
    retryAttempts: 2 // Fewer retries to avoid blocking UI
  }
};

// Hardware feature detection utility
export function detectHardwareCapabilities(): {
  bluetooth: boolean;
  camera: boolean;
  print: boolean;
  touch: boolean;
  isSecure: boolean;
  isLegacyDevice: boolean;
} {
  const isLegacyDevice = (() => {
    const memory = (navigator as any).deviceMemory;
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Detect iPad Air 2013 indicators
    return (
      /ipad/.test(userAgent) && 
      (memory && memory <= 2) || 
      /os 12_/.test(userAgent) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)
    );
  })();

  return {
    bluetooth: 'bluetooth' in navigator,
    camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    print: typeof window.print === 'function',
    touch: 'ontouchstart' in window,
    isSecure: window.isSecureContext,
    isLegacyDevice
  };
}

// Hardware integration helper
export class HardwareManager {
  private config: HardwareConfig;
  
  constructor(config: HardwareConfig = DEFAULT_HARDWARE_CONFIG) {
    this.config = config;
  }

  getConfig(): HardwareConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<HardwareConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Apply iPad Air 2013 optimizations if detected
  optimizeForDevice(): void {
    const capabilities = detectHardwareCapabilities();
    
    if (capabilities.isLegacyDevice) {
      this.updateConfig(IPAD_AIR_2013_CONFIG);
      console.log('Applied iPad Air 2013 optimizations');
    }
  }

  // Check if hardware integration is ready
  async isHardwareReady(): Promise<{
    ready: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    if (this.config.security.requireHTTPS && !window.isSecureContext) {
      issues.push('HTTPS required for hardware access');
    }
    
    const capabilities = detectHardwareCapabilities();
    
    if (this.config.bluetooth.enabled && !capabilities.bluetooth) {
      issues.push('Web Bluetooth API not supported');
    }
    
    if (this.config.camera.enabled && !capabilities.camera) {
      issues.push('Camera API not supported');
    }
    
    if (this.config.printing.enabled && !capabilities.print) {
      issues.push('Print API not supported');
    }

    return {
      ready: issues.length === 0,
      issues
    };
  }
}

// Create singleton instance
export const hardwareManager = new HardwareManager();