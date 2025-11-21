'use client';

import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useEffect, useRef, useState } from 'react';
import { X, Camera, Check } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string, format?: string) => void;
  onClose?: () => void;
  title?: string;
  allowManualEntry?: boolean;
  autoClose?: boolean;
}

export default function BarcodeScanner({
  onScan,
  onClose,
  title = 'Scan Barcode',
  allowManualEntry = true,
  autoClose = true
}: BarcodeScannerProps) {
  const [manualEntry, setManualEntry] = useState('');
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const {
    isScanning,
    isSupported,
    lastScan,
    error,
    startScanning,
    stopScanning,
    videoElement
  } = useBarcodeScanner((result) => {
    // Add to scan history
    setScanHistory(prev => {
      const newHistory = [result.code, ...prev.slice(0, 4)]; // Keep last 5 scans
      return newHistory.filter((item, index) => newHistory.indexOf(item) === index); // Remove duplicates
    });
    
    // Call parent callback
    onScan(result.code, result.format);
    
    // Auto-close if enabled
    if (autoClose) {
      setTimeout(() => {
        stopScanning();
        onClose?.();
      }, 1000);
    }
  });

  // Auto-start scanning on mount
  useEffect(() => {
    if (isSupported) {
      startScanning();
    }
  }, [isSupported, startScanning]);

  // Append video element to container when available
  useEffect(() => {
    if (videoElement && videoContainerRef.current && isScanning) {
      // Clear container first
      videoContainerRef.current.innerHTML = '';
      
      // Style video for iPad Air 2013
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.objectFit = 'cover';
      videoElement.style.transform = 'scaleX(-1)'; // Mirror for better UX
      
      videoContainerRef.current.appendChild(videoElement);
    }
  }, [videoElement, isScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualEntry.trim()) {
      onScan(manualEntry.trim(), 'Manual Entry');
      setManualEntry('');
      if (autoClose) {
        onClose?.();
      }
    }
  };

  const handleQuickScan = (barcode: string) => {
    onScan(barcode, 'History Selection');
    if (autoClose) {
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <div className="flex items-center gap-2">
            {lastScan && (
              <span className="text-sm text-green-600 font-medium">
                ✓ Scanned: {lastScan.code.substring(0, 12)}...
              </span>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
                style={{ minHeight: '48px', minWidth: '48px' }} // iPad touch target
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Camera View */}
        <div className="relative bg-black" style={{ height: '400px' }}>
          {isScanning ? (
            <div ref={videoContainerRef} className="w-full h-full relative">
              {/* Scanning Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-4 border-green-500 rounded-lg relative">
                  {/* Corner indicators */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                  
                  {/* Scanning line animation */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-green-400 animate-pulse" 
                       style={{ animationDuration: '2s' }} />
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
                <div className="text-center">
                  <p className="text-red-400 mb-4">{error}</p>
                  <button
                    onClick={startScanning}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
                    style={{ minHeight: '48px' }} // iPad touch target
                  >
                    Retry Camera Access
                  </button>
                </div>
              ) : (
                <button
                  onClick={startScanning}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
                  style={{ minHeight: '48px' }} // iPad touch target
                >
                  Start Camera
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="p-4 bg-green-50 border-t border-green-200">
            <h4 className="text-sm font-medium text-green-700 mb-2">Recent Scans:</h4>
            <div className="flex flex-wrap gap-2">
              {scanHistory.map((code, index) => (
                <button
                  key={`${code}-${index}`}
                  onClick={() => handleQuickScan(code)}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-mono hover:bg-green-200"
                  style={{ minHeight: '40px' }} // iPad touch target
                >
                  {code.length > 15 ? `${code.substring(0, 15)}...` : code}
                </button>
              ))}
            </div>
          </div>
        )}

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
                  style={{ minHeight: '48px' }} // iPad touch target
                />
                <button
                  type="submit"
                  disabled={!manualEntry.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                  style={{ minHeight: '48px' }} // iPad touch target
                >
                  <Check className="w-4 h-4" />
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Camera Controls */}
        <div className="p-4 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {isScanning ? 'Camera active - scanning for barcodes...' : 'Camera inactive'}
            </div>
            <button
              onClick={isScanning ? stopScanning : startScanning}
              className={`px-4 py-2 rounded-md font-medium ${
                isScanning 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              style={{ minHeight: '48px' }} // iPad touch target
            >
              {isScanning ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}