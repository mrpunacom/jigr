'use client';

import { useState, useEffect } from 'react';
import { 
  Bluetooth, 
  Camera, 
  Printer, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Wifi,
  Smartphone,
  Monitor
} from 'lucide-react';

interface DiagnosticTest {
  id: string;
  name: string;
  category: 'bluetooth' | 'camera' | 'printer' | 'browser' | 'device';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  message: string;
  details?: string;
}

interface HardwareCapabilities {
  webBluetooth: boolean;
  getUserMedia: boolean;
  printDialog: boolean;
  touchEvents: boolean;
  deviceMemory: number | null;
  isSecureContext: boolean;
  userAgent: string;
  screenResolution: string;
  devicePixelRatio: number;
}

export default function HardwareDiagnostics() {
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [capabilities, setCapabilities] = useState<HardwareCapabilities | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Initialize diagnostic tests
  useEffect(() => {
    const initialTests: DiagnosticTest[] = [
      {
        id: 'https-check',
        name: 'HTTPS Security',
        category: 'browser',
        status: 'pending',
        message: 'Checking secure context...'
      },
      {
        id: 'web-bluetooth-api',
        name: 'Web Bluetooth API',
        category: 'bluetooth',
        status: 'pending',
        message: 'Checking Bluetooth API availability...'
      },
      {
        id: 'camera-api',
        name: 'Camera API (getUserMedia)',
        category: 'camera',
        status: 'pending',
        message: 'Checking camera access capabilities...'
      },
      {
        id: 'camera-permissions',
        name: 'Camera Permissions',
        category: 'camera',
        status: 'pending',
        message: 'Testing camera permission access...'
      },
      {
        id: 'print-dialog',
        name: 'Browser Print Dialog',
        category: 'printer',
        status: 'pending',
        message: 'Testing print dialog support...'
      },
      {
        id: 'touch-events',
        name: 'Touch Events',
        category: 'device',
        status: 'pending',
        message: 'Checking touch event support...'
      },
      {
        id: 'device-memory',
        name: 'Device Memory',
        category: 'device',
        status: 'pending',
        message: 'Checking available device memory...'
      },
      {
        id: 'safari-compatibility',
        name: 'Safari 12+ Compatibility',
        category: 'browser',
        status: 'pending',
        message: 'Checking iPad Air 2013 compatibility...'
      }
    ];

    setTests(initialTests);
    detectCapabilities();
  }, []);

  // Detect device and browser capabilities
  const detectCapabilities = () => {
    const caps: HardwareCapabilities = {
      webBluetooth: 'bluetooth' in navigator,
      getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      printDialog: typeof window.print === 'function',
      touchEvents: 'ontouchstart' in window,
      deviceMemory: (navigator as any).deviceMemory || null,
      isSecureContext: window.isSecureContext,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      devicePixelRatio: window.devicePixelRatio
    };

    setCapabilities(caps);
  };

  // Run all diagnostic tests
  const runDiagnostics = async () => {
    setIsRunningTests(true);
    
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      
      // Update test status to running
      setTests(prev => prev.map(t => 
        t.id === test.id 
          ? { ...t, status: 'running', message: `Running ${test.name}...` }
          : t
      ));

      // Wait a bit for UI update
      await new Promise(resolve => setTimeout(resolve, 200));

      // Run the specific test
      const result = await runSingleTest(test);
      
      // Update test with result
      setTests(prev => prev.map(t => 
        t.id === test.id ? result : t
      ));

      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setIsRunningTests(false);
  };

  // Run individual test
  const runSingleTest = async (test: DiagnosticTest): Promise<DiagnosticTest> => {
    try {
      switch (test.id) {
        case 'https-check':
          if (window.isSecureContext) {
            return {
              ...test,
              status: 'passed',
              message: 'HTTPS secured context detected',
              details: 'Camera and Bluetooth APIs will work correctly'
            };
          } else {
            return {
              ...test,
              status: 'failed',
              message: 'Non-HTTPS context detected',
              details: 'Camera and Bluetooth APIs require HTTPS to function'
            };
          }

        case 'web-bluetooth-api':
          if ('bluetooth' in navigator) {
            return {
              ...test,
              status: 'passed',
              message: 'Web Bluetooth API available',
              details: 'Bluetooth scale integration will work'
            };
          } else {
            return {
              ...test,
              status: 'failed',
              message: 'Web Bluetooth API not available',
              details: 'Bluetooth scale integration will not work - use manual entry fallback'
            };
          }

        case 'camera-api':
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            return {
              ...test,
              status: 'passed',
              message: 'Camera API available',
              details: 'Barcode scanning will work'
            };
          } else {
            return {
              ...test,
              status: 'failed',
              message: 'Camera API not available',
              details: 'Barcode scanning will not work - use manual entry fallback'
            };
          }

        case 'camera-permissions':
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { 
                facingMode: 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
              } 
            });
            
            // Stop the stream immediately
            stream.getTracks().forEach(track => track.stop());
            
            return {
              ...test,
              status: 'passed',
              message: 'Camera permission granted',
              details: 'Camera access is working correctly'
            };
          } catch (err: any) {
            if (err.name === 'NotAllowedError') {
              return {
                ...test,
                status: 'failed',
                message: 'Camera permission denied',
                details: 'User must grant camera permission for barcode scanning'
              };
            } else if (err.name === 'NotFoundError') {
              return {
                ...test,
                status: 'warning',
                message: 'No camera found',
                details: 'Device has no camera - manual barcode entry will be used'
              };
            } else {
              return {
                ...test,
                status: 'warning',
                message: 'Camera test skipped',
                details: `Camera access test failed: ${err.message}`
              };
            }
          }

        case 'print-dialog':
          if (typeof window.print === 'function') {
            return {
              ...test,
              status: 'passed',
              message: 'Print dialog available',
              details: 'Label printing will work through browser print dialog'
            };
          } else {
            return {
              ...test,
              status: 'failed',
              message: 'Print dialog not available',
              details: 'Label printing may not work - download labels instead'
            };
          }

        case 'touch-events':
          if ('ontouchstart' in window) {
            return {
              ...test,
              status: 'passed',
              message: 'Touch events supported',
              details: 'Touch-optimized interface will work correctly'
            };
          } else {
            return {
              ...test,
              status: 'warning',
              message: 'Touch events not detected',
              details: 'Device may be using mouse input instead of touch'
            };
          }

        case 'device-memory':
          const memory = (navigator as any).deviceMemory;
          if (memory && memory >= 2) {
            return {
              ...test,
              status: 'passed',
              message: `${memory}GB RAM detected`,
              details: 'Sufficient memory for hardware integration'
            };
          } else if (memory) {
            return {
              ...test,
              status: 'warning',
              message: `${memory}GB RAM detected`,
              details: 'Low memory device - performance may be limited'
            };
          } else {
            return {
              ...test,
              status: 'warning',
              message: 'Memory information unavailable',
              details: 'Cannot determine device memory capacity'
            };
          }

        case 'safari-compatibility':
          const ua = navigator.userAgent;
          const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
          const isOldSafari = /Version\/([0-9]+)/.test(ua);
          
          if (isSafari) {
            const versionMatch = ua.match(/Version\/([0-9]+)/);
            const version = versionMatch ? parseInt(versionMatch[1]) : 0;
            
            if (version >= 12) {
              return {
                ...test,
                status: 'passed',
                message: `Safari ${version} detected`,
                details: 'Compatible with iPad Air 2013 requirements'
              };
            } else {
              return {
                ...test,
                status: 'warning',
                message: `Safari ${version} detected`,
                details: 'May have limited hardware API support'
              };
            }
          } else if (/iPad/.test(ua)) {
            return {
              ...test,
              status: 'passed',
              message: 'iPad device detected',
              details: 'Hardware integration should work correctly'
            };
          } else {
            return {
              ...test,
              status: 'warning',
              message: 'Non-Safari browser detected',
              details: 'Full compatibility with iPad Air 2013 not guaranteed'
            };
          }

        default:
          return {
            ...test,
            status: 'failed',
            message: 'Unknown test',
            details: 'Test implementation not found'
          };
      }
    } catch (error: any) {
      return {
        ...test,
        status: 'failed',
        message: 'Test failed with error',
        details: error.message
      };
    }
  };

  const getStatusIcon = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'running':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getCategoryIcon = (category: DiagnosticTest['category']) => {
    switch (category) {
      case 'bluetooth':
        return <Bluetooth className="w-4 h-4" />;
      case 'camera':
        return <Camera className="w-4 h-4" />;
      case 'printer':
        return <Printer className="w-4 h-4" />;
      case 'device':
        return <Smartphone className="w-4 h-4" />;
      case 'browser':
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getStatusSummary = () => {
    const passed = tests.filter(t => t.status === 'passed').length;
    const failed = tests.filter(t => t.status === 'failed').length;
    const warnings = tests.filter(t => t.status === 'warning').length;
    const total = tests.length;

    return { passed, failed, warnings, total };
  };

  const summary = getStatusSummary();

  return (
    <div className="bg-white rounded-lg border p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Hardware Integration Diagnostics</h2>
        <button
          onClick={runDiagnostics}
          disabled={isRunningTests}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minHeight: '48px' }} // iPad touch target
        >
          {isRunningTests ? 'Running Tests...' : 'Run Diagnostics'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
          <div className="text-sm text-green-700">Passed</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
          <div className="text-sm text-red-700">Failed</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
          <div className="text-sm text-yellow-700">Warnings</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
          <div className="text-sm text-blue-700">Total Tests</div>
        </div>
      </div>

      {/* Device Capabilities */}
      {capabilities && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-bold mb-3">Device Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Screen:</strong> {capabilities.screenResolution} 
              ({capabilities.devicePixelRatio}x DPR)
            </div>
            <div>
              <strong>Memory:</strong> {capabilities.deviceMemory ? 
                `${capabilities.deviceMemory}GB` : 'Unknown'}
            </div>
            <div>
              <strong>Secure Context:</strong> {capabilities.isSecureContext ? 
                '✓ HTTPS' : '✗ HTTP'}
            </div>
            <div>
              <strong>Touch Events:</strong> {capabilities.touchEvents ? 
                '✓ Supported' : '✗ Not detected'}
            </div>
            <div className="md:col-span-2">
              <strong>User Agent:</strong> 
              <div className="mt-1 text-xs text-gray-600 font-mono">
                {capabilities.userAgent}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="space-y-3">
        <h3 className="font-bold">Diagnostic Results</h3>
        {tests.map(test => (
          <div 
            key={test.id} 
            className="border rounded-lg p-4 flex items-start gap-3"
          >
            <div className="flex items-center gap-2 flex-shrink-0">
              {getCategoryIcon(test.category)}
              {getStatusIcon(test.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium">{test.name}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  test.status === 'passed' ? 'bg-green-100 text-green-700' :
                  test.status === 'failed' ? 'bg-red-100 text-red-700' :
                  test.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {test.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-1">{test.message}</p>
              
              {test.details && (
                <p className="text-xs text-gray-500">{test.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {summary.failed > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-bold text-red-800 mb-2">Action Required</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {tests.filter(t => t.status === 'failed').map(test => (
              <li key={test.id}>• {test.details}</li>
            ))}
          </ul>
        </div>
      )}
      
      {summary.warnings > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-800 mb-2">Recommendations</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            {tests.filter(t => t.status === 'warning').map(test => (
              <li key={test.id}>• {test.details}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}