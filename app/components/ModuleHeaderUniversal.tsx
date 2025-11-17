/**
 * Universal ModuleHeader Component
 * 
 * Consolidated single component for all modules with universal watermark backgrounds
 * and dark text styling. Replaces both ModuleHeaderDark and ModuleHeaderLight.
 * 
 * Features:
 * - Universal watermark backgrounds for all modules
 * - Consistent dark text styling across all modules
 * - Change once, affects all approach
 * - Component overloading for simple vs complex headers
 */

'use client'

import Image from 'next/image'
import { useState, useContext, useEffect } from 'react'
import { getTextStyle } from '@/lib/design-system'
import { ModuleConfig } from '@/lib/module-config'
import { HamburgerDropdown } from './HamburgerDropdown'
import { UserAvatarDropdown } from './UserAvatarDropdown'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/console-utils'
import { TOUCH_TARGETS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, IOS_COLORS, BUTTON_STATES, ANIMATIONS } from '@/lib/apple-design-system'

interface OnboardingData {
  userFirstName: string
}

// Simple header props (used by most pages)
interface SimpleModuleHeaderProps {
  title: string
  subtitle: string
  backgroundImage?: string
  className?: string
}

// Complex header props (used by main module pages with navigation)
interface ComplexModuleHeaderProps {
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
type ModuleHeaderProps = SimpleModuleHeaderProps | ComplexModuleHeaderProps

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

// Helper function to determine background image
function getBackgroundImage(title: string, subtitle?: string): string {
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
  if (title.includes('Recipe') || title === 'Recipes' || title === 'RECIPES') {
    return BACKGROUND_IMAGES.RECIPES
  }
  if (title.includes('Menu') || title === 'MENU' || title === 'Menu Pricing' || title === 'Menu Engineering' || title === 'Menu Analysis') {
    return BACKGROUND_IMAGES.MENU
  }
  if (title.includes('Stock') || title === 'Stock') {
    return BACKGROUND_IMAGES.STOCK
  }
  if (title.includes('STOCK') || title === 'STOCK') {
    return BACKGROUND_IMAGES.STOCK
  }
  if (title.includes('Count') || title === 'Count' || title === 'COUNT') {
    return BACKGROUND_IMAGES.COUNT
  }
  if (title.includes('Upload') || title === 'Upload') {
    return BACKGROUND_IMAGES.UPLOAD
  }
  if (title.includes('Admin') || title === 'ADMIN' || title === 'Admin') {
    return BACKGROUND_IMAGES.ADMIN
  }
  
  // Default fallback
  return BACKGROUND_IMAGES.LANDING
}

// Type guard to check if props are for simple header
function isSimpleHeader(props: ModuleHeaderProps): props is SimpleModuleHeaderProps {
  return 'title' in props && 'subtitle' in props && !('module' in props)
}

// Simple header component
function SimpleModuleHeader({ title, subtitle, backgroundImage, className = '' }: SimpleModuleHeaderProps) {
  const bgImage = backgroundImage || getBackgroundImage(title, subtitle)
  const hasBackground = bgImage && bgImage.length > 0
  
  // Universal dark text for all watermarked backgrounds
  const textColorClass = 'text-gray-800'
  const subtitleColorClass = 'text-gray-600'
  
  return (
    <div className={`relative min-h-[200px] flex items-center justify-center ${className}`}>
      {/* Universal Watermark Background */}
      {hasBackground && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 brightness-125"
          style={{
            backgroundImage: `url(${bgImage})`,
          }}
        />
      )}
      
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

// Complex header component
function ComplexModuleHeader({ 
  module, 
  currentPage, 
  className = '',
  onboardingData,
  user,
  userClient,
  onSignOut,
  backgroundImage
}: ComplexModuleHeaderProps) {
  const [showHamburgerDropdown, setShowHamburgerDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  
  const bgImage = backgroundImage || getBackgroundImage(module.title)
  const hasBackground = bgImage && bgImage.length > 0

  // Avatar loading logic
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

    // Listen for avatar updates
    const handleAvatarUpdate = (event: any) => {
      const { avatarUrl } = event.detail
      setUserAvatar(avatarUrl)
      logger.debug('MODULE HEADER: Avatar updated via event:', avatarUrl)
    }

    window.addEventListener('userAvatarUpdated', handleAvatarUpdate)
    return () => window.removeEventListener('userAvatarUpdated', handleAvatarUpdate)
  }, [user?.id])

  // Find current page details
  const currentPageData = module.pages.find(page => page.key === currentPage)
  const pageTitle = currentPageData?.label || currentPage

  // Universal dark text for all modules
  const textColorClass = 'text-gray-800'
  
  return (
    <>
      {/* Universal Background */}
      {hasBackground && (
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-40 brightness-125 z-0"
          style={{
            backgroundImage: `url(${bgImage})`,
          }}
        />
      )}
      
      {/* Header */}
      <header className={`relative z-20 ${className}`}>
        {/* Dropdowns positioned absolutely */}
        <div className="relative">
          {showHamburgerDropdown && (
            <HamburgerDropdown 
              isOpen={showHamburgerDropdown}
              onClose={() => setShowHamburgerDropdown(false)}
              currentModule={module.key}
            />
          )}
          {showUserDropdown && onSignOut && (
            <UserAvatarDropdown 
              isOpen={showUserDropdown}
              onSignOut={onSignOut}
              user={user}
              userClient={userClient}
              onClose={() => setShowUserDropdown(false)}
            />
          )}
        </div>

        {/* Module Icon, Title, and Navigation Controls - Copy from working ModuleHeaderDark */}
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
              <h1 
                className={textColorClass}
                style={{
                  fontFamily: FONT_FAMILY,
                  fontSize: FONT_SIZES.TITLE_LARGE,
                  fontWeight: FONT_WEIGHTS.BOLD,
                  margin: 0,
                  marginBottom: '8pt',
                }}
              >
                {module.title}
              </h1>
              <p 
                style={{
                  fontFamily: FONT_FAMILY,
                  fontSize: FONT_SIZES.BUTTON_LABEL,
                  fontWeight: FONT_WEIGHTS.REGULAR,
                  fontStyle: 'italic',
                  color: IOS_COLORS.LABEL_SECONDARY,
                  margin: 0,
                }}
              >
                {module.description}
              </p>
            </div>
          </div>

          {/* Right Side: Hamburger + User Avatar */}
          <div className="flex items-center space-x-4">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setShowHamburgerDropdown(!showHamburgerDropdown)}
              className="p-3 rounded-lg hover:bg-gray-100"
              title="Navigation Menu"
              style={{ 
                minHeight: TOUCH_TARGETS.MINIMUM,
                minWidth: TOUCH_TARGETS.MINIMUM,
                fontFamily: FONT_FAMILY,
                transition: `background-color ${ANIMATIONS.QUICK} ease, opacity ${ANIMATIONS.QUICK} ease`,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              <div className="space-y-1.5">
                <div className="w-6 h-0.5 bg-gray-800"></div>
                <div className="w-6 h-0.5 bg-gray-800"></div>
                <div className="w-6 h-0.5 bg-gray-800"></div>
              </div>
            </button>

            {/* User Avatar */}
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="relative"
              title="User Profile"
              style={{ 
                minHeight: TOUCH_TARGETS.MINIMUM,
                minWidth: TOUCH_TARGETS.MINIMUM,
                fontFamily: FONT_FAMILY,
                transition: `opacity ${ANIMATIONS.QUICK} ease`,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              <div className="rounded-full flex items-center justify-center backdrop-blur-sm overflow-hidden flex-shrink-0 w-12 h-12 cursor-pointer transition-all duration-200 bg-gray-100 border border-gray-300 hover:bg-gray-200">
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt="User Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-lg text-gray-700">
                    {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              
              {/* Hero Badge */}
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
        
        {/* Navigation Pills - Below Title, Left Aligned - Copy from working ModuleHeaderDark */}
        <div className="flex justify-start mb-8">
          <div className="flex space-x-0.5 bg-white/90 p-0.5 rounded-full backdrop-blur-md border border-gray-200 w-full max-w-md shadow-lg">
            {module.pages.map((page) => {
              const isActive = page.key === currentPage
              
              return (
                <a 
                  key={page.key}
                  href={page.href} 
                  className={`
                    flex-1 text-center rounded-full transition-all duration-300 flex items-center justify-center
                    ${isActive 
                      ? 'text-white bg-gray-900 shadow-lg' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                  style={{ 
                    minHeight: TOUCH_TARGETS.MINIMUM,
                    fontFamily: FONT_FAMILY,
                    fontSize: FONT_SIZES.BUTTON_LABEL,
                    fontWeight: isActive ? FONT_WEIGHTS.SEMIBOLD : FONT_WEIGHTS.MEDIUM,
                    WebkitTapHighlightColor: 'transparent',
                    touchAction: 'manipulation',
                    transition: `all ${ANIMATIONS.STANDARD} ease`,
                    paddingLeft: '12pt',
                    paddingRight: '12pt',
                  }}
                >
                  {page.label}
                </a>
              )
            })}
          </div>
        </div>

        {/* Welcome Message */}
        {onboardingData?.userFirstName && (
          <div className="mt-4 text-center">
            <p className={`text-sm ${textColorClass.replace('800', '600')}`}>
              Welcome back, <strong>{onboardingData.userFirstName}</strong>
            </p>
          </div>
        )}
      </header>
    </>
  )
}

// Main overloaded component
export function ModuleHeaderUniversal(props: ModuleHeaderProps) {
  if (isSimpleHeader(props)) {
    return <SimpleModuleHeader {...props} />
  } else {
    return <ComplexModuleHeader {...props} />
  }
}