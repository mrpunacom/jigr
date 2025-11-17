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
    const category = url.searchParams.get('category') || ''
    const status = url.searchParams.get('status') || 'all'
    const sortBy = url.searchParams.get('sortBy') || 'name'
    const sortOrder = url.searchParams.get('sortOrder') || 'asc'
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')

    // Build base query
    let query = supabase
      .from('inventory_items')
      .select(`
        *,
        inventory_categories!left(name),
        inventory_count!left(
          quantity_on_hand,
          count_date,
          counted_by
        )
      `)
      .eq('client_id', clientId)

    // Apply search filter
    if (search) {
      query = query.or(`item_name.ilike.%${search}%,brand.ilike.%${search}%`)
    }

    // Apply category filter
    if (category) {
      query = query.eq('category_id', category)
    }

    // Apply status filter
    if (status !== 'all') {
      switch (status) {
        case 'active':
          query = query.eq('is_active', true)
          break
        case 'inactive':
          query = query.eq('is_active', false)
          break
        // Note: low_stock and out_of_stock will be filtered client-side
      }
    }

    // Apply sorting
    const sortColumn = sortBy === 'name' ? 'item_name' : 
                      sortBy === 'category' ? 'category_id' :
                      sortBy === 'last_counted' ? 'updated_at' : 'item_name'
    
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }

    // Process the data to include latest count info
    const processedItems = data?.map(item => ({
      ...item,
      category_name: item.inventory_categories?.name,
      // Get the most recent count
      quantity_on_hand: item.inventory_count?.[0]?.quantity_on_hand || 0,
      count_date: item.inventory_count?.[0]?.count_date,
      counted_by: item.inventory_count?.[0]?.counted_by
    })) || []

    // Apply client-side filters for stock levels
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

    return NextResponse.json({
      success: true,
      items: filteredItems,
      pagination: {
        page,
        pageSize,
        totalItems: filteredItems.length,
        totalPages: Math.ceil(filteredItems.length / pageSize)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}