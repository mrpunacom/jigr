/**
 * JiGR Container Assignment/Recommendation UI
 * 
 * Intelligent container assignment system with:
 * - Smart container recommendations based on item type
 * - Container compatibility checking
 * - Assignment history and tracking
 * - Bulk assignment operations
 * - Container utilization analytics
 * - Automatic assignment suggestions
 * - iPad-optimized touch interface
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Container,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Star,
  TrendingUp,
  Calendar,
  Package,
  Scale,
  Eye,
  Plus,
  Minus,
  RotateCw,
  Info,
  Zap,
  Target,
  ArrowRight,
  ExternalLink,
  History
} from 'lucide-react'
import { StockDesignTokens, getWorkflowStyles, StockResponsiveUtils } from '../StockModuleCore'
import type { 
  InventoryItem, 
  ContainerInstance, 
  VerificationStatus,
  CountingWorkflow 
} from '@/types/stock'

// ============================================================================
// TYPES
// ============================================================================

interface ContainerRecommendation {
  container: ContainerInstance
  score: number
  reasons: string[]
  compatibility: 'excellent' | 'good' | 'fair' | 'poor'
  utilizationHistory?: {
    timesUsed: number
    lastUsed: string | null
    avgDuration: number
  }
}

interface AssignmentRule {
  id: string
  name: string
  description: string
  isActive: boolean
  priority: number
  conditions: {
    itemCategories?: string[]
    containerTypes?: string[]
    workflowTypes?: CountingWorkflow[]
  }
  actions: {
    autoAssign?: boolean
    priority?: number
    notify?: boolean
  }
}

interface ContainerAssignmentProps {
  item: InventoryItem
  isOpen: boolean
  onClose: () => void
  onAssignContainer: (containerId: string) => void
  currentAssignment?: ContainerInstance
}

interface BulkAssignmentProps {
  items: InventoryItem[]
  isOpen: boolean
  onClose: () => void
  onBulkAssign: (assignments: { itemId: string; containerId: string }[]) => void
}

// ============================================================================
// CONTAINER ASSIGNMENT COMPONENT
// ============================================================================

export const ContainerAssignment: React.FC<ContainerAssignmentProps> = ({
  item,
  isOpen,
  onClose,
  onAssignContainer,
  currentAssignment
}) => {
  const [recommendations, setRecommendations] = useState<ContainerRecommendation[]>([])
  const [availableContainers, setAvailableContainers] = useState<ContainerInstance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<VerificationStatus | 'all'>('all')
  const [showOnlyRecommended, setShowOnlyRecommended] = useState(true)
  const [selectedContainer, setSelectedContainer] = useState<ContainerInstance | null>(null)

  useEffect(() => {
    if (isOpen && item) {
      loadRecommendations()
      loadAvailableContainers()
    }
  }, [isOpen, item])

  const loadRecommendations = async () => {
    try {
      setIsLoading(true)
      // TODO: Replace with actual API call
      // Mock recommendations
      setTimeout(() => {
        const mockRecommendations: ContainerRecommendation[] = [
          {
            container: {
              id: 'container-1',
              client_id: 'test-client',
              container_barcode: 'JIGR-C-00001',
              container_type_id: 'bulk_dry_goods',
              container_nickname: 'Large Dry Goods A',
              tare_weight_grams: 850,
              last_weighed_date: new Date().toISOString(),
              needs_reweigh: false,
              verification_status: 'current',
              times_used: 23,
              last_used_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            score: 95,
            reasons: [
              'Perfect size for this item type',
              'Recently verified weight',
              'Compatible with dry goods',
              'High usage history indicates reliability'
            ],
            compatibility: 'excellent',
            utilizationHistory: {
              timesUsed: 23,
              lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              avgDuration: 7 // days
            }
          },
          {
            container: {
              id: 'container-2',
              client_id: 'test-client',
              container_barcode: 'JIGR-C-00002',
              container_type_id: 'bulk_dry_goods',
              container_nickname: 'Medium Dry Goods B',
              tare_weight_grams: 650,
              last_weighed_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              needs_reweigh: false,
              verification_status: 'current',
              times_used: 15,
              last_used_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            score: 82,
            reasons: [
              'Good size match',
              'Compatible container type',
              'Available and verified'
            ],
            compatibility: 'good',
            utilizationHistory: {
              timesUsed: 15,
              lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              avgDuration: 5
            }
          }
        ]
        setRecommendations(mockRecommendations)
        setIsLoading(false)
      }, 800)
    } catch (error) {
      console.error('Failed to load recommendations:', error)
      setIsLoading(false)
    }
  }

  const loadAvailableContainers = async () => {
    try {
      // TODO: Replace with actual API call
      // Mock data
      setTimeout(() => {
        setAvailableContainers([
          // Include recommendation containers plus others
          ...recommendations.map(r => r.container),
          {
            id: 'container-3',
            client_id: 'test-client',
            container_barcode: 'JIGR-C-00003',
            container_type_id: 'prep_containers',
            container_nickname: 'Small Prep Container',
            tare_weight_grams: 300,
            last_weighed_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            needs_reweigh: true,
            verification_status: 'due_soon',
            times_used: 8,
            last_used_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
      }, 400)
    } catch (error) {
      console.error('Failed to load containers:', error)
    }
  }

  const handleAssign = async (containerId: string) => {
    try {
      await onAssignContainer(containerId)
      onClose()
    } catch (error) {
      console.error('Failed to assign container:', error)
    }
  }

  const getCompatibilityColor = (compatibility: ContainerRecommendation['compatibility']) => {
    switch (compatibility) {
      case 'excellent':
        return 'text-green-600 bg-green-50'
      case 'good':
        return 'text-blue-600 bg-blue-50'
      case 'fair':
        return 'text-yellow-600 bg-yellow-50'
      case 'poor':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'current':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'due_soon':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const filteredContainers = availableContainers.filter(container => {
    const matchesSearch = container.container_barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (container.container_nickname?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    const matchesStatus = filterStatus === 'all' || container.verification_status === filterStatus
    const matchesRecommended = !showOnlyRecommended || recommendations.some(r => r.container.id === container.id)
    
    return matchesSearch && matchesStatus && matchesRecommended
  })

  if (!isOpen) return null

  const workflowStyles = getWorkflowStyles(item.counting_workflow)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="border-b bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="p-3 rounded-lg text-white"
                style={{ backgroundColor: workflowStyles.primary }}
              >
                <Container size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Container Assignment</h2>
                <p className="text-gray-600 mt-1">
                  Assign a container for "{item.item_name}"
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="rotate-45" size={20} />
            </button>
          </div>

          {/* Current Assignment */}
          {currentAssignment && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={16} className="text-blue-600" />
                <span className="font-medium text-blue-900">Currently Assigned</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-semibold text-blue-900">
                    {currentAssignment.container_barcode}
                  </p>
                  {currentAssignment.container_nickname && (
                    <p className="text-sm text-blue-700">{currentAssignment.container_nickname}</p>
                  )}
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  View Details
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="border-b bg-gray-50 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search containers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as VerificationStatus | 'all')}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="current">Current</option>
              <option value="due_soon">Due Soon</option>
              <option value="overdue">Overdue</option>
            </select>

            {/* Show Recommended Toggle */}
            <button
              onClick={() => setShowOnlyRecommended(!showOnlyRecommended)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showOnlyRecommended 
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Star size={16} />
              {showOnlyRecommended ? 'Showing Recommended' : 'Show All'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          
          {/* AI Recommendations */}
          {!showOnlyRecommended && recommendations.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={20} className="text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
              </div>
              
              <div className="grid gap-4">
                {recommendations.slice(0, 2).map(recommendation => (
                  <ContainerRecommendationCard
                    key={recommendation.container.id}
                    recommendation={recommendation}
                    onAssign={handleAssign}
                    onViewDetails={(container) => setSelectedContainer(container)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Containers */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {showOnlyRecommended ? 'Recommended Containers' : 'Available Containers'}
              </h3>
              <span className="text-sm text-gray-500">
                {filteredContainers.length} container{filteredContainers.length !== 1 ? 's' : ''}
              </span>
            </div>

            {isLoading ? (
              <ContainerAssignmentLoading />
            ) : filteredContainers.length === 0 ? (
              <EmptyContainerState
                searchQuery={searchQuery}
                showOnlyRecommended={showOnlyRecommended}
                onShowAll={() => setShowOnlyRecommended(false)}
                onClearSearch={() => setSearchQuery('')}
              />
            ) : (
              <div className="grid gap-4">
                {filteredContainers.map(container => {
                  const recommendation = recommendations.find(r => r.container.id === container.id)
                  
                  return (
                    <ContainerCard
                      key={container.id}
                      container={container}
                      recommendation={recommendation}
                      isCurrentAssignment={currentAssignment?.id === container.id}
                      onAssign={handleAssign}
                      onViewDetails={(container) => setSelectedContainer(container)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Container Detail Modal */}
        {selectedContainer && (
          <ContainerDetailModal
            container={selectedContainer}
            onClose={() => setSelectedContainer(null)}
            onAssign={handleAssign}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// CONTAINER RECOMMENDATION CARD
// ============================================================================

interface ContainerRecommendationCardProps {
  recommendation: ContainerRecommendation
  onAssign: (containerId: string) => void
  onViewDetails: (container: ContainerInstance) => void
}

const ContainerRecommendationCard: React.FC<ContainerRecommendationCardProps> = ({
  recommendation,
  onAssign,
  onViewDetails
}) => {
  const { container, score, reasons, compatibility } = recommendation

  return (
    <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-200 rounded-lg">
            <Target size={20} className="text-orange-700" />
          </div>
          <div>
            <h4 className="font-mono font-bold text-gray-900">{container.container_barcode}</h4>
            {container.container_nickname && (
              <p className="text-sm text-gray-600">{container.container_nickname}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCompatibilityColor(compatibility)}`}>
            {score}% match
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">Reasons for recommendation:</p>
          <ul className="text-sm space-y-1">
            {reasons.slice(0, 2).map((reason, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-600">Tare Weight</p>
            <p className="font-semibold">{container.tare_weight_grams}g</p>
          </div>
          <div>
            <p className="text-gray-600">Times Used</p>
            <p className="font-semibold">{container.times_used}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => onViewDetails(container)}
          className="text-orange-600 hover:text-orange-800 text-sm font-medium flex items-center gap-1"
        >
          <Eye size={14} />
          View Details
        </button>
        
        <button
          onClick={() => onAssign(container.id)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <CheckCircle size={16} />
          Assign Container
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// CONTAINER CARD
// ============================================================================

interface ContainerCardProps {
  container: ContainerInstance
  recommendation?: ContainerRecommendation
  isCurrentAssignment: boolean
  onAssign: (containerId: string) => void
  onViewDetails: (container: ContainerInstance) => void
}

const ContainerCard: React.FC<ContainerCardProps> = ({
  container,
  recommendation,
  isCurrentAssignment,
  onAssign,
  onViewDetails
}) => {
  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'current':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'due_soon':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className={`border rounded-lg p-4 hover:shadow-md transition-all ${
      isCurrentAssignment 
        ? 'border-blue-300 bg-blue-50' 
        : recommendation 
          ? 'border-orange-200 bg-orange-50/30'
          : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            isCurrentAssignment 
              ? 'bg-blue-200 text-blue-700'
              : recommendation
                ? 'bg-orange-200 text-orange-700'
                : 'bg-gray-200 text-gray-700'
          }`}>
            <Container size={20} />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-mono font-bold text-gray-900">{container.container_barcode}</h4>
              {recommendation && (
                <Star size={14} className="text-orange-500" />
              )}
              {isCurrentAssignment && (
                <CheckCircle size={14} className="text-blue-600" />
              )}
            </div>
            {container.container_nickname && (
              <p className="text-sm text-gray-600">{container.container_nickname}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {recommendation && (
            <div className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded font-medium">
              {recommendation.score}% match
            </div>
          )}
          
          <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(container.verification_status)}`}>
            {container.verification_status.replace('_', ' ')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-600">Tare Weight</p>
          <p className="font-semibold">{container.tare_weight_grams}g</p>
        </div>
        <div>
          <p className="text-gray-600">Times Used</p>
          <p className="font-semibold">{container.times_used}</p>
        </div>
        <div>
          <p className="text-gray-600">Last Used</p>
          <p className="font-semibold">
            {container.last_used_date 
              ? new Date(container.last_used_date).toLocaleDateString()
              : 'Never'
            }
          </p>
        </div>
      </div>

      {recommendation && recommendation.reasons.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Why this container:</p>
          <div className="flex flex-wrap gap-2">
            {recommendation.reasons.slice(0, 2).map((reason, index) => (
              <div key={index} className="text-xs bg-white px-2 py-1 rounded border">
                {reason}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={() => onViewDetails(container)}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center gap-1"
        >
          <Eye size={14} />
          View Details
        </button>
        
        {isCurrentAssignment ? (
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
            Currently Assigned
          </div>
        ) : (
          <button
            onClick={() => onAssign(container.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <CheckCircle size={16} />
            Assign
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const ContainerAssignmentLoading: React.FC = () => {
  const skeletonItems = Array(3).fill(0)
  
  return (
    <div className="space-y-4">
      {skeletonItems.map((_, i) => (
        <div key={i} className="border rounded-lg p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="h-6 bg-gray-300 rounded w-16"></div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-300 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface EmptyContainerStateProps {
  searchQuery: string
  showOnlyRecommended: boolean
  onShowAll: () => void
  onClearSearch: () => void
}

const EmptyContainerState: React.FC<EmptyContainerStateProps> = ({
  searchQuery,
  showOnlyRecommended,
  onShowAll,
  onClearSearch
}) => {
  return (
    <div className="text-center py-8">
      <Container size={48} className="mx-auto text-gray-400 mb-4" />
      
      {searchQuery ? (
        <>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No containers found</h3>
          <p className="text-gray-600 mb-6">
            No containers match your search for "{searchQuery}"
          </p>
          <button
            onClick={onClearSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Clear Search
          </button>
        </>
      ) : showOnlyRecommended ? (
        <>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations available</h3>
          <p className="text-gray-600 mb-6">
            We couldn't find any recommended containers for this item.
          </p>
          <button
            onClick={onShowAll}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            View All Containers
          </button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No containers available</h3>
          <p className="text-gray-600 mb-6">
            There are no available containers at this time.
          </p>
        </>
      )}
    </div>
  )
}

// ============================================================================
// CONTAINER DETAIL MODAL
// ============================================================================

interface ContainerDetailModalProps {
  container: ContainerInstance
  onClose: () => void
  onAssign: (containerId: string) => void
}

const ContainerDetailModal: React.FC<ContainerDetailModalProps> = ({
  container,
  onClose,
  onAssign
}) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Container Details</h3>
              <p className="text-gray-600">{container.container_barcode}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Plus className="rotate-45" size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Container Type</p>
                <p className="font-medium">{container.container_type_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nickname</p>
                <p className="font-medium">{container.container_nickname || 'None'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tare Weight</p>
                <p className="font-medium">{container.tare_weight_grams}g</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Times Used</p>
                <p className="font-medium">{container.times_used}</p>
              </div>
            </div>

            {/* Usage History */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Usage History</p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm">
                  Last used: {container.last_used_date 
                    ? new Date(container.last_used_date).toLocaleDateString()
                    : 'Never used'
                  }
                </p>
                <p className="text-sm">
                  Last weighed: {new Date(container.last_weighed_date).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  Verification status: 
                  <span className={`ml-1 font-medium ${
                    container.verification_status === 'current' ? 'text-green-600' :
                    container.verification_status === 'due_soon' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {container.verification_status.replace('_', ' ')}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
          <button
            onClick={() => onAssign(container.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Assign Container
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// BULK ASSIGNMENT COMPONENT
// ============================================================================

export const BulkContainerAssignment: React.FC<BulkAssignmentProps> = ({
  items,
  isOpen,
  onClose,
  onBulkAssign
}) => {
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map())
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAssign = (itemId: string, containerId: string) => {
    setAssignments(prev => new Map(prev.set(itemId, containerId)))
  }

  const handleSubmit = async () => {
    setIsProcessing(true)
    try {
      const assignmentArray = Array.from(assignments.entries()).map(([itemId, containerId]) => ({
        itemId,
        containerId
      }))
      await onBulkAssign(assignmentArray)
      onClose()
    } catch (error) {
      console.error('Failed to bulk assign containers:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        <div className="border-b p-6">
          <h2 className="text-xl font-bold text-gray-900">Bulk Container Assignment</h2>
          <p className="text-gray-600 mt-1">
            Assign containers to {items.length} items
          </p>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{item.item_name}</h4>
                {/* TODO: Add individual container assignment interface */}
                <p className="text-sm text-gray-600">
                  Individual assignment interface will be implemented next
                </p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border-t p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={assignments.size === 0 || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium"
          >
            {isProcessing ? 'Assigning...' : `Assign ${assignments.size} Container${assignments.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getCompatibilityColor = (compatibility: ContainerRecommendation['compatibility']) => {
  switch (compatibility) {
    case 'excellent':
      return 'text-green-600 bg-green-50'
    case 'good':
      return 'text-blue-600 bg-blue-50'
    case 'fair':
      return 'text-yellow-600 bg-yellow-50'
    case 'poor':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export default ContainerAssignment