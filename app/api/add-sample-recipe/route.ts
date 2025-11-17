// API endpoint to add sample recipe data
// GET /api/add-sample-recipe

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

    // Find Beach Bistro1 client
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .ilike('name', '%beach bistro%')
      .limit(1)

    if (clientError || !clients || clients.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Beach Bistro client not found',
        details: clientError
      }, { status: 404 })
    }

    const clientId = clients[0].id

    // Check if recipe already exists
    const { data: existingRecipes } = await supabase
      .from('recipes')
      .select('id, recipe_name')
      .eq('client_id', clientId)
      .eq('recipe_name', 'Fish & Chips - Classic')

    if (existingRecipes && existingRecipes.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Recipe already exists',
        recipe: existingRecipes[0]
      })
    }

    // Note: Skipping category creation - recipes table may not exist yet

    // Create sample recipe with minimal fields (table may not exist yet)
    const sampleRecipe = {
      client_id: clientId,
      recipe_name: 'Fish & Chips - Classic',
      number_of_portions: 1,
      cost_per_portion: 8.50,
      menu_price: 24.90,
      food_cost_percentage: 34.1,
      instructions: `1. Prepare batter with flour, beer, and seasonings
2. Cut fresh fish into portions and coat in seasoned flour
3. Dip fish in batter and deep fry at 180°C for 4-5 minutes
4. Fry chips until golden and crispy
5. Serve immediately with mushy peas and tartar sauce

Chef Notes:
- Use fresh fish daily
- Maintain oil temperature for best results
- Season chips while hot`,
      is_active: true
    }

    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert(sampleRecipe)
      .select()
      .single()

    if (recipeError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create recipe',
        details: recipeError
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Sample recipe added successfully!',
      recipe: {
        id: recipe.id,
        name: recipe.recipe_name,
        cost_per_portion: recipe.cost_per_portion,
        menu_price: recipe.menu_price,
        food_cost_percentage: recipe.food_cost_percentage,
        url: `/recipes/${recipe.id}`
      }
    })

  } catch (error) {
    console.error('Error adding sample recipe:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}