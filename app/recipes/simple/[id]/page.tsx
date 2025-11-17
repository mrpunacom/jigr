'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ModuleCard } from '../../../components/ModuleCard'

// MINIMAL RECIPE PAGE - NO COMPLEX STATE MANAGEMENT
export default function SimpleRecipePage() {
  const params = useParams()
  const [recipe, setRecipe] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const recipeId = params.id as string

  useEffect(() => {
    console.log('📱 SIMPLE: Starting fetch for:', recipeId)
    
    // Simple, direct API call - no authentication complexity
    fetch(`/api/recipes/${recipeId}`)
      .then(response => {
        console.log('📱 SIMPLE: Response status:', response.status)
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        console.log('📱 SIMPLE: Data received:', data.success)
        if (data.success) {
          setRecipe(data.recipe)
          console.log('📱 SIMPLE: Recipe set successfully')
        } else {
          setError('Failed to load recipe')
        }
      })
      .catch(err => {
        console.error('📱 SIMPLE: Error:', err)
        setError(err.message)
      })
  }, [recipeId])

  console.log('📱 SIMPLE: Rendering with:', { 
    hasRecipe: !!recipe, 
    hasError: !!error,
    recipeName: recipe?.recipe_name 
  })

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ModuleCard className="max-w-md text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </ModuleCard>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Loading Recipe...</p>
          <p className="text-sm text-gray-500 mt-2">Simple version - ID: {recipeId}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {recipe.recipe_name}
          </h1>
          <p className="text-gray-600">Recipe ID: {recipe.recipe_id}</p>
        </div>

        {/* Cost Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ModuleCard className="text-center p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Cost per Portion</h3>
            <p className="text-2xl font-bold text-green-600">
              ${recipe.cost_per_portion?.toFixed(2) || '0.00'} NZD
            </p>
          </ModuleCard>
          
          <ModuleCard className="text-center p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Menu Price</h3>
            <p className="text-2xl font-bold text-blue-600">
              ${recipe.menu_price?.toFixed(2) || '0.00'} NZD
            </p>
          </ModuleCard>
          
          <ModuleCard className="text-center p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Food Cost %</h3>
            <p className="text-2xl font-bold text-orange-600">
              {recipe.food_cost_percentage?.toFixed(1) || '0.0'}%
            </p>
          </ModuleCard>
        </div>

        {/* Instructions */}
        {recipe.instructions && (
          <ModuleCard className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions</h2>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-gray-700 font-sans">
                {recipe.instructions}
              </pre>
            </div>
          </ModuleCard>
        )}

        {/* Debug Info */}
        <ModuleCard className="p-4 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Debug Info</h3>
          <div className="text-xs text-gray-500 space-y-1">
            <p>Recipe ID: {recipe.recipe_id}</p>
            <p>Portions: {recipe.number_of_portions}</p>
            <p>Category: {recipe.category_name || 'Unknown'}</p>
            <p>Active: {recipe.is_active ? 'Yes' : 'No'}</p>
          </div>
        </ModuleCard>

      </div>
    </div>
  )
}