/**
 * JiGR Count Submission Interface - Multi-Workflow Counting System
 * 
 * Intelligent count submission interface that adapts to all 5 counting workflows:
 * - unit_count: Traditional manual counting
 * - container_weight: Bulk items with containers and scales
 * - bottle_hybrid: Wine/spirits with full + partial bottle counting
 * - keg_weight: Beer kegs with freshness tracking
 * - batch_weight: In-house prep with expiration management
 * 
 * Features:
 * - Real-time anomaly detection and validation
 * - Smart container assignment and recommendations
 * - iPad-optimized touch interface with large buttons
 * - Progressive form enhancement based on workflow
 * - Bluetooth scale integration support
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  ArrowLeft,
  Camera,
  Scale,
  Calculator,
  Wine,
  Beer,
  ChefHat,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bluetooth,
  BarChart3,
  Thermometer,
  Calendar,
  Eye,
  Save,
  Send,
  RefreshCw,
  Info,
  Plus,
  Minus
} from 'lucide-react'
import { StockDesignTokens, getWorkflowStyles, StockResponsiveUtils, WorkflowConfig } from '../StockModuleCore'
import type { 
  InventoryItem, 
  CountingWorkflow, 
  CountSubmissionRequest,
  ContainerInstance,
  WeightAnomaly
} from '@/types/stock'

// ============================================================================
// TYPES
// ============================================================================

interface CountFormData {
  // Common fields
  inventory_item_id: string
  counting_method: 'manual' | 'weight' | 'hybrid' | 'barcode'
  notes?: string
  location?: string

  // Manual counting
  counted_quantity?: number

  // Weight-based fields
  container_instance_id?: string
  gross_weight_grams?: number
  tare_weight_grams?: number
  net_weight_grams?: number
  scale_device_id?: string
  scale_brand?: string

  // Bottle hybrid fields
  full_bottles_count?: number
  partial_bottles_weight?: number

  // Keg fields
  keg_tapped_date?: string
  keg_temperature_celsius?: number

  // Batch fields
  batch_date?: string
  use_by_date?: string

  // Anomaly handling
  anomaly_override?: boolean
  anomaly_notes?: string
}

interface SubmissionState {
  isSubmitting: boolean
  isValidating: boolean
  anomalies: WeightAnomaly[]
  canProceed: boolean
  requiresConfirmation: boolean
}

// ============================================================================
// COUNT SUBMISSION COMPONENT
// ============================================================================

export const CountSubmission: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'select-item' | 'count' | 'review' | 'complete'>('select-item')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [assignedContainer, setAssignedContainer] = useState<ContainerInstance | null>(null)
  const [formData, setFormData] = useState<CountFormData>({} as CountFormData)
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isSubmitting: false,
    isValidating: false,
    anomalies: [],
    canProceed: true,
    requiresConfirmation: false
  })
  const [scaleConnected, setScaleConnected] = useState(false)
  const [liveWeight, setLiveWeight] = useState<number | null>(null)

  // Auto-validation when form data changes
  useEffect(() => {
    if (selectedItem && Object.keys(formData).length > 2) {
      validateCountData()
    }
  }, [formData, selectedItem])

  const validateCountData = useCallback(async () => {
    if (!selectedItem) return

    setSubmissionState(prev => ({ ...prev, isValidating: true }))

    try {
      // TODO: Call validation API
      // const response = await fetch('/api/stock/count/validate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...formData, inventory_item_id: selectedItem.id })
      // })
      
      // Mock validation response
      setTimeout(() => {
        const mockAnomalies: WeightAnomaly[] = []
        
        // Example anomaly detection
        if (formData.gross_weight_grams && formData.tare_weight_grams) {
          const netWeight = formData.gross_weight_grams - formData.tare_weight_grams
          if (netWeight <= 10) {
            mockAnomalies.push({
              type: 'empty_container',
              severity: 'warning',
              message: 'Container appears empty or nearly empty',
              suggested_action: 'Verify container contents before proceeding',
              confidence_score: 0.9
            })
          }
        }

        setSubmissionState(prev => ({
          ...prev,
          isValidating: false,
          anomalies: mockAnomalies,
          canProceed: mockAnomalies.filter(a => a.severity === 'critical').length === 0,
          requiresConfirmation: mockAnomalies.length > 0
        }))
      }, 1000)
    } catch (error) {
      console.error('Validation failed:', error)
      setSubmissionState(prev => ({ ...prev, isValidating: false }))
    }
  }, [formData, selectedItem])

  const handleSubmitCount = async () => {
    if (!selectedItem || !submissionState.canProceed) return

    setSubmissionState(prev => ({ ...prev, isSubmitting: true }))

    try {
      // TODO: Submit count to API
      // const response = await fetch('/api/stock/count/submit', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...formData, inventory_item_id: selectedItem.id })
      // })

      // Mock submission
      setTimeout(() => {
        setSubmissionState(prev => ({ ...prev, isSubmitting: false }))
        setCurrentStep('complete')
      }, 2000)
    } catch (error) {
      console.error('Submission failed:', error)
      setSubmissionState(prev => ({ ...prev, isSubmitting: false }))
    }
  }

  const resetForm = () => {
    setCurrentStep('select-item')
    setSelectedItem(null)
    setAssignedContainer(null)
    setFormData({} as CountFormData)
    setSubmissionState({
      isSubmitting: false,
      isValidating: false,
      anomalies: [],
      canProceed: true,
      requiresConfirmation: false
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <CountHeader 
        currentStep={currentStep}
        selectedItem={selectedItem}
        onBack={() => {
          if (currentStep === 'count') setCurrentStep('select-item')
          else if (currentStep === 'review') setCurrentStep('count')
        }}
        onReset={resetForm}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Step Content */}
        {currentStep === 'select-item' && (
          <ItemSelection
            onItemSelected={(item) => {
              setSelectedItem(item)
              setFormData({
                inventory_item_id: item.id,
                counting_method: getDefaultCountingMethod(item.counting_workflow),
                location: item.storage_location || undefined
              })
              setCurrentStep('count')
            }}
          />
        )}

        {currentStep === 'count' && selectedItem && (
          <CountInterface
            item={selectedItem}
            formData={formData}
            onFormDataChange={setFormData}
            submissionState={submissionState}
            scaleConnected={scaleConnected}
            liveWeight={liveWeight}
            assignedContainer={assignedContainer}
            onContainerAssigned={setAssignedContainer}
            onNext={() => setCurrentStep('review')}
          />
        )}

        {currentStep === 'review' && selectedItem && (
          <ReviewSubmission
            item={selectedItem}
            formData={formData}
            submissionState={submissionState}
            assignedContainer={assignedContainer}
            onSubmit={handleSubmitCount}
            onEdit={() => setCurrentStep('count')}
          />
        )}

        {currentStep === 'complete' && selectedItem && (
          <SubmissionComplete
            item={selectedItem}
            onNewCount={resetForm}
            onViewHistory={() => console.log('View history')}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// COUNT HEADER COMPONENT
// ============================================================================

interface CountHeaderProps {
  currentStep: string
  selectedItem: InventoryItem | null
  onBack: () => void
  onReset: () => void
}

const CountHeader: React.FC<CountHeaderProps> = ({ currentStep, selectedItem, onBack, onReset }) => {
  const steps = ['select-item', 'count', 'review', 'complete']
  const stepIndex = steps.indexOf(currentStep)

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Top Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {currentStep !== 'select-item' && (
              <button
                onClick={onBack}
                className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${StockResponsiveUtils.ipadOptimized.button}`}
              >
                <ArrowLeft size={24} />
              </button>
            )}
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Submit Count</h1>
              {selectedItem && (
                <p className="text-gray-600 mt-1">
                  {selectedItem.item_name} • {WorkflowConfig[selectedItem.counting_workflow as keyof typeof WorkflowConfig]?.name}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onReset}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Start Over
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-3">
          {steps.slice(0, -1).map((step, index) => (
            <React.Fragment key={step}>
              <div className={`flex items-center gap-2 ${
                index <= stepIndex ? 'text-blue-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                  index < stepIndex 
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : index === stepIndex
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {index < stepIndex ? <CheckCircle size={16} /> : index + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">
                  {step === 'select-item' ? 'Select Item' :
                   step === 'count' ? 'Count' :
                   step === 'review' ? 'Review' : 'Complete'}
                </span>
              </div>
              
              {index < steps.length - 2 && (
                <div className={`h-0.5 w-12 ${
                  index < stepIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ITEM SELECTION COMPONENT
// ============================================================================

interface ItemSelectionProps {
  onItemSelected: (item: InventoryItem) => void
}

const ItemSelection: React.FC<ItemSelectionProps> = ({ onItemSelected }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWorkflow, setSelectedWorkflow] = useState<CountingWorkflow | 'all'>('all')
  const [recentItems, setRecentItems] = useState<InventoryItem[]>([])

  useEffect(() => {
    // TODO: Load recent items and search results
    setRecentItems(mockRecentItems)
  }, [searchTerm, selectedWorkflow])

  return (
    <div className="space-y-6">
      
      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Find Item to Count</h3>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, brand, or scan barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${StockResponsiveUtils.ipadOptimized.input}`}
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600">
              <Camera size={24} />
            </button>
          </div>

          {/* Workflow Filter */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <button
              onClick={() => setSelectedWorkflow('all')}
              className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                selectedWorkflow === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Types
            </button>
            
            {Object.entries(WorkflowConfig).map(([workflow, config]) => (
              <button
                key={workflow}
                onClick={() => setSelectedWorkflow(workflow as CountingWorkflow)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  selectedWorkflow === workflow
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={selectedWorkflow === workflow ? {
                  backgroundColor: getWorkflowStyles(workflow).primary
                } : {}}
              >
                {getWorkflowIcon(config.icon, 16)}
                <span className="hidden md:inline">{config.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Items */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Items</h3>
        
        <div className="grid gap-3">
          {recentItems.map(item => (
            <ItemSelectionCard
              key={item.id}
              item={item}
              onClick={() => onItemSelected(item)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ITEM SELECTION CARD
// ============================================================================

interface ItemSelectionCardProps {
  item: InventoryItem
  onClick: () => void
}

const ItemSelectionCard: React.FC<ItemSelectionCardProps> = ({ item, onClick }) => {
  const workflowStyles = getWorkflowStyles(item.counting_workflow)
  const config = WorkflowConfig[item.counting_workflow as keyof typeof WorkflowConfig]

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all text-left ${StockResponsiveUtils.ipadOptimized.button}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg text-white flex-shrink-0"
            style={{ backgroundColor: workflowStyles.primary }}
          >
            {getWorkflowIcon(config?.icon, 20)}
          </div>
          
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-gray-900 truncate">{item.item_name}</h4>
            {item.brand && (
              <p className="text-sm text-gray-600 truncate">{item.brand}</p>
            )}
            <p className="text-xs text-gray-500">{config?.name}</p>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-gray-900">
            {(item as any).quantity_on_hand || 0}
          </p>
          <p className="text-xs text-gray-500">Current</p>
        </div>
      </div>
    </button>
  )
}

// ============================================================================
// COUNT INTERFACE COMPONENT
// ============================================================================

interface CountInterfaceProps {
  item: InventoryItem
  formData: CountFormData
  onFormDataChange: (data: CountFormData) => void
  submissionState: SubmissionState
  scaleConnected: boolean
  liveWeight: number | null
  assignedContainer: ContainerInstance | null
  onContainerAssigned: (container: ContainerInstance) => void
  onNext: () => void
}

const CountInterface: React.FC<CountInterfaceProps> = ({
  item,
  formData,
  onFormDataChange,
  submissionState,
  scaleConnected,
  liveWeight,
  assignedContainer,
  onContainerAssigned,
  onNext
}) => {
  const workflowStyles = getWorkflowStyles(item.counting_workflow)
  const config = WorkflowConfig[item.counting_workflow as keyof typeof WorkflowConfig]

  const updateFormData = (updates: Partial<CountFormData>) => {
    onFormDataChange({ ...formData, ...updates })
  }

  const renderWorkflowInterface = () => {
    switch (item.counting_workflow) {
      case 'unit_count':
        return (
          <ManualCountInterface
            item={item}
            formData={formData}
            onUpdate={updateFormData}
          />
        )
      
      case 'container_weight':
        return (
          <ContainerWeightInterface
            item={item}
            formData={formData}
            onUpdate={updateFormData}
            assignedContainer={assignedContainer}
            onContainerAssigned={onContainerAssigned}
            scaleConnected={scaleConnected}
            liveWeight={liveWeight}
          />
        )
      
      case 'bottle_hybrid':
        return (
          <BottleHybridInterface
            item={item}
            formData={formData}
            onUpdate={updateFormData}
            scaleConnected={scaleConnected}
            liveWeight={liveWeight}
          />
        )
      
      case 'keg_weight':
        return (
          <KegWeightInterface
            item={item}
            formData={formData}
            onUpdate={updateFormData}
            scaleConnected={scaleConnected}
            liveWeight={liveWeight}
          />
        )
      
      case 'batch_weight':
        return (
          <BatchWeightInterface
            item={item}
            formData={formData}
            onUpdate={updateFormData}
            assignedContainer={assignedContainer}
            onContainerAssigned={onContainerAssigned}
            scaleConnected={scaleConnected}
            liveWeight={liveWeight}
          />
        )
      
      default:
        return <div>Unsupported workflow</div>
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Item Info Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="p-3 rounded-lg text-white"
            style={{ backgroundColor: workflowStyles.primary }}
          >
            {getWorkflowIcon(config?.icon, 24)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{item.item_name}</h2>
            <p className="text-gray-600">{config?.description}</p>
          </div>
        </div>

        {/* Current Quantity */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Current Quantity</p>
            <p className="text-2xl font-bold text-gray-900">
              {(item as any).quantity_on_hand || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Par Level</p>
            <p className="text-sm text-gray-900">
              {item.par_level_low} - {item.par_level_high}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="text-sm text-gray-900">
              {item.storage_location || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Count</p>
            <p className="text-sm text-gray-900">
              {(item as any).count_date 
                ? new Date((item as any).count_date).toLocaleDateString()
                : 'Never'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Workflow-Specific Interface */}
      {renderWorkflowInterface()}

      {/* Validation Status */}
      {submissionState.anomalies.length > 0 && (
        <AnomalyDisplay anomalies={submissionState.anomalies} />
      )}

      {/* Notes */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
        <textarea
          placeholder="Add any notes about this count..."
          value={formData.notes || ''}
          onChange={(e) => updateFormData({ notes: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
      </div>

      {/* Next Button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!submissionState.canProceed || submissionState.isValidating}
          className={`px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            submissionState.canProceed && !submissionState.isValidating
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500'
          } ${StockResponsiveUtils.ipadOptimized.button}`}
        >
          {submissionState.isValidating ? (
            <div className="flex items-center gap-2">
              <RefreshCw size={20} className="animate-spin" />
              Validating...
            </div>
          ) : (
            'Review & Submit'
          )}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// MANUAL COUNT INTERFACE
// ============================================================================

interface ManualCountInterfaceProps {
  item: InventoryItem
  formData: CountFormData
  onUpdate: (updates: Partial<CountFormData>) => void
}

const ManualCountInterface: React.FC<ManualCountInterfaceProps> = ({ item, formData, onUpdate }) => {
  const [quantity, setQuantity] = useState(formData.counted_quantity || 0)

  const updateQuantity = (newQuantity: number) => {
    const validQuantity = Math.max(0, newQuantity)
    setQuantity(validQuantity)
    onUpdate({ counted_quantity: validQuantity })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Manual Count</h3>
      
      {/* Large Number Input */}
      <div className="text-center mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Enter Counted Quantity
        </label>
        
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => updateQuantity(quantity - 1)}
            className={`p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ${StockResponsiveUtils.ipadOptimized.button}`}
          >
            <Minus size={24} />
          </button>
          
          <input
            type="number"
            value={quantity}
            onChange={(e) => updateQuantity(parseInt(e.target.value) || 0)}
            className="w-32 h-16 text-3xl font-bold text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
          />
          
          <button
            onClick={() => updateQuantity(quantity + 1)}
            className={`p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors ${StockResponsiveUtils.ipadOptimized.button}`}
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-4 gap-3">
          {[1, 5, 10, 25].map(value => (
            <button
              key={value}
              onClick={() => updateQuantity(quantity + value)}
              className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors"
            >
              +{value}
            </button>
          ))}
        </div>
      </div>

      {/* Unit Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          Unit: <span className="font-medium">{item.recipe_unit}</span>
          {item.pack_size > 1 && (
            <span className="ml-2">
              • Pack Size: <span className="font-medium">{item.pack_size}</span>
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// CONTAINER WEIGHT INTERFACE
// ============================================================================

interface ContainerWeightInterfaceProps {
  item: InventoryItem
  formData: CountFormData
  onUpdate: (updates: Partial<CountFormData>) => void
  assignedContainer: ContainerInstance | null
  onContainerAssigned: (container: ContainerInstance) => void
  scaleConnected: boolean
  liveWeight: number | null
}

const ContainerWeightInterface: React.FC<ContainerWeightInterfaceProps> = ({
  item,
  formData,
  onUpdate,
  assignedContainer,
  onContainerAssigned,
  scaleConnected,
  liveWeight
}) => {
  const [manualWeight, setManualWeight] = useState(formData.gross_weight_grams || 0)

  useEffect(() => {
    if (liveWeight && scaleConnected) {
      onUpdate({ gross_weight_grams: liveWeight })
    }
  }, [liveWeight, scaleConnected])

  const calculateNetWeight = () => {
    const grossWeight = formData.gross_weight_grams || 0
    const tareWeight = assignedContainer?.tare_weight_grams || 0
    return Math.max(0, grossWeight - tareWeight)
  }

  const calculateQuantity = () => {
    const netWeight = calculateNetWeight()
    const unitWeight = item.typical_unit_weight_grams || 1
    return netWeight / unitWeight
  }

  return (
    <div className="space-y-6">
      
      {/* Container Assignment */}
      {!assignedContainer ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Container</h3>
          <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 transition-colors">
            <Package size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="font-medium text-gray-900">Scan or Select Container</p>
            <p className="text-sm text-gray-500">Tap to choose from available containers</p>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Container Assigned</h3>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <p className="font-semibold text-green-900">{assignedContainer.container_barcode}</p>
              <p className="text-sm text-green-700">Tare Weight: {assignedContainer.tare_weight_grams}g</p>
            </div>
            <CheckCircle size={24} className="text-green-600" />
          </div>
        </div>
      )}

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

        {/* Live Weight Display */}
        {scaleConnected && liveWeight !== null ? (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">Live Weight Reading</p>
            <p className="text-4xl font-bold text-blue-600">{liveWeight.toFixed(1)}g</p>
            <button
              onClick={() => onUpdate({ gross_weight_grams: liveWeight })}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Capture Weight
            </button>
          </div>
        ) : (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">Manual Weight Entry</p>
            <input
              type="number"
              value={manualWeight}
              onChange={(e) => {
                const weight = parseFloat(e.target.value) || 0
                setManualWeight(weight)
                onUpdate({ gross_weight_grams: weight })
              }}
              className="w-48 h-16 text-2xl font-bold text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.0"
              step="0.1"
            />
            <p className="text-sm text-gray-500 mt-1">grams</p>
          </div>
        )}

        {/* Weight Breakdown */}
        {assignedContainer && formData.gross_weight_grams && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600">Gross Weight</p>
              <p className="text-lg font-semibold">{formData.gross_weight_grams.toFixed(1)}g</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Tare Weight</p>
              <p className="text-lg font-semibold">{assignedContainer.tare_weight_grams}g</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Net Weight</p>
              <p className="text-lg font-semibold text-green-600">{calculateNetWeight().toFixed(1)}g</p>
            </div>
          </div>
        )}

        {/* Calculated Quantity */}
        {assignedContainer && formData.gross_weight_grams && item.typical_unit_weight_grams && (
          <div className="mt-4 text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">Calculated Quantity</p>
            <p className="text-3xl font-bold text-blue-900">{calculateQuantity().toFixed(1)}</p>
            <p className="text-sm text-blue-700">{item.recipe_unit}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getDefaultCountingMethod = (workflow: CountingWorkflow): 'manual' | 'weight' | 'hybrid' | 'barcode' => {
  switch (workflow) {
    case 'unit_count':
      return 'manual'
    case 'container_weight':
    case 'keg_weight':
      return 'weight'
    case 'bottle_hybrid':
    case 'batch_weight':
      return 'hybrid'
    default:
      return 'manual'
  }
}

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

// ============================================================================
// PLACEHOLDER COMPONENTS (TO BE IMPLEMENTED)
// ============================================================================

const BottleHybridInterface: React.FC<any> = () => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Bottle Hybrid Counting</h3>
    <p className="text-gray-600">Bottle hybrid interface will be implemented next...</p>
  </div>
)

const KegWeightInterface: React.FC<any> = () => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Keg Weight Counting</h3>
    <p className="text-gray-600">Keg weight interface will be implemented next...</p>
  </div>
)

const BatchWeightInterface: React.FC<any> = () => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Weight Counting</h3>
    <p className="text-gray-600">Batch weight interface will be implemented next...</p>
  </div>
)

const AnomalyDisplay: React.FC<{ anomalies: WeightAnomaly[] }> = ({ anomalies }) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
    <div className="flex items-center gap-2 mb-4">
      <AlertTriangle size={20} className="text-yellow-600" />
      <h3 className="text-lg font-semibold text-yellow-900">Anomalies Detected</h3>
    </div>
    
    <div className="space-y-3">
      {anomalies.map((anomaly, index) => (
        <div key={index} className="p-3 bg-white rounded border border-yellow-300">
          <p className="font-medium text-gray-900">{anomaly.message}</p>
          <p className="text-sm text-gray-600">{anomaly.suggested_action}</p>
        </div>
      ))}
    </div>
  </div>
)

const ReviewSubmission: React.FC<any> = () => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Submit</h3>
    <p className="text-gray-600">Review component will be implemented next...</p>
  </div>
)

const SubmissionComplete: React.FC<any> = () => (
  <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
    <CheckCircle size={64} className="mx-auto text-green-600 mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Count Submitted Successfully!</h3>
    <p className="text-gray-600">Your inventory count has been recorded and validated.</p>
  </div>
)

// ============================================================================
// MOCK DATA
// ============================================================================

const mockRecentItems: InventoryItem[] = [
  {
    id: '1',
    client_id: 'test',
    category_id: 'cat-1',
    item_name: 'Bulk Rice (Jasmine)',
    brand: 'Golden Grain',
    recipe_unit: 'kg',
    par_level_low: 20,
    par_level_high: 50,
    counting_workflow: 'container_weight',
    supports_weight_counting: true,
    requires_container: true,
    supports_partial_units: true,
    pack_size: 1,
    order_by_pack: false,
    is_bottled_product: false,
    is_keg: false,
    is_batch_tracked: false,
    verification_frequency_months: 6,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
] as InventoryItem[]

export default CountSubmission