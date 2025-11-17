'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { HamburgerDropdown } from './HamburgerDropdown'
import { UserAvatarDropdown } from './UserAvatarDropdown'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/console-utils'
import { TOUCH_TARGETS, FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, IOS_COLORS, ANIMATIONS } from '@/lib/apple-design-system'

interface VendorsModuleHeaderProps {
  className?: string
  user?: any
  userClient?: any
  onSignOut?: () => void
}

export function VendorsModuleHeader({ 
  className = '',
  user,
  userClient,
  onSignOut
}: VendorsModuleHeaderProps) {
  const [showHamburgerDropdown, setShowHamburgerDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  
  // Vendors-specific configuration
  const vendorsConfig = {
    title: 'VENDORS',
    iconUrl: 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/branding/icons/JiGRModuleVendors.webp',
    backgroundImage: 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/backgrounds/vendorsBG.webp'
  }

  // Get company name with fallback
  const getCompanyName = () => {
    // Debug logging to see what data we have
    console.log('VendorsModuleHeader - userClient data:', userClient)
    console.log('VendorsModuleHeader - Available fields:', userClient ? Object.keys(userClient) : 'No userClient')
    
    // Try multiple possible field names
    const companyName = userClient?.name || 
                       userClient?.company_name || 
                       userClient?.business_name || 
                       userClient?.client_name ||
                       'Your Company'
    
    console.log('VendorsModuleHeader - Using company name:', companyName)
    return companyName
  }

  // Get tagline
  const getTagline = () => {
    return `Suppliers to ${getCompanyName()}`
  }

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
            logger.debug('VENDORS HEADER: User avatar loaded from profiles table:', profileData.avatar_url)
          } else {
            logger.debug('VENDORS HEADER: No avatar found in profiles table')
          }
        } catch (error) {
          logger.debug('VENDORS HEADER: Could not fetch user avatar', error)
        }
      }
    }
    
    fetchUserAvatar()

    // Listen for avatar updates
    const handleAvatarUpdate = (event: any) => {
      const { avatarUrl } = event.detail
      setUserAvatar(avatarUrl)
      logger.debug('VENDORS HEADER: Avatar updated via event:', avatarUrl)
    }

    window.addEventListener('userAvatarUpdated', handleAvatarUpdate)
    return () => window.removeEventListener('userAvatarUpdated', handleAvatarUpdate)
  }, [user?.id])

  return (
    <>
      {/* Vendors Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-40 brightness-125 z-0"
        style={{
          backgroundImage: `url(${vendorsConfig.backgroundImage})`,
        }}
      />
      
      {/* Header */}
      <header className={`relative z-20 ${className}`}>
        <div className="container mx-auto px-4">
          {/* Dropdowns positioned absolutely */}
          <div className="relative">
            {showHamburgerDropdown && (
              <HamburgerDropdown 
                isOpen={showHamburgerDropdown}
                onClose={() => setShowHamburgerDropdown(false)}
                currentModule="vendors" // Vendors is now its own module
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

          {/* Module Icon, Title, and Navigation Controls */}
          <div className="flex items-center justify-between mb-6">
          {/* Left Side: Icon + Title */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Image 
                src={vendorsConfig.iconUrl} 
                alt="Vendors Module" 
                width={96} 
                height={96}
                className="object-contain"
                unoptimized
              />
            </div>
            <div>
              <h1 
                className="text-gray-800"
                style={{
                  fontFamily: FONT_FAMILY,
                  fontSize: FONT_SIZES.TITLE_LARGE,
                  fontWeight: FONT_WEIGHTS.BOLD,
                  margin: 0,
                  marginBottom: '8pt',
                }}
              >
                {vendorsConfig.title}
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
                {getTagline()}
              </p>
            </div>
          </div>

          {/* Right Side: Hamburger + User Avatar */}
          <div className="flex items-center space-x-4">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setShowHamburgerDropdown(!showHamburgerDropdown)}
              className="p-3 rounded-lg border border-gray-300 hover:bg-gray-100"
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
              <div className="space-y-1">
                <div className="w-5 h-0.5 bg-gray-800"></div>
                <div className="w-5 h-0.5 bg-gray-800"></div>
                <div className="w-5 h-0.5 bg-gray-800"></div>
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
        </div>
      </header>
    </>
  )
}