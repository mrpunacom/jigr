/**
 * Automated Stock Calculations Engine API
 * 
 * Provides intelligent stock calculations and analytics including:
 * - Par level optimization based on usage patterns
 * - Stock velocity and turnover analysis
 * - Demand forecasting and seasonal adjustments
 * - Cost optimization recommendations
 * - Automated reorder point calculations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/stock/calculations - Get stock analytics and calculations
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const itemId = searchParams.get('item_id')
    const period = parseInt(searchParams.get('period') || '90') // days
    const calculationType = searchParams.get('type') || 'all' // velocity, forecast, optimization, all

    console.log(`🧮 Generating stock calculations for user ${user_id}, period: ${period} days`)

    let results: any = {}

    if (calculationType === 'all' || calculationType === 'velocity') {
      results.velocity = await calculateStockVelocity(user_id, itemId, period, supabase)
    }

    if (calculationType === 'all' || calculationType === 'forecast') {
      results.forecast = await generateDemandForecast(user_id, itemId, period, supabase)
    }

    if (calculationType === 'all' || calculationType === 'optimization') {
      results.optimization = await generateOptimizationRecommendations(user_id, itemId, period, supabase)
    }

    if (calculationType === 'all' || calculationType === 'turnover') {
      results.turnover = await calculateInventoryTurnover(user_id, itemId, period, supabase)
    }

    return NextResponse.json({
      period,
      calculationType,
      results,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Stock calculations GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/stock/calculations/recalculate - Trigger recalculation of stock metrics
export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    const itemIds = body.item_ids || [] // Specific items, or empty for all
    const recalculateParLevels = body.recalculate_par_levels !== false
    const updateReorderPoints = body.update_reorder_points !== false

    console.log(`🔄 Triggering stock recalculation for user ${user_id}`)

    const recalculationResults = await performStockRecalculation({
      userId: user_id,
      itemIds,
      recalculateParLevels,
      updateReorderPoints,
      supabase
    })

    return NextResponse.json({
      success: true,
      ...recalculationResults
    }, { status: 200 })

  } catch (error) {
    console.error('Stock recalculation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Calculate stock velocity and usage patterns
 */
async function calculateStockVelocity(
  userId: string,
  itemId: string | null,
  period: number,
  supabase: any
): Promise<any> {
  try {
    const endDate = new Date()
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000)

    // Get stock movements for velocity calculation
    let query = supabase
      .from('stock_movements')
      .select(`
        inventory_item_id,
        quantity,
        direction,
        movement_date,
        movement_type,
        InventoryItems:inventory_items(
          id,
          item_name,
          current_quantity,
          par_level_low,
          par_level_high,
          cost_per_unit,
          unit_of_measurement,
          category
        )
      `)
      .eq('user_id', userId)
      .eq('direction', 'out') // Focus on outbound movements for velocity
      .gte('movement_date', startDate.toISOString())
      .lte('movement_date', endDate.toISOString())

    if (itemId) {
      query = query.eq('inventory_item_id', itemId)
    }

    const { data: movements } = await query

    if (!movements || movements.length === 0) {
      return { message: 'No movement data available for velocity calculation' }
    }

    // Calculate velocity metrics by item
    const velocityByItem = movements.reduce((acc: any, movement) => {
      const itemId = movement.inventory_item_id
      const item = movement.InventoryItems

      if (!acc[itemId]) {
        acc[itemId] = {
          itemInfo: {
            id: item.id,
            name: item.item_name,
            currentQuantity: item.current_quantity,
            unit: item.unit_of_measurement,
            category: item.category,
            costPerUnit: item.cost_per_unit
          },
          totalUsage: 0,
          movementCount: 0,
          usageByType: {},
          dailyUsage: {},
          velocity: 0,
          turnoverRate: 0
        }
      }

      acc[itemId].totalUsage += movement.quantity
      acc[itemId].movementCount += 1

      // Track usage by movement type
      if (!acc[itemId].usageByType[movement.movement_type]) {
        acc[itemId].usageByType[movement.movement_type] = 0
      }
      acc[itemId].usageByType[movement.movement_type] += movement.quantity

      // Track daily usage
      const date = movement.movement_date.split('T')[0]
      if (!acc[itemId].dailyUsage[date]) {
        acc[itemId].dailyUsage[date] = 0
      }
      acc[itemId].dailyUsage[date] += movement.quantity

      return acc
    }, {})

    // Calculate velocity metrics
    Object.values(velocityByItem).forEach((item: any) => {
      const days = period
      const avgDailyUsage = item.totalUsage / days
      
      item.velocity = {
        averageDailyUsage: Math.round(avgDailyUsage * 100) / 100,
        totalPeriodUsage: item.totalUsage,
        usageFrequency: item.movementCount / days, // movements per day
        daysOfStockRemaining: item.itemInfo.currentQuantity > 0 ? 
          Math.ceil(item.itemInfo.currentQuantity / Math.max(avgDailyUsage, 0.1)) : 0
      }

      // Calculate turnover rate (how many times inventory turns over per period)
      const avgInventory = item.itemInfo.currentQuantity + (item.totalUsage / 2)
      item.turnoverRate = avgInventory > 0 ? 
        Math.round((item.totalUsage / avgInventory) * 100) / 100 : 0

      // Calculate velocity score (1-5, where 5 is fastest moving)
      const velocityScore = Math.min(5, Math.max(1, Math.ceil(item.turnoverRate)))
      item.velocityClassification = {
        score: velocityScore,
        category: getVelocityCategory(velocityScore)
      }
    })

    // Sort by velocity score
    const sortedItems = Object.values(velocityByItem)
      .sort((a: any, b: any) => b.velocityClassification.score - a.velocityClassification.score)

    return {
      period: { days: period, start: startDate.toISOString(), end: endDate.toISOString() },
      totalItems: sortedItems.length,
      summary: {
        fastMoving: sortedItems.filter((item: any) => item.velocityClassification.score >= 4).length,
        mediumMoving: sortedItems.filter((item: any) => item.velocityClassification.score === 3).length,
        slowMoving: sortedItems.filter((item: any) => item.velocityClassification.score <= 2).length,
        totalUsage: sortedItems.reduce((sum: number, item: any) => sum + item.totalUsage, 0)
      },
      items: sortedItems
    }

  } catch (error) {
    console.error('Velocity calculation error:', error)
    return { error: 'Failed to calculate stock velocity' }
  }
}

/**
 * Generate demand forecast based on historical patterns
 */
async function generateDemandForecast(
  userId: string,
  itemId: string | null,
  period: number,
  supabase: any
): Promise<any> {
  try {
    // Get historical usage data for forecasting
    const lookbackPeriod = period * 2 // Look back twice the forecast period
    const endDate = new Date()
    const startDate = new Date(Date.now() - lookbackPeriod * 24 * 60 * 60 * 1000)

    let query = supabase
      .from('stock_movements')
      .select(`
        inventory_item_id,
        quantity,
        movement_date,
        InventoryItems:inventory_items(
          id,
          item_name,
          current_quantity,
          par_level_low,
          unit_of_measurement
        )
      `)
      .eq('user_id', userId)
      .eq('direction', 'out')
      .gte('movement_date', startDate.toISOString())
      .lte('movement_date', endDate.toISOString())

    if (itemId) {
      query = query.eq('inventory_item_id', itemId)
    }

    const { data: movements } = await query

    if (!movements || movements.length === 0) {
      return { message: 'Insufficient historical data for forecasting' }
    }

    // Group movements by item and analyze patterns
    const forecastByItem = movements.reduce((acc: any, movement) => {
      const itemId = movement.inventory_item_id
      const item = movement.InventoryItems

      if (!acc[itemId]) {
        acc[itemId] = {
          itemInfo: {
            id: item.id,
            name: item.item_name,
            currentQuantity: item.current_quantity,
            unit: item.unit_of_measurement
          },
          historicalUsage: [],
          weeklyPattern: {},
          monthlyPattern: {},
          forecast: {}
        }
      }

      acc[itemId].historicalUsage.push({
        date: movement.movement_date,
        quantity: movement.quantity
      })

      // Analyze weekly patterns
      const dayOfWeek = new Date(movement.movement_date).getDay()
      if (!acc[itemId].weeklyPattern[dayOfWeek]) {
        acc[itemId].weeklyPattern[dayOfWeek] = { total: 0, count: 0 }
      }
      acc[itemId].weeklyPattern[dayOfWeek].total += movement.quantity
      acc[itemId].weeklyPattern[dayOfWeek].count += 1

      // Analyze monthly patterns
      const month = new Date(movement.movement_date).getMonth()
      if (!acc[itemId].monthlyPattern[month]) {
        acc[itemId].monthlyPattern[month] = { total: 0, count: 0 }
      }
      acc[itemId].monthlyPattern[month].total += movement.quantity
      acc[itemId].monthlyPattern[month].count += 1

      return acc
    }, {})

    // Generate forecasts for each item
    Object.values(forecastByItem).forEach((item: any) => {
      const usage = item.historicalUsage
      
      if (usage.length < 7) {
        item.forecast = { error: 'Insufficient data for reliable forecast' }
        return
      }

      // Calculate simple moving average
      const totalUsage = usage.reduce((sum: number, u: any) => sum + u.quantity, 0)
      const avgDailyUsage = totalUsage / lookbackPeriod

      // Calculate weekly and monthly averages
      const weeklyAvg = Object.values(item.weeklyPattern).reduce((sum: number, day: any) => 
        sum + (day.total / Math.max(day.count, 1)), 0) / 7

      // Generate forecast for next period
      item.forecast = {
        nextPeriod: {
          days: period,
          estimatedUsage: Math.round(avgDailyUsage * period),
          confidence: calculateForecastConfidence(usage),
          dailyAverage: Math.round(avgDailyUsage * 100) / 100
        },
        patterns: {
          weeklyVariation: calculateWeeklyVariation(item.weeklyPattern),
          trend: calculateTrend(usage),
          seasonality: calculateSeasonality(item.monthlyPattern)
        },
        stockoutRisk: calculateStockoutRisk(
          item.itemInfo.currentQuantity,
          avgDailyUsage,
          period
        ),
        recommendedOrder: calculateRecommendedOrder(
          item.itemInfo.currentQuantity,
          avgDailyUsage,
          period
        )
      }
    })

    return {
      forecastPeriod: period,
      dataRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        daysAnalyzed: lookbackPeriod
      },
      totalItems: Object.keys(forecastByItem).length,
      items: Object.values(forecastByItem)
    }

  } catch (error) {
    console.error('Demand forecast error:', error)
    return { error: 'Failed to generate demand forecast' }
  }
}

/**
 * Generate optimization recommendations
 */
async function generateOptimizationRecommendations(
  userId: string,
  itemId: string | null,
  period: number,
  supabase: any
): Promise<any> {
  try {
    // Get current inventory with usage data
    let query = supabase
      .from('inventory_items')
      .select(`
        id,
        item_name,
        current_quantity,
        par_level_low,
        par_level_high,
        cost_per_unit,
        unit_of_measurement,
        category,
        last_restocked
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (itemId) {
      query = query.eq('id', itemId)
    }

    const { data: items } = await query

    if (!items || items.length === 0) {
      return { message: 'No items found for optimization' }
    }

    // Get velocity data for optimization
    const velocityData = await calculateStockVelocity(userId, itemId, period, supabase)

    const recommendations = []

    for (const item of items) {
      const velocityInfo = velocityData.items?.find((v: any) => v.itemInfo.id === item.id)
      
      if (!velocityInfo) continue

      const rec = {
        itemId: item.id,
        itemName: item.item_name,
        currentState: {
          quantity: item.current_quantity,
          parLow: item.par_level_low,
          parHigh: item.par_level_high,
          velocity: velocityInfo.velocityClassification
        },
        recommendations: []
      }

      // Par level optimization
      const optimalParLevels = calculateOptimalParLevels(item, velocityInfo)
      if (optimalParLevels.needsAdjustment) {
        rec.recommendations.push({
          type: 'par_level_optimization',
          priority: 'medium',
          description: `Adjust par levels based on usage patterns`,
          currentPar: { low: item.par_level_low, high: item.par_level_high },
          recommendedPar: optimalParLevels.recommended,
          expectedBenefit: optimalParLevels.benefit
        })
      }

      // Overstock warning
      if (item.current_quantity > item.par_level_high * 2) {
        rec.recommendations.push({
          type: 'overstock_warning',
          priority: 'low',
          description: `Consider reducing order quantities - currently overstocked`,
          excessQuantity: item.current_quantity - item.par_level_high,
          estimatedCostImpact: (item.current_quantity - item.par_level_high) * item.cost_per_unit
        })
      }

      // Low velocity items
      if (velocityInfo.velocityClassification.score <= 2) {
        rec.recommendations.push({
          type: 'slow_moving_item',
          priority: 'low',
          description: `Slow-moving item - review necessity or reduce stock levels`,
          velocityScore: velocityInfo.velocityClassification.score,
          daysOfStock: velocityInfo.velocity.daysOfStockRemaining
        })
      }

      // High velocity items
      if (velocityInfo.velocityClassification.score >= 4) {
        rec.recommendations.push({
          type: 'high_velocity_item',
          priority: 'medium',
          description: `Fast-moving item - consider increasing par levels or order frequency`,
          velocityScore: velocityInfo.velocityClassification.score,
          currentTurnover: velocityInfo.turnoverRate
        })
      }

      if (rec.recommendations.length > 0) {
        recommendations.push(rec)
      }
    }

    return {
      totalItems: items.length,
      itemsWithRecommendations: recommendations.length,
      recommendations: recommendations.sort((a: any, b: any) => {
        const priorityScore = { high: 3, medium: 2, low: 1 }
        const aMax = Math.max(...a.recommendations.map((r: any) => priorityScore[r.priority] || 0))
        const bMax = Math.max(...b.recommendations.map((r: any) => priorityScore[r.priority] || 0))
        return bMax - aMax
      }),
      summary: {
        parLevelAdjustments: recommendations.filter(r => 
          r.recommendations.some((rec: any) => rec.type === 'par_level_optimization')).length,
        overstockWarnings: recommendations.filter(r => 
          r.recommendations.some((rec: any) => rec.type === 'overstock_warning')).length,
        slowMovingItems: recommendations.filter(r => 
          r.recommendations.some((rec: any) => rec.type === 'slow_moving_item')).length,
        highVelocityItems: recommendations.filter(r => 
          r.recommendations.some((rec: any) => rec.type === 'high_velocity_item')).length
      }
    }

  } catch (error) {
    console.error('Optimization recommendations error:', error)
    return { error: 'Failed to generate optimization recommendations' }
  }
}

/**
 * Calculate inventory turnover analysis
 */
async function calculateInventoryTurnover(
  userId: string,
  itemId: string | null,
  period: number,
  supabase: any
): Promise<any> {
  try {
    // Get all inventory items with costs
    let query = supabase
      .from('inventory_items')
      .select(`
        id,
        item_name,
        current_quantity,
        cost_per_unit,
        category,
        unit_of_measurement
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .not('cost_per_unit', 'is', null)

    if (itemId) {
      query = query.eq('id', itemId)
    }

    const { data: items } = await query

    if (!items || items.length === 0) {
      return { message: 'No items with cost data found' }
    }

    // Get usage data for the period
    const endDate = new Date()
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000)

    const { data: movements } = await supabase
      .from('stock_movements')
      .select('inventory_item_id, quantity, movement_date')
      .eq('user_id', userId)
      .eq('direction', 'out')
      .gte('movement_date', startDate.toISOString())
      .lte('movement_date', endDate.toISOString())

    const usageByItem = (movements || []).reduce((acc: any, movement: any) => {
      if (!acc[movement.inventory_item_id]) {
        acc[movement.inventory_item_id] = 0
      }
      acc[movement.inventory_item_id] += movement.quantity
      return acc
    }, {})

    // Calculate turnover for each item
    const turnoverAnalysis = items.map(item => {
      const usage = usageByItem[item.id] || 0
      const currentValue = item.current_quantity * item.cost_per_unit
      const usageValue = usage * item.cost_per_unit
      
      // Annualized turnover calculation
      const annualizedUsage = usage * (365 / period)
      const turnoverRatio = currentValue > 0 ? annualizedUsage / currentValue : 0

      return {
        itemId: item.id,
        itemName: item.item_name,
        category: item.category,
        currentQuantity: item.current_quantity,
        costPerUnit: item.cost_per_unit,
        currentValue: Math.round(currentValue * 100) / 100,
        periodUsage: usage,
        usageValue: Math.round(usageValue * 100) / 100,
        turnoverRatio: Math.round(turnoverRatio * 100) / 100,
        turnoverCategory: getTurnoverCategory(turnoverRatio),
        daysInInventory: turnoverRatio > 0 ? Math.round(365 / turnoverRatio) : 999
      }
    })

    // Sort by turnover ratio
    turnoverAnalysis.sort((a, b) => b.turnoverRatio - a.turnoverRatio)

    // Calculate summary statistics
    const totalCurrentValue = turnoverAnalysis.reduce((sum, item) => sum + item.currentValue, 0)
    const totalUsageValue = turnoverAnalysis.reduce((sum, item) => sum + item.usageValue, 0)
    const avgTurnover = turnoverAnalysis.length > 0 ? 
      turnoverAnalysis.reduce((sum, item) => sum + item.turnoverRatio, 0) / turnoverAnalysis.length : 0

    return {
      period: { days: period, start: startDate.toISOString(), end: endDate.toISOString() },
      summary: {
        totalItems: turnoverAnalysis.length,
        totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
        totalUsageValue: Math.round(totalUsageValue * 100) / 100,
        averageTurnoverRatio: Math.round(avgTurnover * 100) / 100,
        byCategory: {
          fast: turnoverAnalysis.filter(item => item.turnoverCategory === 'fast').length,
          medium: turnoverAnalysis.filter(item => item.turnoverCategory === 'medium').length,
          slow: turnoverAnalysis.filter(item => item.turnoverCategory === 'slow').length,
          dead: turnoverAnalysis.filter(item => item.turnoverCategory === 'dead').length
        }
      },
      items: turnoverAnalysis,
      recommendations: generateTurnoverRecommendations(turnoverAnalysis)
    }

  } catch (error) {
    console.error('Turnover calculation error:', error)
    return { error: 'Failed to calculate inventory turnover' }
  }
}

/**
 * Perform comprehensive stock recalculation
 */
async function performStockRecalculation(params: {
  userId: string
  itemIds: string[]
  recalculateParLevels: boolean
  updateReorderPoints: boolean
  supabase: any
}): Promise<any> {
  const { userId, itemIds, recalculateParLevels, updateReorderPoints, supabase } = params
  
  try {
    const updates = []
    const errors = []

    // Get items to recalculate
    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (itemIds.length > 0) {
      query = query.in('id', itemIds)
    }

    const { data: items } = await query

    if (!items || items.length === 0) {
      return { message: 'No items found for recalculation' }
    }

    for (const item of items) {
      try {
        const updateData: any = {
          updated_at: new Date().toISOString(),
          updated_by: userId
        }

        if (recalculateParLevels) {
          // Calculate optimal par levels based on usage
          const velocityData = await calculateStockVelocity(userId, item.id, 90, supabase)
          const itemVelocity = velocityData.items?.[0]

          if (itemVelocity) {
            const avgDailyUsage = itemVelocity.velocity.averageDailyUsage
            const leadTime = 7 // Assume 7-day lead time

            updateData.par_level_low = Math.ceil(avgDailyUsage * leadTime * 1.5) // Safety stock
            updateData.par_level_high = Math.ceil(avgDailyUsage * leadTime * 3) // Max stock
          }
        }

        if (updateReorderPoints) {
          // Update reorder points based on velocity
          const reorderPoint = Math.max(updateData.par_level_low || item.par_level_low, 1)
          updateData.reorder_point = reorderPoint
        }

        if (Object.keys(updateData).length > 3) { // More than just timestamps and user
          const { error } = await supabase
            .from('inventory_items')
            .update(updateData)
            .eq('id', item.id)
            .eq('user_id', userId)

          if (error) {
            errors.push(`Failed to update ${item.item_name}: ${error.message}`)
          } else {
            updates.push({
              itemId: item.id,
              itemName: item.item_name,
              changes: updateData
            })
          }
        }

      } catch (itemError) {
        errors.push(`Error processing ${item.item_name}: ${itemError}`)
      }
    }

    return {
      totalItems: items.length,
      successfulUpdates: updates.length,
      errors: errors.length,
      updates,
      errors
    }

  } catch (error) {
    console.error('Stock recalculation error:', error)
    throw error
  }
}

/**
 * Helper functions
 */
function getVelocityCategory(score: number): string {
  if (score >= 4) return 'fast'
  if (score === 3) return 'medium'
  if (score >= 2) return 'slow'
  return 'dead'
}

function getTurnoverCategory(ratio: number): string {
  if (ratio >= 12) return 'fast'  // More than 12 times per year
  if (ratio >= 6) return 'medium' // 6-12 times per year
  if (ratio >= 2) return 'slow'   // 2-6 times per year
  return 'dead'                   // Less than 2 times per year
}

function calculateForecastConfidence(usage: any[]): string {
  const variance = calculateVariance(usage.map(u => u.quantity))
  
  if (variance < 0.2) return 'high'
  if (variance < 0.5) return 'medium'
  return 'low'
}

function calculateVariance(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
}

function calculateWeeklyVariation(weeklyPattern: any): any {
  const days = Object.keys(weeklyPattern).map(day => ({
    day: parseInt(day),
    average: weeklyPattern[day].total / Math.max(weeklyPattern[day].count, 1)
  }))
  
  return days.sort((a, b) => a.day - b.day)
}

function calculateTrend(usage: any[]): string {
  if (usage.length < 14) return 'insufficient_data'
  
  const firstHalf = usage.slice(0, Math.floor(usage.length / 2))
  const secondHalf = usage.slice(Math.floor(usage.length / 2))
  
  const firstAvg = firstHalf.reduce((sum, u) => sum + u.quantity, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, u) => sum + u.quantity, 0) / secondHalf.length
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100
  
  if (Math.abs(change) < 5) return 'stable'
  return change > 0 ? 'increasing' : 'decreasing'
}

function calculateSeasonality(monthlyPattern: any): any {
  const months = Object.keys(monthlyPattern).map(month => ({
    month: parseInt(month),
    average: monthlyPattern[month].total / Math.max(monthlyPattern[month].count, 1)
  }))
  
  return months.sort((a, b) => a.month - b.month)
}

function calculateStockoutRisk(currentQty: number, dailyUsage: number, period: number): string {
  const daysRemaining = currentQty / Math.max(dailyUsage, 0.1)
  
  if (daysRemaining <= period * 0.25) return 'high'
  if (daysRemaining <= period * 0.5) return 'medium'
  return 'low'
}

function calculateRecommendedOrder(currentQty: number, dailyUsage: number, period: number): number {
  const daysRemaining = currentQty / Math.max(dailyUsage, 0.1)
  
  if (daysRemaining <= period * 0.5) {
    return Math.ceil(dailyUsage * period * 1.2) // 20% safety margin
  }
  
  return 0
}

function calculateOptimalParLevels(item: any, velocityInfo: any): any {
  const avgDailyUsage = velocityInfo.velocity.averageDailyUsage
  const leadTime = 7 // Default 7-day lead time
  
  const optimalParLow = Math.ceil(avgDailyUsage * leadTime * 1.5)
  const optimalParHigh = Math.ceil(avgDailyUsage * leadTime * 3)
  
  const needsAdjustment = 
    Math.abs(item.par_level_low - optimalParLow) > optimalParLow * 0.2 ||
    Math.abs(item.par_level_high - optimalParHigh) > optimalParHigh * 0.2
  
  return {
    needsAdjustment,
    recommended: {
      low: optimalParLow,
      high: optimalParHigh
    },
    benefit: needsAdjustment ? 'Improved stock availability and reduced holding costs' : null
  }
}

function generateTurnoverRecommendations(turnoverAnalysis: any[]): string[] {
  const recommendations: string[] = []
  
  const deadStock = turnoverAnalysis.filter(item => item.turnoverCategory === 'dead')
  const slowMoving = turnoverAnalysis.filter(item => item.turnoverCategory === 'slow')
  const fastMoving = turnoverAnalysis.filter(item => item.turnoverCategory === 'fast')
  
  if (deadStock.length > 0) {
    recommendations.push(`${deadStock.length} items with very low turnover - consider discontinuing or reducing stock`)
  }
  
  if (slowMoving.length > turnoverAnalysis.length * 0.3) {
    recommendations.push('High percentage of slow-moving items - review ordering strategies')
  }
  
  if (fastMoving.length > 0) {
    recommendations.push(`${fastMoving.length} fast-moving items - ensure adequate stock levels`)
  }
  
  return recommendations
}