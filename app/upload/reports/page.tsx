'use client'

// Upload Reports - Module Viewing & Export Functionality
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getUserClient, UserClient } from '@/lib/auth-utils'
import { DesignTokens, getCardStyle, getTextStyle } from '@/lib/design-system'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { StatCard, ModuleCard } from '@/app/components/ModuleCard'

export default function UploadReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [userClient, setUserClient] = useState<UserClient | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Authentication handled by upload layout
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        
        try {
          const clientInfo = await getUserClient(user.id)
          if (clientInfo) {
            setUserClient(clientInfo)
          }
        } catch (error) {
          console.error('Error loading client info in compliance reports:', error)
        }
      } else {
        // Check for demo mode - Compliance path triggers demo mode automatically
        const isDemoMode = typeof window !== 'undefined' && (
          window.location.pathname.startsWith('/compliance') ||
          new URLSearchParams(window.location.search).get('demo') === 'true' ||
          document.cookie.includes('demo-session=active')
        )
        
        if (isDemoMode) {
          console.log('🚀 Upload Reports demo mode detected')
          const demoUser = {
            id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
            email: 'demo@example.com',
            app_metadata: {},
            user_metadata: { full_name: 'Demo User - Upload Reports' },
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

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className={getCardStyle('primary')}>
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white font-medium">Loading Upload Reports...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }


  return (
    <StandardPageWrapper moduleName="upload" currentPage="reports">
      

      <div>
            
            {/* Quick Report Templates */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              
              {/* Weekly Summary */}
              <StatCard accentColor="blue" theme="upload">
                <div>
                  <div className="flex items-center justify-center mb-4">
                    <h2 className="text-[#2d2e4a] text-lg font-semibold text-center w-full">Weekly Summary</h2>
                  </div>
                  <div className="text-center mb-6">
                    <img 
                      src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/JiGRsummary.png" 
                      alt="Summary" 
                      className="w-16 h-16 object-contain mx-auto mb-4"
                    />
                  </div>
                  <div className="w-full rounded-xl relative overflow-hidden">
                    <button className="w-full text-white py-3 px-4 transition-all duration-300 text-sm font-semibold bg-white/5 hover:bg-white/15 border border-white/20 rounded-xl hover:shadow-lg hover:shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] TouchTarget">
                      Preview
                    </button>
                  </div>
                  <p className="text-blue-200 text-xs mt-2 text-center">
                    Comprehensive weekly compliance overview
                  </p>
                </div>
              </StatCard>

              {/* Violation Report */}
              <StatCard accentColor="orange" theme="upload">
                <div>
                  <div className="flex items-center justify-center mb-4">
                    <h2 className="text-[#2d2e4a] text-lg font-semibold text-center w-full">Violation Report</h2>
                  </div>
                  <div className="text-center mb-6">
                    <img 
                      src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/JiGRwarning.png" 
                      alt="Warning" 
                      className="w-16 h-16 object-contain mx-auto mb-4"
                    />
                  </div>
                  <div className="w-full rounded-xl relative overflow-hidden">
                    <button className="w-full text-white py-3 px-4 transition-all duration-300 text-sm font-semibold bg-white/5 hover:bg-white/15 border border-white/20 rounded-xl hover:shadow-lg hover:shadow-red-500/10 hover:scale-[1.02] active:scale-[0.98] TouchTarget">
                      Preview
                    </button>
                  </div>
                  <p className="text-red-200 text-xs mt-2 text-center">
                    Delivery violations and corrective actions
                  </p>
                </div>
              </StatCard>

              {/* Report Statistics */}
              <StatCard accentColor="green" theme="upload">
                <div>
                  <div className="flex items-center justify-center mb-4">
                    <h2 className="text-[#2d2e4a] text-lg font-semibold text-center w-full">Report Statistics</h2>
                  </div>
                  <div className="text-center mb-6">
                    <img 
                      src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/JiGRStats.png" 
                      alt="Statistics" 
                      className="w-16 h-16 object-contain mx-auto mb-4"
                    />
                  </div>
                  <div className="space-y-2 text-sm px-2">
                    <div className="flex justify-between text-white/90">
                      <span>Total Reports:</span>
                      <span className="font-medium text-white">23</span>
                    </div>
                    <div className="flex justify-between text-white/90">
                      <span>This Month:</span>
                      <span className="font-medium text-white">8</span>
                    </div>
                    <div className="flex justify-between text-white/90">
                      <span>Avg Response:</span>
                      <span className="font-medium text-white">2.3s</span>
                    </div>
                    <div className="flex justify-between text-white/90">
                      <span>Data Points:</span>
                      <span className="font-medium text-white">1,247</span>
                    </div>
                  </div>
                  <p className="text-green-200 text-xs mt-3 text-center">
                    Generation metrics and analytics overview
                  </p>
                </div>
              </StatCard>

              {/* Empty 4th Column */}
              <div></div>

            </div>

            {/* Report Controls Section - Below Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              
              {/* Report Filters - Spans Columns 1-2 */}
              <StatCard accentColor="blue" theme="upload" className="md:col-span-2">
                <div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <select className="w-full px-3 py-3 bg-[#2d2e4a]/40 border border-white/40 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 3 months</option>
                        <option value="custom">Custom range</option>
                      </select>
                    </div>
                    
                    <div>
                      <select className="w-full px-3 py-3 bg-[#2d2e4a]/40 border border-white/40 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="compliance">Full Compliance</option>
                        <option value="violations">Violations Only</option>
                        <option value="delivery">Delivery Summary</option>
                        <option value="supplier">Supplier Analysis</option>
                      </select>
                    </div>
                    
                    <div>
                      <select className="w-full px-3 py-3 bg-[#2d2e4a]/40 border border-white/40 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="pdf">PDF Report</option>
                        <option value="csv">CSV Export</option>
                        <option value="excel">Excel Workbook</option>
                        <option value="json">JSON Data</option>
                      </select>
                    </div>
                  </div>
                </div>
              </StatCard>

              {/* Generate Action Card - Column 3 */}
              <StatCard accentColor="green" theme="upload">
                <div className="flex items-center justify-center h-full">
                  <button className="w-full text-white py-3 px-4 transition-all duration-300 text-sm font-semibold bg-white/5 hover:bg-white/15 border border-white/20 rounded-xl hover:shadow-lg hover:shadow-green-500/10 hover:scale-[1.02] active:scale-[0.98] TouchTarget">
                    Generate Report
                  </button>
                </div>
              </StatCard>

            </div>

            {/* Report Table - Recent Generated Reports - 3 Columns Wide */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <ModuleCard className="lg:col-span-3 p-6">
                <h3 className="text-gray-900 text-lg font-bold mb-4">Recent Reports</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200">
                  <div>
                    <h4 className="font-medium text-[#2d2e4a]">Weekly Summary - Aug 13-19, 2025</h4>
                    <p className="text-sm text-[#2d2e4a]/80">Generated on Aug 19, 2025 • 47 deliveries processed</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-300 hover:text-white text-sm font-medium px-3 py-1 rounded-lg hover:bg-blue-600/20 transition-all">
                      PDF
                    </button>
                    <button className="text-green-300 hover:text-white text-sm font-medium px-3 py-1 rounded-lg hover:bg-green-600/20 transition-all">
                      CSV
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200">
                  <div>
                    <h4 className="font-medium text-[#2d2e4a]">Delivery Violations - August 2025</h4>
                    <p className="text-sm text-[#2d2e4a]/80">Generated on Aug 15, 2025 • 3 violations detected</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-300 hover:text-white text-sm font-medium px-3 py-1 rounded-lg hover:bg-blue-600/20 transition-all">
                      PDF
                    </button>
                    <button className="text-green-300 hover:text-white text-sm font-medium px-3 py-1 rounded-lg hover:bg-green-600/20 transition-all">
                      CSV
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-200">
                  <div>
                    <h4 className="font-medium text-[#2d2e4a]">Monthly Compliance - July 2025</h4>
                    <p className="text-sm text-[#2d2e4a]/80">Generated on Aug 1, 2025 • 98.2% compliance rate</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-300 hover:text-white text-sm font-medium px-3 py-1 rounded-lg hover:bg-blue-600/20 transition-all">
                      PDF
                    </button>
                    <button className="text-green-300 hover:text-white text-sm font-medium px-3 py-1 rounded-lg hover:bg-green-600/20 transition-all">
                      CSV
                    </button>
                  </div>
                </div>
                </div>
              </ModuleCard>
              
              {/* Empty 4th Column */}
              <div></div>
            </div>

      </div>
      
    </StandardPageWrapper>
  )
}