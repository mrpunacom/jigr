'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
// Removed Lucide React imports - using Tabler icons via CSS classes
import { DataTable } from '@/app/components/DataTable'
import { StockLevelIndicator } from '@/app/components/StockLevelIndicator'

interface InventoryItem {
  id: string
  item_name: string
  barcode?: string
  category: string
  brand?: string
  supplier?: string
  location: string
  current_stock: number
  par_level_low: number
  par_level_high: number
  count_unit: string
  cost_per_unit: number
  total_value: number
  last_count_date?: string
  last_movement_date?: string
  status: 'normal' | 'low' | 'critical' | 'overstock'
  movement_trend: 'up' | 'down' | 'stable'
  expiry_date?: string
  days_until_expiry?: number
  created_at: string
  updated_at: string
}

interface FilterOptions {
  categories: string[]
  locations: string[]
  suppliers: string[]
  brands: string[]
}

interface InventoryFilters {
  search: string
  category: string
  location: string
  supplier: string
  brand: string
  status: string
  movement_trend: string
  expiry_filter: string
  value_range: [number, number]
  stock_range: [number, number]
}

interface SortConfig {
  field: keyof InventoryItem
  direction: 'asc' | 'desc'
}

interface InventoryManagementProps {
  className?: string
}

export function InventoryManagement({ className = '' }: InventoryManagementProps) {
  const router = useRouter()
  
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    locations: [],
    suppliers: [],
    brands: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filter and sort state
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    category: 'all',
    location: 'all',
    supplier: 'all',
    brand: 'all',
    status: 'all',
    movement_trend: 'all',
    expiry_filter: 'all',
    value_range: [0, 10000],
    stock_range: [0, 1000]
  })
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'item_name',
    direction: 'asc'
  })
  
  const [showFilters, setShowFilters] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  useEffect(() => {
    loadInventoryData()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [items, filters, sortConfig])

  const loadInventoryData = async (showLoader = false) => {
    try {
      if (showLoader) setRefreshing(true)
      
      const response = await fetch('/api/stock/items?include_metadata=true&include_trends=true')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setItems(data.items || [])
      
      // Extract filter options
      const categories = [...new Set(data.items.map((item: InventoryItem) => item.category))].filter(Boolean)
      const locations = [...new Set(data.items.map((item: InventoryItem) => item.location))].filter(Boolean)
      const suppliers = [...new Set(data.items.map((item: InventoryItem) => item.supplier))].filter(Boolean)
      const brands = [...new Set(data.items.map((item: InventoryItem) => item.brand))].filter(Boolean)
      
      setFilterOptions({
        categories: categories.sort(),
        locations: locations.sort(),
        suppliers: suppliers.sort(),
        brands: brands.sort()
      })
      
      setError(null)
    } catch (error) {
      console.error('Failed to load inventory:', error)
      setError('Failed to load inventory data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...items]
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(item => 
        item.item_name.toLowerCase().includes(searchLower) ||
        item.barcode?.includes(filters.search) ||
        item.brand?.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(item => item.category === filters.category)
    }
    
    // Apply location filter
    if (filters.location !== 'all') {
      filtered = filtered.filter(item => item.location === filters.location)
    }
    
    // Apply supplier filter
    if (filters.supplier !== 'all') {
      filtered = filtered.filter(item => item.supplier === filters.supplier)
    }
    
    // Apply brand filter
    if (filters.brand !== 'all') {
      filtered = filtered.filter(item => item.brand === filters.brand)
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status)
    }
    
    // Apply movement trend filter
    if (filters.movement_trend !== 'all') {
      filtered = filtered.filter(item => item.movement_trend === filters.movement_trend)
    }
    
    // Apply expiry filter
    if (filters.expiry_filter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(item => {
        if (!item.expiry_date) return filters.expiry_filter === 'no_expiry'
        
        const expiryDate = new Date(item.expiry_date)
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        switch (filters.expiry_filter) {
          case 'expired': return daysUntilExpiry <= 0
          case 'expiring_soon': return daysUntilExpiry > 0 && daysUntilExpiry <= 7
          case 'expiring_month': return daysUntilExpiry > 7 && daysUntilExpiry <= 30
          case 'no_expiry': return !item.expiry_date
          default: return true
        }
      })
    }
    
    // Apply value range filter
    filtered = filtered.filter(item => 
      item.total_value >= filters.value_range[0] && 
      item.total_value <= filters.value_range[1]
    )
    
    // Apply stock range filter
    filtered = filtered.filter(item => 
      item.current_stock >= filters.stock_range[0] && 
      item.current_stock <= filters.stock_range[1]
    )
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.field]
      const bValue = b[sortConfig.field]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue
      }
      
      return 0
    })
    
    setFilteredItems(filtered)
  }

  const handleSort = (field: keyof InventoryItem) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      location: 'all',
      supplier: 'all',
      brand: 'all',
      status: 'all',
      movement_trend: 'all',
      expiry_filter: 'all',
      value_range: [0, 10000],
      stock_range: [0, 1000]
    })
  }

  const handleItemAction = (action: string, itemId: string) => {
    switch (action) {
      case 'view':
        router.push(`/stock/items/${itemId}`)
        break
      case 'edit':
        router.push(`/stock/items/${itemId}/edit`)
        break
      case 'count':
        router.push(`/scan?workflow=inventory_count&item=${itemId}`)
        break
      case 'scan':
        router.push(`/scan?workflow=lookup&focus=${itemId}`)
        break
    }
  }

  const handleBulkAction = (action: string) => {
    if (selectedItems.length === 0) return
    
    switch (action) {
      case 'bulk_count':
        const itemParams = selectedItems.map(id => `items=${id}`).join('&')
        router.push(`/stock/count/bulk?${itemParams}`)
        break
      case 'bulk_edit':
        router.push(`/stock/items/bulk-edit?ids=${selectedItems.join(',')}`)
        break
      case 'export':
        exportSelectedItems()
        break
    }
  }

  const exportSelectedItems = async () => {
    try {
      const response = await fetch('/api/stock/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_ids: selectedItems.length > 0 ? selectedItems : undefined,
          filters: filters,
          format: 'csv'
        })
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  const getStatusIcon = (status: string) => {
    const iconClass = "h-4 w-4"
    switch (status) {
      case 'critical': return <span className={`icon-[tabler--alert-triangle] ${iconClass} text-red-500`}></span>
      case 'low': return <span className={`icon-[tabler--alert-triangle] ${iconClass} text-amber-500`}></span>
      case 'overstock': return <span className={`icon-[tabler--trending-up] ${iconClass} text-blue-500`}></span>
      default: return <span className={`icon-[tabler--circle-check] ${iconClass} text-green-500`}></span>
    }
  }

  const getTrendIcon = (trend: string) => {
    const iconClass = "h-3 w-3"
    switch (trend) {
      case 'up': return <span className={`icon-[tabler--trending-up] ${iconClass} text-green-500`}></span>
      case 'down': return <span className={`icon-[tabler--trending-down] ${iconClass} text-red-500`}></span>
      default: return <div className={`${iconClass} w-3 h-3 bg-gray-300 rounded-full`} />
    }
  }

  const inventoryColumns = [
    {
      key: 'item_name' as keyof InventoryItem,
      label: 'Item Details',
      sortable: true,
      render: (value: string, item: InventoryItem) => (
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{value}</span>
            {getTrendIcon(item.movement_trend)}
          </div>
          <div className="text-xs text-gray-500 space-y-0.5">
            <div>{item.category} • {item.brand}</div>
            {item.barcode && <div className="font-mono">#{item.barcode}</div>}
          </div>
        </div>
      )
    },
    {
      key: 'current_stock' as keyof InventoryItem,
      label: 'Stock Level',
      sortable: true,
      render: (value: number, item: InventoryItem) => (
        <div className="space-y-1">
          <StockLevelIndicator
            current={value}
            parLow={item.par_level_low}
            parHigh={item.par_level_high}
            unit={item.count_unit}
            showText={true}
          />
          <div className="flex items-center space-x-1">
            {getStatusIcon(item.status)}
            <span className="text-xs text-gray-500">{item.status}</span>
          </div>
        </div>
      )
    },
    {
      key: 'location' as keyof InventoryItem,
      label: 'Location',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <span className="icon-[tabler--map-pin] h-3 w-3 text-gray-400"></span>
          <span className="text-sm text-gray-700">{value}</span>
        </div>
      )
    },
    {
      key: 'total_value' as keyof InventoryItem,
      label: 'Value',
      sortable: true,
      render: (value: number, item: InventoryItem) => (
        <div>
          <div className="font-medium">${value.toFixed(2)}</div>
          <div className="text-xs text-gray-500">
            ${item.cost_per_unit.toFixed(2)}/{item.count_unit}
          </div>
        </div>
      )
    },
    {
      key: 'last_count_date' as keyof InventoryItem,
      label: 'Last Count',
      sortable: true,
      render: (value: string | undefined) => (
        <div className="text-sm">
          {value ? (
            <div>
              <div>{new Date(value).toLocaleDateString()}</div>
              <div className="text-xs text-gray-500">
                {Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24))} days ago
              </div>
            </div>
          ) : (
            <span className="text-gray-400 italic">Never</span>
          )}
        </div>
      )
    },
    {
      key: 'id' as keyof InventoryItem,
      label: 'Actions',
      render: (value: string, item: InventoryItem) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleItemAction('view', value)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="View Details"
          >
            <span className="icon-[tabler--eye] h-4 w-4"></span>
          </button>
          <button
            onClick={() => handleItemAction('count', value)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
            title="Count Item"
          >
            <span className="icon-[tabler--scan] h-4 w-4"></span>
          </button>
          <button
            onClick={() => handleItemAction('edit', value)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            title="Edit Item"
          >
            <span className="icon-[tabler--edit] h-4 w-4"></span>
          </button>
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">
            {filteredItems.length} of {items.length} items
            {selectedItems.length > 0 && ` • ${selectedItems.length} selected`}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => loadInventoryData(true)}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            title="Refresh"
          >
            <span className={`icon-[tabler--refresh] h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}></span>
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="icon-[tabler--filter] h-4 w-4"></span>
            <span>Filters</span>
          </button>
          
          <button
            onClick={() => router.push('/stock/items/new')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <span className="icon-[tabler--plus] h-4 w-4"></span>
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <span className="icon-[tabler--x] h-4 w-4"></span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <span className="icon-[tabler--search] absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"></span>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {filterOptions.categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Locations</option>
                {filterOptions.locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="normal">Normal</option>
                <option value="low">Low Stock</option>
                <option value="critical">Critical</option>
                <option value="overstock">Overstock</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select
                value={filters.supplier}
                onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Suppliers</option>
                {filterOptions.suppliers.map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Movement Trend</label>
              <select
                value={filters.movement_trend}
                onChange={(e) => setFilters(prev => ({ ...prev, movement_trend: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Trends</option>
                <option value="up">Trending Up</option>
                <option value="down">Trending Down</option>
                <option value="stable">Stable</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
              <select
                value={filters.expiry_filter}
                onChange={(e) => setFilters(prev => ({ ...prev, expiry_filter: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Items</option>
                <option value="expired">Expired</option>
                <option value="expiring_soon">Expiring Soon (7 days)</option>
                <option value="expiring_month">Expiring This Month</option>
                <option value="no_expiry">No Expiry Date</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedItems.length} items selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('bulk_count')}
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                Count Selected
              </button>
              <button
                onClick={() => handleBulkAction('bulk_edit')}
                className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
              >
                Edit Selected
              </button>
              <button
                onClick={() => handleBulkAction('export')}
                className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
              >
                Export
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={inventoryColumns}
          data={filteredItems}
          emptyMessage="No inventory items found"
          onSort={handleSort}
          sortConfig={sortConfig}
          selectable={true}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          pagination={{
            pageSize: 50,
            showSizeSelector: true
          }}
        />
      </div>

      {/* Quick Actions Footer */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4 bg-white border border-gray-200 rounded-lg px-6 py-3">
          <button
            onClick={() => router.push('/scan?workflow=lookup')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <span className="icon-[tabler--scan] h-4 w-4"></span>
            <span>Scan Item</span>
          </button>
          
          <div className="w-px h-4 bg-gray-300"></div>
          
          <button
            onClick={exportSelectedItems}
            className="flex items-center space-x-2 text-green-600 hover:text-green-800"
          >
            <span className="icon-[tabler--download] h-4 w-4"></span>
            <span>Export All</span>
          </button>
          
          <div className="w-px h-4 bg-gray-300"></div>
          
          <button
            onClick={() => router.push('/stock/import')}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800"
          >
            <span className="icon-[tabler--upload] h-4 w-4"></span>
            <span>Import Items</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="icon-[tabler--alert-triangle] h-5 w-5"></span>
            <span>{error}</span>
            <button 
              onClick={() => loadInventoryData(true)}
              className="ml-auto text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}