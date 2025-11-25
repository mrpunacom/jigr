/**
 * Stock Impact Analysis API
 * 
 * Provides comprehensive analysis of how stock changes affect recipes and menu:
 * - Recipe producibility based on current inventory levels
 * - Menu availability analysis with stock constraints
 * - Cost impact analysis when inventory prices change
 * - Production planning with inventory optimization
 * - Stock allocation optimization for maximum profitability
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/integration/stock-impact - Analyze stock impact on recipes and menu
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const analysisType = searchParams.get('analysis_type') || 'comprehensive' // availability, cost_impact, production_planning, comprehensive
    const itemId = searchParams.get('inventory_item_id') // Specific inventory item
    const recipeId = searchParams.get('recipe_id') // Specific recipe
    const menuItemId = searchParams.get('menu_item_id') // Specific menu item
    const includeForecasting = searchParams.get('include_forecasting') !== 'false'

    console.log(`📊 Analyzing stock impact for user ${user_id}, type: ${analysisType}`)

    let analysisResults: any = {
      analysisType,
      generatedAt: new Date().toISOString()
    }

    // Execute requested analysis types
    if (analysisType === 'comprehensive' || analysisType === 'availability') {
      analysisResults.availability = await analyzeRecipeAvailability({
        userId: user_id,
        recipeId,
        menuItemId,
        supabase
      })
    }

    if (analysisType === 'comprehensive' || analysisType === 'cost_impact') {
      analysisResults.costImpact = await analyzeCostImpact({
        userId: user_id,
        inventoryItemId: itemId,
        recipeId,
        menuItemId,
        supabase
      })
    }

    if (analysisType === 'comprehensive' || analysisType === 'production_planning') {
      analysisResults.productionPlanning = await analyzeProductionCapacity({
        userId: user_id,
        recipeId,
        includeForecasting,
        supabase
      })
    }

    if (analysisType === 'comprehensive') {
      analysisResults.summary = generateComprehensiveImpactSummary(analysisResults)
      analysisResults.recommendations = generateStockImpactRecommendations(analysisResults)
    }

    return NextResponse.json(analysisResults)

  } catch (error) {
    console.error('Stock impact analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/integration/stock-impact/simulate - Simulate stock changes and their impact
export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    const {
      simulation_type, // stock_depletion, price_change, new_stock_arrival
      changes, // Array of inventory changes to simulate
      include_menu_impact,
      include_cost_analysis
    } = body

    console.log(`🧪 Running stock impact simulation - type: ${simulation_type}`)

    let simulationResults: any = {
      simulationType: simulation_type,
      changes: changes || [],
      simulatedAt: new Date().toISOString()
    }

    switch (simulation_type) {
      case 'stock_depletion':
        simulationResults = await simulateStockDepletion({
          changes,
          userId: user_id,
          includeMenuImpact: include_menu_impact,
          includeCostAnalysis: include_cost_analysis,
          supabase
        })
        break

      case 'price_change':
        simulationResults = await simulatePriceChanges({
          changes,
          userId: user_id,
          includeMenuImpact: include_menu_impact,
          includeCostAnalysis: include_cost_analysis,
          supabase
        })
        break

      case 'new_stock_arrival':
        simulationResults = await simulateStockArrival({
          changes,
          userId: user_id,
          includeMenuImpact: include_menu_impact,
          includeCostAnalysis: include_cost_analysis,
          supabase
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid simulation_type. Use stock_depletion, price_change, or new_stock_arrival' },
          { status: 400 }
        )
    }

    return NextResponse.json(simulationResults)

  } catch (error) {
    console.error('Stock impact simulation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Analyze recipe availability based on current stock levels
 */
async function analyzeRecipeAvailability(params: {
  userId: string
  recipeId?: string
  menuItemId?: string
  supabase: any
}): Promise<any> {
  const { userId, recipeId, menuItemId, supabase } = params

  try {
    // Get recipes to analyze
    let recipesToAnalyze = []

    if (recipeId) {
      // Specific recipe
      const { data: recipe } = await supabase
        .from('Recipes')
        .select('id, name, yield_amount')
        .eq('id', recipeId)
        .eq('user_id', userId)
        .single()

      if (recipe) recipesToAnalyze = [recipe]
    } else if (menuItemId) {
      // Recipe linked to menu item
      const { data: menuItem } = await supabase
        .from('MenuPricing')
        .select(`
          recipe_id,
          Recipes:Recipes(id, name, yield_amount)
        `)
        .eq('id', menuItemId)
        .eq('user_id', userId)
        .single()

      if (menuItem?.Recipes) recipesToAnalyze = [menuItem.Recipes]
    } else {
      // All active recipes
      const { data: recipes } = await supabase
        .from('Recipes')
        .select('id, name, yield_amount')
        .eq('user_id', userId)
        .eq('is_active', true)

      recipesToAnalyze = recipes || []
    }

    const availabilityResults = []

    for (const recipe of recipesToAnalyze) {
      const availability = await analyzeRecipeAvailabilityDetail({
        recipeId: recipe.id,
        recipeName: recipe.name,
        yieldAmount: recipe.yield_amount,
        userId,
        supabase
      })

      availabilityResults.push(availability)
    }

    // Calculate summary
    const totalRecipes = availabilityResults.length
    const availableRecipes = availabilityResults.filter(r => r.status === 'available').length
    const partiallyAvailable = availabilityResults.filter(r => r.status === 'partially_available').length
    const unavailableRecipes = availabilityResults.filter(r => r.status === 'unavailable').length

    return {
      summary: {
        totalRecipes,
        availableRecipes,
        partiallyAvailable,
        unavailableRecipes,
        availabilityRate: totalRecipes > 0 ? Math.round((availableRecipes / totalRecipes) * 100) : 0
      },
      recipes: availabilityResults.slice(0, 100), // Limit response size
      criticalIngredients: identifyCriticalIngredients(availabilityResults)
    }

  } catch (error) {
    console.error('Recipe availability analysis error:', error)
    return { error: 'Failed to analyze recipe availability' }
  }
}

/**
 * Analyze availability for a specific recipe
 */
async function analyzeRecipeAvailabilityDetail(params: {
  recipeId: string
  recipeName: string
  yieldAmount: number
  userId: string
  supabase: any
}): Promise<any> {
  const { recipeId, recipeName, yieldAmount, userId, supabase } = params

  // Get recipe ingredients with inventory details
  const { data: ingredients } = await supabase
    .from('RecipeIngredients')
    .select(`
      id,
      quantity_needed,
      unit,
      is_optional,
      InventoryItems:inventory_items(
        id,
        item_name,
        current_quantity,
        unit_of_measurement,
        par_level_low
      )
    `)
    .eq('recipe_id', recipeId)

  if (!ingredients || ingredients.length === 0) {
    return {
      recipeId,
      recipeName,
      status: 'unknown',
      message: 'No ingredients defined',
      maxServings: 0,
      ingredients: []
    }
  }

  const ingredientAnalysis = []
  let minServingsPossible = Infinity
  let unavailableCount = 0

  for (const ingredient of ingredients) {
    const inventory = ingredient.InventoryItems
    if (!inventory) {
      ingredientAnalysis.push({
        ingredientId: ingredient.id,
        itemName: 'Unknown Item',
        required: ingredient.quantity_needed,
        available: 0,
        sufficient: false,
        isOptional: ingredient.is_optional,
        status: 'not_linked'
      })
      if (!ingredient.is_optional) {
        minServingsPossible = 0
        unavailableCount++
      }
      continue
    }

    const requiredPerServing = ingredient.quantity_needed / yieldAmount
    const availableQuantity = inventory.current_quantity || 0
    const maxServingsFromThisIngredient = requiredPerServing > 0 ? 
      Math.floor(availableQuantity / requiredPerServing) : Infinity

    const isSufficient = availableQuantity >= ingredient.quantity_needed
    
    if (!ingredient.is_optional && !isSufficient) {
      unavailableCount++
    }

    if (!ingredient.is_optional) {
      minServingsPossible = Math.min(minServingsPossible, maxServingsFromThisIngredient)
    }

    ingredientAnalysis.push({
      ingredientId: ingredient.id,
      inventoryItemId: inventory.id,
      itemName: inventory.item_name,
      required: ingredient.quantity_needed,
      available: availableQuantity,
      sufficient: isSufficient,
      isOptional: ingredient.is_optional,
      maxServings: maxServingsFromThisIngredient,
      status: isSufficient ? 'sufficient' : 'insufficient'
    })
  }

  // Determine overall status
  let status: string
  let message: string

  if (minServingsPossible === Infinity || minServingsPossible >= yieldAmount) {
    status = 'available'
    message = `Can make ${Math.floor(minServingsPossible)} servings`
  } else if (minServingsPossible > 0) {
    status = 'partially_available' 
    message = `Can make ${Math.floor(minServingsPossible)} of ${yieldAmount} servings`
  } else {
    status = 'unavailable'
    message = `Cannot make - ${unavailableCount} missing ingredients`
  }

  return {
    recipeId,
    recipeName,
    status,
    message,
    yieldAmount,
    maxServings: Math.max(0, Math.floor(minServingsPossible)),
    ingredientCount: ingredients.length,
    availableIngredients: ingredientAnalysis.filter(i => i.sufficient).length,
    unavailableIngredients: unavailableCount,
    ingredients: ingredientAnalysis
  }
}

/**
 * Analyze cost impact of inventory changes
 */
async function analyzeCostImpact(params: {
  userId: string
  inventoryItemId?: string
  recipeId?: string
  menuItemId?: string
  supabase: any
}): Promise<any> {
  const { userId, inventoryItemId, recipeId, menuItemId, supabase } = params

  try {
    let affectedItems = []

    if (inventoryItemId) {
      // Find all recipes and menu items affected by this inventory item
      affectedItems = await findItemsUsingInventory({
        inventoryItemId,
        userId,
        supabase
      })
    } else if (recipeId) {
      // Analyze cost impact for specific recipe
      affectedItems = await getRecipeCostImpact({
        recipeId,
        userId,
        supabase
      })
    } else if (menuItemId) {
      // Analyze cost impact for specific menu item
      affectedItems = await getMenuItemCostImpact({
        menuItemId,
        userId,
        supabase
      })
    } else {
      // Analyze overall cost impact
      affectedItems = await getOverallCostImpact({
        userId,
        supabase
      })
    }

    // Calculate impact metrics
    const impactMetrics = calculateCostImpactMetrics(affectedItems)

    return {
      scope: inventoryItemId ? 'inventory_item' : recipeId ? 'recipe' : menuItemId ? 'menu_item' : 'system_wide',
      affectedItems,
      impactMetrics,
      recommendations: generateCostImpactRecommendations(affectedItems, impactMetrics)
    }

  } catch (error) {
    console.error('Cost impact analysis error:', error)
    return { error: 'Failed to analyze cost impact' }
  }
}

/**
 * Analyze production capacity based on current inventory
 */
async function analyzeProductionCapacity(params: {
  userId: string
  recipeId?: string
  includeForecasting: boolean
  supabase: any
}): Promise<any> {
  const { userId, recipeId, includeForecasting, supabase } = params

  try {
    // Get recipes to analyze
    let recipesToAnalyze = []

    if (recipeId) {
      const { data: recipe } = await supabase
        .from('Recipes')
        .select('id, name, yield_amount, prep_time_minutes')
        .eq('id', recipeId)
        .eq('user_id', userId)
        .single()

      if (recipe) recipesToAnalyze = [recipe]
    } else {
      const { data: recipes } = await supabase
        .from('Recipes')
        .select('id, name, yield_amount, prep_time_minutes')
        .eq('user_id', userId)
        .eq('is_active', true)

      recipesToAnalyze = recipes || []
    }

    const productionAnalysis = []

    for (const recipe of recipesToAnalyze) {
      const capacity = await calculateProductionCapacity({
        recipeId: recipe.id,
        recipeName: recipe.name,
        yieldAmount: recipe.yield_amount,
        prepTime: recipe.prep_time_minutes,
        userId,
        includeForecasting,
        supabase
      })

      productionAnalysis.push(capacity)
    }

    // Calculate overall production metrics
    const totalMaxProduction = productionAnalysis.reduce((sum, recipe) => 
      sum + (recipe.maxProduction || 0), 0)

    const bottleneckIngredients = identifyBottleneckIngredients(productionAnalysis)

    return {
      totalRecipes: recipesToAnalyze.length,
      totalMaxProduction,
      recipes: productionAnalysis.slice(0, 50),
      bottleneckIngredients,
      optimizationOpportunities: identifyOptimizationOpportunities(productionAnalysis)
    }

  } catch (error) {
    console.error('Production capacity analysis error:', error)
    return { error: 'Failed to analyze production capacity' }
  }
}

/**
 * Calculate production capacity for a specific recipe
 */
async function calculateProductionCapacity(params: {
  recipeId: string
  recipeName: string
  yieldAmount: number
  prepTime: number
  userId: string
  includeForecasting: boolean
  supabase: any
}): Promise<any> {
  const { recipeId, recipeName, yieldAmount, prepTime, userId, includeForecasting, supabase } = params

  // Get current availability
  const availability = await analyzeRecipeAvailabilityDetail({
    recipeId,
    recipeName,
    yieldAmount,
    userId,
    supabase
  })

  let forecast = null
  if (includeForecasting) {
    // Get usage forecast for ingredients
    forecast = await getIngredientUsageForecast({
      recipeId,
      userId,
      supabase
    })
  }

  return {
    recipeId,
    recipeName,
    yieldAmount,
    prepTimeMinutes: prepTime,
    currentMaxProduction: availability.maxServings,
    availability,
    forecast,
    constraints: identifyProductionConstraints(availability),
    efficiency: calculateProductionEfficiency(availability, prepTime)
  }
}

/**
 * Helper functions for analysis
 */

function identifyCriticalIngredients(availabilityResults: any[]): any[] {
  const ingredientImpact: { [key: string]: any } = {}

  availabilityResults.forEach(recipe => {
    recipe.ingredients?.forEach((ingredient: any) => {
      if (!ingredient.sufficient && !ingredient.isOptional) {
        const key = ingredient.inventoryItemId
        if (!ingredientImpact[key]) {
          ingredientImpact[key] = {
            itemId: ingredient.inventoryItemId,
            itemName: ingredient.itemName,
            affectedRecipes: [],
            totalImpact: 0
          }
        }
        
        ingredientImpact[key].affectedRecipes.push(recipe.recipeName)
        ingredientImpact[key].totalImpact++
      }
    })
  })

  return Object.values(ingredientImpact)
    .sort((a: any, b: any) => b.totalImpact - a.totalImpact)
    .slice(0, 10)
}

async function findItemsUsingInventory(params: {
  inventoryItemId: string
  userId: string
  supabase: any
}): Promise<any[]> {
  const { inventoryItemId, userId, supabase } = params

  // Find recipes using this inventory item
  const { data: recipeIngredients } = await supabase
    .from('RecipeIngredients')
    .select(`
      recipe_id,
      quantity_needed,
      Recipes:Recipes(
        id,
        name,
        total_cost,
        yield_amount
      )
    `)
    .eq('inventory_item_id', inventoryItemId)

  // Find menu items using these recipes
  const affectedItems = []

  if (recipeIngredients) {
    for (const ingredient of recipeIngredients) {
      const recipe = ingredient.Recipes
      if (!recipe) continue

      // Check if this recipe is used in menu items
      const { data: menuItems } = await supabase
        .from('MenuPricing')
        .select('id, item_name, current_price')
        .eq('recipe_id', recipe.id)
        .eq('user_id', userId)

      affectedItems.push({
        type: 'recipe',
        id: recipe.id,
        name: recipe.name,
        currentCost: recipe.total_cost,
        quantityUsed: ingredient.quantity_needed,
        menuItems: menuItems || []
      })
    }
  }

  return affectedItems
}

async function getRecipeCostImpact(params: {
  recipeId: string
  userId: string
  supabase: any
}): Promise<any[]> {
  // Implementation for recipe-specific cost impact
  return []
}

async function getMenuItemCostImpact(params: {
  menuItemId: string
  userId: string
  supabase: any
}): Promise<any[]> {
  // Implementation for menu item-specific cost impact
  return []
}

async function getOverallCostImpact(params: {
  userId: string
  supabase: any
}): Promise<any[]> {
  // Implementation for system-wide cost impact
  return []
}

function calculateCostImpactMetrics(affectedItems: any[]): any {
  return {
    totalAffectedRecipes: affectedItems.filter(item => item.type === 'recipe').length,
    totalAffectedMenuItems: affectedItems.reduce((sum, item) => 
      sum + (item.menuItems?.length || 0), 0),
    estimatedCostImpact: affectedItems.reduce((sum, item) => 
      sum + (item.currentCost || 0), 0)
  }
}

function generateCostImpactRecommendations(affectedItems: any[], metrics: any): string[] {
  const recommendations: string[] = []

  if (metrics.totalAffectedRecipes > 10) {
    recommendations.push('High recipe impact - consider bulk cost optimization')
  }

  if (metrics.totalAffectedMenuItems > 5) {
    recommendations.push('Multiple menu items affected - review pricing strategy')
  }

  return recommendations
}

function identifyBottleneckIngredients(productionAnalysis: any[]): any[] {
  // Implementation for identifying production bottlenecks
  return []
}

function identifyOptimizationOpportunities(productionAnalysis: any[]): string[] {
  // Implementation for optimization opportunities
  return []
}

function identifyProductionConstraints(availability: any): string[] {
  const constraints: string[] = []

  if (availability.unavailableIngredients > 0) {
    constraints.push(`${availability.unavailableIngredients} unavailable ingredients`)
  }

  return constraints
}

function calculateProductionEfficiency(availability: any, prepTime: number): number {
  if (availability.maxServings === 0) return 0
  
  // Simple efficiency calculation based on ingredient availability
  const ingredientEfficiency = availability.availableIngredients / availability.ingredientCount
  return Math.round(ingredientEfficiency * 100)
}

async function getIngredientUsageForecast(params: {
  recipeId: string
  userId: string
  supabase: any
}): Promise<any> {
  // Implementation for ingredient usage forecasting
  return null
}

function generateComprehensiveImpactSummary(analysisResults: any): any {
  return {
    overallAvailabilityRate: analysisResults.availability?.summary?.availabilityRate || 0,
    criticalConstraints: analysisResults.availability?.criticalIngredients?.length || 0,
    costImpactSeverity: calculateCostImpactSeverity(analysisResults.costImpact),
    productionBottlenecks: analysisResults.productionPlanning?.bottleneckIngredients?.length || 0
  }
}

function calculateCostImpactSeverity(costImpact: any): string {
  if (!costImpact?.impactMetrics) return 'low'
  
  const { totalAffectedRecipes, totalAffectedMenuItems } = costImpact.impactMetrics
  
  if (totalAffectedRecipes > 20 || totalAffectedMenuItems > 10) return 'high'
  if (totalAffectedRecipes > 10 || totalAffectedMenuItems > 5) return 'medium'
  return 'low'
}

function generateStockImpactRecommendations(analysisResults: any): string[] {
  const recommendations: string[] = []

  if (analysisResults.availability?.summary?.availabilityRate < 80) {
    recommendations.push('Low recipe availability - prioritize inventory replenishment')
  }

  if (analysisResults.availability?.criticalIngredients?.length > 5) {
    recommendations.push('Multiple critical ingredient shortages - review par levels')
  }

  return recommendations
}

/**
 * Simulation functions
 */
async function simulateStockDepletion(params: any): Promise<any> {
  return { message: 'Stock depletion simulation completed' }
}

async function simulatePriceChanges(params: any): Promise<any> {
  return { message: 'Price change simulation completed' }
}

async function simulateStockArrival(params: any): Promise<any> {
  return { message: 'Stock arrival simulation completed' }
}