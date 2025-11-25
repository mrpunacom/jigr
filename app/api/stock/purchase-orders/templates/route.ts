/**
 * Purchase Order Templates API
 * 
 * Handles creation of purchase order templates and smart order suggestions:
 * - Automated reorder point detection
 * - Vendor-specific order templates
 * - Historical ordering pattern analysis
 * - Smart quantity suggestions based on usage
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/stock/purchase-orders/templates - Get suggested orders and templates
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const vendorId = searchParams.get('vendor_id')
    const reorderOnly = searchParams.get('reorder_only') === 'true'
    const includeHistorical = searchParams.get('include_historical') !== 'false'

    console.log(`🎯 Generating purchase order suggestions for user ${user_id}`)

    // Get inventory items that need reordering
    const reorderSuggestions = await generateReorderSuggestions(user_id, vendorId, supabase)

    // Get vendor-specific templates if vendor specified
    const vendorTemplates = vendorId ? 
      await generateVendorTemplates(vendorId, user_id, supabase) : []

    // Get historical ordering patterns if requested
    const historicalPatterns = includeHistorical ? 
      await analyzeHistoricalPatterns(user_id, vendorId, supabase) : []

    return NextResponse.json({
      reorderSuggestions,
      vendorTemplates,
      historicalPatterns,
      summary: {
        totalReorderItems: reorderSuggestions.length,
        totalVendorTemplates: vendorTemplates.length,
        estimatedOrderValue: reorderSuggestions.reduce((sum, item) => 
          sum + (item.suggestedQuantity * item.unitCost), 0)
      }
    })

  } catch (error) {
    console.error('Purchase order templates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/stock/purchase-orders/templates - Create order from template
export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    if (!body.templateType || !body.vendorId) {
      return NextResponse.json(
        { error: 'Template type and vendor ID are required' },
        { status: 400 }
      )
    }

    let orderItems: any[] = []

    switch (body.templateType) {
      case 'reorder':
        orderItems = await generateReorderTemplate(body.vendorId, user_id, supabase)
        break
      case 'historical':
        orderItems = await generateHistoricalTemplate(body.vendorId, user_id, body.period || 30, supabase)
        break
      case 'custom':
        orderItems = body.items || []
        break
      default:
        return NextResponse.json({ error: 'Invalid template type' }, { status: 400 })
    }

    if (orderItems.length === 0) {
      return NextResponse.json(
        { error: 'No items found for template' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)

    // Create draft purchase order
    const draftOrder = {
      templateType: body.templateType,
      vendorId: body.vendorId,
      items: orderItems,
      subtotal: Math.round(subtotal * 100) / 100,
      estimatedTotal: Math.round(subtotal * 1.1 * 100) / 100, // Estimate with tax/shipping
      itemCount: orderItems.length,
      generatedAt: new Date().toISOString()
    }

    return NextResponse.json(draftOrder, { status: 201 })

  } catch (error) {
    console.error('Purchase order template creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Generate reorder suggestions based on inventory levels
 */
async function generateReorderSuggestions(
  userId: string,
  vendorId: string | null,
  supabase: any
): Promise<any[]> {
  try {
    // Get inventory items that are below reorder point
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
        VendorItems:VendorItems(
          id,
          vendor_id,
          vendor_sku,
          vendor_name,
          cost_per_unit,
          minimum_order_quantity,
          case_size,
          is_preferred,
          Vendors:Vendors(
            id,
            name,
            delivery_days
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .not('VendorItems', 'is', null) // Only items with vendor associations

    if (vendorId) {
      query = query.eq('VendorItems.vendor_id', vendorId)
    }

    const { data: items } = await query

    if (!items) return []

    const suggestions = []

    for (const item of items) {
      // Check if item needs reordering
      const currentQty = item.current_quantity || 0
      const reorderPoint = item.par_level_low || 0
      const maxLevel = item.par_level_high || reorderPoint * 2

      if (currentQty <= reorderPoint) {
        // Find best vendor for this item
        const vendorItems = item.VendorItems || []
        const preferredVendor = vendorItems.find((vi: any) => vi.is_preferred) || vendorItems[0]

        if (preferredVendor) {
          // Calculate suggested quantity
          const suggestedQty = calculateSuggestedQuantity(
            currentQty,
            reorderPoint,
            maxLevel,
            preferredVendor.minimum_order_quantity || 1,
            preferredVendor.case_size || 1
          )

          suggestions.push({
            inventoryItemId: item.id,
            itemName: item.item_name,
            currentQuantity: currentQty,
            reorderPoint: reorderPoint,
            maxLevel: maxLevel,
            suggestedQuantity: suggestedQty,
            unitCost: preferredVendor.cost_per_unit || 0,
            totalCost: suggestedQty * (preferredVendor.cost_per_unit || 0),
            vendor: {
              id: preferredVendor.Vendors.id,
              name: preferredVendor.Vendors.name,
              deliveryDays: preferredVendor.Vendors.delivery_days
            },
            vendorItem: {
              id: preferredVendor.id,
              sku: preferredVendor.vendor_sku,
              name: preferredVendor.vendor_name,
              minimumOrderQty: preferredVendor.minimum_order_quantity,
              caseSize: preferredVendor.case_size
            },
            urgency: calculateUrgency(currentQty, reorderPoint),
            category: item.category
          })
        }
      }
    }

    // Sort by urgency and then by total cost
    suggestions.sort((a, b) => {
      if (a.urgency !== b.urgency) {
        return b.urgency - a.urgency // Higher urgency first
      }
      return b.totalCost - a.totalCost // Higher value items first
    })

    return suggestions

  } catch (error) {
    console.error('Generate reorder suggestions error:', error)
    return []
  }
}

/**
 * Generate vendor-specific templates based on vendor catalog
 */
async function generateVendorTemplates(
  vendorId: string,
  userId: string,
  supabase: any
): Promise<any[]> {
  try {
    // Get vendor's item catalog
    const { data: vendorItems } = await supabase
      .from('VendorItems')
      .select(`
        id,
        vendor_sku,
        vendor_name,
        cost_per_unit,
        minimum_order_quantity,
        case_size,
        is_preferred,
        InventoryItems:inventory_items(
          id,
          item_name,
          current_quantity,
          category
        )
      `)
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .eq('InventoryItems.is_active', true)

    if (!vendorItems) return []

    // Create templates by category
    const categoryGroups = vendorItems.reduce((acc, item) => {
      const category = item.InventoryItems.category || 'Uncategorized'
      if (!acc[category]) acc[category] = []
      acc[category].push(item)
      return acc
    }, {})

    const templates = Object.entries(categoryGroups).map(([category, items]: [string, any]) => ({
      templateName: `${category} Essentials`,
      category,
      vendorId,
      items: items.map((item: any) => ({
        vendorItemId: item.id,
        itemName: item.InventoryItems.item_name,
        vendorSku: item.vendor_sku,
        vendorName: item.vendor_name,
        unitCost: item.cost_per_unit,
        suggestedQuantity: item.minimum_order_quantity || 1,
        totalCost: (item.minimum_order_quantity || 1) * item.cost_per_unit,
        isPreferred: item.is_preferred
      })),
      totalValue: items.reduce((sum: number, item: any) => 
        sum + ((item.minimum_order_quantity || 1) * item.cost_per_unit), 0)
    }))

    return templates.sort((a, b) => b.totalValue - a.totalValue)

  } catch (error) {
    console.error('Generate vendor templates error:', error)
    return []
  }
}

/**
 * Analyze historical ordering patterns
 */
async function analyzeHistoricalPatterns(
  userId: string,
  vendorId: string | null,
  supabase: any
): Promise<any[]> {
  try {
    // Get recent purchase orders (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    let query = supabase
      .from('PurchaseOrders')
      .select(`
        id,
        order_date,
        vendor_id,
        total_amount,
        status,
        Vendors:Vendors(
          id,
          name
        ),
        PurchaseOrderItems:PurchaseOrderItems(
          id,
          quantity,
          unit_cost,
          total_cost,
          VendorItems:VendorItems(
            id,
            vendor_sku,
            vendor_name,
            InventoryItems:inventory_items(
              id,
              item_name,
              category
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('order_date', sixMonthsAgo.toISOString())

    if (vendorId) {
      query = query.eq('vendor_id', vendorId)
    }

    const { data: orders } = await query

    if (!orders || orders.length === 0) return []

    // Analyze ordering frequency by item
    const itemPatterns = orders.reduce((acc, order) => {
      order.PurchaseOrderItems.forEach((item: any) => {
        const itemId = item.VendorItems.InventoryItems.id
        const itemName = item.VendorItems.InventoryItems.item_name

        if (!acc[itemId]) {
          acc[itemId] = {
            itemId,
            itemName,
            vendorSku: item.VendorItems.vendor_sku,
            category: item.VendorItems.InventoryItems.category,
            orderFrequency: 0,
            totalQuantityOrdered: 0,
            averageQuantity: 0,
            averageUnitCost: 0,
            lastOrderDate: null,
            vendorId: order.vendor_id,
            vendorName: order.Vendors.name
          }
        }

        acc[itemId].orderFrequency++
        acc[itemId].totalQuantityOrdered += item.quantity
        acc[itemId].averageUnitCost = 
          (acc[itemId].averageUnitCost + item.unit_cost) / 2
        acc[itemId].lastOrderDate = order.order_date
      })
      return acc
    }, {})

    // Calculate averages and suggest reorder quantities
    const patterns = Object.values(itemPatterns).map((pattern: any) => {
      pattern.averageQuantity = Math.round(pattern.totalQuantityOrdered / pattern.orderFrequency)
      pattern.daysSinceLastOrder = Math.ceil(
        (new Date().getTime() - new Date(pattern.lastOrderDate).getTime()) / 
        (1000 * 60 * 60 * 24)
      )
      
      // Suggest reorder based on historical frequency
      const orderCycleDays = 180 / pattern.orderFrequency // Average days between orders
      pattern.suggestedReorderDays = Math.round(orderCycleDays * 0.8) // Reorder at 80% of cycle
      pattern.shouldReorderSoon = pattern.daysSinceLastOrder >= pattern.suggestedReorderDays

      return pattern
    })

    // Sort by frequency and recency
    return patterns
      .sort((a, b) => {
        if (a.shouldReorderSoon !== b.shouldReorderSoon) {
          return a.shouldReorderSoon ? -1 : 1
        }
        return b.orderFrequency - a.orderFrequency
      })
      .slice(0, 20) // Limit to top 20 items

  } catch (error) {
    console.error('Analyze historical patterns error:', error)
    return []
  }
}

/**
 * Generate reorder template for specific vendor
 */
async function generateReorderTemplate(
  vendorId: string,
  userId: string,
  supabase: any
): Promise<any[]> {
  const suggestions = await generateReorderSuggestions(userId, vendorId, supabase)
  
  return suggestions.map(suggestion => ({
    vendor_item_id: suggestion.vendorItem.id,
    quantity: suggestion.suggestedQuantity,
    unit_cost: suggestion.unitCost,
    notes: `Auto-suggested: ${suggestion.itemName} below reorder point (${suggestion.currentQuantity}/${suggestion.reorderPoint})`
  }))
}

/**
 * Generate historical template based on past orders
 */
async function generateHistoricalTemplate(
  vendorId: string,
  userId: string,
  period: number,
  supabase: any
): Promise<any[]> {
  const patterns = await analyzeHistoricalPatterns(userId, vendorId, supabase)
  
  return patterns
    .filter(pattern => pattern.shouldReorderSoon)
    .map(pattern => ({
      vendor_item_id: pattern.vendorItemId, // This would need to be resolved
      quantity: pattern.averageQuantity,
      unit_cost: pattern.averageUnitCost,
      notes: `Historical pattern: Ordered ${pattern.orderFrequency} times in 6 months, avg qty: ${pattern.averageQuantity}`
    }))
}

/**
 * Helper functions
 */
function calculateSuggestedQuantity(
  currentQty: number,
  reorderPoint: number,
  maxLevel: number,
  minimumOrderQty: number,
  caseSize: number
): number {
  // Calculate base quantity needed to reach max level
  const baseQty = maxLevel - currentQty
  
  // Ensure we meet minimum order quantity
  const minQty = Math.max(baseQty, minimumOrderQty)
  
  // Round up to nearest case size
  const cases = Math.ceil(minQty / caseSize)
  
  return cases * caseSize
}

function calculateUrgency(currentQty: number, reorderPoint: number): number {
  if (currentQty <= 0) return 5 // Critical - out of stock
  if (currentQty <= reorderPoint * 0.5) return 4 // High urgency
  if (currentQty <= reorderPoint * 0.75) return 3 // Medium urgency
  if (currentQty <= reorderPoint) return 2 // Low urgency
  return 1 // Normal
}