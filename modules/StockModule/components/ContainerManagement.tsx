/**
 * JiGR Container Management Interface
 * 
 * Comprehensive container management system with:
 * - Container creation with automatic barcode generation
 * - Container verification and tare weight management
 * - Smart assignment and recommendations
 * - Lifecycle tracking and maintenance scheduling
 * - Barcode scanning and label printing
 * - Usage analytics and performance tracking
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Package,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Camera,
  Printer,
  Scale,
  CheckCircle,
  Clock,
  AlertTriangle,
  Archive,
  QrCode,
  Calendar,
  TrendingUp,
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react'
import { StockDesignTokens, getContainerStyles, StockResponsiveUtils } from '../StockModuleCore'
import type { ContainerInstance, VerificationStatus } from '@/types/stock'

// ============================================================================
// TYPES
// ============================================================================

interface ContainerFilters {
  search: string
  status: VerificationStatus | 'all'
  isActive: boolean | 'all'
  containerType: string
  needsVerification: boolean | 'all'
}

interface ContainerStats {
  total: number
  active: number
  needsVerification: number
  overdue: number
  inUse: number
}

// ============================================================================
// CONTAINER MANAGEMENT COMPONENT
// ============================================================================

export const ContainerManagement: React.FC = () => {
  const [containers, setContainers] = useState<ContainerInstance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedContainer, setSelectedContainer] = useState<ContainerInstance | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState<ContainerStats | null>(null)
  
  const [filters, setFilters] = useState<ContainerFilters>({
    search: '',
    status: 'all',
    isActive: 'all',
    containerType: '',
    needsVerification: 'all'
  })

  useEffect(() => {
    loadContainers()
    loadStats()
  }, [filters])

  const loadContainers = async () => {
    try {
      setIsLoading(true)
      
      // TODO: Replace with actual API call
      // Build query parameters
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.isActive !== 'all') params.append('is_active', filters.isActive.toString())
      if (filters.containerType) params.append('container_type_id', filters.containerType)
      if (filters.needsVerification !== 'all') params.append('needs_verification', filters.needsVerification.toString())
      
      // const response = await fetch(`/api/stock/containers?${params}`)
      // const data = await response.json()
      
      // Mock data for demonstration
      setTimeout(() => {
        setContainers(mockContainers)
        setIsLoading(false)
      }, 800)
    } catch (error) {
      console.error('Failed to load containers:', error)
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // TODO: Replace with actual API call
      setStats({
        total: 45,
        active: 42,
        needsVerification: 8,
        overdue: 3,
        inUse: 12
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <ContainerHeader 
        stats={stats}
        onCreateNew={() => setShowCreateModal(true)}
      />

      {/* Filters Bar */}
      <FiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard title="Total" value={stats.total} color="blue" />
            <StatCard title="Active" value={stats.active} color="green" />
            <StatCard title="In Use" value={stats.inUse} color="yellow" />
            <StatCard title="Need Verification" value={stats.needsVerification} color="orange" />
            <StatCard title="Overdue" value={stats.overdue} color="red" />
          </div>
        )}

        {/* Containers Grid */}
        {isLoading ? (
          <ContainersLoading />
        ) : (
          <ContainersGrid
            containers={containers}
            onSelectContainer={setSelectedContainer}
            onEditContainer={(container) => console.log('Edit:', container)}
            onDeleteContainer={(container) => console.log('Delete:', container)}
          />
        )}

        {/* Empty State */}
        {!isLoading && containers.length === 0 && (
          <EmptyState onCreateNew={() => setShowCreateModal(true)} />
        )}
      </div>

      {/* Create Container Modal */}
      {showCreateModal && (
        <CreateContainerModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(container) => {
            setContainers(prev => [container, ...prev])
            setShowCreateModal(false)
          }}
        />
      )}

      {/* Container Detail Modal */}
      {selectedContainer && (
        <ContainerDetailModal
          container={selectedContainer}
          onClose={() => setSelectedContainer(null)}
          onUpdated={(container) => {
            setContainers(prev => prev.map(c => c.id === container.id ? container : c))
            setSelectedContainer(null)
          }}
        />
      )}
    </div>
  )
}

// ============================================================================
// CONTAINER HEADER COMPONENT
// ============================================================================

interface ContainerHeaderProps {
  stats: ContainerStats | null
  onCreateNew: () => void
}

const ContainerHeader: React.FC<ContainerHeaderProps> = ({ stats, onCreateNew }) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Container Management</h1>
            <p className="text-gray-600 mt-1">
              Manage physical containers for weight-based counting
              {stats && (
                <span className="ml-2">• {stats.total} containers total</span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
              <QrCode size={20} />
              Print Labels
            </button>
            <button 
              onClick={onCreateNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Add Container
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// FILTERS BAR COMPONENT
// ============================================================================

interface FiltersBarProps {
  filters: ContainerFilters
  onFiltersChange: (filters: ContainerFilters) => void
  showFilters: boolean
  onToggleFilters: () => void
}

const FiltersBar: React.FC<FiltersBarProps> = ({ 
  filters, 
  onFiltersChange, 
  showFilters, 
  onToggleFilters
}) => {
  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Main Filter Row */}
        <div className="flex items-center gap-4">
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search containers or scan barcode..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className={`pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${StockResponsiveUtils.ipadOptimized.input}`}
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as VerificationStatus | 'all' })}
            className={`border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${StockResponsiveUtils.ipadOptimized.input}`}
          >
            <option value="all">All Status</option>
            <option value="current">Current</option>
            <option value="due_soon">Due Soon</option>
            <option value="overdue">Overdue</option>
          </select>

          {/* More Filters */}
          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white text-gray-700'
            }`}
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.isActive.toString()}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                isActive: e.target.value === 'all' ? 'all' : e.target.value === 'true' 
              })}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Containers</option>
              <option value="true">Active Only</option>
              <option value="false">Retired Only</option>
            </select>

            <input
              type="text"
              placeholder="Filter by container type..."
              value={filters.containerType}
              onChange={(e) => onFiltersChange({ ...filters, containerType: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filters.needsVerification.toString()}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                needsVerification: e.target.value === 'all' ? 'all' : e.target.value === 'true' 
              })}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Any Verification Status</option>
              <option value="true">Needs Verification</option>
              <option value="false">Verified</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// CONTAINERS GRID COMPONENT
// ============================================================================

interface ContainersGridProps {
  containers: ContainerInstance[]
  onSelectContainer: (container: ContainerInstance) => void
  onEditContainer: (container: ContainerInstance) => void
  onDeleteContainer: (container: ContainerInstance) => void
}

const ContainersGrid: React.FC<ContainersGridProps> = ({ 
  containers, 
  onSelectContainer,
  onEditContainer,
  onDeleteContainer
}) => {
  return (
    <div className={`grid gap-4 ${StockResponsiveUtils.ipadOptimized.cardGrid}`}>
      {containers.map(container => (
        <ContainerCard
          key={container.id}
          container={container}
          onClick={() => onSelectContainer(container)}
          onEdit={() => onEditContainer(container)}
          onDelete={() => onDeleteContainer(container)}
        />
      ))}
    </div>
  )
}

// ============================================================================
// CONTAINER CARD COMPONENT
// ============================================================================

interface ContainerCardProps {
  container: ContainerInstance
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
}

const ContainerCard: React.FC<ContainerCardProps> = ({ 
  container, 
  onClick,
  onEdit,
  onDelete
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

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'current':
        return <CheckCircle size={16} />
      case 'due_soon':
        return <Clock size={16} />
      case 'overdue':
        return <AlertTriangle size={16} />
      default:
        return <Package size={16} />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all cursor-pointer">
      
      {/* Card Header */}
      <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(container.verification_status)}`}>
            {getStatusIcon(container.verification_status)}
            {container.verification_status.replace('_', ' ')}
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation()
              // Show dropdown menu
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <MoreVertical size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4" onClick={onClick}>
        
        {/* Container ID */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900 font-mono">
            {container.container_barcode}
          </h3>
          {container.container_nickname && (
            <p className="text-sm text-gray-600">{container.container_nickname}</p>
          )}
        </div>

        {/* Container Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-600">Tare Weight</p>
            <p className="text-sm font-semibold">{container.tare_weight_grams}g</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Times Used</p>
            <p className="text-sm font-semibold">{container.times_used}</p>
          </div>
        </div>

        {/* Last Used / Verification */}
        <div className="text-xs text-gray-500 mb-3">
          {container.last_used_date ? (
            <p>Last used: {new Date(container.last_used_date).toLocaleDateString()}</p>
          ) : (
            <p>Never used</p>
          )}
          <p>Verified: {new Date(container.last_weighed_date).toLocaleDateString()}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-3 rounded text-sm font-medium transition-colors"
          >
            View Details
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              console.log('Print label for:', container.container_barcode)
            }}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

interface StatCardProps {
  title: string
  value: number
  color: 'blue' | 'green' | 'yellow' | 'orange' | 'red'
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-900',
    green: 'bg-green-50 text-green-900',
    yellow: 'bg-yellow-50 text-yellow-900',
    orange: 'bg-orange-50 text-orange-900',
    red: 'bg-red-50 text-red-900'
  }

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

const ContainersLoading: React.FC = () => {
  const skeletonItems = Array(12).fill(0)
  
  return (
    <div className={`grid gap-4 ${StockResponsiveUtils.ipadOptimized.cardGrid}`}>
      {skeletonItems.map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="h-3 bg-gray-300 rounded"></div>
            <div className="h-3 bg-gray-300 rounded"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  )
}

const EmptyState: React.FC<{ onCreateNew: () => void }> = ({ onCreateNew }) => {
  return (
    <div className="text-center py-12">
      <Package size={64} className="mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No containers yet</h3>
      <p className="text-gray-600 mb-6">
        Create your first container to start weight-based counting
      </p>
      
      <button
        onClick={onCreateNew}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
      >
        <Plus size={20} />
        Create First Container
      </button>
    </div>
  )
}

// ============================================================================
// PLACEHOLDER MODALS (TO BE IMPLEMENTED)
// ============================================================================

const CreateContainerModal: React.FC<{
  onClose: () => void
  onCreated: (container: ContainerInstance) => void
}> = ({ onClose, onCreated }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Container</h3>
        <p className="text-gray-600 mb-6">Container creation modal will be implemented next...</p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
            Create Container
          </button>
        </div>
      </div>
    </div>
  )
}

const ContainerDetailModal: React.FC<{
  container: ContainerInstance
  onClose: () => void
  onUpdated: (container: ContainerInstance) => void
}> = ({ container, onClose, onUpdated }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Container Details: {container.container_barcode}
        </h3>
        <p className="text-gray-600 mb-6">Container detail modal will be implemented next...</p>
        
        <button
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockContainers: ContainerInstance[] = [
  {
    id: '1',
    client_id: 'test-client',
    container_barcode: 'JIGR-C-00001',
    container_type_id: 'type-1',
    container_nickname: 'Rice Container A',
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
  {
    id: '2',
    client_id: 'test-client',
    container_barcode: 'JIGR-C-00002',
    container_type_id: 'type-1',
    container_nickname: 'Flour Container B',
    tare_weight_grams: 1200,
    last_weighed_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    needs_reweigh: true,
    verification_status: 'due_soon',
    times_used: 15,
    last_used_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
] as ContainerInstance[]

export default ContainerManagement