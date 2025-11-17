import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractClientId, ApiErrors } from '@/lib/utils/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/count/sessions/[id] - Get session details with progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params

    // Extract client_id using standardized utility
    const clientId = await extractClientId(request)
    if (!clientId) {
      return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 })
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('location_count_sessions')
      .select(`
        *,
        inventory_locations!inner(location_name, name)
      `)
      .eq('id', sessionId)
      .eq('client_id', clientId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get all items counted in this session
    const { data: itemCounts, error: countsError } = await supabase
      .from('inventory_count')
      .select(`
        *,
        inventory_items!inner(item_name, count_unit, brand)
      `)
      .eq('session_id', sessionId)

    if (countsError) {
      console.error('Error fetching item counts:', countsError)
      return NextResponse.json({ error: 'Failed to fetch item counts' }, { status: 500 })
    }

    const completedItems = (itemCounts || []).map(count => ({
      id: count.id,
      session_id: sessionId,
      item_id: count.item_id,
      item_name: count.inventory_items.item_name,
      brand: count.inventory_items.brand,
      quantity_on_hand: count.quantity_on_hand,
      count_unit: count.count_unit,
      notes: count.notes,
      counted_at: count.count_date,
      is_counted: true
    }))

    // Get pending items (all active items not yet counted in this session)
    const countedItemIds = completedItems.map(item => item.item_id)
    
    let pendingQuery = supabase
      .from('inventory_items')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)

    if (countedItemIds.length > 0) {
      pendingQuery = pendingQuery.not('id', 'in', `(${countedItemIds.join(',')})`)
    }

    const { data: pendingItems, error: pendingError } = await pendingQuery

    if (pendingError) {
      console.error('Error fetching pending items:', pendingError)
      return NextResponse.json({ error: 'Failed to fetch pending items' }, { status: 500 })
    }

    // Calculate progress
    const locationName = session.inventory_locations?.location_name || session.inventory_locations?.name || `Location ${session.location_id}`
    const progressPercentage = session.total_items_count > 0 
      ? Math.round((session.counted_items_count / session.total_items_count) * 100)
      : 0

    const sessionWithProgress = {
      ...session,
      location_name: locationName,
      progress_percentage: progressPercentage
    }

    return NextResponse.json({
      success: true,
      session: sessionWithProgress,
      completed_items: completedItems,
      pending_items: pendingItems || [],
      progress: {
        total: session.total_items_count,
        completed: session.counted_items_count,
        remaining: session.total_items_count - session.counted_items_count,
        percentage: progressPercentage
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/count/sessions/[id] - Update session status (pause/resume/commit)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params

    // Extract client_id using standardized utility
    const clientId = await extractClientId(request)
    if (!clientId) {
      return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (!['pause', 'resume', 'commit'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be pause, resume, or commit' }, { status: 400 })
    }

    // Verify session belongs to this client
    const { data: session, error: sessionError } = await supabase
      .from('location_count_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('client_id', clientId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Update session based on action
    let updateData: any = { updated_at: new Date().toISOString() }

    switch (action) {
      case 'pause':
        if (session.session_status !== 'active') {
          return NextResponse.json({ error: 'Can only pause active sessions' }, { status: 400 })
        }
        updateData = {
          ...updateData,
          session_status: 'paused',
          paused_at: new Date().toISOString()
        }
        break

      case 'resume':
        if (session.session_status !== 'paused') {
          return NextResponse.json({ error: 'Can only resume paused sessions' }, { status: 400 })
        }
        updateData = {
          ...updateData,
          session_status: 'active',
          paused_at: null
        }
        break

      case 'commit':
        if (!['active', 'paused'].includes(session.session_status)) {
          return NextResponse.json({ error: 'Can only commit active or paused sessions' }, { status: 400 })
        }
        updateData = {
          ...updateData,
          session_status: 'completed',
          completed_at: new Date().toISOString()
        }
        break
    }

    const { data: updatedSession, error: updateError } = await supabase
      .from('location_count_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating session:', updateError)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      session: updatedSession,
      message: `Session ${action}d successfully`
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}