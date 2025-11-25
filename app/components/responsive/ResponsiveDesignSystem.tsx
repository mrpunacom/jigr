'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface BreakpointContext {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLargeDesktop: boolean
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
  isTouch: boolean
}

const ResponsiveContext = createContext<BreakpointContext | null>(null)

interface ResponsiveProviderProps {
  children: ReactNode
}

export function ResponsiveProvider({ children }: ResponsiveProviderProps) {
  const [context, setContext] = useState<BreakpointContext>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
    width: 0,
    height: 0,
    orientation: 'portrait',
    isTouch: false
  })

  useEffect(() => {
    const updateContext = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setContext({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024 && width < 1440,
        isLargeDesktop: width >= 1440,
        width,
        height,
        orientation: width > height ? 'landscape' : 'portrait',
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
      })
    }

    updateContext()
    window.addEventListener('resize', updateContext)
    window.addEventListener('orientationchange', updateContext)

    return () => {
      window.removeEventListener('resize', updateContext)
      window.removeEventListener('orientationchange', updateContext)
    }
  }, [])

  return (
    <ResponsiveContext.Provider value={context}>
      {children}
    </ResponsiveContext.Provider>
  )
}

export function useResponsive() {
  const context = useContext(ResponsiveContext)
  if (!context) {
    throw new Error('useResponsive must be used within ResponsiveProvider')
  }
  return context
}

// Responsive grid component
interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
    largeDesktop?: number
  }
  gap?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
}

export function ResponsiveGrid({ 
  children, 
  className = '', 
  cols = { mobile: 1, tablet: 2, desktop: 3, largeDesktop: 4 },
  gap = { mobile: 4, tablet: 6, desktop: 6 }
}: ResponsiveGridProps) {
  const responsive = useResponsive()
  
  const getColumns = () => {
    if (responsive.isMobile) return cols.mobile || 1
    if (responsive.isTablet) return cols.tablet || 2
    if (responsive.isDesktop) return cols.desktop || 3
    return cols.largeDesktop || 4
  }

  const getGap = () => {
    if (responsive.isMobile) return gap.mobile || 4
    if (responsive.isTablet) return gap.tablet || 6
    return gap.desktop || 6
  }

  return (
    <div 
      className={`grid ${className}`}
      style={{
        gridTemplateColumns: `repeat(${getColumns()}, minmax(0, 1fr))`,
        gap: `${getGap() * 0.25}rem`
      }}
    >
      {children}
    </div>
  )
}

// Responsive container component
interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: {
    mobile?: string
    tablet?: string
    desktop?: string
    largeDesktop?: string
  }
  padding?: {
    mobile?: string
    tablet?: string
    desktop?: string
  }
}

export function ResponsiveContainer({ 
  children, 
  className = '',
  maxWidth = { mobile: '100%', tablet: '768px', desktop: '1024px', largeDesktop: '1440px' },
  padding = { mobile: '1rem', tablet: '1.5rem', desktop: '2rem' }
}: ResponsiveContainerProps) {
  const responsive = useResponsive()
  
  const getMaxWidth = () => {
    if (responsive.isMobile) return maxWidth.mobile
    if (responsive.isTablet) return maxWidth.tablet
    if (responsive.isDesktop) return maxWidth.desktop
    return maxWidth.largeDesktop
  }

  const getPadding = () => {
    if (responsive.isMobile) return padding.mobile
    if (responsive.isTablet) return padding.tablet
    return padding.desktop
  }

  return (
    <div 
      className={`mx-auto ${className}`}
      style={{
        maxWidth: getMaxWidth(),
        padding: getPadding()
      }}
    >
      {children}
    </div>
  )
}

// Touch-optimized button component
interface TouchButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export function TouchButton({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary', 
  size = 'md', 
  disabled = false 
}: TouchButtonProps) {
  const responsive = useResponsive()
  
  const getMinHeight = () => {
    if (responsive.isTouch) {
      switch (size) {
        case 'sm': return '44px'
        case 'lg': return '56px'
        default: return '48px'
      }
    }
    switch (size) {
      case 'sm': return '36px'
      case 'lg': return '48px'
      default: return '40px'
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white'
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-900'
      case 'ghost':
        return 'hover:bg-gray-100 text-gray-700'
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const getPadding = () => {
    if (responsive.isTouch) {
      switch (size) {
        case 'sm': return 'px-3 py-2'
        case 'lg': return 'px-6 py-4'
        default: return 'px-4 py-3'
      }
    }
    switch (size) {
      case 'sm': return 'px-2 py-1'
      case 'lg': return 'px-4 py-3'
      default: return 'px-3 py-2'
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-lg font-medium transition-colors
        ${getVariantClasses()}
        ${getPadding()}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
        ${responsive.isTouch ? 'select-none' : ''}
        ${className}
      `}
      style={{
        minHeight: getMinHeight(),
        minWidth: responsive.isTouch ? getMinHeight() : 'auto'
      }}
    >
      {children}
    </button>
  )
}

// Responsive text component
interface ResponsiveTextProps {
  children: ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
  size?: {
    mobile?: string
    tablet?: string
    desktop?: string
  }
  weight?: string
  className?: string
}

export function ResponsiveText({ 
  children, 
  as = 'p', 
  size = { mobile: 'text-sm', tablet: 'text-base', desktop: 'text-base' },
  weight = 'font-normal',
  className = ''
}: ResponsiveTextProps) {
  const responsive = useResponsive()
  const Component = as

  const getFontSize = () => {
    if (responsive.isMobile) return size.mobile
    if (responsive.isTablet) return size.tablet
    return size.desktop
  }

  return (
    <Component className={`${getFontSize()} ${weight} ${className}`}>
      {children}
    </Component>
  )
}

// Mobile drawer component
interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  position?: 'left' | 'right' | 'bottom'
}

export function MobileDrawer({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  position = 'left' 
}: MobileDrawerProps) {
  const responsive = useResponsive()

  const getPositionClasses = () => {
    switch (position) {
      case 'right':
        return 'right-0 top-0 h-full w-80'
      case 'bottom':
        return 'bottom-0 left-0 right-0 max-h-[80vh]'
      default:
        return 'left-0 top-0 h-full w-80'
    }
  }

  const getTransformClasses = () => {
    if (!isOpen) {
      switch (position) {
        case 'right':
          return 'translate-x-full'
        case 'bottom':
          return 'translate-y-full'
        default:
          return '-translate-x-full'
      }
    }
    return 'translate-x-0 translate-y-0'
  }

  if (!responsive.isMobile && !responsive.isTablet) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div 
        className={`
          fixed z-50 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${getPositionClasses()}
          ${getTransformClasses()}
        `}
      >
        {title && (
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        <div className="p-4 overflow-y-auto max-h-full">
          {children}
        </div>
      </div>
    </>
  )
}

// Responsive navigation component
interface ResponsiveNavItem {
  label: string
  href: string
  icon?: ReactNode
  isActive?: boolean
}

interface ResponsiveNavigationProps {
  items: ResponsiveNavItem[]
  className?: string
}

export function ResponsiveNavigation({ items, className = '' }: ResponsiveNavigationProps) {
  const responsive = useResponsive()

  if (responsive.isMobile) {
    // Mobile bottom navigation
    return (
      <nav className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 ${className}`}>
        <div className="grid grid-cols-4 max-w-md mx-auto">
          {items.slice(0, 4).map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`
                flex flex-col items-center justify-center py-2 px-1 text-xs
                ${item.isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              style={{ minHeight: '60px' }}
            >
              {item.icon && <div className="mb-1">{item.icon}</div>}
              <span className="truncate">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    )
  }

  if (responsive.isTablet) {
    // Tablet horizontal navigation
    return (
      <nav className={`bg-white border-b border-gray-200 ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-6 overflow-x-auto">
            {items.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className={`
                  flex items-center space-x-2 px-3 py-4 text-sm font-medium whitespace-nowrap
                  ${item.isActive 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </nav>
    )
  }

  // Desktop sidebar navigation
  return (
    <nav className={`w-64 bg-white border-r border-gray-200 ${className}`}>
      <div className="p-4 space-y-2">
        {items.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={`
              flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium
              ${item.isActive 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            {item.icon}
            <span>{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  )
}