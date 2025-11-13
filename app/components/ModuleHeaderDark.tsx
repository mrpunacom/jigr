/**
 * ModuleHeader Dark Variant with Background Images
 * 
 * Simple header for module pages with title, subtitle and background image support
 * Also includes the complex header for full module navigation (legacy support)
 */

'use client'

import Image from 'next/image'
import { useState, useContext, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getTextStyle } from '@/lib/design-system'
import { ModuleConfig } from '@/lib/module-config'
import { HamburgerDropdown } from './HamburgerDropdown'
import { UserAvatarDropdown } from './UserAvatarDropdown'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/console-utils'

interface OnboardingData {
  userFirstName: string
}

// Simple header props (used by most pages)
interface SimpleModuleHeaderDarkProps {
  title: string
  subtitle: string
  backgroundImage?: string
  className?: string
}

// Complex header props (used by main module pages with navigation)
interface ComplexModuleHeaderDarkProps {
  module: ModuleConfig
  currentPage: string
  className?: string
  onboardingData?: OnboardingData
  user?: any
  userClient?: any
  onSignOut?: () => void
  backgroundImage?: string
}

// Union type for overloaded component
type ModuleHeaderDarkProps = SimpleModuleHeaderDarkProps | ComplexModuleHeaderDarkProps

// Background image mapping
const BACKGROUND_IMAGES = {
  // Module backgrounds
  'ADMIN': 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/backgrounds/adminBG.webp',
  'UPLOAD': 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/backgrounds/uploadBG.webp',
  'COUNT': 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/backgrounds/countBG.webp',
  'STOCK': 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/backgrounds/stockBG.webp',
  'RECIPES': 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/backgrounds/recipesBG.webp',
  'MENU': 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/backgrounds/menusBG.webp',
  
  // Sub-page backgrounds
  'SUBRECIPE': 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/backgrounds/subrecipeBG.webp',
  'PRODUCTION': 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/backgrounds/productionBG.webp',
  'VENDORS': 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/backgrounds/vendorsBG.webp',
  
  // Special pages
  'LANDING': 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/backgrounds/landingBG.webp',
  'ONBOARDING': 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/backgrounds/onboardingBG.webp',
}

// Helper function to determine if current page has watermarked background
function isWatermarkedPage(pathname: string): boolean {
  // Based on BackgroundManager.ts logic
  return pathname.startsWith('/admin') || pathname.startsWith('/upload')
}

// Helper function to determine background image
function getBackgroundImage(title: string, subtitle?: string): string {
  // ADMIN pages should NOT have background images for better readability
  if (title.includes('Admin') || title === 'ADMIN' || title === 'Admin') {
    return '' // Return empty string for no background
  }
  
  // Direct mapping for specific titles
  if (title === 'Vendors' || title === 'Vendor Management') {
    return BACKGROUND_IMAGES.VENDORS
  }
  if (title === 'Sub-Recipes' || subtitle?.includes('Sub-Recipe')) {
    return BACKGROUND_IMAGES.SUBRECIPE
  }
  if (title === 'Production Recording' || title.includes('Production')) {
    return BACKGROUND_IMAGES.PRODUCTION
  }
  
  // Module-based mapping
  if (title.includes('Recipe') || title === 'Recipes') {
    return BACKGROUND_IMAGES.RECIPES
  }
  if (title.includes('Menu') || title === 'Menu Pricing' || title === 'Menu Engineering' || title === 'Menu Analysis') {
    return BACKGROUND_IMAGES.MENU
  }
  if (title.includes('Stock') || title === 'Stock') {
    return BACKGROUND_IMAGES.STOCK
  }
  if (title.includes('Count') || title === 'Count') {
    return BACKGROUND_IMAGES.COUNT
  }
  if (title.includes('Upload') || title === 'Upload') {
    return BACKGROUND_IMAGES.UPLOAD
  }
  
  // Default fallback
  return BACKGROUND_IMAGES.LANDING
}

// Type guard to check if props are for simple header
function isSimpleHeader(props: ModuleHeaderDarkProps): props is SimpleModuleHeaderDarkProps {
  return 'title' in props && 'subtitle' in props && !('module' in props)
}

// Simple header component
function SimpleModuleHeaderDark({ title, subtitle, backgroundImage, className = '' }: SimpleModuleHeaderDarkProps) {
  const pathname = usePathname()
  const bgImage = backgroundImage || getBackgroundImage(title, subtitle)
  const hasBackground = bgImage && bgImage.length > 0
  const isWatermarked = isWatermarkedPage(pathname)
  
  // Determine text styling based on watermark status
  const textColorClass = isWatermarked || !hasBackground ? 'text-gray-800' : 'text-white drop-shadow-lg'
  const subtitleColorClass = isWatermarked || !hasBackground ? 'text-gray-600' : 'text-white/90 drop-shadow-md'
  
  return (
    <div className={`relative min-h-[200px] flex items-center justify-center ${className}`}>
      {/* Background Image (only if we have one) */}
      {hasBackground && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${bgImage})`,
          }}
        />
      )}
      
      {/* Overlay for better text readability (only with background image and non-watermarked) */}
      {hasBackground && !isWatermarked && <div className="absolute inset-0 bg-black/20" />}
      
      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <h1 className={`text-4xl font-bold mb-2 ${textColorClass}`}>
          {title}
        </h1>
        <p className={`text-lg ${subtitleColorClass}`}>
          {subtitle}
        </p>
      </div>
    </div>
  )
}

// Complex header component (legacy support)
function ComplexModuleHeaderDark({ 
  module, 
  currentPage, 
  className = '',
  onboardingData,
  user,
  userClient,
  onSignOut,
  backgroundImage
}: ComplexModuleHeaderDarkProps) {
  const [showHamburgerDropdown, setShowHamburgerDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const pathname = usePathname()
  
  const bgImage = backgroundImage || getBackgroundImage(module.title)
  const hasBackground = bgImage && bgImage.length > 0
  const isWatermarked = isWatermarkedPage(pathname)

  // Copy exact avatar loading logic from AppleSidebar
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
            logger.debug('MODULE HEADER: User avatar loaded from profiles table:', profileData.avatar_url)
          } else {
            logger.debug('MODULE HEADER: No avatar found in profiles table')
          }
        } catch (error) {
          logger.debug('MODULE HEADER: Could not fetch user avatar', error)
        }
      }
    }
    
    fetchUserAvatar()

    // Listen for avatar updates (same as sidebar)
    const handleAvatarUpdate = (event: any) => {
      const { avatarUrl } = event.detail
      setUserAvatar(avatarUrl)
      logger.debug('MODULE HEADER: Avatar updated via event:', avatarUrl)
    }

    window.addEventListener('userAvatarUpdated', handleAvatarUpdate)
    
    return () => {
      window.removeEventListener('userAvatarUpdated', handleAvatarUpdate)
    }
  }, [user?.id])

  // Determine text styling based on watermark status
  const textColorClass = isWatermarked || !hasBackground ? 'text-gray-800' : 'text-white drop-shadow-lg'
  const subtitleColorClass = isWatermarked || !hasBackground ? 'text-gray-600' : 'text-white/90 drop-shadow-md'
  const buttonHoverClass = isWatermarked || !hasBackground ? 'hover:bg-gray-100 border border-gray-300' : 'hover:bg-white/20 border border-white/30'
  const iconFilterClass = isWatermarked || !hasBackground ? '' : 'filter invert'
  const avatarBgClass = isWatermarked || !hasBackground ? 'bg-gray-100 border border-gray-300 hover:bg-gray-200' : 'bg-white/20 border border-white/30 hover:bg-white/30'
  const avatarTextClass = isWatermarked || !hasBackground ? 'text-gray-700' : 'text-white'

  console.log('🔍 ModuleHeaderDark rendering:', {
    moduleKey: module.key,
    moduleTitle: module.title,
    currentPage,
    pagesCount: module.pages?.length,
    pages: module.pages,
    isWatermarked,
    hasBackground
  })
  
  return (
    <>
      {/* Background Container */}
      <div className={`relative min-h-[300px] ${className}`}>
        {/* Background Image (only if we have one) */}
        {hasBackground && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${bgImage})`,
            }}
          />
        )}
        
        {/* Overlay for better content readability (only with background image and non-watermarked) */}
        {hasBackground && !isWatermarked && <div className="absolute inset-0 bg-black/20" />}
        
        {/* Content Container */}
        <div className="relative z-10 px-4 py-8">
          <div className="mb-16">
            {/* Module Icon, Title, and Navigation Controls */}
            <div className="flex items-center justify-between mb-6">
              {/* Left Side: Icon + Title */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Image 
                    src={module.iconUrl} 
                    alt={`${module.title} Module`} 
                    width={96} 
                    height={96}
                    className="object-contain"
                    unoptimized={module.key === 'admin'}
                  />
                </div>
                <div>
                  <h1 className={`text-4xl font-bold ${textColorClass}`}>
                    {module.title}
                  </h1>
                  <p className={`italic text-lg ${subtitleColorClass}`}>
                    {module.description}
                  </p>
                </div>
              </div>

              {/* Right Side: Hamburger + User Avatar */}
              <div className="flex items-center space-x-4">
                {/* Hamburger Menu Button */}
                <button
                  onClick={() => setShowHamburgerDropdown(!showHamburgerDropdown)}
                  className={`p-3 rounded-lg transition-all duration-200 TouchTarget ${buttonHoverClass}`}
                  title="Navigation Menu"
                >
                  <img 
                    src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/hamburger.png"
                    alt="Menu" 
                    className={`w-6 h-6 object-contain ${iconFilterClass}`}
                  />
                </button>

                {/* User Avatar - Clickable with dropdown */}
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="relative"
                  title={`User Profile - Edit your profile information${userClient?.champion_enrolled ? ' | Hero User' : ''}`}
                >
                  <div className={`rounded-full flex items-center justify-center backdrop-blur-sm overflow-hidden flex-shrink-0 w-12 h-12 cursor-pointer transition-all duration-200 ${avatarBgClass}`}>
                    {userAvatar ? (
                      <img 
                        src={userAvatar} 
                        alt="User Avatar" 
                        className="w-full h-full object-cover"
                        onLoad={() => logger.debug('MODULE HEADER: User avatar loaded successfully')}
                        onError={() => logger.debug('MODULE HEADER: User avatar failed to load, showing initials')}
                      />
                    ) : (
                      <span className={`font-bold text-lg ${avatarTextClass}`}>
                        {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  
                  {/* Hero Badge - same as sidebar */}
                  {userClient?.champion_enrolled && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center border-2 border-white/30 shadow-lg">
                      <img 
                        src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/branding/trophy.svg"
                        alt="Hero"
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                  )}
                </button>
              </div>
            </div>
            
            {/* Navigation Pills - Below Title, Left Aligned */}
            <div className="flex justify-start mb-8">
              <div className="flex space-x-0.5 bg-white/30 p-0.5 rounded-full backdrop-blur-md border border-white/30 w-full max-w-md">
                {module.pages.map((page) => {
                  const isActive = page.key === currentPage
                  
                  return (
                    <a 
                      key={page.key}
                      href={page.href} 
                      className={`
                        flex-1 text-center px-3 py-2 font-semibold rounded-full transition-all duration-300 text-sm TouchTarget
                        ${isActive 
                          ? 'text-white bg-gray-900 shadow-lg' 
                          : 'text-white/90 hover:text-white hover:bg-white/20 font-medium'
                        }
                      `}
                    >
                      {page.label}
                    </a>
                  )
                })}
              </div>
            </div>
            
            {/* Onboarding Welcome Section */}
            {onboardingData && (
              <div className="text-center mt-8 bg-white/90 backdrop-blur-sm border border-white/30 rounded-2xl p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
                  <span className="text-2xl">👋</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome to JiGR, {onboardingData.userFirstName}! 👋
                </h1>
                <p className="text-gray-600 mb-6">
                  Let&apos;s personalize your compliance experience!
                </p>
                
                {/* Progress Indicator */}
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✓</span>
                    </div>
                    <span className="ml-2 text-sm text-green-600 font-medium">Account Created</span>
                  </div>
                  <div className="w-12 h-0.5 bg-blue-500"></div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <span className="ml-2 text-sm text-blue-600 font-medium">Your Profile</span>
                  </div>
                  <div className="w-12 h-0.5 bg-gray-300"></div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-bold">3</span>
                    </div>
                    <span className="ml-2 text-sm text-gray-500 font-medium">Company Setup</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dropdowns - Both hamburger and user avatar */}
      <HamburgerDropdown 
        isOpen={showHamburgerDropdown}
        onClose={() => setShowHamburgerDropdown(false)}
        currentModule={module.key}
      />
      
      <UserAvatarDropdown 
        isOpen={showUserDropdown}
        onClose={() => setShowUserDropdown(false)}
        user={user}
        userClient={userClient}
        onSignOut={onSignOut}
      />
    </>
  )
}

// Main export - overloaded component
export function ModuleHeaderDark(props: ModuleHeaderDarkProps) {
  if (isSimpleHeader(props)) {
    return <SimpleModuleHeaderDark {...props} />
  } else {
    return <ComplexModuleHeaderDark {...props} />
  }
}