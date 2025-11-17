import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { extractClientId, extractUserAndClientId, ApiErrors } from '@/lib/utils/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/count/sessions - Get active/paused sessions for location
export async function GET(request: NextRequest) {
  try {
    // Extract client_id using standardized utility
    const clientId = await extractClientId(request)
    if (!clientId) {
      return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 })
    }
    const url = new URL(request.url)
    const locationId = url.searchParams.get('location_id')
    const status = url.searchParams.get('status') || 'active'

    if (!locationId) {
      return NextResponse.json({ error: 'location_id parameter required' }, { status: 400 })
    }

    // Get sessions for this location
    let query = supabase
      .from('location_count_sessions')
      .select(`
        *,
        inventory_locations!inner(location_name, name)
      `)
      .eq('client_id', clientId)
      .eq('location_id', locationId)

    if (status !== 'all') {
      query = query.eq('session_status', status)
    }

    const { data: sessions, error } = await query.order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    // Add progress percentage and location name to each session
    const sessionsWithProgress = sessions?.map(session => ({
      ...session,
      location_name: session.inventory_locations?.location_name || session.inventory_locations?.name || `Location ${session.location_id}`,
      progress_percentage: session.total_items_count > 0 
        ? Math.round((session.counted_items_count / session.total_items_count) * 100)
        : 0
    })) || []

    return NextResponse.json({
      success: true,
      sessions: sessionsWithProgress
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/count/sessions - Create new count session
export async function POST(request: NextRequest) {
  try {
    // Extract client_id and user_id using standardized utility
    const { clientId, userId } = await extractUserAndClientId(request)
    if (!clientId || !userId) {
      return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 })
    }
    const body = await request.json()
    const { location_id } = body

    if (!location_id) {
      return NextResponse.json({ error: 'location_id is required' }, { status: 400 })
    }

    // Check if there's already an active session for this location
    const { data: existingSession } = await supabase
      .from('location_count_sessions')
      .select('*')
      .eq('client_id', clientId)
      .eq('location_id', location_id)
      .in('session_status', ['active', 'paused'])
      .single()

    if (existingSession) {
      return NextResponse.json({
        error: 'Active or paused session already exists for this location',
        existing_session: existingSession
      }, { status: 409 })
    }

    // Get total count of active items for this client
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('id')
      .eq('client_id', clientId)
      .eq('is_active', true)

    if (itemsError) {
      console.error('Error counting items:', itemsError)
      return NextResponse.json({ error: 'Failed to count items' }, { status: 500 })
    }

    const totalItemsCount = items?.length || 0

    // Create new session
    const sessionData = {
      client_id: clientId,
      location_id: location_id,
      user_id: userId,
      session_status: 'active',
      started_at: new Date().toISOString(),
      total_items_count: totalItemsCount,
      counted_items_count: 0
    }

    const { data: session, error: sessionError } = await supabase
      .from('location_count_sessions')
      .insert(sessionData)
      .select('*')
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    // Get location name for response
    const { data: location } = await supabase
      .from('inventory_locations')
      .select('location_name, name')
      .eq('id', location_id)
      .single()

    const locationName = location?.location_name || location?.name || `Location ${location_id}`

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        location_name: locationName,
        progress_percentage: 0
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}