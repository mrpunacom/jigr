/**
 * Usage Pattern Analysis API
 * 
 * Provides comprehensive usage pattern analysis and forecasting including:
 * - Historical usage trend analysis
 * - Seasonal pattern detection and forecasting
 * - Peak usage identification and planning
 * - Usage anomaly detection
 * - Consumption forecasting and planning
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/stock/usage - Analyze usage patterns with comprehensive reporting
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const itemId = searchParams.get('item_id')
    const period = parseInt(searchParams.get('period') || '90') // days
    const analysisType = searchParams.get('analysis_type') || 'comprehensive' // trends, seasonal, forecast, anomalies, comprehensive
    const categoryId = searchParams.get('category_id')
    const includeForecasting = searchParams.get('include_forecasting') !== 'false'

    console.log(`📈 Analyzing usage patterns for user ${user_id}, period: ${period} days`)

    let analysisResults: any = {
      period: period,
      analysisType: analysisType,
      generatedAt: new Date().toISOString()
    }

    // Execute requested analysis types
    if (analysisType === 'comprehensive' || analysisType === 'trends') {
      analysisResults.trends = await analyzeTrends(user_id, itemId, categoryId, period, supabase)
    }

    if (analysisType === 'comprehensive' || analysisType === 'seasonal') {
      analysisResults.seasonal = await analyzeSeasonalPatterns(user_id, itemId, categoryId, period, supabase)
    }

    if (analysisType === 'comprehensive' || analysisType === 'anomalies') {
      analysisResults.anomalies = await detectUsageAnomalies(user_id, itemId, categoryId, period, supabase)
    }

    if ((analysisType === 'comprehensive' || analysisType === 'forecast') && includeForecasting) {
      analysisResults.forecast = await generateUsageForecast(user_id, itemId, categoryId, period, supabase)
    }

    if (analysisType === 'comprehensive') {
      analysisResults.summary = generateComprehensiveSummary(analysisResults)
      analysisResults.recommendations = generateUsageRecommendations(analysisResults)
    }

    return NextResponse.json(analysisResults)

  } catch (error) {
    console.error('Usage pattern analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/stock/usage/batch-analysis - Analyze usage patterns for multiple items
export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    const itemIds = body.item_ids || []
    const period = body.period || 90
    const analysisTypes = body.analysis_types || ['trends', 'seasonal']

    if (itemIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one item ID is required for batch analysis' },
        { status: 400 }
      )
    }

    console.log(`🔄 Performing batch usage analysis for ${itemIds.length} items`)

    const batchResults = []

    for (const itemId of itemIds) {
      try {
        const itemAnalysis: any = {
          itemId,
          analysis: {}
        }

        // Get item info
        const { data: item } = await supabase
          .from('inventory_items')
          .select('id, item_name, category, unit_of_measurement')
          .eq('id', itemId)
          .eq('user_id', user_id)
          .single()

        if (item) {
          itemAnalysis.itemInfo = item

          // Perform requested analyses
          for (const analysisType of analysisTypes) {
            switch (analysisType) {
              case 'trends':
                itemAnalysis.analysis.trends = await analyzeTrends(user_id, itemId, null, period, supabase)
                break
              case 'seasonal':
                itemAnalysis.analysis.seasonal = await analyzeSeasonalPatterns(user_id, itemId, null, period, supabase)
                break
              case 'anomalies':
                itemAnalysis.analysis.anomalies = await detectUsageAnomalies(user_id, itemId, null, period, supabase)
                break
              case 'forecast':
                itemAnalysis.analysis.forecast = await generateUsageForecast(user_id, itemId, null, period, supabase)
                break
            }
          }

          batchResults.push(itemAnalysis)
        }

      } catch (itemError) {
        console.error(`Error analyzing item ${itemId}:`, itemError)
        batchResults.push({
          itemId,
          error: `Analysis failed: ${itemError.message}`
        })
      }
    }

    return NextResponse.json({
      totalItems: itemIds.length,
      successfulAnalyses: batchResults.filter(r => !r.error).length,
      results: batchResults,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Batch usage analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Analyze usage trends over time
 */
async function analyzeTrends(
  userId: string,
  itemId: string | null,
  categoryId: string | null,
  period: number,
  supabase: any
): Promise<any> {
  try {
    const endDate = new Date()
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000)

    // Get stock movements for trend analysis
    let query = supabase
      .from('stock_movements')
      .select(`
        inventory_item_id,
        quantity,
        movement_date,
        movement_type,
        InventoryItems:inventory_items(
          id,
          item_name,
          category,
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

    if (categoryId) {
      query = query.eq('InventoryItems.category_id', categoryId)
    }

    const { data: movements } = await query

    if (!movements || movements.length === 0) {
      return { message: 'No usage data available for trend analysis' }
    }

    // Group movements by day for trend analysis
    const dailyUsage = movements.reduce((acc: any, movement: any) => {
      const date = movement.movement_date.split('T')[0]
      const itemId = movement.inventory_item_id

      if (!acc[date]) acc[date] = {}
      if (!acc[date][itemId]) {
        acc[date][itemId] = {
          itemName: movement.InventoryItems.item_name,
          category: movement.InventoryItems.category,
          totalUsage: 0
        }
      }

      acc[date][itemId].totalUsage += movement.quantity
      return acc
    }, {})

    // Calculate trends
    const trendData = []
    const dates = Object.keys(dailyUsage).sort()

    for (const date of dates) {
      const dayData = dailyUsage[date]
      const totalDayUsage = Object.values(dayData).reduce((sum: number, item: any) => 
        sum + item.totalUsage, 0)

      trendData.push({
        date,
        totalUsage: totalDayUsage,
        itemBreakdown: dayData
      })
    }

    // Calculate trend statistics
    const usageValues = trendData.map(d => d.totalUsage)
    const avgDailyUsage = usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length
    const trendDirection = calculateTrendDirection(usageValues)
    const volatility = calculateVolatility(usageValues)

    // Identify peak usage days
    const peakDays = trendData
      .filter(d => d.totalUsage > avgDailyUsage * 1.5)
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, 5)

    // Calculate growth rate
    const firstWeek = usageValues.slice(0, 7)
    const lastWeek = usageValues.slice(-7)
    const firstWeekAvg = firstWeek.reduce((sum, val) => sum + val, 0) / firstWeek.length
    const lastWeekAvg = lastWeek.reduce((sum, val) => sum + val, 0) / lastWeek.length
    const growthRate = firstWeekAvg > 0 ? ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100 : 0

    return {
      period: { days: period, start: startDate.toISOString(), end: endDate.toISOString() },
      summary: {
        totalDataPoints: trendData.length,
        averageDailyUsage: Math.round(avgDailyUsage * 100) / 100,
        totalUsage: usageValues.reduce((sum, val) => sum + val, 0),
        trendDirection,
        growthRate: Math.round(growthRate * 100) / 100,
        volatility: Math.round(volatility * 100) / 100
      },
      trendData: trendData.slice(-30), // Last 30 days for visualization
      peakDays,
      analysis: {
        isIncreasing: trendDirection === 'increasing',
        isStable: trendDirection === 'stable',
        isDecreasing: trendDirection === 'decreasing',
        highVolatility: volatility > 0.5,
        hasSeasonalPattern: detectSimpleSeasonality(usageValues)
      }
    }

  } catch (error) {
    console.error('Trend analysis error:', error)
    return { error: 'Failed to analyze usage trends' }
  }
}

/**
 * Analyze seasonal patterns and cyclical behavior
 */
async function analyzeSeasonalPatterns(
  userId: string,
  itemId: string | null,
  categoryId: string | null,
  period: number,
  supabase: any
): Promise<any> {
  try {
    // Use extended period for better seasonal analysis
    const extendedPeriod = Math.max(period, 180) // At least 6 months
    const endDate = new Date()
    const startDate = new Date(Date.now() - extendedPeriod * 24 * 60 * 60 * 1000)

    let query = supabase
      .from('stock_movements')
      .select(`
        inventory_item_id,
        quantity,
        movement_date,
        InventoryItems:inventory_items(
          id,
          item_name,
          category
        )
      `)
      .eq('user_id', userId)
      .eq('direction', 'out')
      .gte('movement_date', startDate.toISOString())
      .lte('movement_date', endDate.toISOString())

    if (itemId) {
      query = query.eq('inventory_item_id', itemId)
    }

    if (categoryId) {
      query = query.eq('InventoryItems.category_id', categoryId)
    }

    const { data: movements } = await query

    if (!movements || movements.length === 0) {
      return { message: 'Insufficient data for seasonal analysis' }
    }

    // Analyze patterns by different time periods
    const patterns = {
      dayOfWeek: {},
      dayOfMonth: {},
      month: {},
      quarter: {}
    }

    movements.forEach(movement => {
      const date = new Date(movement.movement_date)
      const quantity = movement.quantity

      // Day of week pattern (0 = Sunday, 6 = Saturday)
      const dayOfWeek = date.getDay()
      patterns.dayOfWeek[dayOfWeek] = (patterns.dayOfWeek[dayOfWeek] || 0) + quantity

      // Day of month pattern
      const dayOfMonth = date.getDate()
      patterns.dayOfMonth[dayOfMonth] = (patterns.dayOfMonth[dayOfMonth] || 0) + quantity

      // Monthly pattern
      const month = date.getMonth()
      patterns.month[month] = (patterns.month[month] || 0) + quantity

      // Quarterly pattern
      const quarter = Math.floor(date.getMonth() / 3)
      patterns.quarter[quarter] = (patterns.quarter[quarter] || 0) + quantity
    })

    // Calculate averages and identify patterns
    const weeklyPattern = Object.entries(patterns.dayOfWeek).map(([day, usage]: [string, any]) => ({
      day: parseInt(day),
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)],
      avgUsage: Math.round(usage / (extendedPeriod / 7) * 100) / 100
    })).sort((a, b) => a.day - b.day)

    const monthlyPattern = Object.entries(patterns.month).map(([month, usage]: [string, any]) => ({
      month: parseInt(month),
      monthName: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][parseInt(month)],
      avgUsage: Math.round(usage / (extendedPeriod / 30) * 100) / 100
    })).sort((a, b) => a.month - b.month)

    const quarterlyPattern = Object.entries(patterns.quarter).map(([quarter, usage]: [string, any]) => ({
      quarter: parseInt(quarter) + 1,
      quarterName: `Q${parseInt(quarter) + 1}`,
      avgUsage: Math.round(usage / (extendedPeriod / 90) * 100) / 100
    })).sort((a, b) => a.quarter - b.quarter)

    // Identify peak periods
    const peakDay = weeklyPattern.reduce((max, day) => day.avgUsage > max.avgUsage ? day : max)
    const peakMonth = monthlyPattern.reduce((max, month) => month.avgUsage > max.avgUsage ? month : max)
    const peakQuarter = quarterlyPattern.reduce((max, quarter) => quarter.avgUsage > max.avgUsage ? quarter : max)

    // Calculate seasonal variance
    const weeklyVariance = calculatePatternVariance(weeklyPattern.map(p => p.avgUsage))
    const monthlyVariance = calculatePatternVariance(monthlyPattern.map(p => p.avgUsage))

    return {
      period: { days: extendedPeriod, start: startDate.toISOString(), end: endDate.toISOString() },
      patterns: {
        weekly: weeklyPattern,
        monthly: monthlyPattern,
        quarterly: quarterlyPattern
      },
      peaks: {
        peakDay,
        peakMonth,
        peakQuarter
      },
      variance: {
        weekly: Math.round(weeklyVariance * 100) / 100,
        monthly: Math.round(monthlyVariance * 100) / 100
      },
      insights: {
        hasWeeklyPattern: weeklyVariance > 0.1,
        hasSeasonalPattern: monthlyVariance > 0.2,
        strongSeasonality: monthlyVariance > 0.5,
        weekdayVsWeekend: compareWeekdayWeekend(weeklyPattern)
      }
    }

  } catch (error) {
    console.error('Seasonal analysis error:', error)
    return { error: 'Failed to analyze seasonal patterns' }
  }
}

/**
 * Detect usage anomalies and unusual patterns
 */
async function detectUsageAnomalies(
  userId: string,
  itemId: string | null,
  categoryId: string | null,
  period: number,
  supabase: any
): Promise<any> {
  try {
    const endDate = new Date()
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000)

    let query = supabase
      .from('stock_movements')
      .select(`
        inventory_item_id,
        quantity,
        movement_date,
        movement_type,
        notes,
        InventoryItems:inventory_items(
          id,
          item_name,
          category
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
      return { message: 'No usage data available for anomaly detection' }
    }

    // Group by day and calculate daily usage
    const dailyUsage = movements.reduce((acc: any, movement: any) => {
      const date = movement.movement_date.split('T')[0]
      if (!acc[date]) acc[date] = 0
      acc[date] += movement.quantity
      return acc
    }, {})

    const usageValues = Object.values(dailyUsage) as number[]
    const dates = Object.keys(dailyUsage).sort()

    // Calculate statistical measures
    const mean = usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length
    const stdDev = Math.sqrt(usageValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / usageValues.length)

    // Detect anomalies (values beyond 2 standard deviations)
    const anomalies = []
    const anomalyThreshold = 2

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i]
      const usage = dailyUsage[date]
      const zScore = Math.abs((usage - mean) / stdDev)

      if (zScore > anomalyThreshold) {
        // Get movements for this specific day for context
        const dayMovements = movements.filter(m => m.movement_date.split('T')[0] === date)
        
        anomalies.push({
          date,
          usage,
          expectedRange: {
            min: Math.round((mean - stdDev * anomalyThreshold) * 100) / 100,
            max: Math.round((mean + stdDev * anomalyThreshold) * 100) / 100
          },
          zScore: Math.round(zScore * 100) / 100,
          severity: zScore > 3 ? 'high' : 'medium',
          type: usage > mean ? 'spike' : 'drop',
          context: {
            movementCount: dayMovements.length,
            movementTypes: [...new Set(dayMovements.map(m => m.movement_type))],
            largestMovement: Math.max(...dayMovements.map(m => m.quantity))
          }
        })
      }
    }

    // Detect patterns in anomalies
    const anomalyPatterns = analyzeAnomalyPatterns(anomalies)

    // Detect zero usage streaks
    const zeroStreaks = detectZeroUsageStreaks(dates, dailyUsage)

    // Calculate overall stability score
    const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0
    const stabilityScore = Math.max(0, 100 - coefficientOfVariation)

    return {
      period: { days: period, start: startDate.toISOString(), end: endDate.toISOString() },
      statistics: {
        mean: Math.round(mean * 100) / 100,
        standardDeviation: Math.round(stdDev * 100) / 100,
        coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100,
        stabilityScore: Math.round(stabilityScore * 100) / 100
      },
      anomalies: anomalies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      patterns: anomalyPatterns,
      zeroUsageStreaks: zeroStreaks,
      summary: {
        totalAnomalies: anomalies.length,
        highSeverityAnomalies: anomalies.filter(a => a.severity === 'high').length,
        spikes: anomalies.filter(a => a.type === 'spike').length,
        drops: anomalies.filter(a => a.type === 'drop').length,
        isStable: stabilityScore > 70,
        hasRecurringAnomalies: anomalyPatterns.hasRecurring
      }
    }

  } catch (error) {
    console.error('Anomaly detection error:', error)
    return { error: 'Failed to detect usage anomalies' }
  }
}

/**
 * Generate comprehensive usage forecast
 */
async function generateUsageForecast(
  userId: string,
  itemId: string | null,
  categoryId: string | null,
  period: number,
  supabase: any
): Promise<any> {
  try {
    // Get historical data for forecasting (use double the forecast period)
    const lookbackPeriod = period * 2
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
          category,
          current_quantity
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

    if (!movements || movements.length < 14) {
      return { message: 'Insufficient data for reliable forecasting (need at least 14 days)' }
    }

    // Group by day for time series analysis
    const dailyUsage = movements.reduce((acc: any, movement: any) => {
      const date = movement.movement_date.split('T')[0]
      if (!acc[date]) acc[date] = 0
      acc[date] += movement.quantity
      return acc
    }, {})

    const dates = Object.keys(dailyUsage).sort()
    const usageValues = dates.map(date => dailyUsage[date])

    // Calculate various forecast models
    const simpleMovingAvg = calculateMovingAverage(usageValues, 7)
    const exponentialSmoothing = calculateExponentialSmoothing(usageValues, 0.3)
    const linearTrend = calculateLinearTrend(usageValues)

    // Generate forecast for the specified period
    const forecastDays = period
    const forecast = []
    
    for (let i = 1; i <= forecastDays; i++) {
      const futureDate = new Date(endDate)
      futureDate.setDate(futureDate.getDate() + i)
      
      // Combine different forecasting methods
      const smaForecast = simpleMovingAvg
      const esForecast = exponentialSmoothing.forecast
      const trendForecast = linearTrend.slope * (usageValues.length + i) + linearTrend.intercept
      
      // Weighted average of forecasts
      const combinedForecast = (smaForecast * 0.4) + (esForecast * 0.3) + (Math.max(0, trendForecast) * 0.3)
      
      forecast.push({
        date: futureDate.toISOString().split('T')[0],
        estimatedUsage: Math.round(Math.max(0, combinedForecast) * 100) / 100,
        confidence: calculateForecastConfidence(i, usageValues.length),
        models: {
          simpleMovingAverage: Math.round(smaForecast * 100) / 100,
          exponentialSmoothing: Math.round(esForecast * 100) / 100,
          linearTrend: Math.round(Math.max(0, trendForecast) * 100) / 100
        }
      })
    }

    // Calculate forecast summary
    const totalForecastUsage = forecast.reduce((sum, day) => sum + day.estimatedUsage, 0)
    const avgDailyForecast = totalForecastUsage / forecastDays
    const historicalAvg = usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length

    // Calculate stock-out risk if we have current inventory levels
    let stockoutRisk = null
    if (movements[0]?.InventoryItems?.current_quantity !== undefined) {
      const currentStock = movements[0].InventoryItems.current_quantity
      stockoutRisk = calculateStockoutRisk(currentStock, avgDailyForecast, forecastDays)
    }

    return {
      period: { 
        historicalDays: lookbackPeriod, 
        forecastDays: forecastDays,
        dataQuality: usageValues.length >= 30 ? 'good' : usageValues.length >= 14 ? 'fair' : 'poor'
      },
      historical: {
        averageDailyUsage: Math.round(historicalAvg * 100) / 100,
        totalUsage: usageValues.reduce((sum, val) => sum + val, 0),
        trend: linearTrend.direction,
        volatility: calculateVolatility(usageValues)
      },
      forecast: {
        dailyForecasts: forecast,
        summary: {
          totalForecastUsage: Math.round(totalForecastUsage * 100) / 100,
          averageDailyForecast: Math.round(avgDailyForecast * 100) / 100,
          peakDay: forecast.reduce((max, day) => day.estimatedUsage > max.estimatedUsage ? day : max),
          lowDay: forecast.reduce((min, day) => day.estimatedUsage < min.estimatedUsage ? day : min)
        },
        confidence: {
          overall: calculateOverallForecastConfidence(forecast),
          factors: {
            dataQuality: usageValues.length >= 30 ? 'high' : 'medium',
            volatility: calculateVolatility(usageValues) < 0.3 ? 'stable' : 'volatile',
            trend: linearTrend.direction === 'stable' ? 'predictable' : 'variable'
          }
        }
      },
      stockoutRisk,
      recommendations: generateForecastRecommendations({
        totalForecastUsage,
        avgDailyForecast,
        stockoutRisk,
        trend: linearTrend.direction
      })
    }

  } catch (error) {
    console.error('Usage forecast error:', error)
    return { error: 'Failed to generate usage forecast' }
  }
}

/**
 * Helper functions for calculations and analysis
 */

function calculateTrendDirection(values: number[]): string {
  if (values.length < 2) return 'unknown'
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100
  
  if (Math.abs(change) < 5) return 'stable'
  return change > 0 ? 'increasing' : 'decreasing'
}

function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  
  return mean > 0 ? stdDev / mean : 0
}

function detectSimpleSeasonality(values: number[]): boolean {
  if (values.length < 14) return false
  
  // Simple check for weekly patterns
  const weeklyPattern = []
  for (let i = 0; i < Math.min(4, Math.floor(values.length / 7)); i++) {
    const weekSum = values.slice(i * 7, (i + 1) * 7).reduce((sum, val) => sum + val, 0)
    weeklyPattern.push(weekSum)
  }
  
  const weeklyVolatility = calculateVolatility(weeklyPattern)
  return weeklyVolatility < 0.3 // Low volatility suggests pattern
}

function calculatePatternVariance(values: number[]): number {
  if (values.length < 2) return 0
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  
  return mean > 0 ? Math.sqrt(variance) / mean : 0
}

function compareWeekdayWeekend(weeklyPattern: any[]): any {
  const weekdays = weeklyPattern.filter(p => p.day >= 1 && p.day <= 5)
  const weekends = weeklyPattern.filter(p => p.day === 0 || p.day === 6)
  
  const weekdayAvg = weekdays.reduce((sum, day) => sum + day.avgUsage, 0) / weekdays.length
  const weekendAvg = weekends.reduce((sum, day) => sum + day.avgUsage, 0) / weekends.length
  
  return {
    weekdayAverage: Math.round(weekdayAvg * 100) / 100,
    weekendAverage: Math.round(weekendAvg * 100) / 100,
    difference: Math.round((weekdayAvg - weekendAvg) * 100) / 100,
    weekdayHigher: weekdayAvg > weekendAvg
  }
}

function analyzeAnomalyPatterns(anomalies: any[]): any {
  const dayOfWeekAnomalies = anomalies.reduce((acc: any, anomaly: any) => {
    const dayOfWeek = new Date(anomaly.date).getDay()
    acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1
    return acc
  }, {})
  
  return {
    hasRecurring: Object.values(dayOfWeekAnomalies).some((count: any) => count > 1),
    byDayOfWeek: dayOfWeekAnomalies,
    clustering: detectAnomalyClustering(anomalies)
  }
}

function detectAnomalyClustering(anomalies: any[]): any {
  const clusters = []
  let currentCluster: any[] = []
  
  anomalies.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  for (let i = 0; i < anomalies.length; i++) {
    if (currentCluster.length === 0) {
      currentCluster.push(anomalies[i])
    } else {
      const lastDate = new Date(currentCluster[currentCluster.length - 1].date)
      const currentDate = new Date(anomalies[i].date)
      const daysDiff = (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysDiff <= 3) {
        currentCluster.push(anomalies[i])
      } else {
        if (currentCluster.length > 1) {
          clusters.push([...currentCluster])
        }
        currentCluster = [anomalies[i]]
      }
    }
  }
  
  if (currentCluster.length > 1) {
    clusters.push(currentCluster)
  }
  
  return {
    clusterCount: clusters.length,
    clusters: clusters.map(cluster => ({
      startDate: cluster[0].date,
      endDate: cluster[cluster.length - 1].date,
      anomalyCount: cluster.length
    }))
  }
}

function detectZeroUsageStreaks(dates: string[], dailyUsage: any): any[] {
  const streaks = []
  let currentStreak: string[] = []
  
  for (const date of dates) {
    if (dailyUsage[date] === 0) {
      currentStreak.push(date)
    } else {
      if (currentStreak.length > 1) {
        streaks.push({
          startDate: currentStreak[0],
          endDate: currentStreak[currentStreak.length - 1],
          duration: currentStreak.length
        })
      }
      currentStreak = []
    }
  }
  
  if (currentStreak.length > 1) {
    streaks.push({
      startDate: currentStreak[0],
      endDate: currentStreak[currentStreak.length - 1],
      duration: currentStreak.length
    })
  }
  
  return streaks
}

function calculateMovingAverage(values: number[], window: number): number {
  const recentValues = values.slice(-window)
  return recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length
}

function calculateExponentialSmoothing(values: number[], alpha: number): any {
  let smoothed = values[0]
  
  for (let i = 1; i < values.length; i++) {
    smoothed = alpha * values[i] + (1 - alpha) * smoothed
  }
  
  return {
    forecast: smoothed,
    alpha
  }
}

function calculateLinearTrend(values: number[]): any {
  const n = values.length
  const x = Array.from({ length: n }, (_, i) => i + 1)
  const y = values
  
  const sumX = x.reduce((sum, val) => sum + val, 0)
  const sumY = y.reduce((sum, val) => sum + val, 0)
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
  const sumXX = x.reduce((sum, val) => sum + val * val, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  const direction = Math.abs(slope) < 0.01 ? 'stable' : slope > 0 ? 'increasing' : 'decreasing'
  
  return {
    slope,
    intercept,
    direction
  }
}

function calculateForecastConfidence(dayNumber: number, historicalDays: number): string {
  const dataQualityFactor = Math.min(1, historicalDays / 30)
  const decayFactor = Math.exp(-dayNumber / 10) // Confidence decreases with time
  const confidence = dataQualityFactor * decayFactor
  
  if (confidence > 0.8) return 'high'
  if (confidence > 0.6) return 'medium'
  return 'low'
}

function calculateOverallForecastConfidence(forecast: any[]): string {
  const avgConfidence = forecast.reduce((sum, day) => {
    const confidenceValue = day.confidence === 'high' ? 0.9 : day.confidence === 'medium' ? 0.7 : 0.4
    return sum + confidenceValue
  }, 0) / forecast.length
  
  if (avgConfidence > 0.8) return 'high'
  if (avgConfidence > 0.6) return 'medium'
  return 'low'
}

function calculateStockoutRisk(currentStock: number, dailyUsage: number, days: number): any {
  const daysRemaining = currentStock / Math.max(dailyUsage, 0.1)
  const totalEstimatedUsage = dailyUsage * days
  
  let risk: string
  if (daysRemaining <= days * 0.25) risk = 'high'
  else if (daysRemaining <= days * 0.5) risk = 'medium'
  else risk = 'low'
  
  return {
    currentStock,
    estimatedUsage: Math.round(totalEstimatedUsage * 100) / 100,
    daysRemaining: Math.round(daysRemaining * 100) / 100,
    risk,
    stockoutDate: daysRemaining <= days ? 
      new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null
  }
}

function generateComprehensiveSummary(analysisResults: any): any {
  return {
    hasReliableData: analysisResults.trends && !analysisResults.trends.error,
    overallStability: analysisResults.trends?.analysis?.isStable ? 'stable' : 'variable',
    seasonalityDetected: analysisResults.seasonal?.insights?.hasSeasonalPattern || false,
    anomaliesDetected: (analysisResults.anomalies?.summary?.totalAnomalies || 0) > 0,
    forecastQuality: analysisResults.forecast?.forecast?.confidence?.overall || 'unknown'
  }
}

function generateUsageRecommendations(analysisResults: any): string[] {
  const recommendations: string[] = []
  
  if (analysisResults.trends?.analysis?.highVolatility) {
    recommendations.push('High usage volatility detected - consider more frequent monitoring')
  }
  
  if (analysisResults.seasonal?.insights?.strongSeasonality) {
    recommendations.push('Strong seasonal patterns - adjust inventory levels seasonally')
  }
  
  if (analysisResults.anomalies?.summary?.totalAnomalies > 5) {
    recommendations.push('Multiple usage anomalies detected - investigate operational changes')
  }
  
  if (analysisResults.forecast?.stockoutRisk?.risk === 'high') {
    recommendations.push('High stockout risk - immediate reorder recommended')
  }
  
  return recommendations
}

function generateForecastRecommendations(params: any): string[] {
  const recommendations: string[] = []
  
  if (params.stockoutRisk?.risk === 'high') {
    recommendations.push('Urgent reorder needed - high stockout risk within forecast period')
  } else if (params.stockoutRisk?.risk === 'medium') {
    recommendations.push('Schedule reorder soon - moderate stockout risk')
  }
  
  if (params.trend === 'increasing') {
    recommendations.push('Usage trending upward - consider increasing par levels')
  } else if (params.trend === 'decreasing') {
    recommendations.push('Usage trending downward - consider reducing order quantities')
  }
  
  return recommendations
}