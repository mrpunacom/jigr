'use client'

import { useState, useEffect } from 'react'
import { LocationCountSession } from '@/app/components/inventory/LocationCountSession'
import { LocationCountSession as SessionType, SessionItemCount } from '@/types/LocationCountTypes'
import { InventoryItem } from '@/types/InventoryTypes'

// Mock data for testing
const mockSession: SessionType = {
  id: 'test-session-1',
  client_id: 'dcea74d0-a187-4bfc-a55c-50c6cd8cf76c',
  location_id: 'test-location-1',
  user_id: 'test-user-1',
  session_status: 'active',
  started_at: new Date().toISOString(),
  total_items_count: 5,
  counted_items_count: 2,
  location_name: 'Test Kitchen',
  progress_percentage: 40
}

const mockCompletedItems: SessionItemCount[] = [
  {
    id: 'count-1',
    session_id: 'test-session-1',
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
    session_id: 'test-session-1',
    item_id: 'item-2',
    item_name: 'Sugar',
    quantity_on_hand: 10,
    count_unit: 'kg',
    counted_at: new Date().toISOString(),
    is_counted: true
  }
]

const mockPendingItems: InventoryItem[] = [
  {
    id: 'item-3',
    item_name: 'Rice',
    brand: 'Premium Brand',
    count_unit: 'kg',
    is_active: true,
    client_id: 'dcea74d0-a187-4bfc-a55c-50c6cd8cf76c',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-4',
    item_name: 'Cooking Oil',
    brand: 'Best Oil Co',
    count_unit: 'liters',
    is_active: true,
    client_id: 'dcea74d0-a187-4bfc-a55c-50c6cd8cf76c',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'item-5',
    item_name: 'Salt',
    count_unit: 'kg',
    is_active: true,
    client_id: 'dcea74d0-a187-4bfc-a55c-50c6cd8cf76c',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export default function TestCountPage() {
  const [session, setSession] = useState<SessionType>(mockSession)
  const [completedItems, setCompletedItems] = useState<SessionItemCount[]>(mockCompletedItems)
  const [pendingItems, setPendingItems] = useState<InventoryItem[]>(mockPendingItems)
  const [isOnline] = useState(true)

  const handleSessionUpdate = (updatedSession: SessionType) => {
    console.log('Session updated:', updatedSession)
    setSession(updatedSession)
  }

  const handleItemCounted = async (item: InventoryItem, quantity: number, notes?: string) => {
    console.log('Item counted:', { item: item.item_name, quantity, notes })
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Move item from pending to completed
    const newCompletedItem: SessionItemCount = {
      id: `count-${Date.now()}`,
      session_id: session.id,
      item_id: item.id,
      item_name: item.item_name,
      quantity_on_hand: quantity,
      count_unit: item.count_unit,
      notes: notes || '',
      counted_at: new Date().toISOString(),
      is_counted: true
    }

    setCompletedItems(prev => {
      // Remove if already exists (update case)
      const filtered = prev.filter(existing => existing.item_id !== item.id)
      return [...filtered, newCompletedItem]
    })

    setPendingItems(prev => prev.filter(pending => pending.id !== item.id))

    // Update session progress
    const newCountedCount = session.counted_items_count + (completedItems.find(c => c.item_id === item.id) ? 0 : 1)
    const newProgressPercentage = Math.round((newCountedCount / session.total_items_count) * 100)
    
    setSession(prev => ({
      ...prev,
      counted_items_count: newCountedCount,
      progress_percentage: newProgressPercentage
    }))
  }

  const handleCommitSession = () => {
    console.log('Committing session:', session.id)
    alert(`Session committed! ${session.counted_items_count} items counted for ${session.location_name}`)
    
    setSession(prev => ({
      ...prev,
      session_status: 'completed',
      completed_at: new Date().toISOString()
    }))
  }

  const handlePauseSession = () => {
    console.log('Pausing session:', session.id)
    alert('Session paused!')
    
    setSession(prev => ({
      ...prev,
      session_status: 'paused',
      paused_at: new Date().toISOString()
    }))
  }

  const handleResumeSession = () => {
    console.log('Resuming session:', session.id)
    alert('Session resumed!')
    
    setSession(prev => ({
      ...prev,
      session_status: 'active',
      paused_at: undefined
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Location Count Session Test
          </h1>
          <p className="text-gray-600">
            Testing the new location-based counting workflow with mock data
          </p>
        </div>

        <LocationCountSession
          session={session}
          completedItems={completedItems}
          pendingItems={pendingItems}
          isOnline={isOnline}
          onSessionUpdate={handleSessionUpdate}
          onItemCounted={handleItemCounted}
          onCommitSession={handleCommitSession}
          onPauseSession={handlePauseSession}
          onResumeSession={handleResumeSession}
        />

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Debug Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Session Status:</strong> {session.session_status}
              <br />
              <strong>Progress:</strong> {session.progress_percentage}%
              <br />
              <strong>Items:</strong> {session.counted_items_count}/{session.total_items_count}
            </div>
            <div>
              <strong>Completed Items:</strong>
              <ul className="list-disc list-inside">
                {completedItems.map(item => (
                  <li key={item.id}>{item.item_name}: {item.quantity_on_hand} {item.count_unit}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Pending Items:</strong>
              <ul className="list-disc list-inside">
                {pendingItems.map(item => (
                  <li key={item.id}>{item.item_name}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}