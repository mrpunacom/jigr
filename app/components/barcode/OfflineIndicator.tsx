'use client'

import { useState, useEffect } from 'react'
import { useOfflineStorage } from '@/app/hooks/useOfflineStorage'

interface OfflineIndicatorProps {
  showDetails?: boolean
  className?: string
}

export function OfflineIndicator({ showDetails = false, className = '' }: OfflineIndicatorProps) {
  const { isOnline, pendingSyncCount, offlineScans, syncOfflineScans, clearSyncedScans } = useOfflineStorage()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // Handle manual sync
  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return
    
    setIsSyncing(true)
    try {
      await syncOfflineScans()
      setLastSyncTime(new Date())
    } catch (error) {
      console.error('Manual sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Auto-update last sync time when scans change
  useEffect(() => {
    if (pendingSyncCount === 0 && offlineScans.some(scan => scan.synced)) {
      setLastSyncTime(new Date())
    }
  }, [pendingSyncCount, offlineScans])

  const getStatusIcon = () => {
    if (!isOnline) {
      return <span className="icon-[tabler--wifi-off] h-4 w-4 text-red-500"></span>
    }
    
    if (pendingSyncCount > 0) {
      return <span className="icon-[tabler--cloud-off] h-4 w-4 text-amber-500"></span>
    }
    
    return <span className="icon-[tabler--cloud] h-4 w-4 text-green-500"></span>
  }

  const getStatusText = () => {
    if (!isOnline) {
      return `Offline • ${pendingSyncCount} pending`
    }
    
    if (pendingSyncCount > 0) {
      return `${pendingSyncCount} pending sync`
    }
    
    return 'All synced'
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-50 border-red-200 text-red-700'
    if (pendingSyncCount > 0) return 'bg-amber-50 border-amber-200 text-amber-700'
    return 'bg-green-50 border-green-200 text-green-700'
  }

  return (
    <div className={`relative ${className}`}>
      {/* Compact Status Indicator */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${getStatusColor()}`}
      >
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
        {isSyncing && (
          <span className="icon-[tabler--refresh] h-3 w-3 animate-spin"></span>
        )}
      </button>

      {/* Expanded Details Panel */}
      {isExpanded && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-80">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Sync Status</h4>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <span className="icon-[tabler--x] h-4 w-4 text-gray-500"></span>
            </button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-3 mb-4">
            {isOnline ? (
              <>
                <span className="icon-[tabler--wifi] h-5 w-5 text-green-500"></span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Online</p>
                  <p className="text-xs text-gray-500">Connected to internet</p>
                </div>
              </>
            ) : (
              <>
                <span className="icon-[tabler--wifi-off] h-5 w-5 text-red-500"></span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Offline</p>
                  <p className="text-xs text-gray-500">No internet connection</p>
                </div>
              </>
            )}
          </div>

          {/* Sync Statistics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold text-gray-900">{pendingSyncCount}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold text-gray-900">{offlineScans.filter(s => s.synced).length}</p>
              <p className="text-xs text-gray-500">Synced</p>
            </div>
          </div>

          {/* Last Sync Time */}
          {lastSyncTime && (
            <div className="flex items-center space-x-2 mb-4 text-xs text-gray-500">
              <span className="icon-[tabler--circle-check] h-3 w-3 text-green-500"></span>
              <span>Last sync: {lastSyncTime.toLocaleTimeString()}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {isOnline && pendingSyncCount > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                {isSyncing ? (
                  <>
                    <span className="icon-[tabler--refresh] h-4 w-4 animate-spin"></span>
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <span className="icon-[tabler--cloud] h-4 w-4"></span>
                    <span>Sync Now ({pendingSyncCount})</span>
                  </>
                )}
              </button>
            )}

            {offlineScans.filter(s => s.synced).length > 0 && (
              <button
                onClick={clearSyncedScans}
                className="w-full flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                <span className="icon-[tabler--circle-check] h-4 w-4"></span>
                <span>Clear Synced Data</span>
              </button>
            )}
          </div>

          {/* Offline Scans List */}
          {showDetails && offlineScans.length > 0 && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <h5 className="text-xs font-medium text-gray-700 mb-2">Recent Offline Scans</h5>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {offlineScans.slice(0, 5).map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      {scan.synced ? (
                        <span className="icon-[tabler--circle-check] h-3 w-3 text-green-500"></span>
                      ) : (
                        <span className="icon-[tabler--alert-triangle] h-3 w-3 text-amber-500"></span>
                      )}
                      <code className="text-blue-600">{scan.barcode}</code>
                    </div>
                    <span className="text-gray-500">
                      {new Date(scan.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}