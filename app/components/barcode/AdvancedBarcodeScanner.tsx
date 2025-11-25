'use client'

import { useState, useEffect, useRef } from 'react'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { useOfflineStorage } from '@/app/hooks/useOfflineStorage'
import { OfflineIndicator } from '@/app/components/barcode/OfflineIndicator'

interface ScanResult {
  barcode: string
  product?: {
    id: string
    name: string
    brand?: string
    category?: string
    images?: string[]
  }
  inventory?: {
    current_stock: number
    par_level_low?: number
    unit: string
    location?: string
  }
  timestamp: number
  status: 'found' | 'not_found' | 'processing'
}

interface AdvancedBarcodeScannerProps {
  onScanResult?: (result: ScanResult) => void
  onClose?: () => void
  workflowType?: 'inventory_count' | 'stock_update' | 'receiving' | 'lookup'
  showHistory?: boolean
  autoLookup?: boolean
  className?: string
}

export function AdvancedBarcodeScanner({
  onScanResult,
  onClose,
  workflowType = 'lookup',
  showHistory = true,
  autoLookup = true,
  className = ''
}: AdvancedBarcodeScannerProps) {
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([])
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [flashlightOn, setFlashlightOn] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const [lastScanTime, setLastScanTime] = useState<number | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)

  // Offline storage hook
  const { isOnline, addOfflineScan, pendingSyncCount } = useOfflineStorage()

  const { 
    isScanning, 
    isSupported, 
    lastScan, 
    error, 
    startScanning, 
    stopScanning, 
    videoElement 
  } = useBarcodeScanner(handleScan)

  // Handle new barcode scan
  async function handleScan(scanResult: { code: string; format: string; timestamp: number }) {
    const now = Date.now()
    
    // Prevent duplicate scans within 1 second
    if (lastScanTime && now - lastScanTime < 1000) {
      return
    }
    
    setLastScanTime(now)
    setScanCount(prev => prev + 1)

    const result: ScanResult = {
      barcode: scanResult.code,
      timestamp: scanResult.timestamp,
      status: 'processing'
    }

    // Add to history immediately
    setScanHistory(prev => [result, ...prev.slice(0, 9)])

    // Store offline if no internet connection
    if (!isOnline) {
      addOfflineScan({
        barcode: scanResult.code,
        timestamp: scanResult.timestamp,
        workflowType,
        metadata: {
          coordinates: currentLocation || undefined
        }
      })

      // Update result to indicate offline storage
      const offlineResult: ScanResult = {
        ...result,
        status: 'not_found' // Will show as stored offline
      }
      
      setScanHistory(prev => 
        prev.map(item => 
          item.barcode === scanResult.code && item.timestamp === scanResult.timestamp 
            ? offlineResult 
            : item
        )
      )

      if (onScanResult) {
        onScanResult(offlineResult)
      }

      // Show offline feedback
      flashScreen('offline')
      return
    }

    // Online - proceed with lookup
    if (autoLookup) {
      await lookupBarcode(scanResult.code, result)
    }

    if (onScanResult) {
      onScanResult(result)
    }

    // Visual feedback
    flashScreen()
  }

  // Lookup barcode in database
  async function lookupBarcode(barcode: string, result: ScanResult) {
    setIsLookingUp(true)
    
    try {
      const response = await fetch(`/api/barcode/lookup?barcode=${barcode}&check_inventory=true&include_alternatives=false`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      const updatedResult: ScanResult = {
        ...result,
        status: data.product ? 'found' : 'not_found',
        product: data.product ? {
          id: data.product.id,
          name: data.product.name,
          brand: data.product.brand,
          category: data.product.category,
          images: data.product.images
        } : undefined,
        inventory: data.inventoryMatches?.[0] ? {
          current_stock: data.inventoryMatches[0].current_stock,
          par_level_low: data.inventoryMatches[0].par_level_low,
          unit: data.inventoryMatches[0].count_unit,
          location: data.inventoryMatches[0].location_name
        } : undefined
      }

      // Update history
      setScanHistory(prev => 
        prev.map(item => 
          item.barcode === barcode && item.timestamp === result.timestamp 
            ? updatedResult 
            : item
        )
      )

      if (onScanResult) {
        onScanResult(updatedResult)
      }

    } catch (error) {
      console.error('Barcode lookup failed:', error)
      
      const errorResult: ScanResult = {
        ...result,
        status: 'not_found'
      }

      setScanHistory(prev => 
        prev.map(item => 
          item.barcode === barcode && item.timestamp === result.timestamp 
            ? errorResult 
            : item
        )
      )
    } finally {
      setIsLookingUp(false)
    }
  }

  // Visual scan feedback
  function flashScreen(type: 'online' | 'offline' = 'online') {
    const overlay = overlayCanvasRef.current
    if (!overlay) return

    if (type === 'offline') {
      overlay.style.background = 'rgba(251, 191, 36, 0.3)' // Amber for offline
    } else {
      overlay.style.background = 'rgba(34, 197, 94, 0.3)' // Green for online
    }
    
    setTimeout(() => {
      overlay.style.background = 'transparent'
    }, 200)
  }

  // Toggle flashlight (mobile devices)
  async function toggleFlashlight() {
    try {
      if (!videoElement || !videoElement.srcObject) return
      
      const stream = videoElement.srcObject as MediaStream
      const track = stream.getVideoTracks()[0]
      
      if (track && 'getCapabilities' in track) {
        const capabilities = track.getCapabilities()
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: !flashlightOn } as any]
          })
          setFlashlightOn(!flashlightOn)
        }
      }
    } catch (error) {
      console.error('Flashlight toggle failed:', error)
    }
  }

  // Restart camera
  async function restartCamera() {
    stopScanning()
    setTimeout(() => {
      startScanning()
    }, 500)
  }

  // Clear scan history
  function clearHistory() {
    setScanHistory([])
    setScanCount(0)
  }

  // Mount video element when available
  useEffect(() => {
    if (videoElement && videoContainerRef.current) {
      videoElement.style.width = '100%'
      videoElement.style.height = '100%'
      videoElement.style.objectFit = 'cover'
      
      videoContainerRef.current.appendChild(videoElement)
      
      return () => {
        if (videoContainerRef.current?.contains(videoElement)) {
          videoContainerRef.current.removeChild(videoElement)
        }
      }
    }
  }, [videoElement])

  // Auto-start scanning
  useEffect(() => {
    if (isSupported) {
      startScanning()
    }
    
    return () => {
      stopScanning()
    }
  }, [isSupported, startScanning, stopScanning])

  // Get current location for offline context
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.log('Location access denied:', error)
        }
      )
    }
  }, [])

  const getWorkflowTitle = () => {
    switch (workflowType) {
      case 'inventory_count': return 'Inventory Count'
      case 'stock_update': return 'Stock Update'
      case 'receiving': return 'Receiving'
      default: return 'Barcode Scanner'
    }
  }

  const getStatusIcon = (status: string, isOffline?: boolean) => {
    switch (status) {
      case 'found': return <span className="icon-[tabler--circle-check] h-4 w-4 text-green-500"></span>
      case 'not_found': 
        if (isOffline) {
          return <span className="icon-[tabler--cloud-off] h-4 w-4 text-amber-500"></span>
        }
        return <span className="icon-[tabler--alert-triangle] h-4 w-4 text-amber-500"></span>
      case 'processing': return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    }
  }

  return (
    <div className={`bg-black text-white min-h-screen flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-black/90 backdrop-blur-sm p-4 flex items-center justify-between relative z-20">
        <div className="flex items-center space-x-3">
          <span className="icon-[tabler--scan] h-6 w-6 text-blue-400"></span>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold">{getWorkflowTitle()}</h1>
              {!isOnline && <span className="icon-[tabler--wifi-off] h-4 w-4 text-amber-500"></span>}
            </div>
            <p className="text-xs text-gray-400">
              Scans: {scanCount}
              {pendingSyncCount > 0 && ` • ${pendingSyncCount} pending sync`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Flashlight Toggle */}
          <button
            onClick={toggleFlashlight}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title={flashlightOn ? 'Turn off flashlight' : 'Turn on flashlight'}
          >
            {flashlightOn ? 
              <span className="icon-[tabler--flashlight-off] h-5 w-5"></span> : 
              <span className="icon-[tabler--flashlight] h-5 w-5"></span>
            }
          </button>

          {/* Restart Camera */}
          <button
            onClick={restartCamera}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Restart camera"
          >
            <span className="icon-[tabler--rotate-clockwise] h-5 w-5"></span>
          </button>

          {/* Close */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="Close scanner"
            >
              <span className="icon-[tabler--x] h-5 w-5"></span>
            </button>
          )}
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {/* Video Container */}
        <div 
          ref={videoContainerRef} 
          className="absolute inset-0 bg-black"
        />
        
        {/* Scan Overlay */}
        <canvas 
          ref={overlayCanvasRef}
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ mixBlendMode: 'lighten' }}
        />

        {/* Scanning Reticle */}
        <div className="absolute inset-0 z-15 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="w-64 h-40 border-2 border-white/50 rounded-lg relative">
              {/* Corner indicators */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-l-3 border-t-3 border-blue-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-r-3 border-t-3 border-blue-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-3 border-b-3 border-blue-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-3 border-b-3 border-blue-400 rounded-br-lg" />
              
              {/* Scanning line */}
              {isScanning && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" 
                       style={{ 
                         animation: 'scan-line 2s ease-in-out infinite',
                         transform: 'translateY(50%)'
                       }} />
                </div>
              )}
            </div>
            
            <div className="text-center mt-4">
              <p className="text-white/80 text-sm">
                {!isOnline 
                  ? 'Offline mode - scans will sync later' 
                  : isScanning ? 'Point camera at barcode' : 'Camera starting...'}
              </p>
              {isLookingUp && (
                <p className="text-blue-400 text-xs mt-1 flex items-center justify-center">
                  <span className="icon-[tabler--search] h-3 w-3 mr-1 animate-spin"></span>
                  Looking up product...
                </p>
              )}
              {!isOnline && (
                <p className="text-amber-400 text-xs mt-1 flex items-center justify-center">
                  <span className="icon-[tabler--cloud-off] h-3 w-3 mr-1"></span>
                  Storing scans offline
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
            <div className="text-center p-6">
              <span className="icon-[tabler--camera-off] h-12 w-12 text-red-400 mx-auto mb-4"></span>
              <h3 className="text-lg font-semibold text-white mb-2">Camera Error</h3>
              <p className="text-gray-400 text-sm mb-4">{error}</p>
              <button
                onClick={restartCamera}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Not Supported State */}
        {!isSupported && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
            <div className="text-center p-6">
              <span className="icon-[tabler--camera] h-12 w-12 text-gray-400 mx-auto mb-4"></span>
              <h3 className="text-lg font-semibold text-white mb-2">Camera Not Available</h3>
              <p className="text-gray-400 text-sm">
                Camera access is not supported on this device or browser.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Offline Status */}
      {(!isOnline || pendingSyncCount > 0) && (
        <div className="bg-black/90 backdrop-blur-sm border-t border-white/10 p-4">
          <OfflineIndicator showDetails={true} className="w-full" />
        </div>
      )}

      {/* Scan History */}
      {showHistory && scanHistory.length > 0 && (
        <div className="bg-black/90 backdrop-blur-sm border-t border-white/10">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Recent Scans</h3>
              <button
                onClick={clearHistory}
                className="text-xs text-gray-400 hover:text-white"
              >
                Clear
              </button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {scanHistory.slice(0, 5).map((result, index) => (
                <div 
                  key={`${result.barcode}-${result.timestamp}`}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getStatusIcon(result.status, !isOnline)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-blue-400">{result.barcode}</span>
                        {result.inventory && (
                          <span className="text-xs text-gray-400">
                            Stock: {result.inventory.current_stock} {result.inventory.unit}
                          </span>
                        )}
                      </div>
                      {result.product && (
                        <p className="text-xs text-white/80 truncate">{result.product.name}</p>
                      )}
                      {result.status === 'not_found' && (
                        <p className="text-xs text-amber-400">
                          {!isOnline ? 'Stored offline - will sync later' : 'Product not found'}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => lookupBarcode(result.barcode, result)}
                      className="p-1 text-gray-400 hover:text-white"
                      title="Lookup again"
                    >
                      <span className="icon-[tabler--search] h-3 w-3"></span>
                    </button>
                    {result.product && (
                      <button
                        className="p-1 text-gray-400 hover:text-white"
                        title="View details"
                      >
                        <span className="icon-[tabler--eye] h-3 w-3"></span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-black/90 backdrop-blur-sm border-t border-white/10 p-4">
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {/* Navigate to manual entry */}}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          >
            <span className="icon-[tabler--plus] h-4 w-4"></span>
            <span>Manual Entry</span>
          </button>
          <button
            onClick={() => {/* Navigate to recent items */}}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          >
            <span className="icon-[tabler--clock] h-4 w-4"></span>
            <span>Recent</span>
          </button>
          <button
            onClick={() => {/* Navigate to inventory */}}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          >
            <span className="icon-[tabler--package] h-4 w-4"></span>
            <span>Inventory</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
      `}</style>
    </div>
  )
}