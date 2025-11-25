/**
 * Low Stock Alert System API
 * 
 * Handles comprehensive alert management including:
 * - Real-time low stock alerts and notifications
 * - Configurable alert thresholds and rules
 * - Alert history and acknowledgment tracking
 * - Automated alert generation and management
 * - Alert escalation and notification preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/stock/alerts - Get active alerts with filtering
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const severity = searchParams.get('severity') // critical, high, medium, low
    const status = searchParams.get('status') || 'active' // active, acknowledged, resolved
    const alertType = searchParams.get('alert_type') // low_stock, out_of_stock, overstock, expiring
    const itemId = searchParams.get('item_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log(`🚨 Getting stock alerts for user ${user_id}`)

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('stock_alerts')
      .select(`
        id,
        inventory_item_id,
        alert_type,
        severity,
        message,
        threshold_value,
        current_value,
        is_active,
        acknowledged_at,
        acknowledged_by,
        resolved_at,
        resolved_by,
        created_at,
        updated_at,
        InventoryItems:inventory_items(
          id,
          item_name,
          current_quantity,
          par_level_low,
          par_level_high,
          unit_of_measurement,
          category,
          location
        ),
        AcknowledgedBy:profiles!acknowledged_by(
          id,
          full_name
        ),
        ResolvedBy:profiles!resolved_by(
          id,
          full_name
        )
      `)
      .eq('user_id', user_id)

    // Apply filters
    if (severity) {
      query = query.eq('severity', severity)
    }

    if (status === 'active') {
      query = query.eq('is_active', true).is('acknowledged_at', null)
    } else if (status === 'acknowledged') {
      query = query.eq('is_active', true).not('acknowledged_at', 'is', null).is('resolved_at', null)
    } else if (status === 'resolved') {
      query = query.not('resolved_at', 'is', null)
    }

    if (alertType) {
      query = query.eq('alert_type', alertType)
    }

    if (itemId) {
      query = query.eq('inventory_item_id', itemId)
    }

    // Apply sorting and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: alerts, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch stock alerts' }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('stock_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)

    // Generate summary statistics
    const summary = await generateAlertSummary(user_id, supabase)

    return NextResponse.json({
      alerts: alerts || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      },
      summary
    })

  } catch (error) {
    console.error('Stock alerts GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/stock/alerts - Create or update alert configurations
export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    if (body.action === 'acknowledge') {
      return await acknowledgeAlert(body.alert_id, user_id, supabase)
    }

    if (body.action === 'resolve') {
      return await resolveAlert(body.alert_id, user_id, body.resolution_notes, supabase)
    }

    if (body.action === 'configure_thresholds') {
      return await configureAlertThresholds(body, user_id, supabase)
    }

    if (body.action === 'scan_and_generate') {
      return await scanAndGenerateAlerts(user_id, supabase)
    }

    return NextResponse.json(
      { error: 'Invalid action. Use acknowledge, resolve, configure_thresholds, or scan_and_generate' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Stock alerts POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Acknowledge an alert
 */
async function acknowledgeAlert(alertId: string, userId: string, supabase: any): Promise<NextResponse> {
  if (!alertId) {
    return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
  }

  const { data: alert, error: fetchError } = await supabase
    .from('stock_alerts')
    .select('*')
    .eq('id', alertId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
  }

  if (alert.acknowledged_at) {
    return NextResponse.json({ error: 'Alert already acknowledged' }, { status: 400 })
  }

  const { data: updatedAlert, error: updateError } = await supabase
    .from('stock_alerts')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq('id', alertId)
    .eq('user_id', userId)
    .select()
    .single()

  if (updateError) {
    console.error('Acknowledge error:', updateError)
    return NextResponse.json({ error: 'Failed to acknowledge alert' }, { status: 500 })
  }

  console.log(`✅ Alert ${alertId} acknowledged by user ${userId}`)

  return NextResponse.json({
    success: true,
    alert: updatedAlert,
    message: 'Alert acknowledged successfully'
  })
}

/**
 * Resolve an alert
 */
async function resolveAlert(
  alertId: string,
  userId: string,
  resolutionNotes: string,
  supabase: any
): Promise<NextResponse> {
  if (!alertId) {
    return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
  }

  const { data: alert, error: fetchError } = await supabase
    .from('stock_alerts')
    .select('*')
    .eq('id', alertId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
  }

  if (alert.resolved_at) {
    return NextResponse.json({ error: 'Alert already resolved' }, { status: 400 })
  }

  const { data: updatedAlert, error: updateError } = await supabase
    .from('stock_alerts')
    .update({
      is_active: false,
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
      resolution_notes: resolutionNotes || '',
      updated_at: new Date().toISOString()
    })
    .eq('id', alertId)
    .eq('user_id', userId)
    .select()
    .single()

  if (updateError) {
    console.error('Resolve error:', updateError)
    return NextResponse.json({ error: 'Failed to resolve alert' }, { status: 500 })
  }

  console.log(`✅ Alert ${alertId} resolved by user ${userId}`)

  return NextResponse.json({
    success: true,
    alert: updatedAlert,
    message: 'Alert resolved successfully'
  })
}

/**
 * Configure alert thresholds
 */
async function configureAlertThresholds(
  config: any,
  userId: string,
  supabase: any
): Promise<NextResponse> {
  try {
    const { item_id, thresholds } = config

    if (!thresholds) {
      return NextResponse.json({ error: 'Thresholds configuration is required' }, { status: 400 })
    }

    // Validate threshold configuration
    const validThresholds = ['critical', 'low', 'overstock']
    const thresholdKeys = Object.keys(thresholds)
    
    for (const key of thresholdKeys) {
      if (!validThresholds.includes(key)) {
        return NextResponse.json(
          { error: `Invalid threshold type: ${key}` },
          { status: 400 }
        )
      }
    }

    // If item_id is provided, configure for specific item
    if (item_id) {
      const { data: item, error: itemError } = await supabase
        .from('inventory_items')
        .select('id, item_name')
        .eq('id', item_id)
        .eq('user_id', userId)
        .single()

      if (itemError || !item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      }

      // Store item-specific thresholds in alert_configurations table
      const configData = {
        user_id: userId,
        inventory_item_id: item_id,
        threshold_config: thresholds,
        updated_at: new Date().toISOString()
      }

      const { error: configError } = await supabase
        .from('alert_configurations')
        .upsert(configData, { 
          onConflict: 'user_id,inventory_item_id',
          ignoreDuplicates: false 
        })

      if (configError) {
        console.error('Configuration error:', configError)
        return NextResponse.json({ error: 'Failed to save alert configuration' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `Alert thresholds configured for ${item.item_name}`
      })
    } else {
      // Configure global default thresholds
      const globalConfig = {
        user_id: userId,
        is_global_default: true,
        threshold_config: thresholds,
        updated_at: new Date().toISOString()
      }

      const { error: globalError } = await supabase
        .from('alert_configurations')
        .upsert(globalConfig, { 
          onConflict: 'user_id,is_global_default',
          ignoreDuplicates: false 
        })

      if (globalError) {
        console.error('Global configuration error:', globalError)
        return NextResponse.json({ error: 'Failed to save global alert configuration' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Global alert thresholds configured successfully'
      })
    }

  } catch (error) {
    console.error('Configure thresholds error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Scan inventory and generate alerts
 */
async function scanAndGenerateAlerts(userId: string, supabase: any): Promise<NextResponse> {
  try {
    console.log(`🔍 Scanning inventory for alerts - user ${userId}`)

    // Get all active inventory items
    const { data: items, error: itemsError } = await supabase
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
        cost_per_unit
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (itemsError) {
      console.error('Items fetch error:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch inventory items' }, { status: 500 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No inventory items found',
        alertsGenerated: 0
      })
    }

    // Get existing active alerts to avoid duplicates
    const { data: existingAlerts } = await supabase
      .from('stock_alerts')
      .select('inventory_item_id, alert_type')
      .eq('user_id', userId)
      .eq('is_active', true)

    const existingAlertMap = (existingAlerts || []).reduce((acc: any, alert: any) => {
      const key = `${alert.inventory_item_id}_${alert.alert_type}`
      acc[key] = true
      return acc
    }, {})

    // Generate alerts
    const newAlerts = []
    
    for (const item of items) {
      const alerts = generateAlertsForItem(item, existingAlertMap)
      newAlerts.push(...alerts)
    }

    // Insert new alerts
    if (newAlerts.length > 0) {
      const alertData = newAlerts.map(alert => ({
        ...alert,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from('stock_alerts')
        .insert(alertData)

      if (insertError) {
        console.error('Alert insertion error:', insertError)
        return NextResponse.json({ error: 'Failed to create alerts' }, { status: 500 })
      }
    }

    // Auto-resolve alerts that are no longer relevant
    const resolvedCount = await autoResolveAlerts(userId, items, supabase)

    console.log(`✅ Generated ${newAlerts.length} new alerts, resolved ${resolvedCount} outdated alerts`)

    return NextResponse.json({
      success: true,
      alertsGenerated: newAlerts.length,
      alertsResolved: resolvedCount,
      message: `Scan complete: ${newAlerts.length} new alerts generated, ${resolvedCount} resolved`
    })

  } catch (error) {
    console.error('Scan and generate alerts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Generate alerts for a single inventory item
 */
function generateAlertsForItem(item: any, existingAlertMap: any): any[] {
  const alerts = []
  const currentQty = item.current_quantity || 0
  const parLow = item.par_level_low || 0
  const parHigh = item.par_level_high || parLow * 2

  // Out of stock alert
  if (currentQty <= 0) {
    const alertKey = `${item.id}_out_of_stock`
    if (!existingAlertMap[alertKey]) {
      alerts.push({
        inventory_item_id: item.id,
        alert_type: 'out_of_stock',
        severity: 'critical',
        message: `${item.item_name} is out of stock`,
        threshold_value: 0,
        current_value: currentQty,
        is_active: true
      })
    }
  }

  // Critical low stock alert
  else if (currentQty <= parLow * 0.5) {
    const alertKey = `${item.id}_critical_low`
    if (!existingAlertMap[alertKey]) {
      alerts.push({
        inventory_item_id: item.id,
        alert_type: 'critical_low',
        severity: 'critical',
        message: `${item.item_name} is critically low (${currentQty} ${item.unit_of_measurement})`,
        threshold_value: parLow * 0.5,
        current_value: currentQty,
        is_active: true
      })
    }
  }

  // Low stock alert
  else if (currentQty <= parLow) {
    const alertKey = `${item.id}_low_stock`
    if (!existingAlertMap[alertKey]) {
      alerts.push({
        inventory_item_id: item.id,
        alert_type: 'low_stock',
        severity: 'high',
        message: `${item.item_name} is below reorder point (${currentQty}/${parLow})`,
        threshold_value: parLow,
        current_value: currentQty,
        is_active: true
      })
    }
  }

  // Overstock alert
  if (currentQty > parHigh * 2) {
    const alertKey = `${item.id}_overstock`
    if (!existingAlertMap[alertKey]) {
      const excessValue = (currentQty - parHigh) * (item.cost_per_unit || 0)
      alerts.push({
        inventory_item_id: item.id,
        alert_type: 'overstock',
        severity: 'medium',
        message: `${item.item_name} is overstocked (${currentQty}/${parHigh}) - $${excessValue.toFixed(2)} excess value`,
        threshold_value: parHigh * 2,
        current_value: currentQty,
        is_active: true
      })
    }
  }

  return alerts
}

/**
 * Auto-resolve alerts that are no longer relevant
 */
async function autoResolveAlerts(userId: string, currentItems: any[], supabase: any): Promise<number> {
  try {
    // Get all active alerts
    const { data: activeAlerts } = await supabase
      .from('stock_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (!activeAlerts || activeAlerts.length === 0) {
      return 0
    }

    const itemMap = currentItems.reduce((acc: any, item: any) => {
      acc[item.id] = item
      return acc
    }, {})

    const alertsToResolve = []

    for (const alert of activeAlerts) {
      const item = itemMap[alert.inventory_item_id]
      if (!item) continue // Item might be deleted

      const currentQty = item.current_quantity || 0
      const parLow = item.par_level_low || 0
      const parHigh = item.par_level_high || parLow * 2

      let shouldResolve = false

      switch (alert.alert_type) {
        case 'out_of_stock':
          shouldResolve = currentQty > 0
          break
        case 'critical_low':
          shouldResolve = currentQty > parLow * 0.5
          break
        case 'low_stock':
          shouldResolve = currentQty > parLow
          break
        case 'overstock':
          shouldResolve = currentQty <= parHigh * 2
          break
      }

      if (shouldResolve) {
        alertsToResolve.push(alert.id)
      }
    }

    // Resolve outdated alerts
    if (alertsToResolve.length > 0) {
      const { error } = await supabase
        .from('stock_alerts')
        .update({
          is_active: false,
          resolved_at: new Date().toISOString(),
          resolution_notes: 'Auto-resolved: condition no longer applies',
          updated_at: new Date().toISOString()
        })
        .in('id', alertsToResolve)

      if (error) {
        console.error('Auto-resolve error:', error)
        return 0
      }
    }

    return alertsToResolve.length

  } catch (error) {
    console.error('Auto-resolve alerts error:', error)
    return 0
  }
}

/**
 * Generate alert summary statistics
 */
async function generateAlertSummary(userId: string, supabase: any): Promise<any> {
  try {
    // Get alert counts by status and severity
    const { data: alerts } = await supabase
      .from('stock_alerts')
      .select('alert_type, severity, is_active, acknowledged_at, resolved_at')
      .eq('user_id', userId)

    if (!alerts) {
      return {
        total: 0,
        active: 0,
        acknowledged: 0,
        resolved: 0,
        bySeverity: {},
        byType: {}
      }
    }

    const summary = {
      total: alerts.length,
      active: alerts.filter(a => a.is_active && !a.acknowledged_at).length,
      acknowledged: alerts.filter(a => a.is_active && a.acknowledged_at && !a.resolved_at).length,
      resolved: alerts.filter(a => a.resolved_at).length,
      bySeverity: alerts.reduce((acc: any, alert: any) => {
        if (alert.is_active && !alert.acknowledged_at) {
          acc[alert.severity] = (acc[alert.severity] || 0) + 1
        }
        return acc
      }, {}),
      byType: alerts.reduce((acc: any, alert: any) => {
        if (alert.is_active && !alert.acknowledged_at) {
          acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1
        }
        return acc
      }, {})
    }

    return summary

  } catch (error) {
    console.error('Alert summary error:', error)
    return {
      total: 0,
      active: 0,
      acknowledged: 0,
      resolved: 0,
      bySeverity: {},
      byType: {}
    }
  }
}