/**
 * JiGR Stock Items List - Advanced Inventory Management Interface
 * 
 * Feature-rich list component for managing inventory items with:
 * - Workflow-based filtering and grouping
 * - Advanced search and sorting
 * - Batch operations and bulk editing
 * - Real-time count status updates
 * - iPad-optimized touch interface
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Search,
  Filter,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Eye,
  Calculator,
  Scale,
  Wine,
  Beer,
  ChefHat,
  Package,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Grid,
  List as ListIcon,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { StockDesignTokens, getWorkflowStyles, StockResponsiveUtils, WorkflowConfig } from '../StockModuleCore'
import type { InventoryItem, CountingWorkflow } from '@/types/stock'

// ============================================================================
// TYPES
// ============================================================================

interface FilterState {
  search: string
  workflow: CountingWorkflow | 'all'
  category: string
  status: 'active' | 'inactive' | 'all'
  hasRecentCounts: boolean | 'all'
}

interface SortState {
  field: keyof InventoryItem | 'last_count_date' | 'quantity_on_hand'
  direction: 'asc' | 'desc'
}

type ViewMode = 'grid' | 'list'

// ============================================================================
// STOCK ITEMS LIST COMPONENT
// ============================================================================

export const StockItemsList: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    workflow: 'all',
    category: '',
    status: 'active',
    hasRecentCounts: 'all'
  })
  
  const [sort, setSort] = useState<SortState>({
    field: 'item_name',
    direction: 'asc'
  })

  // Load items data
  useEffect(() => {
    loadItems()
  }, [filters, sort])

  const loadItems = async () => {
    try {
      setIsLoading(true)
      
      // TODO: Replace with actual API call
      // For now, using mock data
      setTimeout(() => {
        setItems(mockInventoryItems)
        setIsLoading(false)
      }, 800)
    } catch (error) {
      console.error('Failed to load items:', error)
      setIsLoading(false)
    }
  }

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        if (!item.item_name.toLowerCase().includes(searchLower) &&
            !item.brand?.toLowerCase().includes(searchLower) &&
            !item.barcode?.toLowerCase().includes(searchLower)) {
          return false
        }
      }
      
      // Workflow filter
      if (filters.workflow !== 'all' && item.counting_workflow !== filters.workflow) {
        return false
      }
      
      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'active' && !item.is_active) return false
        if (filters.status === 'inactive' && item.is_active) return false
      }
      
      return true
    })

    // Sort items
    filtered.sort((a, b) => {
      const aValue = a[sort.field as keyof InventoryItem]
      const bValue = b[sort.field as keyof InventoryItem]
      
      const compareValue = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sort.direction === 'asc' ? compareValue : -compareValue
    })

    return filtered
  }, [items, filters, sort])

  // Group items by workflow for grid view
  const groupedItems = useMemo(() => {
    if (viewMode !== 'grid' || filters.workflow !== 'all') {
      return { all: filteredAndSortedItems }
    }

    return filteredAndSortedItems.reduce((groups, item) => {
      const workflow = item.counting_workflow || 'unit_count'
      if (!groups[workflow]) groups[workflow] = []
      groups[workflow].push(item)
      return groups
    }, {} as Record<string, InventoryItem[]>)
  }, [filteredAndSortedItems, viewMode, filters.workflow])

  const handleSelectItem = (itemId: string, selected: boolean) => {
    const newSelection = new Set(selectedItems)
    if (selected) {
      newSelection.add(itemId)
    } else {
      newSelection.delete(itemId)
    }
    setSelectedItems(newSelection)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(new Set(filteredAndSortedItems.map(item => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <ItemsHeader 
        selectedCount={selectedItems.size}
        totalCount={filteredAndSortedItems.length}
        onSelectAll={handleSelectAll}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Filters Bar */}
      <FiltersBar
        filters={filters}
        onFiltersChange={setFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        sort={sort}
        onSortChange={setSort}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <BulkActionsBar 
            selectedCount={selectedItems.size}
            onClearSelection={() => setSelectedItems(new Set())}
          />
        )}

        {/* Items Display */}
        {isLoading ? (
          <ItemsSkeleton viewMode={viewMode} />
        ) : (
          <ItemsDisplay
            groupedItems={groupedItems}
            viewMode={viewMode}
            selectedItems={selectedItems}
            onSelectItem={handleSelectItem}
            filters={filters}
          />
        )}

        {/* Empty State */}
        {!isLoading && filteredAndSortedItems.length === 0 && (
          <EmptyState filters={filters} onResetFilters={() => setFilters({
            search: '',
            workflow: 'all',
            category: '',
            status: 'active',
            hasRecentCounts: 'all'
          })} />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// ITEMS HEADER COMPONENT
// ============================================================================

interface ItemsHeaderProps {
  selectedCount: number
  totalCount: number
  onSelectAll: (selected: boolean) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

const ItemsHeader: React.FC<ItemsHeaderProps> = ({ 
  selectedCount, 
  totalCount, 
  onSelectAll,
  viewMode,
  onViewModeChange
}) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Items</h1>
              <p className="text-gray-600 mt-1">
                {totalCount} items total
                {selectedCount > 0 && (
                  <span className="ml-2">• {selectedCount} selected</span>
                )}
              </p>
            </div>

            {selectedCount > 0 && (
              <button
                onClick={() => onSelectAll(false)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Selection
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ListIcon size={20} />
              </button>
            </div>

            {/* Action Buttons */}
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Plus size={20} />
              Add Item
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
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  showFilters: boolean
  onToggleFilters: () => void
  sort: SortState
  onSortChange: (sort: SortState) => void
}

const FiltersBar: React.FC<FiltersBarProps> = ({ 
  filters, 
  onFiltersChange, 
  showFilters, 
  onToggleFilters,
  sort,
  onSortChange
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
              placeholder="Search items, brands, or barcodes..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className={`pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${StockResponsiveUtils.ipadOptimized.input}`}
            />
          </div>

          {/* Workflow Filter */}
          <select
            value={filters.workflow}
            onChange={(e) => onFiltersChange({ ...filters, workflow: e.target.value as CountingWorkflow | 'all' })}
            className={`border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${StockResponsiveUtils.ipadOptimized.input}`}
          >
            <option value="all">All Workflows</option>
            {Object.entries(WorkflowConfig).map(([value, config]) => (
              <option key={value} value={value}>{config.name}</option>
            ))}
          </select>

          {/* More Filters Toggle */}
          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white text-gray-700'
            }`}
          >
            <Filter size={20} />
            Filters
          </button>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select
              value={sort.field}
              onChange={(e) => onSortChange({ ...sort, field: e.target.value as any })}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="item_name">Name</option>
              <option value="counting_workflow">Workflow</option>
              <option value="category_id">Category</option>
              <option value="quantity_on_hand">Quantity</option>
              <option value="updated_at">Last Updated</option>
            </select>
            
            <button
              onClick={() => onSortChange({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sort.direction === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
            </button>
          </div>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.status}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as any })}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <input
              type="text"
              placeholder="Filter by category..."
              value={filters.category}
              onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={filters.hasRecentCounts.toString()}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                hasRecentCounts: e.target.value === 'all' ? 'all' : e.target.value === 'true' 
              })}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Any Count Status</option>
              <option value="true">Has Recent Counts</option>
              <option value="false">Needs Counting</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// BULK ACTIONS BAR
// ============================================================================

interface BulkActionsBarProps {
  selectedCount: number
  onClearSelection: () => void
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({ selectedCount, onClearSelection }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-blue-900 font-medium">{selectedCount} items selected</p>
          <button
            onClick={onClearSelection}
            className="text-blue-700 hover:text-blue-900"
          >
            Clear
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 px-4 py-2 rounded-lg font-medium transition-colors">
            Export
          </button>
          <button className="bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 px-4 py-2 rounded-lg font-medium transition-colors">
            Bulk Edit
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ITEMS DISPLAY COMPONENT
// ============================================================================

interface ItemsDisplayProps {
  groupedItems: Record<string, InventoryItem[]>
  viewMode: ViewMode
  selectedItems: Set<string>
  onSelectItem: (itemId: string, selected: boolean) => void
  filters: FilterState
}

const ItemsDisplay: React.FC<ItemsDisplayProps> = ({ 
  groupedItems, 
  viewMode, 
  selectedItems, 
  onSelectItem,
  filters
}) => {
  if (viewMode === 'list') {
    return <ListView items={groupedItems.all || []} selectedItems={selectedItems} onSelectItem={onSelectItem} />
  }

  return <GridView groupedItems={groupedItems} selectedItems={selectedItems} onSelectItem={onSelectItem} filters={filters} />
}

// ============================================================================
// GRID VIEW COMPONENT
// ============================================================================

interface GridViewProps {
  groupedItems: Record<string, InventoryItem[]>
  selectedItems: Set<string>
  onSelectItem: (itemId: string, selected: boolean) => void
  filters: FilterState
}

const GridView: React.FC<GridViewProps> = ({ groupedItems, selectedItems, onSelectItem, filters }) => {
  const shouldGroupByWorkflow = filters.workflow === 'all' && Object.keys(groupedItems).length > 1

  if (shouldGroupByWorkflow) {
    return (
      <div className="space-y-8">
        {Object.entries(groupedItems).map(([workflow, items]) => {
          if (items.length === 0) return null
          
          const config = WorkflowConfig[workflow as keyof typeof WorkflowConfig]
          const styles = getWorkflowStyles(workflow)
          
          return (
            <div key={workflow}>
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="p-2 rounded-lg text-white"
                  style={{ backgroundColor: styles.primary }}
                >
                  {getWorkflowIcon(config?.icon)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{config?.name}</h3>
                  <p className="text-sm text-gray-600">{items.length} items</p>
                </div>
              </div>
              
              <div className={`grid gap-4 ${StockResponsiveUtils.ipadOptimized.cardGrid}`}>
                {items.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.has(item.id)}
                    onSelect={onSelectItem}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Single group or filtered view
  const allItems = Object.values(groupedItems).flat()
  return (
    <div className={`grid gap-4 ${StockResponsiveUtils.ipadOptimized.cardGrid}`}>
      {allItems.map(item => (
        <ItemCard
          key={item.id}
          item={item}
          isSelected={selectedItems.has(item.id)}
          onSelect={onSelectItem}
        />
      ))}
    </div>
  )
}

// ============================================================================
// ITEM CARD COMPONENT
// ============================================================================

interface ItemCardProps {
  item: InventoryItem
  isSelected: boolean
  onSelect: (itemId: string, selected: boolean) => void
}

const ItemCard: React.FC<ItemCardProps> = ({ item, isSelected, onSelect }) => {
  const workflowStyles = getWorkflowStyles(item.counting_workflow)
  const config = WorkflowConfig[item.counting_workflow as keyof typeof WorkflowConfig]

  return (
    <div className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all ${
      isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
    }`}>
      
      {/* Selection Header */}
      <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(item.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <WorkflowBadge workflow={item.counting_workflow} />
          </div>
          
          <button className="p-1 hover:bg-gray-200 rounded">
            <MoreVertical size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        
        {/* Item Header */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 truncate" title={item.item_name}>
            {item.item_name}
          </h3>
          {item.brand && (
            <p className="text-sm text-gray-600 truncate">{item.brand}</p>
          )}
          {item.barcode && (
            <p className="text-xs text-gray-500 font-mono">{item.barcode}</p>
          )}
        </div>

        {/* Quantity & Status */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-600">Quantity</p>
            <p className="text-lg font-bold text-gray-900">
              {(item as any).quantity_on_hand || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Par Level</p>
            <p className="text-sm text-gray-700">
              {item.par_level_low} - {item.par_level_high}
            </p>
          </div>
        </div>

        {/* Last Count */}
        <div className="text-xs text-gray-500 mb-4">
          Last counted: {(item as any).count_date ? 
            new Date((item as any).count_date).toLocaleDateString() : 
            'Never'
          }
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button 
            className="flex-1 py-2 px-3 text-sm font-medium rounded transition-colors"
            style={{ 
              backgroundColor: workflowStyles.secondary, 
              color: workflowStyles.primary 
            }}
          >
            Count Now
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
            <Edit2 size={16} />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
            <Eye size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// LIST VIEW COMPONENT (Compact Table)
// ============================================================================

interface ListViewProps {
  items: InventoryItem[]
  selectedItems: Set<string>
  onSelectItem: (itemId: string, selected: boolean) => void
}

const ListView: React.FC<ListViewProps> = ({ items, selectedItems, onSelectItem }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Item</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Workflow</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Quantity</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Last Count</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map(item => (
              <ListViewRow
                key={item.id}
                item={item}
                isSelected={selectedItems.has(item.id)}
                onSelect={onSelectItem}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const ListViewRow: React.FC<ItemCardProps> = ({ item, isSelected, onSelect }) => {
  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(item.id, e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-gray-900">{item.item_name}</p>
          {item.brand && <p className="text-sm text-gray-600">{item.brand}</p>}
        </div>
      </td>
      <td className="px-4 py-3">
        <WorkflowBadge workflow={item.counting_workflow} />
      </td>
      <td className="px-4 py-3">
        <p className="font-medium">{(item as any).quantity_on_hand || 0}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-600">
          {(item as any).count_date ? 
            new Date((item as any).count_date).toLocaleDateString() : 
            'Never'
          }
        </p>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Count
          </button>
          <button className="text-gray-600 hover:text-gray-800">
            <Edit2 size={16} />
          </button>
          <button className="text-gray-600 hover:text-gray-800">
            <MoreVertical size={16} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const WorkflowBadge: React.FC<{ workflow: string }> = ({ workflow }) => {
  const config = WorkflowConfig[workflow as keyof typeof WorkflowConfig]
  const styles = getWorkflowStyles(workflow)
  
  return (
    <span 
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
      style={{ 
        backgroundColor: styles.secondary, 
        color: styles.primary 
      }}
    >
      {getWorkflowIcon(config?.icon, 14)}
      {config?.name || workflow}
    </span>
  )
}

const getWorkflowIcon = (iconName: string, size: number = 16) => {
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

const ItemsSkeleton: React.FC<{ viewMode: ViewMode }> = ({ viewMode }) => {
  const skeletonItems = Array(12).fill(0)
  
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 space-y-4">
          {skeletonItems.slice(0, 8).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="flex-1 h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`grid gap-4 ${StockResponsiveUtils.ipadOptimized.cardGrid}`}>
      {skeletonItems.map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

const EmptyState: React.FC<{ filters: FilterState; onResetFilters: () => void }> = ({ filters, onResetFilters }) => {
  const hasActiveFilters = filters.search || filters.workflow !== 'all' || filters.status !== 'active'
  
  return (
    <div className="text-center py-12">
      <Package size={64} className="mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {hasActiveFilters ? 'No items match your filters' : 'No inventory items yet'}
      </h3>
      <p className="text-gray-600 mb-6">
        {hasActiveFilters 
          ? 'Try adjusting your search terms or filters'
          : 'Get started by adding your first inventory item'
        }
      </p>
      
      <div className="flex justify-center gap-3">
        {hasActiveFilters ? (
          <button
            onClick={onResetFilters}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Reset Filters
          </button>
        ) : (
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
            <Plus size={20} />
            Add First Item
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MOCK DATA (TODO: Replace with API integration)
// ============================================================================

const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    client_id: 'test-client',
    category_id: 'cat-1',
    item_name: 'Bulk Rice (Jasmine)',
    brand: 'Golden Grain',
    barcode: '1234567890123',
    recipe_unit: 'kg',
    count_unit: 'kg',
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
  },
  // Add more mock items here...
] as InventoryItem[]

export default StockItemsList