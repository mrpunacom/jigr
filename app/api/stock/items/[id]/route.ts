/**
 * JiGR Stock Items Detail API - Individual Item Management
 * 
 * Handles CRUD operations for individual inventory items with hybrid counting workflow support
 * GET /api/stock/items/[id] - Get item details with relations
 * PUT /api/stock/items/[id] - Update item with workflow validation
 * DELETE /api/stock/items/[id] - Soft delete item
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getAuthenticatedClientId, 
  errorResponse, 
  successResponse,
  validateRequired,
  validateCountingWorkflow,
  validatePositiveNumber,
  logApiRequest
} from '@/lib/api-utils'
import type { InventoryItem, ItemDetailResponse, CountingWorkflow } from '@/types/stock'

// ============================================================================
// GET /api/stock/items/[id] - Get Item Details with Relations
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params
    const { client_id, user_id, supabase } = await getAuthenticatedClientId()
    
    // Log the request for debugging
    logApiRequest(`/api/stock/items/${itemId}`, 'GET', client_id, user_id)
    
    // Validate item ID
    if (!itemId) {
      return errorResponse('Item ID is required', 400)
    }
    
    // Load item with enhanced relations for hybrid counting
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(
          id,
          name,
          description,
          color,
          icon
        ),
        bottle_shape:wine_bottle_shapes(
          id,
          shape_name,
          shape_category,
          typical_tare_weight_grams,
          volume_ml_750_equivalent
        )
      `)
      .eq('id', itemId)
      .eq('client_id', client_id)
      .single()
    
    if (itemError) {
      if (itemError.code === 'PGRST116') {
        return errorResponse('Item not found', 404)
      }
      console.error('Error fetching item:', itemError)
      return errorResponse(`Failed to fetch item: ${itemError.message}`, 500)
    }
    
    // Load recent count history (last 10 counts)
    const { data: recentCounts, error: countsError } = await supabase
      .from('inventory_counts')
      .select(`
        *,
        counted_by:profiles(
          first_name,
          last_name
        )
      `)
      .eq('inventory_item_id', itemId)
      .eq('client_id', client_id)
      .order('count_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (countsError) {
      console.error('Error fetching count history:', countsError)
      return errorResponse(`Failed to fetch count history: ${countsError.message}`, 500)
    }
    
    // Load container instances for this item (if it uses containers)
    let containers = null
    if (item.requires_container || item.counting_workflow === 'container_weight') {
      const { data: containerData, error: containerError } = await supabase
        .from('container_instances')
        .select(`
          *,
          container_type:container_tare_weights(
            id,
            container_type,
            typical_weight_grams,
            category
          )
        `)
        .eq('client_id', client_id)
        .eq('is_active', true)
        .eq('default_container_category', item.default_container_category || '')
        .order('container_barcode')
      
      if (!containerError) {
        containers = containerData
      }
    }
    
    // Load keg tracking data if this is a keg item
    let kegTracking = null
    if (item.is_keg) {
      const { data: kegData, error: kegError } = await supabase
        .from('keg_tracking')
        .select('*')
        .eq('inventory_item_id', itemId)
        .eq('client_id', client_id)
        .eq('keg_status', 'tapped')
        .order('tapped_date', { ascending: false })
        .limit(5)
      
      if (!kegError) {
        kegTracking = kegData
      }
    }
    
    // Process recent counts to include user names
    const processedCounts = recentCounts?.map(count => ({
      ...count,
      counted_by_name: count.counted_by ? 
        `${count.counted_by.first_name || ''} ${count.counted_by.last_name || ''}`.trim() : 
        'Unknown'
    })) || []
    
    // Calculate quantity on hand from most recent count
    const latestCount = processedCounts[0]
    const quantityOnHand = latestCount?.counted_quantity || 0
    
    // Build response with enhanced item details
    const itemDetail: ItemDetailResponse = {
      item: {
        ...item,
        // Legacy compatibility
        category_name: item.category?.name,
        quantity_on_hand: quantityOnHand,
        count_date: latestCount?.count_date,
        counted_by: latestCount?.counted_by_user_id
      } as InventoryItem,
      recent_counts: processedCounts,
      containers: containers || undefined
    }
    
    // Add keg tracking data to response if available
    const response: any = {
      ...itemDetail,
      success: true
    }
    
    if (kegTracking) {
      response.keg_tracking = kegTracking
    }
    
    return NextResponse.json(response)
    
  } catch (error: any) {
    console.error('GET /api/stock/items/[id] error:', error)
    return errorResponse(
      error.message === 'Unauthorized' ? 'Unauthorized' : 'Internal server error',
      error.message === 'Unauthorized' ? 401 : 500
    )
  }
}

// ============================================================================
// PUT /api/stock/items/[id] - Update Item with Workflow Validation
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params
    const { client_id, user_id, supabase } = await getAuthenticatedClientId()
    const body = await request.json()
    
    // Log the request for debugging
    logApiRequest(`/api/stock/items/${itemId}`, 'PUT', client_id, user_id, { item_name: body.item_name })
    
    // Validate item ID
    if (!itemId) {
      return errorResponse('Item ID is required', 400)
    }
    
    // Check if item exists and belongs to client
    const { data: existingItem, error: existingError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .eq('client_id', client_id)
      .single()
    
    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return errorResponse('Item not found', 404)
      }
      return errorResponse(`Error checking item: ${existingError.message}`, 500)
    }
    
    // Validate counting workflow if provided
    if (body.counting_workflow) {
      const workflowError = validateCountingWorkflow(body.counting_workflow)
      if (workflowError) {
        return errorResponse(workflowError, 400)
      }
    }
    
    // Validate numeric fields if provided
    const numericFields = [
      { field: 'par_level_low', value: body.par_level_low },
      { field: 'par_level_high', value: body.par_level_high },
      { field: 'pack_size', value: body.pack_size },
      { field: 'verification_frequency_months', value: body.verification_frequency_months },
      { field: 'bottle_volume_ml', value: body.bottle_volume_ml },
      { field: 'full_bottle_weight_grams', value: body.full_bottle_weight_grams },
      { field: 'empty_bottle_weight_grams', value: body.empty_bottle_weight_grams },
      { field: 'keg_volume_liters', value: body.keg_volume_liters },
      { field: 'empty_keg_weight_grams', value: body.empty_keg_weight_grams }
    ]
    
    for (const { field, value } of numericFields) {
      if (value !== undefined) {
        const numberError = validatePositiveNumber(value, field)
        if (numberError) {
          return errorResponse(numberError, 400)
        }
      }
    }
    
    // Build update data (only include provided fields)
    const updateData: Partial<InventoryItem> = {}
    
    // Core fields
    if (body.item_name !== undefined) updateData.item_name = body.item_name.trim()
    if (body.brand !== undefined) updateData.brand = body.brand?.trim() || null
    if (body.category_id !== undefined) updateData.category_id = body.category_id
    if (body.item_code !== undefined) updateData.item_code = body.item_code?.trim() || null
    if (body.barcode !== undefined) updateData.barcode = body.barcode?.trim() || null
    
    // Units and measurements
    if (body.recipe_unit !== undefined) updateData.recipe_unit = body.recipe_unit
    if (body.recipe_unit_yield !== undefined) updateData.recipe_unit_yield = body.recipe_unit_yield
    if (body.count_unit !== undefined) updateData.count_unit = body.count_unit
    if (body.count_unit_conversion !== undefined) updateData.count_unit_conversion = body.count_unit_conversion
    
    // Par levels
    if (body.par_level_low !== undefined) updateData.par_level_low = body.par_level_low
    if (body.par_level_high !== undefined) updateData.par_level_high = body.par_level_high
    
    // Storage
    if (body.storage_location !== undefined) updateData.storage_location = body.storage_location?.trim() || null
    
    // Workflow Configuration
    if (body.counting_workflow !== undefined) updateData.counting_workflow = body.counting_workflow as CountingWorkflow
    if (body.supports_weight_counting !== undefined) updateData.supports_weight_counting = body.supports_weight_counting
    if (body.typical_unit_weight_grams !== undefined) updateData.typical_unit_weight_grams = body.typical_unit_weight_grams
    if (body.default_container_category !== undefined) updateData.default_container_category = body.default_container_category
    if (body.requires_container !== undefined) updateData.requires_container = body.requires_container
    if (body.supports_partial_units !== undefined) updateData.supports_partial_units = body.supports_partial_units
    
    // Pack Configuration
    if (body.pack_size !== undefined) updateData.pack_size = body.pack_size
    if (body.pack_unit !== undefined) updateData.pack_unit = body.pack_unit?.trim() || null
    if (body.order_by_pack !== undefined) updateData.order_by_pack = body.order_by_pack
    
    // Bottle Configuration
    if (body.is_bottled_product !== undefined) updateData.is_bottled_product = body.is_bottled_product
    if (body.bottle_volume_ml !== undefined) updateData.bottle_volume_ml = body.bottle_volume_ml
    if (body.bottle_shape_id !== undefined) updateData.bottle_shape_id = body.bottle_shape_id
    if (body.full_bottle_weight_grams !== undefined) updateData.full_bottle_weight_grams = body.full_bottle_weight_grams
    if (body.empty_bottle_weight_grams !== undefined) updateData.empty_bottle_weight_grams = body.empty_bottle_weight_grams
    
    // Keg Configuration
    if (body.is_keg !== undefined) updateData.is_keg = body.is_keg
    if (body.keg_volume_liters !== undefined) updateData.keg_volume_liters = body.keg_volume_liters
    if (body.empty_keg_weight_grams !== undefined) updateData.empty_keg_weight_grams = body.empty_keg_weight_grams
    if (body.keg_freshness_days !== undefined) updateData.keg_freshness_days = body.keg_freshness_days
    if (body.keg_storage_temp_min !== undefined) updateData.keg_storage_temp_min = body.keg_storage_temp_min
    if (body.keg_storage_temp_max !== undefined) updateData.keg_storage_temp_max = body.keg_storage_temp_max
    
    // Batch Configuration
    if (body.is_batch_tracked !== undefined) updateData.is_batch_tracked = body.is_batch_tracked
    if (body.batch_use_by_days !== undefined) updateData.batch_use_by_days = body.batch_use_by_days
    if (body.batch_naming_pattern !== undefined) updateData.batch_naming_pattern = body.batch_naming_pattern
    
    // Verification
    if (body.verification_frequency_months !== undefined) updateData.verification_frequency_months = body.verification_frequency_months
    
    // Status and notes
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null
    
    // Validate workflow-specific requirements
    const finalWorkflow = updateData.counting_workflow || existingItem.counting_workflow
    const finalSupportsWeight = updateData.supports_weight_counting !== undefined ? 
      updateData.supports_weight_counting : existingItem.supports_weight_counting
    const finalIsBottled = updateData.is_bottled_product !== undefined ? 
      updateData.is_bottled_product : existingItem.is_bottled_product
    const finalIsKeg = updateData.is_keg !== undefined ? 
      updateData.is_keg : existingItem.is_keg
    const finalIsBatch = updateData.is_batch_tracked !== undefined ? 
      updateData.is_batch_tracked : existingItem.is_batch_tracked
    
    if (finalWorkflow === 'container_weight' && !finalSupportsWeight) {
      return errorResponse('Container weight workflow requires supports_weight_counting to be true', 400)
    }
    
    if (finalWorkflow === 'bottle_hybrid' && !finalIsBottled) {
      return errorResponse('Bottle hybrid workflow requires is_bottled_product to be true', 400)
    }
    
    if (finalWorkflow === 'keg_weight' && !finalIsKeg) {
      return errorResponse('Keg weight workflow requires is_keg to be true', 400)
    }
    
    if (finalWorkflow === 'batch_weight' && !finalIsBatch) {
      return errorResponse('Batch weight workflow requires is_batch_tracked to be true', 400)
    }
    
    // Check for duplicate barcode if barcode is being updated
    if (updateData.barcode && updateData.barcode !== existingItem.barcode) {
      const { data: duplicateItem } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('client_id', client_id)
        .eq('barcode', updateData.barcode)
        .eq('is_active', true)
        .neq('id', itemId)
        .single()
      
      if (duplicateItem) {
        return errorResponse('An item with this barcode already exists', 400)
      }
    }
    
    // Update the item
    const { data: updatedItem, error: updateError } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', itemId)
      .eq('client_id', client_id)
      .select(`
        *,
        category:inventory_categories(
          id,
          name,
          description,
          color,
          icon
        ),
        bottle_shape:wine_bottle_shapes(
          id,
          shape_name,
          shape_category,
          typical_tare_weight_grams
        )
      `)
      .single()
    
    if (updateError) {
      console.error('Error updating item:', updateError)
      if (updateError.code === '23505') { // Unique constraint violation
        return errorResponse('An item with this name or barcode already exists', 400)
      }
      return errorResponse(`Failed to update inventory item: ${updateError.message}`, 500)
    }
    
    return successResponse({ item: updatedItem as InventoryItem })
    
  } catch (error: any) {
    console.error('PUT /api/stock/items/[id] error:', error)
    return errorResponse(
      error.message === 'Unauthorized' ? 'Unauthorized' : 'Internal server error',
      error.message === 'Unauthorized' ? 401 : 500
    )
  }
}

// ============================================================================
// DELETE /api/stock/items/[id] - Soft Delete Item
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params
    const { client_id, user_id, supabase } = await getAuthenticatedClientId()
    
    // Log the request for debugging
    logApiRequest(`/api/stock/items/${itemId}`, 'DELETE', client_id, user_id)
    
    // Validate item ID
    if (!itemId) {
      return errorResponse('Item ID is required', 400)
    }
    
    // Check if item exists and belongs to client
    const { data: existingItem, error: existingError } = await supabase
      .from('inventory_items')
      .select('id, item_name, is_active')
      .eq('id', itemId)
      .eq('client_id', client_id)
      .single()
    
    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return errorResponse('Item not found', 404)
      }
      return errorResponse(`Error checking item: ${existingError.message}`, 500)
    }
    
    // Check if item is already inactive
    if (!existingItem.is_active) {
      return errorResponse('Item is already inactive', 400)
    }
    
    // Check for recent inventory counts (within last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: recentCounts, error: countError } = await supabase
      .from('inventory_counts')
      .select('id')
      .eq('inventory_item_id', itemId)
      .eq('client_id', client_id)
      .gte('count_date', thirtyDaysAgo.toISOString().split('T')[0])
      .limit(1)
    
    if (countError) {
      console.error('Error checking recent counts:', countError)
    }
    
    // If there are recent counts, warn but allow deletion (soft delete)
    let warningMessage = null
    if (recentCounts && recentCounts.length > 0) {
      warningMessage = 'Item has recent inventory counts. It will be marked as inactive but count history will be preserved.'
    }
    
    // Perform soft delete by setting is_active to false
    const { data: deletedItem, error: deleteError } = await supabase
      .from('inventory_items')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('client_id', client_id)
      .select('id, item_name, is_active')
      .single()
    
    if (deleteError) {
      console.error('Error deleting item:', deleteError)
      return errorResponse(`Failed to delete inventory item: ${deleteError.message}`, 500)
    }
    
    const response: any = {
      message: 'Item has been successfully marked as inactive',
      item: deletedItem
    }
    
    if (warningMessage) {
      response.warning = warningMessage
    }
    
    return successResponse(response)
    
  } catch (error: any) {
    console.error('DELETE /api/stock/items/[id] error:', error)
    return errorResponse(
      error.message === 'Unauthorized' ? 'Unauthorized' : 'Internal server error',
      error.message === 'Unauthorized' ? 401 : 500
    )
  }
}