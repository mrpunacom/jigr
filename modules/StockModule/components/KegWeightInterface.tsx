/**
 * JiGR Keg Weight Interface
 * 
 * Specialized interface for beer keg counting with:
 * - Weight-based volume calculation
 * - Freshness status tracking
 * - Temperature monitoring
 * - Keg lifecycle management
 * - Visual keg fill indicator
 * - Tap date tracking
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Beer,
  Scale,
  Bluetooth,
  Thermometer,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  DropletIcon as Drop,
  Info,
  RefreshCw
} from 'lucide-react'
import { StockDesignTokens, getWorkflowStyles, StockResponsiveUtils } from '../StockModuleCore'
import type { InventoryItem, CountFormData } from '@/types/stock'

// ============================================================================
// TYPES
// ============================================================================

interface KegData {
  currentWeight: number
  estimatedVolume: number
  remainingPercentage: number
  tappedDate: string | null
  daysSinceTap: number
  temperature: number | null
  freshnessStatus: 'fresh' | 'good' | 'declining' | 'expired'
  estimatedDaysRemaining: number
}

interface KegWeightInterfaceProps {
  item: InventoryItem
  formData: CountFormData
  onUpdate: (updates: Partial<CountFormData>) => void
  scaleConnected: boolean
  liveWeight: number | null
}

// ============================================================================
// KEG WEIGHT INTERFACE COMPONENT
// ============================================================================

export const KegWeightInterface: React.FC<KegWeightInterfaceProps> = ({
  item,
  formData,
  onUpdate,
  scaleConnected,
  liveWeight
}) => {
  const [kegData, setKegData] = useState<KegData>({
    currentWeight: formData.gross_weight_grams || 0,
    estimatedVolume: 0,
    remainingPercentage: 0,
    tappedDate: formData.keg_tapped_date || null,
    daysSinceTap: 0,
    temperature: formData.keg_temperature_celsius || null,
    freshnessStatus: 'fresh',
    estimatedDaysRemaining: 0
  })

  const [manualWeight, setManualWeight] = useState(formData.gross_weight_grams || 0)
  const [showTapDatePicker, setShowTapDatePicker] = useState(false)

  // Keg configuration
  const kegCapacity = item.keg_volume_liters || 50 // Default 50L keg
  const emptyKegWeight = item.empty_keg_weight_grams || 13300 // Default 13.3kg empty keg
  const freshnessDays = item.keg_freshness_days || 14 // Default 14 days freshness
  const beerDensity = 1.01 // kg/L density of beer

  // Calculate keg metrics
  const calculateKegMetrics = (weight: number, tappedDate: string | null) => {
    // Calculate remaining volume
    const netWeight = Math.max(0, weight - emptyKegWeight)
    const estimatedVolume = netWeight / 1000 / beerDensity // Convert to liters
    const remainingPercentage = Math.min(100, (estimatedVolume / kegCapacity) * 100)

    // Calculate days since tap
    let daysSinceTap = 0
    if (tappedDate) {
      const tapDate = new Date(tappedDate)
      const now = new Date()
      daysSinceTap = Math.floor((now.getTime() - tapDate.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Determine freshness status
    let freshnessStatus: 'fresh' | 'good' | 'declining' | 'expired' = 'fresh'
    let estimatedDaysRemaining = freshnessDays

    if (daysSinceTap > 0) {
      const freshnessRatio = daysSinceTap / freshnessDays
      estimatedDaysRemaining = Math.max(0, freshnessDays - daysSinceTap)

      if (freshnessRatio <= 0.3) {
        freshnessStatus = 'fresh'
      } else if (freshnessRatio <= 0.7) {
        freshnessStatus = 'good'
      } else if (freshnessRatio <= 1.0) {
        freshnessStatus = 'declining'
      } else {
        freshnessStatus = 'expired'
      }
    }

    return {
      estimatedVolume,
      remainingPercentage,
      daysSinceTap,
      freshnessStatus,
      estimatedDaysRemaining
    }
  }

  // Update keg data when weight or tap date changes
  useEffect(() => {
    const metrics = calculateKegMetrics(kegData.currentWeight, kegData.tappedDate)
    setKegData(prev => ({ ...prev, ...metrics }))
    
    // Update parent form data
    onUpdate({
      gross_weight_grams: kegData.currentWeight,
      keg_tapped_date: kegData.tappedDate || undefined,
      keg_temperature_celsius: kegData.temperature || undefined,
      counted_quantity: metrics.estimatedVolume
    })
  }, [kegData.currentWeight, kegData.tappedDate])

  // Handle live weight updates from scale
  useEffect(() => {
    if (liveWeight && scaleConnected) {
      setKegData(prev => ({ ...prev, currentWeight: liveWeight }))
      setManualWeight(liveWeight)
    }
  }, [liveWeight, scaleConnected])

  const updateWeight = (weight: number) => {
    setKegData(prev => ({ ...prev, currentWeight: weight }))
    setManualWeight(weight)
  }

  const updateTappedDate = (date: string) => {
    setKegData(prev => ({ ...prev, tappedDate: date }))
  }

  const updateTemperature = (temp: number) => {
    setKegData(prev => ({ ...prev, temperature: temp }))
  }

  const workflowStyles = getWorkflowStyles('keg_weight')

  return (
    <div className="space-y-6">
      
      {/* Keg Configuration */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="p-2 rounded-lg text-white"
            style={{ backgroundColor: workflowStyles.primary }}
          >
            <Beer size={20} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Keg Configuration</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600">Capacity</p>
            <p className="text-lg font-semibold">{kegCapacity}L</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Empty Weight</p>
            <p className="text-lg font-semibold">{(emptyKegWeight / 1000).toFixed(1)}kg</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Full Weight</p>
            <p className="text-lg font-semibold">{((emptyKegWeight + (kegCapacity * beerDensity * 1000)) / 1000).toFixed(1)}kg</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Freshness</p>
            <p className="text-lg font-semibold">{freshnessDays} days</p>
          </div>
        </div>
      </div>

      {/* Weight Measurement */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weight Measurement</h3>
        
        {/* Scale Connection Status */}
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
            <p className="text-4xl font-bold text-orange-600">{liveWeight.toFixed(1)}g</p>
            <button
              onClick={() => updateWeight(liveWeight)}
              className="mt-4 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Capture Weight
            </button>
          </div>
        ) : (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">Manual Weight Entry</p>
            <input
              type="number"
              value={manualWeight || ''}
              onChange={(e) => updateWeight(parseFloat(e.target.value) || 0)}
              className="w-48 h-16 text-2xl font-bold text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="0.0"
              step="0.1"
            />
            <p className="text-sm text-gray-500 mt-1">grams</p>
          </div>
        )}

        {/* Weight Breakdown */}
        {kegData.currentWeight > 0 && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Weight</p>
              <p className="text-lg font-semibold">{(kegData.currentWeight / 1000).toFixed(1)}kg</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Empty Keg</p>
              <p className="text-lg font-semibold">{(emptyKegWeight / 1000).toFixed(1)}kg</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Beer Weight</p>
              <p className="text-lg font-semibold text-orange-600">
                {(Math.max(0, kegData.currentWeight - emptyKegWeight) / 1000).toFixed(1)}kg
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Keg Status */}
      {kegData.currentWeight > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Keg Status</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Visual Keg Indicator */}
            <div className="flex justify-center">
              <KegFillIndicator 
                fillPercentage={kegData.remainingPercentage}
                freshnessStatus={kegData.freshnessStatus}
                size="large"
              />
            </div>

            {/* Status Details */}
            <div className="space-y-4">
              
              {/* Volume */}
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Drop size={20} className="text-orange-600" />
                  <span className="font-medium text-orange-900">Remaining Volume</span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-900">
                    {kegData.estimatedVolume.toFixed(1)}L
                  </p>
                  <p className="text-sm text-orange-700">{kegData.remainingPercentage.toFixed(1)}% full</p>
                </div>
              </div>

              {/* Freshness */}
              <div className={`flex items-center justify-between p-4 rounded-lg ${getFreshnessStatusStyles(kegData.freshnessStatus).bg}`}>
                <div className="flex items-center gap-2">
                  <Clock size={20} className={getFreshnessStatusStyles(kegData.freshnessStatus).text} />
                  <span className={`font-medium ${getFreshnessStatusStyles(kegData.freshnessStatus).text}`}>
                    Freshness Status
                  </span>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${getFreshnessStatusStyles(kegData.freshnessStatus).text}`}>
                    {kegData.freshnessStatus.charAt(0).toUpperCase() + kegData.freshnessStatus.slice(1)}
                  </p>
                  <p className={`text-sm ${getFreshnessStatusStyles(kegData.freshnessStatus).text}`}>
                    {kegData.estimatedDaysRemaining} days remaining
                  </p>
                </div>
              </div>

              {/* Days Since Tap */}
              {kegData.tappedDate && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">Days Since Tap</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{kegData.daysSinceTap}</p>
                    <p className="text-sm text-gray-600">
                      Tapped {new Date(kegData.tappedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {kegData.remainingPercentage < 10 && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle size={16} className="text-red-600" />
                  <span className="text-sm text-red-800">Keg is nearly empty - consider replacement</span>
                </div>
              )}

              {kegData.freshnessStatus === 'expired' && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle size={16} className="text-red-600" />
                  <span className="text-sm text-red-800">Keg freshness has expired - quality may be compromised</span>
                </div>
              )}

              {kegData.freshnessStatus === 'declining' && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle size={16} className="text-yellow-600" />
                  <span className="text-sm text-yellow-800">Keg freshness is declining - use soon</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Tap Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tap Date (Optional)
            </label>
            {kegData.tappedDate ? (
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={kegData.tappedDate}
                  onChange={(e) => updateTappedDate(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={() => updateTappedDate('')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            ) : (
              <button
                onClick={() => updateTappedDate(new Date().toISOString().split('T')[0])}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-300 text-gray-600 hover:text-orange-600 transition-colors"
              >
                + Set Tap Date
              </button>
            )}
            <p className="text-sm text-gray-500 mt-1">When was this keg first tapped?</p>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature (°C) (Optional)
            </label>
            <div className="relative">
              <input
                type="number"
                value={kegData.temperature || ''}
                onChange={(e) => updateTemperature(parseFloat(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 pl-10"
                placeholder="4.0"
                step="0.1"
                min="-5"
                max="25"
              />
              <Thermometer size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Storage temperature affects beer quality
            </p>
            
            {/* Temperature warnings */}
            {kegData.temperature !== null && (
              <>
                {(kegData.temperature < (item.keg_storage_temp_min || 2) || 
                  kegData.temperature > (item.keg_storage_temp_max || 6)) && (
                  <div className="mt-2 flex items-center gap-2 text-yellow-600">
                    <AlertTriangle size={14} />
                    <span className="text-sm">
                      Temperature outside optimal range ({item.keg_storage_temp_min || 2}°C - {item.keg_storage_temp_max || 6}°C)
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// KEG FILL INDICATOR COMPONENT
// ============================================================================

interface KegFillIndicatorProps {
  fillPercentage: number
  freshnessStatus: 'fresh' | 'good' | 'declining' | 'expired'
  size?: 'small' | 'medium' | 'large'
}

const KegFillIndicator: React.FC<KegFillIndicatorProps> = ({ 
  fillPercentage, 
  freshnessStatus,
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'w-16 h-24',
    medium: 'w-20 h-32',
    large: 'w-24 h-40'
  }

  const getFillColor = () => {
    if (freshnessStatus === 'expired') return 'from-red-500 to-red-400'
    if (freshnessStatus === 'declining') return 'from-yellow-500 to-yellow-400'
    if (fillPercentage < 10) return 'from-red-500 to-orange-400'
    if (fillPercentage < 25) return 'from-orange-500 to-orange-400'
    return 'from-orange-500 to-amber-400'
  }

  const fillHeight = Math.max(2, fillPercentage) // Minimum 2% for visibility

  return (
    <div className="flex flex-col items-center">
      <div 
        className={`${sizeClasses[size]} border-2 border-gray-400 rounded-lg relative overflow-hidden bg-gray-100 shadow-inner`}
      >
        {/* Keg fill */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getFillColor()} transition-all duration-500`}
          style={{ height: `${fillHeight}%` }}
        />
        
        {/* Foam effect for beer */}
        {fillPercentage > 5 && (
          <div
            className="absolute left-0 right-0 h-2 bg-gradient-to-t from-white/40 to-white/80"
            style={{ bottom: `${fillHeight}%` }}
          />
        )}

        {/* Tap spout */}
        <div className="absolute bottom-2 right-1 w-2 h-1 bg-gray-600 rounded-sm" />
        
        {/* Handles */}
        <div className="absolute top-2 -left-1 w-1 h-4 border-2 border-gray-400 border-r-0 rounded-l" />
        <div className="absolute top-2 -right-1 w-1 h-4 border-2 border-gray-400 border-l-0 rounded-r" />
      </div>
      
      <div className="text-center mt-2">
        <p className="text-lg font-bold text-gray-900">{fillPercentage.toFixed(1)}%</p>
        <p className="text-xs text-gray-500 capitalize">{freshnessStatus}</p>
      </div>
    </div>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getFreshnessStatusStyles = (status: string) => {
  switch (status) {
    case 'fresh':
      return { bg: 'bg-green-50', text: 'text-green-900' }
    case 'good':
      return { bg: 'bg-blue-50', text: 'text-blue-900' }
    case 'declining':
      return { bg: 'bg-yellow-50', text: 'text-yellow-900' }
    case 'expired':
      return { bg: 'bg-red-50', text: 'text-red-900' }
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-900' }
  }
}

export default KegWeightInterface