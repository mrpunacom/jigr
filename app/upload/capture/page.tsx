'use client'

// Upload Action - Core Module Functionality (Document Upload & Processing)
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserClient, UserClient } from '@/lib/auth-utils'
import { DesignTokens, getCardStyle, getTextStyle } from '@/lib/design-system'
import { getMappedIcon } from '@/lib/image-storage'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { StatCard, ActionCard, ModuleCard } from '@/app/components/ModuleCard'
import EnhancedFileUpload from '@/lib/ImageProcessing/Components/EnhancedFileUpload'
import { QualityReport } from '@/lib/ImageProcessing/Utils/ImageQualityValidator'

export default function UploadActionPage() {
  const [user, setUser] = useState<any>(null)
  const [userClient, setUserClient] = useState<UserClient | null>(null)
  const [loading, setLoading] = useState(true)
  const [todaysUploads, setTodaysUploads] = useState<any[]>([])
  const [showNotification, setShowNotification] = useState(false)
  const [showQualityUpload, setShowQualityUpload] = useState(false)
  const [queuedFiles, setQueuedFiles] = useState<Array<{file: File, qualityReport: QualityReport}>>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingSuccess, setProcessingSuccess] = useState(false)
  const router = useRouter()

  // Authentication handled by upload layout
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        console.log('🔍 AUTH DEBUG: User found:', user.email, user.id)
        
        try {
          // Query client_users junction table to get user's client
          const { data: clientUserData, error: clientUserError } = await supabase
            .from('client_users')
            .select(`
              role,
              status,
              clients (
                id,
                name,
                business_type,
                business_email,
                subscription_status
              )
            `)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1)
            
          console.log('🔍 AUTH DEBUG: Client-user lookup result:', clientUserData, clientUserError)
          
          if (clientUserData && clientUserData.length > 0 && !clientUserError && clientUserData[0].clients) {
            const clientInfo: UserClient = {
              id: (clientUserData[0].clients as any).id,
              name: (clientUserData[0].clients as any).name,
              role: clientUserData[0].role,
              email: (clientUserData[0].clients as any).business_email
            }
            setUserClient(clientInfo)
            console.log('✅ AUTH DEBUG: Client found via junction table:', clientInfo.name, clientInfo.id)
          } else {
            console.error('❌ AUTH DEBUG: No active client relationship found:', clientUserError)
            
            // Check what relationships exist for this user
            const { data: allUserClients } = await supabase
              .from('client_users')
              .select('role, status, clients(name)')
              .eq('user_id', user.id)
            console.log('🔍 AUTH DEBUG: User client relationships:', allUserClients)
          }
        } catch (error) {
          console.error('🚨 AUTH DEBUG: Database error:', error)
        }
      } else {
        // Check for demo mode - Compliance path triggers demo mode automatically
        const isDemoMode = typeof window !== 'undefined' && (
          window.location.pathname.startsWith('/compliance') ||
          new URLSearchParams(window.location.search).get('demo') === 'true' ||
          document.cookie.includes('demo-session=active')
        )
        
        if (isDemoMode) {
          console.log('🚀 Upload Action demo mode detected')
          const demoUser = {
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
            email: 'demo@example.com',
            app_metadata: {},
            user_metadata: { full_name: 'Demo User - Upload Action' },
            aud: 'authenticated',
            role: 'authenticated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          setUser(demoUser)
        }
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
          console.log(`📊 Loaded ${data.length} uploads from today`)
        } else {
          // Add mock data for capture page when no real uploads exist
          const mockUploads = [
            {
              id: 'demo-001',
              supplier_name: 'SERVICE FOODS - AUCKLAND FOODSERVICE',
              delivery_date: '2025-09-07T09:30:00.000Z',
              created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
              uploaded_by: 'steve@jigr.co.nz',
              image_path: null,
              processing_status: 'completed',
              item_count: 8
            },
            {
              id: 'demo-002', 
              supplier_name: 'SYSCO FOODSERVICE',
              delivery_date: '2025-09-08T14:15:00.000Z',
              created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
              uploaded_by: 'steve@jigr.co.nz',
              image_path: null,
              processing_status: 'completed',
              item_count: 12
            },
            {
              id: 'demo-003',
              supplier_name: 'BIDFOOD LIMITED',
              delivery_date: '2025-09-08T16:45:00.000Z', 
              created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
              uploaded_by: 'steve@jigr.co.nz',
              image_path: null,
              processing_status: 'processing',
              item_count: 6
            }
          ]
          setTodaysUploads(mockUploads)
          console.log(`📊 Loaded ${mockUploads.length} mock uploads for demo`)
        }
      } catch (error) {
        console.error('❌ Failed to load today\'s uploads:', error)
        // Fallback to mock data on error
        const mockUploads = [
          {
            id: 'demo-001',
            supplier_name: 'SERVICE FOODS - AUCKLAND FOODSERVICE',
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            processing_status: 'completed',
            item_count: 8
          }
        ]
        setTodaysUploads(mockUploads)
      }
    }
    
    loadTodaysUploads()
  }, [user])

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <ModuleCard className="p-6">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white font-medium">Loading Upload Action...</p>
            </div>
          </ModuleCard>
        </div>
      </div>
    )
  }

  const handleUploadSuccess = (deliveryRecords: any[]) => {
    console.log('Compliance batch upload successful:', deliveryRecords)
    // Add new uploads to today's list
    setTodaysUploads(prev => [...prev, ...deliveryRecords])
    setShowNotification(true)
    
    // Auto-dismiss notification after 6 seconds
    setTimeout(() => {
      setShowNotification(false)
    }, 6000)
  }

  const handleUploadError = (error: string) => {
    console.error('Compliance batch upload failed:', error)
  }

  const handleProgressUpdate = (completedCount: number, totalCount: number) => {
    console.log(`Compliance upload progress: ${completedCount}/${totalCount} files completed`)
  }

  const handleFileValidated = (file: File, qualityReport: QualityReport) => {
    console.log('File validated for OCR:', file.name, 'Quality score:', qualityReport.score)
    setQueuedFiles(prev => [...prev, { file, qualityReport }])
    setProcessingSuccess(false) // Reset success state when new files added
  }

  const handleFileRejected = (file: File, qualityReport: QualityReport) => {
    console.log('File rejected due to poor quality:', file.name, 'Quality score:', qualityReport.score)
    // Still allow manual override via the quality indicator buttons
  }

  // Camera capture function - direct API processing
  const handleCameraCapture = () => {
    // Create a file input element for camera capture
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' // Use back camera on mobile devices
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        console.log('📸 Camera capture file selected:', file.name)
        
        try {
          // Create FormData for direct API upload
          const formData = new FormData()
          formData.append('file', file)
          formData.append('clientId', userClient?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
          formData.append('userId', user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10')
          formData.append('qualityScore', '85') // Camera captures get good quality score

          // Call the upload API directly for immediate processing
          console.log('📡 Processing camera capture via /api/upload-docket')
          const uploadResponse = await fetch('/api/upload-docket', {
            method: 'POST',
            body: formData
          })

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            console.error('❌ Camera capture processing failed:', errorText)
            alert(`Camera capture failed: ${errorText}`)
            return
          }

          const result = await uploadResponse.json()
          console.log('✅ Camera capture processed successfully:', result)
          
          // Update UI with result
          if (result.enhancedExtraction) {
            const newUpload = {
              id: result.deliveryRecordId || Date.now(),
              supplier_name: result.enhancedExtraction.supplier?.value || 'Unknown Supplier',
              created_at: new Date().toISOString(),
              image_path: URL.createObjectURL(file),
              ai_extraction: result.enhancedExtraction
            }
            setTodaysUploads(prev => [newUpload, ...prev])
            setShowNotification(true)
            setTimeout(() => setShowNotification(false), 6000)
          }
          
        } catch (error) {
          console.error('❌ Camera capture processing error:', error)
          alert(`Camera capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }
    
    // Trigger the file picker
    input.click()
  }

  const processQueuedFiles = async () => {
    if (queuedFiles.length === 0) return

    console.log(`🚀 Processing ${queuedFiles.length} files with AI extraction`)
    
    setIsProcessing(true)
    
    try {
      // Process each file through the real AI pipeline
      const results = []
      
      for (const queuedFile of queuedFiles) {
        console.log(`📄 Processing: ${queuedFile.file.name}`)
        
        // Create FormData for API upload (same as EnhancedUpload component)
        const formData = new FormData()
        formData.append('file', queuedFile.file)
        formData.append('clientId', userClient?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
        formData.append('userId', user?.id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a10')
        formData.append('qualityScore', queuedFile.qualityReport.score.toString())

        // Call the real upload API
        console.log(`📡 Calling /api/upload-docket for ${queuedFile.file.name}`)
        const uploadResponse = await fetch('/api/upload-docket', {
          method: 'POST',
          body: formData
        })

        console.log(`📡 Response status: ${uploadResponse.status} ${uploadResponse.statusText}`)

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text()
          console.error(`❌ API Error Details:`, errorText)
          throw new Error(`Upload failed (${uploadResponse.status}): ${errorText}`)
        }

        const result = await uploadResponse.json()
        console.log('✅ AI Processing complete:', result)
        
        results.push(result)
        
        // Update UI with real result
        if (result.enhancedExtraction) {
          const newUpload = {
            id: result.deliveryRecordId || Date.now(),
            supplier_name: result.enhancedExtraction.supplier?.value || 'Unknown Supplier',
            created_at: new Date().toISOString(),
            image_path: URL.createObjectURL(queuedFile.file),
            ai_extraction: result.enhancedExtraction
          }
          setTodaysUploads(prev => [newUpload, ...prev])
        }
      }
      
      // Clear queue after successful processing
      setQueuedFiles([])
      setShowNotification(true)
      setProcessingSuccess(true)
      
      console.log(`🎉 Successfully processed ${results.length} documents`)
      
      // Show success feedback for 3 seconds, then reset
      setTimeout(() => {
        setProcessingSuccess(false)
      }, 3000)
      
      setTimeout(() => {
        setShowNotification(false)
      }, 6000)
      
    } catch (error) {
      console.error('❌ Processing failed:', error)
      // Show error to user but keep files in queue for retry
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Processing failed: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const removeFromQueue = (index: number) => {
    setQueuedFiles(prev => prev.filter((_, i) => i !== index))
  }



  return (
    <StandardPageWrapper moduleName="upload" currentPage="capture">
      

      {/* Capture Interface Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 AdaptiveLayout">
        
        {/* Quick Capture Card */}
        <StatCard accentColor="blue" theme="upload">
          <div>
            <div className="flex items-center justify-center mb-4">
              <h2 className="text-[#2d2e4a] text-lg font-semibold text-center w-full">Quick Capture</h2>
            </div>
            <div className="text-center mb-6">
              <img 
                src={getMappedIcon('JiGRcamera', 64)} 
                alt="Camera" 
                className="w-16 h-16 object-contain mx-auto mb-4"
              />
            </div>
            <div 
              className="w-full rounded-xl relative overflow-hidden"
            >
              <button 
                data-camera-trigger
                onClick={handleCameraCapture}
                className="w-full text-white py-3 px-4 transition-all duration-300 text-sm font-semibold bg-white/5 hover:bg-white/15 border border-white/20 rounded-xl hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] TouchTarget"
              >
                Camera Capture
              </button>
            </div>
            <p className="text-blue-200 text-xs mt-2 text-center">
              Single document capture
            </p>
          </div>
        </StatCard>

        {/* Bulk Upload Card */}
        <StatCard accentColor="purple" theme="upload">
          <div>
            <div className="flex items-center justify-center mb-4">
              <h2 className="text-[#2d2e4a] text-lg font-semibold text-center w-full">Bulk Upload</h2>
            </div>
            <div className="text-center mb-6">
              <img 
                src={getMappedIcon('JiGRbulk', 64)} 
                alt="Bulk Upload" 
                className="w-16 h-16 object-contain mx-auto mb-4"
              />
            </div>
            <div 
              className="w-full rounded-xl relative overflow-hidden"
            >
              <button 
                onClick={() => setShowQualityUpload(true)}
                className="w-full text-white py-3 px-4 transition-all duration-300 text-sm font-semibold bg-white/5 hover:bg-white/15 border border-white/20 rounded-xl hover:shadow-lg hover:shadow-purple-500/10 hover:scale-[1.02] active:scale-[0.98] TouchTarget"
              >
                Select Files
              </button>
            </div>
            <p className="text-purple-200 text-xs mt-2 text-center">
              Multiple file upload with quality validation
            </p>
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-purple-200/70 text-xs text-center">
                PNG, JPG, PDF, HEIC
              </p>
              <p className="text-purple-200/70 text-xs text-center">
                Max 8MB each • OCR optimized
              </p>
            </div>
          </div>
        </StatCard>

        {/* Ready Queue Card */}
        <StatCard accentColor="green" theme="upload">
          <div>
            <div className="flex items-center justify-center mb-4">
              <h2 className="text-[#2d2e4a] text-lg font-semibold text-center w-full">Ready Queue</h2>
            </div>
            <div className="text-center mb-6">
              <img 
                src={getMappedIcon('JiGRqueue', 64)} 
                alt="Queue" 
                className="w-16 h-16 object-contain mx-auto mb-4"
              />
            </div>
            <div 
              className={`w-full rounded-xl relative overflow-hidden mb-4 ${queuedFiles.length === 0 ? 'opacity-50' : ''}`}
            >
              <button 
                disabled={queuedFiles.length === 0 || isProcessing || processingSuccess}
                onClick={processQueuedFiles}
                className={`w-full py-3 px-4 text-sm font-semibold transition-all duration-300 border rounded-xl TouchTarget ${
                  processingSuccess
                    ? 'text-green-400 bg-green-500/20 border-green-400/40 shadow-lg shadow-green-500/20'
                    : queuedFiles.length === 0 || isProcessing
                    ? 'text-green-300/50 cursor-not-allowed bg-white/5 border-white/10' 
                    : 'text-green-300 bg-white/5 hover:bg-white/15 border-white/20 hover:shadow-lg hover:shadow-green-500/10 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {processingSuccess ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>Processing Complete!</span>
                  </div>
                ) : isProcessing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-green-300 border-t-transparent rounded-full"></div>
                    <span>Processing AI...</span>
                  </div>
                ) : (
                  'Process Queue'
                )}
              </button>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{queuedFiles.length}</div>
              <div className="text-green-200 text-xs">images ready</div>
            </div>
          </div>
        </StatCard>

      </div>

      {/* Quality Upload Interface */}
      {showQualityUpload && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ModuleCard className="p-8 lg:col-span-3">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-lg font-bold">Quality-Enhanced Upload</h3>
                <button
                  onClick={() => setShowQualityUpload(false)}
                  className="text-white/70 hover:text-white transition-colors duration-200 p-1 hover:bg-white/10 rounded-md"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div data-file-upload>
                <EnhancedFileUpload
                  onFileValidated={handleFileValidated}
                  onFileRejected={handleFileRejected}
                  allowPoorQuality={true}
                  className="mb-6"
                />
              </div>

              {/* Queued Files List */}
              {queuedFiles.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/20">
                  <h4 className="text-white text-sm font-medium mb-4">Quality Validated Files ({queuedFiles.length})</h4>
                  <div className="space-y-3">
                    {queuedFiles.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{item.file.name}</p>
                            <p className="text-white/60 text-xs">
                              Quality: {item.qualityReport.score}% • {(item.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromQueue(index)}
                          className="text-red-400 hover:text-red-300 transition-colors duration-200 p-1 hover:bg-red-500/10 rounded-md"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ModuleCard>
        </div>
      )}


      {/* Simple Upload Status */}
      {todaysUploads.length > 0 && (
        <div className="mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {todaysUploads.slice(0, 8).map((upload, index) => (
              <div key={upload.id || index} className="bg-white/10 border border-white/20 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  {/* Thumbnail */}
                  <div className="w-10 h-10 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                    {upload.image_path ? (
                      <img 
                        src={upload.image_path} 
                        alt="Upload"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget
                          target.style.display = 'none'
                          const fallback = document.createElement('div')
                          fallback.className = 'w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center'
                          fallback.innerHTML = '<div class="text-white/60 text-sm">📄</div>'
                          target.parentNode?.appendChild(fallback)
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">📄</div>
                    )}
                  </div>
                  
                  {/* Status & Supplier */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${upload.processing_status === 'completed' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                      <span className="text-xs text-white/80 font-medium">
                        {upload.processing_status === 'completed' ? 'Success' : 'Processing'}
                      </span>
                    </div>
                    <div className="text-white text-sm font-medium truncate">
                      {upload.supplier_name || 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      
    </StandardPageWrapper>
  )
}