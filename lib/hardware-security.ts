// Security and permissions verification for hardware integration

export interface SecurityCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'unknown';
  message: string;
  details?: string;
  action?: string;
}

export interface PermissionStatus {
  camera: PermissionState | 'unsupported';
  bluetooth?: PermissionState | 'unsupported';
  notifications?: PermissionState | 'unsupported';
}

export class HardwareSecurity {
  // Check HTTPS requirement
  static checkHTTPS(): SecurityCheck {
    const isSecure = window.isSecureContext;
    const protocol = window.location.protocol;
    
    if (isSecure) {
      return {
        name: 'HTTPS Security',
        status: 'pass',
        message: 'Secure HTTPS context detected',
        details: `Protocol: ${protocol}. Hardware APIs will function correctly.`
      };
    } else {
      return {
        name: 'HTTPS Security',
        status: 'fail',
        message: 'Non-secure HTTP context detected',
        details: `Protocol: ${protocol}. Camera and Bluetooth APIs require HTTPS.`,
        action: 'Switch to HTTPS version of this site'
      };
    }
  }

  // Check browser permissions API support
  static async checkPermissionsAPI(): Promise<SecurityCheck> {
    if (!('permissions' in navigator)) {
      return {
        name: 'Permissions API',
        status: 'warning',
        message: 'Permissions API not supported',
        details: 'Cannot programmatically check permission status. User will be prompted when needed.',
        action: 'Continue with manual permission prompts'
      };
    }

    try {
      // Test if permissions API is working
      await navigator.permissions.query({ name: 'camera' as PermissionName });
      return {
        name: 'Permissions API',
        status: 'pass',
        message: 'Permissions API supported',
        details: 'Can check and manage hardware permissions programmatically.'
      };
    } catch (error) {
      return {
        name: 'Permissions API',
        status: 'warning',
        message: 'Permissions API partially supported',
        details: 'Some permission queries may fail. Will use fallback methods.',
        action: 'Use direct hardware access with error handling'
      };
    }
  }

  // Check camera permissions
  static async checkCameraPermissions(): Promise<SecurityCheck> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        name: 'Camera Permissions',
        status: 'fail',
        message: 'Camera API not supported',
        details: 'getUserMedia not available. Camera scanning will not work.',
        action: 'Use manual barcode entry only'
      };
    }

    if (!window.isSecureContext) {
      return {
        name: 'Camera Permissions',
        status: 'fail',
        message: 'Camera requires HTTPS',
        details: 'Camera access is blocked in non-secure contexts.',
        action: 'Switch to HTTPS to enable camera access'
      };
    }

    try {
      // Check permission status if API available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        
        switch (permission.state) {
          case 'granted':
            return {
              name: 'Camera Permissions',
              status: 'pass',
              message: 'Camera permission granted',
              details: 'Camera access is allowed. Barcode scanning will work.'
            };
          case 'denied':
            return {
              name: 'Camera Permissions',
              status: 'fail',
              message: 'Camera permission denied',
              details: 'User has explicitly denied camera access.',
              action: 'Go to browser settings and allow camera access for this site'
            };
          case 'prompt':
            return {
              name: 'Camera Permissions',
              status: 'warning',
              message: 'Camera permission not yet requested',
              details: 'User will be prompted when camera access is needed.',
              action: 'Grant camera permission when prompted'
            };
        }
      }

      // Fallback: try to access camera briefly to test
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240 } 
        });
        
        // Stop stream immediately
        stream.getTracks().forEach(track => track.stop());
        
        return {
          name: 'Camera Permissions',
          status: 'pass',
          message: 'Camera access confirmed',
          details: 'Camera permission is granted and working.'
        };
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          return {
            name: 'Camera Permissions',
            status: 'fail',
            message: 'Camera permission denied by user',
            details: 'User denied camera access when prompted.',
            action: 'Enable camera permissions in browser settings'
          };
        } else if (error.name === 'NotFoundError') {
          return {
            name: 'Camera Permissions',
            status: 'warning',
            message: 'No camera found',
            details: 'Device has no camera hardware.',
            action: 'Use manual barcode entry only'
          };
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      return {
        name: 'Camera Permissions',
        status: 'unknown',
        message: 'Cannot determine camera permission status',
        details: `Error checking camera: ${error.message}`,
        action: 'Try accessing camera when needed'
      };
    }
  }

  // Check Bluetooth permissions
  static async checkBluetoothPermissions(): Promise<SecurityCheck> {
    if (!('bluetooth' in navigator)) {
      return {
        name: 'Bluetooth Permissions',
        status: 'fail',
        message: 'Web Bluetooth API not supported',
        details: 'Browser does not support Bluetooth connectivity.',
        action: 'Use manual weight entry only'
      };
    }

    if (!window.isSecureContext) {
      return {
        name: 'Bluetooth Permissions',
        status: 'fail',
        message: 'Bluetooth requires HTTPS',
        details: 'Bluetooth access is blocked in non-secure contexts.',
        action: 'Switch to HTTPS to enable Bluetooth access'
      };
    }

    // Note: There's no standard Bluetooth permission in Permissions API yet
    // Bluetooth permission is requested when requestDevice() is called
    
    return {
      name: 'Bluetooth Permissions',
      status: 'warning',
      message: 'Bluetooth permission status unknown',
      details: 'Bluetooth permission will be requested when connecting to a scale.',
      action: 'Grant Bluetooth permission when prompted'
    };
  }

  // Check iPad Air 2013 specific security considerations
  static checkiPadAir2013Security(): SecurityCheck {
    const userAgent = navigator.userAgent;
    
    // Check if it's an iPad
    if (!/iPad/.test(userAgent)) {
      return {
        name: 'iPad Air 2013 Compatibility',
        status: 'warning',
        message: 'Not an iPad device',
        details: 'Cannot verify iPad Air 2013 specific security requirements.',
        action: 'Ensure HTTPS and updated browser for hardware access'
      };
    }

    // Check Safari version
    const versionMatch = userAgent.match(/Version\/([0-9]+)\.([0-9]+)/);
    if (versionMatch) {
      const majorVersion = parseInt(versionMatch[1]);
      const minorVersion = parseInt(versionMatch[2]);
      
      if (majorVersion < 12) {
        return {
          name: 'iPad Air 2013 Compatibility',
          status: 'fail',
          message: 'Safari version too old',
          details: `Safari ${majorVersion}.${minorVersion} detected. Minimum Safari 12 required.`,
          action: 'Update to iOS 12 or later for hardware support'
        };
      } else if (majorVersion >= 12) {
        return {
          name: 'iPad Air 2013 Compatibility',
          status: 'pass',
          message: 'Safari version compatible',
          details: `Safari ${majorVersion}.${minorVersion} supports required hardware APIs.`
        };
      }
    }

    // Check memory if available
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory && deviceMemory < 1) {
      return {
        name: 'iPad Air 2013 Compatibility',
        status: 'warning',
        message: 'Low device memory detected',
        details: `${deviceMemory}GB RAM may limit performance.`,
        action: 'Close other apps and tabs to free memory'
      };
    }

    return {
      name: 'iPad Air 2013 Compatibility',
      status: 'pass',
      message: 'iPad device with compatible security settings',
      details: 'Device appears compatible with hardware integration.'
    };
  }

  // Check Content Security Policy (CSP) compatibility
  static checkCSP(): SecurityCheck {
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (!meta) {
      return {
        name: 'Content Security Policy',
        status: 'pass',
        message: 'No CSP restrictions detected',
        details: 'Hardware APIs should work without CSP interference.'
      };
    }

    const csp = meta.getAttribute('content') || '';
    const issues: string[] = [];

    // Check for restrictive media-src
    if (csp.includes('media-src') && !csp.includes('media-src *') && !csp.includes('media-src \'self\'')) {
      issues.push('media-src may block camera access');
    }

    // Check for restrictive connect-src
    if (csp.includes('connect-src') && !csp.includes('connect-src *') && !csp.includes('connect-src \'self\'')) {
      issues.push('connect-src may block Bluetooth connections');
    }

    if (issues.length > 0) {
      return {
        name: 'Content Security Policy',
        status: 'warning',
        message: 'CSP may interfere with hardware access',
        details: issues.join(', '),
        action: 'Review CSP settings to allow hardware APIs'
      };
    }

    return {
      name: 'Content Security Policy',
      status: 'pass',
      message: 'CSP allows hardware access',
      details: 'Content Security Policy does not block required APIs.'
    };
  }

  // Get current permission states
  static async getPermissionStates(): Promise<PermissionStatus> {
    const permissions: PermissionStatus = {
      camera: 'unsupported',
      bluetooth: 'unsupported',
      notifications: 'unsupported'
    };

    if ('permissions' in navigator) {
      try {
        // Camera permission
        const cameraPermission = await navigator.permissions.query({ 
          name: 'camera' as PermissionName 
        });
        permissions.camera = cameraPermission.state;
      } catch (error) {
        permissions.camera = 'unsupported';
      }

      try {
        // Notifications permission (useful for error alerts)
        const notificationPermission = await navigator.permissions.query({ 
          name: 'notifications' as PermissionName 
        });
        permissions.notifications = notificationPermission.state;
      } catch (error) {
        permissions.notifications = 'unsupported';
      }
    }

    return permissions;
  }

  // Request specific permission
  static async requestCameraPermission(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera API not supported');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Stop stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        return false;
      }
      throw error;
    }
  }

  // Comprehensive security check
  static async runSecurityAudit(): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];

    // Run all security checks
    checks.push(this.checkHTTPS());
    checks.push(await this.checkPermissionsAPI());
    checks.push(await this.checkCameraPermissions());
    checks.push(await this.checkBluetoothPermissions());
    checks.push(this.checkiPadAir2013Security());
    checks.push(this.checkCSP());

    return checks;
  }

  // Get security recommendations
  static getSecurityRecommendations(checks: SecurityCheck[]): string[] {
    const recommendations: string[] = [];

    const failedChecks = checks.filter(check => check.status === 'fail');
    const warningChecks = checks.filter(check => check.status === 'warning');

    if (failedChecks.length > 0) {
      recommendations.push('🚨 Critical issues found that prevent hardware integration:');
      failedChecks.forEach(check => {
        if (check.action) {
          recommendations.push(`• ${check.action}`);
        }
      });
    }

    if (warningChecks.length > 0) {
      recommendations.push('⚠️  Potential issues that may affect performance:');
      warningChecks.forEach(check => {
        if (check.action) {
          recommendations.push(`• ${check.action}`);
        }
      });
    }

    // General recommendations
    recommendations.push('✅ General recommendations:');
    recommendations.push('• Ensure your device is connected to a reliable network');
    recommendations.push('• Close unnecessary browser tabs to free memory');
    recommendations.push('• Grant permissions promptly when requested');
    recommendations.push('• Use manual entry as backup when hardware fails');

    return recommendations;
  }
}

export default HardwareSecurity;