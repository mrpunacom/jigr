/**
 * Vendor Management API
 * 
 * Handles CRUD operations for suppliers/vendors including:
 * - Creating and managing vendor profiles
 * - Contact information and business details
 * - Pricing and ordering preferences
 * - Performance tracking and ratings
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/stock/vendors - List all vendors with filtering and search
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'active'
    const category = searchParams.get('category') || ''
    const sortBy = searchParams.get('sort_by') || 'name'
    const sortOrder = searchParams.get('sort_order') || 'asc'

    // Calculate pagination
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('Vendors')
      .select(`
        id,
        name,
        business_name,
        contact_person,
        email,
        phone,
        address,
        website,
        vendor_code,
        category,
        payment_terms,
        minimum_order_amount,
        delivery_days,
        is_preferred,
        is_active,
        rating,
        total_orders,
        last_order_date,
        notes,
        created_at,
        updated_at
      `)
      .eq('user_id', user_id)

    // Apply filters
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    } else if (status === 'preferred') {
      query = query.eq('is_preferred', true).eq('is_active', true)
    }

    if (search) {
      query = query.or(`
        name.ilike.%${search}%,
        business_name.ilike.%${search}%,
        contact_person.ilike.%${search}%,
        email.ilike.%${search}%,
        vendor_code.ilike.%${search}%
      `)
    }

    if (category) {
      query = query.eq('category', category)
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: vendors, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('Vendors')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)

    return NextResponse.json({
      vendors,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Vendors GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/stock/vendors - Create new vendor
export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Vendor name and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check for duplicate vendor (by email or vendor_code)
    const duplicateChecks = []
    if (body.email) {
      duplicateChecks.push(
        supabase
          .from('Vendors')
          .select('id')
          .eq('user_id', user_id)
          .eq('email', body.email)
          .eq('is_active', true)
          .single()
      )
    }
    if (body.vendor_code) {
      duplicateChecks.push(
        supabase
          .from('Vendors')
          .select('id')
          .eq('user_id', user_id)
          .eq('vendor_code', body.vendor_code)
          .eq('is_active', true)
          .single()
      )
    }

    const duplicateResults = await Promise.all(duplicateChecks)
    if (duplicateResults.some(result => result.data)) {
      return NextResponse.json(
        { error: 'A vendor with this email or vendor code already exists' },
        { status: 409 }
      )
    }

    // Generate vendor code if not provided
    const vendorCode = body.vendor_code || await generateVendorCode(body.name, user_id, supabase)

    // Prepare vendor data
    const vendorData = {
      user_id,
      name: body.name.trim(),
      business_name: body.business_name?.trim() || body.name.trim(),
      contact_person: body.contact_person?.trim() || '',
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || '',
      address: body.address?.trim() || '',
      website: body.website?.trim() || '',
      vendor_code: vendorCode,
      category: body.category?.trim() || 'General',
      payment_terms: body.payment_terms || 'Net 30',
      minimum_order_amount: body.minimum_order_amount || 0,
      delivery_days: body.delivery_days || 3,
      is_preferred: body.is_preferred || false,
      is_active: true,
      rating: 0, // Will be calculated from order history
      total_orders: 0,
      last_order_date: null,
      notes: body.notes?.trim() || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert new vendor
    const { data: newVendor, error } = await supabase
      .from('Vendors')
      .insert(vendorData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Vendor with this email or code already exists' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 })
    }

    console.log(`✅ Created vendor: ${newVendor.name} (${newVendor.vendor_code}) for user ${user_id}`)

    return NextResponse.json(newVendor, { status: 201 })

  } catch (error) {
    console.error('Vendors POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/stock/vendors - Update vendor information
export async function PUT(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { error: 'Vendor ID is required for updates' },
        { status: 400 }
      )
    }

    // Prepare update data
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

      // Check for email conflicts
      const { data: conflictVendor } = await supabase
        .from('Vendors')
        .select('id')
        .eq('user_id', user_id)
        .eq('email', updateData.email)
        .neq('id', body.id)
        .single()

      if (conflictVendor) {
        return NextResponse.json(
          { error: 'Another vendor with this email already exists' },
          { status: 409 }
        )
      }
    }

    // Perform update
    const { data: updatedVendor, error } = await supabase
      .from('Vendors')
      .update(updateData)
      .eq('id', body.id)
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

    console.log(`✅ Updated vendor: ${updatedVendor.name} for user ${user_id}`)

    return NextResponse.json(updatedVendor)

  } catch (error) {
    console.error('Vendors PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/stock/vendors - Soft delete vendors
export async function DELETE(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const vendorIds = searchParams.get('ids')?.split(',') || []

    if (vendorIds.length === 0) {
      return NextResponse.json(
        { error: 'Vendor IDs are required' },
        { status: 400 }
      )
    }

    // Check for active orders before deletion
    const { data: activeOrders } = await supabase
      .from('PurchaseOrders')
      .select('id, vendor_id')
      .in('vendor_id', vendorIds)
      .eq('status', 'pending')

    if (activeOrders && activeOrders.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete vendors with pending purchase orders' },
        { status: 400 }
      )
    }

    // Soft delete vendors by setting is_active to false
    const { data: deletedVendors, error } = await supabase
      .from('Vendors')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', vendorIds)
      .eq('user_id', user_id)
      .select('id, name')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete vendors' }, { status: 500 })
    }

    console.log(`✅ Soft deleted ${deletedVendors?.length || 0} vendors for user ${user_id}`)

    return NextResponse.json({
      deletedCount: deletedVendors?.length || 0,
      deletedVendors
    })

  } catch (error) {
    console.error('Vendors DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Generate a unique vendor code
 */
async function generateVendorCode(vendorName: string, userId: string, supabase: any): Promise<string> {
  // Create base code from vendor name (first 3 letters + random number)
  const namePrefix = vendorName
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase()
  
  for (let i = 1; i <= 999; i++) {
    const code = `${namePrefix}${i.toString().padStart(3, '0')}`
    
    // Check if code already exists
    const { data: existingVendor } = await supabase
      .from('Vendors')
      .select('id')
      .eq('user_id', userId)
      .eq('vendor_code', code)
      .single()
    
    if (!existingVendor) {
      return code
    }
  }
  
  // Fallback to timestamp-based code if all variations are taken
  return `VND${Date.now().toString().slice(-6)}`
}