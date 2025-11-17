/**
 * Universal Page Wrapper Component
 * 
 * Provides consistent page structure across all modules while preserving
 * individual page content uniqueness. Acts as a "picture frame" - universal
 * structure with unique content inside.
 * 
 * Features:
 * - Universal container padding and spacing
 * - Automatic ModuleHeader integration  
 * - Flexible content area for page-specific content
 * - Responsive design built-in
 * - Optional layout variants for special pages
 * - "Change once, affects all" for page structure
 */

'use client'

import { ReactNode } from 'react'
import { getModuleConfig } from '@/lib/module-config'
import { ModuleHeader } from './ModuleHeader'
import { SPACING } from '@/lib/apple-design-system'

interface OnboardingData {
  userFirstName: string
}

// Page layout variants for special cases
type PageVariant = 
  | 'default'        // Standard page with header + content
  | 'fullwidth'      // Full width content (no side padding) 
  | 'centered'       // Centered content for forms/login
  | 'dashboard'      // Grid-based console layout (every module has one)
  | 'compact'        // Reduced padding for dense content

// Container size options
type ContainerSize = 'narrow' | 'normal' | 'wide' | 'full'

interface UniversalPageWrapperProps {
  children: ReactNode
  moduleName: string
  currentPage: string
  
  // Optional customization
  variant?: PageVariant
  containerSize?: ContainerSize
  className?: string
  onboardingData?: OnboardingData
  
  // Advanced options
  hideHeader?: boolean
  customHeader?: ReactNode
  topSpacing?: 'none' | 'small' | 'normal' | 'large'
}

// Apple HIG spacing configurations
const VARIANT_CLASSES = {
  default: 'flex flex-col min-h-screen',
  fullwidth: 'flex flex-col min-h-screen',
  centered: 'flex items-center justify-center min-h-screen',
  dashboard: 'flex flex-col min-h-screen',
  compact: 'flex flex-col min-h-screen'
}

const CONTAINER_CLASSES = {
  narrow: 'max-w-4xl mx-auto w-full',
  normal: 'max-w-7xl mx-auto w-full', 
  wide: 'max-w-8xl mx-auto w-full',
  full: 'w-full'
}

// Apple HIG spacing values in pt converted to CSS
const HIG_SPACING = {
  none: { paddingTop: '0' },
  small: { paddingTop: SPACING.SM },
  normal: { paddingTop: SPACING.LG }, 
  large: { paddingTop: SPACING.XL }
}

// Apple HIG container padding (16pt header clearance, 8pt sides, 8pt bottom)
const CONTAINER_STYLE = {
  paddingTop: '64pt', // Header clearance
  paddingLeft: SPACING.LG,
  paddingRight: SPACING.LG,
  paddingBottom: SPACING.LG
}

// Compact variant uses smaller padding
const COMPACT_STYLE = {
  paddingTop: '48pt', // Reduced header clearance
  paddingLeft: SPACING.MD,
  paddingRight: SPACING.MD,
  paddingBottom: SPACING.MD
}

// Centered variant for forms/auth
const CENTERED_STYLE = {
  paddingTop: '64pt',
  paddingLeft: SPACING.MD,
  paddingRight: SPACING.MD,
  paddingBottom: SPACING.LG
}

export function UniversalPageWrapper({
  children,
  moduleName,
  currentPage,
  variant = 'default',
  containerSize = 'normal',
  className = '',
  onboardingData,
  hideHeader = false,
  customHeader,
  topSpacing = 'normal'
}: UniversalPageWrapperProps) {
  
  // Get module configuration
  const moduleConfig = getModuleConfig(moduleName)
  
  if (!moduleConfig) {
    console.warn(`UniversalPageWrapper: Module '${moduleName}' not found`)
    return <div className="p-4 text-red-600">Module configuration not found: {moduleName}</div>
  }

  // Get styling classes and Apple HIG spacing
  const variantClass = VARIANT_CLASSES[variant]
  const containerClass = CONTAINER_CLASSES[containerSize]
  const topSpacingStyle = HIG_SPACING[topSpacing]
  
  // Determine container padding based on variant
  const getContainerStyle = () => {
    switch (variant) {
      case 'compact':
        return { ...COMPACT_STYLE, ...topSpacingStyle }
      case 'centered':
        return { ...CENTERED_STYLE, ...topSpacingStyle }
      case 'fullwidth':
        return { 
          ...topSpacingStyle,
          paddingBottom: SPACING.LG
        }
      default:
        return { ...CONTAINER_STYLE, ...topSpacingStyle }
    }
  }

  // Special handling for centered variant
  if (variant === 'centered') {
    return (
      <div className={`${variantClass} ${className}`} style={getContainerStyle()}>
        <div className={containerClass}>
          {!hideHeader && !customHeader && (
            <div style={{ marginBottom: SPACING.LG }}>
              <ModuleHeader 
                module={moduleConfig}
                currentPage={currentPage}
                onboardingData={onboardingData}
              />
            </div>
          )}
          
          {customHeader && (
            <div style={{ marginBottom: SPACING.LG }}>
              {customHeader}
            </div>
          )}
          
          <div className="w-full max-w-2xl">
            {children}
          </div>
        </div>
      </div>
    )
  }

  // Dashboard variant - let children control their own layout
  if (variant === 'dashboard') {
    return (
      <div className={`${variantClass} ${className}`} style={getContainerStyle()}>
        {!hideHeader && !customHeader && (
          <ModuleHeader 
            module={moduleConfig}
            currentPage={currentPage}
            onboardingData={onboardingData}
          />
        )}
        
        {customHeader && customHeader}
        
        <div className={containerClass}>
          {children}
        </div>
      </div>
    )
  }

  // Default, fullwidth, and compact variants
  return (
    <div className={`${variantClass} ${className}`} style={getContainerStyle()}>
      {!hideHeader && !customHeader && (
        <ModuleHeader 
          module={moduleConfig}
          currentPage={currentPage}
          onboardingData={onboardingData}
        />
      )}
      
      {customHeader && customHeader}
      
      <div className={containerClass}>
        {children}
      </div>
    </div>
  )
}

// Convenience wrapper for standard pages (most common use case)
export function StandardPageWrapper({ 
  children, 
  moduleName, 
  currentPage,
  onboardingData 
}: { 
  children: ReactNode
  moduleName: string
  currentPage: string
  onboardingData?: OnboardingData
}) {
  return (
    <UniversalPageWrapper 
      moduleName={moduleName} 
      currentPage={currentPage}
      onboardingData={onboardingData}
    >
      {children}
    </UniversalPageWrapper>
  )
}

// Convenience wrapper for console pages (dashboard for each module)
export function ConsolePageWrapper({ 
  children, 
  moduleName, 
  currentPage = 'console',
  onboardingData 
}: { 
  children: ReactNode
  moduleName: string
  currentPage?: string
  onboardingData?: OnboardingData
}) {
  return (
    <UniversalPageWrapper 
      variant="dashboard"
      moduleName={moduleName} 
      currentPage={currentPage}
      onboardingData={onboardingData}
    >
      {children}
    </UniversalPageWrapper>
  )
}

// Alias for backward compatibility 
export const DashboardPageWrapper = ConsolePageWrapper

// Convenience wrapper for full-width pages
export function FullWidthPageWrapper({ 
  children, 
  moduleName, 
  currentPage,
  onboardingData 
}: { 
  children: ReactNode
  moduleName: string
  currentPage: string
  onboardingData?: OnboardingData
}) {
  return (
    <UniversalPageWrapper 
      variant="fullwidth"
      containerSize="full"
      moduleName={moduleName} 
      currentPage={currentPage}
      onboardingData={onboardingData}
    >
      {children}
    </UniversalPageWrapper>
  )
}

// Convenience wrapper for form/auth pages  
export function CenteredPageWrapper({ 
  children, 
  moduleName, 
  currentPage,
  hideHeader = true 
}: { 
  children: ReactNode
  moduleName: string
  currentPage: string
  hideHeader?: boolean
}) {
  return (
    <UniversalPageWrapper 
      variant="centered"
      moduleName={moduleName} 
      currentPage={currentPage}
      hideHeader={hideHeader}
    >
      {children}
    </UniversalPageWrapper>
  )
}