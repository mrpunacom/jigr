// JiGR Service Worker - Offline Barcode Scanner Support
const CACHE_NAME = 'jigr-offline-v1'
const OFFLINE_CACHE_NAME = 'jigr-offline-scans-v1'

// Essential files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/scanner',
  '/inventory',
  '/offline.html', // Fallback page
  '/manifest.json',
  // Add other critical assets
]

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('🔧 JiGR Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching essential resources')
        return cache.addAll(STATIC_CACHE_URLS.filter(url => {
          // Only cache existing URLs to avoid 404s
          return true // In production, you'd validate these URLs exist
        }))
      })
      .then(() => {
        console.log('✅ Essential resources cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('❌ Cache installation failed:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 JiGR Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('✅ Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle offline requests
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Handle API requests
  if (request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static resources with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(request)
          .then((response) => {
            // Cache successful responses for static resources
            if (response.status === 200 && isStaticResource(request.url)) {
              const responseClone = response.clone()
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseClone)
                })
            }
            return response
          })
          .catch(() => {
            // Return offline fallback page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html')
            }
            return new Response('Offline', { status: 503 })
          })
      })
  )
})

// Handle API requests with offline support
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request)
    return response
  } catch (error) {
    console.log('📱 API request failed, handling offline:', request.url)

    // Handle barcode lookup requests offline
    if (request.url.includes('/api/barcode/lookup')) {
      return handleOfflineBarcodeRequest(request)
    }

    // Handle offline sync requests (queue them)
    if (request.url.includes('/api/barcode/offline-sync')) {
      return handleOfflineSyncRequest(request)
    }

    // Return generic offline response for other API calls
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This request requires an internet connection',
        offline: true
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

// Handle barcode lookup when offline
async function handleOfflineBarcodeRequest(request) {
  // Extract barcode from URL
  const url = new URL(request.url)
  const barcode = url.searchParams.get('barcode')
  
  // Check if we have cached product data
  const cache = await caches.open(OFFLINE_CACHE_NAME)
  const cacheKey = `barcode_${barcode}`
  const cachedProduct = await cache.match(cacheKey)
  
  if (cachedProduct) {
    console.log('📦 Found cached product for barcode:', barcode)
    return cachedProduct
  }

  // Return offline response
  return new Response(
    JSON.stringify({
      barcode,
      product: null,
      inventoryMatches: [],
      alternatives: [],
      offline: true,
      message: 'Product lookup unavailable offline. Scan stored for later sync.'
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}

// Handle offline sync requests (queue for when online)
async function handleOfflineSyncRequest(request) {
  try {
    // Store the sync request for later
    const syncData = await request.json()
    const cache = await caches.open(OFFLINE_CACHE_NAME)
    const queueKey = `sync_queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await cache.put(
      queueKey,
      new Response(JSON.stringify({
        ...syncData,
        queuedAt: Date.now()
      }))
    )
    
    console.log('📥 Queued offline sync request:', queueKey)
    
    return new Response(
      JSON.stringify({
        success: true,
        queued: true,
        message: 'Sync request queued for when connection is restored'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Failed to queue sync request:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to queue sync request'
      }),
      { status: 500 }
    )
  }
}

// Helper function to determine if a URL is for a static resource
function isStaticResource(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2']
  return staticExtensions.some(ext => url.includes(ext))
}

// Background sync event - sync queued data when online
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag)
  
  if (event.tag === 'barcode-sync') {
    event.waitUntil(syncQueuedBarcodes())
  }
})

// Sync queued barcode scans when connection is restored
async function syncQueuedBarcodes() {
  try {
    const cache = await caches.open(OFFLINE_CACHE_NAME)
    const requests = await cache.keys()
    
    const syncRequests = requests.filter(req => req.url.includes('sync_queue_'))
    
    console.log(`🔄 Syncing ${syncRequests.length} queued barcode scans...`)
    
    for (const request of syncRequests) {
      try {
        const response = await cache.match(request)
        const syncData = await response.json()
        
        // Attempt to sync with server
        const syncResponse = await fetch('/api/barcode/offline-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(syncData)
        })
        
        if (syncResponse.ok) {
          console.log('✅ Synced queued barcode:', syncData.barcode)
          await cache.delete(request)
          
          // Notify client of successful sync
          const clients = await self.clients.matchAll()
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              barcode: syncData.barcode
            })
          })
        }
      } catch (error) {
        console.error('❌ Failed to sync queued barcode:', error)
      }
    }
  } catch (error) {
    console.error('❌ Background sync failed:', error)
  }
}

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CACHE_BARCODE':
      // Cache barcode lookup result for offline use
      cacheBarcodeData(data.barcode, data.productData)
      break
      
    case 'REQUEST_SYNC':
      // Trigger background sync
      self.registration.sync.register('barcode-sync')
      break
  }
})

// Cache barcode data for offline access
async function cacheBarcodeData(barcode, productData) {
  try {
    const cache = await caches.open(OFFLINE_CACHE_NAME)
    const cacheKey = `barcode_${barcode}`
    
    await cache.put(
      cacheKey,
      new Response(JSON.stringify(productData), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=86400' // Cache for 24 hours
        }
      })
    )
    
    console.log('📦 Cached barcode data:', barcode)
  } catch (error) {
    console.error('❌ Failed to cache barcode data:', error)
  }
}