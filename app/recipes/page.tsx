'use client'

import { useState, useEffect, useCallback } from 'react'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { SearchInput } from '../components/SearchInput'
import { FoodCostBadge } from '../components/FoodCostBadge'
import { EmptyState } from '../components/EmptyState'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ModuleCard, StatCard } from '../components/ModuleCard'
import { supabase } from '@/lib/supabase'
import { ChefHat, DollarSign, Clock, Users, Grid3X3, List, Plus } from 'lucide-react'
import { RecipeWithDetails, RecipeCategory, RecipesResponse } from '../../types/RecipeTypes'

export default function RecipesPage() {
  const [session, setSession] = useState<any>(null)
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([])
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [authLoading, setAuthLoading] = useState(true)

  // Session management
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setAuthLoading(false)
    }
    getSession()
  }, [])

  const fetchRecipes = useCallback(async () => {
    if (!session?.access_token) return

    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20',
        sortBy: sortBy
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)

      const response = await fetch(`/api/recipes?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recipes')
      }

      const data: RecipesResponse = await response.json()

      if (data.success) {
        setRecipes(data.recipes)
        setCategories(data.categories)
        setTotalPages(data.pagination.totalPages)
        setTotalItems(data.pagination.totalItems)
      }
    } catch (error) {
      console.error('Error fetching recipes:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, currentPage, searchTerm, selectedCategory, sortBy])

  useEffect(() => {
    if (!authLoading && session) {
      fetchRecipes()
    }
  }, [authLoading, session, fetchRecipes])

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchTerm, selectedCategory, sortBy])

  const handleRecipeClick = (recipeId: string) => {
    window.location.href = `/recipes/${recipeId}`
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

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (loading) {
    return (
      <StandardPageWrapper moduleName="recipes" currentPage="recipes">
        <div className="container mx-auto px-4 py-6">
          <LoadingSpinner />
        </div>
      </StandardPageWrapper>
    )
  }

  return (
    <StandardPageWrapper moduleName="recipes" currentPage="recipes">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard accentColor="blue">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChefHat className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Total Recipes</p>
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
                <p className="text-sm font-medium text-gray-900">Avg Food Cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recipes.length > 0 
                    ? `${(recipes.reduce((sum, r) => sum + r.food_cost_percentage, 0) / recipes.length).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="orange">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="orange">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Need Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {recipes.filter(r => r.food_cost_percentage > 40 || r.food_cost_percentage < 20).length}
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
                  placeholder="Search recipes..."
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
                    <option key={category.category_id} value={category.category_name}>
                      {category.category_name}
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
                  <option value="cost_low">Cost (Low-High)</option>
                  <option value="cost_high">Cost (High-Low)</option>
                  <option value="food_cost_percent">Food Cost %</option>
                </select>
              </div>
            </div>

            {/* View Controls & Add Button */}
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-100 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-l-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-r-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              <button
                onClick={() => {
                  // Future: Navigate to add recipe page
                  console.log('Add recipe clicked')
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Recipe
              </button>
            </div>
          </div>
        </ModuleCard>

        {/* Recipes Display */}
        {loading ? (
          <LoadingSpinner />
        ) : recipes.length === 0 ? (
          <EmptyState
            title="No recipes found"
            description={searchTerm || selectedCategory 
              ? "No recipes match your current filters. Try adjusting your search criteria."
              : "You haven't added any recipes yet. Start by creating your first recipe."
            }
            action={
              <button
                onClick={() => {
                  // Future: Navigate to add recipe page
                  console.log('Add recipe clicked')
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recipe
              </button>
            }
          />
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <ModuleCard
                    key={recipe.recipe_id}
                    theme="light"
                    hover
                    onClick={() => handleRecipeClick(recipe.recipe_id)}
                    className="p-6"
                  >
                    <div className="space-y-4">
                      {/* Recipe Image Placeholder */}
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        {recipe.photo_url ? (
                          <img 
                            src={recipe.photo_url} 
                            alt={recipe.recipe_name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ChefHat className="h-16 w-16 text-gray-400" />
                        )}
                      </div>

                      {/* Recipe Info */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white truncate">
                            {recipe.recipe_name}
                          </h3>
                          <p className="text-sm text-white/70">
                            {recipe.category_name}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-white/70">Portions</p>
                            <p className="text-white font-medium">{recipe.number_of_portions}</p>
                          </div>
                          <div>
                            <p className="text-white/70">Prep Time</p>
                            <p className="text-white font-medium">{formatTime(recipe.prep_time_minutes)}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white/70">Cost/Portion</span>
                            <span className="text-white font-medium">
                              {formatCurrency(recipe.cost_per_portion)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white/70">Menu Price</span>
                            <span className="text-white font-medium">
                              {formatCurrency(recipe.menu_price)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white/70">Food Cost</span>
                            <FoodCostBadge percentage={recipe.food_cost_percentage} size="sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </ModuleCard>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recipe
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Portions
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
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recipes.map((recipe) => (
                        <tr 
                          key={recipe.recipe_id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleRecipeClick(recipe.recipe_id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0">
                                {recipe.photo_url ? (
                                  <img 
                                    className="h-10 w-10 rounded-lg object-cover"
                                    src={recipe.photo_url}
                                    alt={recipe.recipe_name}
                                  />
                                ) : (
                                  <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <ChefHat className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {recipe.recipe_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {recipe.ingredient_count} ingredients
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {recipe.category_name}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {recipe.number_of_portions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(recipe.cost_per_portion)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(recipe.menu_price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <FoodCostBadge percentage={recipe.food_cost_percentage} size="sm" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRecipeClick(recipe.recipe_id)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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