'use client'

import { useEffect } from 'react'
import { useServiceWorker } from '@/app/hooks/useServiceWorker'

export function ServiceWorkerManager() {
  const { isSupported, isRegistered, error } = useServiceWorker()

  useEffect(() => {
    if (isRegistered) {
      console.log('📱 JiGR offline features are active')
      
      // Request notification permission for sync notifications
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            console.log('🔔 Notification permission:', permission)
          })
        }
      }
    }
  }, [isRegistered])

  useEffect(() => {
    if (error) {
      console.warn('⚠️ Service Worker error:', error)
    }
  }, [error])

  // This component doesn't render anything visible
  return null
}