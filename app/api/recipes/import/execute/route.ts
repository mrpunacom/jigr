/**
 * Recipe Import Execution API
 * 
 * Handles saving validated recipe imports to the database with
 * automatic cost calculation and inventory linking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    // Validate request body
    if (!body.recipes || !Array.isArray(body.recipes)) {
      return NextResponse.json(
        { error: 'recipes array is required' },
        { status: 400 }
      )
    }

    console.log(`📥 Executing recipe import: ${body.recipes.length} recipe(s) for user ${user_id}`)

    const results = {
      imported: [] as any[],
      updated: [] as any[],
      skipped: [] as any[],
      errors: [] as any[]
    }

    // Process each recipe
    for (const recipeData of body.recipes) {
      try {
        // Validate recipe data
        if (!recipeData.recipe_name) {
          results.errors.push({
            recipe: recipeData.recipe_name || 'Unnamed Recipe',
            error: 'Recipe name is required'
          })
          continue
        }

        // Check if recipe already exists
        const { data: existingRecipe } = await supabase
          .from('Recipes')
          .select('id, name')
          .eq('user_id', user_id)
          .eq('name', recipeData.recipe_name)
          .single()

        // Prepare recipe data for database
        const recipeDbData = {
          user_id,
          name: recipeData.recipe_name,
          description: recipeData.description || '',
          recipe_yield: recipeData.servings || 4,
          prep_time_minutes: parseTimeToMinutes(recipeData.prep_time),
          cook_time_minutes: parseTimeToMinutes(recipeData.cook_time),
          total_time_minutes: parseTimeToMinutes(recipeData.total_time),
          difficulty: recipeData.difficulty || 'Medium',
          cuisine: recipeData.cuisine || null,
          instructions: Array.isArray(recipeData.instructions) 
            ? recipeData.instructions.join('\n') 
            : recipeData.instructions || '',
          notes: recipeData.notes || '',
          source_type: recipeData.source || 'import',
          source_url: recipeData.source_url || null,
          is_active: true,
          import_confidence: recipeData.confidence || 0.8,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        let savedRecipe
        
        if (existingRecipe) {
          // Update existing recipe
          const updateData = { ...recipeDbData }
          delete updateData.created_at
          
          const { data: updatedRecipe, error: updateError } = await supabase
            .from('Recipes')
            .update(updateData)
            .eq('id', existingRecipe.id)
            .select()
            .single()

          if (updateError) {
            results.errors.push({
              recipe: recipeData.recipe_name,
              error: updateError.message
            })
            continue
          }

          savedRecipe = updatedRecipe
          results.updated.push(savedRecipe)
        } else {
          // Create new recipe
          const { data: newRecipe, error: insertError } = await supabase
            .from('Recipes')
            .insert(recipeDbData)
            .select()
            .single()

          if (insertError) {
            results.errors.push({
              recipe: recipeData.recipe_name,
              error: insertError.message
            })
            continue
          }

          savedRecipe = newRecipe
          results.imported.push(savedRecipe)
        }

        // Process recipe ingredients
        if (recipeData.processedIngredients || recipeData.ingredients) {
          await processRecipeIngredients(
            savedRecipe.id,
            recipeData.processedIngredients || recipeData.ingredients,
            user_id,
            supabase,
            existingRecipe ? 'update' : 'create'
          )
        }

        // Calculate recipe cost if ingredients are linked
        await calculateRecipeCost(savedRecipe.id, supabase)

      } catch (recipeError) {
        console.error(`Error processing recipe ${recipeData.recipe_name}:`, recipeError)
        results.errors.push({
          recipe: recipeData.recipe_name,
          error: recipeError instanceof Error ? recipeError.message : 'Unknown error'
        })
      }
    }

    // Create import audit log
    const auditData = {
      user_id,
      import_type: 'recipes',
      source_type: body.source_type || 'mixed',
      items_processed: body.recipes.length,
      items_imported: results.imported.length,
      items_updated: results.updated.length,
      items_failed: results.errors.length,
      import_metadata: {
        source: body.source || {},
        timestamp: new Date().toISOString(),
        import_method: body.import_method || 'manual'
      },
      created_at: new Date().toISOString()
    }

    const { error: auditError } = await supabase
      .from('import_audit_log')
      .insert(auditData)

    if (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    console.log(`✅ Recipe import complete: ${results.imported.length} new, ${results.updated.length} updated, ${results.errors.length} errors`)

    return NextResponse.json({
      success: true,
      summary: {
        total: body.recipes.length,
        imported: results.imported.length,
        updated: results.updated.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      results,
      recommendations: generatePostImportRecommendations(results)
    })

  } catch (error) {
    console.error('Recipe import execution error:', error)
    return NextResponse.json(
      { error: 'Failed to execute recipe import' },
      { status: 500 }
    )
  }
}

/**
 * Process and save recipe ingredients
 */
async function processRecipeIngredients(
  recipeId: string,
  ingredients: any[],
  userId: string,
  supabase: any,
  mode: 'create' | 'update'
) {
  if (!ingredients || ingredients.length === 0) return

  // Clear existing ingredients if updating
  if (mode === 'update') {
    await supabase
      .from('RecipeIngredients')
      .delete()
      .eq('recipe_id', recipeId)
  }

  // Prepare ingredient data
  const ingredientData = ingredients.map((ing, index) => ({
    recipe_id: recipeId,
    user_id: userId,
    ingredient_name: ing.name,
    quantity: ing.amount || 0,
    unit: ing.unit || 'units',
    preparation_notes: ing.preparation || null,
    inventory_item_id: ing.best_match_id || null,
    match_confidence: ing.match_confidence || 0,
    unit_conversion_factor: ing.converted_amount ? ing.converted_amount / (ing.amount || 1) : 1,
    converted_quantity: ing.converted_amount || ing.amount || 0,
    sort_order: index + 1,
    is_optional: false,
    created_at: new Date().toISOString()
  }))

  // Insert ingredient records
  const { error: ingredientsError } = await supabase
    .from('RecipeIngredients')
    .insert(ingredientData)

  if (ingredientsError) {
    console.error('Error saving recipe ingredients:', ingredientsError)
    throw new Error(`Failed to save recipe ingredients: ${ingredientsError.message}`)
  }

  console.log(`💾 Saved ${ingredientData.length} ingredients for recipe ${recipeId}`)
}

/**
 * Calculate recipe cost based on linked inventory items
 */
async function calculateRecipeCost(recipeId: string, supabase: any) {
  try {
    // Get recipe ingredients with inventory costs
    const { data: ingredients } = await supabase
      .from('RecipeIngredients')
      .select(`
        *,
        inventory_items!left(
          cost_per_unit,
          unit_of_measurement
        )
      `)
      .eq('recipe_id', recipeId)
      .not('inventory_item_id', 'is', null)

    if (!ingredients || ingredients.length === 0) {
      console.log(`No linked ingredients found for recipe ${recipeId}`)
      return
    }

    let totalCost = 0
    let linkedIngredients = 0

    for (const ingredient of ingredients) {
      if (ingredient.inventory_items && ingredient.inventory_items.cost_per_unit) {
        const cost = ingredient.converted_quantity * ingredient.inventory_items.cost_per_unit
        totalCost += cost
        linkedIngredients++
      }
    }

    if (linkedIngredients > 0) {
      // Get recipe yield to calculate cost per portion
      const { data: recipe } = await supabase
        .from('Recipes')
        .select('recipe_yield')
        .eq('id', recipeId)
        .single()

      const recipeYield = recipe?.recipe_yield || 1
      const costPerPortion = totalCost / recipeYield

      // Update recipe with calculated costs
      const { error: updateError } = await supabase
        .from('Recipes')
        .update({
          cost_per_portion: costPerPortion,
          total_cost: totalCost,
          costed_ingredients: linkedIngredients,
          cost_calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', recipeId)

      if (updateError) {
        console.error('Error updating recipe costs:', updateError)
      } else {
        console.log(`💰 Calculated cost for recipe ${recipeId}: $${costPerPortion.toFixed(2)} per portion`)
      }
    }

  } catch (error) {
    console.error('Recipe cost calculation error:', error)
  }
}

/**
 * Parse time strings to minutes
 */
function parseTimeToMinutes(timeStr: string | null): number | null {
  if (!timeStr) return null
  
  const str = timeStr.toLowerCase()
  let minutes = 0
  
  // Extract hours
  const hoursMatch = str.match(/(\d+)\s*h/)
  if (hoursMatch) {
    minutes += parseInt(hoursMatch[1]) * 60
  }
  
  // Extract minutes
  const minutesMatch = str.match(/(\d+)\s*m/)
  if (minutesMatch) {
    minutes += parseInt(minutesMatch[1])
  }
  
  // If no specific format, try to parse as plain number
  if (minutes === 0) {
    const numberMatch = str.match(/(\d+)/)
    if (numberMatch) {
      minutes = parseInt(numberMatch[1])
    }
  }
  
  return minutes > 0 ? minutes : null
}

/**
 * Generate recommendations after recipe import
 */
function generatePostImportRecommendations(results: any): string[] {
  const recommendations: string[] = []

  if (results.imported.length > 0) {
    recommendations.push(`Successfully imported ${results.imported.length} new recipe(s)`)
  }

  if (results.updated.length > 0) {
    recommendations.push(`Updated ${results.updated.length} existing recipe(s)`)
  }

  if (results.errors.length > 0) {
    recommendations.push(`${results.errors.length} recipe(s) failed to import - check error details`)
  }

  // Success rate recommendations
  const successRate = (results.imported.length + results.updated.length) / 
    (results.imported.length + results.updated.length + results.errors.length)

  if (successRate >= 0.9) {
    recommendations.push('Excellent import success rate!')
  } else if (successRate < 0.7) {
    recommendations.push('Consider reviewing data format to improve import success rate')
  }

  if (results.imported.length > 0 || results.updated.length > 0) {
    recommendations.push('Navigate to Recipes to review and test your imported recipes')
    recommendations.push('Consider running cost analysis to optimize recipe profitability')
    recommendations.push('Link remaining unmatched ingredients to inventory items for accurate costing')
  }

  return recommendations
}