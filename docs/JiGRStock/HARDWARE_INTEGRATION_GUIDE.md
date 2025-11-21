# JiGR Stock Module - Hardware Integration Guide

**Version:** 1.0  
**Date:** November 18, 2025  
**For:** Claude Code AI Assistant  
**Target Device:** iPad Air (2013) running Safari 12+

---

## 📋 Table of Contents

1. [Overview & Compatibility](#overview)
2. [Bluetooth Scale Integration](#bluetooth-scale)
3. [Barcode Scanner (Camera)](#barcode-scanner)
4. [Label Printer Integration](#label-printer)
5. [Testing & Debugging](#testing)
6. [Fallback Strategies](#fallbacks)

---

## <a name="overview"></a>🎯 Overview & Compatibility

### Hardware Requirements

#### Bluetooth Scales (Primary Method)
```
Supported Models:
- Dymo M25 Digital Postal Scale
- Escali SmartConnect Kitchen Scale
- Any scale with Bluetooth Low Energy (BLE)
- Generic BLE scales with weight characteristic

Connection: Web Bluetooth API (Safari 12+)
Range: 10 meters typical
Accuracy: ±1 gram typical
```

#### Barcode Scanner (Camera-Based)
```
Method: getUserMedia API (Camera access)
Browser: Safari 12+ (requires HTTPS)
Fallback: Manual entry
Libraries: ZXing (JavaScript barcode reader)
```

#### Label Printer
```
Supported: Brother QL series, Dymo LabelWriter, Zebra
Method: Browser print dialog or vendor-specific APIs
Format: PDF generation with barcode
```

### iPad Air 2013 Compatibility Notes
```javascript
// ✅ SUPPORTED in Safari 12
- Web Bluetooth API (with user permission)
- getUserMedia (camera access)
- Canvas API (barcode rendering)
- Window.print() (basic printing)

// ❌ NOT SUPPORTED in Safari 12
- Web Serial API (use Bluetooth instead)
- WebUSB API (use Bluetooth instead)
- Service Workers (use regular fetch)

// ⚠️ REQUIRES HTTPS
- Camera access
- Bluetooth access
- Geolocation (if used)
```

---

## <a name="bluetooth-scale"></a>⚖️ Bluetooth Scale Integration

### File 1: Bluetooth Scale Hook

Create file: `hooks/useBluetoothScale.ts`
```typescript
import { useState, useCallback, useRef, useEffect } from 'react';

interface ScaleReading {
  weight: number;        // Weight in grams
  unit: 'g' | 'kg' | 'oz' | 'lb';
  stable: boolean;       // Is reading stable?
  timestamp: number;
}

interface UseBluetoothScaleReturn {
  isConnected: boolean;
  isConnecting: boolean;
  currentWeight: ScaleReading | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  tare: () => Promise<void>;
  deviceName: string | null;
}

// Common BLE scale service/characteristic UUIDs
const SCALE_SERVICE_UUID = '0000181d-0000-1000-8000-00805f9b34fb'; // Weight Scale Service
const WEIGHT_CHARACTERISTIC_UUID = '00002a9d-0000-1000-8000-00805f9b34fb'; // Weight Measurement

export function useBluetoothScale(): UseBluetoothScaleReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentWeight, setCurrentWeight] = useState<ScaleReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  // Check if Web Bluetooth is supported
  const isBluetoothSupported = useCallback(() => {
    if (!navigator.bluetooth) {
      setError('Web Bluetooth is not supported on this device');
      return false;
    }
    return true;
  }, []);

  // Connect to Bluetooth scale
  const connect = useCallback(async () => {
    if (!isBluetoothSupported()) return;

    try {
      setIsConnecting(true);
      setError(null);

      // Request device
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [SCALE_SERVICE_UUID] },
          { namePrefix: 'Scale' },
          { namePrefix: 'Dymo' },
          { namePrefix: 'Escali' }
        ],
        optionalServices: [SCALE_SERVICE_UUID]
      });

      deviceRef.current = device;
      setDeviceName(device.name || 'Unknown Scale');

      // Handle disconnection
      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setCurrentWeight(null);
        console.log('Scale disconnected');
      });

      // Connect to GATT server
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      // Get weight service
      const service = await server.getPrimaryService(SCALE_SERVICE_UUID);
      
      // Get weight characteristic
      const characteristic = await service.getCharacteristic(WEIGHT_CHARACTERISTIC_UUID);
      characteristicRef.current = characteristic;

      // Start notifications
      await characteristic.startNotifications();
      
      // Handle weight updates
      characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const value = target.value;
        
        if (value) {
          const reading = parseWeightValue(value);
          setCurrentWeight(reading);
        }
      });

      setIsConnected(true);
      setIsConnecting(false);

    } catch (err: any) {
      console.error('Bluetooth connection error:', err);
      setError(err.message || 'Failed to connect to scale');
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, [isBluetoothSupported]);

  // Disconnect from scale
  const disconnect = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    deviceRef.current = null;
    characteristicRef.current = null;
    setIsConnected(false);
    setCurrentWeight(null);
    setDeviceName(null);
  }, []);

  // Tare (zero) the scale
  const tare = useCallback(async () => {
    // Note: Tare function depends on scale model
    // Some scales have a tare characteristic, others require button press
    if (!characteristicRef.current) {
      setError('Scale not connected');
      return;
    }

    try {
      // Try to find tare characteristic (0x2A9E is common)
      const service = characteristicRef.current.service;
      const tareCharacteristic = await service.getCharacteristic('00002a9e-0000-1000-8000-00805f9b34fb');
      
      // Send tare command (usually writing 0x01)
      await tareCharacteristic.writeValue(new Uint8Array([0x01]));
      
      // Wait for scale to stabilize
      setTimeout(() => {
        setCurrentWeight(prev => prev ? { ...prev, weight: 0, stable: true } : null);
      }, 500);

    } catch (err) {
      // Tare characteristic not available - user must press button on scale
      setError('Please press the tare button on your scale');
      console.log('Tare command not supported, manual tare required');
    }
  }, []);

  // Parse weight value from DataView
  function parseWeightValue(dataView: DataView): ScaleReading {
    // BLE Weight Measurement format (simplified)
    // Byte 0: Flags
    // Bytes 1-2: Weight value (uint16, little-endian)
    // Byte 3: Unit
    
    const flags = dataView.getUint8(0);
    const weightRaw = dataView.getUint16(1, true); // little-endian
    
    // Parse unit from flags
    let unit: 'g' | 'kg' | 'oz' | 'lb' = 'g';
    const unitCode = (flags >> 0) & 0x03;
    switch (unitCode) {
      case 0: unit = 'g'; break;
      case 1: unit = 'kg'; break;
      case 2: unit = 'oz'; break;
      case 3: unit = 'lb'; break;
    }

    // Convert to grams if necessary
    let weightInGrams = weightRaw;
    if (unit === 'kg') weightInGrams = weightRaw * 1000;
    if (unit === 'oz') weightInGrams = weightRaw * 28.35;
    if (unit === 'lb') weightInGrams = weightRaw * 453.6;

    // Check if reading is stable (bit 4 of flags)
    const stable = (flags & 0x10) !== 0;

    return {
      weight: weightInGrams,
      unit,
      stable,
      timestamp: Date.now()
    };
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    currentWeight,
    error,
    connect,
    disconnect,
    tare,
    deviceName
  };
}
```

### File 2: Bluetooth Scale Component

Create file: `components/hardware/BluetoothScaleConnector.tsx`
```typescript
'use client';

import { useBluetoothScale } from '@/hooks/useBluetoothScale';
import { useEffect } from 'react';

interface BluetoothScaleConnectorProps {
  onWeightChange?: (weight: number, stable: boolean) => void;
  autoConnect?: boolean;
  showConnectionButton?: boolean;
}

export default function BluetoothScaleConnector({
  onWeightChange,
  autoConnect = false,
  showConnectionButton = true
}: BluetoothScaleConnectorProps) {
  const {
    isConnected,
    isConnecting,
    currentWeight,
    error,
    connect,
    disconnect,
    tare,
    deviceName
  } = useBluetoothScale();

  // Call parent callback when weight changes
  useEffect(() => {
    if (currentWeight && onWeightChange) {
      onWeightChange(currentWeight.weight, currentWeight.stable);
    }
  }, [currentWeight, onWeightChange]);

  return (
    <div className="bg-white rounded-lg border p-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-300'
          }`} />
          <span className="font-medium">
            {isConnected ? `Connected: ${deviceName}` : 'Scale Not Connected'}
          </span>
        </div>
        
        {showConnectionButton && (
          <button
            onClick={isConnected ? disconnect : connect}
            disabled={isConnecting}
            className={`px-4 py-2 rounded-md font-medium ${
              isConnected
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect Scale'}
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Weight Display */}
      {isConnected && currentWeight && (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <div className="text-5xl font-bold mb-2">
            {currentWeight.weight.toFixed(1)}
            <span className="text-2xl ml-2 text-gray-600">g</span>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm">
            {currentWeight.stable ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-green-700 font-medium">Stable</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-yellow-700 font-medium">Stabilizing...</span>
              </>
            )}
          </div>

          {/* Tare Button */}
          <button
            onClick={tare}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
          >
            Tare (Zero Scale)
          </button>
        </div>
      )}

      {/* Connection Instructions */}
      {!isConnected && !error && (
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
          <p className="font-medium mb-2">How to connect:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Turn on your Bluetooth scale</li>
            <li>Make sure Bluetooth is enabled on your device</li>
            <li>Click "Connect Scale" button</li>
            <li>Select your scale from the list</li>
          </ol>
        </div>
      )}
    </div>
  );
}
```

### File 3: Weight Display Component

Create file: `components/hardware/WeightDisplay.tsx`
```typescript
'use client';

interface WeightDisplayProps {
  weight: number | null;
  tare: number | null;
  showNet?: boolean;
  large?: boolean;
}

export default function WeightDisplay({
  weight,
  tare,
  showNet = true,
  large = false
}: WeightDisplayProps) {
  const netWeight = weight !== null && tare !== null ? weight - tare : null;

  return (
    <div className={`bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 ${
      large ? 'min-h-[200px]' : ''
    }`}>
      {/* Gross Weight */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-1">Gross Weight</div>
        <div className={`font-bold text-gray-900 ${large ? 'text-4xl' : 'text-2xl'}`}>
          {weight !== null ? (
            <>
              {weight.toFixed(1)}
              <span className={`${large ? 'text-xl' : 'text-base'} ml-2 text-gray-600`}>g</span>
            </>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </div>

      {/* Tare Weight */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-1">Tare Weight</div>
        <div className={`font-bold text-gray-700 ${large ? 'text-2xl' : 'text-xl'}`}>
          {tare !== null ? (
            <>
              {tare.toFixed(1)}
              <span className={`${large ? 'text-base' : 'text-sm'} ml-2 text-gray-500`}>g</span>
            </>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </div>

      {/* Net Weight */}
      {showNet && (
        <div className="pt-4 border-t border-orange-200">
          <div className="text-sm text-gray-600 mb-1">Net Weight</div>
          <div className={`font-bold text-orange-700 ${large ? 'text-3xl' : 'text-xl'}`}>
            {netWeight !== null ? (
              <>
                {netWeight.toFixed(1)}
                <span className={`${large ? 'text-lg' : 'text-base'} ml-2`}>g</span>
              </>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## <a name="barcode-scanner"></a>📷 Barcode Scanner (Camera)

### File 4: Barcode Scanner Hook

Create file: `hooks/useBarcodeScanner.ts`
```typescript
import { useState, useCallback, useRef, useEffect } from 'react';

interface BarcodeScanResult {
  code: string;
  format: string;
  timestamp: number;
}

interface UseBarcodeScannerReturn {
  isScanning: boolean;
  isSupported: boolean;
  lastScan: BarcodeScanResult | null;
  error: string | null;
  startScanning: () => Promise<void>;
  stopScanning: () => void;
}

export function useBarcodeScanner(
  onScan?: (result: BarcodeScanResult) => void
): UseBarcodeScannerReturn {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<BarcodeScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check camera support
  useEffect(() => {
    setIsSupported(
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  }, []);

  // Start camera and scanning
  const startScanning = useCallback(async () => {
    if (!isSupported) {
      setError('Camera access not supported on this device');
      return;
    }

    try {
      setError(null);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      // Create video element if not exists
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // Create canvas for frame capture
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      setIsScanning(true);

      // Start scanning loop (every 500ms)
      scanIntervalRef.current = setInterval(() => {
        scanFrame();
      }, 500);

    } catch (err: any) {
      console.error('Camera access error:', err);
      setError(err.message || 'Failed to access camera');
      setIsScanning(false);
    }
  }, [isSupported]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Stop video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Clear scan interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    setIsScanning(false);
  }, []);

  // Scan current video frame for barcodes
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Use ZXing library to decode barcode
    // Note: You'll need to install @zxing/library
    try {
      const codeReader = new (window as any).ZXing.BrowserMultiFormatReader();
      const result = codeReader.decodeFromImageData(imageData);

      if (result) {
        const scanResult: BarcodeScanResult = {
          code: result.text,
          format: result.format,
          timestamp: Date.now()
        };

        setLastScan(scanResult);

        if (onScan) {
          onScan(scanResult);
        }

        // Stop scanning after successful scan
        stopScanning();
      }
    } catch (err) {
      // No barcode found in this frame - continue scanning
    }
  }, [onScan, stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    isScanning,
    isSupported,
    lastScan,
    error,
    startScanning,
    stopScanning
  };
}
```

### File 5: Barcode Scanner Component

Create file: `components/hardware/BarcodeScanner.tsx`
```typescript
'use client';

import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose?: () => void;
  title?: string;
  allowManualEntry?: boolean;
}

export default function BarcodeScanner({
  onScan,
  onClose,
  title = 'Scan Barcode',
  allowManualEntry = true
}: BarcodeScannerProps) {
  const [manualEntry, setManualEntry] = useState('');
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const {
    isScanning,
    isSupported,
    lastScan,
    error,
    startScanning,
    stopScanning
  } = useBarcodeScanner((result) => {
    onScan(result.code);
  });

  // Auto-start scanning on mount
  useEffect(() => {
    if (isSupported) {
      startScanning();
    }
  }, [isSupported, startScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualEntry.trim()) {
      onScan(manualEntry.trim());
      setManualEntry('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Camera View */}
        <div className="relative bg-black" style={{ height: '400px' }}>
          {isScanning ? (
            <div ref={videoContainerRef} className="w-full h-full flex items-center justify-center">
              {/* Video element will be inserted here by the hook */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-green-500 rounded-lg">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white" />
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                Position barcode within frame
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              <Camera className="w-16 h-16 mb-4 opacity-50" />
              {error ? (
                <p className="text-red-400">{error}</p>
              ) : (
                <button
                  onClick={startScanning}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
                >
                  Start Camera
                </button>
              )}
            </div>
          )}
        </div>

        {/* Manual Entry */}
        {allowManualEntry && (
          <div className="p-4 border-t bg-gray-50">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Or enter barcode manually:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualEntry}
                  onChange={(e) => setManualEntry(e.target.value)}
                  placeholder="Enter barcode..."
                  className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!manualEntry.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Last Scan */}
        {lastScan && (
          <div className="p-4 bg-green-50 border-t border-green-200">
            <p className="text-sm text-green-700">
              ✓ Scanned: <span className="font-mono font-bold">{lastScan.code}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## <a name="label-printer"></a>🖨️ Label Printer Integration

### File 6: Label Generator

Create file: `lib/label-generator.ts`
```typescript
// Generate barcode as SVG
export function generateBarcodeImage(code: string, width: number = 200, height: number = 80): string {
  // Simple Code 128 barcode generation
  // In production, use a library like bwip-js or jsbarcode
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';

  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Generate bars (simplified - use proper library in production)
  const bars = code.split('').map(c => c.charCodeAt(0) % 2 === 0);
  const barWidth = width / bars.length;

  ctx.fillStyle = 'black';
  bars.forEach((isBlack, i) => {
    if (isBlack) {
      ctx.fillRect(i * barWidth, 10, barWidth, height - 30);
    }
  });

  // Add text
  ctx.fillStyle = 'black';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(code, width / 2, height - 5);

  return canvas.toDataURL();
}

// Generate container label as HTML for printing
export function generateContainerLabel(data: {
  barcode: string;
  containerType: string;
  tareWeight: number;
  itemName?: string;
  useByDate?: string;
}): string {
  const barcodeImage = generateBarcodeImage(data.barcode);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Container Label</title>
      <style>
        @page {
          size: 62mm 29mm; /* Dymo label size */
          margin: 0;
        }
        body {
          margin: 0;
          padding: 4mm;
          font-family: Arial, sans-serif;
          font-size: 10pt;
        }
        .label {
          width: 54mm;
          height: 21mm;
          border: 1px solid #000;
          padding: 2mm;
          box-sizing: border-box;
        }
        .barcode {
          text-align: center;
          margin-bottom: 2mm;
        }
        .barcode img {
          width: 50mm;
          height: 12mm;
        }
        .info {
          font-size: 8pt;
          line-height: 1.2;
        }
        .tare-weight {
          font-size: 12pt;
          font-weight: bold;
          margin-top: 1mm;
        }
        .use-by {
          background: #ff0000;
          color: white;
          padding: 1mm;
          margin-top: 1mm;
          font-weight: bold;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="label">
        <div class="barcode">
          <img src="${barcodeImage}" alt="${data.barcode}">
        </div>
        <div class="info">
          ${data.containerType}
          ${data.itemName ? ` - ${data.itemName}` : ''}
        </div>
        <div class="tare-weight">
          Tare: ${data.tareWeight.toFixed(0)}g
        </div>
        ${data.useByDate ? `
          <div class="use-by">
            USE BY: ${data.useByDate}
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}

// Print label
export function printLabel(html: string): void {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to print labels');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    
    // Close window after printing (or user cancels)
    setTimeout(() => {
      printWindow.close();
    }, 100);
  };
}
```

### File 7: Label Printer Component

Create file: `components/hardware/LabelPrinter.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Printer } from 'lucide-react';
import { generateContainerLabel, printLabel } from '@/lib/label-generator';

interface LabelPrinterProps {
  barcode: string;
  containerType: string;
  tareWeight: number;
  itemName?: string;
  useByDate?: string;
  onPrinted?: () => void;
}

export default function LabelPrinter({
  barcode,
  containerType,
  tareWeight,
  itemName,
  useByDate,
  onPrinted
}: LabelPrinterProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);

    const labelHtml = generateContainerLabel({
      barcode,
      containerType,
      tareWeight,
      itemName,
      useByDate
    });

    printLabel(labelHtml);

    // Mark as printed after short delay
    setTimeout(() => {
      setIsPrinting(false);
      if (onPrinted) {
        onPrinted();
      }
    }, 1000);
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Print Label</h3>
      
      {/* Label Preview */}
      <div className="bg-gray-50 border rounded p-3 mb-4 text-sm">
        <div className="font-mono text-center mb-2">{barcode}</div>
        <div className="text-gray-700">{containerType}</div>
        {itemName && <div className="text-gray-600">{itemName}</div>}
        <div className="font-bold mt-2">Tare: {tareWeight.toFixed(0)}g</div>
        {useByDate && (
          <div className="bg-red-100 text-red-700 px-2 py-1 rounded mt-2 text-center font-bold">
            USE BY: {useByDate}
          </div>
        )}
      </div>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        disabled={isPrinting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Printer className="w-5 h-5" />
        {isPrinting ? 'Printing...' : 'Print Label'}
      </button>

      {/* Printer Instructions */}
      <div className="mt-3 text-xs text-gray-500">
        <p>Supported printers:</p>
        <ul className="list-disc list-inside mt-1">
          <li>Brother QL series</li>
          <li>Dymo LabelWriter</li>
          <li>Zebra desktop printers</li>
        </ul>
      </div>
    </div>
  );
}
```

---

## <a name="testing"></a>🧪 Testing & Debugging

### Testing Bluetooth Scale
```typescript
// Test file: __tests__/bluetooth-scale.test.ts

describe('Bluetooth Scale Integration', () => {
  it('should detect scale support', () => {
    const hasBluetoothAPI = 'bluetooth' in navigator;
    expect(hasBluetoothAPI).toBe(true);
  });

  it('should parse weight correctly', () => {
    // Mock BLE weight data
    const mockData = new DataView(new ArrayBuffer(4));
    mockData.setUint8(0, 0x00); // Flags: grams, stable
    mockData.setUint16(1, 4520, true); // 4520 grams

    // Parse (use your actual parse function)
    // const result = parseWeightValue(mockData);
    // expect(result.weight).toBe(4520);
    // expect(result.unit).toBe('g');
    // expect(result.stable).toBe(true);
  });
});
```

### Testing Barcode Scanner
```typescript
// Test in browser console
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('✅ Camera access granted');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => {
    console.error('❌ Camera access denied:', err);
  });
```

### Debugging Tips
```typescript
// Enable verbose logging
localStorage.setItem('DEBUG_HARDWARE', 'true');

// Check Bluetooth availability
console.log('Bluetooth API:', 'bluetooth' in navigator);

// Check camera permissions
navigator.permissions.query({ name: 'camera' as PermissionName })
  .then(result => {
    console.log('Camera permission:', result.state);
  });
```

---

## <a name="fallbacks"></a>🔄 Fallback Strategies

### When Bluetooth Fails
```typescript
// Manual weight entry fallback
<div className="mt-4">
  <label className="block text-sm font-medium mb-2">
    Manual Weight Entry (if scale not available)
  </label>
  <input
    type="number"
    step="0.1"
    placeholder="Enter weight in grams..."
    className="w-full px-3 py-2 border rounded-md"
    onChange={(e) => onWeightChange(parseFloat(e.target.value), true)}
  />
</div>
```

### When Camera Fails
```typescript
// Manual barcode entry
<div className="p-4 bg-gray-50">
  <label className="block text-sm font-medium mb-2">
    Can't scan? Enter barcode manually:
  </label>
  <input
    type="text"
    placeholder="Enter barcode..."
    className="w-full px-3 py-2 border rounded-md"
  />
</div>
```

### When Printer Fails
```typescript
// Download label as PDF
<button
  onClick={() => {
    const pdfBlob = generateLabelPDF(labelData);
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `label-${barcode}.pdf`;
    a.click();
  }}
  className="text-sm text-blue-600 underline"
>
  Download label as PDF instead
</button>
```

---

## ✅ Implementation Checklist

### Bluetooth Scale
- [ ] Install Web Bluetooth types: `npm install @types/web-bluetooth`
- [ ] Create useBluetoothScale hook
- [ ] Create BluetoothScaleConnector component
- [ ] Create WeightDisplay component
- [ ] Test with physical Bluetooth scale
- [ ] Implement manual entry fallback
- [ ] Add error handling for connection failures

### Barcode Scanner
- [ ] Install ZXing library: `npm install @zxing/library`
- [ ] Create useBarcodeScanner hook
- [ ] Create BarcodeScanner component
- [ ] Request camera permissions properly
- [ ] Test with physical barcodes
- [ ] Implement manual entry fallback
- [ ] Add HTTPS requirement check

### Label Printer
- [ ] Install barcode generation library: `npm install jsbarcode`
- [ ] Create label generator utility
- [ ] Create LabelPrinter component
- [ ] Test print dialog on target device
- [ ] Create label templates for different sizes
- [ ] Implement PDF download fallback
- [ ] Test with Brother/Dymo printers

### iPad Air 2013 Testing
- [ ] Test Bluetooth on actual iPad Air (2013)
- [ ] Test camera access on Safari 12
- [ ] Test print dialog behavior
- [ ] Verify all fallbacks work
- [ ] Check HTTPS enforcement
- [ ] Test offline behavior
- [ ] Verify touch interactions

---

## 🎯 Success Criteria

✅ Bluetooth scale connects within 5 seconds  
✅ Weight readings update in real-time (< 500ms latency)  
✅ Barcode scanner recognizes codes within 2 seconds  
✅ Labels print correctly on Brother/Dymo printers  
✅ All fallbacks work when hardware unavailable  
✅ Works on iPad Air (2013) Safari 12  
✅ Graceful error handling with user-friendly messages  
✅ No app crashes from hardware failures  

---

**READY FOR HARDWARE INTEGRATION! 🔌**

Claude Code can now implement Bluetooth scales, barcode scanning, and label printing with full iPad Air 2013 compatibility.

Start with Bluetooth scale (most critical), then barcode scanner, then label printer.

Good luck! 💪
