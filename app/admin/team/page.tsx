'use client'

// Admin Team - Enhanced user management with RBAC invitation system
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ImageUploader from '@/app/components/ImageUploader'
import { getUserClient, UserClient } from '@/lib/auth-utils'
import { getVersionDisplay } from '@/lib/version'
import { DesignTokens, getCardStyle, getTextStyle, getFormFieldStyle } from '@/lib/design-system'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { StatCard } from '@/app/components/ModuleCard'
// Removed RoleBasedSidebar - using AppleSidebar from layout instead
import UserInvitationModal from '@/app/components/team/UserInvitationModal'
import type { InvitationFormData, UserRole } from '@/app/components/team/UserInvitationModal'
import { Users, UserPlus, Settings, MoreVertical, Clock, Mail, Crown, Shield, Wrench, UserIcon } from 'lucide-react'

interface TeamMember {
  id: string
  email: string
  fullName: string
  role: UserRole
  status: 'active' | 'inactive' | 'pending'
  lastLogin?: string
  invitedAt?: string
  department?: string
  jobTitle?: string
  phone?: string
}

interface PendingInvitation {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdAt: string
  expiresAt: string
  inviterName: string
  department?: string
  jobTitle?: string
}

export default function AdminTeamPage() {
  const [user, setUser] = useState<any>(null)
  const [userClient, setUserClient] = useState<UserClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [jobTitles, setJobTitles] = useState<{id: string, title: string, default_role: string}[]>([])
  const [inviteFormData, setInviteFormData] = useState<{
    email: string
    firstName: string 
    lastName: string
    jobTitleId: string
    role: string
  }>({
    email: '',
    firstName: '',
    lastName: '',
    jobTitleId: '',
    role: 'STAFF'
  })
  const router = useRouter()

  // =====================================================
  // DATA LOADING FUNCTIONS
  // =====================================================

  const loadTeamData = async (clientId: string) => {
    try {
      setRefreshing(true)

      // Load team members
      const { data: membersData, error: membersError } = await supabase
        .from('client_users')
        .select(`
          *,
          profiles!inner (
            id,
            email,
            full_name,
            phone
          )
        `)
        .eq('client_id', clientId)
        .order('role', { ascending: false })

      if (membersError) {
        console.error('Error loading team members:', membersError)
      } else {
        const members: TeamMember[] = membersData.map((member: any) => ({
          id: member.user_id,
          email: member.profiles.email,
          fullName: member.profiles.full_name || 'Unknown User',
          role: member.role as UserRole,
          status: member.status,
          lastLogin: member.last_active_at,
          invitedAt: member.invited_at,
          department: member.department,
          jobTitle: member.job_title,
          phone: member.profiles.phone
        }))
        setTeamMembers(members)
      }

      // Load pending invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('invitations')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          department,
          job_title,
          created_at,
          expires_at,
          status,
          profiles!invited_by (
            full_name
          )
        `)
        .eq('client_id', clientId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (invitationsError) {
        console.error('Error loading invitations:', invitationsError)
      } else {
        const invitations: PendingInvitation[] = invitationsData.map((invite: any) => ({
          id: invite.id,
          email: invite.email,
          firstName: invite.first_name,
          lastName: invite.last_name,
          role: invite.role as UserRole,
          department: invite.department,
          jobTitle: invite.job_title,
          createdAt: invite.created_at,
          expiresAt: invite.expires_at,
          inviterName: invite.profiles?.full_name || 'Team Admin'
        }))
        setPendingInvitations(invitations)
      }

    } catch (error) {
      console.error('Error loading team data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const loadJobTitles = async () => {
    try {
      console.log('🔍 Loading job titles...')
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 Session:', session ? 'Found' : 'None')
      
      if (!session?.access_token) {
        console.log('❌ No session token, skipping job titles load')
        return
      }

      console.log('🔍 Fetching job titles from API...')
      const response = await fetch('/api/config/job-titles', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('🔍 API Response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Job titles loaded:', result.items?.length || 0, 'items')
        setJobTitles(result.items || [])
        
        // If no job titles found, add default ones as fallback
        if (!result.items || result.items.length === 0) {
          console.log('📝 No job titles found, using defaults')
          setJobTitles([
            { id: 'default-staff', title: 'Staff Member', default_role: 'STAFF' },
            { id: 'default-supervisor', title: 'Supervisor', default_role: 'SUPERVISOR' },
            { id: 'default-manager', title: 'Manager', default_role: 'MANAGER' }
          ])
        }
      } else {
        const error = await response.text()
        console.log('❌ API Error:', error)
        // Fallback to default job titles on API error
        console.log('📝 API failed, using default job titles')
        setJobTitles([
          { id: 'default-staff', title: 'Staff Member', default_role: 'STAFF' },
          { id: 'default-supervisor', title: 'Supervisor', default_role: 'SUPERVISOR' },
          { id: 'default-manager', title: 'Manager', default_role: 'MANAGER' }
        ])
      }
    } catch (error) {
      console.error('❌ Error loading job titles:', error)
    }
  }

  const handleInviteUser = async (invitationData: InvitationFormData) => {
    try {
      // Use demo client ID for now if userClient is not available
      const clientId = userClient?.clientId || '1'
      
      if (!clientId) {
        throw new Error('Client ID not found')
      }

      // Ensure we have a fresh, valid session token
      console.log('🔍 Refreshing session before API call...')
      
      // First, try to refresh the session to ensure token is current
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.warn('⚠️ Session refresh failed, using existing session:', refreshError)
      }
      
      // Use refreshed session if available, otherwise fall back to current session
      const { data: { session } } = await supabase.auth.getSession()
      const finalSession = refreshedSession || session
      
      console.log('🔍 Frontend session details:', {
        userId: finalSession?.user?.id,
        userEmail: finalSession?.user?.email,
        hasAccessToken: !!finalSession?.access_token,
        tokenPreview: finalSession?.access_token?.substring(0, 20) + '...',
        wasRefreshed: !!refreshedSession
      })
      
      // Verify the session user matches the frontend user we expect
      const expectedUserId = user?.id || userClient?.id
      if (finalSession?.user?.id !== expectedUserId) {
        console.error('❌ Session user mismatch!', {
          frontendUser: expectedUserId,
          sessionUser: finalSession?.user?.id
        })
        throw new Error('Session authentication mismatch. Please refresh the page and try again.')
      }
      
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalSession?.access_token || ''}`,
        },
        body: JSON.stringify({
          ...invitationData,
          clientId: clientId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation')
      }

      // Refresh team data to show new invitation (skip in demo mode)
      if (clientId !== '1') {
        await loadTeamData(clientId)
      }

      return { success: true }
    } catch (error) {
      console.error('Error sending invitation:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send invitation' 
      }
    }
  }

  const handleDemoSignIn = async () => {
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
    
    setProfile({
      id: demoUser.id,
      full_name: 'Demo User',
      avatar_url: null,
      email: demoUser.email,
      role: 'OWNER',
      department: 'Management',
      phone: '+64 21 123 456',
      created_at: new Date().toISOString()
    })

    // Load demo team data
    setTeamMembers([
      { 
        id: '1', 
        email: 'admin@demo.com', 
        fullName: 'Demo User',
        role: 'OWNER', 
        status: 'active', 
        lastLogin: new Date().toISOString(),
        department: 'Management',
        jobTitle: 'Restaurant Owner'
      },
      { 
        id: '2', 
        email: 'kitchen@demo.com', 
        fullName: 'Kitchen Manager',
        role: 'MANAGER', 
        status: 'active', 
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        department: 'Kitchen',
        jobTitle: 'Head Chef'
      },
      { 
        id: '3', 
        email: 'front@demo.com', 
        fullName: 'Front Staff',
        role: 'STAFF', 
        status: 'active', 
        lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        department: 'Front of House',
        jobTitle: 'Server'
      }
    ])

    // Set demo pending invitations
    setPendingInvitations([
      {
        id: 'demo-pending-1',
        email: 'steve@newrestaurant.com',
        firstName: 'Steve',
        lastName: 'Laird',
        role: 'MANAGER',
        department: 'Kitchen',
        jobTitle: 'Sous Chef',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days left
        inviterName: 'Demo User'
      }
    ])
    
    setLoading(false)
    
    // Set user client for demo
    setUserClient({
      id: '1',
      clientId: '1',
      name: 'Demo Restaurant',
      role: 'OWNER'
    })
  }

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Admin Team: Starting auth check...')
      const { data: { user } } = await supabase.auth.getUser()
      
      console.log('🔍 Admin Team: User data:', user ? { id: user.id, email: user.email } : 'No user')
      
      if (!user) {
        console.log('❌ Admin Team: No user found, falling back to demo mode')
        await handleDemoSignIn()
      } else {
        console.log('✅ Admin Team: Real user found, loading client info...')
        setUser(user)
        
        try {
          console.log('🔍 Admin Team: Calling getUserClient for user ID:', user.id)
          const clientInfo = await getUserClient(user.id)
          console.log('🔍 Admin Team: Client info result:', clientInfo)
          
          if (clientInfo) {
            console.log('✅ Admin Team: Client info loaded successfully:', clientInfo.name)
            setUserClient(clientInfo)
            
            // CRITICAL: Load real team data for this client
            console.log('🔍 Admin Team: Loading team data for client ID:', clientInfo.clientId)
            await loadTeamData(clientInfo.clientId)
            console.log('✅ Admin Team: Team data loading completed')
            
            // Load job titles for invite modal
            await loadJobTitles()
            console.log('✅ Admin Team: Job titles loaded')
          } else {
            console.log('❌ Admin Team: No client info found for user')
          }
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (profileData) {
            setProfile(profileData)
            setAvatarUrl(profileData.avatar_url)
          }
        } catch (error) {
          console.error('❌ Admin Team: Error loading client info or team data:', error)
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
            <p className={getTextStyle('body', 'light')}>Loading team...</p>
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
            <h1 className={`${getTextStyle('pageTitle', 'light')} mb-2`}>
              Team Management
            </h1>
            <p className={`${getTextStyle('bodySmall', 'light')} mb-6`}>
              Please sign in to manage your team
            </p>
            
            <button
              onClick={handleDemoSignIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] mb-4"
            >
              LOGIN as Demo User
            </button>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <p className="text-xs text-white/70">
                Demo mode with test team data
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <StandardPageWrapper moduleName="admin" currentPage="team">
      {/* Team Overview Cards - 3 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 AdaptiveLayout">
        
        {/* Total Team Members */}
        <StatCard accentColor="blue" theme="admin">
          <div>
            <div className="flex items-center justify-center mb-4">
              <h2 className="text-gray-900 text-lg font-semibold text-center w-full">Total Members</h2>
            </div>
            <div className="text-center mb-6">
              <img 
                src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/JiGRteam.png"
                alt="Team Members"
                className="w-16 h-16 object-contain mx-auto mb-4"
              />
            </div>
            <div className="space-y-1 text-sm text-gray-800">
              <p><strong>Active:</strong> {teamMembers.filter(member => member.status === 'active').length}</p>
              <p><strong>Pending:</strong> {pendingInvitations.length}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800/10">
              <p className="text-blue-600 text-xs text-center">
                {teamMembers.length + pendingInvitations.length} Total
              </p>
            </div>
          </div>
        </StatCard>

        {/* Active Users */}
        <StatCard accentColor="green" theme="admin">
          <div>
            <div className="flex items-center justify-center mb-4">
              <h2 className="text-gray-900 text-lg font-semibold text-center w-full">Active Users</h2>
            </div>
            <div className="text-center mb-6">
              <img 
                src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/JiGRStats.png"
                alt="Active Users"
                className="w-16 h-16 object-contain mx-auto mb-4"
              />
            </div>
            <div className="space-y-1 text-sm text-gray-800">
              <p><strong>Last Hour:</strong> 2</p>
              <p><strong>Today:</strong> {teamMembers.filter(member => member.status === 'active').length}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800/10">
              <p className="text-green-600 text-xs text-center">
                {teamMembers.filter(member => member.status === 'active').length} Online
              </p>
            </div>
          </div>
        </StatCard>

        {/* Roles */}
        <StatCard accentColor="purple" theme="admin">
          <div>
            <div className="flex items-center justify-center mb-4">
              <h2 className="text-gray-900 text-lg font-semibold text-center w-full">Roles</h2>
            </div>
            <div className="text-center mb-6">
              <img 
                src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/JiGRadmin.png"
                alt="Administrator Roles"
                className="w-16 h-16 object-contain mx-auto mb-4"
              />
            </div>
            <div className="space-y-1 text-sm text-gray-800">
              <p><strong>Managers:</strong> {teamMembers.filter(member => member.role === 'MANAGER').length}</p>
              <p><strong>Staff:</strong> {teamMembers.filter(member => member.role === 'STAFF').length}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800/10">
              <p className="text-purple-600 text-xs text-center">
                {teamMembers.filter(member => member.role === 'OWNER').length} Owners
              </p>
            </div>
          </div>
        </StatCard>

      </div>



      {/* Team Members List - 2 Columns Wide */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <StatCard accentColor="blue" theme="admin">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-gray-900 text-lg font-semibold">Team Members</h2>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="hover:opacity-80 transition-all duration-200"
                  title="Invite Member"
                >
                  <img 
                    src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/adduser.png"
                    alt="Invite Member"
                    className="w-11 h-11"
                  />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Active Team Members */}
                {teamMembers.map((member) => (
                  <div key={`member-${member.id}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {member.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-gray-900 font-medium text-base">{member.fullName}</h3>
                        <p className="text-gray-600 text-sm">{member.email}</p>
                        <div className="flex items-center space-x-2">
                          {member.department && (
                            <span className="text-blue-600 text-xs">{member.department}</span>
                          )}
                          {member.department && member.jobTitle && (
                            <span className="text-gray-400">•</span>
                          )}
                          {member.jobTitle && (
                            <span className="text-green-600 text-xs">{member.jobTitle}</span>
                          )}
                          {!member.department && !member.jobTitle && (
                            <span className="text-gray-600 text-xs">{member.role}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-right">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.status === 'active' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {member.status}
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <span className="text-lg">⚙️</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Pending Invitations */}
                {pendingInvitations.map((invitation) => (
                  <div key={`invitation-${invitation.id}`} className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200 border-l-4 border-l-orange-500">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center border-2 border-orange-200">
                        <span className="text-sm font-semibold text-orange-600">
                          {invitation.firstName?.charAt(0)}{invitation.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-gray-900 font-medium text-base">{invitation.firstName} {invitation.lastName}</h3>
                        <p className="text-gray-600 text-sm">{invitation.email}</p>
                        <div className="flex items-center space-x-2">
                          {invitation.department && (
                            <span className="text-blue-600 text-xs">{invitation.department}</span>
                          )}
                          {invitation.department && invitation.jobTitle && (
                            <span className="text-gray-400">•</span>
                          )}
                          {invitation.jobTitle && (
                            <span className="text-green-600 text-xs">{invitation.jobTitle}</span>
                          )}
                          {!invitation.department && !invitation.jobTitle && (
                            <span className="text-gray-600 text-xs">{invitation.role}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-right">
                      <div>
                        <p className="text-gray-600 text-xs">
                          Invited: {new Date(invitation.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                        pending
                      </div>
                      <button className="text-gray-400 hover:text-gray-600" title="Cancel invitation">
                        <span className="text-lg">❌</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {teamMembers.length === 0 && pendingInvitations.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">👥</span>
                    </div>
                    <p className="text-gray-900 font-medium mb-2">No team members yet</p>
                    <p className="text-gray-600 text-sm">Start by inviting your first team member</p>
                  </div>
                )}
              </div>
            </div>
          </StatCard>
        </div>
      </div>

      {/* SIMPLIFIED INVITATION MODAL FOR iPAD */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '400px',
            width: '90%',
            maxHeight: '80%',
            overflow: 'auto'
          }}>
            <h2 style={{color: 'black', marginBottom: '20px'}}>Invite Team Member</h2>
            
            <div style={{marginBottom: '15px'}}>
              <label style={{color: 'black', display: 'block', marginBottom: '5px'}}>Email:</label>
              <input 
                type="email" 
                value={inviteFormData.email}
                onChange={(e) => setInviteFormData(prev => ({...prev, email: e.target.value}))}
                placeholder="email@example.com"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px'
                }}
              />
            </div>
            
            <div style={{marginBottom: '15px'}}>
              <label style={{color: 'black', display: 'block', marginBottom: '5px'}}>First Name:</label>
              <input 
                type="text" 
                value={inviteFormData.firstName}
                onChange={(e) => setInviteFormData(prev => ({...prev, firstName: e.target.value}))}
                placeholder="John"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px'
                }}
              />
            </div>
            
            <div style={{marginBottom: '15px'}}>
              <label style={{color: 'black', display: 'block', marginBottom: '5px'}}>Last Name:</label>
              <input 
                type="text" 
                value={inviteFormData.lastName}
                onChange={(e) => setInviteFormData(prev => ({...prev, lastName: e.target.value}))}
                placeholder="Doe"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px'
                }}
              />
            </div>
            
            <div style={{marginBottom: '20px'}}>
              <label style={{color: 'black', display: 'block', marginBottom: '5px'}}>Job:</label>
              <select 
                value={inviteFormData.jobTitleId}
                onChange={(e) => {
                  const selectedJobTitle = jobTitles.find(jt => jt.id === e.target.value)
                  setInviteFormData(prev => ({
                    ...prev, 
                    jobTitleId: e.target.value,
                    role: selectedJobTitle?.default_role || 'STAFF'
                  }))
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px'
                }}
              >
                <option value="">Select a job position...</option>
                {jobTitles.map(jobTitle => (
                  <option key={jobTitle.id} value={jobTitle.id}>
                    {jobTitle.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{display: 'flex', gap: '10px'}}>
              <button 
                onClick={() => {
                  setInviteFormData({ email: '', firstName: '', lastName: '', jobTitleId: '', role: 'STAFF' })
                  setShowInviteModal(false)
                }}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  flex: 1
                }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!inviteFormData.email || !inviteFormData.firstName || !inviteFormData.lastName || !inviteFormData.jobTitleId) {
                    alert('Please fill in all fields')
                    return
                  }
                  
                  const selectedJobTitle = jobTitles.find(jt => jt.id === inviteFormData.jobTitleId)
                  const invitationData: InvitationFormData = {
                    email: inviteFormData.email,
                    firstName: inviteFormData.firstName,
                    lastName: inviteFormData.lastName,
                    role: inviteFormData.role as UserRole,
                    jobTitle: selectedJobTitle?.title || 'Staff'
                  }
                  const result = await handleInviteUser(invitationData)
                  
                  if (result.success) {
                    alert('Invitation sent successfully!')
                    setInviteFormData({ email: '', firstName: '', lastName: '', jobTitleId: '', role: 'STAFF' })
                    setShowInviteModal(false)
                  } else {
                    alert('Error: ' + (result.error || 'Failed to send invitation'))
                  }
                }}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  flex: 1
                }}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </StandardPageWrapper>
  )
}