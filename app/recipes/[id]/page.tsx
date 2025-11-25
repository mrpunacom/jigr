'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FoodCostBadge } from '../../components/FoodCostBadge'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ModuleCard, StatCard } from '../../components/ModuleCard'
import { useAuth } from '../../hooks/useAuth'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { 
  RecipeWithDetails, 
  RecipeIngredientWithDetails, 
  RecipeDetailResponse,
  CostBreakdown 
} from '../../../types/RecipeTypes'

export default function RecipeDetailPage() {
  console.log('🔍 COMPONENT RENDER: RecipeDetailPage started')
  
  const params = useParams()
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  
  // 🔍 DEBUG: Log auth state immediately
  console.log('🔍 Auth Debug:', { session: !!session, authLoading, hasAccessToken: !!session?.access_token })
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null)
  const [ingredients, setIngredients] = useState<RecipeIngredientWithDetails[]>([])
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null)
  const [loading, setLoading] = useState(true) // RESTORE NORMAL LOADING STATE
  const [error, setError] = useState<string | null>(null)
  const [fetchInProgress, setFetchInProgress] = useState(false)

  // 🎯 KEY FIX: Track component lifecycle
  const componentId = useRef(Math.random().toString(36).substr(2, 9))
  
  // 🎯 KEY FIX: Prevent double-fetching in Strict Mode
  const hasFetchedRef = useRef(false)
  
  // 🎯 NEW FIX: Track if component is still mounted for safe state updates
  const isMountedRef = useRef(true)

  const recipeId = params.id as string

  // 🎯 SAFE STATE SETTER: Only update state if component is still mounted
  const safeSetState = (setter: () => void) => {
    if (isMountedRef.current) {
      console.log('✅ Safe state update (mounted)')
      setter()
    } else {
      console.log('🚫 Blocked state update (unmounted)')
    }
  }

  // Track mounts/unmounts for debugging
  useEffect(() => {
    console.log(`🔵 MOUNT - Component ${componentId.current}`)
    isMountedRef.current = true
    
    return () => {
      console.log(`🔴 UNMOUNT - Component ${componentId.current}`)
      isMountedRef.current = false
      if (process.env.NODE_ENV === 'development') {
        hasFetchedRef.current = false
      }
    }
  }, [])

  useEffect(() => {
    const effectId = componentId.current
    console.log('🍳 Effect running with ID:', effectId)
    
    async function fetchRecipeDetail() {
      console.log('🍳 Fetch recipe called:', effectId, { session: !!session, access_token: !!session?.access_token, recipeId, authLoading, fetchInProgress })
      
      // 🎯 CRITICAL: Prevent double-fetch in Strict Mode
      if (hasFetchedRef.current) {
        console.log('🍳 Already fetched, skipping:', effectId)
        return
      }
      
      if (!session || !recipeId) {
        console.log('🍳 Missing session or recipeId:', { session: !!session, recipeId })
        console.log('🍳 Session structure:', session ? Object.keys(session) : 'no session')
        return
      }

      if (fetchInProgress) {
        console.log('🍳 Fetch already in progress, skipping')
        return
      }

      // Check session structure to find the correct token field
      const accessToken = session.access_token || session.token || session.accessToken
      console.log('🍳 Access token found:', !!accessToken)

      try {
        console.log('🍳 Starting fetch:', effectId)
        
        // 🎯 CRITICAL: Set the flag BEFORE the async operation
        hasFetchedRef.current = true
        
        setFetchInProgress(true)
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/recipes/${recipeId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken || 'no-token'}`
          }
        })

        console.log('🍳 Response status:', response.status, response.ok)

        if (!response.ok) {
          const errorData = await response.text()
          console.error('🍳 API Error:', response.status, errorData)
          
          try {
            const errorJson = JSON.parse(errorData)
            console.error('🍳 API Error Details:', errorJson)
          } catch (e) {
            console.log('🍳 Error response not JSON:', errorData)
          }
          
          if (response.status === 404) {
            safeSetState(() => setError('Recipe not found'))
          } else if (response.status === 401) {
            safeSetState(() => setError('Authentication failed - please try refreshing the page'))
          } else {
            safeSetState(() => setError(`API Error: ${response.status}`))
          }
          return
        }

        const data: RecipeDetailResponse = await response.json()
        console.log('🍳 API Response:', data)

        if (data.success) {
          console.log('🍳 Setting recipe data with safe state updates...')
          
          safeSetState(() => {
            setRecipe(data.recipe)
            setIngredients(data.ingredients) 
            setCostBreakdown(data.costBreakdown)
            console.log('🍳 Recipe data set successfully')
          })
          
          // Critical: Set loading to false with mount check
          safeSetState(() => {
            setLoading(false)
            console.log('🍳 Loading set to false safely')
          })
          
        } else {
          console.log('🍳 API returned success=false')
          safeSetState(() => setError('Failed to load recipe details'))
        }
      } catch (error) {
        console.error('🍳 Error fetching recipe detail:', error)
        safeSetState(() => setError('Failed to load recipe details'))
      } finally {
        console.log('🍳 Cleaning up (effect:', effectId, ')')
        safeSetState(() => setFetchInProgress(false))
      }
    }

    if (!authLoading && session?.access_token) {
      fetchRecipeDetail()
    }
  }, [recipeId]) // 🎯 SIMPLIFIED: Only watch recipeId, only run when we have auth

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
      // Navigate to stock item detail
      router.push(`/stock/items/${ingredient.item_id}`)
    } else if (ingredient.ingredient_type === 'sub_recipe' && ingredient.sub_recipe_id) {
      // Future: Navigate to sub-recipe detail
      console.log('Sub-recipe clicked:', ingredient.sub_recipe_id)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  console.log('🍳 FINAL Render state:', { authLoading, loading, recipe: !!recipe, error })
  console.log('🍳 Should show loading?', authLoading || loading)
  console.log('🍳 Should show error?', error || !recipe)

  if (authLoading || loading) {
    console.log('🍳 Showing loading spinner because:', { authLoading, loading })
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <LoadingSpinner />
        <div className="mt-4 text-center">
          <p className="text-lg">Loading Recipe...</p>
          <div className="text-sm text-gray-600 mt-2">
            <p>Auth Loading: {String(authLoading)}</p>
            <p>Data Loading: {String(loading)}</p>
            <p>Component: {componentId.current}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    console.log('🍳 Showing error page because:', { error, recipe: !!recipe })
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
              <span className="icon-[tabler--arrow-left] h-4 w-4 mr-2"></span>
              Back to Recipes
            </button>
          </ModuleCard>
        </div>
      </StandardPageWrapper>
    )
  }

  console.log('🍳 Rendering main recipe content!')
  
  return (
    <StandardPageWrapper moduleName="recipes" currentPage="detail">
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between print:hidden">
          <button
            onClick={() => router.push('/recipes')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <span className="icon-[tabler--arrow-left] h-4 w-4 mr-2"></span>
            Back to Recipes
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="icon-[tabler--printer] h-4 w-4 mr-2"></span>
              Print
            </button>
            
            <button
              onClick={() => {
                // Future: Navigate to recipe editor
                console.log('Edit recipe clicked')
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="icon-[tabler--edit] h-4 w-4 mr-2"></span>
              Edit Recipe
            </button>
          </div>
        </div>

        {/* Recipe Information Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recipe Image & Basic Info */}
          <div className="lg:col-span-1">
            <ModuleCard className="overflow-hidden">
              {/* Recipe Photo */}
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                {recipe.photo_url ? (
                  <img 
                    src={recipe.photo_url} 
                    alt={recipe.recipe_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="icon-[tabler--chef-hat] h-20 w-20 text-gray-400"></span>
                )}
              </div>
              
              {/* Basic Info */}
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
                      <span className="icon-[tabler--users] h-4 w-4 mr-1"></span>
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
                      <span className="icon-[tabler--clock] h-4 w-4 mr-1"></span>
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
                <span className="icon-[tabler--calculator] h-5 w-5 text-white mr-2"></span>
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
                <span className="icon-[tabler--package] h-5 w-5 text-gray-400 mr-2"></span>
                <h2 className="text-lg font-semibold text-gray-900">
                  Ingredients ({ingredients.length})
                </h2>
              </div>
              <button
                onClick={() => {
                  // Future: Recalculate costs
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
                                <span className="icon-[tabler--tools-kitchen-2] h-4 w-4 text-green-600"></span>
                              </div>
                            ) : (
                              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="icon-[tabler--package] h-4 w-4 text-blue-600"></span>
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
                          <span className="icon-[tabler--external-link] h-4 w-4"></span>
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
                <span className="icon-[tabler--file-text] h-5 w-5 text-gray-400 mr-2"></span>
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