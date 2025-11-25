'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DesignTokens, getTextStyle } from '@/lib/design-system'
import { getMappedIcon, getUIIcon } from '@/lib/image-storage'
import { supabase } from '@/lib/supabase'
import { getVersionDisplay } from '@/lib/version'
import { logger } from '@/lib/console-utils'
import { useDevice } from '@/contexts/DeviceContext'
import { ModulesPopOut } from './ModulesPopOut'

interface SidebarNavItem {
  name: string
  href: string
  icon: string
  section: 'quickActions' | 'modules' | 'settings'
  context?: 'admin' | 'console' | 'both' | 'upload' | 'operations'
  roles?: string[] // Optional: restrict to specific user roles
  champion_only?: boolean // Optional: only show for Hero enrolled users
  subItems?: SidebarSubItem[]
}

interface SidebarSubItem {
  name: string
  href: string
  icon?: string
}

interface AppleSidebarProps {
  user?: any
  userClient?: any
  onSignOut?: () => void
  logoUrl?: string
  activeSection: 'admin' | 'console' | 'upload'
  currentUploadPage?: 'console' | 'capture' | 'reports' | 'training'
  onBackgroundSelectorToggle?: () => void
}

const sidebarNavigation: SidebarNavItem[] = [
  // Modules - Following Three-Page One-Word Convention
  { 
    name: 'Upload', 
    href: '/upload/console', 
    icon: '/icons/JiGRcamera.png', 
    section: 'modules', 
    context: 'both',
    subItems: [
      { name: 'Console', href: '/upload/console', icon: '📊' },
      { name: 'Capture', href: '/upload/capture', icon: '📤' },
      { name: 'Reports', href: '/upload/reports', icon: '📋' },
      { name: 'Training', href: '/upload/training', icon: '🎯' }
    ]
  },
  
  // Operations Quick Actions (updated from legacy console routes)
  { name: 'Upload', href: '/operations/upload', icon: '/icons/JiGRuploadWhite.png', section: 'quickActions', context: 'operations' },
  { name: 'Reports', href: '/operations/reports', icon: '/icons/JiGRcamera.png', section: 'quickActions', context: 'operations' },
  { name: 'Company', href: '/admin/company', icon: '/icons/JiGRadmin.png', section: 'quickActions', context: 'admin' },
  
  // Future Modules
  { name: 'Temperature', href: '/modules/temperature', icon: '/ModuleIcons/JiGRtemps.png', section: 'modules', context: 'both' },
  { name: 'Analytics', href: '/modules/analytics', icon: '/ModuleIcons/JiGRstock.png', section: 'modules', context: 'both' },
  
  // Settings
  { name: 'Settings', href: '/admin/company-settings', icon: '/icons/JiGRadmin.png', section: 'settings', context: 'both' },
  { name: 'Profile', href: '/admin/profile', icon: '/icons/JiGRadmin.png', section: 'settings', context: 'both' },
  { name: 'Heroes Program', href: '/champion/program', icon: '🏆', section: 'settings', context: 'both', champion_only: true },
]

export default function AppleSidebar({ 
  user, 
  userClient, 
  onSignOut, 
  logoUrl, 
  activeSection,
  currentUploadPage,
  onBackgroundSelectorToggle 
}: AppleSidebarProps) {
  const pathname = usePathname()
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [showModulesPopOut, setShowModulesPopOut] = useState(false)
  const [modulesButtonRef, setModulesButtonRef] = useState<HTMLElement | null>(null)
  
  // Use device context instead of manual detection
  const {
    isMobile,
    isTablet,
    isIPad,
    isIPadPro,
    isIPadAir,
    isPortrait,
    isIOSCompatible,
    sidebarCollapsed,
    setSidebarCollapsed,
    contentOffset
  } = useDevice()
  
  // Use only real userClient data - no demo fallbacks
  const effectiveUserClient = userClient
  
  // Effective logo URL prioritizes: passed logoUrl > userClient.logo_url > JiGR default
  const effectiveLogoUrl = logoUrl || userClient?.logo_url || "/JiGR_Logo-full_figma_circle.png"

  // Fetch user avatar
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (user?.id) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single()
          
          if (profileData?.avatar_url) {
            setUserAvatar(profileData.avatar_url)
          }
        } catch (error) {
          logger.debug('Could not fetch user avatar', error)
        }
      }
    }
    
    fetchUserAvatar()

    // Listen for avatar updates
    const handleAvatarUpdate = (event: any) => {
      const { avatarUrl } = event.detail
      setUserAvatar(avatarUrl)
    }

    window.addEventListener('userAvatarUpdated', handleAvatarUpdate)
    
    return () => {
      window.removeEventListener('userAvatarUpdated', handleAvatarUpdate)
    }
  }, [user?.id])

  // No longer needed - device detection handled by DeviceContext

  // Filter items by section, context, user role, and champion status
  const filterByRoleAndContext = (item: SidebarNavItem) => {
    // Check context
    const contextMatch = item.context === activeSection || item.context === 'both'
    // Check role (if roles are specified, user must have one of them)
    const roleMatch = !item.roles || (effectiveUserClient?.role && item.roles.includes(effectiveUserClient.role))
    // Check champion status (if champion_only is true, user must be champion enrolled)
    const championMatch = !item.champion_only || effectiveUserClient?.champion_enrolled === true
    return contextMatch && roleMatch && championMatch
  }

  const quickActionItems = sidebarNavigation.filter(item => 
    item.section === 'quickActions' && filterByRoleAndContext(item)
  )
  
  const moduleItems = sidebarNavigation.filter(item => 
    item.section === 'modules' && filterByRoleAndContext(item)
  )
  
  const settingsItems = sidebarNavigation.filter(item => 
    item.section === 'settings' && filterByRoleAndContext(item)
  )

  return (
    <>
      {/* Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-full bg-black/10 backdrop-blur-xl transition-all duration-5000 ease-in-out z-40 TouchTarget ${
          sidebarCollapsed ? 'w-[150px] shadow-lg' : 'w-[400px] shadow-[0_0_50px_rgba(0,0,0,0.5)]'
        } ${isIPad ? 'AppleSidebar' : ''}`}
        onTouchStart={(e) => {
          if (isIPad && !isPortrait) {
            if (sidebarCollapsed) {
              setSidebarCollapsed(false)
            } else {
              setTouchStartX(e.touches[0].clientX)
            }
          }
        }}
        onTouchMove={(e) => {
          if (isIPad && !isPortrait && !sidebarCollapsed && touchStartX !== null) {
            const currentX = e.touches[0].clientX
            const deltaX = currentX - touchStartX
            // If swiping left more than 50px, close sidebar
            if (deltaX < -50) {
              setSidebarCollapsed(true)
              setTouchStartX(null)
            }
          }
        }}
        onTouchEnd={() => {
          setTouchStartX(null)
        }}
      >
        
        {/* Header - Company Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src={effectiveLogoUrl}
                alt={logoUrl ? "Company Logo" : "JiGR Default Logo"} 
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  logger.error('Company logo failed to load:', effectiveLogoUrl);
                  e.currentTarget.src = "https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/JiGRlogo.png";
                }}
                onLoad={() => {
                  logger.debug('SIDEBAR: Company logo loaded successfully:', effectiveLogoUrl);
                }}
              />
            </div>
          </div>
        </div>

        {/* Upload Module Navigation - REMOVED: Nav pills handle this functionality */}

        {/* Navigation Sections - Three Equal Thirds */}
        <div className="flex-1 flex flex-col">
          
          {/* TOP THIRD: QUICK ACTIONS */}
          <div className="flex-1 flex flex-col justify-center py-2">
            <nav className={sidebarCollapsed ? 'space-y-2' : 'space-y-1 px-3'}>
              {/* Camera Icon - Centered */}
              <div className="flex justify-center">
                <button 
                  onClick={() => {
                    window.location.href = '/upload/capture'
                    // Trigger camera capture after navigation
                    setTimeout(() => {
                      const cameraButton = document.querySelector('[data-camera-trigger]') as HTMLButtonElement
                      if (cameraButton) cameraButton.click()
                    }, 500)
                  }}
                  className={`flex justify-center items-center py-2 hover:bg-white/10 rounded-lg transition-all duration-200 TouchTarget ${
                    isIPad ? 'min-h-[44px] px-2' : ''
                  }`}
                  title="Quick Camera - Capture documents instantly"
                >
                  <img 
                    src={getMappedIcon('JiGRcamera', sidebarCollapsed ? 48 : 64)} 
                    alt="Camera" 
                    className={sidebarCollapsed ? 'w-12 h-12 object-contain' : 'w-16 h-16 object-contain'}
                  />
                  {!sidebarCollapsed && (
                    <span className="hidden sm:block md:block ml-2 text-white text-sm font-medium">Camera</span>
                  )}
                </button>
              </div>
            </nav>
          </div>

          {/* Separator Line */}
          <div className="flex justify-center py-2">
            <div className="w-[60%] h-px bg-white/20"></div>
          </div>

          {/* MIDDLE THIRD: MODULES */}
          <div className="flex-1 flex flex-col justify-center py-2">
            <nav className="space-y-2">
              {/* Modules icon with click to show pop-out */}
              <div 
                ref={(el) => setModulesButtonRef(el)}
                className="flex justify-center items-center py-3 cursor-pointer hover:bg-white/10 rounded-lg transition-all duration-200"
                onClick={() => setShowModulesPopOut(true)}
                title="Click to view modules"
              >
                <img 
                  src={getMappedIcon('JiGRmodules', 48)} 
                  alt="Modules" 
                  className="w-12 h-12 object-contain brightness-0 invert"
                  onError={(e) => {
                    logger.error('Failed to load JiGRmodules.png:', e);
                    e.currentTarget.style.display = 'none';
                  }}
                  onLoad={() => logger.debug('JiGRmodules.png loaded successfully')}
                />
              </div>
            </nav>
          </div>

          {/* Separator Line */}
          <div className="flex justify-center py-2">
            <div className="w-[60%] h-px bg-white/20"></div>
          </div>

          {/* BOTTOM THIRD: HIDE BUTTON, SETTINGS, USER AVATAR, VERSION */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="pb-4">
              <nav className={sidebarCollapsed ? 'space-y-2' : 'space-y-1 px-3'}>
                {/* Hide/Show Sidebar Button */}
                <button 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="flex justify-center items-center py-2 hover:bg-white/10 rounded-lg transition-all duration-200 w-full TouchTarget"
                  title={sidebarCollapsed ? "Expand sidebar" : "Hide sidebar"}
                >
                  <img 
                    src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/hide.png"
                    alt={sidebarCollapsed ? "Expand" : "Hide"} 
                    className={`w-12 h-12 object-contain transition-transform duration-200 ${sidebarCollapsed ? '' : 'rotate-180'}`}
                  />
                </button>
                
                <button 
                  onClick={() => window.location.href = '/admin/console'}
                  className="flex justify-center items-center py-2 hover:bg-white/10 rounded-lg transition-all duration-200 w-full"
                  title="Admin - Company management and settings"
                >
                  <img 
                    src={getMappedIcon('JiGRadmin', 48)} 
                    alt="Admin" 
                    className="w-12 h-12 object-contain"
                  />
                </button>
                
                {/* User Avatar - Personal profile picture */}
                <div className="flex justify-center items-center py-2">
                  <div className="relative">
                    <div 
                      className={`bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 overflow-hidden flex-shrink-0 w-12 h-12 cursor-pointer hover:bg-white/30 transition-all duration-200`}
                      onClick={() => window.location.href = '/admin/profile'}
                      title={`User Profile - Edit your profile information${effectiveUserClient?.champion_enrolled ? ' | Hero User' : ''}`}
                    >
                    {userAvatar ? (
                      <img 
                        src={userAvatar} 
                        alt="User Avatar" 
                        className="w-full h-full object-cover"
                        onLoad={() => logger.debug('SIDEBAR: User avatar loaded successfully')}
                        onError={() => logger.debug('SIDEBAR: User avatar failed to load, showing initials')}
                      />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </span>
                    )}
                    </div>
                    
                    {/* Hero Badge - show for champion users or development */}
                    {(userClient?.champion_enrolled || userClient?.role === 'OWNER') && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center border-2 border-white/30 shadow-lg">
                        <img 
                          src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/branding/trophy.svg"
                          alt="JiGR Hero Member"
                          className="w-4 h-4 object-contain"
                          title="JiGR Hero Member"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </nav>
              
              {/* System Status Icon */}
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center mb-2 mt-4' : 'justify-center mb-1 mt-8'}`}>
                <div className="flex items-center space-x-2" title="System Status - All services operational">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  {!sidebarCollapsed && (
                    <span className="text-emerald-300 text-xs font-medium">
                      System Online
                    </span>
                  )}
                </div>
              </div>
              
              {/* Version Number */}
              <div className="text-center mb-4">
                <span className="text-white/30 text-xs font-mono" title={`Application Version - ${getVersionDisplay()}`}>{getVersionDisplay()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Overlay when sidebar is expanded */}
      {!sidebarCollapsed && (
        <div 
          className={`fixed inset-0 bg-black/20 z-30 transition-opacity duration-300 ${
            isMobile ? 'md:hidden' : isIPad ? 'block' : 'hidden md:block'
          }`}
          onClick={() => setSidebarCollapsed(true)}
          onTouchStart={() => isIPad && setSidebarCollapsed(true)}
        />
      )}

      {/* Mobile Expand Button */}
      {isMobile && sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="fixed top-4 left-[160px] z-40 p-2 bg-black/20 backdrop-blur-sm border border-white/30 rounded-lg text-white/60 hover:text-white hover:bg-black/30 transition-all duration-200 md:hidden"
          title="Open Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Modules Pop-out */}
      <ModulesPopOut 
        isVisible={showModulesPopOut}
        onClose={() => setShowModulesPopOut(false)}
        triggerElement={modulesButtonRef}
      />
    </>
  )
}