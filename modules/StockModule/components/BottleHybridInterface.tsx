/**
 * JiGR Bottle Hybrid Counting Interface
 * 
 * Specialized interface for wine/spirits counting with:
 * - Full bottle counting (manual)
 * - Partial bottle weight measurement
 * - Automatic equivalent calculation
 * - Bottle shape configuration support
 * - Visual bottle fill indicators
 * - iPad-optimized touch controls
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Wine,
  Plus,
  Minus,
  Scale,
  Bluetooth,
  Calculator,
  Eye,
  RotateCcw,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { StockDesignTokens, getWorkflowStyles, StockResponsiveUtils } from '../StockModuleCore'
import type { InventoryItem, CountFormData } from '@/types/stock'

// ============================================================================
// TYPES
// ============================================================================

interface BottleData {
  fullBottles: number
  partialBottles: PartialBottle[]
  totalEquivalent: number
}

interface PartialBottle {
  id: string
  weight: number
  equivalent: number
  fillPercentage: number
}

interface BottleHybridInterfaceProps {
  item: InventoryItem
  formData: CountFormData
  onUpdate: (updates: Partial<CountFormData>) => void
  scaleConnected: boolean
  liveWeight: number | null
}

// ============================================================================
// BOTTLE HYBRID INTERFACE COMPONENT
// ============================================================================

export const BottleHybridInterface: React.FC<BottleHybridInterfaceProps> = ({
  item,
  formData,
  onUpdate,
  scaleConnected,
  liveWeight
}) => {
  const [bottleData, setBottleData] = useState<BottleData>({
    fullBottles: formData.full_bottles_count || 0,
    partialBottles: [],
    totalEquivalent: 0
  })
  
  const [currentPartialWeight, setCurrentPartialWeight] = useState<number>(0)
  const [showWeightCapture, setShowWeightCapture] = useState(false)
  const [selectedPartialIndex, setSelectedPartialIndex] = useState<number | null>(null)

  // Bottle configuration
  const fullBottleWeight = item.full_bottle_weight_grams || 1500 // Default 1.5kg for 750ml wine bottle
  const emptyBottleWeight = item.empty_bottle_weight_grams || 500 // Default 500g empty bottle
  const bottleVolume = item.bottle_volume_ml || 750

  // Calculate bottle equivalent from weight
  const calculateBottleEquivalent = (weight: number): number => {
    if (weight <= emptyBottleWeight) return 0
    if (weight >= fullBottleWeight) return 1
    
    const netWeight = weight - emptyBottleWeight
    const maxNetWeight = fullBottleWeight - emptyBottleWeight
    return Math.min(1.0, netWeight / maxNetWeight)
  }

  // Calculate fill percentage for visual display
  const calculateFillPercentage = (equivalent: number): number => {
    return Math.round(equivalent * 100)
  }

  // Update total equivalent when data changes
  useEffect(() => {
    const totalPartialEquivalent = bottleData.partialBottles.reduce(
      (sum, bottle) => sum + bottle.equivalent, 
      0
    )
    const newTotalEquivalent = bottleData.fullBottles + totalPartialEquivalent
    
    setBottleData(prev => ({ ...prev, totalEquivalent: newTotalEquivalent }))
    
    // Update parent form data
    onUpdate({
      full_bottles_count: bottleData.fullBottles,
      partial_bottles_weight: bottleData.partialBottles.reduce((sum, bottle) => sum + bottle.weight, 0),
      counted_quantity: newTotalEquivalent
    })
  }, [bottleData.fullBottles, bottleData.partialBottles])

  const updateFullBottles = (count: number) => {
    const validCount = Math.max(0, count)
    setBottleData(prev => ({ ...prev, fullBottles: validCount }))
  }

  const addPartialBottle = (weight: number) => {
    if (weight <= 0) return

    const equivalent = calculateBottleEquivalent(weight)
    const fillPercentage = calculateFillPercentage(equivalent)
    
    const newBottle: PartialBottle = {
      id: Date.now().toString(),
      weight,
      equivalent,
      fillPercentage
    }

    setBottleData(prev => ({
      ...prev,
      partialBottles: [...prev.partialBottles, newBottle]
    }))

    // Reset weight capture state
    setCurrentPartialWeight(0)
    setShowWeightCapture(false)
  }

  const removePartialBottle = (id: string) => {
    setBottleData(prev => ({
      ...prev,
      partialBottles: prev.partialBottles.filter(bottle => bottle.id !== id)
    }))
  }

  const updatePartialBottle = (id: string, weight: number) => {
    const equivalent = calculateBottleEquivalent(weight)
    const fillPercentage = calculateFillPercentage(equivalent)

    setBottleData(prev => ({
      ...prev,
      partialBottles: prev.partialBottles.map(bottle =>
        bottle.id === id ? { ...bottle, weight, equivalent, fillPercentage } : bottle
      )
    }))
  }

  const workflowStyles = getWorkflowStyles('bottle_hybrid')

  return (
    <div className="space-y-6">
      
      {/* Bottle Configuration Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="p-2 rounded-lg text-white"
            style={{ backgroundColor: workflowStyles.primary }}
          >
            <Wine size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Bottle Configuration</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600">Bottle Volume</p>
            <p className="text-lg font-semibold">{bottleVolume}ml</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Full Weight</p>
            <p className="text-lg font-semibold">{fullBottleWeight}g</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Empty Weight</p>
            <p className="text-lg font-semibold">{emptyBottleWeight}g</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Net Weight</p>
            <p className="text-lg font-semibold">{fullBottleWeight - emptyBottleWeight}g</p>
          </div>
        </div>
      </div>

      {/* Full Bottles Count */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Full Bottles (Unopened)</h3>
        
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => updateFullBottles(bottleData.fullBottles - 1)}
            className={`p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ${StockResponsiveUtils.ipadOptimized.button}`}
          >
            <Minus size={24} />
          </button>
          
          <div className="text-center">
            <input
              type="number"
              value={bottleData.fullBottles}
              onChange={(e) => updateFullBottles(parseInt(e.target.value) || 0)}
              className="w-24 h-16 text-3xl font-bold text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="0"
            />
            <p className="text-sm text-gray-600 mt-1">bottles</p>
          </div>
          
          <button
            onClick={() => updateFullBottles(bottleData.fullBottles + 1)}
            className={`p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ${StockResponsiveUtils.ipadOptimized.button}`}
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-4 gap-3">
          {[1, 6, 12, 24].map(value => (
            <button
              key={value}
              onClick={() => updateFullBottles(bottleData.fullBottles + value)}
              className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors"
            >
              +{value}
            </button>
          ))}
        </div>
      </div>

      {/* Partial Bottles */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Partial Bottles (Opened)</h3>
          <button
            onClick={() => setShowWeightCapture(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Partial
          </button>
        </div>

        {/* Partial Bottles List */}
        {bottleData.partialBottles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Wine size={48} className="mx-auto mb-2 opacity-50" />
            <p>No partial bottles added yet</p>
            <p className="text-sm">Weigh opened bottles to track partial amounts</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {bottleData.partialBottles.map((bottle, index) => (
              <PartialBottleCard
                key={bottle.id}
                bottle={bottle}
                index={index}
                emptyWeight={emptyBottleWeight}
                fullWeight={fullBottleWeight}
                onUpdate={(weight) => updatePartialBottle(bottle.id, weight)}
                onRemove={() => removePartialBottle(bottle.id)}
                onEdit={() => setSelectedPartialIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Weight Capture Modal */}
      {showWeightCapture && (
        <WeightCaptureModal
          scaleConnected={scaleConnected}
          liveWeight={liveWeight}
          currentWeight={currentPartialWeight}
          onWeightChange={setCurrentPartialWeight}
          onCapture={() => {
            addPartialBottle(currentPartialWeight)
          }}
          onCancel={() => {
            setShowWeightCapture(false)
            setCurrentPartialWeight(0)
          }}
          emptyWeight={emptyBottleWeight}
          fullWeight={fullBottleWeight}
        />
      )}

      {/* Total Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">Count Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Full Bottles */}
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-900 mb-1">
              {bottleData.fullBottles}
            </div>
            <p className="text-sm text-purple-700">Full Bottles</p>
            <p className="text-xs text-purple-600">
              {(bottleData.fullBottles * bottleVolume / 1000).toFixed(1)}L
            </p>
          </div>

          {/* Partial Bottles */}
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-900 mb-1">
              {bottleData.partialBottles.length}
            </div>
            <p className="text-sm text-purple-700">Partial Bottles</p>
            <p className="text-xs text-purple-600">
              {bottleData.partialBottles.reduce((sum, bottle) => sum + bottle.equivalent, 0).toFixed(2)} equiv
            </p>
          </div>

          {/* Total Equivalent */}
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-900 mb-1">
              {bottleData.totalEquivalent.toFixed(2)}
            </div>
            <p className="text-sm text-purple-700">Total Equivalent</p>
            <p className="text-xs text-purple-600">
              {(bottleData.totalEquivalent * bottleVolume / 1000).toFixed(1)}L total volume
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="mt-4 pt-4 border-t border-purple-200">
          <p className="text-sm text-purple-800 text-center">
            {bottleData.fullBottles} full + {bottleData.partialBottles.reduce((sum, bottle) => sum + bottle.equivalent, 0).toFixed(2)} partial = {bottleData.totalEquivalent.toFixed(2)} bottle equivalents
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PARTIAL BOTTLE CARD COMPONENT
// ============================================================================

interface PartialBottleCardProps {
  bottle: PartialBottle
  index: number
  emptyWeight: number
  fullWeight: number
  onUpdate: (weight: number) => void
  onRemove: () => void
  onEdit: () => void
}

const PartialBottleCard: React.FC<PartialBottleCardProps> = ({
  bottle,
  index,
  emptyWeight,
  fullWeight,
  onUpdate,
  onRemove,
  onEdit
}) => {
  return (
    <div className="border border-purple-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">Partial Bottle #{index + 1}</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="text-purple-600 hover:text-purple-800 p-1"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={onRemove}
            className="text-red-600 hover:text-red-800 p-1"
          >
            <Minus size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3">
        <div className="text-center">
          <p className="text-sm text-gray-600">Weight</p>
          <p className="font-semibold">{bottle.weight}g</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Equivalent</p>
          <p className="font-semibold">{bottle.equivalent.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Fill Level</p>
          <p className="font-semibold">{bottle.fillPercentage}%</p>
        </div>
      </div>

      {/* Visual Fill Indicator */}
      <div className="mb-3">
        <BottleFillIndicator 
          fillPercentage={bottle.fillPercentage}
          size="small"
        />
      </div>

      {/* Weight validation */}
      {bottle.weight < emptyWeight && (
        <div className="flex items-center gap-2 text-yellow-600 text-sm">
          <AlertTriangle size={14} />
          <span>Weight below empty bottle weight</span>
        </div>
      )}
      
      {bottle.weight > fullWeight && (
        <div className="flex items-center gap-2 text-yellow-600 text-sm">
          <AlertTriangle size={14} />
          <span>Weight exceeds full bottle weight</span>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// BOTTLE FILL INDICATOR COMPONENT
// ============================================================================

interface BottleFillIndicatorProps {
  fillPercentage: number
  size?: 'small' | 'medium' | 'large'
}

const BottleFillIndicator: React.FC<BottleFillIndicatorProps> = ({ 
  fillPercentage, 
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'w-8 h-16',
    medium: 'w-12 h-24',
    large: 'w-16 h-32'
  }

  const fillHeight = Math.max(5, fillPercentage) // Minimum 5% for visibility

  return (
    <div className="flex flex-col items-center">
      <div 
        className={`${sizeClasses[size]} border-2 border-purple-300 rounded-lg relative overflow-hidden bg-gray-50`}
      >
        {/* Bottle fill */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-500 to-purple-400 transition-all duration-300"
          style={{ height: `${fillHeight}%` }}
        />
        
        {/* Neck */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-4 border-2 border-purple-300 border-b-0 rounded-t bg-gray-50" />
      </div>
      
      <p className="text-xs text-gray-600 mt-1">{fillPercentage}%</p>
    </div>
  )
}

// ============================================================================
// WEIGHT CAPTURE MODAL
// ============================================================================

interface WeightCaptureModalProps {
  scaleConnected: boolean
  liveWeight: number | null
  currentWeight: number
  onWeightChange: (weight: number) => void
  onCapture: () => void
  onCancel: () => void
  emptyWeight: number
  fullWeight: number
}

const WeightCaptureModal: React.FC<WeightCaptureModalProps> = ({
  scaleConnected,
  liveWeight,
  currentWeight,
  onWeightChange,
  onCapture,
  onCancel,
  emptyWeight,
  fullWeight
}) => {
  const equivalent = currentWeight > 0 ? 
    Math.min(1.0, Math.max(0, (currentWeight - emptyWeight) / (fullWeight - emptyWeight))) : 0
  const fillPercentage = Math.round(equivalent * 100)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weigh Partial Bottle</h3>

        {/* Scale Status */}
        <div className={`p-4 rounded-lg mb-4 ${
          scaleConnected ? 'bg-green-50 text-green-900' : 'bg-gray-50 text-gray-900'
        }`}>
          <div className="flex items-center gap-2">
            <Bluetooth size={20} className={scaleConnected ? 'text-green-600' : 'text-gray-600'} />
            <span className="font-medium">
              {scaleConnected ? 'Scale Connected' : 'Scale Disconnected'}
            </span>
          </div>
        </div>

        {/* Weight Input */}
        {scaleConnected && liveWeight !== null ? (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">Live Weight Reading</p>
            <p className="text-4xl font-bold text-purple-600">{liveWeight.toFixed(1)}g</p>
            <button
              onClick={() => onWeightChange(liveWeight)}
              className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Use This Weight
            </button>
          </div>
        ) : (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">Manual Weight Entry</p>
            <input
              type="number"
              value={currentWeight || ''}
              onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
              className="w-full h-16 text-2xl font-bold text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.0"
              step="0.1"
              autoFocus
            />
            <p className="text-sm text-gray-500 mt-1">grams</p>
          </div>
        )}

        {/* Preview */}
        {currentWeight > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-6">
              <BottleFillIndicator fillPercentage={fillPercentage} size="large" />
              
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-900">{equivalent.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Bottle Equivalent</p>
                <p className="text-xs text-gray-500 mt-1">{fillPercentage}% full</p>
              </div>
            </div>

            {/* Validation */}
            {currentWeight < emptyWeight && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle size={16} />
                  <span className="text-sm">Weight is below empty bottle weight ({emptyWeight}g)</span>
                </div>
              </div>
            )}

            {currentWeight > fullWeight && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle size={16} />
                  <span className="text-sm">Weight exceeds full bottle weight ({fullWeight}g)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onCapture}
            disabled={currentWeight <= 0}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            Add Bottle
          </button>
        </div>
      </div>
    </div>
  )
}

export default BottleHybridInterface