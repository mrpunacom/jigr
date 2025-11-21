/**
 * JiGR Item Detail/Edit Modal
 * 
 * Comprehensive item detail and editing interface with:
 * - Full item information display
 * - Workflow-specific configuration editing
 * - Real-time validation
 * - Change tracking and confirmation
 * - Action buttons for delete/archive/duplicate
 * - Container assignment for container-based workflows
 * - Stock level history chart
 * - iPad-optimized touch interface
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  X,
  Edit3,
  Save,
  RotateCcw,
  Trash2,
  Archive,
  Copy,
  Package,
  Scale,
  Wine,
  Beer,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  Container,
  MoreHorizontal,
  ExternalLink,
  History,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react'
import { StockDesignTokens, getWorkflowStyles, StockResponsiveUtils } from '../StockModuleCore'
import type { InventoryItem, CountingWorkflow, ContainerInstance } from '@/types/stock'

// ============================================================================
// TYPES
// ============================================================================

interface ItemDetailModalProps {
  item: InventoryItem | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (item: InventoryItem) => void
  onDelete?: (item: InventoryItem) => void
  onDuplicate?: (item: InventoryItem) => void
}

interface EditableItemData {
  // Basic fields
  item_name: string
  brand?: string
  category?: string
  supplier?: string
  item_code?: string
  barcode?: string
  
  // Units and measurements
  unit_of_measurement: string
  cost_per_unit?: number
  
  // Par levels
  par_level_low?: number
  par_level_high?: number
  
  // Storage
  storage_location?: string
  
  // Workflow configuration
  counting_workflow: CountingWorkflow
  supports_weight_counting: boolean
  
  // Bottle configuration
  is_bottled_product: boolean
  bottle_volume_ml?: number
  full_bottle_weight_grams?: number
  empty_bottle_weight_grams?: number
  
  // Keg configuration
  is_keg: boolean
  keg_volume_liters?: number
  empty_keg_weight_grams?: number
  keg_freshness_days?: number
  keg_storage_temp_min?: number
  keg_storage_temp_max?: number
  
  // Batch configuration
  is_batch_tracked: boolean
  batch_use_by_days?: number
  
  // Other fields
  verification_frequency_months?: number
  notes?: string
  is_active: boolean
}

type ViewMode = 'view' | 'edit'
type TabMode = 'overview' | 'configuration' | 'history' | 'containers'

// ============================================================================
// ITEM DETAIL MODAL COMPONENT
// ============================================================================

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('view')
  const [currentTab, setCurrentTab] = useState<TabMode>('overview')
  const [editData, setEditData] = useState<EditableItemData | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [containers, setContainers] = useState<ContainerInstance[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Initialize edit data when item changes or edit mode starts
  useEffect(() => {
    if (item && viewMode === 'edit') {
      setEditData({
        item_name: item.item_name,
        brand: item.brand || '',
        category: item.category || '',
        supplier: item.supplier || '',
        item_code: item.item_code || '',
        barcode: item.barcode || '',
        unit_of_measurement: item.unit_of_measurement,
        cost_per_unit: item.cost_per_unit || undefined,
        par_level_low: item.par_level_low || undefined,
        par_level_high: item.par_level_high || undefined,
        storage_location: item.storage_location || '',
        counting_workflow: item.counting_workflow,
        supports_weight_counting: item.supports_weight_counting,
        is_bottled_product: item.is_bottled_product,
        bottle_volume_ml: item.bottle_volume_ml || undefined,
        full_bottle_weight_grams: item.full_bottle_weight_grams || undefined,
        empty_bottle_weight_grams: item.empty_bottle_weight_grams || undefined,
        is_keg: item.is_keg,
        keg_volume_liters: item.keg_volume_liters || undefined,
        empty_keg_weight_grams: item.empty_keg_weight_grams || undefined,
        keg_freshness_days: item.keg_freshness_days || undefined,
        keg_storage_temp_min: item.keg_storage_temp_min || undefined,
        keg_storage_temp_max: item.keg_storage_temp_max || undefined,
        is_batch_tracked: item.is_batch_tracked,
        batch_use_by_days: item.batch_use_by_days || undefined,
        verification_frequency_months: item.verification_frequency_months || 6,
        notes: item.notes || '',
        is_active: item.is_active
      })
      setHasChanges(false)
    }
  }, [item, viewMode])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setViewMode('view')
      setCurrentTab('overview')
      setEditData(null)
      setHasChanges(false)
      setErrors({})
      setShowDeleteConfirm(false)
    }
  }, [isOpen])

  // Track changes
  useEffect(() => {
    if (editData && item) {
      const originalData = {
        item_name: item.item_name,
        brand: item.brand || '',
        category: item.category || '',
        supplier: item.supplier || '',
        item_code: item.item_code || '',
        barcode: item.barcode || '',
        unit_of_measurement: item.unit_of_measurement,
        cost_per_unit: item.cost_per_unit || undefined,
        par_level_low: item.par_level_low || undefined,
        par_level_high: item.par_level_high || undefined,
        storage_location: item.storage_location || '',
        counting_workflow: item.counting_workflow,
        supports_weight_counting: item.supports_weight_counting,
        is_bottled_product: item.is_bottled_product,
        bottle_volume_ml: item.bottle_volume_ml || undefined,
        full_bottle_weight_grams: item.full_bottle_weight_grams || undefined,
        empty_bottle_weight_grams: item.empty_bottle_weight_grams || undefined,
        is_keg: item.is_keg,
        keg_volume_liters: item.keg_volume_liters || undefined,
        empty_keg_weight_grams: item.empty_keg_weight_grams || undefined,
        keg_freshness_days: item.keg_freshness_days || undefined,
        keg_storage_temp_min: item.keg_storage_temp_min || undefined,
        keg_storage_temp_max: item.keg_storage_temp_max || undefined,
        is_batch_tracked: item.is_batch_tracked,
        batch_use_by_days: item.batch_use_by_days || undefined,
        verification_frequency_months: item.verification_frequency_months || 6,
        notes: item.notes || '',
        is_active: item.is_active
      }
      
      const changed = JSON.stringify(editData) !== JSON.stringify(originalData)
      setHasChanges(changed)
    }
  }, [editData, item])

  const updateEditData = (updates: Partial<EditableItemData>) => {
    if (!editData) return
    setEditData(prev => ({ ...prev!, ...updates }))
    
    // Clear related errors
    const newErrors = { ...errors }
    Object.keys(updates).forEach(key => {
      delete newErrors[key]
    })
    setErrors(newErrors)
  }

  const validateForm = (): boolean => {
    if (!editData) return false
    
    const newErrors: Record<string, string> = {}
    
    if (!editData.item_name.trim()) {
      newErrors.item_name = 'Item name is required'
    }
    
    if (editData.counting_workflow === 'bottle_hybrid') {
      if (!editData.bottle_volume_ml || editData.bottle_volume_ml <= 0) {
        newErrors.bottle_volume_ml = 'Bottle volume is required'
      }
      if (!editData.full_bottle_weight_grams || editData.full_bottle_weight_grams <= 0) {
        newErrors.full_bottle_weight_grams = 'Full bottle weight is required'
      }
      if (!editData.empty_bottle_weight_grams || editData.empty_bottle_weight_grams <= 0) {
        newErrors.empty_bottle_weight_grams = 'Empty bottle weight is required'
      }
    }
    
    if (editData.counting_workflow === 'keg_weight') {
      if (!editData.keg_volume_liters || editData.keg_volume_liters <= 0) {
        newErrors.keg_volume_liters = 'Keg volume is required'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!editData || !item || !validateForm()) return
    
    setIsSaving(true)
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/stock/items/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update item')
      }
      
      const updatedItem = await response.json()
      onUpdate(updatedItem)
      setViewMode('view')
    } catch (error) {
      console.error('Failed to update item:', error)
      setErrors({ submit: 'Failed to update item. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setViewMode('view')
        setEditData(null)
        setHasChanges(false)
        setErrors({})
      }
    } else {
      setViewMode('view')
    }
  }

  const handleDelete = async () => {
    if (!item || !onDelete) return
    
    try {
      await onDelete(item)
      onClose()
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  if (!isOpen || !item) return null

  const workflowStyles = getWorkflowStyles(item.counting_workflow)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="border-b bg-white">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div 
                className="p-3 rounded-lg text-white"
                style={{ backgroundColor: workflowStyles.primary }}
              >
                {getWorkflowIcon(item.counting_workflow)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{item.item_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">{getWorkflowDisplayName(item.counting_workflow)}</span>
                  {!item.is_active && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Inactive</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {viewMode === 'view' ? (
                <>
                  <button
                    onClick={() => setViewMode('edit')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                  
                  <div className="relative">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                    {/* TODO: Implement dropdown menu */}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <span className="text-sm text-orange-600 mr-2">Unsaved changes</span>
                  )}
                  
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex border-t">
            {[
              { key: 'overview', label: 'Overview', icon: Package },
              { key: 'configuration', label: 'Configuration', icon: Settings },
              { key: 'history', label: 'Count History', icon: History },
              ...(item.supports_weight_counting ? [{ key: 'containers', label: 'Containers', icon: Container }] : [])
            ].map(tab => {
              const Icon = tab.icon
              const isActive = currentTab === tab.key
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setCurrentTab(tab.key as TabMode)}
                  className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${
                    isActive 
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {currentTab === 'overview' && (
            <OverviewTab 
              item={item} 
              editData={editData}
              viewMode={viewMode}
              onUpdate={updateEditData}
              errors={errors}
            />
          )}
          
          {currentTab === 'configuration' && (
            <ConfigurationTab
              item={item}
              editData={editData}
              viewMode={viewMode}
              onUpdate={updateEditData}
              errors={errors}
            />
          )}
          
          {currentTab === 'history' && (
            <HistoryTab item={item} />
          )}
          
          {currentTab === 'containers' && item.supports_weight_counting && (
            <ContainersTab item={item} />
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={24} className="text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Item</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{item.item_name}"? This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

interface OverviewTabProps {
  item: InventoryItem
  editData: EditableItemData | null
  viewMode: ViewMode
  onUpdate: (updates: Partial<EditableItemData>) => void
  errors: Record<string, string>
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  item, 
  editData, 
  viewMode, 
  onUpdate, 
  errors 
}) => {
  const data = editData || item
  
  return (
    <div className="p-6 space-y-6">
      
      {/* Basic Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
            {viewMode === 'edit' ? (
              <input
                type="text"
                value={data.item_name}
                onChange={(e) => onUpdate({ item_name: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.item_name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            ) : (
              <p className="text-gray-900 font-medium">{data.item_name}</p>
            )}
            {errors.item_name && (
              <p className="text-red-600 text-sm mt-1">{errors.item_name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            {viewMode === 'edit' ? (
              <input
                type="text"
                value={data.category || ''}
                onChange={(e) => onUpdate({ category: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{data.category || 'Not specified'}</p>
            )}
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            {viewMode === 'edit' ? (
              <input
                type="text"
                value={data.brand || ''}
                onChange={(e) => onUpdate({ brand: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{data.brand || 'Not specified'}</p>
            )}
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
            {viewMode === 'edit' ? (
              <input
                type="text"
                value={data.supplier || ''}
                onChange={(e) => onUpdate({ supplier: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{data.supplier || 'Not specified'}</p>
            )}
          </div>

          {/* Unit of Measurement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
            {viewMode === 'edit' ? (
              <select
                value={data.unit_of_measurement}
                onChange={(e) => onUpdate({ unit_of_measurement: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="each">Each</option>
                <option value="kg">Kilogram</option>
                <option value="g">Gram</option>
                <option value="L">Litre</option>
                <option value="ml">Millilitre</option>
                <option value="bottle">Bottle</option>
                <option value="case">Case</option>
                <option value="keg">Keg</option>
              </select>
            ) : (
              <p className="text-gray-900">{data.unit_of_measurement}</p>
            )}
          </div>

          {/* Cost per Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cost per Unit</label>
            {viewMode === 'edit' ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={data.cost_per_unit || ''}
                  onChange={(e) => onUpdate({ cost_per_unit: parseFloat(e.target.value) || undefined })}
                  className="w-full p-3 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>
            ) : (
              <p className="text-gray-900">{data.cost_per_unit ? `$${data.cost_per_unit.toFixed(2)}` : 'Not specified'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Par Levels */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Par Levels</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Low Level</label>
            {viewMode === 'edit' ? (
              <input
                type="number"
                value={data.par_level_low || ''}
                onChange={(e) => onUpdate({ par_level_low: parseInt(e.target.value) || undefined })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            ) : (
              <p className="text-gray-900">{data.par_level_low || 'Not set'}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">High Level</label>
            {viewMode === 'edit' ? (
              <input
                type="number"
                value={data.par_level_high || ''}
                onChange={(e) => onUpdate({ par_level_high: parseInt(e.target.value) || undefined })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            ) : (
              <p className="text-gray-900">{data.par_level_high || 'Not set'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Capabilities */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Workflow Capabilities</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${data.supports_weight_counting ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-sm text-gray-700">Weight Counting</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${data.is_bottled_product ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-sm text-gray-700">Bottled Product</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${data.is_keg ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-sm text-gray-700">Keg Tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${data.is_batch_tracked ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-sm text-gray-700">Batch Tracking</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
        
        {viewMode === 'edit' ? (
          <textarea
            value={data.notes || ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            placeholder="Add any notes about this item..."
          />
        ) : (
          <p className="text-gray-900">{data.notes || 'No notes'}</p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// CONFIGURATION TAB
// ============================================================================

interface ConfigurationTabProps {
  item: InventoryItem
  editData: EditableItemData | null
  viewMode: ViewMode
  onUpdate: (updates: Partial<EditableItemData>) => void
  errors: Record<string, string>
}

const ConfigurationTab: React.FC<ConfigurationTabProps> = ({ 
  item, 
  editData, 
  viewMode, 
  onUpdate, 
  errors 
}) => {
  const data = editData || item
  
  const renderWorkflowConfig = () => {
    switch (item.counting_workflow) {
      case 'bottle_hybrid':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bottle Volume (ml)</label>
                {viewMode === 'edit' ? (
                  <input
                    type="number"
                    value={data.bottle_volume_ml || ''}
                    onChange={(e) => onUpdate({ bottle_volume_ml: parseInt(e.target.value) || undefined })}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.bottle_volume_ml ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <p className="text-gray-900">{data.bottle_volume_ml}ml</p>
                )}
                {errors.bottle_volume_ml && (
                  <p className="text-red-600 text-sm mt-1">{errors.bottle_volume_ml}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Weight (g)</label>
                {viewMode === 'edit' ? (
                  <input
                    type="number"
                    value={data.full_bottle_weight_grams || ''}
                    onChange={(e) => onUpdate({ full_bottle_weight_grams: parseInt(e.target.value) || undefined })}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.full_bottle_weight_grams ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <p className="text-gray-900">{data.full_bottle_weight_grams}g</p>
                )}
                {errors.full_bottle_weight_grams && (
                  <p className="text-red-600 text-sm mt-1">{errors.full_bottle_weight_grams}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empty Weight (g)</label>
                {viewMode === 'edit' ? (
                  <input
                    type="number"
                    value={data.empty_bottle_weight_grams || ''}
                    onChange={(e) => onUpdate({ empty_bottle_weight_grams: parseInt(e.target.value) || undefined })}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      errors.empty_bottle_weight_grams ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <p className="text-gray-900">{data.empty_bottle_weight_grams}g</p>
                )}
                {errors.empty_bottle_weight_grams && (
                  <p className="text-red-600 text-sm mt-1">{errors.empty_bottle_weight_grams}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 'keg_weight':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keg Volume (L)</label>
                {viewMode === 'edit' ? (
                  <input
                    type="number"
                    value={data.keg_volume_liters || ''}
                    onChange={(e) => onUpdate({ keg_volume_liters: parseInt(e.target.value) || undefined })}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.keg_volume_liters ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <p className="text-gray-900">{data.keg_volume_liters}L</p>
                )}
                {errors.keg_volume_liters && (
                  <p className="text-red-600 text-sm mt-1">{errors.keg_volume_liters}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Empty Keg Weight (g)</label>
                {viewMode === 'edit' ? (
                  <input
                    type="number"
                    value={data.empty_keg_weight_grams || ''}
                    onChange={(e) => onUpdate({ empty_keg_weight_grams: parseInt(e.target.value) || undefined })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <p className="text-gray-900">{data.empty_keg_weight_grams}g</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Freshness Period (days)</label>
                {viewMode === 'edit' ? (
                  <input
                    type="number"
                    value={data.keg_freshness_days || ''}
                    onChange={(e) => onUpdate({ keg_freshness_days: parseInt(e.target.value) || undefined })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                ) : (
                  <p className="text-gray-900">{data.keg_freshness_days} days</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Storage Temp Range (°C)</label>
                {viewMode === 'edit' ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={data.keg_storage_temp_min || ''}
                      onChange={(e) => onUpdate({ keg_storage_temp_min: parseInt(e.target.value) || undefined })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Min"
                    />
                    <span className="flex items-center">to</span>
                    <input
                      type="number"
                      value={data.keg_storage_temp_max || ''}
                      onChange={(e) => onUpdate({ keg_storage_temp_max: parseInt(e.target.value) || undefined })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Max"
                    />
                  </div>
                ) : (
                  <p className="text-gray-900">{data.keg_storage_temp_min}°C - {data.keg_storage_temp_max}°C</p>
                )}
              </div>
            </div>
          </div>
        )

      case 'batch_weight':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Use By Period (days)</label>
              {viewMode === 'edit' ? (
                <input
                  type="number"
                  value={data.batch_use_by_days || ''}
                  onChange={(e) => onUpdate({ batch_use_by_days: parseInt(e.target.value) || undefined })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <p className="text-gray-900">{data.batch_use_by_days} days</p>
              )}
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <Info size={48} className="mx-auto mb-2 opacity-50" />
            <p>No additional configuration for this workflow</p>
          </div>
        )
    }
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {getWorkflowDisplayName(item.counting_workflow)} Configuration
        </h3>
        {renderWorkflowConfig()}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Settings</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Frequency (months)
          </label>
          {viewMode === 'edit' ? (
            <input
              type="number"
              value={data.verification_frequency_months || ''}
              onChange={(e) => onUpdate({ verification_frequency_months: parseInt(e.target.value) || undefined })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="12"
            />
          ) : (
            <p className="text-gray-900">{data.verification_frequency_months} months</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PLACEHOLDER TABS
// ============================================================================

const HistoryTab: React.FC<{ item: InventoryItem }> = ({ item }) => (
  <div className="p-6">
    <div className="text-center py-8 text-gray-500">
      <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Count History</h3>
      <p>Historical stock counts will be displayed here</p>
      <p className="text-sm mt-2">This feature will be implemented next</p>
    </div>
  </div>
)

const ContainersTab: React.FC<{ item: InventoryItem }> = ({ item }) => (
  <div className="p-6">
    <div className="text-center py-8 text-gray-500">
      <Container size={48} className="mx-auto mb-4 opacity-50" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Container Management</h3>
      <p>Assigned containers for this item will be shown here</p>
      <p className="text-sm mt-2">This feature will be implemented next</p>
    </div>
  </div>
)

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getWorkflowIcon = (workflow: CountingWorkflow) => {
  const iconProps = { size: 24 }
  
  switch (workflow) {
    case 'unit_count':
      return <Package {...iconProps} />
    case 'container_weight':
      return <Scale {...iconProps} />
    case 'bottle_hybrid':
      return <Wine {...iconProps} />
    case 'keg_weight':
      return <Beer {...iconProps} />
    case 'batch_weight':
      return <Calendar {...iconProps} />
    default:
      return <Package {...iconProps} />
  }
}

const getWorkflowDisplayName = (workflow: CountingWorkflow): string => {
  const names = {
    unit_count: 'Unit Count',
    container_weight: 'Container Weight',
    bottle_hybrid: 'Bottle Hybrid',
    keg_weight: 'Keg Weight',
    batch_weight: 'Batch Weight'
  }
  
  return names[workflow] || 'Unknown'
}

export default ItemDetailModal