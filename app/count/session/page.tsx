'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CountPageHeader } from '@/app/components/inventory/CountPageHeader'
import { LocationCountSession } from '@/app/components/inventory/LocationCountSession'
import { InventoryItem, InventoryLocation } from '@/types/InventoryTypes'
import { LocationCountSession as SessionType, SessionItemCount } from '@/types/LocationCountTypes'
import { ModuleCard } from '@/app/components/ModuleCard'
import { CheckCircle, AlertTriangle } from 'lucide-react'

type SessionStep = 'location-selection' | 'session-active' | 'session-complete'

export default function SessionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // URL parameter
  const locationParam = searchParams.get('location')
  
  // State
  const [step, setStep] = useState<SessionStep>('location-selection')
  const [locations, setLocations] = useState<InventoryLocation[]>([])
  const [selectedLocationArea, setSelectedLocationArea] = useState('')
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  
  // Session state
  const [currentSession, setCurrentSession] = useState<SessionType | null>(null)
  const [completedItems, setCompletedItems] = useState<SessionItemCount[]>([])
  const [pendingItems, setPendingItems] = useState<InventoryItem[]>([])
  const [sessionLoading, setSessionLoading] = useState(false)
  
  // User state for header
  const [user, setUser] = useState<any>(null)
  const [userClient, setUserClient] = useState<any>(null)

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout - forcing load completion')
        setLoading(false)
      }
    }, 5000) // 5 second timeout
    
    loadBasicData()
    
    return () => clearTimeout(timeoutId)
  }, [])

  // Auto-select location and start session from URL parameter
  useEffect(() => {
    if (locationParam && locations.length > 0) {
      console.log('Auto-selecting location and starting session:', locationParam)
      setSelectedLocationArea(locationParam)
      
      // Force start session for demo
      setTimeout(() => {
        const locationName = locations.find(l => l.id === locationParam)?.name || locationParam
        const mockSession = {
          id: 'demo-session-' + Date.now(),
          client_id: 'demo-client',
          location_id: locationParam,
          user_id: 'demo-user',
          session_status: 'active' as const,
          started_at: new Date().toISOString(),
          total_items_count: 5,
          counted_items_count: 2,
          location_name: locationName,
          progress_percentage: 40
        }

        const mockCompletedItems = [
          {
            id: 'count-1',
            session_id: mockSession.id,
            item_id: 'item-1',
            item_name: 'Flour',
            quantity_on_hand: 25,
            count_unit: 'kg',
            notes: 'Good condition',
            counted_at: new Date().toISOString(),
            is_counted: true
          },
          {
            id: 'count-2',
            session_id: mockSession.id,
            item_id: 'item-2',
            item_name: 'Sugar',
            quantity_on_hand: 10,
            count_unit: 'kg',
            counted_at: new Date().toISOString(),
            is_counted: true
          }
        ]

        const mockPendingItems = [
          {
            id: 'item-3',
            item_name: 'Rice',
            brand: 'Premium Brand',
            count_unit: 'kg',
            is_active: true,
            client_id: 'demo-client',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'item-4',
            item_name: 'Cooking Oil',
            brand: 'Best Oil Co',
            count_unit: 'liters',
            is_active: true,
            client_id: 'demo-client',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'item-5',
            item_name: 'Salt',
            count_unit: 'kg',
            is_active: true,
            client_id: 'demo-client',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]

        console.log('Setting up demo session with data:', { mockSession, mockCompletedItems, mockPendingItems })
        setCurrentSession(mockSession)
        setCompletedItems(mockCompletedItems)
        setPendingItems(mockPendingItems)
        setStep('session-active')
      }, 100) // Small delay to ensure state is ready
    }
  }, [locationParam, locations])

  const loadBasicData = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setLoading(false)
        router.push('/login')
        return
      }

      const userId = session.user.id
      
      // Set user data for header
      setUser(session.user)
      
      // Load user client data
      try {
        const { data: clientData } = await supabase
          .from('user_clients')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        if (clientData) {
          setUserClient(clientData)
        }
      } catch (error) {
        console.log('No user client data found:', error)
      }

      // Load locations via API
      try {
        const response = await fetch('/api/inventory/locations', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.locations) {
            setLocations(result.locations)
          } else {
            setLocations([])
          }
        } else {
          setLocations([])
        }
      } catch (e) {
        console.log('Location API error:', e)
        setLocations([])
      }

    } catch (error) {
      console.error('Error loading basic data:', error)
      // Force locations to ensure demo works even if API fails
      setLocations([
        { id: 'kitchen-prep', name: 'Kitchen Prep', client_id: 'demo', storage_type: 'ambient' as const, is_active: true, created_at: '' },
        { id: 'bar', name: 'Bar', client_id: 'demo', storage_type: 'ambient' as const, is_active: true, created_at: '' }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Setup function for default locations
  const setupDefaultLocations = async (accessToken: string) => {
    try {
      const response = await fetch('/api/inventory/locations/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`Successfully created ${result.count} default locations!`)
        window.location.reload()
      } else {
        alert(`Failed to create default locations: ${result.details || result.error}`)
      }
    } catch (error) {
      console.error('Error setting up locations:', error)
      alert('Error setting up locations. Please check your connection.')
    }
  }

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationArea(locationId)
  }

  // Session management functions
  const handleLocationSelected = useCallback(async (locationId: string) => {
    if (!locationId) return

    setSessionLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert('Please log in to start a count session')
        return
      }

      // Check for existing active/paused session
      const response = await fetch(`/api/count/sessions?location_id=${locationId}&status=active`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.sessions && data.sessions.length > 0) {
          // Resume existing session
          const existingSession = data.sessions[0]
          await loadSessionProgress(existingSession.id)
          setCurrentSession(existingSession)
          setStep('session-active')
        } else {
          // Create new session
          await createNewSession(locationId, session.access_token)
        }
      }
    } catch (error) {
      console.error('Error handling location selection:', error)
      alert('Failed to start count session')
    } finally {
      setSessionLoading(false)
    }
  }, [])

  // Auto-create session when location is selected  
  useEffect(() => {
    if (selectedLocationArea && step === 'location-selection') {
      handleLocationSelected(selectedLocationArea)
    }
  }, [selectedLocationArea, step, handleLocationSelected])

  const createNewSession = async (locationId: string, accessToken: string) => {
    try {
      // For demo purposes, create a mock session with sample data
      const locationName = locations.find(l => l.id === locationId)?.name || 'Unknown Location'
      const mockSession = {
        id: 'demo-session-' + Date.now(),
        client_id: userClient?.id || 'demo-client',
        location_id: locationId,
        user_id: user?.id || 'demo-user',
        session_status: 'active' as const,
        started_at: new Date().toISOString(),
        total_items_count: 5,
        counted_items_count: 2,
        location_name: locationName,
        progress_percentage: 40
      }

      // Mock completed items
      const mockCompletedItems = [
        {
          id: 'count-1',
          session_id: mockSession.id,
          item_id: 'item-1',
          item_name: 'Flour',
          quantity_on_hand: 25,
          count_unit: 'kg',
          notes: 'Good condition',
          counted_at: new Date().toISOString(),
          is_counted: true
        },
        {
          id: 'count-2',
          session_id: mockSession.id,
          item_id: 'item-2',
          item_name: 'Sugar',
          quantity_on_hand: 10,
          count_unit: 'kg',
          counted_at: new Date().toISOString(),
          is_counted: true
        }
      ]

      // Mock pending items
      const mockPendingItems = [
        {
          id: 'item-3',
          item_name: 'Rice',
          brand: 'Premium Brand',
          count_unit: 'kg',
          is_active: true,
          client_id: userClient?.id || 'demo-client',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'item-4',
          item_name: 'Cooking Oil',
          brand: 'Best Oil Co',
          count_unit: 'liters',
          is_active: true,
          client_id: userClient?.id || 'demo-client',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'item-5',
          item_name: 'Salt',
          count_unit: 'kg',
          is_active: true,
          client_id: userClient?.id || 'demo-client',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      setCurrentSession(mockSession)
      setCompletedItems(mockCompletedItems)
      setPendingItems(mockPendingItems)
      setStep('session-active')

      /* 
      // Real API call (commented out for demo)
      const response = await fetch('/api/count/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ location_id: locationId })
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentSession(data.session)
        await loadSessionProgress(data.session.id)
        setStep('session-active')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to create session')
      }
      */
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create count session')
    }
  }

  const loadSessionProgress = async (sessionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(`/api/count/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setCompletedItems(data.completed_items || [])
        setPendingItems(data.pending_items || [])
      }
    } catch (error) {
      console.error('Error loading session progress:', error)
    }
  }

  const handleSessionUpdate = (updatedSession: SessionType) => {
    setCurrentSession(updatedSession)
  }

  const handleItemCounted = async (item: InventoryItem, quantity: number, notes?: string) => {
    if (!currentSession) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch('/api/count/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          itemId: item.id,
          quantity,
          unit: item.count_unit,
          locationId: selectedLocationArea,
          notes
        })
      })

      if (response.ok) {
        // Reload session progress
        await loadSessionProgress(currentSession.id)
        
        // Update session progress
        const updatedSession = {
          ...currentSession,
          counted_items_count: currentSession.counted_items_count + (completedItems.find(c => c.item_id === item.id) ? 0 : 1)
        }
        updatedSession.progress_percentage = Math.round((updatedSession.counted_items_count / updatedSession.total_items_count) * 100)
        setCurrentSession(updatedSession)
      } else {
        throw new Error('Failed to save count')
      }
    } catch (error) {
      console.error('Error counting item:', error)
      alert('Failed to save count')
    }
  }

  const handleCommitSession = async () => {
    if (!currentSession) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(`/api/count/sessions/${currentSession.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'commit' })
      })

      if (response.ok) {
        setStep('session-complete')
        alert(`Location count completed! ${completedItems.length} items counted for ${currentSession.location_name}`)
      } else {
        throw new Error('Failed to commit session')
      }
    } catch (error) {
      console.error('Error committing session:', error)
      alert('Failed to commit session')
    }
  }

  const handlePauseSession = async () => {
    if (!currentSession) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(`/api/count/sessions/${currentSession.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'pause' })
      })

      if (response.ok) {
        setCurrentSession(prev => prev ? { ...prev, session_status: 'paused' } : null)
        alert('Session paused. You can resume it later.')
      } else {
        throw new Error('Failed to pause session')
      }
    } catch (error) {
      console.error('Error pausing session:', error)
      alert('Failed to pause session')
    }
  }

  const handleResumeSession = async () => {
    if (!currentSession) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(`/api/count/sessions/${currentSession.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'resume' })
      })

      if (response.ok) {
        setCurrentSession(prev => prev ? { ...prev, session_status: 'active' } : null)
        alert('Session resumed!')
      } else {
        throw new Error('Failed to resume session')
      }
    } catch (error) {
      console.error('Error resuming session:', error)
      alert('Failed to resume session')
    }
  }

  const handleBackToLocationSelection = () => {
    setCurrentSession(null)
    setCompletedItems([])
    setPendingItems([])
    setSelectedLocationArea('')
    setStep('location-selection')
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Simplified loading state
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-4">Loading session page...</p>
      </div>
    )
  }

  return (
    <>
      {/* Custom Count Page Header */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <CountPageHeader
          user={user}
          userClient={userClient}
          onSignOut={handleSignOut}
          locations={locations}
          selectedLocationId={selectedLocationArea}
          onLocationSelect={handleLocationSelect}
          isOnline={isOnline}
        />
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {step === 'location-selection' && (
          <div className="space-y-6">
            {/* Location Selection Instructions */}
            <ModuleCard theme="light" className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Start Location Count Session</h2>
              <p className="text-white/70 mb-4">
                Select a location from the header above to begin counting all items in that location.
                You can pause your count session and resume it later if interrupted.
              </p>
              
              {locations.length === 0 && (
                <div className="bg-yellow-500/20 border border-yellow-400 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                    <span className="text-white font-medium">No locations found</span>
                  </div>
                  <p className="text-white/70 mt-2">
                    You need to create locations before you can start counting. Would you like to set up default locations?
                  </p>
                  <button
                    onClick={async () => {
                      const { data: { session } } = await supabase.auth.getSession()
                      if (session?.access_token) {
                        setupDefaultLocations(session.access_token)
                      }
                    }}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Default Locations
                  </button>
                </div>
              )}
              
              {sessionLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="text-white/70 mt-2">Starting count session...</p>
                </div>
              )}
            </ModuleCard>
          </div>
        )}

        {step === 'session-active' && currentSession && (
          <div className="space-y-6">
            <LocationCountSession
              session={currentSession}
              completedItems={completedItems}
              pendingItems={pendingItems}
              isOnline={isOnline}
              onSessionUpdate={handleSessionUpdate}
              onItemCounted={handleItemCounted}
              onCommitSession={handleCommitSession}
              onPauseSession={handlePauseSession}
              onResumeSession={handleResumeSession}
            />

            {/* Sample Status Display - like test-count page */}
            <ModuleCard theme="light" className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Session Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-white/70">Session Status:</span>
                  <p className="text-white font-medium">{currentSession.session_status}</p>
                  <span className="text-white/70">Progress:</span>
                  <p className="text-white font-medium">{currentSession.progress_percentage}%</p>
                  <span className="text-white/70">Items:</span>
                  <p className="text-white font-medium">{currentSession.counted_items_count}/{currentSession.total_items_count}</p>
                </div>
                <div>
                  <span className="text-white/70">Completed Items:</span>
                  <ul className="list-disc list-inside text-white/90 mt-1">
                    {completedItems.map(item => (
                      <li key={item.id}>{item.item_name}: {item.quantity_on_hand} {item.count_unit}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-white/70">Pending Items:</span>
                  <ul className="list-disc list-inside text-white/90 mt-1">
                    {pendingItems.map(item => (
                      <li key={item.id}>{item.item_name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </ModuleCard>
          </div>
        )}

        {step === 'session-complete' && currentSession && (
          <div className="space-y-6">
            {/* Completion Message */}
            <ModuleCard theme="light" className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Count Session Complete!</h2>
              <p className="text-white/70 mb-6">
                Successfully completed count for {currentSession.location_name}.
                {completedItems.length} items have been counted and saved.
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleBackToLocationSelection}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Count Another Location
                </button>
                <button
                  onClick={() => router.push('/stock/items')}
                  className="px-6 py-3 border border-gray-400 text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  Back to Inventory
                </button>
              </div>
            </ModuleCard>

            {/* Session Summary */}
            <ModuleCard theme="light" className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Session Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/70">Location:</span>
                  <p className="text-white font-medium">{currentSession.location_name}</p>
                </div>
                <div>
                  <span className="text-white/70">Items Counted:</span>
                  <p className="text-white font-medium">{completedItems.length}</p>
                </div>
                <div>
                  <span className="text-white/70">Started:</span>
                  <p className="text-white font-medium">{new Date(currentSession.started_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-white/70">Completed:</span>
                  <p className="text-white font-medium">{currentSession.completed_at ? new Date(currentSession.completed_at).toLocaleString() : 'Just now'}</p>
                </div>
              </div>
            </ModuleCard>
          </div>
        )}
      </main>
    </>
  )
}