/**
 * Recipe Costing Integration API
 * 
 * Handles cross-module integration between Stock and Recipes for:
 * - Real-time recipe cost calculations based on current inventory prices
 * - Recipe profitability analysis with current market costs
 * - Ingredient availability checking for recipe planning
 * - Cost variance tracking and alerts
 * - Bulk recipe cost updates when inventory prices change
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/integration/recipe-costing - Calculate real-time recipe costs
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const recipeId = searchParams.get('recipe_id')
    const includeSubRecipes = searchParams.get('include_sub_recipes') !== 'false'
    const costingMethod = searchParams.get('costing_method') || 'current' // current, average, preferred_vendor
    const includeAvailability = searchParams.get('include_availability') !== 'false'

    console.log(`💰 Calculating recipe costs for user ${user_id}, method: ${costingMethod}`)

    let results: any = {}

    if (recipeId) {
      // Calculate cost for specific recipe
      results = await calculateRecipeCost({
        recipeId,
        userId: user_id,
        includeSubRecipes,
        costingMethod,
        includeAvailability,
        supabase
      })
    } else {
      // Calculate costs for all recipes
      results = await calculateAllRecipeCosts({
        userId: user_id,
        includeSubRecipes,
        costingMethod,
        includeAvailability,
        supabase
      })
    }

    return NextResponse.json({
      costingMethod,
      calculatedAt: new Date().toISOString(),
      ...results
    })

  } catch (error) {
    console.error('Recipe costing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/integration/recipe-costing/update - Update recipe costs when inventory changes
export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    const { trigger_type, inventory_item_ids, recipe_ids } = body

    console.log(`🔄 Triggering recipe cost updates - trigger: ${trigger_type}`)

    let updateResults: any = {}

    if (trigger_type === 'inventory_price_change') {
      updateResults = await updateRecipeCostsFromInventoryChange({
        inventoryItemIds: inventory_item_ids || [],
        userId: user_id,
        supabase
      })
    } else if (trigger_type === 'recipe_modification') {
      updateResults = await updateSpecificRecipeCosts({
        recipeIds: recipe_ids || [],
        userId: user_id,
        supabase
      })
    } else if (trigger_type === 'bulk_recalculation') {
      updateResults = await performBulkRecipeCostRecalculation({
        userId: user_id,
        supabase
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid trigger_type. Use inventory_price_change, recipe_modification, or bulk_recalculation' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      trigger_type,
      ...updateResults
    })

  } catch (error) {
    console.error('Recipe cost update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Calculate cost for a specific recipe
 */
async function calculateRecipeCost(params: {
  recipeId: string
  userId: string
  includeSubRecipes: boolean
  costingMethod: string
  includeAvailability: boolean
  supabase: any
}): Promise<any> {
  const { recipeId, userId, includeSubRecipes, costingMethod, includeAvailability, supabase } = params

  try {
    // Get recipe details with ingredients
    const { data: recipe, error: recipeError } = await supabase
      .from('Recipes')
      .select(`
        id,
        name,
        description,
        yield_amount,
        yield_unit,
        total_cost,
        cost_per_serving,
        prep_time_minutes,
        created_at,
        updated_at,
        RecipeIngredients:RecipeIngredients(
          id,
          quantity_needed,
          unit,
          notes,
          is_optional,
          cost_per_unit,
          total_cost,
          InventoryItems:inventory_items(
            id,
            item_name,
            current_quantity,
            unit_of_measurement,
            cost_per_unit,
            category
          )
        ),
        SubRecipeComponents:SubRecipeComponents(
          id,
          quantity_needed,
          unit,
          cost_per_unit,
          total_cost,
          SubRecipe:sub_recipes!sub_recipe_id(
            id,
            name,
            yield_amount,
            yield_unit,
            total_cost
          )
        )
      `)
      .eq('id', recipeId)
      .eq('user_id', userId)
      .single()

    if (recipeError || !recipe) {
      return { error: 'Recipe not found' }
    }

    // Calculate ingredient costs
    const ingredientCosts = await calculateIngredientCosts({
      ingredients: recipe.RecipeIngredients || [],
      costingMethod,
      includeAvailability,
      supabase
    })

    // Calculate sub-recipe costs if included
    let subRecipeCosts: any = { items: [], totalCost: 0 }
    if (includeSubRecipes && recipe.SubRecipeComponents?.length > 0) {
      subRecipeCosts = await calculateSubRecipeCosts({
        subRecipeComponents: recipe.SubRecipeComponents,
        costingMethod,
        supabase
      })
    }

    // Calculate totals
    const totalIngredientCost = ingredientCosts.totalCost
    const totalSubRecipeCost = subRecipeCosts.totalCost
    const totalRecipeCost = totalIngredientCost + totalSubRecipeCost

    // Calculate per-serving cost
    const yieldAmount = recipe.yield_amount || 1
    const costPerServing = totalRecipeCost / yieldAmount

    // Calculate cost variance from stored cost
    const storedCost = recipe.total_cost || 0
    const costVariance = storedCost > 0 ? 
      ((totalRecipeCost - storedCost) / storedCost) * 100 : 0

    // Check availability status
    let availabilityStatus = 'available'
    if (includeAvailability) {
      const unavailableIngredients = ingredientCosts.items.filter(
        (item: any) => item.availability.status === 'insufficient'
      ).length

      if (unavailableIngredients > 0) {
        availabilityStatus = unavailableIngredients === ingredientCosts.items.length ? 
          'unavailable' : 'partially_available'
      }
    }

    return {
      recipe: {
        id: recipe.id,
        name: recipe.name,
        yieldAmount: recipe.yield_amount,
        yieldUnit: recipe.yield_unit
      },
      costing: {
        ingredients: ingredientCosts,
        subRecipes: subRecipeCosts,
        totals: {
          totalCost: Math.round(totalRecipeCost * 100) / 100,
          costPerServing: Math.round(costPerServing * 100) / 100,
          ingredientCost: Math.round(totalIngredientCost * 100) / 100,
          subRecipeCost: Math.round(totalSubRecipeCost * 100) / 100
        },
        variance: {
          storedCost,
          currentCost: Math.round(totalRecipeCost * 100) / 100,
          variance: Math.round(costVariance * 100) / 100,
          varianceDirection: costVariance > 0 ? 'increase' : costVariance < 0 ? 'decrease' : 'stable'
        }
      },
      availability: {
        status: availabilityStatus,
        canMake: availabilityStatus !== 'unavailable'
      }
    }

  } catch (error) {
    console.error('Recipe cost calculation error:', error)
    return { error: 'Failed to calculate recipe cost' }
  }
}

/**
 * Calculate costs for all recipes
 */
async function calculateAllRecipeCosts(params: {
  userId: string
  includeSubRecipes: boolean
  costingMethod: string
  includeAvailability: boolean
  supabase: any
}): Promise<any> {
  const { userId, includeSubRecipes, costingMethod, includeAvailability, supabase } = params

  try {
    // Get all active recipes
    const { data: recipes, error: recipesError } = await supabase
      .from('Recipes')
      .select('id, name, total_cost, yield_amount')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (recipesError || !recipes) {
      return { error: 'Failed to fetch recipes' }
    }

    const results = []
    let totalProcessed = 0
    let totalErrors = 0

    for (const recipe of recipes) {
      try {
        const recipeCosting = await calculateRecipeCost({
          recipeId: recipe.id,
          userId,
          includeSubRecipes,
          costingMethod,
          includeAvailability,
          supabase
        })

        if (recipeCosting.error) {
          totalErrors++
        } else {
          results.push(recipeCosting)
        }
        
        totalProcessed++

      } catch (error) {
        console.error(`Error calculating cost for recipe ${recipe.id}:`, error)
        totalErrors++
      }
    }

    // Calculate summary statistics
    const validResults = results.filter(r => !r.error)
    const totalCostingValue = validResults.reduce((sum, result) => 
      sum + result.costing.totals.totalCost, 0)
    
    const avgCostPerRecipe = validResults.length > 0 ? 
      totalCostingValue / validResults.length : 0

    const costVariances = validResults.map(r => r.costing.variance.variance)
    const avgCostVariance = costVariances.length > 0 ? 
      costVariances.reduce((sum, v) => sum + Math.abs(v), 0) / costVariances.length : 0

    return {
      summary: {
        totalRecipes: recipes.length,
        processedRecipes: totalProcessed,
        successfulCalculations: validResults.length,
        errors: totalErrors,
        totalCostingValue: Math.round(totalCostingValue * 100) / 100,
        averageCostPerRecipe: Math.round(avgCostPerRecipe * 100) / 100,
        averageCostVariance: Math.round(avgCostVariance * 100) / 100
      },
      recipes: validResults.slice(0, 100), // Limit response size
      warnings: totalErrors > 0 ? [`${totalErrors} recipes had calculation errors`] : []
    }

  } catch (error) {
    console.error('All recipes cost calculation error:', error)
    return { error: 'Failed to calculate recipe costs' }
  }
}

/**
 * Calculate ingredient costs with different costing methods
 */
async function calculateIngredientCosts(params: {
  ingredients: any[]
  costingMethod: string
  includeAvailability: boolean
  supabase: any
}): Promise<any> {
  const { ingredients, costingMethod, includeAvailability, supabase } = params

  const costCalculations = []
  let totalCost = 0

  for (const ingredient of ingredients) {
    const inventoryItem = ingredient.InventoryItems
    if (!inventoryItem) {
      costCalculations.push({
        ingredientId: ingredient.id,
        itemName: 'Unknown Item',
        quantityNeeded: ingredient.quantity_needed,
        unit: ingredient.unit,
        cost: 0,
        availability: { status: 'unknown', message: 'Item not linked to inventory' }
      })
      continue
    }

    // Calculate cost based on method
    let unitCost = 0
    let costSource = 'unknown'

    switch (costingMethod) {
      case 'current':
        unitCost = inventoryItem.cost_per_unit || 0
        costSource = 'current_inventory_price'
        break
      
      case 'preferred_vendor':
        // Get preferred vendor cost
        const { data: preferredVendor } = await supabase
          .from('VendorItems')
          .select('cost_per_unit')
          .eq('inventory_item_id', inventoryItem.id)
          .eq('is_preferred', true)
          .single()
        
        unitCost = preferredVendor?.cost_per_unit || inventoryItem.cost_per_unit || 0
        costSource = preferredVendor ? 'preferred_vendor' : 'current_inventory_price'
        break
      
      case 'average':
        // Calculate average from recent purchase orders
        const { data: recentCosts } = await supabase
          .from('PurchaseOrderItems')
          .select('unit_cost')
          .eq('VendorItems.inventory_item_id', inventoryItem.id)
          .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
          .limit(10)
        
        if (recentCosts && recentCosts.length > 0) {
          unitCost = recentCosts.reduce((sum, item) => sum + item.unit_cost, 0) / recentCosts.length
          costSource = 'average_recent_purchases'
        } else {
          unitCost = inventoryItem.cost_per_unit || 0
          costSource = 'current_inventory_price'
        }
        break
    }

    const totalIngredientCost = ingredient.quantity_needed * unitCost
    totalCost += totalIngredientCost

    // Check availability
    let availability = { status: 'available', message: 'Sufficient stock' }
    if (includeAvailability) {
      const currentStock = inventoryItem.current_quantity || 0
      const requiredQty = ingredient.quantity_needed

      if (currentStock < requiredQty) {
        const shortfall = requiredQty - currentStock
        availability = {
          status: currentStock > 0 ? 'insufficient' : 'out_of_stock',
          message: `Need ${requiredQty}, have ${currentStock} (short ${shortfall})`
        }
      }
    }

    costCalculations.push({
      ingredientId: ingredient.id,
      inventoryItemId: inventoryItem.id,
      itemName: inventoryItem.item_name,
      quantityNeeded: ingredient.quantity_needed,
      unit: ingredient.unit,
      unitCost: Math.round(unitCost * 100) / 100,
      totalCost: Math.round(totalIngredientCost * 100) / 100,
      costSource,
      availability,
      isOptional: ingredient.is_optional
    })
  }

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    itemCount: costCalculations.length,
    items: costCalculations,
    summary: {
      availableItems: costCalculations.filter(item => item.availability.status === 'available').length,
      insufficientItems: costCalculations.filter(item => item.availability.status === 'insufficient').length,
      outOfStockItems: costCalculations.filter(item => item.availability.status === 'out_of_stock').length,
      optionalItems: costCalculations.filter(item => item.isOptional).length
    }
  }
}

/**
 * Calculate sub-recipe costs
 */
async function calculateSubRecipeCosts(params: {
  subRecipeComponents: any[]
  costingMethod: string
  supabase: any
}): Promise<any> {
  const { subRecipeComponents, costingMethod, supabase } = params

  const subRecipeCosts = []
  let totalCost = 0

  for (const component of subRecipeComponents) {
    const subRecipe = component.SubRecipe
    if (!subRecipe) continue

    // For sub-recipes, we'll use the stored cost or recalculate if needed
    let unitCost = subRecipe.total_cost || 0
    const yieldAmount = subRecipe.yield_amount || 1
    const costPerUnit = unitCost / yieldAmount
    const totalComponentCost = component.quantity_needed * costPerUnit

    totalCost += totalComponentCost

    subRecipeCosts.push({
      subRecipeId: subRecipe.id,
      subRecipeName: subRecipe.name,
      quantityNeeded: component.quantity_needed,
      unit: component.unit,
      unitCost: Math.round(costPerUnit * 100) / 100,
      totalCost: Math.round(totalComponentCost * 100) / 100,
      yieldAmount: subRecipe.yield_amount,
      subRecipeTotalCost: subRecipe.total_cost
    })
  }

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    itemCount: subRecipeCosts.length,
    items: subRecipeCosts
  }
}

/**
 * Update recipe costs when inventory prices change
 */
async function updateRecipeCostsFromInventoryChange(params: {
  inventoryItemIds: string[]
  userId: string
  supabase: any
}): Promise<any> {
  const { inventoryItemIds, userId, supabase } = params

  try {
    // Find all recipes that use these inventory items
    const { data: affectedRecipes } = await supabase
      .from('RecipeIngredients')
      .select(`
        recipe_id,
        Recipes:Recipes(
          id,
          name,
          total_cost
        )
      `)
      .in('inventory_item_id', inventoryItemIds)

    if (!affectedRecipes || affectedRecipes.length === 0) {
      return {
        message: 'No recipes affected by inventory price changes',
        updatedRecipes: 0
      }
    }

    // Get unique recipe IDs
    const recipeIds = [...new Set(affectedRecipes.map(r => r.recipe_id))]
    
    const updateResults = []
    
    for (const recipeId of recipeIds) {
      try {
        // Recalculate recipe cost
        const costingResult = await calculateRecipeCost({
          recipeId,
          userId,
          includeSubRecipes: true,
          costingMethod: 'current',
          includeAvailability: false,
          supabase
        })

        if (!costingResult.error) {
          const newTotalCost = costingResult.costing.totals.totalCost
          const newCostPerServing = costingResult.costing.totals.costPerServing

          // Update stored costs in database
          const { error: updateError } = await supabase
            .from('Recipes')
            .update({
              total_cost: newTotalCost,
              cost_per_serving: newCostPerServing,
              cost_last_updated: new Date().toISOString()
            })
            .eq('id', recipeId)
            .eq('user_id', userId)

          if (!updateError) {
            updateResults.push({
              recipeId,
              recipeName: costingResult.recipe.name,
              previousCost: costingResult.costing.variance.storedCost,
              newCost: newTotalCost,
              costChange: newTotalCost - costingResult.costing.variance.storedCost
            })
          }
        }

      } catch (error) {
        console.error(`Error updating recipe ${recipeId}:`, error)
      }
    }

    return {
      affectedRecipeCount: recipeIds.length,
      successfulUpdates: updateResults.length,
      updatedRecipes: updateResults,
      averageCostChange: updateResults.length > 0 ? 
        updateResults.reduce((sum, r) => sum + r.costChange, 0) / updateResults.length : 0
    }

  } catch (error) {
    console.error('Inventory change update error:', error)
    return { error: 'Failed to update recipe costs from inventory changes' }
  }
}

/**
 * Update specific recipe costs
 */
async function updateSpecificRecipeCosts(params: {
  recipeIds: string[]
  userId: string
  supabase: any
}): Promise<any> {
  const { recipeIds, userId, supabase } = params

  const updateResults = []

  for (const recipeId of recipeIds) {
    try {
      const costingResult = await calculateRecipeCost({
        recipeId,
        userId,
        includeSubRecipes: true,
        costingMethod: 'current',
        includeAvailability: false,
        supabase
      })

      if (!costingResult.error) {
        const newTotalCost = costingResult.costing.totals.totalCost
        const newCostPerServing = costingResult.costing.totals.costPerServing

        const { error: updateError } = await supabase
          .from('Recipes')
          .update({
            total_cost: newTotalCost,
            cost_per_serving: newCostPerServing,
            cost_last_updated: new Date().toISOString()
          })
          .eq('id', recipeId)
          .eq('user_id', userId)

        if (!updateError) {
          updateResults.push({
            recipeId,
            recipeName: costingResult.recipe.name,
            newCost: newTotalCost,
            success: true
          })
        }
      }

    } catch (error) {
      updateResults.push({
        recipeId,
        error: error.message,
        success: false
      })
    }
  }

  return {
    totalRecipes: recipeIds.length,
    successfulUpdates: updateResults.filter(r => r.success).length,
    results: updateResults
  }
}

/**
 * Perform bulk recalculation of all recipe costs
 */
async function performBulkRecipeCostRecalculation(params: {
  userId: string
  supabase: any
}): Promise<any> {
  const { userId, supabase } = params

  try {
    // Get all active recipes
    const { data: recipes } = await supabase
      .from('Recipes')
      .select('id, name')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (!recipes || recipes.length === 0) {
      return { message: 'No active recipes found', updatedRecipes: 0 }
    }

    const recipeIds = recipes.map(r => r.id)
    
    const result = await updateSpecificRecipeCosts({
      recipeIds,
      userId,
      supabase
    })

    return {
      ...result,
      bulkRecalculation: true,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('Bulk recalculation error:', error)
    return { error: 'Failed to perform bulk recipe cost recalculation' }
  }
}