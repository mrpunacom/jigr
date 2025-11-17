'use client'

// Admin Configure - Business configuration and customization
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserClient, UserClient } from '@/lib/auth-utils'
import { getVersionDisplay } from '@/lib/version'
import { DesignTokens, getCardStyle, getTextStyle, getFormFieldStyle, getButtonStyle } from '@/lib/design-system'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
// import RoleConfigCard from '@/app/components/admin/RoleConfigCard'
import DepartmentConfigCardNew from '@/app/components/admin/DepartmentConfigCardNew'
import JobTitleConfigCard from '@/app/components/admin/JobTitleConfigCard'
import SecurityConfigCardNew from '@/app/components/admin/SecurityConfigCardNew'
import StorageConfigCardNew from '@/app/components/admin/StorageConfigCardNew'
import SecurityLegend from '@/app/components/admin/SecurityLegend'

interface BackgroundAsset {
  id: string
  name: string
  file_url: string
  category: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  alt_text: string | null
}

export default function AdminConfigurePage() {
  const [user, setUser] = useState<any>(null)
  const [userClient, setUserClient] = useState<UserClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setUser(user)
          
          const clientInfo = await getUserClient(user.id)
          if (clientInfo) {
            setUserClient(clientInfo)
          }
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        setLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])


  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      // Placeholder for configuration saving
      // In a future update, this will save actual configuration data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessage('Configuration saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Save failed:', error)
      setMessage('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <StandardPageWrapper moduleName="admin" currentPage="configure">
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className={getTextStyle('body', 'light')}>Loading configuration...</p>
        </div>
      </StandardPageWrapper>
    )
  }

  return (
    <StandardPageWrapper moduleName="admin" currentPage="configure">

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl ${message.includes('success') 
          ? 'bg-green-500/20 border border-green-500/30 text-green-100' 
          : 'bg-red-500/20 border border-red-500/30 text-red-100'
        }`}>
          {message}
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-6">
        
        {/* Left Column - Main Content */}
        <div className="flex-1">
          <div className="space-y-8">
        
        {/* Business Structure Configuration */}
        <div className={getCardStyle('primary')}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`${getTextStyle('sectionTitle', 'light')}`}>{userClient?.name || 'Business'} Structure</h2>
            <SecurityLegend />
          </div>
          
          {/* Three-Column Configuration Layout */}
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Departments Configuration */}
            <div>
              <DepartmentConfigCardNew />
            </div>
            
            {/* Job Titles Configuration */}
            <div>
              <JobTitleConfigCard />
            </div>
            
            {/* Security Configuration */}
            <div>
              <SecurityConfigCardNew />
            </div>
          </div>
        </div>

        {/* Operational Configuration */}
        <div className={getCardStyle('primary')}>
          <h2 className={`${getTextStyle('sectionTitle', 'light')} mb-6`}>{userClient?.business_type || 'Operational'} Settings</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Storage Areas Configuration */}
            <div>
              <StorageConfigCardNew />
            </div>

          </div>
        </div>

        {/* System Information */}
        <div className={getCardStyle('primary')}>
          <h2 className={`${getTextStyle('sectionTitle', 'light')} mb-6`}>System Information</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className={getTextStyle('body', 'light')}><strong>Version:</strong> {getVersionDisplay()}</p>
              <p className={getTextStyle('body', 'light')}><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className={getTextStyle('body', 'light')}><strong>Environment:</strong> Production</p>
              <p className={getTextStyle('body', 'light')}><strong>Region:</strong> New Zealand</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`${getButtonStyle('primary')} py-3 px-8 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

          </div>
        </div>

        {/* Right Column - Empty Sidebar */}
        <div className="w-64">
          {/* Empty sidebar to maintain layout consistency */}
        </div>

      </div>

      {/* Note: Background selector and asset upload modals will be integrated in a future update */}

    </StandardPageWrapper>
  )
}