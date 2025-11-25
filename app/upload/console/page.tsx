'use client'

// Upload Console - Module Dashboard Overview
import { useState, useEffect } from 'react'
import EnhancedComplianceDashboard from '../../components/compliance/EnhancedComplianceDashboard'
import SimpleResultsCard from '../../components/results/SimpleResultsCard'
import { supabase } from '@/lib/supabase'
import { DesignTokens, getCardStyle, getTextStyle } from '@/lib/design-system'
import { getUserClient, UserClient } from '@/lib/auth-utils'
import { getModuleConfig } from '@/lib/module-config'
import { StatCard } from '@/app/components/ModuleCard'
import { getThemedCardStyles, getModuleTheme } from '@/lib/theme-utils'
import { ConsolePageWrapper } from '@/app/components/UniversalPageWrapper'
import { UniversalFooter } from '@/app/components/UniversalFooter'
import Link from 'next/link'

export default function UploadConsolePage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userClient, setUserClient] = useState<UserClient | null>(null)
  const [latestDeliveryRecord, setLatestDeliveryRecord] = useState<any>(null)
  const [processingResults, setProcessingResults] = useState<any>(null)
  const [todaysUploads, setTodaysUploads] = useState<any[]>([])
  const [totalUploads, setTotalUploads] = useState<number>(0)
  const [processingCount, setProcessingCount] = useState<number>(0)
  const [successRate, setSuccessRate] = useState<number>(0)

  // Authentication handled by upload layout
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setUser(user)
          
          try {
            const clientInfo = await getUserClient(user.id)
            if (clientInfo) {
              setUserClient(clientInfo)
              console.log('✅ Upload Console: Real user authenticated with company:', clientInfo.name)
            }
          } catch (error) {
            console.error('Error loading client info:', error)
          }
        } else {
          // Demo mode fallback
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
        }
      } catch (error) {
        console.error('Authentication error:', error)
      }
      
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  // Load today's uploads
  useEffect(() => {
    const loadTodaysUploads = async () => {
      if (!user) return
      
      try {
        const today = new Date().toISOString().split('T')[0]
        const { data, error } = await supabase
          .from('delivery_records')
          .select('*')
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`)
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (data && !error) {
          setTodaysUploads(data)
          console.log(`📊 Console: Loaded ${data.length} uploads from today`)
        }
      } catch (error) {
        console.error('❌ Failed to load today\'s uploads:', error)
      }
    }
    
    loadTodaysUploads()
  }, [user])

  // Fetch latest delivery records for console overview
  useEffect(() => {
    const fetchLatestResults = async () => {
      try {
        console.log('🔍 Starting fetchLatestResults - checking user and supabase client')
        console.log('🔍 User exists:', !!user)
        console.log('🔍 Supabase client exists:', !!supabase)
        
        // Check environment variables
        console.log('🔍 Environment check:', {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
          supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
        })
        
        if (!supabase) {
          console.error('❌ Supabase client is null - environment variables may be missing')
          return
        }
        
        // First, let's try a simple count query to test table access
        console.log('🔍 Testing table access with count query...')
        const { count, error: countError } = await supabase
          .from('delivery_records')
          .select('*', { count: 'exact', head: true })
          
        if (countError) {
          console.error('❌ Table access test failed:', countError)
          console.error('❌ Count error details:', JSON.stringify(countError, null, 2))
          console.log('🔄 Using mock data for demo purposes...')
          
          // Create mock data for demo
          const mockRecord = {
            id: 'demo-001',
            supplier_name: 'SERVICE FOODS - AUCKLAND FOODSERVICE',
            delivery_date: '2025-09-07T09:30:00.000Z',
            created_at: new Date().toISOString(),
            uploaded_by: 'steve@jigr.co.nz',
            image_path: null, // No image to avoid 404 errors
            processing_status: 'completed',
            user_name: 'Steve Puna',
            confidence_score: 0.95,
            item_count: 8
          }
          
          setLatestDeliveryRecord(mockRecord)
          setTotalUploads(5)
          setProcessingCount(0)
          setSuccessRate(100)
          setTodaysUploads([mockRecord])
          
          console.log('✅ Mock data set successfully')
          return
        }
        
        console.log('✅ Table access successful. Total records:', count)
        
        const { data: deliveryRecords, error } = await supabase
          .from('delivery_records')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)

        console.log('📊 Upload Console: Raw response - data:', deliveryRecords)
        console.log('📊 Upload Console: Raw response - error:', error)
        console.log('📊 Total delivery records found:', deliveryRecords?.length || 0)

        if (error) {
          console.error('Error fetching delivery records:', error)
          console.error('Error details:', JSON.stringify(error, null, 2))
          return
        }

        if (deliveryRecords && deliveryRecords.length > 0) {
          const record = deliveryRecords[0]
          console.log('📊 Upload Console: Latest record FULL DATA:', record)
          console.log('📊 Supplier fields check:', {
            supplier_name: record.supplier_name,
            supplier_info: record.supplier_info,
            supplier: record.supplier,
            company_name: record.company_name,
            analysis: record.analysis,
            extraction_data: record.extraction_data
          })
          console.log('📊 Image path FOR THUMBNAIL:', record.image_path)
          console.log('📊 Raw extracted text length:', record.raw_extracted_text?.length || 0)
          setLatestDeliveryRecord(record)
          
          if (record.analysis || record.extraction_data) {
            const resultsData = record.analysis || record.extraction_data
            console.log('📊 Upload Console: Setting processing results:', resultsData)
            setProcessingResults(resultsData)
          }
        } else {
          console.log('📊 Upload Console: No delivery records found - showing empty state')
          setLatestDeliveryRecord(null)
        }
      } catch (error) {
        console.error('Error in fetchLatestResults:', {
          error: error,
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })
      }
    }

    console.log('🔍 Console useEffect: user state:', user ? 'User exists' : 'No user')
    
    // For demo purposes, always try to fetch data even without user auth
    console.log('🔍 Console: Calling fetchLatestResults() regardless of user state for demo')
    fetchLatestResults()
    fetchStatistics()
  }, [user])

  // Enhanced statistics fetching with more detailed data
  const fetchStatistics = async () => {
    try {
      // Total uploads count
      const { count: totalCount } = await supabase
        .from('delivery_records')
        .select('*', { count: 'exact', head: true })
      
      setTotalUploads(totalCount || 0)
      
      // Processing count (currently processing)
      const { count: processingCount } = await supabase
        .from('delivery_records')
        .select('*', { count: 'exact', head: true })
        .eq('processing_status', 'processing')
      
      setProcessingCount(processingCount || 0)
      
      // Enhanced success rate calculation
      const { count: completedCount } = await supabase
        .from('delivery_records')
        .select('*', { count: 'exact', head: true })
        .eq('processing_status', 'completed')
      
      const { count: failedCount } = await supabase
        .from('delivery_records')
        .select('*', { count: 'exact', head: true })
        .eq('processing_status', 'failed')
      
      const totalProcessed = (completedCount || 0) + (failedCount || 0)
      const rate = totalProcessed > 0 ? Math.round(((completedCount || 0) / totalProcessed) * 100) : 100
      setSuccessRate(rate)
      
      console.log('📊 Enhanced statistics updated:', {
        total: totalCount,
        processing: processingCount,
        completed: completedCount,
        failed: failedCount,
        successRate: rate,
        timestamp: new Date().toLocaleTimeString()
      })
      
    } catch (error) {
      console.error('❌ Failed to fetch statistics:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
      // Set default values to prevent UI from breaking
      setTotalUploads(0)
      setProcessingCount(0) 
      setSuccessRate(100)
    }
  }

  // Add manual refresh function
  const refreshData = async () => {
    console.log('🔄 Manual refresh triggered')
    
    // Fetch statistics
    await fetchStatistics()
    
    // Fetch latest record
    const { data: deliveryRecords, error } = await supabase
      .from('delivery_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    console.log('🔄 Manual refresh - Found records:', deliveryRecords?.length || 0)
    
    if (error) {
      console.error('🔄 Manual refresh error:', error)
      return
    }

    // Update the actual state with the fetched data
    if (deliveryRecords && deliveryRecords.length > 0) {
      const record = deliveryRecords[0]
      setLatestDeliveryRecord(record)
      
      if (record.analysis || record.extraction_data) {
        const resultsData = record.analysis || record.extraction_data
        setProcessingResults(resultsData)
      }
    }
  }

  // Auto-fetch data on component mount
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        refreshData()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [user])
  
  // Auto-refresh statistics every 30 seconds
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        fetchStatistics()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [user])

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className={getCardStyle('primary')}>
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className={`${getTextStyle('body')} font-medium`}>Loading Upload Console...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Get theme-aware styling
  const theme = getModuleTheme('upload')
  const { cardStyle, textColors, getInlineStyles } = getThemedCardStyles(theme)

  return (
    <ConsolePageWrapper moduleName="upload">

      {/* Upload Statistics Cards - 3 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 AdaptiveLayout">
        
        {/* Total Uploads */}
        <StatCard accentColor="blue" theme="upload">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-300 text-sm font-medium">Total Uploads</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {totalUploads}
          </div>
          <div className="text-green-300 text-sm">
            <span className="inline-flex items-center space-x-1">
              <span>{totalUploads > 0 ? 'Documents uploaded' : 'Ready to process'}</span>
            </span>
          </div>
        </StatCard>

        {/* Processing Status */}
        <StatCard accentColor="purple" theme="upload">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-300 text-sm font-medium">Processing</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {processingCount}
          </div>
          <div className="text-blue-300 text-sm">
            <span className="inline-flex items-center space-x-1">
              <span>{processingCount > 0 ? 'Currently processing' : 'AI ready'}</span>
            </span>
          </div>
        </StatCard>

        {/* Success Rate */}
        <StatCard accentColor="green" theme="upload">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-300 text-sm font-medium">Success Rate</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {totalUploads > 0 ? `${successRate}%` : '100%'}
          </div>
          <div className="text-green-300 text-sm">
            <span className="inline-flex items-center space-x-1">
              <span>{totalUploads > 0 ? 'OCR accuracy rate' : 'System ready'}</span>
            </span>
          </div>
        </StatCard>

      </div>

      {/* Latest Upload Results - 3 Columns Wide under Stats Cards */}
      {latestDeliveryRecord && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-3">
            <SimpleResultsCard 
              data={{
                id: latestDeliveryRecord.id,
                supplier_name: (() => {
                  // Priority order: database fields first, then parsed extraction data
                  if (latestDeliveryRecord.supplier_name) return latestDeliveryRecord.supplier_name
                  if (latestDeliveryRecord.supplier_info) return latestDeliveryRecord.supplier_info
                  if (latestDeliveryRecord.supplier) return latestDeliveryRecord.supplier
                  if (latestDeliveryRecord.company_name) return latestDeliveryRecord.company_name
                  
                  // Try to parse extraction data as fallback
                  try {
                    if (latestDeliveryRecord.raw_extracted_text && typeof latestDeliveryRecord.raw_extracted_text === 'string') {
                      const extractedData = JSON.parse(latestDeliveryRecord.raw_extracted_text)
                      if (extractedData.supplier_name) return extractedData.supplier_name
                      if (extractedData.supplier) return extractedData.supplier
                    }
                  } catch (e) {
                    // Silently handle parsing errors
                  }
                  
                  return 'Processing...'
                })(),
                delivery_date: (() => {
                  // Priority order: database field first, then parsed extraction data
                  if (latestDeliveryRecord.delivery_date) return latestDeliveryRecord.delivery_date
                  
                  // Try to parse extraction data as fallback
                  try {
                    if (latestDeliveryRecord.raw_extracted_text && typeof latestDeliveryRecord.raw_extracted_text === 'string') {
                      const extractedData = JSON.parse(latestDeliveryRecord.raw_extracted_text)
                      if (extractedData.delivery_date) return extractedData.delivery_date
                      if (extractedData.date) return extractedData.date
                    }
                  } catch (e) {
                    // Silently handle parsing errors
                  }
                  
                  // Final fallback to creation date
                  return latestDeliveryRecord.created_at
                })(),
                created_at: latestDeliveryRecord.created_at,
                uploaded_by: latestDeliveryRecord.uploaded_by,
                image_path: latestDeliveryRecord.image_path,
                user_name: user?.user_metadata?.full_name || user?.email,
                confidence_score: latestDeliveryRecord.confidence_score,
                client_id: latestDeliveryRecord.client_id || userClient?.id,
                raw_extracted_text: latestDeliveryRecord.raw_extracted_text,
                line_items: latestDeliveryRecord.line_items,
                temperature_reading: latestDeliveryRecord.temperature_reading,
                analysis: latestDeliveryRecord.analysis,
                extraction_data: latestDeliveryRecord.extraction_data
              }}
              userId={user?.id}
            />
          </div>
        </div>
      )}

      <div className="space-y-16">
        
        {/* Today's Uploads Section */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-2 lg:col-span-2">
              <div 
                style={{
                  ...getInlineStyles(),
                  padding: '24px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-green-300 text-sm font-medium">UPLOADS TODAY</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-green-200 text-xs">{todaysUploads.length} documents</span>
                      <button
                        onClick={refreshData}
                        className="text-white/70 hover:text-white transition-colors duration-200 p-1 hover:bg-white/10 rounded-md TouchTarget"
                        title="Refresh data"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {todaysUploads.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {todaysUploads.map((upload, index) => (
                        <div key={upload.id || index} className="flex items-center space-x-4 p-3" style={{
                          borderRadius: '38px', 
                          backgroundColor: 'rgba(255, 255, 255, 0.12)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          transition: 'all 0.2s ease'
                        }}>
                          {/* Thumbnail */}
                          {upload.image_path && (
                            <div className="w-12 h-12 overflow-hidden flex-shrink-0" style={{
                              borderRadius: '12px',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                              <img 
                                src={upload.image_path} 
                                alt="Upload thumbnail"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget
                                  target.style.display = 'none'
                                  const fallback = document.createElement('div')
                                  fallback.className = 'w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center'
                                  fallback.innerHTML = '<div class="text-white/60 text-lg">📄</div>'
                                  target.parentNode?.appendChild(fallback)
                                }}
                              />
                            </div>
                          )}
                          {/* Upload Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-sm truncate">
                              {upload.supplier_name || 'Processing...'}
                            </div>
                            <div className="text-green-200/80 text-xs">
                              {new Date(upload.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                              {upload.item_count && upload.item_count > 0 && (
                                <span className="ml-2">• {upload.item_count} items</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="text-white/60 text-2xl mb-2">📄</div>
                        <h3 className="text-[#2d2e4a] text-sm font-medium">No uploads today</h3>
                        <p className="text-white/60 text-xs">Visit capture page to upload documents</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Compliance Dashboard for Real Users */}
        {userClient?.id && (
          <div>
            {(() => {
              try {
                return (
                  <EnhancedComplianceDashboard 
                    clientId={userClient.id}
                    userId={user.id}
                  />
                )
              } catch (error) {
                console.error('EnhancedComplianceDashboard error:', error)
                return (
                  <div style={{
                    ...getInlineStyles(),
                    padding: '24px'
                  }}>
                    <div className="text-center py-12">
                      <h2 className={`${getTextStyle('sectionTitle')} ${textColors.title} mb-4`}>
                        📊 Compliance Analytics
                      </h2>
                      <p className={`${getTextStyle('body')} ${textColors.secondary} mb-6`}>
                        Dashboard is loading... If this persists, please contact support.
                      </p>
                      <div className="bg-orange-600/20 border border-orange-400/30 rounded-xl p-4">
                        <p className="text-orange-200 text-sm">
                          Loading enhanced compliance features...
                        </p>
                      </div>
                    </div>
                  </div>
                )
              }
            })()}
          </div>
        )}

      </div>
      
      <UniversalFooter />
    </ConsolePageWrapper>
  )
}