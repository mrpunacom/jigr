'use client'

import { useState, useEffect, useCallback } from 'react'

interface OfflineBarcodeScan {
  id: string
  barcode: string
  timestamp: number
  workflowType: 'inventory_count' | 'stock_update' | 'receiving' | 'lookup'
  metadata?: {
    quantity?: number
    location?: string
    notes?: string
    coordinates?: { latitude: number; longitude: number }
  }
  synced: boolean
  syncAttempts: number
  lastSyncAttempt?: number
}

interface OfflineStorageHook {
  offlineScans: OfflineBarcodeScan[]
  isOnline: boolean
  pendingSyncCount: number
  addOfflineScan: (scan: Omit<OfflineBarcodeScan, 'id' | 'synced' | 'syncAttempts'>) => void
  syncOfflineScans: () => Promise<void>
  clearSyncedScans: () => void
  getOfflineData: () => OfflineBarcodeScan[]
}

const STORAGE_KEY = 'jigr_offline_barcode_scans'
const MAX_SYNC_ATTEMPTS = 3

export function useOfflineStorage(): OfflineStorageHook {
  const [offlineScans, setOfflineScans] = useState<OfflineBarcodeScan[]>([])
  const [isOnline, setIsOnline] = useState(true)

  // Load offline data from localStorage
  useEffect(() => {
    const loadOfflineData = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          setOfflineScans(Array.isArray(parsed) ? parsed : [])
        }
      } catch (error) {
        console.error('Failed to load offline data:', error)
      }
    }

    loadOfflineData()
  }, [])

  // Monitor online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && offlineScans.some(scan => !scan.synced)) {
      const timer = setTimeout(() => {
        syncOfflineScans()
      }, 1000) // Delay to ensure connection is stable

      return () => clearTimeout(timer)
    }
  }, [isOnline])

  // Save to localStorage
  const saveToStorage = useCallback((scans: OfflineBarcodeScan[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scans))
    } catch (error) {
      console.error('Failed to save offline data:', error)
    }
  }, [])

  // Add new offline scan
  const addOfflineScan = useCallback((scan: Omit<OfflineBarcodeScan, 'id' | 'synced' | 'syncAttempts'>) => {
    const newScan: OfflineBarcodeScan = {
      ...scan,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      synced: false,
      syncAttempts: 0
    }

    const updatedScans = [newScan, ...offlineScans]
    setOfflineScans(updatedScans)
    saveToStorage(updatedScans)
  }, [offlineScans, saveToStorage])

  // Sync offline scans to server
  const syncOfflineScans = useCallback(async () => {
    if (!isOnline) return

    const unsynced = offlineScans.filter(scan => !scan.synced && scan.syncAttempts < MAX_SYNC_ATTEMPTS)
    
    if (unsynced.length === 0) return

    const syncPromises = unsynced.map(async (scan) => {
      try {
        const response = await fetch('/api/barcode/offline-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            barcode: scan.barcode,
            timestamp: scan.timestamp,
            workflowType: scan.workflowType,
            metadata: scan.metadata
          }),
        })

        if (response.ok) {
          return { ...scan, synced: true }
        } else {
          throw new Error(`Sync failed: ${response.status}`)
        }
      } catch (error) {
        console.error(`Failed to sync scan ${scan.id}:`, error)
        return {
          ...scan,
          syncAttempts: scan.syncAttempts + 1,
          lastSyncAttempt: Date.now()
        }
      }
    })

    try {
      const syncResults = await Promise.all(syncPromises)
      
      const updatedScans = offlineScans.map(originalScan => {
        const syncResult = syncResults.find(result => result.id === originalScan.id)
        return syncResult || originalScan
      })

      setOfflineScans(updatedScans)
      saveToStorage(updatedScans)

      // Show notification for successful syncs
      const syncedCount = syncResults.filter(result => result.synced).length
      if (syncedCount > 0) {
        console.log(`✅ Successfully synced ${syncedCount} offline barcode scans`)
        
        // Optional: Show toast notification
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('JiGR Sync Complete', {
              body: `Synced ${syncedCount} offline barcode scans`,
              icon: '/favicon.ico'
            })
          }
        }
      }
    } catch (error) {
      console.error('Batch sync failed:', error)
    }
  }, [isOnline, offlineScans, saveToStorage])

  // Clear synced scans
  const clearSyncedScans = useCallback(() => {
    const unsynced = offlineScans.filter(scan => !scan.synced)
    setOfflineScans(unsynced)
    saveToStorage(unsynced)
  }, [offlineScans, saveToStorage])

  // Get all offline data
  const getOfflineData = useCallback(() => {
    return offlineScans
  }, [offlineScans])

  const pendingSyncCount = offlineScans.filter(scan => !scan.synced).length

  return {
    offlineScans,
    isOnline,
    pendingSyncCount,
    addOfflineScan,
    syncOfflineScans,
    clearSyncedScans,
    getOfflineData
  }
}