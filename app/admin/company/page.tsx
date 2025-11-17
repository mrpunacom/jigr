'use client'

// Company Profile Page - Business information and settings
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { getUserClient, UserClient } from '@/lib/auth-utils'
import { DesignTokens, getCardStyle, getTextStyle, getFormFieldStyle } from '@/lib/design-system'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import ImageUploader from '@/app/components/ImageUploader'

export default function CompanyPage() {
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

  const handleDemoSignIn = async () => {
    try {
      const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously()
      
      if (!anonError && anonData.user) {
        console.log('Anonymous demo user signed in successfully')
        setUser(anonData.user)
        setLoading(false)
        return
      }

      // Fallback to demo user
      const demoUser = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        email: 'demo@example.com',
        app_metadata: {},
        user_metadata: { full_name: 'Demo User' },
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setUser(demoUser)
      setLoading(false)
      
    } catch (error) {
      console.error('Demo sign-in failed:', error)
      // Fallback demo user
      const demoUser = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
        email: 'demo@example.com',
        app_metadata: {},
        user_metadata: { full_name: 'Demo User' },
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setUser(demoUser)
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Auto sign-in as demo user for development
        await handleDemoSignIn()
      } else {
        setUser(user)
        
        // Get user's company information using direct API call
        try {
          console.log('🔍 COMPANY PAGE: Loading client info via API for user:', user.id)
          const response = await fetch(`/api/user-client?userId=${user.id}`)
          
          if (response.ok) {
            const data = await response.json()
            const clientInfo = data.userClient
            
            console.log('✅ COMPANY PAGE: Client info loaded:', {
              name: clientInfo.name,
              address: clientInfo.address,
              owner_name: clientInfo.owner_name,
              logo_url: clientInfo.logo_url,
              hasAddress: !!clientInfo.address,
              hasLogoUrl: !!clientInfo.logo_url
            })
            
            setUserClient(clientInfo)
            
            // Set logo URL if it exists
            if (clientInfo.logo_url) {
              console.log('🖼️ COMPANY PAGE: Setting logo URL from API response:', clientInfo.logo_url)
              setCompanyLogoUrl(clientInfo.logo_url)
              // Update localStorage for consistency
              localStorage.setItem('companyLogoUrl', clientInfo.logo_url)
            } else {
              console.log('⚠️ COMPANY PAGE: No logo URL found in API response')
            }
          } else {
            console.error('❌ COMPANY PAGE: Failed to load client info via API:', response.status)
          }
        } catch (error) {
          console.error('❌ COMPANY PAGE: Error loading client info via API:', error)
        }
        
        setLoading(false)
      }
    }
    
    checkAuth()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={getCardStyle('primary')}>
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className={getTextStyle('body')}>Loading Company...</p>
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
              Company Profile
            </h1>
            <p className={`${getTextStyle('bodySmall')} mb-6`}>
              Please sign in to manage settings
            </p>
            
            <button
              onClick={handleDemoSignIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] mb-4"
            >
              LOGIN as Demo User
            </button>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <p className="text-xs text-white/70">
                Demo mode with test company data
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <StandardPageWrapper moduleName="admin" currentPage="company">
      {/* Main Content */}
      <div className="flex gap-6">
        
        {/* Left Column - Main Content */}
        <div className="flex-1">
              
              {/* Business Information Form */}
              <div className={getCardStyle('primary')}>
                <h2 className="text-black text-xl font-semibold mb-6">Business Information</h2>
                
                <div className="flex gap-6 mb-6">
                  {/* Left Side - Logo Uploader */}
                  <div className="flex-shrink-0">
                    <ImageUploader
                      currentImageUrl={companyLogoUrl || userClient?.logo_url}
                      onUploadSuccess={handleLogoUploadSuccess}
                      onUploadError={(error) => console.error('Logo upload failed:', error)}
                      uploadEndpoint="/api/upload-client-logo"
                      uploadData={{ clientId: userClient?.id || '', userId: user?.id || '' }}
                      shape="square"
                      size="medium"
                      title="Company Logo"
                      description="Upload logo"
                    />
                  </div>
                  
                  {/* Right Side - Business Name & Contact Email */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-black text-sm font-medium mb-2">Business Name</label>
                      <input
                        type="text"
                        value={userClient?.name || ''}
                        placeholder="Business name loading..."
                        className={getFormFieldStyle()}
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-black text-sm font-medium mb-2">Owner&apos;s Name</label>
                      <input
                        type="text"
                        value={userClient?.owner_name || user?.user_metadata?.full_name || ''}
                        placeholder="Owner name loading..."
                        className={getFormFieldStyle()}
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label className="block text-black text-sm font-medium mb-2">Contact Email</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        placeholder="Email loading..."
                        className={getFormFieldStyle()}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-black text-sm font-medium mb-2">Business Type</label>
                      <select 
                        className={getFormFieldStyle()}
                        value={userClient?.business_type || ''}
                        disabled
                      >
                        <option value="">Select business type...</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="cafe">Café</option>
                        <option value="bar">Bar/Pub</option>
                        <option value="hotel">Hotel</option>
                        <option value="catering">Catering</option>
                        <option value="food-truck">Food Truck</option>
                        <option value="takeaway">Takeaway</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-black text-sm font-medium mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={userClient?.phone || ''}
                        placeholder="Phone number not provided"
                        className={getFormFieldStyle()}
                        readOnly
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-black text-sm font-medium mb-2">Address</label>
                    <textarea
                      rows={3}
                      value={userClient?.address ? userClient.address : ''}
                      placeholder={userClient?.address ? undefined : "Business address not provided"}
                      className={getFormFieldStyle()}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-black text-sm font-medium mb-2">Alcohol License Number</label>
                    <input
                      type="text"
                      value={userClient?.license_number || ''}
                      placeholder="License number not provided"
                      className={getFormFieldStyle()}
                      readOnly
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      className="bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 border border-white/30 backdrop-blur-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>

        </div>

        {/* Right Column - Empty Sidebar */}
        <div className="w-64">
          {/* Empty sidebar to maintain layout consistency */}
        </div>

      </div>
    </StandardPageWrapper>
  )
}