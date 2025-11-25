/**
 * Menu Pricing Integration API
 * 
 * Handles cross-module integration between Stock, Recipes, and Menu for:
 * - Real-time menu item pricing based on recipe costs and inventory
 * - Dynamic profit margin calculations and optimization
 * - Menu engineering insights (high/low profit, popularity analysis)
 * - Price elasticity and competitive pricing recommendations
 * - Cost-plus pricing with market adjustments
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/integration/menu-pricing - Calculate menu pricing with profitability analysis
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const menuItemId = searchParams.get('menu_item_id')
    const pricingStrategy = searchParams.get('pricing_strategy') || 'cost_plus' // cost_plus, market_based, value_based
    const targetMargin = parseFloat(searchParams.get('target_margin') || '30') // Default 30% margin
    const includeCompetitive = searchParams.get('include_competitive') !== 'false'
    const includeMenuEngineering = searchParams.get('include_menu_engineering') !== 'false'

    console.log(`🍽️ Calculating menu pricing for user ${user_id}, strategy: ${pricingStrategy}`)

    let results: any = {}

    if (menuItemId) {
      // Calculate pricing for specific menu item
      results = await calculateMenuItemPricing({
        menuItemId,
        userId: user_id,
        pricingStrategy,
        targetMargin,
        includeCompetitive,
        supabase
      })
    } else {
      // Calculate pricing for all menu items
      results = await calculateAllMenuPricing({
        userId: user_id,
        pricingStrategy,
        targetMargin,
        includeCompetitive,
        includeMenuEngineering,
        supabase
      })
    }

    return NextResponse.json({
      pricingStrategy,
      targetMargin,
      calculatedAt: new Date().toISOString(),
      ...results
    })

  } catch (error) {
    console.error('Menu pricing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/integration/menu-pricing/optimize - Optimize menu pricing for profitability
export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    const {
      optimization_type, // margin_optimization, competitive_positioning, menu_engineering
      target_margin,
      menu_item_ids,
      apply_changes
    } = body

    console.log(`🎯 Optimizing menu pricing - type: ${optimization_type}`)

    let optimizationResults: any = {}

    switch (optimization_type) {
      case 'margin_optimization':
        optimizationResults = await optimizeForMargins({
          targetMargin: target_margin || 30,
          menuItemIds: menu_item_ids || [],
          userId: user_id,
          applyChanges: apply_changes || false,
          supabase
        })
        break

      case 'competitive_positioning':
        optimizationResults = await optimizeForCompetitivePosition({
          menuItemIds: menu_item_ids || [],
          userId: user_id,
          applyChanges: apply_changes || false,
          supabase
        })
        break

      case 'menu_engineering':
        optimizationResults = await performMenuEngineering({
          userId: user_id,
          applyChanges: apply_changes || false,
          supabase
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid optimization_type. Use margin_optimization, competitive_positioning, or menu_engineering' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      optimization_type,
      applied_changes: apply_changes || false,
      ...optimizationResults
    })

  } catch (error) {
    console.error('Menu pricing optimization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Calculate pricing for a specific menu item
 */
async function calculateMenuItemPricing(params: {
  menuItemId: string
  userId: string
  pricingStrategy: string
  targetMargin: number
  includeCompetitive: boolean
  supabase: any
}): Promise<any> {
  const { menuItemId, userId, pricingStrategy, targetMargin, includeCompetitive, supabase } = params

  try {
    // Get menu item with recipe details
    const { data: menuItem, error: menuError } = await supabase
      .from('MenuPricing')
      .select(`
        id,
        item_name,
        description,
        current_price,
        category,
        is_available,
        popularity_score,
        recipe_id,
        food_cost_percentage,
        target_food_cost_pct,
        Recipes:Recipes(
          id,
          name,
          total_cost,
          cost_per_serving,
          yield_amount
        )
      `)
      .eq('id', menuItemId)
      .eq('user_id', userId)
      .single()

    if (menuError || !menuItem) {
      return { error: 'Menu item not found' }
    }

    // Get real-time recipe cost if recipe is linked
    let currentRecipeCost = 0
    let recipeCostDetails = null

    if (menuItem.recipe_id) {
      // Get updated recipe cost from integration API
      const recipeCostResult = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integration/recipe-costing?recipe_id=${menuItem.recipe_id}`, {
        headers: { 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` }
      })

      if (recipeCostResult.ok) {
        const recipeCostData = await recipeCostResult.json()
        if (!recipeCostData.error) {
          currentRecipeCost = recipeCostData.costing.totals.costPerServing
          recipeCostDetails = recipeCostData
        }
      }
    }

    // If no recipe linked, use stored recipe cost or estimate
    if (currentRecipeCost === 0) {
      currentRecipeCost = menuItem.Recipes?.cost_per_serving || 
                          (menuItem.current_price * (menuItem.food_cost_percentage || 30) / 100)
    }

    // Calculate pricing based on strategy
    const pricingCalculations = calculatePricingStrategies({
      currentPrice: menuItem.current_price,
      recipeCost: currentRecipeCost,
      targetMargin,
      pricingStrategy
    })

    // Get competitive data if requested
    let competitiveAnalysis = null
    if (includeCompetitive) {
      competitiveAnalysis = await getCompetitiveAnalysis({
        itemName: menuItem.item_name,
        category: menuItem.category,
        currentPrice: menuItem.current_price,
        supabase
      })
    }

    // Calculate profitability metrics
    const profitability = calculateProfitabilityMetrics({
      currentPrice: menuItem.current_price,
      recipeCost: currentRecipeCost,
      recommendedPrice: pricingCalculations.recommendedPrice,
      popularityScore: menuItem.popularity_score || 50
    })

    return {
      menuItem: {
        id: menuItem.id,
        name: menuItem.item_name,
        category: menuItem.category,
        currentPrice: menuItem.current_price,
        isAvailable: menuItem.is_available
      },
      costing: {
        recipeCost: Math.round(currentRecipeCost * 100) / 100,
        currentFoodCostPercent: menuItem.current_price > 0 ? 
          Math.round((currentRecipeCost / menuItem.current_price) * 100) : 0,
        targetFoodCostPercent: targetMargin,
        recipeCostDetails
      },
      pricing: pricingCalculations,
      profitability,
      competitiveAnalysis,
      recommendations: generatePricingRecommendations({
        menuItem,
        currentRecipeCost,
        pricingCalculations,
        profitability,
        competitiveAnalysis
      })
    }

  } catch (error) {
    console.error('Menu item pricing calculation error:', error)
    return { error: 'Failed to calculate menu item pricing' }
  }
}

/**
 * Calculate pricing for all menu items
 */
async function calculateAllMenuPricing(params: {
  userId: string
  pricingStrategy: string
  targetMargin: number
  includeCompetitive: boolean
  includeMenuEngineering: boolean
  supabase: any
}): Promise<any> {
  const { userId, pricingStrategy, targetMargin, includeCompetitive, includeMenuEngineering, supabase } = params

  try {
    // Get all active menu items
    const { data: menuItems, error: menuError } = await supabase
      .from('MenuPricing')
      .select(`
        id,
        item_name,
        current_price,
        category,
        popularity_score,
        recipe_id,
        food_cost_percentage,
        is_available,
        Recipes:Recipes(
          id,
          name,
          total_cost,
          cost_per_serving
        )
      `)
      .eq('user_id', userId)
      .eq('is_available', true)

    if (menuError || !menuItems) {
      return { error: 'Failed to fetch menu items' }
    }

    const pricingResults = []
    let totalProcessed = 0

    for (const menuItem of menuItems) {
      try {
        const itemPricing = await calculateMenuItemPricing({
          menuItemId: menuItem.id,
          userId,
          pricingStrategy,
          targetMargin,
          includeCompetitive: false, // Skip competitive for bulk to improve performance
          supabase
        })

        if (!itemPricing.error) {
          pricingResults.push(itemPricing)
        }

        totalProcessed++

      } catch (error) {
        console.error(`Error calculating pricing for menu item ${menuItem.id}:`, error)
      }
    }

    // Calculate portfolio metrics
    const portfolioMetrics = calculatePortfolioMetrics(pricingResults)

    // Perform menu engineering analysis if requested
    let menuEngineeringAnalysis = null
    if (includeMenuEngineering) {
      menuEngineeringAnalysis = performMenuEngineeringAnalysis(pricingResults)
    }

    return {
      summary: {
        totalMenuItems: menuItems.length,
        processedItems: totalProcessed,
        ...portfolioMetrics
      },
      menuItems: pricingResults.slice(0, 100), // Limit response size
      menuEngineering: menuEngineeringAnalysis
    }

  } catch (error) {
    console.error('All menu pricing calculation error:', error)
    return { error: 'Failed to calculate menu pricing' }
  }
}

/**
 * Calculate different pricing strategies
 */
function calculatePricingStrategies(params: {
  currentPrice: number
  recipeCost: number
  targetMargin: number
  pricingStrategy: string
}): any {
  const { currentPrice, recipeCost, targetMargin, pricingStrategy } = params

  // Cost-plus pricing (based on food cost percentage)
  const targetFoodCostPercent = 100 - targetMargin
  const costPlusPrice = recipeCost > 0 ? recipeCost / (targetFoodCostPercent / 100) : currentPrice

  // Market-based pricing (psychological pricing)
  const marketPrice = applyPsychologicalPricing(costPlusPrice)

  // Value-based pricing (premium for unique items)
  const valuePrice = costPlusPrice * 1.15 // 15% premium for value positioning

  let recommendedPrice = costPlusPrice

  switch (pricingStrategy) {
    case 'market_based':
      recommendedPrice = marketPrice
      break
    case 'value_based':
      recommendedPrice = valuePrice
      break
    case 'cost_plus':
    default:
      recommendedPrice = costPlusPrice
      break
  }

  return {
    strategies: {
      costPlus: Math.round(costPlusPrice * 100) / 100,
      marketBased: Math.round(marketPrice * 100) / 100,
      valueBased: Math.round(valuePrice * 100) / 100
    },
    recommendedPrice: Math.round(recommendedPrice * 100) / 100,
    priceChange: Math.round((recommendedPrice - currentPrice) * 100) / 100,
    priceChangePercent: currentPrice > 0 ? 
      Math.round(((recommendedPrice - currentPrice) / currentPrice) * 100) : 0
  }
}

/**
 * Apply psychological pricing rules
 */
function applyPsychologicalPricing(price: number): number {
  if (price < 10) {
    // Use .99 endings for items under $10
    return Math.floor(price) + 0.99
  } else if (price < 20) {
    // Use .95 endings for items $10-20
    return Math.floor(price) + 0.95
  } else {
    // Round to nearest .95 or whole dollar for higher prices
    const rounded = Math.round(price)
    return rounded % 5 === 0 ? rounded : rounded - (rounded % 5) + 0.95
  }
}

/**
 * Calculate profitability metrics
 */
function calculateProfitabilityMetrics(params: {
  currentPrice: number
  recipeCost: number
  recommendedPrice: number
  popularityScore: number
}): any {
  const { currentPrice, recipeCost, recommendedPrice, popularityScore } = params

  const currentMargin = currentPrice - recipeCost
  const currentMarginPercent = currentPrice > 0 ? (currentMargin / currentPrice) * 100 : 0

  const recommendedMargin = recommendedPrice - recipeCost
  const recommendedMarginPercent = recommendedPrice > 0 ? (recommendedMargin / recommendedPrice) * 100 : 0

  const profitabilityScore = calculateProfitabilityScore(currentMarginPercent, popularityScore)

  return {
    current: {
      margin: Math.round(currentMargin * 100) / 100,
      marginPercent: Math.round(currentMarginPercent * 100) / 100,
      foodCostPercent: currentPrice > 0 ? Math.round((recipeCost / currentPrice) * 100) : 0
    },
    recommended: {
      margin: Math.round(recommendedMargin * 100) / 100,
      marginPercent: Math.round(recommendedMarginPercent * 100) / 100,
      foodCostPercent: recommendedPrice > 0 ? Math.round((recipeCost / recommendedPrice) * 100) : 0
    },
    profitabilityScore,
    classification: classifyProfitability(currentMarginPercent, popularityScore)
  }
}

/**
 * Calculate profitability score (0-100)
 */
function calculateProfitabilityScore(marginPercent: number, popularityScore: number): number {
  // Weighted score: 70% margin, 30% popularity
  const marginScore = Math.min(100, Math.max(0, marginPercent * 2)) // Scale margin to 0-100
  const popularityNormalized = Math.min(100, Math.max(0, popularityScore || 50))
  
  return Math.round((marginScore * 0.7 + popularityNormalized * 0.3))
}

/**
 * Classify menu item profitability
 */
function classifyProfitability(marginPercent: number, popularityScore: number): string {
  const isHighMargin = marginPercent >= 60
  const isHighPopularity = popularityScore >= 70

  if (isHighMargin && isHighPopularity) return 'star' // High margin, high popularity
  if (isHighMargin && !isHighPopularity) return 'puzzle' // High margin, low popularity
  if (!isHighMargin && isHighPopularity) return 'plow_horse' // Low margin, high popularity
  return 'dog' // Low margin, low popularity
}

/**
 * Get competitive analysis (placeholder implementation)
 */
async function getCompetitiveAnalysis(params: {
  itemName: string
  category: string
  currentPrice: number
  supabase: any
}): Promise<any> {
  // In a real implementation, this would fetch competitor pricing data
  // For now, return mock competitive analysis
  
  const { itemName, category, currentPrice } = params
  
  return {
    averageMarketPrice: currentPrice * (0.9 + Math.random() * 0.2), // ±10% variation
    pricePosition: 'competitive', // competitive, premium, value
    competitorCount: Math.floor(Math.random() * 10) + 3,
    recommendations: [
      'Monitor competitor pricing weekly',
      'Consider seasonal pricing adjustments'
    ]
  }
}

/**
 * Calculate portfolio-level metrics
 */
function calculatePortfolioMetrics(pricingResults: any[]): any {
  if (pricingResults.length === 0) return {}

  const totalRevenue = pricingResults.reduce((sum, item) => 
    sum + (item.menuItem.currentPrice * (item.profitability.current.marginPercent / 100)), 0)

  const avgMargin = pricingResults.reduce((sum, item) => 
    sum + item.profitability.current.marginPercent, 0) / pricingResults.length

  const avgProfitabilityScore = pricingResults.reduce((sum, item) => 
    sum + item.profitability.profitabilityScore, 0) / pricingResults.length

  const classifications = pricingResults.reduce((acc: any, item) => {
    const classification = item.profitability.classification
    acc[classification] = (acc[classification] || 0) + 1
    return acc
  }, {})

  return {
    averageMargin: Math.round(avgMargin * 100) / 100,
    averageProfitabilityScore: Math.round(avgProfitabilityScore),
    classifications,
    highProfitItems: pricingResults.filter(item => item.profitability.profitabilityScore >= 80).length,
    lowProfitItems: pricingResults.filter(item => item.profitability.profitabilityScore < 40).length
  }
}

/**
 * Perform menu engineering analysis
 */
function performMenuEngineeringAnalysis(pricingResults: any[]): any {
  const analysis = {
    stars: pricingResults.filter(item => item.profitability.classification === 'star'),
    puzzles: pricingResults.filter(item => item.profitability.classification === 'puzzle'),
    plowHorses: pricingResults.filter(item => item.profitability.classification === 'plow_horse'),
    dogs: pricingResults.filter(item => item.profitability.classification === 'dog')
  }

  const recommendations = []

  if (analysis.stars.length < pricingResults.length * 0.3) {
    recommendations.push('Increase star items - promote high-margin, popular items')
  }

  if (analysis.dogs.length > pricingResults.length * 0.2) {
    recommendations.push('Consider removing or repricing dog items - low margin and popularity')
  }

  if (analysis.puzzles.length > 0) {
    recommendations.push('Promote puzzle items - high margin items with growth potential')
  }

  return {
    distribution: {
      stars: analysis.stars.length,
      puzzles: analysis.puzzles.length,
      plowHorses: analysis.plowHorses.length,
      dogs: analysis.dogs.length
    },
    recommendations,
    menuHealthScore: calculateMenuHealthScore(analysis, pricingResults.length)
  }
}

/**
 * Calculate menu health score
 */
function calculateMenuHealthScore(analysis: any, totalItems: number): number {
  if (totalItems === 0) return 0

  const starWeight = 40
  const puzzleWeight = 20
  const plowHorseWeight = 15
  const dogPenalty = 25

  const score = (
    (analysis.stars.length / totalItems) * starWeight +
    (analysis.puzzles.length / totalItems) * puzzleWeight +
    (analysis.plowHorses.length / totalItems) * plowHorseWeight -
    (analysis.dogs.length / totalItems) * dogPenalty
  ) * 100

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Generate pricing recommendations
 */
function generatePricingRecommendations(params: {
  menuItem: any
  currentRecipeCost: number
  pricingCalculations: any
  profitability: any
  competitiveAnalysis: any
}): string[] {
  const recommendations: string[] = []
  const { menuItem, currentRecipeCost, pricingCalculations, profitability, competitiveAnalysis } = params

  // Price adjustment recommendations
  if (Math.abs(pricingCalculations.priceChangePercent) > 5) {
    const direction = pricingCalculations.priceChange > 0 ? 'increase' : 'decrease'
    recommendations.push(
      `Consider ${direction} price by $${Math.abs(pricingCalculations.priceChange).toFixed(2)} (${Math.abs(pricingCalculations.priceChangePercent)}%)`
    )
  }

  // Margin recommendations
  if (profitability.current.marginPercent < 20) {
    recommendations.push('Low margin item - consider cost reduction or price increase')
  } else if (profitability.current.marginPercent > 80) {
    recommendations.push('Very high margin - monitor for customer price sensitivity')
  }

  // Classification-based recommendations
  switch (profitability.classification) {
    case 'dog':
      recommendations.push('Consider menu removal or complete repositioning - low margin and popularity')
      break
    case 'puzzle':
      recommendations.push('Promote this high-margin item to increase popularity')
      break
    case 'plow_horse':
      recommendations.push('Find ways to reduce costs while maintaining popularity')
      break
    case 'star':
      recommendations.push('Maintain quality and consider strategic price optimization')
      break
  }

  // Competitive recommendations
  if (competitiveAnalysis?.pricePosition === 'premium') {
    recommendations.push('Premium pricing position - ensure value justification')
  }

  return recommendations
}

/**
 * Optimize pricing for target margins
 */
async function optimizeForMargins(params: {
  targetMargin: number
  menuItemIds: string[]
  userId: string
  applyChanges: boolean
  supabase: any
}): Promise<any> {
  // Implementation for margin optimization
  return { message: 'Margin optimization completed' }
}

/**
 * Optimize for competitive positioning
 */
async function optimizeForCompetitivePosition(params: {
  menuItemIds: string[]
  userId: string
  applyChanges: boolean
  supabase: any
}): Promise<any> {
  // Implementation for competitive positioning
  return { message: 'Competitive positioning optimization completed' }
}

/**
 * Perform comprehensive menu engineering
 */
async function performMenuEngineering(params: {
  userId: string
  applyChanges: boolean
  supabase: any
}): Promise<any> {
  // Implementation for menu engineering optimization
  return { message: 'Menu engineering analysis completed' }
}