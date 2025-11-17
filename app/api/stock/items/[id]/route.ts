import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractClientId, ApiErrors } from '@/lib/utils/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params

    // Extract client_id using standardized utility
    const clientId = await extractClientId(request)
    if (!clientId) {
      return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 })
    }

    // Load item details
    const { data: itemData, error: itemError } = await supabase
      .from('inventory_items')
      .select(`
        *,
        inventory_categories!left(name)
      `)
      .eq('id', itemId)
      .eq('client_id', clientId)
      .single()

    if (itemError) {
      if (itemError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      }
      throw itemError
    }

    // Get latest count
    const { data: latestCount, error: countError } = await supabase
      .from('inventory_count')
      .select('*')
      .eq('item_id', itemId)
      .eq('client_id', clientId)
      .order('count_date', { ascending: false })
      .limit(1)
      .single()

    // Load active batches
    const { data: batchData, error: batchError } = await supabase
      .from('inventory_batches')
      .select(`
        *,
        vendor_companies!left(name, email, phone)
      `)
      .eq('item_id', itemId)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .order('expiration_date', { ascending: true, nullsFirst: false })

    if (batchError) throw batchError

    // Load vendor relationships
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendor_items')
      .select(`
        *,
        vendor_companies!inner(name, email, phone)
      `)
      .eq('item_id', itemId)
      .eq('client_id', clientId)
      .order('is_preferred', { ascending: false })

    if (vendorError) throw vendorError

    // Load count history
    const { data: historyData, error: historyError } = await supabase
      .from('inventory_count')
      .select('*')
      .eq('item_id', itemId)
      .eq('client_id', clientId)
      .order('count_date', { ascending: false })
      .limit(10)

    if (historyError) throw historyError

    // Process the data
    const processedItem = {
      ...itemData,
      category_name: itemData.inventory_categories?.name,
      quantity_on_hand: latestCount?.quantity_on_hand || 0,
      count_date: latestCount?.count_date,
      counted_by: latestCount?.counted_by
    }

    const processedBatches = batchData?.map(batch => ({
      ...batch,
      vendor_name: batch.vendor_companies?.name,
      vendor_email: batch.vendor_companies?.email,
      vendor_phone: batch.vendor_companies?.phone
    })) || []

    const processedVendors = vendorData?.map(vendor => ({
      ...vendor,
      vendor_name: vendor.vendor_companies?.name,
      vendor_email: vendor.vendor_companies?.email,
      vendor_phone: vendor.vendor_companies?.phone
    })) || []

    return NextResponse.json({
      success: true,
      item: processedItem,
      batches: processedBatches,
      vendors: processedVendors,
      countHistory: historyData || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}