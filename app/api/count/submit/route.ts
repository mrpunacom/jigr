import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractUserAndClientId, ApiErrors } from '@/lib/utils/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Extract client_id and user_id using standardized utility
    const { clientId, userId } = await extractUserAndClientId(request)
    if (!clientId || !userId) {
      return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 })
    }
    const body = await request.json()

    // Validate required fields
    const { itemId, quantity, unit, locationId, notes, sessionId } = body

    if (!itemId || quantity === undefined || quantity < 0) {
      return NextResponse.json({ 
        error: 'Missing or invalid required fields: itemId and quantity are required' 
      }, { status: 400 })
    }

    // Verify the item exists and belongs to the client
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('id, item_name, count_unit')
      .eq('id', itemId)
      .eq('client_id', clientId)
      .single()

    if (itemError || !item) {
      return NextResponse.json({ 
        error: 'Item not found or access denied' 
      }, { status: 404 })
    }

    // Verify location exists if provided
    if (locationId) {
      const { data: location, error: locationError } = await supabase
        .from('inventory_locations')
        .select('id')
        .eq('id', locationId)
        .eq('client_id', clientId)
        .single()

      if (locationError || !location) {
        return NextResponse.json({ 
          error: 'Location not found or access denied' 
        }, { status: 400 })
      }
    }

    // Verify session if provided
    let verifiedSession = null
    if (sessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('location_count_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('client_id', clientId)
        .single()

      if (sessionError || !session) {
        return NextResponse.json({ 
          error: 'Session not found or access denied' 
        }, { status: 404 })
      }

      if (session.session_status !== 'active') {
        return NextResponse.json({ 
          error: 'Session is not active' 
        }, { status: 400 })
      }

      verifiedSession = session
    }

    // Check if this item already has a count in this session
    let existingCount = null
    if (sessionId) {
      const { data: existing } = await supabase
        .from('inventory_count')
        .select('*')
        .eq('session_id', sessionId)
        .eq('item_id', itemId)
        .single()
      
      existingCount = existing
    }

    let countData
    if (existingCount) {
      // Update existing count
      const { data: updated, error: updateError } = await supabase
        .from('inventory_count')
        .update({
          quantity_on_hand: quantity,
          count_unit: unit || item.count_unit,
          location_id: locationId || null,
          notes: notes || null,
          counted_by: userId,
          count_date: new Date().toISOString()
        })
        .eq('id', existingCount.id)
        .select()
        .single()

      if (updateError) {
        console.error('Database error:', updateError)
        return NextResponse.json({ error: 'Failed to update count' }, { status: 500 })
      }

      countData = updated
    } else {
      // Insert new count record
      const { data: inserted, error: insertError } = await supabase
        .from('inventory_count')
        .insert({
          client_id: clientId,
          item_id: itemId,
          quantity_on_hand: quantity,
          count_unit: unit || item.count_unit,
          location_id: locationId || null,
          notes: notes || null,
          counted_by: userId,
          count_date: new Date().toISOString(),
          session_id: sessionId || null
        })
        .select()
        .single()

      if (insertError) {
        console.error('Database error:', insertError)
        return NextResponse.json({ error: 'Failed to save count' }, { status: 500 })
      }

      countData = inserted

      // If this is part of a session and it's a new count, increment the session count
      if (sessionId && verifiedSession) {
        const { error: incrementError } = await supabase
          .from('location_count_sessions')
          .update({ 
            counted_items_count: verifiedSession.counted_items_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId)

        if (incrementError) {
          console.warn('Failed to increment session count:', incrementError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Count saved successfully',
      count: countData
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}