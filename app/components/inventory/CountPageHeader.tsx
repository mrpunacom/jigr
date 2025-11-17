'use client'

import { useState, useEffect } from 'react'
import { InventoryLocation } from '@/types/InventoryTypes'
import { HamburgerDropdown } from '../HamburgerDropdown'
import { UserAvatarDropdown } from '../UserAvatarDropdown'
import { LocationPill } from './LocationPill'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/console-utils'
import { getReactTouchTarget, FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, IOS_COLORS, ANIMATIONS } from '@/lib/apple-design-system'
import { Wifi, WifiOff } from 'lucide-react'

interface CountPageHeaderProps {
  user?: any
  userClient?: any
  onSignOut?: () => void
  locations: InventoryLocation[]
  selectedLocationId?: string
  onLocationSelect: (locationId: string) => void
  isOnline?: boolean
  className?: string
}

export function CountPageHeader({
  user,
  userClient,
  onSignOut,
  locations,
  selectedLocationId,
  onLocationSelect,
  isOnline = true,
  className = ''
}: CountPageHeaderProps) {
  const [showHamburgerDropdown, setShowHamburgerDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [userAvatar, setUserAvatar] = useState<string | null>(null)

  // Get user's first name using same logic as UserAvatarDropdown
  const getUserFirstName = () => {
    // Try user metadata full name first
    if (user?.user_metadata?.full_name) {
      const firstName = user.user_metadata.full_name.split(' ')[0]
      return firstName
    }
    
    // Try user metadata name
    if (user?.user_metadata?.name) {
      const firstName = user.user_metadata.name.split(' ')[0]
      return firstName
    }
    
    // Try userClient owner name  
    if (userClient?.owner_name) {
      const firstName = userClient.owner_name.split(' ')[0]
      return firstName
    }
    
    // Fallback to email username
    if (user?.email) {
      const emailName = user.email.split('@')[0]
      return emailName
    }
    
    return 'User'
  }

  // Avatar loading logic (copied from ModuleHeaderUniversal)
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
            logger.debug('COUNT HEADER: User avatar loaded from profiles table:', profileData.avatar_url)
          } else {
            logger.debug('COUNT HEADER: No avatar found in profiles table')
          }
        } catch (error) {
          logger.debug('COUNT HEADER: Could not fetch user avatar', error)
        }
      }
    }
    
    fetchUserAvatar()

    // Listen for avatar updates
    const handleAvatarUpdate = (event: any) => {
      const { avatarUrl } = event.detail
      setUserAvatar(avatarUrl)
      logger.debug('COUNT HEADER: Avatar updated via event:', avatarUrl)
    }

    window.addEventListener('userAvatarUpdated', handleAvatarUpdate)
    return () => window.removeEventListener('userAvatarUpdated', handleAvatarUpdate)
  }, [user?.id])

  return (
    <>
      {/* Header */}
      <header className={`relative ${className}`}>
        {/* Dropdowns positioned absolutely */}
        <div className="relative">
          {showHamburgerDropdown && (
            <HamburgerDropdown 
              isOpen={showHamburgerDropdown}
              onClose={() => setShowHamburgerDropdown(false)}
              currentModule="count"
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

        {/* Top Row: Custom Message + Hamburger & Avatar */}
        <div className="flex items-center justify-between mb-6">
          {/* Left Side: Custom Message */}
          <div className="flex items-center">
            <h1 
              className="text-gray-800"
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.TITLE_LARGE,
                fontWeight: FONT_WEIGHTS.BOLD,
                margin: 0,
              }}
            >
              Enjoy your stocktake {getUserFirstName()}
            </h1>
          </div>

          {/* Right Side: Online Indicator + Hamburger + User Avatar */}
          <div className="flex items-center space-x-4">
            {/* Online/Offline indicator */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
              isOnline 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setShowHamburgerDropdown(!showHamburgerDropdown)}
              className="p-3 rounded-lg border border-gray-300 hover:bg-gray-100"
              title="Navigation Menu"
              style={{ 
                ...getReactTouchTarget('MINIMUM'),
                fontFamily: FONT_FAMILY,
                transition: `background-color ${ANIMATIONS.QUICK} ease, opacity ${ANIMATIONS.QUICK} ease`,
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
                ...getReactTouchTarget('MINIMUM'),
                fontFamily: FONT_FAMILY,
                transition: `opacity ${ANIMATIONS.QUICK} ease`,
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
        
        {/* Location Pills - Same position as nav pills */}
        <LocationPill
          locations={locations}
          selectedLocationId={selectedLocationId}
          onLocationSelect={onLocationSelect}
          className="mb-8"
        />
      </header>
    </>
  )
}