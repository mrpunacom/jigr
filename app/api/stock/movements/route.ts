/**
 * Stock Movement Tracking API
 * 
 * Handles comprehensive stock movement tracking including:
 * - Recording all stock movements (in/out/adjustments/transfers)
 * - Historical movement analytics and reporting
 * - Usage pattern analysis for better forecasting
 * - Audit trail for compliance and tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/stock/movements - Get stock movement history with filtering
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const itemId = searchParams.get('item_id')
    const movementType = searchParams.get('movement_type') // usage, receiving, adjustment, transfer, waste
    const direction = searchParams.get('direction') // in, out
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date') || new Date().toISOString()
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeAnalytics = searchParams.get('include_analytics') === 'true'

    console.log(`📊 Getting stock movements for user ${user_id}`)

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('stock_movements')
      .select(`
        id,
        inventory_item_id,
        movement_type,
        quantity,
        direction,
        reason,
        notes,
        movement_date,
        reference_id,
        created_at,
        InventoryItems:inventory_items(
          id,
          item_name,
          unit_of_measurement,
          current_quantity,
          category
        ),
        CreatedBy:profiles!created_by(
          id,
          full_name
        ),
        PurchaseOrders:PurchaseOrders(
          id,
          order_number,
          vendor_id,
          Vendors:Vendors(
            id,
            name
          )
        )
      `)
      .eq('user_id', user_id)

    // Apply filters
    if (itemId) {
      query = query.eq('inventory_item_id', itemId)
    }

    if (movementType) {
      query = query.eq('movement_type', movementType)
    }

    if (direction) {
      query = query.eq('direction', direction)
    }

    if (startDate) {
      query = query.gte('movement_date', startDate)
    }

    if (endDate) {
      query = query.lte('movement_date', endDate)
    }

    // Apply sorting and pagination
    query = query
      .order('movement_date', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: movements, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('stock_movements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)

    let analytics = null
    if (includeAnalytics) {
      analytics = await generateMovementAnalytics(user_id, itemId, startDate, endDate, supabase)
    }

    return NextResponse.json({
      movements: movements || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      },
      analytics
    })

  } catch (error) {
    console.error('Stock movements GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/stock/movements - Record new stock movement
export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.item_id || !body.movement_type || !body.quantity || !body.direction) {
      return NextResponse.json(
        { error: 'Item ID, movement type, quantity, and direction are required' },
        { status: 400 }
      )
    }

    if (body.quantity <= 0) {
      return NextResponse.json(
        { error: 'Quantity must be positive' },
        { status: 400 }
      )
    }

    if (!['in', 'out'].includes(body.direction)) {
      return NextResponse.json(
        { error: 'Direction must be "in" or "out"' },
        { status: 400 }
      )
    }

    const validMovementTypes = ['usage', 'receiving', 'adjustment', 'transfer', 'waste', 'production']
    if (!validMovementTypes.includes(body.movement_type)) {
      return NextResponse.json(
        { error: `Invalid movement type. Must be one of: ${validMovementTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Get current inventory item
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('id, item_name, current_quantity, unit_of_measurement')
      .eq('id', body.item_id)
      .eq('user_id', user_id)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const currentQty = item.current_quantity || 0

    // Calculate new quantity
    let newQuantity = currentQty
    if (body.direction === 'in') {
      newQuantity += body.quantity
    } else {
      newQuantity -= body.quantity
    }

    // Prevent negative stock unless explicitly allowed
    if (newQuantity < 0 && !body.allow_negative) {
      return NextResponse.json(
        { error: `Insufficient stock. Current: ${currentQty}, Requested: ${body.quantity}` },
        { status: 400 }
      )
    }

    console.log(`📦 Recording ${body.direction} movement: ${item.item_name} ${body.direction === 'in' ? '+' : '-'}${body.quantity}`)

    // Record the movement first
    const movementData = {
      user_id,
      inventory_item_id: body.item_id,
      movement_type: body.movement_type,
      quantity: body.quantity,
      direction: body.direction,
      reason: body.reason || `${body.movement_type} movement`,
      notes: body.notes || '',
      movement_date: body.movement_date || new Date().toISOString(),
      reference_id: body.reference_id || null,
      created_by: user_id,
      batch_id: body.batch_id || null,
      location_from: body.location_from || null,
      location_to: body.location_to || null,
      unit_cost: body.unit_cost || null
    }

    const { data: movement, error: movementError } = await supabase
      .from('stock_movements')
      .insert(movementData)
      .select()
      .single()

    if (movementError) {
      console.error('Movement recording error:', movementError)
      return NextResponse.json({ error: 'Failed to record stock movement' }, { status: 500 })
    }

    // Update inventory quantity if not a transfer-only movement
    if (!body.skip_inventory_update) {
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          current_quantity: newQuantity,
          last_updated: new Date().toISOString(),
          updated_by: user_id,
          ...(body.direction === 'in' && body.movement_type === 'receiving' && {
            last_restocked: new Date().toISOString()
          })
        })
        .eq('id', body.item_id)
        .eq('user_id', user_id)

      if (updateError) {
        console.error('Inventory update error:', updateError)
        // Try to rollback the movement
        await supabase.from('stock_movements').delete().eq('id', movement.id)
        return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
      }
    }

    // Get updated item details for response
    const { data: updatedItem } = await supabase
      .from('inventory_items')
      .select(`
        id,
        item_name,
        current_quantity,
        par_level_low,
        par_level_high,
        unit_of_measurement
      `)
      .eq('id', body.item_id)
      .single()

    // Calculate new stock status
    const stockStatus = calculateStockStatus(updatedItem)

    // Check if this movement triggers any alerts
    const alerts = await checkStockAlerts(updatedItem, stockStatus, supabase)

    return NextResponse.json({
      success: true,
      movement,
      item: updatedItem,
      previousQuantity: currentQty,
      newQuantity: updatedItem?.current_quantity || newQuantity,
      stockStatus,
      alerts
    }, { status: 201 })

  } catch (error) {
    console.error('Stock movement POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Generate movement analytics for reporting
 */
async function generateMovementAnalytics(
  userId: string,
  itemId: string | null,
  startDate: string | null,
  endDate: string | null,
  supabase: any
): Promise<any> {
  try {
    // Calculate date range (default to last 30 days)
    const end = new Date(endDate || new Date())
    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

    // Build query for analytics
    let query = supabase
      .from('stock_movements')
      .select(`
        movement_type,
        quantity,
        direction,
        movement_date,
        inventory_item_id,
        InventoryItems:inventory_items(
          item_name,
          category,
          unit_of_measurement
        )
      `)
      .eq('user_id', userId)
      .gte('movement_date', start.toISOString())
      .lte('movement_date', end.toISOString())

    if (itemId) {
      query = query.eq('inventory_item_id', itemId)
    }

    const { data: movements } = await query

    if (!movements || movements.length === 0) {
      return {
        totalMovements: 0,
        summary: {},
        trends: [],
        topItems: []
      }
    }

    // Calculate summary statistics
    const summary = {
      totalIn: movements.filter(m => m.direction === 'in').reduce((sum, m) => sum + m.quantity, 0),
      totalOut: movements.filter(m => m.direction === 'out').reduce((sum, m) => sum + m.quantity, 0),
      byType: movements.reduce((acc: any, m) => {
        if (!acc[m.movement_type]) acc[m.movement_type] = { in: 0, out: 0 }
        acc[m.movement_type][m.direction] += m.quantity
        return acc
      }, {}),
      byCategory: movements.reduce((acc: any, m) => {
        const category = m.InventoryItems?.category || 'Uncategorized'
        if (!acc[category]) acc[category] = { in: 0, out: 0 }
        acc[category][m.direction] += m.quantity
        return acc
      }, {})
    }

    // Calculate daily trends
    const dailyTrends = movements.reduce((acc: any, m) => {
      const date = m.movement_date.split('T')[0]
      if (!acc[date]) acc[date] = { in: 0, out: 0, net: 0 }
      acc[date][m.direction] += m.quantity
      acc[date].net += m.direction === 'in' ? m.quantity : -m.quantity
      return acc
    }, {})

    const trends = Object.entries(dailyTrends).map(([date, data]: [string, any]) => ({
      date,
      ...data
    })).sort((a, b) => a.date.localeCompare(b.date))

    // Top items by movement volume
    const itemMovements = movements.reduce((acc: any, m) => {
      const itemId = m.inventory_item_id
      if (!acc[itemId]) {
        acc[itemId] = {
          itemId,
          itemName: m.InventoryItems?.item_name || 'Unknown',
          totalQuantity: 0,
          movementCount: 0
        }
      }
      acc[itemId].totalQuantity += m.quantity
      acc[itemId].movementCount += 1
      return acc
    }, {})

    const topItems = Object.values(itemMovements)
      .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10)

    return {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      },
      totalMovements: movements.length,
      summary,
      trends,
      topItems
    }

  } catch (error) {
    console.error('Analytics generation error:', error)
    return null
  }
}

/**
 * Calculate stock status for alerts
 */
function calculateStockStatus(item: any): any {
  const currentQty = item?.current_quantity || 0
  const parLow = item?.par_level_low || 0
  const parHigh = item?.par_level_high || parLow * 2

  let status: string
  let severity: number

  if (currentQty <= 0) {
    status = 'out_of_stock'
    severity = 5
  } else if (currentQty <= parLow * 0.5) {
    status = 'critical'
    severity = 4
  } else if (currentQty <= parLow) {
    status = 'low'
    severity = 3
  } else if (currentQty <= parHigh) {
    status = 'optimal'
    severity = 2
  } else {
    status = 'overstock'
    severity = 1
  }

  return { status, severity, currentQuantity: currentQty, parLow, parHigh }
}

/**
 * Check if stock movement triggers any alerts
 */
async function checkStockAlerts(item: any, stockStatus: any, supabase: any): Promise<any[]> {
  const alerts: any[] = []

  if (stockStatus.severity >= 4) {
    alerts.push({
      type: 'low_stock',
      severity: stockStatus.severity === 5 ? 'critical' : 'high',
      message: stockStatus.severity === 5 
        ? `${item.item_name} is out of stock`
        : `${item.item_name} is critically low (${stockStatus.currentQuantity} ${item.unit_of_measurement})`,
      itemId: item.id,
      itemName: item.item_name,
      currentQuantity: stockStatus.currentQuantity,
      recommendedAction: 'Place urgent order'
    })
  } else if (stockStatus.severity === 3) {
    alerts.push({
      type: 'low_stock',
      severity: 'medium',
      message: `${item.item_name} is below reorder point (${stockStatus.currentQuantity}/${stockStatus.parLow})`,
      itemId: item.id,
      itemName: item.item_name,
      currentQuantity: stockStatus.currentQuantity,
      recommendedAction: 'Schedule reorder'
    })
  }

  // Record alerts in database for tracking
  for (const alert of alerts) {
    try {
      await supabase.from('stock_alerts').insert({
        user_id: item.user_id,
        inventory_item_id: item.id,
        alert_type: alert.type,
        severity: alert.severity,
        message: alert.message,
        is_active: true,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to record alert:', error)
    }
  }

  return alerts
}