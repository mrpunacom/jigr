/**
 * Purchase Orders Management API
 * 
 * Handles complete purchase order lifecycle including:
 * - Creating and managing purchase orders
 * - Order status tracking (draft, pending, approved, completed, cancelled)
 * - Multi-item orders with quantity and pricing
 * - Integration with vendor catalogs and inventory management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/stock/purchase-orders - List purchase orders with filtering
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || 'all'
    const vendorId = searchParams.get('vendor_id')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sort_by') || 'order_date'
    const sortOrder = searchParams.get('sort_order') || 'desc'
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    // Calculate pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('PurchaseOrders')
      .select(`
        id,
        order_number,
        vendor_id,
        status,
        order_date,
        expected_delivery_date,
        actual_delivery_date,
        subtotal,
        tax_amount,
        shipping_amount,
        total_amount,
        items_count,
        notes,
        created_by,
        approved_by,
        received_by,
        created_at,
        updated_at,
        Vendors:Vendors(
          id,
          name,
          business_name,
          payment_terms,
          delivery_days
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
              unit_of_measurement
            )
          )
        )
      `)
      .eq('user_id', user_id)

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (vendorId) {
      query = query.eq('vendor_id', vendorId)
    }

    if (search) {
      query = query.or(`
        order_number.ilike.%${search}%,
        notes.ilike.%${search}%,
        Vendors.name.ilike.%${search}%,
        Vendors.business_name.ilike.%${search}%
      `)
    }

    if (dateFrom) {
      query = query.gte('order_date', dateFrom)
    }

    if (dateTo) {
      query = query.lte('order_date', dateTo)
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: purchaseOrders, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('PurchaseOrders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)

    return NextResponse.json({
      orders: purchaseOrders,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Purchase orders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/stock/purchase-orders - Create new purchase order
export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.vendor_id || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Vendor ID and items array are required' },
        { status: 400 }
      )
    }

    // Verify vendor belongs to user
    const { data: vendor, error: vendorError } = await supabase
      .from('Vendors')
      .select('id, name, delivery_days, minimum_order_amount')
      .eq('id', body.vendor_id)
      .eq('user_id', user_id)
      .eq('is_active', true)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Invalid vendor' }, { status: 400 })
    }

    console.log(`📝 Creating purchase order for vendor: ${vendor.name} with ${body.items.length} items`)

    // Generate order number
    const orderNumber = await generateOrderNumber(user_id, supabase)

    // Validate and process order items
    const processedItems = await validateOrderItems(body.items, body.vendor_id, user_id, supabase)
    
    if (processedItems.errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid order items', 
          details: processedItems.errors 
        }, 
        { status: 400 }
      )
    }

    // Calculate order totals
    const subtotal = processedItems.items.reduce((sum, item) => sum + item.total_cost, 0)
    const taxAmount = body.tax_amount || (subtotal * (body.tax_rate || 0) / 100)
    const shippingAmount = body.shipping_amount || 0
    const totalAmount = subtotal + taxAmount + shippingAmount

    // Check minimum order amount
    if (vendor.minimum_order_amount && totalAmount < vendor.minimum_order_amount) {
      return NextResponse.json(
        { 
          error: `Order total ($${totalAmount.toFixed(2)}) is below vendor minimum ($${vendor.minimum_order_amount})` 
        },
        { status: 400 }
      )
    }

    // Calculate expected delivery date
    const expectedDeliveryDate = new Date()
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + vendor.delivery_days)

    // Prepare purchase order data
    const orderData = {
      user_id,
      order_number: orderNumber,
      vendor_id: body.vendor_id,
      status: body.status || 'draft',
      order_date: body.order_date || new Date().toISOString(),
      expected_delivery_date: expectedDeliveryDate.toISOString(),
      subtotal: Math.round(subtotal * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      tax_rate: body.tax_rate || 0,
      shipping_amount: Math.round(shippingAmount * 100) / 100,
      total_amount: Math.round(totalAmount * 100) / 100,
      items_count: processedItems.items.length,
      notes: body.notes?.trim() || '',
      created_by: user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Start transaction for order creation
    const { data: newOrder, error: orderError } = await supabase
      .from('PurchaseOrders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 })
    }

    // Insert order items
    const orderItemsData = processedItems.items.map(item => ({
      purchase_order_id: newOrder.id,
      vendor_item_id: item.vendor_item_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      total_cost: item.total_cost,
      notes: item.notes || '',
      created_at: new Date().toISOString()
    }))

    const { error: itemsError } = await supabase
      .from('PurchaseOrderItems')
      .insert(orderItemsData)

    if (itemsError) {
      console.error('Order items creation error:', itemsError)
      // Rollback order creation
      await supabase.from('PurchaseOrders').delete().eq('id', newOrder.id)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    // Update vendor statistics
    await updateVendorStats(body.vendor_id, supabase)

    console.log(`✅ Created purchase order ${orderNumber} for $${totalAmount.toFixed(2)}`)

    // Return complete order with items
    const { data: completeOrder } = await supabase
      .from('PurchaseOrders')
      .select(`
        *,
        Vendors:Vendors(
          id,
          name,
          business_name
        ),
        PurchaseOrderItems:PurchaseOrderItems(
          *,
          VendorItems:VendorItems(
            id,
            vendor_sku,
            vendor_name,
            InventoryItems:inventory_items(
              id,
              item_name,
              unit_of_measurement
            )
          )
        )
      `)
      .eq('id', newOrder.id)
      .single()

    return NextResponse.json(completeOrder, { status: 201 })

  } catch (error) {
    console.error('Purchase order POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Generate unique order number
 */
async function generateOrderNumber(userId: string, supabase: any): Promise<string> {
  const today = new Date()
  const year = today.getFullYear().toString().slice(-2)
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')
  
  const prefix = `PO${year}${month}${day}`
  
  // Find the next available number for today
  for (let i = 1; i <= 999; i++) {
    const orderNumber = `${prefix}-${i.toString().padStart(3, '0')}`
    
    const { data: existingOrder } = await supabase
      .from('PurchaseOrders')
      .select('id')
      .eq('user_id', userId)
      .eq('order_number', orderNumber)
      .single()
    
    if (!existingOrder) {
      return orderNumber
    }
  }
  
  // Fallback to timestamp if all numbers are taken
  return `PO${Date.now().toString().slice(-8)}`
}

/**
 * Validate and process order items
 */
async function validateOrderItems(
  items: any[],
  vendorId: string,
  userId: string,
  supabase: any
): Promise<{ items: any[]; errors: string[] }> {
  const processedItems: any[] = []
  const errors: string[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    
    // Validate required fields
    if (!item.vendor_item_id || !item.quantity || item.quantity <= 0) {
      errors.push(`Item ${i + 1}: Vendor item ID and positive quantity are required`)
      continue
    }

    // Get vendor item details
    const { data: vendorItem, error: vendorItemError } = await supabase
      .from('VendorItems')
      .select(`
        id,
        vendor_sku,
        vendor_name,
        cost_per_unit,
        minimum_order_quantity,
        case_size,
        is_active,
        InventoryItems:inventory_items(
          id,
          item_name,
          unit_of_measurement
        )
      `)
      .eq('id', item.vendor_item_id)
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .single()

    if (vendorItemError || !vendorItem) {
      errors.push(`Item ${i + 1}: Invalid vendor item`)
      continue
    }

    // Check minimum order quantity
    if (vendorItem.minimum_order_quantity && item.quantity < vendorItem.minimum_order_quantity) {
      errors.push(`Item ${i + 1}: Quantity (${item.quantity}) below minimum (${vendorItem.minimum_order_quantity})`)
      continue
    }

    // Use provided unit cost or vendor's current cost
    const unitCost = item.unit_cost || vendorItem.cost_per_unit
    if (!unitCost || unitCost <= 0) {
      errors.push(`Item ${i + 1}: Invalid unit cost`)
      continue
    }

    const totalCost = item.quantity * unitCost

    processedItems.push({
      vendor_item_id: item.vendor_item_id,
      quantity: item.quantity,
      unit_cost: Math.round(unitCost * 100) / 100,
      total_cost: Math.round(totalCost * 100) / 100,
      notes: item.notes?.trim() || '',
      vendor_item: vendorItem
    })
  }

  return { items: processedItems, errors }
}

/**
 * Update vendor statistics after order creation
 */
async function updateVendorStats(vendorId: string, supabase: any): Promise<void> {
  try {
    // Get order count and calculate new stats
    const { data: orders } = await supabase
      .from('PurchaseOrders')
      .select('id, status, order_date')
      .eq('vendor_id', vendorId)

    if (!orders) return

    const totalOrders = orders.length
    const lastOrderDate = orders.length > 0 ? 
      Math.max(...orders.map(o => new Date(o.order_date).getTime())) : null

    // Update vendor with new stats
    const { error } = await supabase
      .from('Vendors')
      .update({
        total_orders: totalOrders,
        last_order_date: lastOrderDate ? new Date(lastOrderDate).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendorId)

    if (error) {
      console.error('Vendor stats update error:', error)
    }
  } catch (error) {
    console.error('Update vendor stats error:', error)
  }
}