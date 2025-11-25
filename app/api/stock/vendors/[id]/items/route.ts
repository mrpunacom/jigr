/**
 * Vendor Items Management API
 * 
 * Handles vendor-specific item pricing and availability including:
 * - Linking inventory items to vendors with pricing
 * - Managing vendor SKUs and product details
 * - Price history and cost tracking
 * - Minimum order quantities and lead times
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/stock/vendors/[id]/items - Get all items for a vendor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { id: vendorId } = await params
    const { searchParams } = new URL(request.url)

    // Query parameters
    const includeInactive = searchParams.get('include_inactive') === 'true'
    const categoryFilter = searchParams.get('category')
    const search = searchParams.get('search')

    // Verify vendor belongs to user
    const { data: vendor } = await supabase
      .from('Vendors')
      .select('id, name')
      .eq('id', vendorId)
      .eq('user_id', user_id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Build query for vendor items
    let query = supabase
      .from('VendorItems')
      .select(`
        id,
        vendor_id,
        inventory_item_id,
        vendor_sku,
        vendor_name,
        cost_per_unit,
        minimum_order_quantity,
        case_size,
        lead_time_days,
        is_preferred,
        is_active,
        last_cost_update,
        notes,
        created_at,
        updated_at,
        InventoryItems:inventory_items!inner(
          id,
          item_name,
          current_quantity,
          unit_of_measurement,
          category,
          is_active
        )
      `)
      .eq('vendor_id', vendorId)

    // Apply filters
    if (!includeInactive) {
      query = query.eq('is_active', true)
      query = query.eq('InventoryItems.is_active', true)
    }

    if (categoryFilter) {
      query = query.eq('InventoryItems.category', categoryFilter)
    }

    if (search) {
      query = query.or(`
        vendor_sku.ilike.%${search}%,
        vendor_name.ilike.%${search}%,
        InventoryItems.item_name.ilike.%${search}%
      `)
    }

    // Order by preference, then by name
    query = query.order('is_preferred', { ascending: false })
    query = query.order('vendor_name', { ascending: true })

    const { data: vendorItems, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch vendor items' }, { status: 500 })
    }

    // Calculate summary statistics
    const stats = {
      totalItems: vendorItems.length,
      preferredItems: vendorItems.filter(item => item.is_preferred).length,
      averageCost: vendorItems.length > 0 
        ? vendorItems.reduce((sum, item) => sum + (item.cost_per_unit || 0), 0) / vendorItems.length
        : 0,
      itemsNeedingReorder: vendorItems.filter(item => 
        item.InventoryItems.current_quantity < item.minimum_order_quantity
      ).length
    }

    return NextResponse.json({
      vendor,
      items: vendorItems,
      stats
    })

  } catch (error) {
    console.error('Vendor items GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/stock/vendors/[id]/items - Add item to vendor catalog
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { id: vendorId } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.inventory_item_id || !body.cost_per_unit) {
      return NextResponse.json(
        { error: 'Inventory item ID and cost per unit are required' },
        { status: 400 }
      )
    }

    // Verify vendor belongs to user
    const { data: vendor } = await supabase
      .from('Vendors')
      .select('id, name')
      .eq('id', vendorId)
      .eq('user_id', user_id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Verify inventory item belongs to user
    const { data: inventoryItem } = await supabase
      .from('inventory_items')
      .select('id, item_name')
      .eq('id', body.inventory_item_id)
      .eq('user_id', user_id)
      .single()

    if (!inventoryItem) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
    }

    // Check if vendor item already exists
    const { data: existingVendorItem } = await supabase
      .from('VendorItems')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('inventory_item_id', body.inventory_item_id)
      .single()

    if (existingVendorItem) {
      return NextResponse.json(
        { error: 'This item is already associated with this vendor' },
        { status: 409 }
      )
    }

    // Prepare vendor item data
    const vendorItemData = {
      vendor_id: vendorId,
      inventory_item_id: body.inventory_item_id,
      vendor_sku: body.vendor_sku?.trim() || '',
      vendor_name: body.vendor_name?.trim() || inventoryItem.item_name,
      cost_per_unit: body.cost_per_unit,
      minimum_order_quantity: body.minimum_order_quantity || 1,
      case_size: body.case_size || 1,
      lead_time_days: body.lead_time_days || 3,
      is_preferred: body.is_preferred || false,
      is_active: true,
      last_cost_update: new Date().toISOString(),
      notes: body.notes?.trim() || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert vendor item
    const { data: newVendorItem, error } = await supabase
      .from('VendorItems')
      .insert(vendorItemData)
      .select(`
        *,
        InventoryItems:inventory_items(
          id,
          item_name,
          current_quantity,
          unit_of_measurement,
          category
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to add item to vendor' }, { status: 500 })
    }

    // Update inventory item with latest vendor cost if this is preferred vendor
    if (body.is_preferred) {
      await updateInventoryItemCost(body.inventory_item_id, body.cost_per_unit, supabase)
    }

    console.log(`✅ Added item ${inventoryItem.item_name} to vendor ${vendor.name}`)

    return NextResponse.json(newVendorItem, { status: 201 })

  } catch (error) {
    console.error('Vendor items POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/stock/vendors/[id]/items - Update vendor item details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { id: vendorId } = await params
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { error: 'Vendor item ID is required for updates' },
        { status: 400 }
      )
    }

    // Verify vendor belongs to user
    const { data: vendor } = await supabase
      .from('Vendors')
      .select('id')
      .eq('id', vendorId)
      .eq('user_id', user_id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Get existing vendor item
    const { data: existingItem } = await supabase
      .from('VendorItems')
      .select('*')
      .eq('id', body.id)
      .eq('vendor_id', vendorId)
      .single()

    if (!existingItem) {
      return NextResponse.json({ error: 'Vendor item not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData = {
      vendor_sku: body.vendor_sku?.trim(),
      vendor_name: body.vendor_name?.trim(),
      cost_per_unit: body.cost_per_unit,
      minimum_order_quantity: body.minimum_order_quantity,
      case_size: body.case_size,
      lead_time_days: body.lead_time_days,
      is_preferred: body.is_preferred,
      is_active: body.is_active,
      notes: body.notes?.trim(),
      updated_at: new Date().toISOString()
    }

    // Update last_cost_update if price changed
    if (body.cost_per_unit && body.cost_per_unit !== existingItem.cost_per_unit) {
      updateData.last_cost_update = new Date().toISOString()
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    // Perform update
    const { data: updatedVendorItem, error } = await supabase
      .from('VendorItems')
      .update(updateData)
      .eq('id', body.id)
      .eq('vendor_id', vendorId)
      .select(`
        *,
        InventoryItems:inventory_items(
          id,
          item_name,
          current_quantity,
          unit_of_measurement,
          category
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update vendor item' }, { status: 500 })
    }

    // Update inventory item cost if this became the preferred vendor or cost changed
    if (body.is_preferred && body.cost_per_unit) {
      await updateInventoryItemCost(existingItem.inventory_item_id, body.cost_per_unit, supabase)
    }

    console.log(`✅ Updated vendor item ${body.id} for vendor ${vendorId}`)

    return NextResponse.json(updatedVendorItem)

  } catch (error) {
    console.error('Vendor items PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/stock/vendors/[id]/items - Remove items from vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { id: vendorId } = await params
    const { searchParams } = new URL(request.url)
    const itemIds = searchParams.get('item_ids')?.split(',') || []

    if (itemIds.length === 0) {
      return NextResponse.json(
        { error: 'Vendor item IDs are required' },
        { status: 400 }
      )
    }

    // Verify vendor belongs to user
    const { data: vendor } = await supabase
      .from('Vendors')
      .select('id')
      .eq('id', vendorId)
      .eq('user_id', user_id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Check for items in pending orders
    const { data: pendingOrderItems } = await supabase
      .from('PurchaseOrderItems')
      .select('vendor_item_id')
      .in('vendor_item_id', itemIds)
      .eq('PurchaseOrders.status', 'pending')

    if (pendingOrderItems && pendingOrderItems.length > 0) {
      return NextResponse.json(
        { error: 'Cannot remove items that are part of pending purchase orders' },
        { status: 400 }
      )
    }

    // Soft delete vendor items
    const { data: deletedItems, error } = await supabase
      .from('VendorItems')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', itemIds)
      .eq('vendor_id', vendorId)
      .select('id, vendor_name')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to remove vendor items' }, { status: 500 })
    }

    console.log(`✅ Removed ${deletedItems?.length || 0} items from vendor ${vendorId}`)

    return NextResponse.json({
      removedCount: deletedItems?.length || 0,
      removedItems: deletedItems
    })

  } catch (error) {
    console.error('Vendor items DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Update inventory item cost based on preferred vendor pricing
 */
async function updateInventoryItemCost(inventoryItemId: string, newCost: number, supabase: any) {
  try {
    const { error } = await supabase
      .from('inventory_items')
      .update({
        cost_per_unit: newCost,
        last_cost_update: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', inventoryItemId)

    if (error) {
      console.error('Failed to update inventory item cost:', error)
    } else {
      console.log(`💰 Updated inventory item ${inventoryItemId} cost to $${newCost}`)
    }
  } catch (error) {
    console.error('Update inventory cost error:', error)
  }
}