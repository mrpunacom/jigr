'use client'

import { useRouter } from 'next/navigation'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { UniversalRecipeImporter } from '@/app/components/recipes/UniversalRecipeImporter'

interface RecipeData {
  name: string
  description?: string
  servings?: number
  prep_time?: number
  cook_time?: number
  total_time?: number
  ingredients: Array<{
    name: string
    quantity: number
    unit: string
    notes?: string
    cost?: number
  }>
  instructions: Array<{
    step: number
    instruction: string
    time?: number
  }>
  nutrition?: {
    calories?: number
    protein?: number
    fat?: number
    carbohydrates?: number
  }
  category?: string
  cuisine?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  source?: string
  notes?: string
}

export default function UniversalRecipeImportPage() {
  const router = useRouter()

  const handleRecipeComplete = async (recipe: RecipeData) => {
    try {
      // Save the imported recipe
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...recipe,
          source: recipe.source || 'imported',
          created_via: 'universal_importer'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const savedRecipe = await response.json()

      // Navigate to the saved recipe
      router.push(`/recipes/${savedRecipe.id}?imported=true`)
      
    } catch (error) {
      console.error('Failed to save imported recipe:', error)
      alert('Failed to save recipe. Please try again.')
    }
  }

  const handleCancel = () => {
    router.push('/recipes')
  }

  return (
    <StandardPageWrapper moduleName="RECIPES" currentPage="import">
        <UniversalRecipeImporter
          onComplete={handleRecipeComplete}
          onCancel={handleCancel}
        />
    </StandardPageWrapper>
  )
}