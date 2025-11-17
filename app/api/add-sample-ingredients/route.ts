// API endpoint to add sample ingredients to the Fish & Chips recipe
// GET /api/add-sample-ingredients

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase configuration'
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find the Fish & Chips recipe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, client_id, recipe_name')
      .eq('recipe_name', 'Fish & Chips - Classic')
      .single()

    if (recipeError || !recipe) {
      return NextResponse.json({
        success: false,
        error: 'Fish & Chips recipe not found',
        details: recipeError
      }, { status: 404 })
    }

    // Check if ingredients already exist
    const { data: existingIngredients } = await supabase
      .from('recipe_ingredients')
      .select('id')
      .eq('recipe_id', recipe.id)

    if (existingIngredients && existingIngredients.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Ingredients already exist',
        ingredient_count: existingIngredients.length
      })
    }

    // Sample ingredients for Fish & Chips
    const sampleIngredients = [
      {
        client_id: recipe.client_id,
        recipe_id: recipe.id,
        ingredient_name: 'Fresh White Fish Fillets',
        ingredient_type: 'inventory',
        quantity: 200,
        unit: 'g',
        unit_cost: 0.025,  // $25/kg = $0.025/g
        extended_cost: 5.00,
        prep_notes: 'Cut into portion-sized pieces',
        display_order: 1
      },
      {
        client_id: recipe.client_id,
        recipe_id: recipe.id,
        ingredient_name: 'Plain Flour',
        ingredient_type: 'inventory', 
        quantity: 150,
        unit: 'g',
        unit_cost: 0.003,  // $3/kg = $0.003/g
        extended_cost: 0.45,
        prep_notes: 'For dusting and batter',
        display_order: 2
      },
      {
        client_id: recipe.client_id,
        recipe_id: recipe.id,
        ingredient_name: 'Beer (Lager)',
        ingredient_type: 'inventory',
        quantity: 200,
        unit: 'ml',
        unit_cost: 0.005,  // $5/L = $0.005/ml
        extended_cost: 1.00,
        prep_notes: 'Room temperature for batter',
        display_order: 3
      },
      {
        client_id: recipe.client_id,
        recipe_id: recipe.id,
        ingredient_name: 'Potatoes (Agria)',
        ingredient_type: 'inventory',
        quantity: 300,
        unit: 'g',
        unit_cost: 0.004,  // $4/kg = $0.004/g
        extended_cost: 1.20,
        prep_notes: 'Peel and cut into chips',
        display_order: 4
      },
      {
        client_id: recipe.client_id,
        recipe_id: recipe.id,
        ingredient_name: 'Vegetable Oil',
        ingredient_type: 'inventory',
        quantity: 50,
        unit: 'ml',
        unit_cost: 0.003,  // $3/L = $0.003/ml
        extended_cost: 0.15,
        prep_notes: 'For deep frying',
        display_order: 5
      },
      {
        client_id: recipe.client_id,
        recipe_id: recipe.id,
        ingredient_name: 'Salt',
        ingredient_type: 'inventory',
        quantity: 5,
        unit: 'g',
        unit_cost: 0.002,  // $2/kg = $0.002/g
        extended_cost: 0.01,
        prep_notes: 'To taste',
        display_order: 6
      },
      {
        client_id: recipe.client_id,
        recipe_id: recipe.id,
        ingredient_name: 'Malt Vinegar',
        ingredient_type: 'inventory',
        quantity: 30,
        unit: 'ml',
        unit_cost: 0.008,  // $8/L = $0.008/ml  
        extended_cost: 0.24,
        prep_notes: 'For serving',
        display_order: 7
      },
      {
        client_id: recipe.client_id,
        recipe_id: recipe.id,
        ingredient_name: 'Lemon',
        ingredient_type: 'inventory',
        quantity: 0.5,
        unit: 'each',
        unit_cost: 0.80,  // $0.80 each
        extended_cost: 0.40,
        prep_notes: 'Cut into wedges',
        display_order: 8
      }
    ]

    // Insert ingredients
    const { data: ingredients, error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(sampleIngredients)
      .select()

    if (ingredientsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create ingredients',
        details: ingredientsError
      }, { status: 500 })
    }

    // Calculate total cost and update recipe
    const totalExtendedCost = sampleIngredients.reduce((sum, ing) => sum + ing.extended_cost, 0)
    
    const { error: updateError } = await supabase
      .from('recipes')
      .update({
        total_cost: totalExtendedCost,
        cost_per_portion: totalExtendedCost, // 1 portion
        food_cost_percentage: (totalExtendedCost / 24.90) * 100 // vs menu price of $24.90
      })
      .eq('id', recipe.id)

    if (updateError) {
      console.warn('Failed to update recipe costs:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Sample ingredients added successfully!',
      recipe: {
        id: recipe.id,
        name: recipe.recipe_name,
        ingredient_count: ingredients?.length || 0,
        total_cost: totalExtendedCost,
        url: `/recipes/${recipe.id}`
      }
    })

  } catch (error) {
    console.error('Error adding sample ingredients:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}