'use client'

// Admin Console - Business information and dashboard
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { getUserClient, UserClient } from '@/lib/auth-utils'
import { DesignTokens, getCardStyle, getTextStyle, getFormFieldStyle } from '@/lib/design-system'
import { ConsolePageWrapper } from '@/app/components/UniversalPageWrapper'
import { StatCard } from '@/app/components/ModuleCard'
import ImageUploader from '@/app/components/ImageUploader'
import { UniversalFooter } from '@/app/components/UniversalFooter'
import { getThemedCardStyles, getModuleTheme } from '@/lib/theme-utils'
import { FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, IOS_COLORS, SPACING, TOUCH_TARGETS } from '@/lib/apple-design-system'

export default function AdminConsolePage() {
  const [user, setUser] = useState<any>(null)
  const [userClient, setUserClient] = useState<UserClient | null>(null)
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const handleLogoUploadSuccess = (logoUrl: string) => {
    setCompanyLogoUrl(logoUrl)
    console.log('Company logo uploaded successfully:', logoUrl)
    
    // Notify the layout about the logo update
    localStorage.setItem('companyLogoUrl', logoUrl)
    window.dispatchEvent(new CustomEvent('companyLogoUpdated', { detail: { logoUrl } }))
  }

  // Debug userClient state changes
  useEffect(() => {
    console.log('🔍 STATE UPDATE: userClient changed:', userClient ? {
      id: userClient.id,
      name: userClient.name,
      owner_name: userClient.owner_name,
      address: userClient.address,
      hasOwnerName: !!userClient.owner_name,
      hasAddress: !!userClient.address,
      isComplete: !!(userClient.owner_name && userClient.address)
    } : 'null')
  }, [userClient])


  useEffect(() => {
    const loadUserData = async () => {
      // Use getSession() instead of getUser() to avoid 403 errors
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session?.user) {
        console.log('❌ ADMIN CONSOLE: No authenticated user found in session')
        // TEMPORARILY DISABLED FOR DEBUGGING: window.location.href = '/'
        console.log('⚠️ ADMIN CONSOLE: Redirect disabled for debugging')
        
        // Set default user data for testing
        setUser({ 
          id: 'test-user', 
          email: 'test@jigr.app',
          user_metadata: { 
            full_name: 'Test User',
            avatar_url: 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/JiGRlogo.png'
          }
        })
        setUserClient({
          id: 'test-client',
          name: 'Test Company',
          owner_name: 'Test Owner', 
          address: '123 Test Street, Test City',
          role: 'OWNER'
        })
        setLoading(false)
        return
      }

      const user = session.user
      setUser(user)
      
      // Load company info using reliable API
      try {
        const response = await fetch(`/api/user-client?userId=${user.id}`)
        
        if (response.ok) {
          const data = await response.json()
          const clientInfo = data.userClient
          
          setUserClient(clientInfo)
          
          if (clientInfo.logo_url) {
            setCompanyLogoUrl(clientInfo.logo_url)
            // Update localStorage for consistency
            localStorage.setItem('companyLogoUrl', clientInfo.logo_url)
          }
        } else {
          console.error('Failed to load client info via API:', response.status)
        }
      } catch (error) {
        console.error('Error loading client info via API:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadUserData()
    
    // TEMPORARILY DISABLED: Auth state change listener to prevent session refresh issues
    // const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
    //   console.log('🔍 ADMIN CONSOLE: Auth state changed:', { event, hasUser: !!session?.user })
    //   setUser(session?.user ?? null)
    // })

    // return () => subscription.unsubscribe()
  }, [])

  
  // Get theme-aware styling
  const theme = getModuleTheme('admin')
  const { cardStyle, textColors, getInlineStyles } = getThemedCardStyles(theme)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={getCardStyle('primary')}>
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className={getTextStyle('body')}>Loading Console...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className={`${getCardStyle('primary')} max-w-md w-full`}>
          <div className="text-center">
            <h1 className={`${getTextStyle('pageTitle')} mb-2`}>
              Admin Console
            </h1>
            <p className={`${getTextStyle('bodySmall')} mb-6`}>
              Redirecting to login...
            </p>
            <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ConsolePageWrapper moduleName="admin">
      {/* Admin Overview Cards - 3 Column Layout */}
      <div 
        className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full"
        style={{ 
          gap: SPACING.LG, 
          marginBottom: SPACING.XXL 
        }}
      >
        
        {/* Business Info */}
        <StatCard accentColor="blue" theme="admin">
          <div className="text-center">
            {/* Icon */}
            <div style={{ marginBottom: SPACING.LG }}>
              <Link href="/admin/company">
                <img 
                  src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/JiGRcafe.png"
                  alt="Business Info"
                  className="w-16 h-16 object-contain mx-auto cursor-pointer hover:opacity-80 transition-opacity duration-200"
                  style={{ 
                    minHeight: TOUCH_TARGETS.MINIMUM,
                    minWidth: TOUCH_TARGETS.MINIMUM,
                    padding: '12pt'
                  }}
                />
              </Link>
            </div>
            
            {/* Title */}
            <h2 style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_SMALL,
              fontWeight: FONT_WEIGHTS.SEMIBOLD,
              color: IOS_COLORS.LABEL_PRIMARY,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              {userClient?.name || 'Business Info'}
            </h2>
            
            {/* Details */}
            <div style={{ marginTop: SPACING.MD }} className="space-y-1">
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: FONT_WEIGHTS.REGULAR,
                color: IOS_COLORS.LABEL_SECONDARY,
                margin: 0,
              }}>
                <span style={{ fontWeight: FONT_WEIGHTS.MEDIUM }}>Owner:</span> {userClient?.owner_name || 'Not specified'}
              </p>
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: FONT_WEIGHTS.REGULAR,
                color: IOS_COLORS.LABEL_SECONDARY,
                margin: 0,
              }}>
                <span style={{ fontWeight: FONT_WEIGHTS.MEDIUM }}>Type:</span> {userClient?.business_type ? userClient.business_type.charAt(0).toUpperCase() + userClient.business_type.slice(1) : 'Not specified'}
              </p>
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: FONT_WEIGHTS.REGULAR,
                color: IOS_COLORS.LABEL_SECONDARY,
                margin: 0,
              }}>
                <span style={{ fontWeight: FONT_WEIGHTS.MEDIUM }}>Phone:</span> {userClient?.phone || 'Not provided'}
              </p>
            </div>
          </div>
        </StatCard>

        {/* Subscription */}
        <StatCard accentColor="purple" theme="admin">
          <div className="text-center">
            {/* Icon */}
            <div style={{ marginBottom: SPACING.LG }}>
              <img 
                src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/JiGRsubscription.png"
                alt="Subscription"
                className="w-16 h-16 object-contain mx-auto"
                style={{ 
                  minHeight: TOUCH_TARGETS.MINIMUM,
                  minWidth: TOUCH_TARGETS.MINIMUM,
                  padding: '12pt'
                }}
              />
            </div>
            
            {/* Title */}
            <h2 style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_SMALL,
              fontWeight: FONT_WEIGHTS.SEMIBOLD,
              color: IOS_COLORS.LABEL_PRIMARY,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              Subscription
            </h2>
            
            {/* Status Indicator */}
            <div style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_MEDIUM,
              fontWeight: FONT_WEIGHTS.BOLD,
              color: IOS_COLORS.PURPLE,
              marginBottom: SPACING.MD,
              margin: 0,
            }}>
              {userClient?.subscription_tier ? userClient.subscription_tier.charAt(0).toUpperCase() + userClient.subscription_tier.slice(1) : 'Free'}
            </div>
            
            {/* Details */}
            <div className="space-y-1">
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: FONT_WEIGHTS.REGULAR,
                color: IOS_COLORS.LABEL_SECONDARY,
                margin: 0,
              }}>
                <span style={{ fontWeight: FONT_WEIGHTS.MEDIUM }}>Status:</span> {userClient?.subscription_status ? userClient.subscription_status.charAt(0).toUpperCase() + userClient.subscription_status.slice(1) : 'Not specified'}
              </p>
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: FONT_WEIGHTS.REGULAR,
                color: IOS_COLORS.LABEL_SECONDARY,
                margin: 0,
              }}>
                <span style={{ fontWeight: FONT_WEIGHTS.MEDIUM }}>Onboarding:</span> {userClient?.onboarding_status ? userClient.onboarding_status.charAt(0).toUpperCase() + userClient.onboarding_status.slice(1) : 'Not specified'}
              </p>
            </div>
            
            {/* Footer Badge */}
            <div style={{ 
              marginTop: SPACING.MD, 
              paddingTop: SPACING.SM, 
              borderTop: `1px solid ${IOS_COLORS.SEPARATOR}` 
            }}>
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.MINIMUM,
                fontWeight: FONT_WEIGHTS.MEDIUM,
                color: IOS_COLORS.PURPLE,
                margin: 0,
              }}>
                {userClient?.subscription_tier ? userClient.subscription_tier.charAt(0).toUpperCase() + userClient.subscription_tier.slice(1) + ' Plan' : 'Plan not specified'}
              </p>
            </div>
          </div>
        </StatCard>

        {/* Team */}
        <StatCard accentColor="green" theme="admin">
          <div className="text-center">
            {/* Icon */}
            <div style={{ marginBottom: SPACING.LG }}>
              <img 
                src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/JiGRteam.png"
                alt="Team"
                className="w-16 h-16 object-contain mx-auto"
                style={{ 
                  minHeight: TOUCH_TARGETS.MINIMUM,
                  minWidth: TOUCH_TARGETS.MINIMUM,
                  padding: '12pt'
                }}
              />
            </div>
            
            {/* Title */}
            <h2 style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_SMALL,
              fontWeight: FONT_WEIGHTS.SEMIBOLD,
              color: IOS_COLORS.LABEL_PRIMARY,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              Team
            </h2>
            
            {/* Active Users Count */}
            <div style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_MEDIUM,
              fontWeight: FONT_WEIGHTS.BOLD,
              color: IOS_COLORS.GREEN,
              marginBottom: SPACING.MD,
              margin: 0,
            }}>
              {userClient ? '1' : '0'}
            </div>
            
            {/* Details */}
            <div className="space-y-1">
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: FONT_WEIGHTS.REGULAR,
                color: IOS_COLORS.LABEL_SECONDARY,
                margin: 0,
              }}>
                <span style={{ fontWeight: FONT_WEIGHTS.MEDIUM }}>Owner:</span> {userClient?.owner_name || 'Not specified'}
              </p>
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: FONT_WEIGHTS.REGULAR,
                color: IOS_COLORS.LABEL_SECONDARY,
                margin: 0,
              }}>
                <span style={{ fontWeight: FONT_WEIGHTS.MEDIUM }}>Role:</span> {userClient?.jobTitle || userClient?.role || 'Not specified'}
              </p>
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: FONT_WEIGHTS.REGULAR,
                color: IOS_COLORS.LABEL_SECONDARY,
                margin: 0,
              }}>
                <span style={{ fontWeight: FONT_WEIGHTS.MEDIUM }}>Status:</span> {userClient?.status ? userClient.status.charAt(0).toUpperCase() + userClient.status.slice(1) : 'Active'}
              </p>
            </div>
            
            {/* Footer Badge */}
            <div style={{ 
              marginTop: SPACING.MD, 
              paddingTop: SPACING.SM, 
              borderTop: `1px solid ${IOS_COLORS.SEPARATOR}` 
            }}>
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.MINIMUM,
                fontWeight: FONT_WEIGHTS.MEDIUM,
                color: IOS_COLORS.GREEN,
                margin: 0,
              }}>
                {userClient ? '1 Active User' : 'Loading users...'}
              </p>
            </div>
          </div>
        </StatCard>

      </div>
      
      <UniversalFooter />
    </ConsolePageWrapper>
  )
}