/**
 * JiGR Add Item Modal - Intelligent Item Creation
 * 
 * Smart modal for creating new inventory items with:
 * - Workflow-guided configuration
 * - Progressive form enhancement
 * - Real-time validation
 * - Barcode scanning support
 * - Intelligent defaults and suggestions
 * - iPad-optimized interface
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  X,
  Package,
  Calculator,
  Scale,
  Wine,
  Beer,
  ChefHat,
  Camera,
  Check,
  AlertTriangle,
  Info,
  Plus,
  Search,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import { StockDesignTokens, getWorkflowStyles, StockResponsiveUtils, WorkflowConfig } from '../StockModuleCore'
import type { InventoryItem, CountingWorkflow } from '@/types/stock'

// ============================================================================
// TYPES
// ============================================================================

interface ItemFormData {
  // Core fields
  item_name: string
  brand: string
  category_id: string
  item_code: string
  barcode: string
  
  // Units and measurements
  recipe_unit: string
  count_unit: string
  count_unit_conversion: number | null
  
  // Par levels
  par_level_low: number
  par_level_high: number
  
  // Storage
  storage_location: string
  
  // Workflow configuration
  counting_workflow: CountingWorkflow
  supports_weight_counting: boolean
  typical_unit_weight_grams: number | null
  default_container_category: string
  requires_container: boolean
  supports_partial_units: boolean
  
  // Pack configuration
  pack_size: number
  pack_unit: string
  order_by_pack: boolean
  
  // Bottle configuration
  is_bottled_product: boolean
  bottle_volume_ml: number | null
  bottle_shape_id: string
  full_bottle_weight_grams: number | null
  empty_bottle_weight_grams: number | null
  
  // Keg configuration
  is_keg: boolean
  keg_volume_liters: number | null
  empty_keg_weight_grams: number | null
  keg_freshness_days: number | null
  keg_storage_temp_min: number | null
  keg_storage_temp_max: number | null
  
  // Batch configuration
  is_batch_tracked: boolean
  batch_use_by_days: number | null
  batch_naming_pattern: string
  
  // Verification
  verification_frequency_months: number
  
  // Notes
  notes: string
}

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onItemCreated: (item: InventoryItem) => void
  preSelectedWorkflow?: CountingWorkflow
}

type FormStep = 'workflow' | 'basic' | 'workflow-config' | 'advanced' | 'review'

// ============================================================================
// ADD ITEM MODAL COMPONENT
// ============================================================================

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onItemCreated,
  preSelectedWorkflow
}) => {
  const [currentStep, setCurrentStep] = useState<FormStep>('workflow')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<ItemFormData>({
    // Core fields
    item_name: '',
    brand: '',
    category_id: '',
    item_code: '',
    barcode: '',
    
    // Units and measurements
    recipe_unit: 'units',
    count_unit: '',
    count_unit_conversion: null,
    
    // Par levels
    par_level_low: 0,
    par_level_high: 0,
    
    // Storage
    storage_location: '',
    
    // Workflow configuration
    counting_workflow: preSelectedWorkflow || 'unit_count',
    supports_weight_counting: false,
    typical_unit_weight_grams: null,
    default_container_category: '',
    requires_container: false,
    supports_partial_units: false,
    
    // Pack configuration
    pack_size: 1,
    pack_unit: '',
    order_by_pack: false,
    
    // Bottle configuration
    is_bottled_product: false,
    bottle_volume_ml: null,
    bottle_shape_id: '',
    full_bottle_weight_grams: null,
    empty_bottle_weight_grams: null,
    
    // Keg configuration
    is_keg: false,
    keg_volume_liters: null,
    empty_keg_weight_grams: null,
    keg_freshness_days: null,
    keg_storage_temp_min: null,
    keg_storage_temp_max: null,
    
    // Batch configuration
    is_batch_tracked: false,
    batch_use_by_days: null,
    batch_naming_pattern: '{item_name}-{date}',
    
    // Verification
    verification_frequency_months: 6,
    
    // Notes
    notes: ''
  })

  // Set workflow defaults when workflow changes
  useEffect(() => {
    const workflow = formData.counting_workflow
    const updates: Partial<ItemFormData> = {}

    // Reset workflow-specific flags first
    updates.supports_weight_counting = false
    updates.requires_container = false
    updates.is_bottled_product = false
    updates.is_keg = false
    updates.is_batch_tracked = false

    // Set workflow-specific defaults
    switch (workflow) {
      case 'container_weight':
        updates.supports_weight_counting = true
        updates.requires_container = true
        updates.supports_partial_units = true
        if (!formData.default_container_category) {
          updates.default_container_category = 'bulk_dry_goods'
        }
        break
        
      case 'bottle_hybrid':
        updates.is_bottled_product = true
        updates.supports_partial_units = true
        updates.bottle_volume_ml = 750
        updates.full_bottle_weight_grams = 1500
        updates.empty_bottle_weight_grams = 500
        break
        
      case 'keg_weight':
        updates.is_keg = true
        updates.supports_weight_counting = true
        updates.keg_volume_liters = 50
        updates.empty_keg_weight_grams = 13300
        updates.keg_freshness_days = 14
        updates.keg_storage_temp_min = 2
        updates.keg_storage_temp_max = 6
        break
        
      case 'batch_weight':
        updates.is_batch_tracked = true
        updates.supports_weight_counting = true
        updates.requires_container = true
        updates.batch_use_by_days = 7
        break
    }

    setFormData(prev => ({ ...prev, ...updates }))
  }, [formData.counting_workflow])

  // Auto-advance from workflow selection if pre-selected
  useEffect(() => {
    if (preSelectedWorkflow && currentStep === 'workflow') {
      setCurrentStep('basic')
    }
  }, [preSelectedWorkflow])

  const updateFormData = (updates: Partial<ItemFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    
    // Clear related validation errors
    const newErrors = { ...validationErrors }
    Object.keys(updates).forEach(key => {
      delete newErrors[key]
    })
    setValidationErrors(newErrors)
  }

  const validateStep = (step: FormStep): boolean => {
    const errors: Record<string, string> = {}

    switch (step) {
      case 'basic':
        if (!formData.item_name.trim()) errors.item_name = 'Item name is required'
        if (!formData.category_id) errors.category_id = 'Category is required'
        if (!formData.recipe_unit) errors.recipe_unit = 'Recipe unit is required'
        break
        
      case 'workflow-config':
        if (formData.counting_workflow === 'container_weight') {
          if (!formData.default_container_category) {
            errors.default_container_category = 'Container category is required for container weight counting'
          }
        }
        if (formData.counting_workflow === 'bottle_hybrid') {
          if (!formData.bottle_volume_ml || formData.bottle_volume_ml <= 0) {
            errors.bottle_volume_ml = 'Bottle volume is required'
          }
          if (!formData.full_bottle_weight_grams || formData.full_bottle_weight_grams <= 0) {
            errors.full_bottle_weight_grams = 'Full bottle weight is required'
          }
          if (!formData.empty_bottle_weight_grams || formData.empty_bottle_weight_grams <= 0) {
            errors.empty_bottle_weight_grams = 'Empty bottle weight is required'
          }
        }
        if (formData.counting_workflow === 'keg_weight') {
          if (!formData.keg_volume_liters || formData.keg_volume_liters <= 0) {
            errors.keg_volume_liters = 'Keg volume is required'
          }
        }
        break
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return

    const steps: FormStep[] = ['workflow', 'basic', 'workflow-config', 'advanced', 'review']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const steps: FormStep[] = ['workflow', 'basic', 'workflow-config', 'advanced', 'review']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const handleSubmit = async () => {
    if (!validateStep('review')) return

    setIsSubmitting(true)
    
    try {
      // TODO: Submit to API
      const response = await fetch('/api/stock/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to create item')
      }

      const result = await response.json()
      onItemCreated(result.item)
      onClose()
    } catch (error) {
      console.error('Error creating item:', error)
      // TODO: Show error message
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const workflowStyles = getWorkflowStyles(formData.counting_workflow)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Add New Item</h2>
            <p className="text-sm text-gray-600">
              {WorkflowConfig[formData.counting_workflow]?.name || 'Create new inventory item'}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b bg-white">
          <StepIndicator currentStep={currentStep} workflow={formData.counting_workflow} />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {currentStep === 'workflow' && (
            <WorkflowSelection
              selected={formData.counting_workflow}
              onSelect={(workflow) => updateFormData({ counting_workflow: workflow })}
            />
          )}
          
          {currentStep === 'basic' && (
            <BasicInformation
              formData={formData}
              onUpdate={updateFormData}
              errors={validationErrors}
            />
          )}
          
          {currentStep === 'workflow-config' && (
            <WorkflowConfiguration
              formData={formData}
              onUpdate={updateFormData}
              errors={validationErrors}
            />
          )}
          
          {currentStep === 'advanced' && (
            <AdvancedSettings
              formData={formData}
              onUpdate={updateFormData}
              errors={validationErrors}
            />
          )}
          
          {currentStep === 'review' && (
            <ReviewAndSubmit
              formData={formData}
              errors={validationErrors}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div>
            {currentStep !== 'workflow' && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            
            {currentStep === 'review' ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSubmitting ? 'bg-gray-300 text-gray-500' : 'text-white'
                }`}
                style={!isSubmitting ? { backgroundColor: workflowStyles.primary } : {}}
              >
                {isSubmitting ? 'Creating...' : 'Create Item'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white transition-colors"
                style={{ backgroundColor: workflowStyles.primary }}
              >
                Next
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STEP INDICATOR COMPONENT
// ============================================================================

interface StepIndicatorProps {
  currentStep: FormStep
  workflow: CountingWorkflow
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, workflow }) => {
  const steps = [
    { key: 'workflow', label: 'Workflow' },
    { key: 'basic', label: 'Basic Info' },
    { key: 'workflow-config', label: 'Configuration' },
    { key: 'advanced', label: 'Advanced' },
    { key: 'review', label: 'Review' }
  ]

  const currentIndex = steps.findIndex(step => step.key === currentStep)
  const workflowStyles = getWorkflowStyles(workflow)

  return (
    <div className="flex items-center gap-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.key}>
          <div className={`flex items-center gap-2 ${
            index <= currentIndex ? 'opacity-100' : 'opacity-50'
          }`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
              index < currentIndex 
                ? 'text-white border-transparent'
                : index === currentIndex
                ? 'border-2 text-white'
                : 'border-gray-300 text-gray-400 bg-white'
            }`}
            style={index <= currentIndex ? { 
              backgroundColor: workflowStyles.primary,
              borderColor: workflowStyles.primary 
            } : {}}>
              {index < currentIndex ? <Check size={16} /> : index + 1}
            </div>
            <span className="text-sm font-medium">{step.label}</span>
          </div>
          
          {index < steps.length - 1 && (
            <div 
              className={`h-0.5 w-8 ${
                index < currentIndex ? '' : 'bg-gray-300'
              }`}
              style={index < currentIndex ? { backgroundColor: workflowStyles.primary } : {}}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ============================================================================
// WORKFLOW SELECTION COMPONENT
// ============================================================================

interface WorkflowSelectionProps {
  selected: CountingWorkflow
  onSelect: (workflow: CountingWorkflow) => void
}

const WorkflowSelection: React.FC<WorkflowSelectionProps> = ({ selected, onSelect }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Counting Workflow</h3>
      <p className="text-gray-600 mb-6">
        Select how this item will be counted. This determines the interface and features available.
      </p>
      
      <div className="grid gap-4">
        {Object.entries(WorkflowConfig).map(([workflow, config]) => {
          const isSelected = workflow === selected
          const styles = getWorkflowStyles(workflow)
          
          return (
            <button
              key={workflow}
              onClick={() => onSelect(workflow as CountingWorkflow)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                isSelected 
                  ? 'shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
              style={isSelected ? {
                borderColor: styles.primary,
                backgroundColor: styles.secondary
              } : {}}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="p-3 rounded-lg text-white flex-shrink-0"
                  style={{ backgroundColor: styles.primary }}
                >
                  {getWorkflowIcon(config.icon, 24)}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{config.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                </div>
                
                {isSelected && (
                  <Check size={24} style={{ color: styles.primary }} />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// BASIC INFORMATION COMPONENT
// ============================================================================

interface BasicInformationProps {
  formData: ItemFormData
  onUpdate: (updates: Partial<ItemFormData>) => void
  errors: Record<string, string>
}

const BasicInformation: React.FC<BasicInformationProps> = ({ formData, onUpdate, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Information</h3>
        <p className="text-gray-600 mb-6">
          Enter the core information for this inventory item.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Item Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.item_name}
            onChange={(e) => onUpdate({ item_name: e.target.value })}
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.item_name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Jasmine Rice, Chardonnay Wine, IPA Beer"
          />
          {errors.item_name && (
            <p className="text-sm text-red-600 mt-1">{errors.item_name}</p>
          )}
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => onUpdate({ brand: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Golden Grain, Cloudy Bay"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => onUpdate({ category_id: e.target.value })}
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.category_id ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select category...</option>
            <option value="grains">Grains & Rice</option>
            <option value="wine">Wine</option>
            <option value="beer">Beer</option>
            <option value="spirits">Spirits</option>
            <option value="produce">Produce</option>
            <option value="dairy">Dairy</option>
            <option value="meat">Meat & Seafood</option>
            <option value="dry-goods">Dry Goods</option>
          </select>
          {errors.category_id && (
            <p className="text-sm text-red-600 mt-1">{errors.category_id}</p>
          )}
        </div>

        {/* Item Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Item Code</label>
          <input
            type="text"
            value={formData.item_code}
            onChange={(e) => onUpdate({ item_code: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., RICE-001"
          />
        </div>

        {/* Barcode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
          <div className="relative">
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => onUpdate({ barcode: e.target.value })}
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Scan or enter barcode"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <Camera size={20} />
            </button>
          </div>
        </div>

        {/* Recipe Unit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipe Unit <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.recipe_unit}
            onChange={(e) => onUpdate({ recipe_unit: e.target.value })}
            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.recipe_unit ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="units">Units</option>
            <option value="kg">Kilograms</option>
            <option value="g">Grams</option>
            <option value="L">Liters</option>
            <option value="ml">Milliliters</option>
            <option value="bottles">Bottles</option>
            <option value="kegs">Kegs</option>
          </select>
          {errors.recipe_unit && (
            <p className="text-sm text-red-600 mt-1">{errors.recipe_unit}</p>
          )}
        </div>

        {/* Par Levels */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Par Level (Low - High)</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={formData.par_level_low || ''}
              onChange={(e) => onUpdate({ par_level_low: parseInt(e.target.value) || 0 })}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Min"
              min="0"
            />
            <input
              type="number"
              value={formData.par_level_high || ''}
              onChange={(e) => onUpdate({ par_level_high: parseInt(e.target.value) || 0 })}
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Max"
              min="0"
            />
          </div>
        </div>

        {/* Storage Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Storage Location</label>
          <input
            type="text"
            value={formData.storage_location}
            onChange={(e) => onUpdate({ storage_location: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Dry Store, Wine Cellar, Walk-in Cooler"
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// WORKFLOW CONFIGURATION COMPONENT
// ============================================================================

interface WorkflowConfigurationProps {
  formData: ItemFormData
  onUpdate: (updates: Partial<ItemFormData>) => void
  errors: Record<string, string>
}

const WorkflowConfiguration: React.FC<WorkflowConfigurationProps> = ({ formData, onUpdate, errors }) => {
  const renderWorkflowSpecificConfig = () => {
    switch (formData.counting_workflow) {
      case 'container_weight':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Container Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.default_container_category}
                onChange={(e) => onUpdate({ default_container_category: e.target.value })}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.default_container_category ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select container type...</option>
                <option value="bulk_dry_goods">Bulk Dry Goods</option>
                <option value="bulk_liquid">Bulk Liquid</option>
                <option value="produce_bins">Produce Bins</option>
                <option value="prep_containers">Prep Containers</option>
              </select>
              {errors.default_container_category && (
                <p className="text-sm text-red-600 mt-1">{errors.default_container_category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Typical Unit Weight (grams)
              </label>
              <input
                type="number"
                value={formData.typical_unit_weight_grams || ''}
                onChange={(e) => onUpdate({ typical_unit_weight_grams: parseFloat(e.target.value) || null })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 1 for rice (1g per grain)"
                step="0.1"
                min="0"
              />
              <p className="text-sm text-gray-500 mt-1">
                Weight of one unit for automatic quantity calculation
              </p>
            </div>
          </div>
        )

      case 'bottle_hybrid':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bottle Volume (ml) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.bottle_volume_ml || ''}
                onChange={(e) => onUpdate({ bottle_volume_ml: parseInt(e.target.value) || null })}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bottle_volume_ml ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="750"
                min="1"
              />
              {errors.bottle_volume_ml && (
                <p className="text-sm text-red-600 mt-1">{errors.bottle_volume_ml}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Bottle Weight (g) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.full_bottle_weight_grams || ''}
                  onChange={(e) => onUpdate({ full_bottle_weight_grams: parseInt(e.target.value) || null })}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.full_bottle_weight_grams ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="1500"
                  min="1"
                />
                {errors.full_bottle_weight_grams && (
                  <p className="text-sm text-red-600 mt-1">{errors.full_bottle_weight_grams}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empty Bottle Weight (g) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.empty_bottle_weight_grams || ''}
                  onChange={(e) => onUpdate({ empty_bottle_weight_grams: parseInt(e.target.value) || null })}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.empty_bottle_weight_grams ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="500"
                  min="1"
                />
                {errors.empty_bottle_weight_grams && (
                  <p className="text-sm text-red-600 mt-1">{errors.empty_bottle_weight_grams}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 'keg_weight':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keg Volume (Liters) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.keg_volume_liters || ''}
                onChange={(e) => onUpdate({ keg_volume_liters: parseInt(e.target.value) || null })}
                className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.keg_volume_liters ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="50"
                min="1"
              />
              {errors.keg_volume_liters && (
                <p className="text-sm text-red-600 mt-1">{errors.keg_volume_liters}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Freshness Period (Days)
                </label>
                <input
                  type="number"
                  value={formData.keg_freshness_days || ''}
                  onChange={(e) => onUpdate({ keg_freshness_days: parseInt(e.target.value) || null })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="14"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empty Keg Weight (g)
                </label>
                <input
                  type="number"
                  value={formData.empty_keg_weight_grams || ''}
                  onChange={(e) => onUpdate({ empty_keg_weight_grams: parseInt(e.target.value) || null })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="13300"
                  min="1"
                />
              </div>
            </div>
          </div>
        )

      case 'batch_weight':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Use By Period (Days)
              </label>
              <input
                type="number"
                value={formData.batch_use_by_days || ''}
                onChange={(e) => onUpdate({ batch_use_by_days: parseInt(e.target.value) || null })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="7"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Naming Pattern
              </label>
              <input
                type="text"
                value={formData.batch_naming_pattern}
                onChange={(e) => onUpdate({ batch_naming_pattern: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="{item_name}-{date}"
              />
              <p className="text-sm text-gray-500 mt-1">
                Use {'{item_name}'}, {'{date}'}, {'{time}'} as placeholders
              </p>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <Info size={48} className="mx-auto mb-2 opacity-50" />
            <p>No additional configuration needed for manual counting</p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {WorkflowConfig[formData.counting_workflow]?.name} Configuration
        </h3>
        <p className="text-gray-600 mb-6">
          Configure settings specific to {WorkflowConfig[formData.counting_workflow]?.description?.toLowerCase()}.
        </p>
      </div>

      {renderWorkflowSpecificConfig()}
    </div>
  )
}

// ============================================================================
// PLACEHOLDER COMPONENTS
// ============================================================================

const AdvancedSettings: React.FC<any> = () => (
  <div className="text-center py-8 text-gray-500">
    <Settings size={48} className="mx-auto mb-2 opacity-50" />
    <p>Advanced settings will be implemented next...</p>
  </div>
)

const ReviewAndSubmit: React.FC<any> = () => (
  <div className="text-center py-8 text-gray-500">
    <Check size={48} className="mx-auto mb-2 opacity-50" />
    <p>Review and submit will be implemented next...</p>
  </div>
)

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getWorkflowIcon = (iconName: string, size: number = 20) => {
  const iconProps = { size }
  const icons: Record<string, React.ReactElement> = {
    Calculator: <Calculator {...iconProps} />,
    Scale: <Scale {...iconProps} />,
    Wine: <Wine {...iconProps} />,
    Beer: <Beer {...iconProps} />,
    ChefHat: <ChefHat {...iconProps} />
  }
  
  return icons[iconName] || <Calculator {...iconProps} />
}

export default AddItemModal