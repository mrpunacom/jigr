import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractClientId, ApiErrors } from '@/lib/utils/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Extract client_id using standardized utility
    const clientId = await extractClientId(request)
    if (!clientId) {
      return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 })
    }
    const url = new URL(request.url)
    
    // Parse query parameters
    const search = url.searchParams.get('search') || ''
    const type = url.searchParams.get('type') || ''
    const status = url.searchParams.get('status') || 'all' // all, active, inactive
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')

    // Build base query
    let query = supabase
      .from('vendor_companies')
      .select(`
        vendor_id,
        vendor_name,
        contact_name,
        phone,
        email,
        vendor_categories,
        is_active,
        address,
        notes,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('client_id', clientId)

    // Apply search filter
    if (search) {
      query = query.or(`vendor_name.ilike.%${search}%,contact_name.ilike.%${search}%`)
    }

    // Apply type/category filter
    if (type) {
      query = query.ilike('vendor_categories', `%${type}%`)
    }

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('is_active', status === 'active')
    }

    // Apply sorting and pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query
      .order('vendor_name', { ascending: true })
      .range(from, to)

    const { data: vendorData, error: vendorError, count } = await query

    if (vendorError) {
      console.error('Database error:', vendorError)
      return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 })
    }

    // Get vendor stats (item count and last delivery date)
    const vendorIds = vendorData?.map(v => v.vendor_id) || []
    
    let vendorStats: Record<string, { item_count: number; last_delivery_date?: string }> = {}
    
    if (vendorIds.length > 0) {
      // Get item counts per vendor
      const { data: itemCounts, error: itemCountError } = await supabase
        .from('vendor_items')
        .select('vendor_id')
        .eq('client_id', clientId)
        .in('vendor_id', vendorIds)

      if (!itemCountError && itemCounts) {
        const countMap = itemCounts.reduce((acc, item) => {
          acc[item.vendor_id] = (acc[item.vendor_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        vendorIds.forEach(id => {
          vendorStats[id] = { item_count: countMap[id] || 0 }
        })
      }

      // Get last delivery dates
      const { data: lastDeliveries, error: deliveryError } = await supabase
        .from('inventory_batches')
        .select('vendor_id, received_date')
        .eq('client_id', clientId)
        .in('vendor_id', vendorIds)
        .not('vendor_id', 'is', null)
        .order('received_date', { ascending: false })

      if (!deliveryError && lastDeliveries) {
        const deliveryMap: Record<string, string> = {}
        lastDeliveries.forEach(delivery => {
          if (delivery.vendor_id && !deliveryMap[delivery.vendor_id]) {
            deliveryMap[delivery.vendor_id] = delivery.received_date
          }
        })

        vendorIds.forEach(id => {
          if (deliveryMap[id]) {
            vendorStats[id] = {
              ...vendorStats[id],
              last_delivery_date: deliveryMap[id]
            }
          }
        })
      }
    }

    // Process vendor data with stats
    const processedVendors = vendorData?.map(vendor => ({
      id: vendor.vendor_id,
      vendor_name: vendor.vendor_name,
      contact_name: vendor.contact_name,
      phone: vendor.phone,
      email: vendor.email,
      vendor_categories: vendor.vendor_categories,
      is_active: vendor.is_active,
      address: vendor.address,
      notes: vendor.notes,
      created_at: vendor.created_at,
      updated_at: vendor.updated_at,
      item_count: vendorStats[vendor.vendor_id]?.item_count || 0,
      last_delivery_date: vendorStats[vendor.vendor_id]?.last_delivery_date
    })) || []

    // Get unique categories for filter options
    const allCategories = vendorData?.flatMap(v => 
      v.vendor_categories ? v.vendor_categories.split(',').map((c: string) => c.trim()) : []
    ) || []
    const uniqueCategories = [...new Set(allCategories)].sort()

    return NextResponse.json({
      success: true,
      vendors: processedVendors,
      categories: uniqueCategories,
      pagination: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      },
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}