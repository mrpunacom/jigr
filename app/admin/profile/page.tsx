'use client'

// User Profile Page - Personal account settings
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ImageUploader from '@/app/components/ImageUploader'
import { getUserClient, UserClient } from '@/lib/auth-utils'
import { getVersionDisplay } from '@/lib/version'
import { DesignTokens, getCardStyle, getTextStyle, getFormFieldStyle } from '@/lib/design-system'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { StatCard } from '@/app/components/ModuleCard'

function ProfilePageContent() {
  const [user, setUser] = useState<any>(null)
  const [userClient, setUserClient] = useState<UserClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState<boolean>(true)
  const [emailVerified, setEmailVerified] = useState<boolean>(false)
  const [verificationToken, setVerificationToken] = useState<string | null>(null)
  const [onboardingData, setOnboardingData] = useState({
    userFirstName: '',
    jobTitle: '',
    preferredName: '',
    notificationPreferences: {
      emailAlerts: true,
      complianceReminders: true,
      weeklyReports: false
    }
  })
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === 'true'

  const handleEmailVerification = async (token: string) => {
    try {
      console.log('🔐 Verifying email with token:', token.substring(0, 8) + '...')
      
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        console.log('✅ Email verification successful')
        setEmailVerified(true)
        // Remove verification token from URL
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('verify')
        window.history.replaceState({}, '', newUrl.toString())
      } else {
        console.error('❌ Email verification failed:', result.error)
        alert('Email verification failed: ' + result.error)
      }
    } catch (error) {
      console.error('❌ Email verification error:', error)
      alert('Email verification error. Please try again.')
    }
  }

  const handleResendVerification = async () => {
    try {
      if (!user?.email) {
        alert('No email address found')
        return
      }

      console.log('📧 Requesting verification email resend for:', user.email)

      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log('✅ Verification email resent successfully')
        alert('Verification email sent! Please check your inbox.')
      } else {
        console.error('❌ Failed to resend verification email:', result.error)
        alert('Failed to resend verification email: ' + result.error)
      }
    } catch (error) {
      console.error('❌ Resend verification error:', error)
      alert('Error sending verification email. Please try again.')
    }
  }

  const saveOnboardingData = async () => {
    try {
      if (!user) return

      console.log('💾 Saving onboarding data:', onboardingData)

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          preferred_name: onboardingData.preferredName,
          job_title: onboardingData.jobTitle,
          notification_preferences: onboardingData.notificationPreferences
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('❌ Profile update error:', profileError)
        alert('Failed to update profile: ' + profileError.message)
        return
      }


      // Update client_users job title if we have userClient
      if (userClient && onboardingData.jobTitle) {
        const { error: clientUserError } = await supabase
          .from('client_users')
          .update({
            job_title: onboardingData.jobTitle
          })
          .eq('client_id', userClient.clientId)

        if (clientUserError) {
          console.warn('⚠️ Job title update failed:', clientUserError)
        }
      }

      console.log('✅ Onboarding data saved successfully')
      alert('Profile updated successfully!')

      // If this was onboarding, redirect to console
      if (isOnboarding) {
        router.push('/admin/console')
      }

    } catch (error) {
      console.error('❌ Save error:', error)
      alert('Failed to save profile changes. Please try again.')
    }
  }


  useEffect(() => {
    async function loadUserProfile() {
      setLoading(true)
      let user = null
      
      // Get authenticated user
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        user = authUser
        console.log('🔍 PROFILE PAGE: Auth user check result:', user ? 'Found' : 'Not found')
      } catch (authError) {
        console.log('⚠️ PROFILE PAGE: Auth check failed, using demo user:', authError)
      }
      
      if (!user) {
        // Auto sign-in as demo user for development
        console.log('🔍 PROFILE PAGE: Using demo user for development')
        const demoUser = {
          id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
          email: 'demo@example.com',
          created_at: '2024-01-01T00:00:00.000Z',
          email_verified_at: '2024-01-01T00:00:00.000Z',
          user_metadata: {
            full_name: 'Demo User'
          }
        }
        user = demoUser
      }
      
      setUser(user)
      
      // Check email verification token in URL
      const verifyToken = searchParams.get('verify')
      if (verifyToken) {
        setVerificationToken(verifyToken)
        await handleEmailVerification(verifyToken)
      }
      
      // Check if email is verified
      if ((user as any)?.email_verified_at) {
        setEmailVerified(true)
      }
      
      // Get user's company information using reliable API call
      try {
        console.log('🔍 PROFILE PAGE: Loading client info via API for user:', user.id)
        const response = await fetch(`/api/user-client?userId=${user.id}`)
        
        if (response.ok) {
          const data = await response.json()
          const clientInfo = data.userClient
          
          console.log('✅ PROFILE PAGE: Client info loaded via API:', {
            name: clientInfo.name,
            role: clientInfo.role
          })
          
          setUserClient(clientInfo)
          
          // Check if user has permission to access profile management
          // Allow: Administrators, Owners, or the profile owner themselves
          const hasProfileAccess = 
            clientInfo.role === 'Administrator' || 
            clientInfo.role === 'Owner' ||
            user.id === user.id // Profile owner (they can always edit their own profile)
          
          setHasAccess(hasProfileAccess)
          
          if (!hasProfileAccess) {
            console.warn('Access denied: User does not have permission to access profile management')
          }
        } else {
          console.log('ℹ️ PROFILE PAGE: No client info found (demo user or missing data) - allowing profile access')
          // For demo users or users without client data, allow profile access
          setHasAccess(true)
        }
      } catch (error) {
        console.log('⚠️ PROFILE PAGE: Error loading client info via API (continuing):', error)
        // Continue loading profile even if client info fails
        setHasAccess(true)
      }
      
      // Fetch user profile data with error handling
      try {
        console.log('🔍 PROFILE PAGE: Loading profile data for user:', user.id)
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (!error && profileData) {
          console.log('✅ PROFILE PAGE: Profile data loaded successfully')
          setProfile(profileData)
          setAvatarUrl(profileData.avatar_url)
          
          // Update onboarding data with profile data
          setOnboardingData(prev => ({
            ...prev,
            jobTitle: profileData.job_title || '',
            preferredName: profileData.preferred_name || '',
            notificationPreferences: profileData.notification_preferences || {
              emailAlerts: true,
              complianceReminders: true,
              weeklyReports: false
            }
          }))
        } else {
          console.log('ℹ️ PROFILE PAGE: No profile data found, using demo fallback')
          // Demo fallback
          setProfile({
            id: user.id,
            full_name: user.user_metadata?.full_name || 'User',
            avatar_url: null,
            phone: ''
          })
        }
        
      } catch (profileError) {
        console.log('⚠️ PROFILE PAGE: Profile loading failed, using demo fallback:', profileError)
        // Demo fallback for any profile loading errors
        setProfile({
          id: user.id,
          full_name: user.user_metadata?.full_name || 'User',
          avatar_url: null,
          phone: ''
        })
      }

      setLoading(false)
    }

    loadUserProfile()
  }, [searchParams])

  const handleAvatarUploadSuccess = (url: string) => {
    setAvatarUrl(url)
    setProfile((prev: any) => ({ ...prev, avatar_url: url }))
  }

  const handleAvatarUploadError = (error: string) => {
    console.error('Avatar upload error:', error)
    alert(`Avatar upload failed: ${error}`)
  }

  const handleDownloadData = async () => {
    setIsDownloading(true)
    
    try {
      // Generate comprehensive user data report
      const reportDate = new Date().toLocaleDateString('en-NZ')
      
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>JiGR Data Export - ${user?.email}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 3px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1F2937; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; }
        .data-row { display: flex; margin-bottom: 12px; }
        .data-label { font-weight: 600; width: 200px; color: #374151; }
        .data-value { color: #1F2937; flex: 1; }
        .empty-value { color: #9CA3AF; font-style: italic; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
    <div class="header">
        <h1>JiGR Data Export Report</h1>
        <p>Personal Data Report for ${user?.email}</p>
        <p>Generated on ${reportDate}</p>
    </div>

    <div class="section">
        <h2>👤 Personal Information</h2>
        <div class="data-row">
            <div class="data-label">Email Address:</div>
            <div class="data-value">${user?.email || 'Not specified'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">User ID:</div>
            <div class="data-value">${user?.id || 'Not available'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">Account Created:</div>
            <div class="data-value">${user?.created_at ? new Date(user.created_at).toLocaleDateString('en-NZ') : 'Not available'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">Email Verified:</div>
            <div class="data-value">${user?.email_verified_at ? 'Yes (' + new Date(user.email_verified_at).toLocaleDateString('en-NZ') + ')' : 'No'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">Preferred Name:</div>
            <div class="data-value">${profile?.preferred_name || onboardingData?.preferredName || '<span class="empty-value">Not specified</span>'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">Job Title:</div>
            <div class="data-value">${profile?.job_title || onboardingData?.jobTitle || '<span class="empty-value">Not specified</span>'}</div>
        </div>
    </div>

    <div class="section">
        <h2>🏢 Company Information</h2>
        <div class="data-row">
            <div class="data-label">Company Name:</div>
            <div class="data-value">${userClient?.name || '<span class="empty-value">Not specified</span>'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">Business Type:</div>
            <div class="data-value">${userClient?.business_type || '<span class="empty-value">Not specified</span>'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">Owner Name:</div>
            <div class="data-value">${userClient?.owner_name || '<span class="empty-value">Not specified</span>'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">Business Email:</div>
            <div class="data-value">${userClient?.business_email || '<span class="empty-value">Not specified</span>'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">Phone Number:</div>
            <div class="data-value">${userClient?.phone || '<span class="empty-value">Not specified</span>'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">Business Address:</div>
            <div class="data-value">${userClient?.address || '<span class="empty-value">Not specified</span>'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">License Number:</div>
            <div class="data-value">${userClient?.license_number || '<span class="empty-value">Not specified</span>'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">Role:</div>
            <div class="data-value">${userClient?.role || '<span class="empty-value">Not specified</span>'}</div>
        </div>
    </div>

    <div class="section">
        <h2>📊 Account Status</h2>
        <div class="data-row">
            <div class="data-label">Subscription Status:</div>
            <div class="data-value">${userClient?.subscription_status || '<span class="empty-value">Not specified</span>'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">Subscription Tier:</div>
            <div class="data-value">${userClient?.subscription_tier || '<span class="empty-value">Not specified</span>'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">Onboarding Status:</div>
            <div class="data-value">${userClient?.onboarding_status || '<span class="empty-value">Not completed</span>'}</div>
        </div>
    </div>

    <div class="section">
        <h2>⚙️ Preferences</h2>
        <div class="data-row">
            <div class="data-label">Email Alerts:</div>
            <div class="data-value">${onboardingData?.notificationPreferences?.emailAlerts ? 'Enabled' : 'Disabled'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">Compliance Reminders:</div>
            <div class="data-value">${onboardingData?.notificationPreferences?.complianceReminders ? 'Enabled' : 'Disabled'}</div>
        </div>
        <div class="data-row">
            <div class="data-label">Weekly Reports:</div>
            <div class="data-value">${onboardingData?.notificationPreferences?.weeklyReports ? 'Enabled' : 'Disabled'}</div>
        </div>
    </div>

    <div class="footer">
        <p>This report contains all personal data stored in the JiGR | Modular Hospitality Solution system.</p>
        <p>Generated by JiGR Suite v${getVersionDisplay ? getVersionDisplay('short') : '1.0'} | Export ID: ${Date.now()}</p>
        <p>For questions about your data, contact: <a href="mailto:privacy@jigr.app">privacy@jigr.app</a></p>
    </div>
</body>
</html>`

      // Create and download the file
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `jigr-data-export-${user?.email?.replace('@', '-')}-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('❌ Download error:', error)
      alert('Failed to generate data export. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSignOutAllDevices = async () => {
    if (!confirm('Sign out from all devices? You will need to log in again on all your devices.')) {
      return
    }

    setIsSigningOut(true)
    
    try {
      await supabase.auth.signOut({ scope: 'global' })
      router.push('/login')
    } catch (error) {
      console.error('❌ Sign out error:', error)
      alert('Failed to sign out from all devices. Please try again.')
      setIsSigningOut(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type "DELETE" to confirm')
      return
    }

    try {
      // In a real implementation, this would call an API endpoint
      // that properly handles account deletion with all related data
      alert('Account deletion is not implemented yet. Please contact support.')
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
    } catch (error) {
      console.error('❌ Delete account error:', error)
      alert('Failed to delete account. Please contact support.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`${getCardStyle('primary')} max-w-md text-center`}>
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-4">
            You don&apos;t have permission to access profile management. 
            Only Administrators and Owners can manage user profiles.
          </p>
          <button
            onClick={() => router.push('/admin/console')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Return to Console
          </button>
        </div>
      </div>
    )
  }

  return (
    <StandardPageWrapper moduleName="admin" currentPage="profile" onboardingData={onboardingData}>
      {/* Profile Cards - 3 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 AdaptiveLayout">
        
        {/* Profile Image Card */}
        <StatCard accentColor="blue" theme="admin">
          <div>
            <div className="flex items-center justify-center mb-4">
              <h2 className="text-gray-900 text-lg font-semibold text-center w-full">Profile Picture</h2>
            </div>
            <div className="text-center">
              <ImageUploader
                currentImageUrl={avatarUrl}
                onUploadSuccess={handleAvatarUploadSuccess}
                onUploadError={handleAvatarUploadError}
                uploadEndpoint="/api/upload-avatar"
                uploadData={{ userId: user?.id || '' }}
                shape="circle"
              />
            </div>
          </div>
        </StatCard>

        {/* User Info Card */}
        <StatCard accentColor="green" theme="admin">
          <div>
            <div className="flex items-center justify-center mb-4">
              <h2 className="text-gray-900 text-lg font-semibold text-center w-full">User Info</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-800">
              <div>
                <p className="font-semibold text-gray-900 text-base">
                  {profile?.full_name || user?.user_metadata?.full_name || 'User Profile'}
                </p>
              </div>
              <div>
                <p><strong>Email:</strong> {user?.email}</p>
              </div>
              <div>
                <p><strong>Job Title:</strong> {profile?.job_title || onboardingData?.jobTitle || 'Not set'}</p>
              </div>
              <div>
                <p><strong>Company:</strong> {userClient?.name || 'Loading...'}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800/10">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">-</div>
                  <div className="text-xs text-gray-600">Documents</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">-</div>
                  <div className="text-xs text-gray-600">Days Active</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">-</div>
                  <div className="text-xs text-gray-600">Compliance</div>
                </div>
              </div>
            </div>
          </div>
        </StatCard>

        {/* Hero Trophy Card */}
        <StatCard accentColor="yellow" theme="admin">
          <div>
            <div className="flex items-center justify-center mb-4">
              <h2 className="text-gray-900 text-lg font-semibold text-center w-full">Achievement</h2>
            </div>
            <div className="text-center">
              {userClient?.champion_enrolled ? (
                <div>
                  <img 
                    src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/branding/trophy.svg"
                    alt="Hero Trophy"
                    className="w-16 h-16 object-contain mx-auto mb-4"
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-900">
                      JiGR Hero
                    </p>
                    <a 
                      href="/champion/program"
                      className="text-xs text-yellow-600 hover:text-yellow-800 underline hover:no-underline transition-colors block"
                    >
                      Find Out More
                    </a>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">
                      No Achievement Yet
                    </p>
                    <p className="text-xs text-gray-500">
                      Complete goals to earn your hero status
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </StatCard>

      </div>

      {/* Personal Information - 2 Columns Wide */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <StatCard accentColor="purple" theme="admin">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-gray-900 text-lg font-semibold">Personal Information</h2>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="preferredName" className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Name
                    </label>
                    <input
                      type="text"
                      id="preferredName"
                      value={onboardingData.preferredName}
                      onChange={(e) => setOnboardingData(prev => ({ ...prev, preferredName: e.target.value }))}
                      className={getFormFieldStyle('default')}
                      placeholder="How should we address you?"
                    />
                  </div>

                  <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title
                    </label>
                    <input
                      type="text"
                      id="jobTitle"
                      value={onboardingData.jobTitle}
                      onChange={(e) => setOnboardingData(prev => ({ ...prev, jobTitle: e.target.value }))}
                      className={getFormFieldStyle('default')}
                      placeholder="e.g., Restaurant Manager, Chef, Owner"
                    />
                  </div>
                </div>

                {/* Notification Preferences */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Notification Preferences</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={onboardingData.notificationPreferences.emailAlerts}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            emailAlerts: e.target.checked
                          }
                        }))}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Email alerts for compliance issues</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={onboardingData.notificationPreferences.complianceReminders}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            complianceReminders: e.target.checked
                          }
                        }))}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Daily compliance reminders</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={onboardingData.notificationPreferences.weeklyReports}
                        onChange={(e) => setOnboardingData(prev => ({
                          ...prev,
                          notificationPreferences: {
                            ...prev.notificationPreferences,
                            weeklyReports: e.target.checked
                          }
                        }))}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Weekly compliance reports</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={saveOnboardingData}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {isOnboarding ? 'Complete Setup' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </StatCard>
        </div>
      </div>

      {/* Password & Security - 2 Columns Wide */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <StatCard accentColor="orange" theme="admin">
            <div>
              <h2 className="text-gray-900 text-lg font-semibold mb-6">Password & Security</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    className={getFormFieldStyle('default')}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      className={getFormFieldStyle('default')}
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className={getFormFieldStyle('default')}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </StatCard>
        </div>
      </div>

      {/* Account Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard accentColor="blue" theme="admin">
          <div className="text-center">
            <button 
              onClick={handleDownloadData}
              disabled={isDownloading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-xl transition-all duration-200"
            >
              <h3 className="font-semibold text-lg mb-1">
                {isDownloading ? 'Downloading...' : 'Download My Data'}
              </h3>
              <p className="text-sm text-blue-100">Export all your data</p>
            </button>
          </div>
        </StatCard>
        
        <StatCard accentColor="yellow" theme="admin">
          <div className="text-center">
            <button 
              onClick={handleSignOutAllDevices}
              disabled={isSigningOut}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-xl transition-all duration-200"
            >
              <h3 className="font-semibold text-lg mb-1">
                {isSigningOut ? 'Signing Out...' : 'Sign Out All Devices'}
              </h3>
              <p className="text-sm text-yellow-100">Security action</p>
            </button>
          </div>
        </StatCard>
        
        <StatCard accentColor="orange" theme="admin">
          <div className="text-center">
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200"
            >
              <h3 className="font-semibold text-lg mb-1">Delete Account</h3>
              <p className="text-sm text-red-100">Permanent action</p>
            </button>
          </div>
        </StatCard>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-red-600 mb-4">Delete Account</h3>
            <p className="text-gray-700 mb-4">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <p className="text-gray-700 mb-4">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
      
    </StandardPageWrapper>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfilePageContent />
    </Suspense>
  )
}