'use client'

import { useState, useEffect } from 'react'
import { LocationCountSession, SessionItemCount } from '@/types/LocationCountTypes'
import { InventoryItem } from '@/types/InventoryTypes'
import { ModuleCard } from '../ModuleCard'
import { NumberInput } from '../NumberInput'
import { BarcodeScanner } from './BarcodeScanner'
import { CheckCircle, Clock, Scan, Pause, Play, Save, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface LocationCountSessionProps {
  session: LocationCountSession
  completedItems: SessionItemCount[]
  pendingItems: InventoryItem[]
  isOnline: boolean
  onSessionUpdate: (session: LocationCountSession) => void
  onItemCounted: (item: InventoryItem, quantity: number, notes?: string) => void
  onCommitSession: () => void
  onPauseSession: () => void
  onResumeSession: () => void
}

interface CountFormData {
  quantity: number
  unit: string
  notes: string
}

export function LocationCountSession({
  session,
  completedItems,
  pendingItems,
  isOnline,
  onSessionUpdate,
  onItemCounted,
  onCommitSession,
  onPauseSession,
  onResumeSession
}: LocationCountSessionProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [countData, setCountData] = useState<CountFormData>({ quantity: 0, unit: '', notes: '' })
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Progress calculations
  const progressPercentage = session.total_items_count > 0 
    ? Math.round((session.counted_items_count / session.total_items_count) * 100)
    : 0
  
  const remainingItems = session.total_items_count - session.counted_items_count
  const canCommit = remainingItems === 0 || session.counted_items_count > 0

  // Reset form when selecting new item
  useEffect(() => {
    if (selectedItem) {
      // Check if item already has a count
      const existingCount = completedItems.find(item => item.item_id === selectedItem.id)
      if (existingCount) {
        setCountData({
          quantity: existingCount.quantity_on_hand,
          unit: existingCount.count_unit,
          notes: existingCount.notes || ''
        })
      } else {
        setCountData({
          quantity: 0,
          unit: selectedItem.count_unit || 'units',
          notes: ''
        })
      }
    }
  }, [selectedItem, completedItems])

  const handleItemSelect = (item: InventoryItem) => {
    setSelectedItem(item)
  }

  const handleBarcodeScan = async (barcode: string) => {
    try {
      const { data: { session: userSession } } = await supabase.auth.getSession()
      if (!userSession?.access_token) return

      const response = await fetch(`/api/inventory/barcode/${barcode}`, {
        headers: {
          'Authorization': `Bearer ${userSession.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.item) {
          // Find this item in our pending or completed items
          const foundItem = [...pendingItems, ...completedItems.map(c => ({
            id: c.item_id,
            item_name: c.item_name,
            count_unit: c.count_unit,
            brand: '',
            is_active: true,
            client_id: session.client_id,
            created_at: '',
            updated_at: ''
          } as InventoryItem))].find(item => item.id === data.item.item_id)

          if (foundItem) {
            handleItemSelect(foundItem)
          } else {
            alert('This item is not part of this location count session')
          }
        } else {
          alert('Barcode not found in inventory')
        }
      }
    } catch (error) {
      console.error('Barcode scan error:', error)
      alert('Error scanning barcode')
    } finally {
      setShowBarcodeScanner(false)
    }
  }

  const handleSubmitCount = async () => {
    if (!selectedItem || countData.quantity < 0) {
      alert('Please select an item and enter a valid quantity')
      return
    }

    setIsSubmitting(true)
    try {
      await onItemCounted(selectedItem, countData.quantity, countData.notes)
      
      // Reset selection and move to next item
      setSelectedItem(null)
      setCountData({ quantity: 0, unit: '', notes: '' })
      
    } catch (error) {
      console.error('Error submitting count:', error)
      alert('Failed to save count. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getItemStatus = (itemId: string) => {
    return completedItems.find(item => item.item_id === itemId) ? 'completed' : 'pending'
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <ModuleCard theme="light" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {session.location_name} Count Session
            </h2>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                session.session_status === 'active' 
                  ? 'bg-green-100 text-green-800'
                  : session.session_status === 'paused'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {session.session_status === 'active' && <Play className="inline w-3 h-3 mr-1" />}
                {session.session_status === 'paused' && <Pause className="inline w-3 h-3 mr-1" />}
                {session.session_status === 'completed' && <CheckCircle className="inline w-3 h-3 mr-1" />}
                {session.session_status.charAt(0).toUpperCase() + session.session_status.slice(1)}
              </span>
              <span className="text-sm text-gray-600">
                Started: {new Date(session.started_at).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-gray-800">
              {progressPercentage}%
            </div>
            <div className="text-sm text-gray-600">
              {session.counted_items_count} of {session.total_items_count} items
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-3">
            <button
              onClick={() => setShowBarcodeScanner(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Scan className="w-4 h-4 mr-2" />
              Scan Barcode
            </button>
          </div>

          <div className="flex space-x-3">
            {session.session_status === 'active' && (
              <button
                onClick={onPauseSession}
                className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </button>
            )}

            {session.session_status === 'paused' && (
              <button
                onClick={onResumeSession}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4 mr-2" />
                Resume
              </button>
            )}

            <button
              onClick={onCommitSession}
              disabled={!canCommit}
              className={`flex items-center px-6 py-2 rounded-lg font-semibold transition-colors ${
                canCommit 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!canCommit ? 'Count at least one item before committing' : 'Commit this location count'}
            >
              <Save className="w-4 h-4 mr-2" />
              Commit Location
            </button>
          </div>
        </div>

        {!canCommit && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-amber-600 mr-2" />
              <span className="text-sm text-amber-700">
                You must count at least one item before you can commit this location.
              </span>
            </div>
          </div>
        )}
      </ModuleCard>

      {/* Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Items */}
        <ModuleCard theme="light" className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-yellow-600" />
            Pending Items ({pendingItems.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pendingItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleItemSelect(item)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedItem?.id === item.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-800">{item.item_name}</div>
                {item.brand && (
                  <div className="text-sm text-gray-500">{item.brand}</div>
                )}
                <div className="text-xs text-gray-400">Unit: {item.count_unit}</div>
              </button>
            ))}
            {pendingItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                All items counted!
              </div>
            )}
          </div>
        </ModuleCard>

        {/* Completed Items */}
        <ModuleCard theme="light" className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            Completed Items ({completedItems.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {completedItems.map(item => (
              <div
                key={item.id}
                className="p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-800">{item.item_name}</div>
                    <div className="text-sm text-gray-600">
                      Count: {item.quantity_on_hand} {item.count_unit}
                    </div>
                    {item.notes && (
                      <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const originalItem = pendingItems.find(p => p.id === item.item_id) || 
                        { id: item.item_id, item_name: item.item_name, count_unit: item.count_unit } as InventoryItem
                      handleItemSelect(originalItem)
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
            {completedItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2" />
                No items counted yet
              </div>
            )}
          </div>
        </ModuleCard>
      </div>

      {/* Count Form */}
      {selectedItem && (
        <ModuleCard theme="light" className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Count: {selectedItem.item_name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <NumberInput
                value={countData.quantity}
                onChange={(value) => setCountData(prev => ({ ...prev, quantity: value }))}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <input
                type="text"
                value={countData.unit}
                onChange={(e) => setCountData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={selectedItem.count_unit}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={countData.notes}
                onChange={(e) => setCountData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any notes about this count..."
              />
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <button
              onClick={() => setSelectedItem(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitCount}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Count'}
            </button>
          </div>
        </ModuleCard>
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowBarcodeScanner(false)}
          title="Scan Item Barcode"
          subtitle="Scan the barcode of the item you want to count"
        />
      )}
    </div>
  )
}