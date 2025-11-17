import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { extractClientId, ApiErrors } from '@/lib/utils/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/inventory/locations - Fetch all locations for client
export async function GET(request: NextRequest) {
  try {
    // Extract client_id using standardized utility
    const clientId = await extractClientId(request)
    if (!clientId) {
      return NextResponse.json({ error: ApiErrors.UNAUTHORIZED, locations: [] }, { status: 401 })
    }
    
    console.log('🔍 Locations API using client_id:', clientId)

    // Fetch locations for this client
    const { data: locations, error: fetchError } = await supabase
      .from('inventory_locations')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('location_name')

    if (fetchError) {
      console.error('Error fetching locations:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch locations', locations: [] },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      locations: locations || [],
      count: locations?.length || 0
    })

  } catch (error) {
    console.error('Location fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', locations: [] },
      { status: 500 }
    )
  }
}

// POST /api/inventory/locations - Create new location
export async function POST(request: NextRequest) {
  try {
    // Extract client_id using standardized utility
    const clientId = await extractClientId(request)
    if (!clientId) {
      return NextResponse.json({ error: ApiErrors.UNAUTHORIZED, location: null }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Location name is required', location: null },
        { status: 400 }
      )
    }

    // clientId is already extracted from auth

    // Check for duplicate name
    const { data: existingLocation } = await supabase
      .from('inventory_locations')
      .select('id')
      .eq('client_id', clientId)
      .eq('name', name.trim())
      .eq('is_active', true)
      .maybeSingle()

    if (existingLocation) {
      return NextResponse.json(
        { error: 'Location name already exists', location: null },
        { status: 409 }
      )
    }

    // Create new location
    const { data: newLocation, error: createError } = await supabase
      .from('inventory_locations')
      .insert({
        client_id: clientId,
        name: name.trim(),
        description: description?.trim() || null,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating location:', createError)
      return NextResponse.json(
        { error: 'Failed to create location', location: null },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      location: newLocation,
      message: 'Location created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Location creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', location: null },
      { status: 500 }
    )
  }
}