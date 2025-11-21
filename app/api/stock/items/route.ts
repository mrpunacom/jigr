/**
 * JiGR Stock Items API - Enhanced Inventory Management
 * 
 * Handles CRUD operations for inventory items with hybrid counting workflow support
 * Supports all 5 counting workflows: unit_count, container_weight, bottle_hybrid, keg_weight, batch_weight
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getAuthenticatedClientId, 
  errorResponse, 
  successResponse,
  validateRequired,
  validateCountingWorkflow,
  validatePositiveNumber,
  getQueryParam,
  getBooleanQueryParam,
  logApiRequest
} from '@/lib/api-utils'
import type { InventoryItem, StockItemsResponse, CountingWorkflow } from '@/types/stock'

// ============================================================================
// GET /api/stock/items - List Items with Advanced Filtering
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { client_id, user_id, supabase } = await getAuthenticatedClientId()
    const { searchParams } = new URL(request.url)
    
    // Log the request for debugging
    logApiRequest('/api/stock/items', 'GET', client_id, user_id)
    
    // Parse query parameters for filtering
    const workflow = getQueryParam(searchParams, 'workflow') as CountingWorkflow | null
    const supportsWeight = getBooleanQueryParam(searchParams, 'supports_weight')
    const isBottled = getBooleanQueryParam(searchParams, 'is_bottled')
    const isKeg = getBooleanQueryParam(searchParams, 'is_keg')
    const isBatch = getBooleanQueryParam(searchParams, 'is_batch')
    const search = getQueryParam(searchParams, 'search')
    const categoryId = getQueryParam(searchParams, 'category_id')
    const location = getQueryParam(searchParams, 'location')
    const status = getQueryParam(searchParams, 'status') || 'active'
    
    // Legacy support for existing query parameters
    const category = getQueryParam(searchParams, 'category') // Support legacy 'category' param
    const sortBy = getQueryParam(searchParams, 'sortBy') || 'name'
    const sortOrder = getQueryParam(searchParams, 'sortOrder') || 'asc'
    const page = parseInt(getQueryParam(searchParams, 'page') || '1')
    const pageSize = parseInt(getQueryParam(searchParams, 'pageSize') || '20')
    
    // Build the base query with enhanced joins for hybrid counting
    let query = supabase
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
        ),
        inventory_counts!left(
          counted_quantity,
          count_date,
          counting_method,
          counted_by_user_id
        )
      `)
      .eq('client_id', client_id)
    
    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }
    // If status === 'all', don't filter by is_active
    
    // Apply workflow filter (NEW)
    if (workflow) {
      const workflowError = validateCountingWorkflow(workflow)
      if (workflowError) {
        return errorResponse(workflowError, 400)
      }
      query = query.eq('counting_workflow', workflow)
    }
    
    // Apply capability filters (NEW)
    if (supportsWeight !== null) {
      query = query.eq('supports_weight_counting', supportsWeight)
    }
    
    if (isBottled !== null) {
      query = query.eq('is_bottled_product', isBottled)
    }
    
    if (isKeg !== null) {
      query = query.eq('is_keg', isKeg)
    }
    
    if (isBatch !== null) {
      query = query.eq('is_batch_tracked', isBatch)
    }
    
    // Apply category filter (support both legacy and new parameter names)
    const effectiveCategoryId = categoryId || category
    if (effectiveCategoryId) {
      query = query.eq('category_id', effectiveCategoryId)
    }
    
    // Apply location filter (NEW)
    if (location) {
      query = query.ilike('storage_location', `%${location}%`)
    }
    
    // Apply search filter (enhanced to include more fields)
    if (search) {
      query = query.or(`
        item_name.ilike.%${search}%,
        brand.ilike.%${search}%,
        barcode.ilike.%${search}%,
        item_code.ilike.%${search}%
      `)
    }
    
    // Apply sorting (enhanced)
    const sortColumn = sortBy === 'name' ? 'item_name' : 
                      sortBy === 'category' ? 'category_id' :
                      sortBy === 'workflow' ? 'counting_workflow' :
                      sortBy === 'last_counted' ? 'updated_at' : 'item_name'
    
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' })
    
    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
    
    // Execute the query
    const { data, error, count } = await query
    
    if (error) {
      console.error('Error fetching items:', error)
      return errorResponse(`Failed to fetch inventory items: ${error.message}`, 500)
    }
    
    // Process the data to include latest count info (preserve legacy format)
    const processedItems = data?.map(item => ({
      ...item,
      category_name: item.category?.name || item.inventory_categories?.name,
      // Get the most recent count for legacy compatibility
      quantity_on_hand: item.inventory_counts?.[0]?.counted_quantity || 0,
      count_date: item.inventory_counts?.[0]?.count_date,
      counted_by: item.inventory_counts?.[0]?.counted_by_user_id
    })) || []

    // Apply client-side filters for stock levels (preserve legacy functionality)
    let filteredItems = processedItems
    if (status === 'low_stock') {
      filteredItems = processedItems.filter(item => 
        item.par_level_low && item.quantity_on_hand && item.quantity_on_hand < item.par_level_low
      )
    } else if (status === 'out_of_stock') {
      filteredItems = processedItems.filter(item => 
        !item.quantity_on_hand || item.quantity_on_hand === 0
      )
    }
    
    // Group items by workflow for enhanced frontend consumption
    const grouped: Record<CountingWorkflow, InventoryItem[]> = {
      unit_count: [],
      container_weight: [],
      bottle_hybrid: [],
      keg_weight: [],
      batch_weight: []
    }
    
    filteredItems.forEach((item) => {
      const workflow = item.counting_workflow as CountingWorkflow || 'unit_count'
      if (grouped[workflow]) {
        grouped[workflow].push(item as InventoryItem)
      }
    })
    
    // Return enhanced response while maintaining legacy compatibility
    return successResponse({
      // Legacy format
      items: filteredItems,
      pagination: {
        page,
        pageSize,
        totalItems: count || filteredItems.length,
        totalPages: Math.ceil((count || filteredItems.length) / pageSize)
      },
      // Enhanced format
      grouped,
      total: filteredItems.length
    })
    
  } catch (error: any) {
    console.error('GET /api/stock/items error:', error)
    return errorResponse(
      error.message === 'Unauthorized' ? 'Unauthorized' : 'Internal server error',
      error.message === 'Unauthorized' ? 401 : 500
    )
  }
}

// ============================================================================
// POST /api/stock/items - Create New Item with Workflow Configuration
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { client_id, user_id, supabase } = await getAuthenticatedClientId()
    const body = await request.json()
    
    // Log the request for debugging
    logApiRequest('/api/stock/items', 'POST', client_id, user_id, { item_name: body.item_name })
    
    // Validate required fields
    const validationError = validateRequired(body, ['item_name', 'category_id'])
    if (validationError) {
      return errorResponse(validationError, 400)
    }
    
    // Validate counting workflow
    const workflow = body.counting_workflow || 'unit_count'
    const workflowError = validateCountingWorkflow(workflow)
    if (workflowError) {
      return errorResponse(workflowError, 400)
    }
    
    // Validate numeric fields
    const numericFields = [
      { field: 'par_level_low', value: body.par_level_low },
      { field: 'par_level_high', value: body.par_level_high },
      { field: 'pack_size', value: body.pack_size },
      { field: 'verification_frequency_months', value: body.verification_frequency_months }
    ]
    
    for (const { field, value } of numericFields) {
      if (value !== undefined) {
        const numberError = validatePositiveNumber(value, field)
        if (numberError) {
          return errorResponse(numberError, 400)
        }
      }
    }
    
    // Build item data with defaults
    const itemData: Partial<InventoryItem> = {
      // Core identification
      client_id,
      item_name: body.item_name.trim(),
      brand: body.brand?.trim() || null,
      category_id: body.category_id,
      item_code: body.item_code?.trim() || null,
      barcode: body.barcode?.trim() || null,
      
      // Units and measurements
      recipe_unit: body.recipe_unit || 'units',
      recipe_unit_yield: body.recipe_unit_yield || null,
      count_unit: body.count_unit || null,
      count_unit_conversion: body.count_unit_conversion || null,
      
      // Par levels
      par_level_low: body.par_level_low || 0,
      par_level_high: body.par_level_high || 0,
      
      // Storage
      storage_location: body.storage_location?.trim() || null,
      
      // Workflow Configuration (NEW)
      counting_workflow: workflow as CountingWorkflow,
      supports_weight_counting: body.supports_weight_counting || false,
      typical_unit_weight_grams: body.typical_unit_weight_grams || null,
      default_container_category: body.default_container_category || null,
      requires_container: body.requires_container || false,
      supports_partial_units: body.supports_partial_units || false,
      
      // Pack Configuration (NEW)
      pack_size: body.pack_size || 1,
      pack_unit: body.pack_unit?.trim() || null,
      order_by_pack: body.order_by_pack || false,
      
      // Bottle Configuration (NEW)
      is_bottled_product: body.is_bottled_product || false,
      bottle_volume_ml: body.bottle_volume_ml || null,
      bottle_shape_id: body.bottle_shape_id || null,
      full_bottle_weight_grams: body.full_bottle_weight_grams || null,
      empty_bottle_weight_grams: body.empty_bottle_weight_grams || null,
      
      // Keg Configuration (NEW)
      is_keg: body.is_keg || false,
      keg_volume_liters: body.keg_volume_liters || null,
      empty_keg_weight_grams: body.empty_keg_weight_grams || 13300, // Standard 50L keg weight
      keg_freshness_days: body.keg_freshness_days || null,
      keg_storage_temp_min: body.keg_storage_temp_min || null,
      keg_storage_temp_max: body.keg_storage_temp_max || null,
      
      // Batch Configuration (NEW)
      is_batch_tracked: body.is_batch_tracked || false,
      batch_use_by_days: body.batch_use_by_days || null,
      batch_naming_pattern: body.batch_naming_pattern || '{item_name}-{date}',
      
      // Verification (NEW)
      verification_frequency_months: body.verification_frequency_months || 6,
      last_verification_date: null,
      
      // Status
      is_active: true,
      notes: body.notes?.trim() || null
    }
    
    // Validate workflow-specific requirements
    if (itemData.counting_workflow === 'container_weight' && !itemData.supports_weight_counting) {
      return errorResponse('Container weight workflow requires supports_weight_counting to be true', 400)
    }
    
    if (itemData.counting_workflow === 'bottle_hybrid' && !itemData.is_bottled_product) {
      return errorResponse('Bottle hybrid workflow requires is_bottled_product to be true', 400)
    }
    
    if (itemData.counting_workflow === 'keg_weight' && !itemData.is_keg) {
      return errorResponse('Keg weight workflow requires is_keg to be true', 400)
    }
    
    if (itemData.counting_workflow === 'batch_weight' && !itemData.is_batch_tracked) {
      return errorResponse('Batch weight workflow requires is_batch_tracked to be true', 400)
    }
    
    // Check for duplicate barcode if provided
    if (itemData.barcode) {
      const { data: existingItem } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('client_id', client_id)
        .eq('barcode', itemData.barcode)
        .eq('is_active', true)
        .single()
      
      if (existingItem) {
        return errorResponse('An item with this barcode already exists', 400)
      }
    }
    
    // Create the item
    const { data: item, error } = await supabase
      .from('inventory_items')
      .insert(itemData)
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
    
    if (error) {
      console.error('Error creating item:', error)
      if (error.code === '23505') { // Unique constraint violation
        return errorResponse('An item with this name or barcode already exists', 400)
      }
      return errorResponse(`Failed to create inventory item: ${error.message}`, 500)
    }
    
    return successResponse({ item: item as InventoryItem }, 201)
    
  } catch (error: any) {
    console.error('POST /api/stock/items error:', error)
    return errorResponse(
      error.message === 'Unauthorized' ? 'Unauthorized' : 'Internal server error',
      error.message === 'Unauthorized' ? 401 : 500
    )
  }
}