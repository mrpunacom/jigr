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

    // Fetch total inventory value
    const { data: totalValueData, error: totalValueError } = await supabase.rpc(
      'calculate_total_inventory_value', 
      { client_uuid: clientId }
    )

    let totalValue = 0
    if (!totalValueError && totalValueData) {
      totalValue = parseFloat(totalValueData) || 0
    } else {
      // Fallback calculation if RPC doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('inventory_items')
        .select(`
          unit_cost,
          inventory_count!left(quantity_on_hand)
        `)
        .eq('client_id', clientId)

      if (!fallbackError && fallbackData) {
        totalValue = fallbackData.reduce((sum, item) => {
          const quantity = item.inventory_count?.[0]?.quantity_on_hand || 0
          const cost = item.unit_cost || 0
          return sum + (quantity * cost)
        }, 0)
      }
    }

    // Fetch items below par level
    const { data: belowParData, error: belowParError } = await supabase
      .from('inventory_items')
      .select(`
        id,
        item_name,
        par_level_low,
        count_unit,
        inventory_count!left(
          quantity_on_hand,
          count_date
        )
      `)
      .eq('client_id', clientId)
      .not('par_level_low', 'is', null)

    let itemsBelowPar: any[] = []
    if (!belowParError && belowParData) {
      itemsBelowPar = belowParData
        .map(item => ({
          ...item,
          current_stock: item.inventory_count?.[0]?.quantity_on_hand || 0,
          count_date: item.inventory_count?.[0]?.count_date
        }))
        .filter(item => item.current_stock < (item.par_level_low || 0))
        .slice(0, 10) // Limit to 10 items
    }

    // Fetch expiring batches (next 3 days)
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    const { data: expiringData, error: expiringError } = await supabase
      .from('inventory_batches')
      .select(`
        id,
        batch_number,
        quantity,
        unit,
        expiration_date,
        item_id,
        inventory_items!inner(item_name)
      `)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .not('expiration_date', 'is', null)
      .lte('expiration_date', threeDaysFromNow.toISOString().split('T')[0])
      .order('expiration_date', { ascending: true })

    const expiringBatches = expiringError ? [] : (expiringData || []).map(batch => ({
      ...batch,
      item_name: (batch as any).inventory_items?.item_name,
      days_until_expiry: Math.ceil((new Date(batch.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }))

    // Calculate summary metrics
    const metrics = {
      totalValue: {
        value: totalValue,
        formatted: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(totalValue),
        subtitle: 'Current inventory value'
      },
      itemsBelowParCount: {
        value: itemsBelowPar.length,
        subtitle: itemsBelowPar.length === 1 ? 'item needs restocking' : 'items need restocking'
      },
      expiringCount: {
        value: expiringBatches.length,
        subtitle: expiringBatches.length === 1 ? 'batch expiring soon' : 'batches expiring soon'
      }
    }

    return NextResponse.json({
      success: true,
      metrics,
      itemsBelowPar,
      expiringBatches: expiringBatches.slice(0, 10), // Limit display
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}