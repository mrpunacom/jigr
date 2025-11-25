'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getVersionDisplay } from '@/lib/version'
import { DesignTokens, getCardStyle, getTextStyle, getFormFieldStyle } from '@/lib/design-system'
// Removed Lucide React imports - using Tabler icons via CSS classes
import { PublicPageBackgroundWithGradient } from '@/app/components/backgrounds/PublicPageBackground'

// =====================================================
// TYPES
// =====================================================

interface InvitationDetails {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  organizationName: string
  inviterName: string
  expiresAt: string
  message?: string
  clientId: string
  clientLogo?: string
}

function AcceptInvitationContent() {
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState<'loading' | 'invalid' | 'expired' | 'register' | 'success'>('loading')

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  // =====================================================
  // ROLE DISPLAY HELPERS
  // =====================================================
  
  function getRoleDisplayName(role: string): string {
    const roleMap: Record<string, string> = {
      'OWNER': 'Owner',
      'MANAGER': 'Manager', 
      'SUPERVISOR': 'Supervisor',
      'STAFF': 'Staff Member'
    }
    return roleMap[role] || role
  }

  function getRoleDescription(role: string): string {
    const descriptions: Record<string, string> = {
      'OWNER': 'Full access to all features and settings',
      'MANAGER': 'Manage team and oversee operations',
      'SUPERVISOR': 'Supervise staff and monitor compliance',
      'STAFF': 'Access core features and submit reports'
    }
    return descriptions[role] || 'Team member access'
  }

  // =====================================================
  // INVITATION VALIDATION
  // =====================================================

  useEffect(() => {
    async function validateInvitation() {
      if (!token) {
        setError('Invalid invitation link')
        setStep('invalid')
        setLoading(false)
        return
      }

      try {
        console.log('🔍 DEBUG: Looking up invitation with token:', token)
        console.log('🔍 DEBUG: Token length:', token?.length)
        console.log('🔍 DEBUG: Token type:', typeof token)
        
        // First check if ANY invitations exist (no token filter)
        const { data: allInvitations, error: allError } = await supabase
          .from('invitations')
          .select('id, email, status, expires_at, token')
          .limit(5)

        console.log('🔍 DEBUG: All recent invitations:', allInvitations)
        console.log('🔍 DEBUG: All invitations error:', allError)
        
        // Now check if invitation exists with this specific token
        const { data: anyInvitation, error: checkError } = await supabase
          .from('invitations')
          .select('id, email, status, expires_at, token')
          .eq('token', token)
          .single()

        console.log('🔍 DEBUG: Specific token search result:', anyInvitation)
        console.log('🔍 DEBUG: Specific token search error:', checkError)

        if (checkError || !anyInvitation) {
          console.log('❌ No invitation found with this token')
          setError('Invitation not found - the link may be invalid or expired')
          setStep('invalid')
          setLoading(false)
          return
        }

        if (anyInvitation.status !== 'pending') {
          console.log(`❌ Invitation status is ${anyInvitation.status}, not pending`)
          setError(`This invitation has already been ${anyInvitation.status}`)
          setStep('invalid')
          setLoading(false)
          return
        }

        if (new Date(anyInvitation.expires_at) < new Date()) {
          console.log('❌ Invitation has expired')
          setError('This invitation has expired')
          setStep('expired')
          setLoading(false)
          return
        }

        // Fetch full invitation details with client logo
        const { data: invitationData, error: inviteError } = await supabase
          .from('invitations')
          .select(`
            id,
            email,
            first_name,
            last_name,
            role,
            expires_at,
            invitation_message,
            status,
            clients!inner (
              id,
              name,
              logo_url
            ),
            profiles!invited_by (
              full_name
            )
          `)
          .eq('token', token)
          .eq('status', 'pending')
          .single()

        if (inviteError || !invitationData) {
          console.log('❌ Error fetching full invitation details:', inviteError)
          setError('Invitation not found or has already been used')
          setStep('invalid')
          setLoading(false)
          return
        }

        // Check if invitation has expired
        const expiresAt = new Date(invitationData.expires_at)
        const now = new Date()
        
        if (now > expiresAt) {
          setError('This invitation has expired')
          setStep('expired')
          setLoading(false)
          return
        }

        // Check if user already exists
        const { data: existingUser } = await supabase.auth.getUser()
        if (existingUser.user && existingUser.user.email === invitationData.email) {
          // User is already signed in with the invited email - accept automatically
          await acceptInvitation(invitationData.id, Array.isArray(invitationData.clients) ? invitationData.clients[0]?.id : (invitationData.clients as any)?.id)
          return
        }

        // Check if user account exists but not signed in
        const { data: userData } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', invitationData.email)
          .single()

        if (userData) {
          // User exists, show message to sign in manually
          setError(`Account already exists for ${invitationData.email}. Please sign in through your usual method to access the invitation.`)
          setLoading(false)
          return
        }

        // New user - show account creation form
        setInvitation({
          id: invitationData.id,
          email: invitationData.email,
          firstName: invitationData.first_name,
          lastName: invitationData.last_name,
          role: invitationData.role,
          organizationName: Array.isArray(invitationData.clients) ? invitationData.clients[0]?.name : (invitationData.clients as any)?.name,
          inviterName: Array.isArray(invitationData.profiles) ? invitationData.profiles[0]?.full_name : (invitationData.profiles as any)?.full_name || 'Team Admin',
          expiresAt: invitationData.expires_at,
          message: invitationData.invitation_message,
          clientId: Array.isArray(invitationData.clients) ? invitationData.clients[0]?.id : (invitationData.clients as any)?.id,
          clientLogo: Array.isArray(invitationData.clients) ? invitationData.clients[0]?.logo_url : (invitationData.clients as any)?.logo_url
        })
        setStep('register')
        setLoading(false)

      } catch (error) {
        console.error('Error validating invitation:', error)
        setError('An error occurred while processing your invitation')
        setStep('invalid')
        setLoading(false)
      }
    }

    validateInvitation()
  }, [token, router])

  // =====================================================
  // INVITATION ACCEPTANCE
  // =====================================================

  const acceptInvitation = async (invitationId: string, clientId: string) => {
    try {
      setAccepting(true)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Authentication required')
      }

      // Ensure user profile exists before creating client_users record
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        console.log('Creating profile for new user...')
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: invitation!.email,
            full_name: `${invitation!.firstName} ${invitation!.lastName}`,
            created_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          throw new Error(`Failed to create user profile: ${profileError.message}`)
        }
      }

      // Accept the invitation by creating client_users record
      const { error: acceptError } = await supabase
        .from('client_users')
        .insert({
          user_id: user.id,
          client_id: clientId,
          role: invitation!.role,
          status: 'active',
          invited_by: null, // Will be set by trigger
          joined_at: new Date().toISOString()
        })

      if (acceptError) {
        console.error('❌ Error creating client_users record:', acceptError)
        throw new Error(`Failed to accept invitation: ${acceptError.message || acceptError.details || 'Unknown error'}`)
      }

      // Update invitation status
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ 
          status: 'accepted',
          accepted_by: user.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      if (updateError) {
        console.error('❌ Error updating invitation status:', updateError)
        // Don't throw here as the main acceptance worked
      }

      console.log('✅ Invitation accepted successfully')
      setStep('success')
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/admin/console')
      }, 3000)

    } catch (error) {
      console.error('Error accepting invitation:', error)
      setError(error instanceof Error ? error.message : 'Failed to accept invitation')
      setAccepting(false)
    }
  }

  // =====================================================
  // ACCOUNT CREATION
  // =====================================================

  const createAccountAndAccept = async () => {
    setError('')
    setAccepting(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setAccepting(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setAccepting(false)
      return
    }

    try {
      console.log('📝 Creating account for:', invitation!.email)
      
      // Create the auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation!.email,
        password: password,
        options: {
          data: {
            full_name: `${invitation!.firstName} ${invitation!.lastName}`,
            first_name: invitation!.firstName,
            last_name: invitation!.lastName
          }
        }
      })

      if (authError) {
        console.error('❌ Auth error:', authError)
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Failed to create user account')
      }

      console.log('✅ Auth account created:', authData.user.id)

      // Wait a moment for any auth triggers to complete
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verify the session is established
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        console.log('⚠️ No session found, signing in...')
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: invitation!.email,
          password: password
        })
        if (signInError) {
          throw new Error(`Failed to sign in: ${signInError.message}`)
        }
      }

      console.log('✅ Session verified, accepting invitation...')
      
      // Accept the invitation
      await acceptInvitation(invitation!.id, invitation!.clientId)

    } catch (error) {
      console.error('❌ Error creating account:', error)
      setError(error instanceof Error ? error.message : 'Failed to create account')
      setAccepting(false)
    }
  }

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const renderClientLogo = () => {
    if (invitation?.clientLogo) {
      return (
        <img 
          src={invitation.clientLogo}
          alt={`${invitation.organizationName} logo`}
          className="w-16 h-16 object-contain mx-auto mb-4"
          onError={(e) => {
            // Fallback to default icon if logo fails to load
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextElementSibling?.classList.remove('hidden')
          }}
        />
      )
    }
    return <span className="icon-[tabler--building] w-16 h-16 text-blue-400 mx-auto mb-4"></span>
  }

  // =====================================================
  // MAIN RENDER - USING PROPER COMPONENT (BackgroundManager now fixed)
  // =====================================================

  return (
    <PublicPageBackgroundWithGradient
      backgroundImage="restaurant.jpg"
      gradientStart="rgba(0,0,0,0.4)"
      gradientEnd="rgba(0,0,0,0.6)"
      additionalOverlay="rgba(0,0,0,0.2)"
    >
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        
        {/* Logo - Same as landing page */}
        <div className="mb-8">
          <img 
            src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/branding/JigrLogoStackWhite.png" 
            alt="JiGR Logo" 
            className="h-32 w-auto md:h-40 object-contain"
          />
        </div>

        {/* Tagline - Same as landing page */}
        <div className="text-center mb-6">
          <h2 className="text-white/90 text-sm md:text-base font-medium tracking-wider uppercase mb-6">
            MODULAR HOSPITALITY SOLUTION
          </h2>
        </div>

        {/* Main Content Card */}
        <div className={`${getCardStyle('primary')} max-w-md w-full mx-auto`} style={{ borderRadius: '36px' }}>

          {/* Loading State */}
          {step === 'loading' && (
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold mb-2" style={{color: '#000000'}}>Processing Invitation</h1>
              <p className="text-base" style={{color: '#000000'}}>
                Please wait while we validate your invitation...
              </p>
            </div>
          )}

          {/* Invalid/Error State */}
          {['invalid', 'expired'].includes(step) && (
            <div className="text-center">
              <span className="icon-[tabler--alert-triangle] w-16 h-16 text-red-400 mx-auto mb-4"></span>
              <h1 className="text-2xl font-bold mb-2" style={{color: '#000000'}}>
                {step === 'expired' ? 'Invitation Expired' : 'Invalid Invitation'}
              </h1>
              <p className="text-base mb-6" style={{color: '#000000'}}>
                {error}
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                Go Home
              </button>
            </div>
          )}

          {/* Account Creation State */}
          {step === 'register' && invitation && (
            <>
              <div className="text-center mb-6">
                {renderClientLogo()}
                <span className="icon-[tabler--building] w-16 h-16 text-blue-400 mx-auto mb-4 hidden"></span>
                <h1 className="text-2xl font-bold mb-2" style={{color: '#000000'}}>Welcome to {invitation.organizationName}</h1>
                <p className="text-base" style={{color: '#000000'}}>
                  You&apos;ve been invited by {invitation.inviterName}
                </p>
              </div>

              {/* Invitation Details */}
              <div className={`${getCardStyle('secondary')} mb-6`} style={{ borderRadius: '24px' }}>
                <div className="flex items-center space-x-3 mb-4">
                  <span className="icon-[tabler--users] w-8 h-8 text-blue-400"></span>
                  <div>
                    <h3 className="text-base font-semibold" style={{color: '#000000'}}>
                      {getRoleDisplayName(invitation.role)}
                    </h3>
                    <p className="text-sm" style={{color: '#000000'}}>
                      {getRoleDescription(invitation.role)}
                    </p>
                  </div>
                </div>
                
                {invitation.message && (
                  <div className="pt-4 border-t border-black/20">
                    <p className="text-sm italic" style={{color: '#000000'}}>
                      &ldquo;{invitation.message}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Account Creation Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4" style={{color: '#000000'}}>Create Your Account</h3>
                
                <div>
                  <label className="block font-bold mb-2" style={{color: '#000000 !important', fontWeight: 'bold'}}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={invitation.email}
                    disabled
                    className={`${getFormFieldStyle()} opacity-60`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2" style={{color: '#000000 !important', fontWeight: 'bold'}}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={`${invitation.firstName} ${invitation.lastName}`}
                    disabled
                    className={`${getFormFieldStyle()} opacity-60`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2" style={{color: '#000000 !important', fontWeight: 'bold'}}>
                    Password (8+ characters)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={getFormFieldStyle()}
                    disabled={accepting}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2" style={{color: '#000000 !important', fontWeight: 'bold'}}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className={getFormFieldStyle()}
                    disabled={accepting}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={createAccountAndAccept}
                  disabled={accepting || !password || !confirmPassword}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                >
                  {accepting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Accept Invitation & Create Account'
                  )}
                </button>
              </div>
            </>
          )}

          {/* Success State */}
          {step === 'success' && invitation && (
            <div className="text-center">
              <span className="icon-[tabler--circle-check] w-16 h-16 text-green-400 mx-auto mb-4"></span>
              <h1 className="text-2xl font-bold mb-2" style={{color: '#000000'}}>Welcome to the Team!</h1>
              <p className="text-base mb-6" style={{color: '#000000'}}>
                You&apos;ve successfully joined {invitation.organizationName} as a {getRoleDisplayName(invitation.role)}.
              </p>
              <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 mb-6">
                <p className="text-sm" style={{color: '#000000'}}>
                  Redirecting you to your dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Version Info */}
          <div className="text-center mt-6 pt-4 border-t border-black/20">
            <p className="text-xs" style={{color: '#000000'}}>
              {getVersionDisplay('prod')}
            </p>
          </div>
        </div>

        {/* Footer - Same as landing page */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-white/50 text-xs">
            © 2025 JiGR | Modular Hospitality Solution
          </p>
        </div>
      </div>
    </PublicPageBackgroundWithGradient>
  )
}

// Loading fallback component
function AcceptInvitationLoading() {
  return (
    <PublicPageBackgroundWithGradient
      backgroundImage="restaurant.jpg"
      gradientStart="rgba(0,0,0,0.4)"
      gradientEnd="rgba(0,0,0,0.6)"
      additionalOverlay="rgba(0,0,0,0.2)"
    >
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-white mb-2">Loading Invitation</h1>
          <p className="text-white/70">Please wait...</p>
        </div>
      </div>
    </PublicPageBackgroundWithGradient>
  )
}

// Main export with Suspense boundary
export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<AcceptInvitationLoading />}>
      <AcceptInvitationContent />
    </Suspense>
  )
}