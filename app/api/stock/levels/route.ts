/**
 * Stock Level Monitoring API
 * 
 * Provides real-time stock level monitoring and management including:
 * - Stock status classification (Critical, Low, Optimal, Overstock)
 * - Manual stock level adjustments with audit trail
 * - Par level calculations and recommendations
 * - Stock velocity and usage analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/stock/levels - Get real-time stock levels with status classification
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const status = searchParams.get('status') // critical, low, optimal, overstock, all
    const categoryId = searchParams.get('category_id')
    const location = searchParams.get('location')
    const includeInactive = searchParams.get('include_inactive') === 'true'
    const sortBy = searchParams.get('sort_by') || 'urgency'
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log(`📊 Getting stock levels for user ${user_id}, status filter: ${status || 'all'}`)

    // Get inventory items with current stock levels
    let query = supabase
      .from('inventory_items')
      .select(`
        id,
        item_name,
        current_quantity,
        par_level_low,
        par_level_high,
        unit_of_measurement,
        category,
        location,
        last_restocked,
        cost_per_unit,
        total_value,
        is_active,
        inventory_categories:inventory_categories(
          id,
          name,
          color
        ),
        VendorItems:VendorItems(
          id,
          vendor_id,
          cost_per_unit,
          is_preferred,
          minimum_order_quantity,
          Vendors:Vendors(
            id,
            name,
            delivery_days
          )
        )
      `)
      .eq('user_id', user_id)

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (location) {
      query = query.eq('location', location)
    }

    const { data: items, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch stock levels' }, { status: 500 })
    }

    // Process items and calculate stock status
    const stockLevels = items.map(item => {
      const stockStatus = calculateStockStatus(item)
      const daysOfStock = calculateDaysOfStock(item)
      const reorderSuggestion = generateReorderSuggestion(item, stockStatus)

      return {
        ...item,
        stockStatus,
        daysOfStock,
        reorderSuggestion,
        urgencyScore: calculateUrgencyScore(stockStatus, daysOfStock),
        lastUpdated: new Date().toISOString()
      }
    })

    // Filter by status if specified
    let filteredLevels = stockLevels
    if (status && status !== 'all') {
      filteredLevels = stockLevels.filter(item => 
        item.stockStatus.status.toLowerCase() === status.toLowerCase()
      )
    }

    // Sort by specified criteria
    filteredLevels = sortStockLevels(filteredLevels, sortBy)

    // Limit results
    if (limit > 0) {
      filteredLevels = filteredLevels.slice(0, limit)
    }

    // Generate summary statistics
    const summary = generateStockSummary(stockLevels)

    return NextResponse.json({
      items: filteredLevels,
      summary,
      totalItems: stockLevels.length,
      filteredItems: filteredLevels.length,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Stock levels GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/stock/levels - Manual stock level adjustment
export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.item_id || typeof body.new_quantity !== 'number') {
      return NextResponse.json(
        { error: 'Item ID and new quantity are required' },
        { status: 400 }
      )
    }

    if (body.new_quantity < 0) {
      return NextResponse.json(
        { error: 'Quantity cannot be negative' },
        { status: 400 }
      )
    }

    // Get current item details
    const { data: currentItem, error: fetchError } = await supabase
      .from('inventory_items')
      .select('id, item_name, current_quantity, unit_of_measurement')
      .eq('id', body.item_id)
      .eq('user_id', user_id)
      .single()

    if (fetchError || !currentItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const previousQuantity = currentItem.current_quantity || 0
    const quantityChange = body.new_quantity - previousQuantity

    console.log(`📝 Adjusting stock: ${currentItem.item_name} from ${previousQuantity} to ${body.new_quantity}`)

    // Update the inventory item
    const { data: updatedItem, error: updateError } = await supabase
      .from('inventory_items')
      .update({
        current_quantity: body.new_quantity,
        last_updated: new Date().toISOString(),
        updated_by: user_id
      })
      .eq('id', body.item_id)
      .eq('user_id', user_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update stock level' }, { status: 500 })
    }

    // Record the stock movement for audit trail
    await recordStockMovement({
      userId: user_id,
      itemId: body.item_id,
      movementType: 'adjustment',
      quantity: Math.abs(quantityChange),
      direction: quantityChange >= 0 ? 'in' : 'out',
      reason: body.reason || 'Manual adjustment',
      notes: body.notes || '',
      referenceId: null,
      supabase
    })

    // Calculate new stock status
    const stockStatus = calculateStockStatus(updatedItem)

    return NextResponse.json({
      success: true,
      item: updatedItem,
      stockStatus,
      movement: {
        previousQuantity,
        newQuantity: body.new_quantity,
        quantityChange,
        reason: body.reason || 'Manual adjustment'
      }
    })

  } catch (error) {
    console.error('Stock level adjustment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Calculate stock status based on current quantity and par levels
 */
function calculateStockStatus(item: any): any {
  const currentQty = item.current_quantity || 0
  const parLow = item.par_level_low || 0
  const parHigh = item.par_level_high || parLow * 2

  let status: string
  let severity: number
  let message: string
  let color: string

  if (currentQty <= 0) {
    status = 'critical'
    severity = 5
    message = 'Out of stock'
    color = '#EF4444'
  } else if (currentQty <= parLow * 0.5) {
    status = 'critical'
    severity = 4
    message = 'Critically low stock'
    color = '#EF4444'
  } else if (currentQty <= parLow) {
    status = 'low'
    severity = 3
    message = 'Low stock - reorder needed'
    color = '#F59E0B'
  } else if (currentQty <= parHigh) {
    status = 'optimal'
    severity = 2
    message = 'Optimal stock level'
    color = '#10B981'
  } else if (currentQty <= parHigh * 1.5) {
    status = 'optimal'
    severity = 1
    message = 'Good stock level'
    color = '#10B981'
  } else {
    status = 'overstock'
    severity = 1
    message = 'Overstocked - consider adjusting orders'
    color = '#6366F1'
  }

  return {
    status,
    severity,
    message,
    color,
    currentQuantity: currentQty,
    parLevelLow: parLow,
    parLevelHigh: parHigh,
    percentageOfPar: parLow > 0 ? Math.round((currentQty / parLow) * 100) : 0
  }
}

/**
 * Calculate estimated days of stock remaining
 */
function calculateDaysOfStock(item: any): number {
  const currentQty = item.current_quantity || 0
  
  // This is a simplified calculation - in a real system, you'd use historical usage data
  // For now, we'll estimate based on par levels
  const parLow = item.par_level_low || 0
  
  if (parLow <= 0 || currentQty <= 0) return 0
  
  // Assume par low represents about 7 days of stock
  const estimatedDailyUsage = parLow / 7
  
  if (estimatedDailyUsage <= 0) return 999 // Unlimited if no usage
  
  return Math.round(currentQty / estimatedDailyUsage)
}

/**
 * Generate reorder suggestion based on stock status
 */
function generateReorderSuggestion(item: any, stockStatus: any): any {
  if (stockStatus.severity <= 2) {
    return null // No reorder needed
  }

  const parHigh = item.par_level_high || (item.par_level_low || 0) * 2
  const currentQty = item.current_quantity || 0
  const suggestedQuantity = parHigh - currentQty

  // Find preferred vendor
  const vendorItems = item.VendorItems || []
  const preferredVendor = vendorItems.find((vi: any) => vi.is_preferred) || vendorItems[0]

  return {
    shouldReorder: true,
    suggestedQuantity: Math.max(suggestedQuantity, 0),
    urgency: stockStatus.severity >= 4 ? 'urgent' : 'normal',
    preferredVendor: preferredVendor ? {
      id: preferredVendor.Vendors.id,
      name: preferredVendor.Vendors.name,
      deliveryDays: preferredVendor.Vendors.delivery_days,
      unitCost: preferredVendor.cost_per_unit,
      minimumOrderQty: preferredVendor.minimum_order_quantity
    } : null
  }
}

/**
 * Calculate urgency score for sorting
 */
function calculateUrgencyScore(stockStatus: any, daysOfStock: number): number {
  let score = stockStatus.severity * 10

  // Add urgency based on days of stock
  if (daysOfStock <= 1) score += 20
  else if (daysOfStock <= 3) score += 15
  else if (daysOfStock <= 7) score += 10
  else if (daysOfStock <= 14) score += 5

  return score
}

/**
 * Sort stock levels by specified criteria
 */
function sortStockLevels(items: any[], sortBy: string): any[] {
  switch (sortBy) {
    case 'urgency':
      return items.sort((a, b) => b.urgencyScore - a.urgencyScore)
    case 'quantity':
      return items.sort((a, b) => a.current_quantity - b.current_quantity)
    case 'name':
      return items.sort((a, b) => a.item_name.localeCompare(b.item_name))
    case 'category':
      return items.sort((a, b) => (a.category || '').localeCompare(b.category || ''))
    case 'days_of_stock':
      return items.sort((a, b) => a.daysOfStock - b.daysOfStock)
    default:
      return items
  }
}

/**
 * Generate summary statistics
 */
function generateStockSummary(items: any[]): any {
  const summary = {
    total: items.length,
    critical: items.filter(i => i.stockStatus.status === 'critical').length,
    low: items.filter(i => i.stockStatus.status === 'low').length,
    optimal: items.filter(i => i.stockStatus.status === 'optimal').length,
    overstock: items.filter(i => i.stockStatus.status === 'overstock').length,
    needReorder: items.filter(i => i.reorderSuggestion?.shouldReorder).length,
    totalValue: items.reduce((sum, i) => sum + ((i.current_quantity || 0) * (i.cost_per_unit || 0)), 0)
  }

  return {
    ...summary,
    totalValue: Math.round(summary.totalValue * 100) / 100,
    stockHealth: calculateStockHealth(summary)
  }
}

/**
 * Calculate overall stock health score
 */
function calculateStockHealth(summary: any): any {
  if (summary.total === 0) return { score: 0, status: 'unknown' }

  const criticalPct = (summary.critical / summary.total) * 100
  const lowPct = (summary.low / summary.total) * 100
  const optimalPct = (summary.optimal / summary.total) * 100

  let score = 100 - (criticalPct * 3) - (lowPct * 2) + (optimalPct * 0.5)
  score = Math.max(0, Math.min(100, score))

  let status: string
  if (score >= 90) status = 'excellent'
  else if (score >= 75) status = 'good'
  else if (score >= 60) status = 'fair'
  else if (score >= 40) status = 'poor'
  else status = 'critical'

  return {
    score: Math.round(score),
    status,
    recommendations: generateHealthRecommendations(summary, score)
  }
}

/**
 * Generate health recommendations
 */
function generateHealthRecommendations(summary: any, score: number): string[] {
  const recommendations: string[] = []

  if (summary.critical > 0) {
    recommendations.push(`${summary.critical} item(s) critically low - immediate reorder required`)
  }

  if (summary.low > 5) {
    recommendations.push('Multiple items need reordering - consider bulk ordering')
  }

  if (summary.overstock > summary.total * 0.3) {
    recommendations.push('High overstock levels - review ordering patterns')
  }

  if (score < 60) {
    recommendations.push('Stock management needs attention - review par levels')
  }

  return recommendations
}

/**
 * Record stock movement for audit trail
 */
async function recordStockMovement(params: {
  userId: string
  itemId: string
  movementType: string
  quantity: number
  direction: 'in' | 'out'
  reason: string
  notes: string
  referenceId: string | null
  supabase: any
}): Promise<void> {
  try {
    const { error } = await params.supabase
      .from('stock_movements')
      .insert({
        user_id: params.userId,
        inventory_item_id: params.itemId,
        movement_type: params.movementType,
        quantity: params.quantity,
        direction: params.direction,
        reason: params.reason,
        notes: params.notes,
        reference_id: params.referenceId,
        movement_date: new Date().toISOString(),
        created_by: params.userId
      })

    if (error) {
      console.error('Failed to record stock movement:', error)
    }
  } catch (error) {
    console.error('Stock movement recording error:', error)
  }
}