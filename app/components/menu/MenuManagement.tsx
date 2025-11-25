'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/app/components/DataTable'
import { MetricCard } from '@/app/components/MetricCard'

interface MenuItem {
  id: string
  name: string
  description?: string
  category: string
  price: number
  food_cost: number
  food_cost_percentage: number
  profit_margin: number
  popularity_score: number
  preparation_time: number
  difficulty: 'easy' | 'medium' | 'hard'
  dietary_restrictions: string[]
  allergens: string[]
  is_available: boolean
  is_featured: boolean
  image_url?: string
  recipe_id?: string
  created_at: string
  updated_at: string
  last_ordered?: string
  total_orders: number
  revenue_generated: number
  profit_generated: number
  ingredients_count: number
}

interface MenuStats {
  totalItems: number
  averageMargin: number
  totalRevenue: number
  topPerformers: number
  lowMarginItems: number
  outOfStockItems: number
  featuredItems: number
  avgPreparationTime: number
}

interface MenuManagementProps {
  className?: string
}

export function MenuManagement({ className = '' }: MenuManagementProps) {
  const router = useRouter()
  
  const [items, setItems] = useState<MenuItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([])
  const [stats, setStats] = useState<MenuStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all')
  const [marginFilter, setMarginFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<{ field: keyof MenuItem; direction: 'asc' | 'desc' }>({
    field: 'popularity_score',
    direction: 'desc'
  })

  useEffect(() => {
    loadMenuData()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [items, searchQuery, categoryFilter, availabilityFilter, marginFilter, difficultyFilter, sortConfig])

  const loadMenuData = async (showLoader = false) => {
    try {
      if (showLoader) setRefreshing(true)
      
      const [menuRes, statsRes] = await Promise.all([
        fetch('/api/menu/items?include_analytics=true'),
        fetch('/api/menu/analytics')
      ])

      if (!menuRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch menu data')
      }

      const [menuData, statsData] = await Promise.all([
        menuRes.json(),
        statsRes.json()
      ])

      setItems(menuData.items || [])
      setStats(statsData)
      setError(null)
      
    } catch (error) {
      console.error('Failed to load menu data:', error)
      setError('Failed to load menu data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...items]
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      )
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter)
    }
    
    // Availability filter
    if (availabilityFilter !== 'all') {
      if (availabilityFilter === 'available') {
        filtered = filtered.filter(item => item.is_available)
      } else if (availabilityFilter === 'unavailable') {
        filtered = filtered.filter(item => !item.is_available)
      } else if (availabilityFilter === 'featured') {
        filtered = filtered.filter(item => item.is_featured)
      }
    }
    
    // Margin filter
    if (marginFilter !== 'all') {
      filtered = filtered.filter(item => {
        switch (marginFilter) {
          case 'high': return item.profit_margin >= 60
          case 'medium': return item.profit_margin >= 40 && item.profit_margin < 60
          case 'low': return item.profit_margin < 40
          default: return true
        }
      })
    }
    
    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(item => item.difficulty === difficultyFilter)
    }
    
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

  const handleItemAction = (action: string, itemId: string) => {
    const item = items.find(i => i.id === itemId)
    
    switch (action) {
      case 'view':
        router.push(`/menu/items/${itemId}`)
        break
      case 'edit':
        router.push(`/menu/items/${itemId}/edit`)
        break
      case 'duplicate':
        duplicateMenuItem(itemId)
        break
      case 'recipe':
        if (item?.recipe_id) {
          router.push(`/recipes/${item.recipe_id}`)
        }
        break
      case 'analytics':
        router.push(`/menu/analytics/${itemId}`)
        break
    }
  }

  const duplicateMenuItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/menu/items/${itemId}/duplicate`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to duplicate item')
      
      await loadMenuData(true)
    } catch (error) {
      console.error('Failed to duplicate menu item:', error)
      alert('Failed to duplicate menu item')
    }
  }

  const getMarginColor = (margin: number) => {
    if (margin >= 60) return 'text-green-600'
    if (margin >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMarginLabel = (margin: number) => {
    if (margin >= 60) return 'High'
    if (margin >= 40) return 'Medium'
    return 'Low'
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPopularityStars = (score: number) => {
    const stars = Math.round(score / 20) // Convert 0-100 to 0-5 stars
    return Array.from({ length: 5 }).map((_, index) => (
      <span
        key={index}
        className={`icon-[tabler--star] h-3 w-3 ${
          index < stars ? 'text-yellow-400' : 'text-gray-300'
        }`}
      ></span>
    ))
  }

  const menuColumns = [
    {
      key: 'name' as keyof MenuItem,
      label: 'Menu Item',
      sortable: true,
      render: (value: string, item: MenuItem) => (
        <div className="flex items-center space-x-3">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={value}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="icon-[tabler--tools-kitchen] h-6 w-6 text-gray-400"></span>
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{value}</span>
              {item.is_featured && (
                <span className="icon-[tabler--star] h-4 w-4 text-yellow-500"></span>
              )}
              {!item.is_available && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  Out of Stock
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {item.category}
              {item.description && (
                <div className="text-xs mt-1 max-w-xs truncate">
                  {item.description}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'price' as keyof MenuItem,
      label: 'Pricing',
      sortable: true,
      render: (value: number, item: MenuItem) => (
        <div className="space-y-1">
          <div className="font-medium text-lg">${value.toFixed(2)}</div>
          <div className="text-sm text-gray-500">
            Cost: ${item.food_cost.toFixed(2)} ({item.food_cost_percentage.toFixed(1)}%)
          </div>
          <div className={`text-sm font-medium ${getMarginColor(item.profit_margin)}`}>
            {item.profit_margin.toFixed(1)}% margin ({getMarginLabel(item.profit_margin)})
          </div>
        </div>
      )
    },
    {
      key: 'popularity_score' as keyof MenuItem,
      label: 'Performance',
      sortable: true,
      render: (value: number, item: MenuItem) => (
        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            {getPopularityStars(value)}
            <span className="text-sm text-gray-500 ml-2">({value.toFixed(0)})</span>
          </div>
          <div className="text-sm text-gray-600">
            {item.total_orders} orders
          </div>
          <div className="text-sm text-green-600 font-medium">
            ${item.revenue_generated.toLocaleString()} revenue
          </div>
        </div>
      )
    },
    {
      key: 'preparation_time' as keyof MenuItem,
      label: 'Details',
      sortable: true,
      render: (value: number, item: MenuItem) => (
        <div className="space-y-2">
          <div className="flex items-center space-x-1 text-sm">
            <span className="icon-[tabler--clock] h-3 w-3 text-gray-400"></span>
            <span>{value} min</span>
          </div>
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(item.difficulty)}`}>
            {item.difficulty}
          </span>
          <div className="text-xs text-gray-500">
            {item.ingredients_count} ingredients
          </div>
        </div>
      )
    },
    {
      key: 'id' as keyof MenuItem,
      label: 'Actions',
      render: (value: string, item: MenuItem) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleItemAction('view', value)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="View Details"
          >
            <span className="icon-[tabler--eye] h-4 w-4"></span>
          </button>
          <button
            onClick={() => handleItemAction('edit', value)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            title="Edit Item"
          >
            <span className="icon-[tabler--edit] h-4 w-4"></span>
          </button>
          <button
            onClick={() => handleItemAction('duplicate', value)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
            title="Duplicate Item"
          >
            <span className="icon-[tabler--copy] h-4 w-4"></span>
          </button>
          <button
            onClick={() => handleItemAction('analytics', value)}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
            title="View Analytics"
          >
            <span className="icon-[tabler--chart-bar] h-4 w-4"></span>
          </button>
        </div>
      )
    }
  ]

  const categories = Array.from(new Set(items.map(item => item.category))).sort()

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600">
            {filteredItems.length} of {items.length} items
            {selectedItems.length > 0 && ` • ${selectedItems.length} selected`}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => loadMenuData(true)}
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
            onClick={() => router.push('/menu/engineering')}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <span className="icon-[tabler--calculator] h-4 w-4"></span>
            <span>Menu Engineering</span>
          </button>
          
          <button
            onClick={() => router.push('/menu/items/new')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <span className="icon-[tabler--plus] h-4 w-4"></span>
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Menu Items"
            value={stats.totalItems.toString()}
            subtitle={`${stats.featuredItems} featured`}
            icon={() => <span className="icon-[tabler--chef-hat]"></span>}
            theme="white"
          />
          <MetricCard
            title="Average Margin"
            value={`${stats.averageMargin.toFixed(1)}%`}
            subtitle={`${stats.lowMarginItems} items under 40%`}
            icon={() => <span className="icon-[tabler--percentage]"></span>}
            theme="white"
            className={stats.averageMargin < 50 ? 'border-amber-200 bg-amber-50' : ''}
          />
          <MetricCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            subtitle="This month"
            icon={() => <span className="icon-[tabler--currency-dollar]"></span>}
            theme="white"
          />
          <MetricCard
            title="Avg Prep Time"
            value={`${stats.avgPreparationTime.toFixed(1)} min`}
            subtitle={`${stats.topPerformers} top performers`}
            icon={() => <span className="icon-[tabler--clock]"></span>}
            theme="white"
          />
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => {
                setSearchQuery('')
                setCategoryFilter('all')
                setAvailabilityFilter('all')
                setMarginFilter('all')
                setDifficultyFilter('all')
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <span className="icon-[tabler--search] absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"></span>
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Items</option>
                <option value="available">Available Only</option>
                <option value="unavailable">Out of Stock</option>
                <option value="featured">Featured Items</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Margin</label>
              <select
                value={marginFilter}
                onChange={(e) => setMarginFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Margins</option>
                <option value="high">High (60%+)</option>
                <option value="medium">Medium (40-60%)</option>
                <option value="low">Low (Under 40%)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={menuColumns}
          data={filteredItems}
          emptyMessage="No menu items found"
          selectable={true}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          pagination={{
            pageSize: 25,
            showSizeSelector: true
          }}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4 bg-white border border-gray-200 rounded-lg px-6 py-3">
          <button
            onClick={() => router.push('/menu/import')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <span className="icon-[tabler--upload] h-4 w-4"></span>
            <span>Import Menu</span>
          </button>
          
          <div className="w-px h-4 bg-gray-300"></div>
          
          <button
            onClick={() => {/* Export menu */}}
            className="flex items-center space-x-2 text-green-600 hover:text-green-800"
          >
            <span className="icon-[tabler--download] h-4 w-4"></span>
            <span>Export</span>
          </button>
          
          <div className="w-px h-4 bg-gray-300"></div>
          
          <button
            onClick={() => router.push('/menu/pricing')}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800"
          >
            <span className="icon-[tabler--tag] h-4 w-4"></span>
            <span>Bulk Pricing</span>
          </button>
          
          <div className="w-px h-4 bg-gray-300"></div>
          
          <button
            onClick={() => router.push('/menu/analytics')}
            className="flex items-center space-x-2 text-orange-600 hover:text-orange-800"
          >
            <span className="icon-[tabler--chart-bar] h-4 w-4"></span>
            <span>Analytics</span>
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
              onClick={() => loadMenuData(true)}
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