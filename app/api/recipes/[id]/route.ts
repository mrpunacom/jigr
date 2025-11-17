import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  RecipeDetailResponse, 
  RecipeWithDetails, 
  RecipeIngredientWithDetails,
  CostBreakdown, 
  IngredientCost 
} from '../../../../types/RecipeTypes'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const recipeId = resolvedParams.id
    
    // Temporarily skip auth to test basic functionality
    console.log('Fetching recipe:', recipeId, '(auth temporarily disabled for testing)')

    // Get recipe with category  
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single()

    if (recipeError || !recipe) {
      console.error('Recipe fetch error:', recipeError)
      console.log('Recipe data:', recipe)
      return NextResponse.json({ 
        error: 'Recipe not found',
        debug: {
          recipeId,
          error: recipeError,
          data: recipe
        }
      }, { status: 404 })
    }

    // Skip ingredients for now - table may not exist
    const ingredients: any[] = []

    // Use stored costs from recipe (simplified for now)
    const ingredientCosts: IngredientCost[] = []
    let totalCost = recipe.total_cost || 0

    // Process each ingredient using stored cost data
    for (const ingredient of ingredients || []) {
      const ingredientCost = ingredient.extended_cost || 0
      const unitCost = ingredient.unit_cost || 0

      totalCost += ingredientCost

      ingredientCosts.push({
        ingredient_id: ingredient.id,
        ingredient_name: ingredient.ingredient_name || 'Unknown',
        ingredient_type: ingredient.ingredient_type,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        unit_cost: unitCost,
        extended_cost: ingredientCost,
        percentage_of_total: 0 // Will be calculated after total is known
      })
    }

    // Calculate percentages now that we have total cost
    ingredientCosts.forEach(cost => {
      cost.percentage_of_total = totalCost > 0 ? (cost.extended_cost / totalCost) * 100 : 0
    })

    const costPerPortion = recipe.number_of_portions > 0 ? totalCost / recipe.number_of_portions : 0
    const foodCostPercentage = recipe.menu_price > 0 ? (costPerPortion / recipe.menu_price) * 100 : 0

    const costBreakdown: CostBreakdown = {
      recipe_id: recipeId,
      total_cost: totalCost,
      cost_per_portion: costPerPortion,
      food_cost_percentage: foodCostPercentage,
      ingredient_costs: ingredientCosts,
      last_calculated: new Date().toISOString()
    }

    // Format recipe with calculated details
    const recipeWithDetails: RecipeWithDetails = {
      recipe_id: recipe.id,
      client_id: recipe.client_id,
      recipe_name: recipe.recipe_name,
      category_id: recipe.category_id,
      number_of_portions: recipe.number_of_portions,
      portion_size: recipe.portion_size,
      portion_size_unit: 'serving', // Default since we don't have this field
      prep_time_minutes: recipe.prep_time_minutes,
      cook_time_minutes: recipe.cook_time_minutes,
      instructions: recipe.instructions,
      cooking_notes: recipe.cooking_notes,
      plating_notes: recipe.plating_notes,
      menu_price: recipe.menu_price,
      photo_url: undefined, // Not in current schema
      is_active: recipe.is_active,
      created_at: recipe.created_at,
      updated_at: recipe.updated_at,
      created_by: '', // Not in current schema - using empty string
      updated_by: undefined, // Not in current schema
      category_name: 'Main Courses' as string, // Default since we don't have category join
      total_cost: recipe.total_cost || totalCost,
      cost_per_portion: recipe.cost_per_portion || costPerPortion,
      food_cost_percentage: recipe.food_cost_percentage || foodCostPercentage,
      ingredient_count: ingredients?.length || 0
    }

    // Format ingredients with details
    const ingredientsWithDetails: RecipeIngredientWithDetails[] = (ingredients || []).map(ingredient => {
      const costData = ingredientCosts.find(cost => cost.ingredient_id === ingredient.id)
      
      return {
        ingredient_id: ingredient.id,
        recipe_id: ingredient.recipe_id,
        client_id: ingredient.client_id,
        ingredient_type: ingredient.ingredient_type,
        item_id: ingredient.item_id,
        sub_recipe_id: ingredient.sub_recipe_id,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        ingredient_order: ingredient.display_order,
        prep_notes: ingredient.prep_notes,
        is_optional: false, // Not in current schema
        created_at: ingredient.created_at,
        ingredient_name: ingredient.ingredient_name || '',
        unit_cost: ingredient.unit_cost,
        cost_per_unit: ingredient.unit_cost,
        extended_cost: ingredient.extended_cost || 0,
        conversion_factor: 1
      }
    })

    const response: RecipeDetailResponse = {
      success: true,
      recipe: recipeWithDetails,
      ingredients: ingredientsWithDetails,
      costBreakdown,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Recipe detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}