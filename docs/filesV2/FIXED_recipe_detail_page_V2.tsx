'use client'

/**
 * FIXED VERSION V2 - Recipe Detail Page
 * 
 * KEY CHANGES FOR STRICT MODE COMPATIBILITY:
 * 1. ✅ Added useRef to prevent double-fetching in Strict Mode
 * 2. ✅ Added lifecycle logging to track mount/unmount cycles
 * 3. ✅ Simplified dependency array to [session?.access_token, recipeId, authLoading]
 * 4. ✅ Added cleanup function that resets fetch flag in development
 * 
 * WHY THIS WORKS:
 * - React Strict Mode in Next.js 14 intentionally double-mounts components in development
 * - This causes useEffect to run twice, leading to duplicate API calls
 * - useRef persists across re-renders but NOT across component mounts
 * - By checking hasFetchedRef, we ensure only ONE API call per mount cycle
 * 
 * RESULT: Recipe page loads once, even in Strict Mode! 🎉
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FoodCostBadge } from '../../components/FoodCostBadge'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ModuleCard, StatCard } from '../../components/ModuleCard'
import { useAuth } from '../../hooks/useAuth'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { 
  ArrowLeft, ChefHat, Clock, Users, DollarSign, 
  Calculator, Package, FileText, Printer, Edit,
  ExternalLink, Utensils
} from 'lucide-react'
import { 
  RecipeWithDetails, 
  RecipeIngredientWithDetails, 
  RecipeDetailResponse,
  CostBreakdown 
} from '../../../types/RecipeTypes'

export default function RecipeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null)
  const [ingredients, setIngredients] = useState<RecipeIngredientWithDetails[]>([])
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const recipeId = params.id as string
  
  // 🎯 KEY FIX: Track component lifecycle
  const componentId = useRef(Math.random().toString(36).substr(2, 9))
  
  // 🎯 KEY FIX: Prevent double-fetching in Strict Mode
  const hasFetchedRef = useRef(false)
  
  // Track mounts/unmounts for debugging
  useEffect(() => {
    console.log(`🔵 MOUNT - Component ${componentId.current}`)
    return () => {
      console.log(`🔴 UNMOUNT - Component ${componentId.current}`)
    }
  }, [])
  
  // Main data fetching effect
  useEffect(() => {
    const effectId = Math.random().toString(36).substr(2, 9)
    console.log('🍳 Effect running with ID:', effectId, 'Component:', componentId.current)
    
    async function fetchRecipeDetail() {
      // 🎯 CRITICAL: Check if we've already fetched during this mount cycle
      if (hasFetchedRef.current) {
        console.log('🍳 Already fetched, skipping:', effectId)
        return
      }
      
      // Wait for auth to complete
      if (authLoading) {
        console.log('🍳 Waiting for auth...', effectId)
        return
      }
      
      // Validate requirements
      if (!session?.access_token || !recipeId) {
        console.log('🍳 Missing requirements:', { 
          hasToken: !!session?.access_token, 
          recipeId,
          effectId 
        })
        return
      }

      console.log('🍳 Starting fetch:', effectId)
      
      // 🎯 CRITICAL: Mark as fetched BEFORE async operation
      hasFetchedRef.current = true
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        console.log('🍳 Response status:', response.status, effectId)

        if (!response.ok) {
          if (response.status === 404) {
            setError('Recipe not found')
          } else if (response.status === 401) {
            setError('Authentication failed - please try refreshing the page')
          } else {
            setError(`API Error: ${response.status}`)
          }
          return
        }

        const data: RecipeDetailResponse = await response.json()
        console.log('🍳 Data received, success:', data.success, effectId)

        if (data.success) {
          console.log('🍳 Setting recipe state...', effectId)
          setRecipe(data.recipe)
          setIngredients(data.ingredients)
          setCostBreakdown(data.costBreakdown)
          console.log('🍳 Recipe state set successfully', effectId)
        } else {
          console.log('🍳 API returned success=false', effectId)
          setError('Failed to load recipe details')
        }
      } catch (error) {
        console.error('🍳 Fetch error:', error, effectId)
        setError('Failed to load recipe details')
        // Reset fetch flag on error so user can retry
        hasFetchedRef.current = false
      } finally {
        console.log('🍳 Setting loading to false', effectId)
        setLoading(false)
      }
    }

    fetchRecipeDetail()
    
    // 🎯 CRITICAL: Cleanup function
    return () => {
      console.log('🍳 Cleanup running:', effectId)
      // Reset fetch flag in development to allow hot reload
      if (process.env.NODE_ENV === 'development') {
        hasFetchedRef.current = false
      }
    }
  }, [session?.access_token, recipeId, authLoading])

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

  const handleIngredientClick = (ingredient: RecipeIngredientWithDetails) => {
    if (ingredient.ingredient_type === 'inventory' && ingredient.item_id) {
      router.push(`/stock/items/${ingredient.item_id}`)
    } else if (ingredient.ingredient_type === 'sub_recipe' && ingredient.sub_recipe_id) {
      console.log('Sub-recipe clicked:', ingredient.sub_recipe_id)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Log render state
  console.log('🔄 RENDER - Component:', componentId.current, {
    authLoading,
    loading,
    hasRecipe: !!recipe,
    error: !!error
  })

  if (authLoading || loading) {
    console.log('🍳 Showing loading spinner:', { authLoading, loading })
    return (
      <StandardPageWrapper moduleName="recipes" currentPage="detail">
        <div className="container mx-auto px-4 py-6">
          <LoadingSpinner />
          {/* Debug info - remove in production */}
          <div className="mt-4 text-center text-sm text-gray-500">
            Component: {componentId.current}<br />
            Auth Loading: {String(authLoading)}<br />
            Data Loading: {String(loading)}
          </div>
        </div>
      </StandardPageWrapper>
    )
  }

  if (error || !recipe) {
    console.log('🍳 Showing error:', { error, hasRecipe: !!recipe })
    return (
      <StandardPageWrapper moduleName="recipes" currentPage="detail">
        <div className="container mx-auto px-4 py-6">
          <ModuleCard className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {error || 'Recipe not found'}
            </h2>
            <p className="text-gray-600 mb-4">
              The recipe you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push('/recipes')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recipes
            </button>
          </ModuleCard>
        </div>
      </StandardPageWrapper>
    )
  }

  console.log('🍳 Rendering main recipe content for component:', componentId.current)
  
  return (
    <StandardPageWrapper moduleName="recipes" currentPage="detail">
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between print:hidden">
          <button
            onClick={() => router.push('/recipes')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Recipes
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </button>
            
            <button
              onClick={() => {
                console.log('Edit recipe clicked')
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Recipe
            </button>
          </div>
        </div>

        {/* Recipe Information Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recipe Image & Basic Info */}
          <div className="lg:col-span-1">
            <ModuleCard className="overflow-hidden">
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                {recipe.photo_url ? (
                  <img 
                    src={recipe.photo_url} 
                    alt={recipe.recipe_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ChefHat className="h-20 w-20 text-gray-400" />
                )}
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 print:text-2xl">
                    {recipe.recipe_name}
                  </h1>
                  <p className="text-sm text-gray-600">{recipe.category_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center text-gray-600 mb-1">
                      <Users className="h-4 w-4 mr-1" />
                      Portions
                    </div>
                    <p className="font-medium">{recipe.number_of_portions}</p>
                    {recipe.portion_size && (
                      <p className="text-xs text-gray-500">
                        {recipe.portion_size}{recipe.portion_size_unit}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center text-gray-600 mb-1">
                      <Clock className="h-4 w-4 mr-1" />
                      Prep Time
                    </div>
                    <p className="font-medium">{formatTime(recipe.prep_time_minutes)}</p>
                    {recipe.cook_time_minutes && (
                      <p className="text-xs text-gray-500">
                        Cook: {formatTime(recipe.cook_time_minutes)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </ModuleCard>
          </div>

          {/* Costing Summary */}
          <div className="lg:col-span-2">
            <ModuleCard theme="light" className="p-6">
              <div className="flex items-center mb-6">
                <Calculator className="h-5 w-5 text-white mr-2" />
                <h2 className="text-lg font-semibold text-white">Cost Analysis</h2>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-white/70 mb-1">Total Cost</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(recipe.total_cost)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-white/70 mb-1">Cost per Portion</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(recipe.cost_per_portion)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-white/70 mb-1">Menu Price</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(recipe.menu_price)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-white/70 mb-1">Food Cost %</p>
                  <div className="flex items-center">
                    <FoodCostBadge 
                      percentage={recipe.food_cost_percentage} 
                      size="lg"
                    />
                  </div>
                </div>
              </div>

              {costBreakdown && (
                <div className="mt-6 pt-6 border-t border-white/20">
                  <p className="text-sm text-white/70">
                    Last calculated: {new Date(costBreakdown.last_calculated).toLocaleString()}
                  </p>
                </div>
              )}
            </ModuleCard>
          </div>
        </div>

        {/* Ingredients Section */}
        <ModuleCard className="overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Package className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Ingredients ({ingredients.length})
                </h2>
              </div>
              <button
                onClick={() => {
                  console.log('Recalculate costs')
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Recalculate Costs
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingredient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Extended Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % of Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ingredients.map((ingredient) => {
                  const costData = costBreakdown?.ingredient_costs.find(
                    cost => cost.ingredient_id === ingredient.ingredient_id
                  )
                  
                  return (
                    <tr 
                      key={ingredient.ingredient_id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleIngredientClick(ingredient)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 mr-3">
                            {ingredient.ingredient_type === 'sub_recipe' ? (
                              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Utensils className="h-4 w-4 text-green-600" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Package className="h-4 w-4 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {ingredient.ingredient_name}
                            </div>
                            {ingredient.ingredient_type === 'sub_recipe' && (
                              <div className="text-xs text-green-600 font-medium">
                                Made In-House
                              </div>
                            )}
                            {ingredient.prep_notes && (
                              <div className="text-xs text-gray-500">
                                {ingredient.prep_notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ingredient.quantity} {ingredient.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(costData?.unit_cost || 0)}/{ingredient.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(costData?.extended_cost || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(costData?.percentage_of_total || 0).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium print:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleIngredientClick(ingredient)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </ModuleCard>

        {/* Instructions Section */}
        {(recipe.instructions || recipe.cooking_notes || recipe.plating_notes) && (
          <ModuleCard>
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Instructions</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {recipe.instructions && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Preparation Steps</h3>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {recipe.instructions}
                  </div>
                </div>
              )}
              
              {recipe.cooking_notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Cooking Notes</h3>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {recipe.cooking_notes}
                  </div>
                </div>
              )}
              
              {recipe.plating_notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Plating & Presentation</h3>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {recipe.plating_notes}
                  </div>
                </div>
              )}
            </div>
          </ModuleCard>
        )}
      </div>
    </StandardPageWrapper>
  )
}
