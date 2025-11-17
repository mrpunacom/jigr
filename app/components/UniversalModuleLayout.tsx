/**
 * Universal Module Layout Component
 * 
 * Consolidates all module layout logic with flexible configuration options.
 * Eliminates duplication across module layouts while providing customization.
 * 
 * Features:
 * - Single authentication logic for all modules
 * - Configurable layout variants (default, fullwidth, centered, dashboard)
 * - Flexible padding and container options
 * - Universal background system (handled by ModuleHeader)
 * - Consistent loading states
 * - "Change once, affects all" approach
 */

'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserClient, UserClient } from '@/lib/auth-utils'
import { DeviceProvider } from '@/contexts/DeviceContext'
import { getModuleConfig, ModuleLayoutConfig } from '@/lib/module-config'
import ConsoleToggle from '@/app/components/ConsoleToggle'

// Default layout configuration
const DEFAULT_LAYOUT_CONFIG: ModuleLayoutConfig = {
  variant: 'default',
  padding: 'standard', 
  maxWidth: 'container',
  backgroundBehavior: 'universal'
}

interface UniversalModuleLayoutProps {
  children: ReactNode
  moduleName: string
  layoutOverride?: Partial<ModuleLayoutConfig>
  className?: string
}

// Layout variant components
function DefaultContainer({ children, padding, maxWidth }: { children: ReactNode; padding: string; maxWidth: string }) {
  const paddingClass = padding === 'compact' ? 'p-2' : padding === 'none' ? '' : 'px-4 sm:px-8 lg:px-12 py-6'
  const widthClass = maxWidth === 'full' ? 'w-full' : maxWidth === 'narrow' ? 'max-w-4xl mx-auto' : 'max-w-7xl mx-auto'
  
  return (
    <div className={`min-h-screen relative w-full ${paddingClass}`} style={{ zIndex: 5 }}>
      <div className={widthClass}>
        {children}
      </div>
    </div>
  )
}

function FullWidthContainer({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative w-full" style={{ zIndex: 5 }}>
      {children}
    </div>
  )
}

function CenteredContainer({ children, padding }: { children: ReactNode; padding: string }) {
  const paddingClass = padding === 'compact' ? 'p-4' : padding === 'none' ? '' : 'px-4 py-8'
  
  return (
    <div className={`min-h-screen relative w-full flex items-center justify-center ${paddingClass}`} style={{ zIndex: 5 }}>
      <div className="max-w-2xl w-full">
        {children}
      </div>
    </div>
  )
}

function DashboardContainer({ children, padding }: { children: ReactNode; padding: string }) {
  const paddingClass = padding === 'compact' ? 'p-4' : padding === 'none' ? '' : 'p-6'
  
  return (
    <div className={`min-h-screen relative w-full ${paddingClass}`} style={{ zIndex: 5 }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {children}
        </div>
      </div>
    </div>
  )
}

// Loading component
function ModuleLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

export function UniversalModuleLayout({ 
  children, 
  moduleName, 
  layoutOverride = {},
  className = ''
}: UniversalModuleLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userClient, setUserClient] = useState<UserClient | null>(null)
  const [loading, setLoading] = useState(true)

  // Get module configuration
  const moduleConfig = getModuleConfig(moduleName)
  const layoutConfig = { 
    ...DEFAULT_LAYOUT_CONFIG, 
    ...moduleConfig?.layoutConfig, 
    ...layoutOverride 
  }

  // Universal authentication logic
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          console.log(`${moduleName.toUpperCase()} LAYOUT: No authenticated session found`)
          router.push('/')
          return
        }

        const user = session.user
        console.log(`✅ ${moduleName.toUpperCase()} LAYOUT: Authenticated user found:`, user.email)
        setUser(user)
        
        // Load company info using reliable API
        try {
          const response = await fetch(`/api/user-client?userId=${user.id}`)
          
          if (response.ok) {
            const data = await response.json()
            const clientInfo = data.userClient
            
            console.log(`✅ ${moduleName.toUpperCase()} LAYOUT: Client info loaded via API:`, {
              name: clientInfo.name,
              hasAddress: !!clientInfo.address,
              hasLogoUrl: !!clientInfo.logo_url
            })
            
            setUserClient(clientInfo)
          } else {
            console.error(`❌ ${moduleName.toUpperCase()} LAYOUT: Failed to load client info via API:`, response.status)
          }
        } catch (error) {
          console.error(`❌ ${moduleName.toUpperCase()} LAYOUT: Error loading client info via API:`, error)
        }
        
        setLoading(false)
      } catch (error) {
        console.error(`❌ ${moduleName.toUpperCase()} LAYOUT: Error in loadUserData:`, error)
        setLoading(false)
      }
    }
    
    loadUserData()
  }, [router, moduleName])

  // Show loading state
  if (loading) {
    return <ModuleLoadingState />
  }

  // Render appropriate layout variant
  const renderLayoutVariant = () => {
    switch (layoutConfig.variant) {
      case 'fullwidth':
        return <FullWidthContainer>{children}</FullWidthContainer>
        
      case 'centered':
        return <CenteredContainer padding={layoutConfig.padding}>{children}</CenteredContainer>
        
      case 'dashboard':
        return <DashboardContainer padding={layoutConfig.padding}>{children}</DashboardContainer>
        
      case 'default':
      default:
        return (
          <DefaultContainer 
            padding={layoutConfig.padding} 
            maxWidth={layoutConfig.maxWidth}
          >
            {children}
          </DefaultContainer>
        )
    }
  }

  return (
    <DeviceProvider userId={user?.id}>
      <div className={`min-h-screen relative ${className}`} style={{ background: 'transparent' }}>
        {/* Universal background is now handled by ModuleHeader component */}
        {/* No background logic needed here - keeps layouts clean */}
        
        {renderLayoutVariant()}
        
        {/* Console Toggle for Development */}
        <ConsoleToggle />
      </div>
    </DeviceProvider>
  )
}

// Convenience wrapper for standard modules
export function StandardModuleLayout({ children, moduleName }: { children: ReactNode; moduleName: string }) {
  return (
    <UniversalModuleLayout moduleName={moduleName}>
      {children}
    </UniversalModuleLayout>
  )
}

// Convenience wrapper for dashboard modules  
export function DashboardModuleLayout({ children, moduleName }: { children: ReactNode; moduleName: string }) {
  return (
    <UniversalModuleLayout 
      moduleName={moduleName}
      layoutOverride={{ variant: 'dashboard' }}
    >
      {children}
    </UniversalModuleLayout>
  )
}

// Convenience wrapper for full-width modules
export function FullWidthModuleLayout({ children, moduleName }: { children: ReactNode; moduleName: string }) {
  return (
    <UniversalModuleLayout 
      moduleName={moduleName}
      layoutOverride={{ variant: 'fullwidth', padding: 'none' }}
    >
      {children}
    </UniversalModuleLayout>
  )
}