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
    const tab = url.searchParams.get('tab') || 'all' // all, expiring, expired, active
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20')

    // Build base query
    let query = supabase
      .from('inventory_batches')
      .select(`
        id,
        batch_number,
        quantity,
        unit,
        expiration_date,
        status,
        received_date,
        vendor_id,
        item_id,
        inventory_items!inner(
          item_name,
          count_unit,
          category_id,
          inventory_categories!left(name)
        ),
        vendor_companies!left(name)
      `, { count: 'exact' })
      .eq('client_id', clientId)

    const today = new Date().toISOString().split('T')[0]

    // Apply tab filters
    switch (tab) {
      case 'expiring':
        // Next 7 days
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
        query = query
          .eq('status', 'active')
          .not('expiration_date', 'is', null)
          .gte('expiration_date', today)
          .lte('expiration_date', sevenDaysFromNow.toISOString().split('T')[0])
        break
      case 'expired':
        query = query
          .not('expiration_date', 'is', null)
          .lt('expiration_date', today)
        break
      case 'active':
        query = query.eq('status', 'active')
        break
      // 'all' - no additional filter
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query
      .order('expiration_date', { ascending: true, nullsFirst: false })
      .range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 })
    }

    // Process the data
    const today_date = new Date()
    const processedBatches = data?.map(batch => {
      let daysUntilExpiry = null
      let urgencyLevel = 'good'

      if (batch.expiration_date) {
        const expiryDate = new Date(batch.expiration_date)
        daysUntilExpiry = Math.ceil((expiryDate.getTime() - today_date.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilExpiry <= 1) urgencyLevel = 'critical'
        else if (daysUntilExpiry <= 3) urgencyLevel = 'warning'
      }

      return {
        id: batch.id,
        batch_number: batch.batch_number,
        quantity: batch.quantity,
        unit: batch.unit,
        expiration_date: batch.expiration_date,
        status: batch.status,
        received_date: batch.received_date,
        vendor_id: batch.vendor_id,
        item_id: batch.item_id,
        item_name: (batch as any).inventory_items?.item_name,
        item_unit: (batch as any).inventory_items?.count_unit,
        category_name: (batch as any).inventory_items?.inventory_categories?.name,
        vendor_name: (batch as any).vendor_companies?.name,
        days_until_expiry: daysUntilExpiry,
        urgency_level: urgencyLevel
      }
    }) || []

    return NextResponse.json({
      success: true,
      batches: processedBatches,
      pagination: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      },
      tab,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}