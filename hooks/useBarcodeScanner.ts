import { useState, useCallback, useRef, useEffect } from 'react';

interface BarcodeScanResult {
  code: string;
  format: string;
  timestamp: number;
  confidence?: number;
}

interface UseBarcodeScannerReturn {
  isScanning: boolean;
  isSupported: boolean;
  lastScan: BarcodeScanResult | null;
  error: string | null;
  startScanning: () => Promise<void>;
  stopScanning: () => void;
  videoElement: HTMLVideoElement | null;
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
  const readerRef = useRef<any>(null);

  // Check camera support
  useEffect(() => {
    setIsSupported(
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  }, []);

  // Initialize ZXing reader
  useEffect(() => {
    const initReader = async () => {
      try {
        // Dynamically import ZXing library
        const ZXing = await import('@zxing/library');
        readerRef.current = new ZXing.BrowserMultiFormatReader();
      } catch (err) {
        console.error('Failed to load ZXing library:', err);
        setError('Barcode scanning library failed to load');
      }
    };

    if (typeof window !== 'undefined') {
      initReader();
    }
  }, []);

  // Start camera and scanning
  const startScanning = useCallback(async () => {
    if (!isSupported) {
      setError('Camera access not supported on this device');
      return;
    }

    if (!readerRef.current) {
      setError('Barcode scanner not initialized');
      return;
    }

    try {
      setError(null);
      
      // Request camera access with iPad Air 2013 compatible constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      });

      streamRef.current = stream;

      // Create video element if not exists
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;
        videoRef.current.muted = true; // Required for autoplay on iOS
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // Create canvas for frame capture
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      setIsScanning(true);

      // Start scanning loop (every 500ms for iPad Air 2013 performance)
      scanIntervalRef.current = setInterval(() => {
        scanFrame();
      }, 500);

    } catch (err: any) {
      console.error('Camera access error:', err);
      let errorMessage = 'Failed to access camera';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please enable camera access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported on this device.';
      }
      
      setError(errorMessage);
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
    if (!videoRef.current || !canvasRef.current || !readerRef.current) return;

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

    try {
      // Use ZXing library to decode barcode from image data
      const result = readerRef.current.decodeFromImageData(imageData);

      if (result) {
        const scanResult: BarcodeScanResult = {
          code: result.text,
          format: result.format || 'Unknown',
          timestamp: Date.now(),
          confidence: 0.95 // ZXing doesn't provide confidence, set default
        };

        setLastScan(scanResult);

        if (onScan) {
          onScan(scanResult);
        }

        // Continue scanning (don't stop automatically)
        // This allows for rapid consecutive scans
      }
    } catch (err) {
      // No barcode found in this frame - continue scanning
      // This is expected behavior, not an error
    }
  }, [onScan]);

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
    stopScanning,
    videoElement: videoRef.current
  };
}