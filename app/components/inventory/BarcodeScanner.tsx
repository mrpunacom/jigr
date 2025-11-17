'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, X, Keyboard, AlertCircle, CheckCircle } from 'lucide-react'
import { ModuleCard } from '../ModuleCard'
import { isValidBarcode, cleanBarcode, formatBarcode, validateBarcodeFormat } from '@/lib/utils/barcode'

// QuaggaJS import with dynamic loading for client-side only
let Quagga: any = null
if (typeof window !== 'undefined') {
  import('@ericblade/quagga2').then(module => {
    Quagga = module.default
  })
}

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  title?: string
  subtitle?: string
}

export function BarcodeScanner({ 
  onScan, 
  onClose, 
  title = 'Scan Barcode',
  subtitle = 'Position the barcode within the frame'
}: BarcodeScannerProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualBarcode, setManualBarcode] = useState('')
  const [lastScanAttempt, setLastScanAttempt] = useState(0)
  const [permissionDenied, setPermissionDenied] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<HTMLDivElement>(null)
  const isActiveRef = useRef(true)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (Quagga && isInitialized) {
      try {
        Quagga.stop()
        console.log('📷 Barcode scanner stopped')
      } catch (err) {
        console.error('Error stopping Quagga:', err)
      }
    }
    setIsInitialized(false)
    setIsScanning(false)
  }, [isInitialized])

  // Handle successful scan
  const handleScan = useCallback((barcode: string) => {
    const now = Date.now()
    if (now - lastScanAttempt < 1500) return // Debounce scans
    
    setLastScanAttempt(now)
    
    if (isValidBarcode(barcode)) {
      console.log('📷 Valid barcode scanned:', barcode)
      cleanup()
      onScan(cleanBarcode(barcode))
    } else {
      console.log('📷 Invalid barcode format:', barcode)
      setError(`Invalid barcode format: ${barcode}`)
      setTimeout(() => setError(null), 3000)
    }
  }, [lastScanAttempt, cleanup, onScan])

  // Initialize camera and scanner
  const initializeScanner = useCallback(async () => {
    if (!Quagga || !videoRef.current || isInitialized) return

    try {
      setError(null)
      setIsScanning(true)

      // Check for camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      })

      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop())

      // Configure Quagga
      const config = {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: videoRef.current,
          constraints: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: 'environment'
          },
          area: {
            top: '20%',
            right: '20%',
            left: '20%', 
            bottom: '20%'
          }
        },
        decoder: {
          readers: ['upc_reader', 'ean_reader', 'upc_e_reader', 'ean_8_reader']
        },
        locate: true,
        frequency: 10,
        halfSample: true,
        patchSize: 'medium'
      }

      // Initialize Quagga
      Quagga.init(config, (err: any) => {
        if (err) {
          console.error('📷 QuaggaJS init failed:', err)
          setError('Camera initialization failed. Please try manual entry.')
          setPermissionDenied(true)
          setIsScanning(false)
          return
        }

        if (!isActiveRef.current) return // Component unmounted

        setIsInitialized(true)
        setIsScanning(true)
        Quagga.start()
        console.log('📷 Barcode scanner started')

        // Handle barcode detection
        Quagga.onDetected((result: any) => {
          if (!isActiveRef.current) return
          const barcode = result.codeResult.code
          handleScan(barcode)
        })
      })

    } catch (err: any) {
      console.error('📷 Camera access failed:', err)
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access denied. Please use manual entry.')
        setPermissionDenied(true)
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please use manual entry.')
        setPermissionDenied(true)
      } else {
        setError('Camera error. Please try manual entry.')
        setPermissionDenied(true)
      }
      
      setIsScanning(false)
      setShowManualEntry(true)
    }
  }, [isInitialized, handleScan])

  // Handle manual barcode entry
  const handleManualSubmit = () => {
    const validation = validateBarcodeFormat(manualBarcode)
    
    if (!validation.isValid) {
      setError(validation.error || 'Invalid barcode')
      return
    }
    
    if (manualBarcode.trim()) {
      onScan(cleanBarcode(manualBarcode.trim()))
    }
  }

  // Initialize on mount
  useEffect(() => {
    isActiveRef.current = true
    
    if (Quagga) {
      initializeScanner()
    } else {
      // Wait for Quagga to load
      const checkQuagga = setInterval(() => {
        if (Quagga && isActiveRef.current) {
          clearInterval(checkQuagga)
          initializeScanner()
        }
      }, 100)
      
      setTimeout(() => {
        clearInterval(checkQuagga)
        if (!Quagga) {
          setError('Barcode scanner failed to load. Please use manual entry.')
          setShowManualEntry(true)
        }
      }, 5000)
    }

    return () => {
      isActiveRef.current = false
      cleanup()
    }
  }, [initializeScanner, cleanup])

  // Handle escape key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <ModuleCard theme="light" className="w-full max-w-lg mx-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                {title}
              </h3>
              <p className="text-sm text-white/70 mt-1">{subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Scanner Area */}
          {!showManualEntry && (
            <div className="relative mb-6">
              <div 
                ref={scannerRef}
                className="relative bg-black rounded-lg overflow-hidden"
                style={{ aspectRatio: '16/9' }}
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner guides */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-64 h-32 border-2 border-white/50 rounded-lg">
                      {/* Corner decorations */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white"></div>
                      
                      {/* Scanning line animation */}
                      {isScanning && (
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-green-400 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="absolute top-4 left-4">
                    {isScanning && (
                      <div className="flex items-center bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                        <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                        Scanning...
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Tips */}
              <div className="mt-4 text-center">
                <p className="text-sm text-white/70">
                  Position the barcode within the frame and hold steady
                </p>
              </div>
            </div>
          )}

          {/* Manual Entry */}
          {showManualEntry && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-white mb-4">Enter Barcode Manually</h4>
              <div className="space-y-4">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="012345678905"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ minHeight: '44px' }}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleManualSubmit()
                    }
                  }}
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualBarcode.trim()}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                  style={{ minHeight: '44px' }}
                >
                  <CheckCircle className="h-5 w-5 inline mr-2" />
                  Use This Barcode
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!showManualEntry && !permissionDenied && (
              <button
                onClick={() => setShowManualEntry(true)}
                className="flex-1 bg-white/10 border border-white/20 text-white py-3 rounded-lg font-medium hover:bg-white/20 transition-colors"
                style={{ minHeight: '44px' }}
              >
                <Keyboard className="h-5 w-5 inline mr-2" />
                Manual Entry
              </button>
            )}
            
            {showManualEntry && !permissionDenied && (
              <button
                onClick={() => {
                  setShowManualEntry(false)
                  setError(null)
                  initializeScanner()
                }}
                className="flex-1 bg-white/10 border border-white/20 text-white py-3 rounded-lg font-medium hover:bg-white/20 transition-colors"
                style={{ minHeight: '44px' }}
              >
                <Camera className="h-5 w-5 inline mr-2" />
                Try Camera Again
              </button>
            )}
            
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              style={{ minHeight: '44px' }}
            >
              Cancel
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-4 text-center">
            <p className="text-xs text-white/50">
              Supports UPC-A, EAN-13, and other standard formats
            </p>
          </div>
        </div>
      </ModuleCard>
    </div>
  )
}