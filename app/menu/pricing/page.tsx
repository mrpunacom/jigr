'use client'

import { useState, useEffect, useCallback } from 'react'
import { SearchInput } from '../../components/SearchInput'
import { FoodCostBadge } from '../../components/FoodCostBadge'
import { EmptyState } from '../../components/EmptyState'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ModuleCard, StatCard } from '../../components/ModuleCard'
import { useAuth } from '../../hooks/useAuth'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { 
  MenuPricingItem, 
  MenuPricingResponse, 
  PricingSummary,
  PricingUpdateResponse 
} from '../../../types/MenuTypes'

export default function MenuPricingPage() {
  const { session, loading: authLoading } = useAuth()
  const [items, setItems] = useState<MenuPricingItem[]>([])
  const [summary, setSummary] = useState<PricingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortBy, setSortBy] = useState('name')
  
  // Price editing state
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  
  const categories = Array.from(new Set(items.map(item => item.category_name)))

  const fetchPricingData = useCallback(async () => {
    if (!session?.access_token) return

    try {
      setLoading(true)

      const params = new URLSearchParams({
        sortBy: sortBy
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedStatus) params.append('status', selectedStatus)

      const response = await fetch(`/api/menu/pricing?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch pricing data')
      }

      const data: MenuPricingResponse = await response.json()

      if (data.success) {
        setItems(data.items)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, searchTerm, selectedCategory, selectedStatus, sortBy])

  useEffect(() => {
    if (!authLoading && session) {
      fetchPricingData()
    }
  }, [authLoading, session, fetchPricingData])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleRecalculateCosts = async () => {
    if (!session?.access_token || updating) return

    try {
      setUpdating(true)

      const response = await fetch('/api/menu/pricing/recalculate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to recalculate costs')
      }

      // Refresh data
      await fetchPricingData()
    } catch (error) {
      console.error('Error recalculating costs:', error)
    } finally {
      setUpdating(false)
    }
  }

  const startEdit = (item: MenuPricingItem) => {
    setEditingItem(item.recipe_id)
    setEditPrice(item.menu_price.toFixed(2))
  }

  const cancelEdit = () => {
    setEditingItem(null)
    setEditPrice('')
  }

  const savePrice = async (item: MenuPricingItem) => {
    const newPrice = parseFloat(editPrice)
    
    if (isNaN(newPrice) || newPrice <= 0) {
      alert('Please enter a valid price')
      return
    }

    try {
      const response = await fetch(`/api/menu/pricing/${item.recipe_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          new_price: newPrice,
          reason: 'Manual update from pricing page'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update price')
      }

      const result: PricingUpdateResponse = await response.json()

      if (result.success) {
        // Update local state
        setItems(prevItems => 
          prevItems.map(prevItem => 
            prevItem.recipe_id === item.recipe_id 
              ? result.updated_item 
              : prevItem
          )
        )
        
        setEditingItem(null)
        setEditPrice('')
        
        // Refresh summary
        await fetchPricingData()
      }
    } catch (error) {
      console.error('Error updating price:', error)
      alert('Failed to update price')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(amount)
  }

  const getStatusFilter = () => {
    const statusCounts = {
      excellent: 0,
      good: 0,
      high: 0,
      critical: 0,
      underpriced: 0
    }

    items.forEach(item => {
      statusCounts[item.status as keyof typeof statusCounts]++
    })

    return statusCounts
  }

  const statusCounts = getStatusFilter()

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.recipe_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || 
      item.category_name === selectedCategory
    
    const matchesStatus = !selectedStatus || 
      item.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  if (authLoading || loading) {
    return (
      <StandardPageWrapper moduleName="menu" currentPage="pricing">
        <div className="container mx-auto px-4 py-6">
          <LoadingSpinner />
        </div>
      </StandardPageWrapper>
    )
  }

  return (
    <StandardPageWrapper moduleName="menu" currentPage="pricing">
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard accentColor="blue">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="icon-[tabler--currency-dollar] h-5 w-5 text-blue-600"></span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Menu Items</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total_items}</p>
                </div>
              </div>
            </StatCard>
            
            <StatCard accentColor="green">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="icon-[tabler--target] h-5 w-5 text-green-600"></span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Avg Food Cost</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.average_food_cost_percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </StatCard>
            
            <StatCard accentColor="orange">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="icon-[tabler--trending-up] h-5 w-5 text-orange-600"></span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">In Target Range</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.items_in_target_range}
                  </p>
                  <p className="text-xs text-gray-500">
                    {summary.target_range.min}-{summary.target_range.max}%
                  </p>
                </div>
              </div>
            </StatCard>
            
            <StatCard accentColor="orange">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="icon-[tabler--alert-triangle] h-5 w-5 text-red-600"></span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Need Attention</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary.items_needing_attention}
                  </p>
                </div>
              </div>
            </StatCard>
          </div>
        )}

        {/* Controls */}
        <ModuleCard className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
              <div>
                <SearchInput
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search menu items..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="excellent">🟢 Excellent ({statusCounts.excellent})</option>
                  <option value="good">🟡 Good ({statusCounts.good})</option>
                  <option value="high">🟠 High ({statusCounts.high})</option>
                  <option value="critical">🔴 Critical ({statusCounts.critical})</option>
                  <option value="underpriced">🔴 Underpriced ({statusCounts.underpriced})</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="food_cost_low">Food Cost % (Low-High)</option>
                  <option value="food_cost_high">Food Cost % (High-Low)</option>
                  <option value="margin_high">Margin (High-Low)</option>
                  <option value="margin_low">Margin (Low-High)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRecalculateCosts}
                disabled={updating}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {updating ? (
                  <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full mr-2"></div>
                ) : (
                  <span className="icon-[tabler--refresh] h-4 w-4 mr-2"></span>
                )}
                Update Costs
              </button>
              
              <button
                onClick={() => {
                  // Future: Export functionality
                  console.log('Export clicked')
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="icon-[tabler--download] h-4 w-4 mr-2"></span>
                Export
              </button>
            </div>
          </div>
        </ModuleCard>

        {/* Pricing Table */}
        {filteredItems.length === 0 ? (
          <EmptyState
            title="No menu items found"
            description={searchTerm || selectedCategory || selectedStatus
              ? "No items match your current filters. Try adjusting your search criteria."
              : "No menu items available. Make sure you have recipes with menu prices set."
            }
          />
        ) : (
          <ModuleCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Menu Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost/Portion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Menu Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Food Cost %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Margin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.recipe_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.recipe_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.category_name}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.cost_per_portion)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingItem === item.recipe_id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() => savePrice(item)}
                              className="p-1 text-green-600 hover:text-green-800"
                            >
                              <span className="icon-[tabler--check] h-4 w-4"></span>
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 text-red-600 hover:text-red-800"
                            >
                              <span className="icon-[tabler--x] h-4 w-4"></span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.menu_price)}
                            </span>
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <span className="icon-[tabler--edit] h-4 w-4"></span>
                            </button>
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <FoodCostBadge percentage={item.food_cost_percentage} size="sm" />
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.contribution_margin)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            // Future: Navigate to item detail
                            window.location.href = `/recipes/${item.recipe_id}`
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View Recipe
                        </button>
                        <button
                          onClick={() => {
                            // Future: Navigate to scenarios
                            console.log('Scenarios clicked for', item.recipe_id)
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          <span className="icon-[tabler--calculator] h-4 w-4 inline"></span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ModuleCard>
        )}
      </div>
    </StandardPageWrapper>
  )
}