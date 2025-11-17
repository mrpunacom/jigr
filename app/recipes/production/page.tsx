'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ModuleCard, StatCard } from '../../components/ModuleCard'
import { useAuth } from '../../hooks/useAuth'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { 
  ArrowLeft, Factory, Clock, AlertTriangle, 
  CheckCircle, Package, Calendar, Beaker,
  Calculator, TrendingDown, TrendingUp, Info
} from 'lucide-react'
import { 
  SubRecipeWithDetails, 
  SubRecipesResponse, 
  ProductionRequest,
  ProductionResponse 
} from '../../../types/RecipeTypes'

function ProductionPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session, loading: authLoading } = useAuth()
  
  // Form state
  const [selectedSubRecipeId, setSelectedSubRecipeId] = useState('')
  const [quantityProduced, setQuantityProduced] = useState('')
  const [productionTimeMinutes, setProductionTimeMinutes] = useState('')
  const [qualityNotes, setQualityNotes] = useState('')
  const [shelfLifeDate, setShelfLifeDate] = useState('')
  
  // Data state
  const [subRecipes, setSubRecipes] = useState<SubRecipeWithDetails[]>([])
  const [selectedSubRecipe, setSelectedSubRecipe] = useState<SubRecipeWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Pre-select sub-recipe from URL params
  const preSelectedSubRecipeId = searchParams.get('subRecipeId')

  // Fetch sub-recipes
  const fetchSubRecipes = useCallback(async () => {
    if (!session?.access_token) return

    try {
      setLoading(true)

      const response = await fetch(`/api/recipes/sub-recipes?pageSize=100&sortBy=name`, {
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
        
        // Pre-select if specified in URL
        if (preSelectedSubRecipeId) {
          setSelectedSubRecipeId(preSelectedSubRecipeId)
        }
      }
    } catch (error) {
      console.error('Error fetching sub-recipes:', error)
      setError('Failed to load sub-recipes')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, preSelectedSubRecipeId])

  useEffect(() => {
    if (!authLoading && session) {
      fetchSubRecipes()
    }
  }, [authLoading, session, fetchSubRecipes])

  // Update selected sub-recipe when selection changes
  useEffect(() => {
    if (selectedSubRecipeId && subRecipes.length > 0) {
      const subRecipe = subRecipes.find(sr => sr.sub_recipe_id === selectedSubRecipeId)
      setSelectedSubRecipe(subRecipe || null)
      
      // Set default shelf life date if sub-recipe has shelf life days
      if (subRecipe?.shelf_life_days) {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + subRecipe.shelf_life_days)
        setShelfLifeDate(futureDate.toISOString().split('T')[0])
      }
    }
  }, [selectedSubRecipeId, subRecipes])

  // Calculate yield percentage
  const calculateYieldPercentage = () => {
    if (!selectedSubRecipe || !quantityProduced) return 0
    const produced = parseFloat(quantityProduced)
    const expected = selectedSubRecipe.batch_yield_quantity
    return expected > 0 ? (produced / expected) * 100 : 0
  }

  // Calculate actual cost per unit
  const calculateActualCostPerUnit = () => {
    if (!selectedSubRecipe || !quantityProduced) return 0
    const produced = parseFloat(quantityProduced)
    const totalCost = selectedSubRecipe.total_ingredient_cost
    return produced > 0 ? totalCost / produced : 0
  }

  const yieldPercentage = calculateYieldPercentage()
  const actualCostPerUnit = calculateActualCostPerUnit()

  // Validate form
  const isFormValid = () => {
    return selectedSubRecipeId && 
           quantityProduced && 
           parseFloat(quantityProduced) > 0 &&
           shelfLifeDate
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid()) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const productionData: ProductionRequest = {
        sub_recipe_id: selectedSubRecipeId,
        quantity_produced: parseFloat(quantityProduced),
        production_time_minutes: productionTimeMinutes ? parseInt(productionTimeMinutes) : undefined,
        quality_notes: qualityNotes || undefined,
        shelf_life_date: shelfLifeDate
      }

      const response = await fetch('/api/recipes/production', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productionData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to record production')
      }

      const result: ProductionResponse = await response.json()

      if (result.success) {
        setSuccess(`Production recorded successfully! ${selectedSubRecipe?.sub_recipe_name} is now available in inventory.`)
        
        // Reset form
        setSelectedSubRecipeId('')
        setQuantityProduced('')
        setProductionTimeMinutes('')
        setQualityNotes('')
        setShelfLifeDate('')
        setSelectedSubRecipe(null)
        
        // Optional: Navigate back to sub-recipes after delay
        setTimeout(() => {
          router.push('/recipes/sub-recipes')
        }, 3000)
      } else {
        setError(result.message || 'Failed to record production')
      }

    } catch (error) {
      console.error('Error recording production:', error)
      setError(error instanceof Error ? error.message : 'Failed to record production')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <StandardPageWrapper moduleName="recipes" currentPage="production">
        <div className="container mx-auto px-4 py-6">
          <LoadingSpinner />
        </div>
      </StandardPageWrapper>
    )
  }

  return (
    <StandardPageWrapper moduleName="recipes" currentPage="production">
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/recipes/sub-recipes')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sub-Recipes
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium">Production Recorded Successfully!</p>
              <p className="text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
            <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sub-Recipe Selection */}
          <ModuleCard className="p-6">
            <div className="flex items-center mb-4">
              <Beaker className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Select Sub-Recipe</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-Recipe to Produce *
                </label>
                <select
                  value={selectedSubRecipeId}
                  onChange={(e) => setSelectedSubRecipeId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a sub-recipe...</option>
                  {subRecipes.map((subRecipe) => (
                    <option key={subRecipe.sub_recipe_id} value={subRecipe.sub_recipe_id}>
                      {subRecipe.sub_recipe_name} ({subRecipe.batch_yield_quantity} {subRecipe.batch_yield_unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Sub-Recipe Info */}
              {selectedSubRecipe && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">{selectedSubRecipe.sub_recipe_name}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700">Expected Yield</p>
                      <p className="font-medium text-blue-900">
                        {selectedSubRecipe.batch_yield_quantity} {selectedSubRecipe.batch_yield_unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700">Expected Cost</p>
                      <p className="font-medium text-blue-900">
                        ${selectedSubRecipe.total_ingredient_cost.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700">Cost/Unit</p>
                      <p className="font-medium text-blue-900">
                        ${selectedSubRecipe.cost_per_unit.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700">Ingredients</p>
                      <p className="font-medium text-blue-900">{selectedSubRecipe.ingredient_count} items</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ModuleCard>

          {/* Production Details */}
          {selectedSubRecipe && (
            <ModuleCard className="p-6">
              <div className="flex items-center mb-4">
                <Factory className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Production Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Quantity Produced *
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={quantityProduced}
                      onChange={(e) => setQuantityProduced(e.target.value)}
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.0"
                    />
                    <span className="px-3 py-2 bg-gray-50 border border-l-0 border-gray-300 rounded-r-md text-gray-500">
                      {selectedSubRecipe.batch_yield_unit}
                    </span>
                  </div>
                  
                  {/* Yield Percentage */}
                  {quantityProduced && (
                    <div className="mt-2">
                      <div className="flex items-center text-sm">
                        {yieldPercentage >= 95 ? (
                          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-orange-600 mr-1" />
                        )}
                        <span className={`font-medium ${yieldPercentage >= 95 ? 'text-green-600' : 'text-orange-600'}`}>
                          Yield: {yieldPercentage.toFixed(1)}%
                        </span>
                      </div>
                      {yieldPercentage < 95 && (
                        <p className="text-xs text-orange-600 mt-1">
                          ⚠️ Lower yield than expected - check process
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Production Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productionTimeMinutes}
                    onChange={(e) => setProductionTimeMinutes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shelf Life Date *
                  </label>
                  <input
                    type="date"
                    value={shelfLifeDate}
                    onChange={(e) => setShelfLifeDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {selectedSubRecipe.shelf_life_days && (
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: {selectedSubRecipe.shelf_life_days} days from production
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Notes
                  </label>
                  <textarea
                    value={qualityNotes}
                    onChange={(e) => setQualityNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional notes about quality, adjustments, or observations..."
                  />
                </div>
              </div>
            </ModuleCard>
          )}

          {/* Cost Analysis */}
          {selectedSubRecipe && quantityProduced && (
            <ModuleCard theme="light" className="p-6">
              <div className="flex items-center mb-4">
                <Calculator className="h-5 w-5 text-white mr-2" />
                <h2 className="text-lg font-semibold text-white">Cost Analysis</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-white/70">Total Ingredient Cost</p>
                  <p className="text-xl font-bold text-white">
                    ${selectedSubRecipe.total_ingredient_cost.toFixed(2)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-white/70">Expected Cost/Unit</p>
                  <p className="text-xl font-bold text-white">
                    ${selectedSubRecipe.cost_per_unit.toFixed(2)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-white/70">Actual Cost/Unit</p>
                  <p className="text-xl font-bold text-white">
                    ${actualCostPerUnit.toFixed(2)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-white/70">Variance</p>
                  <p className={`text-xl font-bold ${actualCostPerUnit > selectedSubRecipe.cost_per_unit ? 'text-red-300' : 'text-green-300'}`}>
                    {actualCostPerUnit > selectedSubRecipe.cost_per_unit ? '+' : ''}
                    ${(actualCostPerUnit - selectedSubRecipe.cost_per_unit).toFixed(2)}
                  </p>
                </div>
              </div>
            </ModuleCard>
          )}

          {/* What Will Be Created */}
          {selectedSubRecipe && (
            <ModuleCard className="p-6">
              <div className="flex items-center mb-4">
                <Package className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">This Will Create</h2>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">When you record this production:</p>
                    <ul className="space-y-1 list-disc list-inside ml-4">
                      <li>Inventory item: "{selectedSubRecipe.sub_recipe_name} (In-House)"</li>
                      <li>Batch with expiration tracking</li>
                      <li>Updated inventory count</li>
                      <li>Production audit record</li>
                      <li>Available immediately for use in recipes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </ModuleCard>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/recipes/sub-recipes')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={!isFormValid() || submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Recording...
                </>
              ) : (
                <>
                  <Factory className="h-4 w-4 mr-2" />
                  Record Production
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </StandardPageWrapper>
  )
}

export default function ProductionPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProductionPageContent />
    </Suspense>
  )
}