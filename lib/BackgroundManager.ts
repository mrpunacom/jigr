'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getStorageImageUrl, STORAGE_BUCKETS } from './image-storage'

// Module background mapping - Order matters! More specific paths first
const MODULE_BACKGROUNDS: Record<string, string> = {
  '/admin': 'backgrounds/kitchen.jpg', // Re-enabled with simple kitchen.jpg path
  '/upload': 'backgrounds/chef-workspace.jpg',
  '/dashboard': 'backgrounds/kitchen-prep.jpg',
  '/login': 'backgrounds/CafeWindow.jpg',
  '/register': 'backgrounds/CafeWindow.jpg',
  // Add more as needed
}

// Exact path matches for public pages
const EXACT_PATH_BACKGROUNDS: Record<string, string> = {
  '/': 'backgrounds/restaurant.jpg', // Landing page only
  '/accept': 'backgrounds/restaurant.jpg', // Accept invitation page
}

// Default fallback
const DEFAULT_BACKGROUND = 'backgrounds/chef-workspace.jpg'

export function useModuleBackground() {
  const pathname = usePathname()
  
  useEffect(() => {
    // Check exact matches first
    let backgroundPath = EXACT_PATH_BACKGROUNDS[pathname]
    
    // If no exact match, check module prefixes
    if (!backgroundPath) {
      const moduleKey = Object.keys(MODULE_BACKGROUNDS).find(key => 
        pathname.startsWith(key)
      )
      backgroundPath = moduleKey ? MODULE_BACKGROUNDS[moduleKey] : DEFAULT_BACKGROUND
    }
    
    // Debug logging
    console.log('🎨 BackgroundManager:', {
      pathname,
      backgroundPath,
      exact: !!EXACT_PATH_BACKGROUNDS[pathname],
      watermark: pathname.startsWith('/admin') || pathname.startsWith('/upload')
    })
    
    const backgroundUrl = getStorageImageUrl(
      STORAGE_BUCKETS.MODULE_ASSETS,
      backgroundPath,
      {
        format: 'webp',
        quality: 75,
        width: 1920,
        height: 1080
      }
    )
    
    console.log('🎨 Generated background URL:', backgroundUrl)
    
    // Remove existing background div if any
    const existingDiv = document.getElementById('dynamic-background')
    if (existingDiv) {
      existingDiv.remove()
    }
    
    // Apply universal watermark effect to ALL pages
    const isWatermarkModule = true // Now ALL pages use watermark effect
    
    // Create background div with POSITIVE z-index to work with all layouts
    const bgDiv = document.createElement('div')
    bgDiv.id = 'dynamic-background'
    
    // Apply watermark effect for ALL modules
    const watermarkStyles = `
      opacity: 0.4;
      filter: brightness(1.1) contrast(0.8);
    `
    
    bgDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      background-image: url(${backgroundUrl});
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      z-index: 0;
      pointer-events: none;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
      ${watermarkStyles}
    `
    
    // Insert at beginning of body
    document.body.insertBefore(bgDiv, document.body.firstChild)
    
    // Ensure ContentArea has higher z-index
    const contentAreas = document.querySelectorAll('.ContentArea')
    contentAreas.forEach((area) => {
      const el = area as HTMLElement
      if (!el.style.zIndex || parseInt(el.style.zIndex) <= 0) {
        el.style.position = 'relative'
        el.style.zIndex = '1'
      }
    })
    
    // Force layout recalculation for iOS 12 Safari compatibility
    setTimeout(() => {
      const bgDiv = document.getElementById('dynamic-background')
      if (bgDiv) {
        // Force reflow/repaint
        bgDiv.style.display = 'none'
        bgDiv.offsetHeight // Trigger reflow
        bgDiv.style.display = 'block'
        
        // Also try forcing background refresh
        const currentBg = bgDiv.style.backgroundImage
        bgDiv.style.backgroundImage = ''
        bgDiv.offsetHeight // Trigger reflow
        bgDiv.style.backgroundImage = currentBg
      }
    }, 100)
    
    console.log('✅ Background div created and ContentArea z-index adjusted')
    
    // Cleanup on unmount
    return () => {
      const bgDiv = document.getElementById('dynamic-background')
      if (bgDiv) {
        bgDiv.remove()
      }
    }
  }, [pathname])
}