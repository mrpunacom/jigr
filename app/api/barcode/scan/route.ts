/**
 * Mobile Scanning Workflow API
 * 
 * Handles complete mobile barcode scanning workflows including:
 * - Real-time scanning session management
 * - Batch scanning for inventory counts
 * - Quick stock updates and adjustments
 * - Receiving workflow integration
 * - Mobile-optimized responses for offline capability
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// POST /api/barcode/scan - Start or continue scanning session
export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    const {
      workflow_type, // 'inventory_count', 'receiving', 'quick_update', 'stock_take'
      session_id,
      barcode,
      quantity,
      operation, // 'scan', 'update_quantity', 'complete_session', 'cancel_session'
      location,
      notes,
      batch_data // For batch operations
    } = body

    // Validate required fields
    if (!workflow_type) {
      return NextResponse.json(
        { error: 'Workflow type is required' },
        { status: 400 }
      )
    }

    console.log(`📱 Mobile scan operation: ${operation} for workflow: ${workflow_type}`)

    let result: any = {}

    switch (operation) {
      case 'start_session':
        result = await startScanningSession({
          workflowType: workflow_type,
          userId: user_id,
          location,
          supabase
        })
        break

      case 'scan':
        if (!barcode) {
          return NextResponse.json({ error: 'Barcode is required for scan operation' }, { status: 400 })
        }
        result = await processScan({
          sessionId: session_id,
          barcode,
          quantity: quantity || 1,
          workflowType: workflow_type,
          userId: user_id,
          location,
          notes,
          supabase
        })
        break

      case 'update_quantity':
        result = await updateScannedQuantity({
          sessionId: session_id,
          barcode,
          quantity,
          userId: user_id,
          supabase
        })
        break

      case 'batch_scan':
        if (!batch_data || !Array.isArray(batch_data)) {
          return NextResponse.json({ error: 'Batch data is required for batch operations' }, { status: 400 })
        }
        result = await processBatchScan({
          batchData: batch_data,
          workflowType: workflow_type,
          userId: user_id,
          location,
          supabase
        })
        break

      case 'complete_session':
        result = await completeSession({
          sessionId: session_id,
          workflowType: workflow_type,
          userId: user_id,
          supabase
        })
        break

      case 'cancel_session':
        result = await cancelSession({
          sessionId: session_id,
          userId: user_id,
          supabase
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Use start_session, scan, update_quantity, batch_scan, complete_session, or cancel_session' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      operation,
      workflowType: workflow_type,
      timestamp: new Date().toISOString(),
      ...result
    })

  } catch (error) {
    console.error('Mobile scan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/barcode/scan/sessions - Get active scanning sessions
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const sessionId = searchParams.get('session_id')
    const status = searchParams.get('status') || 'active'
    const workflowType = searchParams.get('workflow_type')

    if (sessionId) {
      // Get specific session details
      const sessionDetails = await getSessionDetails({
        sessionId,
        userId: user_id,
        supabase
      })

      return NextResponse.json(sessionDetails)
    } else {
      // Get list of sessions
      const sessions = await getUserSessions({
        userId: user_id,
        status,
        workflowType,
        supabase
      })

      return NextResponse.json({
        sessions,
        totalSessions: sessions.length
      })
    }

  } catch (error) {
    console.error('Get scanning sessions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Start a new scanning session
 */
async function startScanningSession(params: {
  workflowType: string
  userId: string
  location?: string
  supabase: any
}): Promise<any> {
  const { workflowType, userId, location, supabase } = params

  try {
    // Generate session ID
    const sessionId = `scan_${workflowType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create session record
    const { data: session, error: sessionError } = await supabase
      .from('scanning_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        workflow_type: workflowType,
        location: location || null,
        status: 'active',
        started_at: new Date().toISOString(),
        scanned_items_count: 0,
        total_quantity_scanned: 0
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return { error: 'Failed to create scanning session' }
    }

    // Get workflow-specific configuration
    const workflowConfig = getWorkflowConfiguration(workflowType)

    console.log(`📱 Started ${workflowType} scanning session: ${sessionId}`)

    return {
      session: {
        id: sessionId,
        workflowType,
        location,
        status: 'active',
        startedAt: session.started_at,
        scannedItemsCount: 0,
        totalQuantityScanned: 0
      },
      workflowConfig,
      instructions: getWorkflowInstructions(workflowType)
    }

  } catch (error) {
    console.error('Start scanning session error:', error)
    return { error: 'Failed to start scanning session' }
  }
}

/**
 * Process a barcode scan
 */
async function processScan(params: {
  sessionId: string
  barcode: string
  quantity: number
  workflowType: string
  userId: string
  location?: string
  notes?: string
  supabase: any
}): Promise<any> {
  const { sessionId, barcode, quantity, workflowType, userId, location, notes, supabase } = params

  try {
    // Validate session
    const { data: session } = await supabase
      .from('scanning_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (!session) {
      return { error: 'Invalid or inactive scanning session' }
    }

    // Lookup barcode to get product information
    const barcodeResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/barcode/lookup?barcode=${barcode}&check_inventory=true`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    let productData = null
    let inventoryMatches = []
    
    if (barcodeResponse.ok) {
      const barcodeData = await barcodeResponse.json()
      if (barcodeData.found) {
        productData = barcodeData.product
        inventoryMatches = barcodeData.inventoryMatches || []
      }
    }

    // Check if item already scanned in this session
    const { data: existingItem } = await supabase
      .from('scanning_session_items')
      .select('*')
      .eq('session_id', sessionId)
      .eq('barcode', barcode)
      .single()

    let scanResult: any

    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + quantity
      
      const { data: updatedItem, error: updateError } = await supabase
        .from('scanning_session_items')
        .update({
          quantity: newQuantity,
          last_scanned_at: new Date().toISOString(),
          scan_count: existingItem.scan_count + 1
        })
        .eq('id', existingItem.id)
        .select()
        .single()

      if (updateError) {
        return { error: 'Failed to update scanned item' }
      }

      scanResult = {
        action: 'updated_existing',
        item: updatedItem,
        previousQuantity: existingItem.quantity,
        newQuantity
      }
    } else {
      // Create new scanned item
      const { data: newItem, error: insertError } = await supabase
        .from('scanning_session_items')
        .insert({
          session_id: sessionId,
          barcode,
          quantity,
          product_name: productData?.name || 'Unknown Product',
          product_brand: productData?.brand,
          product_category: productData?.category,
          inventory_item_id: inventoryMatches[0]?.id || null,
          location: location || session.location,
          notes: notes || '',
          scanned_at: new Date().toISOString(),
          last_scanned_at: new Date().toISOString(),
          scan_count: 1
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert scanned item error:', insertError)
        return { error: 'Failed to record scanned item' }
      }

      scanResult = {
        action: 'new_item',
        item: newItem
      }
    }

    // Update session statistics
    await updateSessionStatistics(sessionId, supabase)

    // Process workflow-specific actions
    const workflowResult = await processWorkflowSpecificActions({
      workflowType,
      sessionId,
      barcode,
      quantity,
      productData,
      inventoryMatches,
      userId,
      supabase
    })

    return {
      scanResult,
      productData,
      inventoryMatches: inventoryMatches.slice(0, 3), // Top 3 matches
      workflowResult,
      sessionSummary: await getSessionSummary(sessionId, supabase)
    }

  } catch (error) {
    console.error('Process scan error:', error)
    return { error: 'Failed to process scan' }
  }
}

/**
 * Update scanned quantity
 */
async function updateScannedQuantity(params: {
  sessionId: string
  barcode: string
  quantity: number
  userId: string
  supabase: any
}): Promise<any> {
  const { sessionId, barcode, quantity, userId, supabase } = params

  try {
    const { data: item, error } = await supabase
      .from('scanning_session_items')
      .update({
        quantity,
        last_scanned_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .eq('barcode', barcode)
      .select()
      .single()

    if (error) {
      return { error: 'Failed to update quantity' }
    }

    // Update session statistics
    await updateSessionStatistics(sessionId, supabase)

    return {
      item,
      sessionSummary: await getSessionSummary(sessionId, supabase)
    }

  } catch (error) {
    console.error('Update quantity error:', error)
    return { error: 'Failed to update quantity' }
  }
}

/**
 * Process batch scan
 */
async function processBatchScan(params: {
  batchData: any[]
  workflowType: string
  userId: string
  location?: string
  supabase: any
}): Promise<any> {
  const { batchData, workflowType, userId, location, supabase } = params

  try {
    // Start a new session for batch
    const sessionResult = await startScanningSession({
      workflowType: `batch_${workflowType}`,
      userId,
      location,
      supabase
    })

    if (sessionResult.error) {
      return sessionResult
    }

    const sessionId = sessionResult.session.id
    const results = []
    let successCount = 0
    let errorCount = 0

    for (const item of batchData) {
      try {
        if (!item.barcode) {
          results.push({
            barcode: item.barcode,
            error: 'Barcode is required'
          })
          errorCount++
          continue
        }

        const scanResult = await processScan({
          sessionId,
          barcode: item.barcode,
          quantity: item.quantity || 1,
          workflowType,
          userId,
          location: item.location || location,
          notes: item.notes,
          supabase
        })

        if (scanResult.error) {
          results.push({
            barcode: item.barcode,
            error: scanResult.error
          })
          errorCount++
        } else {
          results.push({
            barcode: item.barcode,
            success: true,
            item: scanResult.scanResult.item
          })
          successCount++
        }

      } catch (itemError) {
        results.push({
          barcode: item.barcode,
          error: itemError.message
        })
        errorCount++
      }
    }

    return {
      sessionId,
      batchSummary: {
        totalItems: batchData.length,
        successfulScans: successCount,
        errors: errorCount,
        successRate: Math.round((successCount / batchData.length) * 100)
      },
      results,
      sessionSummary: await getSessionSummary(sessionId, supabase)
    }

  } catch (error) {
    console.error('Batch scan error:', error)
    return { error: 'Failed to process batch scan' }
  }
}

/**
 * Complete scanning session
 */
async function completeSession(params: {
  sessionId: string
  workflowType: string
  userId: string
  supabase: any
}): Promise<any> {
  const { sessionId, workflowType, userId, supabase } = params

  try {
    // Get session summary
    const sessionSummary = await getSessionSummary(sessionId, supabase)

    // Process workflow completion
    const completionResult = await processWorkflowCompletion({
      sessionId,
      workflowType,
      sessionSummary,
      userId,
      supabase
    })

    // Mark session as completed
    const { error: updateError } = await supabase
      .from('scanning_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_summary: sessionSummary
      })
      .eq('id', sessionId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Session completion error:', updateError)
      return { error: 'Failed to complete session' }
    }

    console.log(`✅ Completed ${workflowType} scanning session: ${sessionId}`)

    return {
      sessionSummary,
      completionResult,
      inventoryUpdates: completionResult.inventoryUpdates || [],
      recommendations: generateCompletionRecommendations(sessionSummary, workflowType)
    }

  } catch (error) {
    console.error('Complete session error:', error)
    return { error: 'Failed to complete scanning session' }
  }
}

/**
 * Cancel scanning session
 */
async function cancelSession(params: {
  sessionId: string
  userId: string
  supabase: any
}): Promise<any> {
  const { sessionId, userId, supabase } = params

  try {
    const { error } = await supabase
      .from('scanning_sessions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', userId)

    if (error) {
      return { error: 'Failed to cancel session' }
    }

    return {
      message: 'Session cancelled successfully'
    }

  } catch (error) {
    console.error('Cancel session error:', error)
    return { error: 'Failed to cancel session' }
  }
}

/**
 * Get workflow configuration
 */
function getWorkflowConfiguration(workflowType: string): any {
  const configs = {
    inventory_count: {
      allowQuantityEdit: true,
      requireLocation: false,
      autoApplyChanges: false,
      batchMode: true,
      duplicateHandling: 'accumulate'
    },
    receiving: {
      allowQuantityEdit: true,
      requireLocation: true,
      autoApplyChanges: true,
      batchMode: true,
      duplicateHandling: 'accumulate'
    },
    quick_update: {
      allowQuantityEdit: true,
      requireLocation: false,
      autoApplyChanges: true,
      batchMode: false,
      duplicateHandling: 'replace'
    },
    stock_take: {
      allowQuantityEdit: true,
      requireLocation: true,
      autoApplyChanges: false,
      batchMode: true,
      duplicateHandling: 'replace'
    }
  }

  return configs[workflowType] || configs.quick_update
}

/**
 * Get workflow instructions
 */
function getWorkflowInstructions(workflowType: string): string[] {
  const instructions = {
    inventory_count: [
      'Scan each item to record current quantity',
      'Tap quantity to adjust if needed',
      'Items will accumulate if scanned multiple times',
      'Review and complete when finished'
    ],
    receiving: [
      'Scan items as they arrive',
      'Verify quantities match delivery slip',
      'Specify storage location for each item',
      'Complete to update inventory levels'
    ],
    quick_update: [
      'Scan item to update stock level',
      'Enter new quantity',
      'Changes apply immediately',
      'Perfect for quick adjustments'
    ],
    stock_take: [
      'Scan all items in specified location',
      'Record actual quantities found',
      'Replace previous counts',
      'Complete to update inventory'
    ]
  }

  return instructions[workflowType] || instructions.quick_update
}

/**
 * Process workflow-specific actions
 */
async function processWorkflowSpecificActions(params: {
  workflowType: string
  sessionId: string
  barcode: string
  quantity: number
  productData: any
  inventoryMatches: any[]
  userId: string
  supabase: any
}): Promise<any> {
  const { workflowType, sessionId, barcode, quantity, productData, inventoryMatches, userId, supabase } = params

  try {
    switch (workflowType) {
      case 'quick_update':
        // Immediately update inventory for quick updates
        if (inventoryMatches.length > 0) {
          const inventoryItem = inventoryMatches[0]
          
          await supabase
            .from('inventory_items')
            .update({
              current_quantity: quantity,
              last_updated: new Date().toISOString(),
              updated_by: userId
            })
            .eq('id', inventoryItem.id)

          // Record movement
          await supabase
            .from('stock_movements')
            .insert({
              user_id: userId,
              inventory_item_id: inventoryItem.id,
              movement_type: 'adjustment',
              quantity: Math.abs(quantity - inventoryItem.current_quantity),
              direction: quantity > inventoryItem.current_quantity ? 'in' : 'out',
              reason: 'Barcode scan adjustment',
              movement_date: new Date().toISOString(),
              reference_id: sessionId,
              created_by: userId
            })

          return {
            inventoryUpdated: true,
            previousQuantity: inventoryItem.current_quantity,
            newQuantity: quantity,
            difference: quantity - inventoryItem.current_quantity
          }
        }
        break

      case 'receiving':
        // Create pending inventory updates for receiving
        if (inventoryMatches.length > 0) {
          return {
            readyForReceiving: true,
            inventoryItem: inventoryMatches[0],
            quantityToReceive: quantity
          }
        }
        break

      default:
        return { processed: false }
    }

    return { processed: true }

  } catch (error) {
    console.error('Workflow action error:', error)
    return { error: 'Failed to process workflow action' }
  }
}

/**
 * Update session statistics
 */
async function updateSessionStatistics(sessionId: string, supabase: any): Promise<void> {
  try {
    // Get updated counts
    const { data: stats } = await supabase
      .from('scanning_session_items')
      .select('quantity')
      .eq('session_id', sessionId)

    if (stats) {
      const itemCount = stats.length
      const totalQuantity = stats.reduce((sum, item) => sum + item.quantity, 0)

      await supabase
        .from('scanning_sessions')
        .update({
          scanned_items_count: itemCount,
          total_quantity_scanned: totalQuantity,
          last_activity: new Date().toISOString()
        })
        .eq('id', sessionId)
    }

  } catch (error) {
    console.error('Update session statistics error:', error)
  }
}

/**
 * Get session summary
 */
async function getSessionSummary(sessionId: string, supabase: any): Promise<any> {
  try {
    const { data: session } = await supabase
      .from('scanning_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    const { data: items } = await supabase
      .from('scanning_session_items')
      .select('*')
      .eq('session_id', sessionId)
      .order('scanned_at', { ascending: true })

    const totalItems = items?.length || 0
    const totalQuantity = items?.reduce((sum, item) => sum + item.quantity, 0) || 0
    const uniqueProducts = new Set(items?.map(item => item.barcode) || []).size

    return {
      sessionId,
      status: session?.status,
      workflowType: session?.workflow_type,
      location: session?.location,
      startedAt: session?.started_at,
      lastActivity: session?.last_activity,
      totalItems,
      totalQuantity,
      uniqueProducts,
      items: items || []
    }

  } catch (error) {
    console.error('Get session summary error:', error)
    return { error: 'Failed to get session summary' }
  }
}

/**
 * Process workflow completion
 */
async function processWorkflowCompletion(params: {
  sessionId: string
  workflowType: string
  sessionSummary: any
  userId: string
  supabase: any
}): Promise<any> {
  const { sessionId, workflowType, sessionSummary, userId, supabase } = params

  try {
    const inventoryUpdates = []

    if (workflowType === 'receiving') {
      // Apply receiving updates to inventory
      for (const item of sessionSummary.items) {
        if (item.inventory_item_id) {
          // Update inventory quantity
          const { data: currentInventory } = await supabase
            .from('inventory_items')
            .select('current_quantity')
            .eq('id', item.inventory_item_id)
            .single()

          if (currentInventory) {
            const newQuantity = (currentInventory.current_quantity || 0) + item.quantity

            await supabase
              .from('inventory_items')
              .update({
                current_quantity: newQuantity,
                last_restocked: new Date().toISOString(),
                last_updated: new Date().toISOString()
              })
              .eq('id', item.inventory_item_id)

            // Record movement
            await supabase
              .from('stock_movements')
              .insert({
                user_id: userId,
                inventory_item_id: item.inventory_item_id,
                movement_type: 'receiving',
                quantity: item.quantity,
                direction: 'in',
                reason: 'Barcode scan receiving',
                movement_date: new Date().toISOString(),
                reference_id: sessionId,
                created_by: userId
              })

            inventoryUpdates.push({
              inventoryItemId: item.inventory_item_id,
              productName: item.product_name,
              previousQuantity: currentInventory.current_quantity,
              receivedQuantity: item.quantity,
              newQuantity
            })
          }
        }
      }
    }

    return {
      inventoryUpdates,
      processedItems: sessionSummary.totalItems,
      processedQuantity: sessionSummary.totalQuantity
    }

  } catch (error) {
    console.error('Process workflow completion error:', error)
    return { error: 'Failed to process workflow completion' }
  }
}

/**
 * Get session details
 */
async function getSessionDetails(params: {
  sessionId: string
  userId: string
  supabase: any
}): Promise<any> {
  const { sessionId, userId, supabase } = params

  try {
    const summary = await getSessionSummary(sessionId, supabase)
    
    // Get workflow configuration
    if (summary.workflowType) {
      summary.workflowConfig = getWorkflowConfiguration(summary.workflowType)
      summary.instructions = getWorkflowInstructions(summary.workflowType)
    }

    return summary

  } catch (error) {
    console.error('Get session details error:', error)
    return { error: 'Failed to get session details' }
  }
}

/**
 * Get user sessions
 */
async function getUserSessions(params: {
  userId: string
  status?: string
  workflowType?: string
  supabase: any
}): Promise<any[]> {
  const { userId, status, workflowType, supabase } = params

  try {
    let query = supabase
      .from('scanning_sessions')
      .select(`
        id,
        workflow_type,
        location,
        status,
        started_at,
        completed_at,
        cancelled_at,
        scanned_items_count,
        total_quantity_scanned
      `)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (workflowType) {
      query = query.eq('workflow_type', workflowType)
    }

    const { data: sessions } = await query.limit(50)

    return sessions || []

  } catch (error) {
    console.error('Get user sessions error:', error)
    return []
  }
}

/**
 * Generate completion recommendations
 */
function generateCompletionRecommendations(sessionSummary: any, workflowType: string): string[] {
  const recommendations: string[] = []

  if (sessionSummary.totalItems === 0) {
    recommendations.push('No items were scanned in this session')
    return recommendations
  }

  switch (workflowType) {
    case 'inventory_count':
      recommendations.push(`Counted ${sessionSummary.totalItems} unique products`)
      if (sessionSummary.totalQuantity > sessionSummary.totalItems * 5) {
        recommendations.push('High quantities detected - verify counts are accurate')
      }
      break

    case 'receiving':
      recommendations.push(`Received ${sessionSummary.totalQuantity} units across ${sessionSummary.totalItems} products`)
      recommendations.push('Verify all items have been properly stored')
      break

    case 'stock_take':
      recommendations.push('Review discrepancies and investigate variances')
      recommendations.push('Update par levels if usage patterns have changed')
      break
  }

  if (sessionSummary.uniqueProducts < sessionSummary.totalItems) {
    recommendations.push('Some products were scanned multiple times - verify this is intended')
  }

  return recommendations
}