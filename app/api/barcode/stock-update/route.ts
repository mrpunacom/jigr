/**
 * Quick Stock Updates via Barcode Scanning API
 * 
 * Handles rapid stock updates using barcode scanning including:
 * - Instant inventory adjustments via barcode
 * - Smart quantity management and validation
 * - Automatic item linking and creation suggestions
 * - Bulk stock update operations
 * - Integration with stock movement tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// POST /api/barcode/stock-update - Quick stock update via barcode
export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    const {
      barcode,
      operation, // 'set_quantity', 'add_quantity', 'subtract_quantity', 'link_item', 'create_item'
      quantity,
      inventory_item_id,
      location,
      notes,
      reason,
      auto_create_item = false,
      item_data // For creating new items
    } = body

    // Validate required fields
    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode is required' },
        { status: 400 }
      )
    }

    if (!operation) {
      return NextResponse.json(
        { error: 'Operation is required (set_quantity, add_quantity, subtract_quantity, link_item, create_item)' },
        { status: 400 }
      )
    }

    console.log(`📦 Quick stock update: ${operation} for barcode ${barcode}`)

    let result: any = {}

    switch (operation) {
      case 'set_quantity':
      case 'add_quantity':
      case 'subtract_quantity':
        result = await processQuantityUpdate({
          barcode,
          operation,
          quantity,
          inventoryItemId: inventory_item_id,
          location,
          notes,
          reason,
          autoCreateItem: auto_create_item,
          itemData: item_data,
          userId: user_id,
          supabase
        })
        break

      case 'link_item':
        result = await linkBarcodeToItem({
          barcode,
          inventoryItemId: inventory_item_id,
          userId: user_id,
          supabase
        })
        break

      case 'create_item':
        result = await createItemFromBarcode({
          barcode,
          itemData: item_data || {},
          quantity: quantity || 0,
          location,
          userId: user_id,
          supabase
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      operation,
      barcode,
      timestamp: new Date().toISOString(),
      ...result
    })

  } catch (error) {
    console.error('Quick stock update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/barcode/stock-update/suggestions - Get update suggestions for barcode
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const barcode = searchParams.get('barcode')
    
    if (!barcode) {
      return NextResponse.json(
        { error: 'Barcode parameter is required' },
        { status: 400 }
      )
    }

    console.log(`💡 Getting update suggestions for barcode: ${barcode}`)

    // Look up barcode product information
    const productLookup = await lookupBarcodeProduct(barcode)

    // Find existing inventory items that might match
    const inventoryMatches = await findInventoryItemMatches({
      barcode,
      productData: productLookup.product,
      userId: user_id,
      supabase
    })

    // Check if barcode is already linked to an inventory item
    const existingLink = await getExistingBarcodeLink({
      barcode,
      userId: user_id,
      supabase
    })

    // Generate update suggestions
    const suggestions = generateUpdateSuggestions({
      barcode,
      productData: productLookup.product,
      inventoryMatches,
      existingLink
    })

    return NextResponse.json({
      barcode,
      productFound: productLookup.found,
      productData: productLookup.product,
      existingLink,
      inventoryMatches: inventoryMatches.slice(0, 5),
      suggestions,
      quickActions: generateQuickActions({
        existingLink,
        inventoryMatches,
        productData: productLookup.product
      })
    })

  } catch (error) {
    console.error('Get stock update suggestions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Process quantity update operations
 */
async function processQuantityUpdate(params: {
  barcode: string
  operation: string
  quantity: number
  inventoryItemId?: string
  location?: string
  notes?: string
  reason?: string
  autoCreateItem: boolean
  itemData?: any
  userId: string
  supabase: any
}): Promise<any> {
  const { 
    barcode, operation, quantity, inventoryItemId, location, notes, 
    reason, autoCreateItem, itemData, userId, supabase 
  } = params

  try {
    // Find target inventory item
    let targetItem = null

    if (inventoryItemId) {
      // Use specified inventory item
      const { data: item } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', inventoryItemId)
        .eq('user_id', userId)
        .single()

      targetItem = item
    } else {
      // Find item by barcode link
      const barcodeLink = await getExistingBarcodeLink({ barcode, userId, supabase })
      if (barcodeLink) {
        targetItem = barcodeLink.inventoryItem
      }
    }

    // If no item found and auto-create is enabled
    if (!targetItem && autoCreateItem) {
      const createResult = await createItemFromBarcode({
        barcode,
        itemData: itemData || {},
        quantity,
        location,
        userId,
        supabase
      })

      if (createResult.success) {
        return {
          action: 'item_created_and_updated',
          item: createResult.item,
          previousQuantity: 0,
          newQuantity: quantity,
          quantityChange: quantity
        }
      } else {
        return { error: createResult.error }
      }
    }

    if (!targetItem) {
      return { 
        error: 'No inventory item found for this barcode. Please link or create an item first.',
        suggestions: await getItemCreationSuggestions({ barcode, userId, supabase })
      }
    }

    // Calculate new quantity based on operation
    const currentQuantity = targetItem.current_quantity || 0
    let newQuantity = currentQuantity

    switch (operation) {
      case 'set_quantity':
        newQuantity = quantity
        break
      case 'add_quantity':
        newQuantity = currentQuantity + quantity
        break
      case 'subtract_quantity':
        newQuantity = currentQuantity - quantity
        break
    }

    // Validate new quantity
    if (newQuantity < 0 && operation !== 'set_quantity') {
      return { 
        error: `Cannot ${operation.replace('_', ' ')} ${quantity} - would result in negative stock (current: ${currentQuantity})`,
        currentQuantity,
        requestedChange: quantity
      }
    }

    // Update inventory item
    const { data: updatedItem, error: updateError } = await supabase
      .from('inventory_items')
      .update({
        current_quantity: Math.max(0, newQuantity),
        last_updated: new Date().toISOString(),
        updated_by: userId,
        ...(location && { location })
      })
      .eq('id', targetItem.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Inventory update error:', updateError)
      return { error: 'Failed to update inventory quantity' }
    }

    // Record stock movement
    const quantityChange = Math.abs(newQuantity - currentQuantity)
    const movementDirection = newQuantity > currentQuantity ? 'in' : 'out'

    if (quantityChange > 0) {
      await supabase
        .from('stock_movements')
        .insert({
          user_id: userId,
          inventory_item_id: targetItem.id,
          movement_type: 'adjustment',
          quantity: quantityChange,
          direction: movementDirection,
          reason: reason || `Barcode scan ${operation.replace('_', ' ')}`,
          notes: notes || '',
          movement_date: new Date().toISOString(),
          reference_id: barcode,
          created_by: userId
        })
    }

    // Check for stock alerts
    const stockAlerts = await checkForStockAlerts({
      inventoryItem: updatedItem,
      previousQuantity: currentQuantity,
      supabase
    })

    console.log(`📊 Updated stock: ${targetItem.item_name} ${currentQuantity} → ${newQuantity}`)

    return {
      action: 'quantity_updated',
      item: updatedItem,
      previousQuantity: currentQuantity,
      newQuantity,
      quantityChange: newQuantity - currentQuantity,
      operation,
      stockAlerts
    }

  } catch (error) {
    console.error('Process quantity update error:', error)
    return { error: 'Failed to process quantity update' }
  }
}

/**
 * Link barcode to existing inventory item
 */
async function linkBarcodeToItem(params: {
  barcode: string
  inventoryItemId: string
  userId: string
  supabase: any
}): Promise<any> {
  const { barcode, inventoryItemId, userId, supabase } = params

  try {
    // Verify inventory item exists and belongs to user
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', inventoryItemId)
      .eq('user_id', userId)
      .single()

    if (itemError || !item) {
      return { error: 'Inventory item not found' }
    }

    // Check if barcode is already linked to this item
    if (item.barcode === barcode) {
      return { 
        action: 'already_linked',
        message: 'Barcode is already linked to this item',
        item
      }
    }

    // Check if barcode is linked to another item
    const { data: existingLink } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('barcode', barcode)
      .eq('user_id', userId)
      .single()

    if (existingLink && existingLink.id !== inventoryItemId) {
      return { 
        error: `Barcode is already linked to "${existingLink.item_name}"`,
        existingItem: existingLink
      }
    }

    // Link barcode to item
    const { data: updatedItem, error: updateError } = await supabase
      .from('inventory_items')
      .update({
        barcode,
        last_updated: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', inventoryItemId)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Link barcode error:', updateError)
      return { error: 'Failed to link barcode to item' }
    }

    console.log(`🔗 Linked barcode ${barcode} to ${item.item_name}`)

    return {
      action: 'barcode_linked',
      item: updatedItem,
      message: `Barcode linked to ${item.item_name}`
    }

  } catch (error) {
    console.error('Link barcode to item error:', error)
    return { error: 'Failed to link barcode to item' }
  }
}

/**
 * Create new inventory item from barcode
 */
async function createItemFromBarcode(params: {
  barcode: string
  itemData: any
  quantity: number
  location?: string
  userId: string
  supabase: any
}): Promise<any> {
  const { barcode, itemData, quantity, location, userId, supabase } = params

  try {
    // Look up product data for the barcode
    const productLookup = await lookupBarcodeProduct(barcode)

    // Merge product data with provided item data
    const mergedData = {
      item_name: itemData.item_name || productLookup.product?.name || 'Unknown Product',
      description: itemData.description || productLookup.product?.description,
      category: itemData.category || productLookup.product?.category || 'general',
      unit_of_measurement: itemData.unit_of_measurement || productLookup.product?.unit || 'each',
      current_quantity: quantity || 0,
      par_level_low: itemData.par_level_low || 0,
      par_level_high: itemData.par_level_high || 0,
      cost_per_unit: itemData.cost_per_unit || 0,
      location: location || itemData.location,
      barcode,
      ...itemData // Override with any additional provided data
    }

    // Create inventory item
    const { data: newItem, error: createError } = await supabase
      .from('inventory_items')
      .insert({
        user_id: userId,
        ...mergedData,
        is_active: true,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        updated_by: userId
      })
      .select()
      .single()

    if (createError) {
      console.error('Create item error:', createError)
      return { error: 'Failed to create inventory item' }
    }

    // Record initial stock movement if quantity > 0
    if (quantity > 0) {
      await supabase
        .from('stock_movements')
        .insert({
          user_id: userId,
          inventory_item_id: newItem.id,
          movement_type: 'adjustment',
          quantity,
          direction: 'in',
          reason: 'Initial stock from barcode scan',
          movement_date: new Date().toISOString(),
          reference_id: barcode,
          created_by: userId
        })
    }

    console.log(`✨ Created new item from barcode: ${newItem.item_name}`)

    return {
      success: true,
      action: 'item_created',
      item: newItem,
      productDataUsed: productLookup.found,
      message: `Created "${newItem.item_name}" with ${quantity} units`
    }

  } catch (error) {
    console.error('Create item from barcode error:', error)
    return { error: 'Failed to create inventory item' }
  }
}

/**
 * Look up barcode product information
 */
async function lookupBarcodeProduct(barcode: string): Promise<{ found: boolean; product?: any }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/barcode/lookup?barcode=${barcode}&check_inventory=false`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (response.ok) {
      const data = await response.json()
      return {
        found: data.found,
        product: data.product
      }
    }

    return { found: false }

  } catch (error) {
    console.error('Lookup barcode product error:', error)
    return { found: false }
  }
}

/**
 * Find inventory items that might match the barcode/product
 */
async function findInventoryItemMatches(params: {
  barcode: string
  productData?: any
  userId: string
  supabase: any
}): Promise<any[]> {
  const { barcode, productData, userId, supabase } = params

  try {
    const matches = []

    // Check for exact barcode match
    const { data: exactMatch } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('barcode', barcode)
      .eq('user_id', userId)
      .single()

    if (exactMatch) {
      matches.push({
        ...exactMatch,
        matchType: 'exact_barcode',
        matchScore: 1.0
      })
    }

    // Search by product name if available
    if (productData?.name) {
      const searchTerms = [
        productData.name,
        productData.brand,
        `${productData.brand} ${productData.name}`.trim()
      ].filter(Boolean)

      for (const term of searchTerms) {
        const { data: nameMatches } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .ilike('item_name', `%${term}%`)
          .limit(5)

        if (nameMatches) {
          matches.push(...nameMatches.map(item => ({
            ...item,
            matchType: 'name_similarity',
            matchScore: calculateNameSimilarity(productData.name, item.item_name)
          })))
        }
      }
    }

    // Remove duplicates and sort by match score
    const uniqueMatches = matches.reduce((acc: any[], match: any) => {
      if (!acc.find(m => m.id === match.id)) {
        acc.push(match)
      }
      return acc
    }, [])

    return uniqueMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10)

  } catch (error) {
    console.error('Find inventory matches error:', error)
    return []
  }
}

/**
 * Get existing barcode link
 */
async function getExistingBarcodeLink(params: {
  barcode: string
  userId: string
  supabase: any
}): Promise<any> {
  try {
    const { data: linkedItem } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('barcode', barcode)
      .eq('user_id', params.userId)
      .single()

    if (linkedItem) {
      return {
        exists: true,
        inventoryItem: linkedItem
      }
    }

    return { exists: false }

  } catch (error) {
    return { exists: false }
  }
}

/**
 * Generate update suggestions
 */
function generateUpdateSuggestions(params: {
  barcode: string
  productData?: any
  inventoryMatches: any[]
  existingLink: any
}): string[] {
  const { barcode, productData, inventoryMatches, existingLink } = params
  const suggestions: string[] = []

  if (existingLink?.exists) {
    suggestions.push(`Barcode is linked to "${existingLink.inventoryItem.item_name}" - you can update quantities directly`)
  } else if (inventoryMatches.length > 0) {
    const bestMatch = inventoryMatches[0]
    if (bestMatch.matchScore > 0.8) {
      suggestions.push(`High match found: "${bestMatch.item_name}" - consider linking this barcode`)
    } else {
      suggestions.push(`${inventoryMatches.length} potential matches found - review and link if appropriate`)
    }
  } else if (productData) {
    suggestions.push(`Product found: "${productData.name}" - you can create a new inventory item`)
  } else {
    suggestions.push('Unknown barcode - you can create a new inventory item manually')
  }

  return suggestions
}

/**
 * Generate quick actions
 */
function generateQuickActions(params: {
  existingLink: any
  inventoryMatches: any[]
  productData?: any
}): any[] {
  const { existingLink, inventoryMatches, productData } = params
  const actions = []

  if (existingLink?.exists) {
    const item = existingLink.inventoryItem
    actions.push({
      type: 'update_quantity',
      label: `Update ${item.item_name}`,
      description: `Current: ${item.current_quantity} ${item.unit_of_measurement}`,
      data: { inventory_item_id: item.id }
    })
  } else {
    if (inventoryMatches.length > 0) {
      const bestMatch = inventoryMatches[0]
      if (bestMatch.matchScore > 0.7) {
        actions.push({
          type: 'link_item',
          label: `Link to ${bestMatch.item_name}`,
          description: `Match confidence: ${Math.round(bestMatch.matchScore * 100)}%`,
          data: { inventory_item_id: bestMatch.id }
        })
      }

      actions.push({
        type: 'show_matches',
        label: 'Show all matches',
        description: `${inventoryMatches.length} items found`,
        data: { match_count: inventoryMatches.length }
      })
    }

    if (productData) {
      actions.push({
        type: 'create_item',
        label: `Create "${productData.name}"`,
        description: `New item from barcode data`,
        data: { 
          suggested_name: productData.name,
          suggested_category: productData.category,
          suggested_unit: productData.unit
        }
      })
    } else {
      actions.push({
        type: 'create_item_manual',
        label: 'Create new item',
        description: 'Manually enter item details',
        data: {}
      })
    }
  }

  return actions
}

/**
 * Calculate name similarity
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  if (!name1 || !name2) return 0

  const words1 = name1.toLowerCase().split(/\s+/)
  const words2 = name2.toLowerCase().split(/\s+/)
  
  const intersection = words1.filter(word => words2.includes(word))
  const union = [...new Set([...words1, ...words2])]
  
  return union.length > 0 ? intersection.length / union.length : 0
}

/**
 * Check for stock alerts
 */
async function checkForStockAlerts(params: {
  inventoryItem: any
  previousQuantity: number
  supabase: any
}): Promise<any[]> {
  const { inventoryItem, previousQuantity, supabase } = params
  const alerts = []

  try {
    const currentQty = inventoryItem.current_quantity || 0
    const parLow = inventoryItem.par_level_low || 0

    // Check for low stock alert
    if (previousQuantity > parLow && currentQty <= parLow) {
      alerts.push({
        type: 'low_stock',
        severity: 'medium',
        message: `${inventoryItem.item_name} is now below reorder point`,
        currentQuantity: currentQty,
        reorderPoint: parLow
      })
    }

    // Check for out of stock alert
    if (previousQuantity > 0 && currentQty <= 0) {
      alerts.push({
        type: 'out_of_stock',
        severity: 'high',
        message: `${inventoryItem.item_name} is now out of stock`,
        currentQuantity: currentQty
      })
    }

    return alerts

  } catch (error) {
    console.error('Check stock alerts error:', error)
    return []
  }
}

/**
 * Get item creation suggestions
 */
async function getItemCreationSuggestions(params: {
  barcode: string
  userId: string
  supabase: any
}): Promise<any> {
  const { barcode, userId, supabase } = params

  try {
    // Look up product data
    const productLookup = await lookupBarcodeProduct(barcode)

    if (productLookup.found) {
      return {
        hasProductData: true,
        suggestedItem: {
          item_name: productLookup.product.name,
          category: productLookup.product.category,
          unit_of_measurement: productLookup.product.unit,
          description: productLookup.product.description
        },
        message: 'Product data found - you can create an inventory item with this information'
      }
    }

    return {
      hasProductData: false,
      message: 'No product data found - you can create an inventory item manually'
    }

  } catch (error) {
    console.error('Get creation suggestions error:', error)
    return {
      hasProductData: false,
      message: 'Unable to find product data'
    }
  }
}