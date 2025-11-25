/**
 * Individual Purchase Order Management API
 * 
 * Handles operations for specific purchase orders including:
 * - Detailed order information retrieval
 * - Order status updates and workflow management
 * - Order modifications and cancellations
 * - Receiving and fulfillment tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/stock/purchase-orders/[id] - Get detailed purchase order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { id: orderId } = await params

    // Get complete order details
    const { data: order, error } = await supabase
      .from('PurchaseOrders')
      .select(`
        *,
        Vendors:Vendors(
          id,
          name,
          business_name,
          contact_person,
          email,
          phone,
          address,
          payment_terms,
          delivery_days
        ),
        PurchaseOrderItems:PurchaseOrderItems(
          id,
          quantity,
          unit_cost,
          total_cost,
          received_quantity,
          notes,
          VendorItems:VendorItems(
            id,
            vendor_sku,
            vendor_name,
            case_size,
            InventoryItems:inventory_items(
              id,
              item_name,
              unit_of_measurement,
              current_quantity,
              category
            )
          )
        ),
        CreatedBy:profiles!created_by(
          id,
          full_name,
          email
        ),
        ApprovedBy:profiles!approved_by(
          id,
          full_name,
          email
        ),
        ReceivedBy:profiles!received_by(
          id,
          full_name,
          email
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user_id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch purchase order' }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Calculate order analytics
    const analytics = calculateOrderAnalytics(order)

    return NextResponse.json({
      order,
      analytics,
      statusHistory: await getOrderStatusHistory(orderId, supabase)
    })

  } catch (error) {
    console.error('Purchase order GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/stock/purchase-orders/[id] - Update purchase order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { id: orderId } = await params
    const body = await request.json()

    // Get current order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('PurchaseOrders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user_id)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check if order can be modified
    if (currentOrder.status === 'completed' || currentOrder.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot modify completed or cancelled orders' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Handle status changes
    if (body.status && body.status !== currentOrder.status) {
      const validTransitions = getValidStatusTransitions(currentOrder.status)
      
      if (!validTransitions.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status transition from ${currentOrder.status} to ${body.status}` },
          { status: 400 }
        )
      }

      updateData.status = body.status

      // Handle status-specific updates
      if (body.status === 'approved') {
        updateData.approved_by = user_id
        updateData.approved_at = new Date().toISOString()
      } else if (body.status === 'completed') {
        updateData.received_by = user_id
        updateData.actual_delivery_date = body.actual_delivery_date || new Date().toISOString()
      } else if (body.status === 'cancelled') {
        updateData.cancelled_by = user_id
        updateData.cancelled_at = new Date().toISOString()
        updateData.cancellation_reason = body.cancellation_reason?.trim() || ''
      }
    }

    // Handle other updates (only for draft/pending orders)
    if (currentOrder.status === 'draft' || currentOrder.status === 'pending') {
      if (body.expected_delivery_date) {
        updateData.expected_delivery_date = body.expected_delivery_date
      }
      if (body.notes !== undefined) {
        updateData.notes = body.notes?.trim() || ''
      }
      if (body.tax_rate !== undefined) {
        updateData.tax_rate = body.tax_rate
        // Recalculate tax amount
        updateData.tax_amount = Math.round((currentOrder.subtotal * body.tax_rate / 100) * 100) / 100
        updateData.total_amount = currentOrder.subtotal + updateData.tax_amount + currentOrder.shipping_amount
      }
      if (body.shipping_amount !== undefined) {
        updateData.shipping_amount = Math.round(body.shipping_amount * 100) / 100
        updateData.total_amount = currentOrder.subtotal + currentOrder.tax_amount + updateData.shipping_amount
      }
    }

    // Perform update
    const { data: updatedOrder, error: updateError } = await supabase
      .from('PurchaseOrders')
      .update(updateData)
      .eq('id', orderId)
      .eq('user_id', user_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update purchase order' }, { status: 500 })
    }

    // Log status change
    if (body.status && body.status !== currentOrder.status) {
      await logOrderStatusChange(orderId, currentOrder.status, body.status, user_id, supabase)
    }

    // If completing order, update inventory quantities
    if (body.status === 'completed' && body.received_items) {
      await processOrderReceipt(orderId, body.received_items, user_id, supabase)
    }

    console.log(`✅ Updated purchase order ${currentOrder.order_number}: ${currentOrder.status} → ${body.status || 'same'}`)

    return NextResponse.json(updatedOrder)

  } catch (error) {
    console.error('Purchase order PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/stock/purchase-orders/[id] - Cancel purchase order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { id: orderId } = await params
    const { searchParams } = new URL(request.url)
    const reason = searchParams.get('reason') || 'Cancelled by user'

    // Get current order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('PurchaseOrders')
      .select('id, order_number, status')
      .eq('id', orderId)
      .eq('user_id', user_id)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check if order can be cancelled
    if (currentOrder.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel completed orders' },
        { status: 400 }
      )
    }

    if (currentOrder.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Order is already cancelled' },
        { status: 400 }
      )
    }

    // Cancel the order
    const { data: cancelledOrder, error: cancelError } = await supabase
      .from('PurchaseOrders')
      .update({
        status: 'cancelled',
        cancelled_by: user_id,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .eq('user_id', user_id)
      .select()
      .single()

    if (cancelError) {
      console.error('Cancel error:', cancelError)
      return NextResponse.json({ error: 'Failed to cancel purchase order' }, { status: 500 })
    }

    // Log status change
    await logOrderStatusChange(orderId, currentOrder.status, 'cancelled', user_id, supabase)

    console.log(`🚫 Cancelled purchase order ${currentOrder.order_number}: ${reason}`)

    return NextResponse.json({
      success: true,
      cancelledOrder,
      reason
    })

  } catch (error) {
    console.error('Purchase order DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Calculate order analytics and metrics
 */
function calculateOrderAnalytics(order: any): any {
  const items = order.PurchaseOrderItems || []
  
  // Basic metrics
  const totalItems = items.length
  const totalQuantity = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
  const averageItemCost = totalItems > 0 ? order.subtotal / totalItems : 0

  // Receiving metrics
  const receivedItems = items.filter((item: any) => item.received_quantity > 0).length
  const totalReceived = items.reduce((sum: number, item: any) => sum + (item.received_quantity || 0), 0)
  const receivingProgress = totalQuantity > 0 ? (totalReceived / totalQuantity) * 100 : 0

  // Timeline metrics
  const orderDate = new Date(order.order_date)
  const expectedDate = new Date(order.expected_delivery_date)
  const actualDate = order.actual_delivery_date ? new Date(order.actual_delivery_date) : null
  
  const expectedDays = Math.ceil((expectedDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
  const actualDays = actualDate ? 
    Math.ceil((actualDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)) : null

  const isOverdue = !actualDate && new Date() > expectedDate
  const daysOverdue = isOverdue ? 
    Math.ceil((new Date().getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

  return {
    itemMetrics: {
      totalItems,
      totalQuantity,
      averageItemCost: Math.round(averageItemCost * 100) / 100,
      largestItem: items.reduce((max: any, item: any) => 
        item.total_cost > (max?.total_cost || 0) ? item : max, null)
    },
    receivingMetrics: {
      receivedItems,
      totalReceived,
      receivingProgress: Math.round(receivingProgress * 100) / 100,
      isPartiallyReceived: receivedItems > 0 && receivedItems < totalItems,
      isFullyReceived: receivedItems === totalItems && totalItems > 0
    },
    timelineMetrics: {
      expectedDays,
      actualDays,
      isOverdue,
      daysOverdue,
      isOnTime: actualDays ? actualDays <= expectedDays : null
    },
    costBreakdown: {
      subtotal: order.subtotal,
      taxAmount: order.tax_amount,
      taxRate: order.tax_rate,
      shippingAmount: order.shipping_amount,
      totalAmount: order.total_amount,
      costPerItem: totalItems > 0 ? order.total_amount / totalItems : 0
    }
  }
}

/**
 * Get valid status transitions for a given current status
 */
function getValidStatusTransitions(currentStatus: string): string[] {
  const transitions: { [key: string]: string[] } = {
    'draft': ['pending', 'cancelled'],
    'pending': ['approved', 'cancelled'],
    'approved': ['completed', 'cancelled'],
    'completed': [], // No transitions from completed
    'cancelled': [] // No transitions from cancelled
  }

  return transitions[currentStatus] || []
}

/**
 * Log order status changes for audit trail
 */
async function logOrderStatusChange(
  orderId: string,
  fromStatus: string,
  toStatus: string,
  userId: string,
  supabase: any
): Promise<void> {
  try {
    const { error } = await supabase
      .from('PurchaseOrderStatusHistory')
      .insert({
        purchase_order_id: orderId,
        from_status: fromStatus,
        to_status: toStatus,
        changed_by: userId,
        changed_at: new Date().toISOString(),
        notes: `Status changed from ${fromStatus} to ${toStatus}`
      })

    if (error) {
      console.error('Status history logging error:', error)
    }
  } catch (error) {
    console.error('Log status change error:', error)
  }
}

/**
 * Get order status history
 */
async function getOrderStatusHistory(orderId: string, supabase: any): Promise<any[]> {
  try {
    const { data: history } = await supabase
      .from('PurchaseOrderStatusHistory')
      .select(`
        *,
        ChangedBy:profiles!changed_by(
          id,
          full_name,
          email
        )
      `)
      .eq('purchase_order_id', orderId)
      .order('changed_at', { ascending: false })

    return history || []
  } catch (error) {
    console.error('Get status history error:', error)
    return []
  }
}

/**
 * Process order receipt and update inventory
 */
async function processOrderReceipt(
  orderId: string,
  receivedItems: any[],
  userId: string,
  supabase: any
): Promise<void> {
  try {
    for (const receivedItem of receivedItems) {
      const { vendor_item_id, received_quantity, notes } = receivedItem

      if (!vendor_item_id || !received_quantity || received_quantity <= 0) {
        continue
      }

      // Update order item with received quantity
      await supabase
        .from('PurchaseOrderItems')
        .update({
          received_quantity,
          received_notes: notes || '',
          received_at: new Date().toISOString()
        })
        .eq('purchase_order_id', orderId)
        .eq('vendor_item_id', vendor_item_id)

      // Get inventory item ID
      const { data: vendorItem } = await supabase
        .from('VendorItems')
        .select('inventory_item_id')
        .eq('id', vendor_item_id)
        .single()

      if (vendorItem?.inventory_item_id) {
        // Update inventory quantity
        const { data: currentInventory } = await supabase
          .from('inventory_items')
          .select('current_quantity')
          .eq('id', vendorItem.inventory_item_id)
          .single()

        if (currentInventory) {
          const newQuantity = (currentInventory.current_quantity || 0) + received_quantity

          await supabase
            .from('inventory_items')
            .update({
              current_quantity: newQuantity,
              last_restocked: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', vendorItem.inventory_item_id)

          console.log(`📦 Updated inventory ${vendorItem.inventory_item_id}: +${received_quantity} units`)
        }
      }
    }
  } catch (error) {
    console.error('Process order receipt error:', error)
  }
}