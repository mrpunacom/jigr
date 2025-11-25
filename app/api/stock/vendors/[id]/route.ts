/**
 * Individual Vendor Management API
 * 
 * Handles operations for specific vendors including:
 * - Detailed vendor information retrieval
 * - Vendor performance analytics
 * - Order history and statistics
 * - Pricing management for vendor items
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/stock/vendors/[id] - Get detailed vendor information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const vendorId = params.id

    // Get vendor details with related data
    const { data: vendor, error } = await supabase
      .from('Vendors')
      .select(`
        *,
        VendorItems:VendorItems(
          id,
          inventory_item_id,
          vendor_sku,
          vendor_name,
          cost_per_unit,
          minimum_order_quantity,
          case_size,
          lead_time_days,
          is_preferred,
          last_cost_update,
          InventoryItems:inventory_items(
            id,
            item_name,
            current_quantity,
            unit_of_measurement,
            category
          )
        ),
        PurchaseOrders:PurchaseOrders(
          id,
          order_number,
          order_date,
          status,
          total_amount,
          delivery_date,
          items_count
        )
      `)
      .eq('id', vendorId)
      .eq('user_id', user_id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch vendor' }, { status: 500 })
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Calculate vendor analytics
    const analytics = calculateVendorAnalytics(vendor)

    return NextResponse.json({
      vendor,
      analytics,
      recentOrders: vendor.PurchaseOrders
        ?.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
        .slice(0, 5) || []
    })

  } catch (error) {
    console.error('Vendor GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/stock/vendors/[id] - Update specific vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const vendorId = params.id
    const body = await request.json()

    // Prepare update data (same logic as main vendors PUT)
    const updateData = {
      name: body.name?.trim(),
      business_name: body.business_name?.trim(),
      contact_person: body.contact_person?.trim(),
      email: body.email?.trim().toLowerCase(),
      phone: body.phone?.trim(),
      address: body.address?.trim(),
      website: body.website?.trim(),
      category: body.category?.trim(),
      payment_terms: body.payment_terms,
      minimum_order_amount: body.minimum_order_amount,
      delivery_days: body.delivery_days,
      is_preferred: body.is_preferred,
      is_active: body.is_active,
      notes: body.notes?.trim(),
      updated_at: new Date().toISOString()
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    // Validate email if provided
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(updateData.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // Perform update
    const { data: updatedVendor, error } = await supabase
      .from('Vendors')
      .update(updateData)
      .eq('id', vendorId)
      .eq('user_id', user_id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 })
    }

    if (!updatedVendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    return NextResponse.json(updatedVendor)

  } catch (error) {
    console.error('Vendor PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/stock/vendors/[id] - Delete specific vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const vendorId = params.id

    // Check for active orders
    const { data: activeOrders } = await supabase
      .from('PurchaseOrders')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('status', 'pending')

    if (activeOrders && activeOrders.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete vendor with pending purchase orders' },
        { status: 400 }
      )
    }

    // Soft delete vendor
    const { data: deletedVendor, error } = await supabase
      .from('Vendors')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', vendorId)
      .eq('user_id', user_id)
      .select('id, name')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 })
    }

    if (!deletedVendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      deletedVendor
    })

  } catch (error) {
    console.error('Vendor DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Calculate vendor performance analytics
 */
function calculateVendorAnalytics(vendor: any): any {
  const orders = vendor.PurchaseOrders || []
  const items = vendor.VendorItems || []
  
  // Order statistics
  const totalOrders = orders.length
  const completedOrders = orders.filter((o: any) => o.status === 'completed').length
  const pendingOrders = orders.filter((o: any) => o.status === 'pending').length
  const cancelledOrders = orders.filter((o: any) => o.status === 'cancelled').length
  
  // Financial statistics
  const totalSpent = orders
    .filter((o: any) => o.status === 'completed')
    .reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)
  
  const averageOrderValue = completedOrders > 0 ? totalSpent / completedOrders : 0
  
  // Recent activity
  const recentOrders = orders
    .filter((o: any) => {
      const orderDate = new Date(o.order_date)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return orderDate >= thirtyDaysAgo
    }).length
  
  // Performance metrics
  const onTimeDeliveries = orders.filter((o: any) => {
    if (!o.delivery_date || o.status !== 'completed') return false
    const expectedDelivery = new Date(o.order_date)
    expectedDelivery.setDate(expectedDelivery.getDate() + vendor.delivery_days)
    return new Date(o.delivery_date) <= expectedDelivery
  }).length
  
  const onTimePercentage = completedOrders > 0 ? (onTimeDeliveries / completedOrders) * 100 : 0
  
  // Calculate dynamic vendor rating based on performance
  const rating = calculateVendorRating(onTimePercentage, completedOrders, cancelledOrders, totalOrders)
  
  return {
    orderStats: {
      total: totalOrders,
      completed: completedOrders,
      pending: pendingOrders,
      cancelled: cancelledOrders,
      recent30Days: recentOrders
    },
    financialStats: {
      totalSpent: Math.round(totalSpent * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      currency: 'USD' // Could be configurable
    },
    performanceStats: {
      onTimeDeliveries,
      onTimePercentage: Math.round(onTimePercentage * 100) / 100,
      rating: Math.round(rating * 100) / 100,
      itemsOffered: items.length,
      preferredItems: items.filter((item: any) => item.is_preferred).length
    },
    trends: {
      // Could add monthly order trends, cost trends, etc.
      lastOrderDate: orders.length > 0 ? 
        Math.max(...orders.map((o: any) => new Date(o.order_date).getTime())) : null
    }
  }
}

/**
 * Calculate vendor rating based on performance metrics
 */
function calculateVendorRating(
  onTimePercentage: number,
  completedOrders: number,
  cancelledOrders: number,
  totalOrders: number
): number {
  if (totalOrders === 0) return 0
  
  let rating = 3.0 // Base rating
  
  // On-time delivery impact (40% of rating)
  if (onTimePercentage >= 95) rating += 1.5
  else if (onTimePercentage >= 85) rating += 1.0
  else if (onTimePercentage >= 75) rating += 0.5
  else if (onTimePercentage < 50) rating -= 1.0
  
  // Order completion rate impact (30% of rating)
  const completionRate = (completedOrders / totalOrders) * 100
  if (completionRate >= 95) rating += 1.0
  else if (completionRate >= 85) rating += 0.5
  else if (completionRate < 70) rating -= 0.5
  
  // Cancellation rate impact (20% of rating)
  const cancellationRate = (cancelledOrders / totalOrders) * 100
  if (cancellationRate === 0) rating += 0.5
  else if (cancellationRate > 10) rating -= 0.5
  else if (cancellationRate > 20) rating -= 1.0
  
  // Order volume bonus (10% of rating)
  if (totalOrders >= 50) rating += 0.3
  else if (totalOrders >= 20) rating += 0.2
  else if (totalOrders >= 10) rating += 0.1
  
  // Ensure rating stays within bounds
  return Math.max(1, Math.min(5, rating))
}