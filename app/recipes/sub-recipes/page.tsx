'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SearchInput } from '../../components/SearchInput'
import { EmptyState } from '../../components/EmptyState'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ModuleCard, StatCard } from '../../components/ModuleCard'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { 
  Beaker, DollarSign, Package, Users, 
  Plus, Factory, Clock, ChefHat, TrendingUp 
} from 'lucide-react'
import { SubRecipeWithDetails, SubRecipesResponse } from '../../../types/RecipeTypes'

export default function SubRecipesPage() {
  const router = useRouter()
  const [subRecipes, setSubRecipes] = useState<SubRecipeWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const subRecipeTypes = [
    'sauce',
    'stock', 
    'marinade',
    'garnish',
    'other'
  ]

  const fetchSubRecipes = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20',
        sortBy: sortBy
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedType) params.append('type', selectedType)

      const response = await fetch(`/api/recipes/sub-recipes?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch sub-recipes')
      }

      const data: SubRecipesResponse = await response.json()

      if (data.success) {
        setSubRecipes(data.subRecipes)
        setTotalPages(data.pagination.totalPages)
        setTotalItems(data.pagination.totalItems)
      }
    } catch (error) {
      console.error('Error fetching sub-recipes:', error)
    } finally {
      setLoading(false)
    }
  }, [router, currentPage, searchTerm, selectedType, sortBy])

  useEffect(() => {
    fetchSubRecipes()
  }, [fetchSubRecipes])

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchTerm, selectedType, sortBy])

  const handleSubRecipeClick = (subRecipeId: string) => {
    // Future: Navigate to sub-recipe detail
    console.log('Sub-recipe clicked:', subRecipeId)
  }

  const handleProduceClick = (subRecipeId: string) => {
    window.location.href = `/recipes/production?subRecipeId=${subRecipeId}`
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(amount)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sauce': return '🥫'
      case 'stock': return '🍲'
      case 'marinade': return '🧂'
      case 'garnish': return '🌿'
      default: return '🧪'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sauce': return 'bg-red-100 text-red-800'
      case 'stock': return 'bg-yellow-100 text-yellow-800'
      case 'marinade': return 'bg-purple-100 text-purple-800'
      case 'garnish': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <StandardPageWrapper moduleName="recipes" currentPage="sub-recipes">
        <div className="container mx-auto px-4 py-6">
          <LoadingSpinner />
        </div>
      </StandardPageWrapper>
    )
  }

  return (
    <StandardPageWrapper moduleName="recipes" currentPage="sub-recipes">
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard accentColor="blue">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Beaker className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Total Sub-Recipes</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="green">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Avg Cost/Unit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subRecipes.length > 0 
                    ? formatCurrency(subRecipes.reduce((sum, sr) => sum + sr.cost_per_unit, 0) / subRecipes.length)
                    : formatCurrency(0)
                  }
                </p>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="orange">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">In Use</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subRecipes.filter(sr => sr.usage_count > 0).length}
                </p>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="purple">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Types</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(subRecipes.map(sr => sr.sub_recipe_type)).size}
                </p>
              </div>
            </div>
          </StatCard>
        </div>

        {/* Search, Filters & Controls */}
        <ModuleCard className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              <div>
                <SearchInput
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search sub-recipes..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  {subRecipeTypes.map((type) => (
                    <option key={type} value={type}>
                      {getTypeIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
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
                  <option value="cost_per_unit">Cost/Unit</option>
                  <option value="usage_count">Usage Count</option>
                  <option value="last_produced">Last Produced</option>
                </select>
              </div>
            </div>

            {/* Add Button */}
            <button
              onClick={() => {
                // Future: Navigate to add sub-recipe page
                console.log('Add sub-recipe clicked')
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Sub-Recipe
            </button>
          </div>
        </ModuleCard>

        {/* Sub-Recipes Display */}
        {loading ? (
          <LoadingSpinner />
        ) : subRecipes.length === 0 ? (
          <EmptyState
            title="No sub-recipes found"
            description={searchTerm || selectedType 
              ? "No sub-recipes match your current filters. Try adjusting your search criteria."
              : "You haven't created any sub-recipes yet. Sub-recipes are prep components like sauces, stocks, and marinades that can be used in multiple recipes."
            }
            action={
              <button
                onClick={() => {
                  console.log('Add sub-recipe clicked')
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Sub-Recipe
              </button>
            }
          />
        ) : (
          <>
            {/* Sub-Recipes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subRecipes.map((subRecipe) => (
                <ModuleCard
                  key={subRecipe.sub_recipe_id}
                  theme="light"
                  hover
                  onClick={() => handleSubRecipeClick(subRecipe.sub_recipe_id)}
                  className="p-6"
                >
                  <div className="space-y-4">
                    {/* Sub-Recipe Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-2" role="img" aria-label={subRecipe.sub_recipe_type}>
                            {getTypeIcon(subRecipe.sub_recipe_type)}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(subRecipe.sub_recipe_type)}`}>
                            {subRecipe.sub_recipe_type}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white truncate">
                          {subRecipe.sub_recipe_name}
                        </h3>
                      </div>
                    </div>

                    {/* Yield & Cost */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-white/70">Batch Yield</p>
                          <p className="text-white font-medium">
                            {subRecipe.batch_yield_quantity} {subRecipe.batch_yield_unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/70">Cost/Unit</p>
                          <p className="text-white font-medium">
                            {formatCurrency(subRecipe.cost_per_unit)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-white/70">Ingredients</p>
                          <p className="text-white font-medium">
                            {subRecipe.ingredient_count} items
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/70">Used In</p>
                          <p className="text-white font-medium">
                            {subRecipe.usage_count} recipes
                          </p>
                        </div>
                      </div>

                      {subRecipe.prep_time_minutes && (
                        <div className="flex items-center text-sm text-white/70">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Prep: {Math.floor(subRecipe.prep_time_minutes / 60)}h {subRecipe.prep_time_minutes % 60}m</span>
                        </div>
                      )}

                      {subRecipe.last_produced && (
                        <div className="text-sm text-white/70">
                          Last produced: {new Date(subRecipe.last_produced).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSubRecipeClick(subRecipe.sub_recipe_id)
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
                      >
                        <ChefHat className="h-4 w-4 mr-1 inline" />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleProduceClick(subRecipe.sub_recipe_id)
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Factory className="h-4 w-4 mr-1 inline" />
                        Produce
                      </button>
                    </div>
                  </div>
                </ModuleCard>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNumber: number
                    if (totalPages <= 7) {
                      pageNumber = i + 1
                    } else if (currentPage <= 4) {
                      pageNumber = i + 1
                    } else if (currentPage >= totalPages - 3) {
                      pageNumber = totalPages - 6 + i
                    } else {
                      pageNumber = currentPage - 3 + i
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </StandardPageWrapper>
  )
}