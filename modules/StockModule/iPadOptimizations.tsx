/**
 * JiGR Stock Module - iPad Air 2013 Optimizations
 * 
 * Specific optimizations for iPad Air 2013 (A7 chip) and Safari 12:
 * - Performance optimizations for older hardware
 * - Safari 12 compatibility fixes
 * - Touch interface enhancements
 * - Memory management optimizations
 * - Reduced animation complexity
 * - Optimized rendering strategies
 * - Legacy browser polyfills
 */

'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { StockDesignTokens } from './StockModuleCore'

// ============================================================================
// DEVICE DETECTION & CAPABILITY ASSESSMENT
// ============================================================================

interface DeviceCapabilities {
  isLegacyiPad: boolean
  supportsTouchEvents: boolean
  supportsWebGL: boolean
  supportsModernCSS: boolean
  supportsES6: boolean
  memoryLimit: 'low' | 'medium' | 'high'
  recommendedAnimations: 'none' | 'reduced' | 'full'
}

export const detectDeviceCapabilities = (): DeviceCapabilities => {
  if (typeof window === 'undefined') {
    return {
      isLegacyiPad: false,
      supportsTouchEvents: false,
      supportsWebGL: false,
      supportsModernCSS: false,
      supportsES6: false,
      memoryLimit: 'high',
      recommendedAnimations: 'full'
    }
  }

  const userAgent = navigator.userAgent
  const isIPad = /iPad/.test(userAgent)
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
  
  // Detect iPad Air 2013 specifically (A7 chip, iOS 12 max)
  const isLegacyiPad = isIPad && (
    /OS 12_/.test(userAgent) || 
    /OS 11_/.test(userAgent) ||
    /OS 10_/.test(userAgent) ||
    ((navigator as any).hardwareConcurrency && (navigator as any).hardwareConcurrency <= 2)
  )

  // Check for WebGL support
  const canvas = document.createElement('canvas')
  const supportsWebGL = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))

  // Check for modern CSS features
  const supportsModernCSS = CSS.supports('grid-template-columns', '1fr') && 
                            CSS.supports('display', 'flex')

  // Memory estimation based on device
  let memoryLimit: 'low' | 'medium' | 'high' = 'high'
  if (isLegacyiPad) {
    memoryLimit = 'low'
  } else if (isIPad) {
    memoryLimit = 'medium'
  }

  return {
    isLegacyiPad,
    supportsTouchEvents: 'ontouchstart' in window,
    supportsWebGL,
    supportsModernCSS,
    supportsES6: typeof Symbol !== 'undefined',
    memoryLimit,
    recommendedAnimations: isLegacyiPad ? 'reduced' : 'full'
  }
}

// ============================================================================
// ENHANCED DESIGN TOKENS FOR IPAD AIR 2013
// ============================================================================

export const iPadOptimizedTokens = {
  ...StockDesignTokens,
  
  // Enhanced spacing for touch interfaces
  spacing: {
    ...StockDesignTokens.spacing,
    
    // iPad Air 2013 specific touch targets (larger for older touch precision)
    legacyTouchTarget: '48px',     // 4px larger than standard
    legacyTouchSpacing: '12px',    // More spacing between elements
    
    // Component padding optimized for 9.7" screen
    cardPaddingLegacy: '1.25rem',  // Slightly reduced for screen space
    listItemPaddingLegacy: '1.25rem',
    modalPaddingLegacy: '1rem',
    
    // Safe areas for iPad landscape mode
    safeAreaTop: '20px',
    safeAreaSides: '16px'
  },
  
  // Simplified shadows for better performance
  shadowsOptimized: {
    card: '0 2px 4px rgba(0, 0, 0, 0.1)',           // Simplified
    modal: '0 8px 16px rgba(0, 0, 0, 0.15)',        // Reduced complexity
    floating: '0 4px 8px rgba(0, 0, 0, 0.12)'       // Less intensive
  },
  
  // Performance-optimized animations
  animations: {
    // Reduced motion for legacy devices
    reducedMotion: {
      transition: 'all 0.15s ease',
      transform: 'scale(1.02)', // Subtle scaling instead of complex animations
      opacity: 'opacity 0.15s ease'
    },
    
    // Full animations for modern devices
    fullMotion: {
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      transform: 'scale(1.05) translateY(-2px)',
      opacity: 'opacity 0.3s ease'
    }
  }
}

// ============================================================================
// RESPONSIVE UTILITIES ENHANCED FOR IPAD
// ============================================================================

export const iPadResponsiveUtils = {
  // Viewport detection
  getViewportSize: () => {
    if (typeof window === 'undefined') return { width: 1024, height: 768 }
    
    return {
      width: window.innerWidth,
      height: window.innerHeight
    }
  },
  
  // iPad orientation detection
  getOrientation: (): 'portrait' | 'landscape' => {
    if (typeof window === 'undefined') return 'landscape'
    
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  },
  
  // Grid system optimized for iPad Air 2013 (1024x768)
  getOptimizedGrid: (itemCount: number) => {
    const { width } = iPadResponsiveUtils.getViewportSize()
    const orientation = iPadResponsiveUtils.getOrientation()
    
    if (width <= 768) {
      // Portrait mode - single column for better readability
      return 'grid-cols-1'
    } else if (width <= 1024) {
      // Landscape mode - optimize based on content
      if (itemCount <= 4) return 'grid-cols-2'
      if (itemCount <= 9) return 'grid-cols-3'
      return 'grid-cols-4'
    }
    
    // Larger screens
    return 'grid-cols-4'
  },
  
  // Touch-optimized classes
  touchOptimized: {
    // Buttons with proper touch targets
    button: 'min-h-[48px] min-w-[48px] touch-manipulation select-none',
    input: 'min-h-[48px] touch-manipulation',
    
    // Lists with proper spacing
    listItem: 'min-h-[56px] px-4 py-3',
    
    // Cards optimized for touch
    card: 'touch-manipulation select-none active:scale-[0.98] transition-transform duration-150',
    
    // Modal optimizations
    modal: 'touch-manipulation overscroll-contain',
    
    // Scroll optimizations
    scrollContainer: 'overflow-auto -webkit-overflow-scrolling-touch overscroll-contain'
  }
}

// ============================================================================
// PERFORMANCE OPTIMIZATION HOOK
// ============================================================================

export const usePerformanceOptimization = () => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null)
  const [renderMode, setRenderMode] = useState<'optimized' | 'standard'>('standard')
  
  useEffect(() => {
    const detected = detectDeviceCapabilities()
    setCapabilities(detected)
    setRenderMode(detected.isLegacyiPad ? 'optimized' : 'standard')
  }, [])
  
  // Debounced render optimization
  const optimizeForLegacyDevice = useCallback((element: React.ReactNode) => {
    if (!capabilities?.isLegacyiPad) return element
    
    // Apply performance optimizations for legacy iPad
    return React.cloneElement(element as React.ReactElement, {
      style: {
        ...((element as React.ReactElement).props?.style || {}),
        willChange: 'auto', // Disable will-change for better performance
        transform: 'translateZ(0)', // Force hardware acceleration cautiously
        backfaceVisibility: 'hidden' // Reduce rendering complexity
      }
    })
  }, [capabilities])
  
  return {
    capabilities,
    renderMode,
    optimizeForLegacyDevice,
    shouldReduceMotion: capabilities?.recommendedAnimations === 'reduced',
    shouldOptimizeMemory: capabilities?.memoryLimit === 'low'
  }
}

// ============================================================================
// SAFARI 12 COMPATIBILITY FIXES
// ============================================================================

export const Safari12Compatibility = {
  // CSS Grid fallback for older Safari
  gridFallback: (gridClass: string) => {
    const capabilities = detectDeviceCapabilities()
    if (!capabilities.supportsModernCSS) {
      // Fallback to flexbox
      return gridClass.replace('grid', 'flex flex-wrap')
    }
    return gridClass
  },
  
  // Intersection Observer polyfill check
  hasIntersectionObserver: () => {
    return typeof window !== 'undefined' && 'IntersectionObserver' in window
  },
  
  // ResizeObserver polyfill check
  hasResizeObserver: () => {
    return typeof window !== 'undefined' && 'ResizeObserver' in window
  },
  
  // Touch events compatibility
  getTouchEventName: (eventType: 'start' | 'move' | 'end') => {
    const capabilities = detectDeviceCapabilities()
    if (!capabilities.supportsTouchEvents) {
      // Fallback to mouse events
      switch (eventType) {
        case 'start': return 'mousedown'
        case 'move': return 'mousemove'
        case 'end': return 'mouseup'
      }
    }
    
    switch (eventType) {
      case 'start': return 'touchstart'
      case 'move': return 'touchmove'
      case 'end': return 'touchend'
    }
  }
}

// ============================================================================
// MEMORY OPTIMIZATION UTILITIES
// ============================================================================

export const MemoryOptimization = {
  // Virtualization helper for large lists
  shouldVirtualizeList: (itemCount: number) => {
    const capabilities = detectDeviceCapabilities()
    if (capabilities.memoryLimit === 'low') {
      return itemCount > 20 // Virtualize lists with more than 20 items
    } else if (capabilities.memoryLimit === 'medium') {
      return itemCount > 100
    }
    return itemCount > 500
  },
  
  // Image optimization
  getOptimizedImageSrc: (src: string, width: number, height: number) => {
    const capabilities = detectDeviceCapabilities()
    if (capabilities.isLegacyiPad) {
      // Reduce image quality for legacy devices
      const quality = capabilities.memoryLimit === 'low' ? 0.7 : 0.8
      return `${src}?w=${width}&h=${height}&q=${quality}`
    }
    return `${src}?w=${width}&h=${height}&q=0.9`
  },
  
  // Component lazy loading threshold
  getLazyLoadThreshold: () => {
    const capabilities = detectDeviceCapabilities()
    if (capabilities.memoryLimit === 'low') {
      return '50px' // Load components when closer to viewport
    }
    return '200px'
  }
}

// ============================================================================
// TOUCH INTERFACE ENHANCEMENTS
// ============================================================================

export const TouchEnhancements = {
  // Enhanced touch feedback
  useTouchFeedback: () => {
    const [isPressed, setIsPressed] = useState(false)
    const capabilities = detectDeviceCapabilities()
    
    const touchHandlers = useMemo(() => ({
      onTouchStart: () => {
        setIsPressed(true)
        // Haptic feedback for devices that support it
        if (navigator.vibrate && capabilities.supportsTouchEvents) {
          navigator.vibrate(10) // Very brief vibration
        }
      },
      onTouchEnd: () => {
        setTimeout(() => setIsPressed(false), 150)
      },
      onTouchCancel: () => {
        setIsPressed(false)
      }
    }), [capabilities])
    
    return {
      touchHandlers,
      isPressed,
      touchStyle: isPressed ? { transform: 'scale(0.96)', opacity: 0.8 } : {}
    }
  },
  
  // Optimized scroll handling for iPad
  useOptimizedScroll: (containerRef: React.RefObject<HTMLElement>) => {
    useEffect(() => {
      const container = containerRef.current
      if (!container) return
      
      const capabilities = detectDeviceCapabilities()
      
      if (capabilities.isLegacyiPad) {
        // Add momentum scrolling and optimize for legacy devices
        ;(container.style as any).webkitOverflowScrolling = 'touch'
        container.style.overscrollBehavior = 'contain'
        
        // Debounce scroll events for better performance
        let scrollTimeout: number
        const handleScroll = () => {
          clearTimeout(scrollTimeout)
          scrollTimeout = window.setTimeout(() => {
            // Process scroll position changes
          }, 16) // ~60fps
        }
        
        container.addEventListener('scroll', handleScroll, { passive: true })
        
        return () => {
          container.removeEventListener('scroll', handleScroll)
        }
      }
    }, [containerRef])
  }
}

// ============================================================================
// OPTIMIZED COMPONENT WRAPPERS
// ============================================================================

interface OptimizedContainerProps {
  children: React.ReactNode
  className?: string
  enableVirtualization?: boolean
}

export const OptimizedContainer: React.FC<OptimizedContainerProps> = ({
  children,
  className = '',
  enableVirtualization = false
}) => {
  const { capabilities, renderMode } = usePerformanceOptimization()
  
  const optimizedClassName = useMemo(() => {
    let classes = className
    
    if (capabilities?.isLegacyiPad) {
      // Apply legacy optimizations
      classes += ' ' + iPadResponsiveUtils.touchOptimized.scrollContainer
      
      // Use simplified grid system
      if (classes.includes('grid')) {
        classes = Safari12Compatibility.gridFallback(classes)
      }
    }
    
    return classes
  }, [className, capabilities])
  
  const containerStyle = useMemo(() => {
    if (capabilities?.isLegacyiPad) {
      return {
        willChange: 'auto',
        backfaceVisibility: 'hidden' as const,
        transform: 'translateZ(0)'
      }
    }
    return {}
  }, [capabilities])
  
  return (
    <div className={optimizedClassName} style={containerStyle}>
      {children}
    </div>
  )
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export const PerformanceMonitoring = {
  // Track component render performance
  useRenderPerformance: (componentName: string) => {
    useEffect(() => {
      if (typeof performance !== 'undefined' && performance.mark) {
        performance.mark(`${componentName}-render-start`)
        
        return () => {
          performance.mark(`${componentName}-render-end`)
          performance.measure(
            `${componentName}-render-duration`,
            `${componentName}-render-start`,
            `${componentName}-render-end`
          )
        }
      }
    })
  },
  
  // Memory usage tracking
  trackMemoryUsage: () => {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      }
    }
    return null
  }
}

// ============================================================================
// ANIMATION OPTIMIZATION
// ============================================================================

export const AnimationOptimization = {
  // Get optimized animation classes based on device capability
  getAnimationClasses: (animationType: 'hover' | 'focus' | 'transition' = 'transition') => {
    const capabilities = detectDeviceCapabilities()
    
    if (capabilities.recommendedAnimations === 'reduced') {
      // Minimal animations for legacy devices
      return {
        hover: 'hover:opacity-80',
        focus: 'focus:ring-2 focus:ring-opacity-50',
        transition: 'transition-opacity duration-150'
      }[animationType]
    }
    
    // Full animations for capable devices
    return {
      hover: 'hover:scale-105 hover:shadow-lg',
      focus: 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      transition: 'transition-all duration-300 ease-in-out'
    }[animationType]
  },
  
  // CSS-in-JS animation styles
  getAnimationStyles: (type: 'subtle' | 'standard' | 'enhanced' = 'standard') => {
    const capabilities = detectDeviceCapabilities()
    
    const animations = {
      subtle: {
        transition: 'opacity 0.15s ease',
        transform: 'scale(1.01)'
      },
      standard: {
        transition: 'all 0.2s ease',
        transform: 'scale(1.02) translateY(-1px)'
      },
      enhanced: {
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'scale(1.05) translateY(-4px)'
      }
    }
    
    if (capabilities?.recommendedAnimations === 'reduced') {
      return animations.subtle
    }
    
    return animations[type]
  }
}

export default {
  detectDeviceCapabilities,
  iPadOptimizedTokens,
  iPadResponsiveUtils,
  usePerformanceOptimization,
  Safari12Compatibility,
  MemoryOptimization,
  TouchEnhancements,
  OptimizedContainer,
  PerformanceMonitoring,
  AnimationOptimization
}