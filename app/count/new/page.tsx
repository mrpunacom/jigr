'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ResponsiveLayout } from '@/app/components/ResponsiveLayout'
import { CountPageHeader } from '@/app/components/inventory/CountPageHeader'
import { InventoryLocation } from '@/types/InventoryTypes'
import { ModuleCard } from '@/app/components/ModuleCard'
import { QrCode, Pause, Check, Clock } from 'lucide-react'

export default function CountNewPage() {
  const router = useRouter()
  
  // Basic state - much simpler than before
  const [locations, setLocations] = useState<InventoryLocation[]>([])
  const [selectedLocationArea, setSelectedLocationArea] = useState('')
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [user, setUser] = useState<any>(null)
  const [userClient, setUserClient] = useState<any>(null)
  
  // Session state for demo interface - start with session active to match target
  const [sessionActive, setSessionActive] = useState(true)
  const [sessionProgress, setSessionProgress] = useState(40) // Demo: 40% complete
  const [itemsCount, setItemsCount] = useState({ completed: 2, total: 5 }) // Demo: 2 of 5 items

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
    loadBasicData()
  }, [])

  const loadBasicData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login')
        return
      }

      setUser(session.user)
      
      // Load user client data
      try {
        const { data: clientData } = await supabase
          .from('user_clients')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
        
        if (clientData) {
          setUserClient(clientData)
        }
      } catch (error) {
        console.log('No user client data found')
      }

      // Load locations - simple version
      try {
        const response = await fetch('/api/inventory/locations', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        
        if (response.ok) {
          const result = await response.json()
          setLocations(result.success ? result.locations || [] : [])
        }
      } catch (error) {
        console.log('Could not load locations')
        setLocations([])
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationArea(locationId)
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleStartSession = () => {
    if (!selectedLocationArea) {
      alert('Please select a location first')
      return
    }
    
    // For demo purposes, just activate the session interface
    setSessionActive(true)
    
    // In real implementation: Navigate to the count session page
    // router.push(`/count/session?location=${selectedLocationArea}`)
  }

  const handleScanBarcode = () => {
    // Demo action for barcode scanning
    alert('Barcode scanner would open here')
  }

  const handlePauseSession = () => {
    alert('Session paused')
  }

  const handleCommitLocation = () => {
    alert('Location count committed!')
    setSessionActive(false) // Reset demo
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="ml-4">Loading...</p>
      </div>
    )
  }

  return (
    <ResponsiveLayout>
      {/* Header */}
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

      {/* Compact Session Interface - No cards, clean layout */}
      <div className="max-w-full mx-auto px-6 py-4">
        {/* Session Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {selectedLocationArea && locations.length > 0 
                ? `${locations.find(l => l.id === selectedLocationArea)?.name || 'Unknown'} Count Session`
                : 'Count Session'
              }
            </h1>
            <div className="flex items-center space-x-4 mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded text-sm bg-green-100 text-green-800">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                Active
              </span>
              <span className="text-gray-600 text-sm">Started: 11/15/2025, 10:45:55 PM</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-800">{sessionProgress}%</div>
            <div className="text-gray-600 text-sm">{itemsCount.completed} of {itemsCount.total} items</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${sessionProgress}%` }}
          ></div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleScanBarcode}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <QrCode className="h-4 w-4 mr-2" />
            Scan Barcode
          </button>
          
          <button
            onClick={handlePauseSession}
            className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
          >
            <Pause className="h-4 w-4 mr-2" />
            Pause
          </button>
          
          <button
            onClick={handleCommitLocation}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Check className="h-4 w-4 mr-2" />
            Commit Location
          </button>
        </div>
      </div>
    </ResponsiveLayout>
  )
}