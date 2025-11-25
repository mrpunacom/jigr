'use client'

import { useEffect, useState } from 'react'

interface ServiceWorkerHook {
  isSupported: boolean
  isRegistered: boolean
  isUpdating: boolean
  error: string | null
  registerServiceWorker: () => Promise<void>
  updateServiceWorker: () => Promise<void>
}

export function useServiceWorker(): ServiceWorkerHook {
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if service workers are supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      setIsSupported(true)
      
      // Auto-register on mount
      registerServiceWorker()
    } else {
      console.log('Service Workers not supported')
    }
  }, [])

  const registerServiceWorker = async () => {
    if (!isSupported) return

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('✅ Service Worker registered:', registration.scope)
      setIsRegistered(true)
      setError(null)

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        console.log('🔄 Service Worker update found')
        setIsUpdating(true)

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✨ New Service Worker ready')
            setIsUpdating(false)
            
            // Optionally show update notification
            if (typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('JiGR Update Available', {
                  body: 'A new version is ready. Refresh to update.',
                  icon: '/favicon.ico',
                  tag: 'app-update'
                })
              }
            }
          }
        })
      })

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data
        
        switch (type) {
          case 'SYNC_SUCCESS':
            console.log('📱 Background sync completed:', data.barcode)
            // Optionally dispatch custom event for components to listen to
            window.dispatchEvent(new CustomEvent('sw-sync-success', { detail: data }))
            break
        }
      })

      // Handle controller change (new SW takes control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed')
        window.location.reload()
      })

    } catch (err) {
      console.error('❌ Service Worker registration failed:', err)
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  const updateServiceWorker = async () => {
    if (!isSupported) return

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()
        console.log('🔄 Service Worker update triggered')
      }
    } catch (err) {
      console.error('❌ Service Worker update failed:', err)
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  return {
    isSupported,
    isRegistered,
    isUpdating,
    error,
    registerServiceWorker,
    updateServiceWorker
  }
}