'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { ModuleCard } from '@/app/components/ModuleCard'
import { SearchInput } from '@/app/components/SearchInput'
import { DataTable } from '@/app/components/DataTable'
import { StockLevelIndicator } from '@/app/components/StockLevelIndicator'
import { InventoryItem, StockFilterOptions } from '@/types/InventoryTypes'
import { Plus, Filter, Grid, List, MoreHorizontal, Eye, Edit, Clipboard, Upload } from 'lucide-react'
import { UniversalImport, ImportConfig } from '@/app/components/UniversalImport'

const ITEMS_PER_PAGE = 20

export default function StockItemsPage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<StockFilterOptions>({
    search: '',
    category: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [currentPage, setCurrentPage] = useState(1)
  const [showImportModal, setShowImportModal] = useState(false)


  useEffect(() => {
    loadItems()
    loadCategories()
  }, [filters, currentPage])

  const loadCategories = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const { data, error } = await supabase
        .from('inventory_categories')
        .select('id, name')
        .eq('client_id', session.user.id)
        .eq('is_active', true)
        .order('name')

      if (error) {
        // Check if table doesn't exist - this is expected during development
        if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
          console.warn('Inventory categories table not yet created - using empty categories list')
          setCategories([])
          return
        }
        throw error
      }
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      // Fallback to empty categories list if there's any error
      setCategories([])
    }
  }

  const loadItems = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login')
        return
      }

      // Build query with filters
      let query = supabase
        .from('inventory_items')
        .select(`
          *,
          inventory_categories!left(name),
          inventory_count!left(
            quantity_on_hand,
            count_date,
            counted_by
          )
        `)
        .eq('client_id', session.user.id)

      // Apply filters
      if (filters.search) {
        query = query.or(`item_name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`)
      }
      
      if (filters.category) {
        query = query.eq('category_id', filters.category)
      }
      
      if (filters.status !== 'all') {
        switch (filters.status) {
          case 'active':
            query = query.eq('is_active', true)
            break
          case 'inactive':
            query = query.eq('is_active', false)
            break
          // Note: low_stock and out_of_stock filters will be applied client-side
          // since they depend on current stock levels vs par levels
        }
      }

      // Apply sorting
      const sortColumn = filters.sortBy === 'name' ? 'item_name' : 
                        filters.sortBy === 'category' ? 'category_id' :
                        filters.sortBy === 'last_counted' ? 'updated_at' : 'item_name'
      
      query = query.order(sortColumn, { ascending: filters.sortOrder === 'asc' })

      const { data, error } = await query

      if (error) {
        // Check if inventory tables don't exist - this is expected during development
        if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
          console.warn('Inventory tables not yet created - using empty items list')
          setItems([])
          setError('Inventory system not yet set up. Database tables need to be created.')
          return
        }
        throw error
      }

      // Process the data to include latest count info
      const processedItems = data?.map(item => ({
        ...item,
        category_name: item.inventory_categories?.name,
        // Get the most recent count
        quantity_on_hand: item.inventory_count?.[0]?.quantity_on_hand || 0,
        count_date: item.inventory_count?.[0]?.count_date,
        counted_by: item.inventory_count?.[0]?.counted_by
      })) || []

      // Apply client-side filters for stock levels
      let filteredItems = processedItems
      if (filters.status === 'low_stock') {
        filteredItems = processedItems.filter(item => 
          item.par_level_low && item.quantity_on_hand && item.quantity_on_hand < item.par_level_low
        )
      } else if (filters.status === 'out_of_stock') {
        filteredItems = processedItems.filter(item => 
          !item.quantity_on_hand || item.quantity_on_hand === 0
        )
      }

      setItems(filteredItems)
      setError(null)
    } catch (error) {
      console.error('Error loading items:', error)
      setError('Failed to load inventory items. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof StockFilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const handleItemClick = (itemId: string) => {
    router.push(`/stock/items/${itemId}`)
  }

  const handleCountItem = (itemId: string, itemName: string) => {
    router.push(`/count/new?item_id=${itemId}&item_name=${encodeURIComponent(itemName)}`)
  }

  // Table columns configuration
  const tableColumns = [
    {
      key: 'item_name' as keyof InventoryItem,
      label: 'Item Name',
      sortable: true,
      render: (value: string, item: InventoryItem) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{value}</span>
          {item.brand && <span className="text-sm text-gray-500">{item.brand}</span>}
        </div>
      )
    },
    {
      key: 'category_name' as keyof InventoryItem,
      label: 'Category',
      sortable: true,
      render: (value: string) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {value || 'Uncategorized'}
        </span>
      )
    },
    {
      key: 'quantity_on_hand' as keyof InventoryItem,
      label: 'Stock Level',
      render: (value: number, item: InventoryItem) => (
        <StockLevelIndicator
          current={value || 0}
          parLow={item.par_level_low || null}
          parHigh={item.par_level_high || null}
          unit={item.count_unit}
        />
      )
    },
    {
      key: 'count_date' as keyof InventoryItem,
      label: 'Last Counted',
      render: (value: string) => value ? new Date(value).toLocaleDateString() : 'Never'
    },
    {
      key: 'id' as keyof InventoryItem,
      label: 'Actions',
      render: (value: string, item: InventoryItem) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleItemClick(value)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="View Details"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleCountItem(value, item.item_name)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
            title="Count This Item"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <Clipboard className="h-4 w-4" />
          </button>
          <button
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            title="More Options"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  // Import configuration for inventory items
  const importConfig: ImportConfig = {
    entityName: 'Inventory Items',
    fields: [
      {
        key: 'item_name',
        label: 'Item Name',
        required: true,
        type: 'string'
      },
      {
        key: 'brand',
        label: 'Brand',
        type: 'string'
      },
      {
        key: 'category_name',
        label: 'Category',
        type: 'string'
      },
      {
        key: 'count_unit',
        label: 'Count Unit',
        required: true,
        type: 'string'
      },
      {
        key: 'par_level_low',
        label: 'Par Level Low',
        type: 'number'
      },
      {
        key: 'par_level_high',
        label: 'Par Level High',
        type: 'number'
      }
    ],
    sampleData: [
      {
        item_name: 'Flour - Plain',
        brand: 'Champion',
        category_name: 'Dry Goods',
        count_unit: 'kg',
        par_level_low: 10,
        par_level_high: 50
      },
      {
        item_name: 'Chicken Breast',
        brand: 'Fresh Farm',
        category_name: 'Fresh Meat',
        count_unit: 'kg',
        par_level_low: 5,
        par_level_high: 20
      }
    ]
  }

  // Handle import of inventory items
  const handleImport = async (data: any[]): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        alert('You must be logged in to import items')
        return false
      }

      // Transform data to match database schema
      const itemsToInsert = data.map(item => ({
        item_name: item.item_name,
        brand: item.brand || null,
        count_unit: item.count_unit,
        par_level_low: item.par_level_low || null,
        par_level_high: item.par_level_high || null,
        client_id: session.user.id,
        is_active: true,
        // Note: category_id would need to be resolved from category_name
        // For now, we'll leave it null and handle category creation separately
        category_id: null
      }))

      const { data: insertedData, error } = await supabase
        .from('inventory_items')
        .insert(itemsToInsert)

      if (error) {
        console.error('Import error:', error)
        alert(`Import failed: ${error.message}`)
        return false
      }

      // Refresh the items list
      await loadItems()
      return true
    } catch (error) {
      console.error('Import error:', error)
      alert('Import failed. Please try again.')
      return false
    }
  }

  return (
    <StandardPageWrapper moduleName="stock" currentPage="items">
      <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Inventory Items</h1>
              <p className="mt-1 text-sm text-gray-300">
                Manage your inventory stock levels and items
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                style={{ minHeight: '48px' }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Items
              </button>
              <button
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                style={{ minHeight: '48px' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <ModuleCard theme="light" className="p-6">
            <div className="space-y-4 lg:space-y-0 lg:flex lg:items-end lg:space-x-4">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search items by name or brand..."
                  value={filters.search || ''}
                  onChange={(value) => handleFilterChange('search', value)}
                />
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90"
                    style={{ minHeight: '48px' }}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status || 'all'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90"
                    style={{ minHeight: '48px' }}
                  >
                    <option value="all">All Items</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy || 'name'}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90"
                    style={{ minHeight: '48px' }}
                  >
                    <option value="name">Name</option>
                    <option value="category">Category</option>
                    <option value="stock_level">Stock Level</option>
                    <option value="last_counted">Last Counted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    View
                  </label>
                  <div className="flex rounded-lg border border-gray-300 bg-white/90">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-l-lg ${
                        viewMode === 'list' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      style={{ minHeight: '48px' }}
                    >
                      <List className="h-4 w-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-r-lg ${
                        viewMode === 'grid' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      style={{ minHeight: '48px' }}
                    >
                      <Grid className="h-4 w-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ModuleCard>

          {/* Content */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {viewMode === 'list' ? (
            <DataTable
              columns={tableColumns}
              data={items}
              loading={loading}
              pagination={{
                pageSize: ITEMS_PER_PAGE,
                currentPage,
                onPageChange: setCurrentPage
              }}
              emptyMessage="No inventory items found. Try adjusting your filters or add your first item."
            />
          ) : (
            <ModuleCard theme="light" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 h-32 rounded-lg"></div>
                    </div>
                  ))
                ) : items.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    No inventory items found. Try adjusting your filters or add your first item.
                  </div>
                ) : (
                  items.map((item) => (
                    <ModuleCard
                      key={item.id}
                      className="p-4"
                      hover
                      onClick={() => handleItemClick(item.id)}
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">{item.item_name}</h3>
                          {item.brand && (
                            <p className="text-xs text-gray-500">{item.brand}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {item.category_name || 'Uncategorized'}
                          </span>
                          <StockLevelIndicator
                            current={item.quantity_on_hand || 0}
                            parLow={item.par_level_low || null}
                            parHigh={item.par_level_high || null}
                            unit={item.count_unit}
                            showText={false}
                          />
                        </div>

                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCountItem(item.id, item.item_name)
                            }}
                            className="flex-1 px-2 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100"
                            style={{ minHeight: '32px' }}
                          >
                            Count
                          </button>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100"
                            style={{ minHeight: '32px', minWidth: '32px' }}
                          >
                            <MoreHorizontal className="h-3 w-3 mx-auto" />
                          </button>
                        </div>
                      </div>
                    </ModuleCard>
                  ))
                )}
              </div>
            </ModuleCard>
          )}
      </div>

      {/* Import Modal */}
      <UniversalImport
        config={importConfig}
        onImport={handleImport}
        onClose={() => setShowImportModal(false)}
        isOpen={showImportModal}
      />
    </StandardPageWrapper>
  )
}