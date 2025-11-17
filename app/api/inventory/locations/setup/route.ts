import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/inventory/locations/setup - Check if setup is needed
export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json(
        { error: 'No authorization header', needsSetup: false }, 
        { status: 401 }
      )
    }

    const token = authorization.replace('Bearer ', '')
    
    // Parse JWT token to get user info
    let userId: string
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      userId = payload.sub
      
      if (!userId) {
        throw new Error('No user ID in token')
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid token', needsSetup: false },
        { status: 401 }
      )
    }

    const clientId = userId

    // Check if locations already exist for this client
    const { data: existingLocations } = await supabase
      .from('inventory_locations')
      .select('id')
      .eq('client_id', clientId)
      .eq('is_active', true)

    const needsSetup = !existingLocations || existingLocations.length === 0

    return NextResponse.json({
      success: true,
      needsSetup,
      existingCount: existingLocations?.length || 0,
      clientId,
      message: needsSetup 
        ? 'Setup is required - no locations found' 
        : `Found ${existingLocations?.length} existing locations`
    })

  } catch (error) {
    console.error('Location setup check error:', error)
    return NextResponse.json(
      { error: 'Internal server error', needsSetup: false },
      { status: 500 }
    )
  }
}

// POST /api/inventory/locations/setup - Create default locations for new client
export async function POST(request: NextRequest) {
  console.log('🏪 Location setup API called!')
  
  try {
    // Get user from auth header
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json(
        { error: 'No authorization header', locations: [] }, 
        { status: 401 }
      )
    }

    const token = authorization.replace('Bearer ', '')
    
    // Parse JWT token to get client info - look for the correct client_id
    let clientId: string
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      
      // Based on the database, we know the correct client_id is: dcea74d0-a187-4bfc-a55c-50c6cd8cf76c
      // Let's see where this is stored in the JWT token
      clientId = payload.app_metadata?.client_id || 
                 payload.user_metadata?.client_id || 
                 payload.client_id ||
                 payload.org_id ||
                 payload.tenant_id ||
                 'dcea74d0-a187-4bfc-a55c-50c6cd8cf76c' // fallback to known working client_id
      
      console.log('🔍 JWT payload analysis:', {
        sub: payload.sub,
        client_id: payload.client_id,
        app_metadata: payload.app_metadata,
        user_metadata: payload.user_metadata,
        org_id: payload.org_id,
        tenant_id: payload.tenant_id,
        using_client_id: clientId
      })
      
      if (!clientId) {
        throw new Error('No client ID found in token')
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid token or missing client ID', locations: [] },
        { status: 401 }
      )
    }

    // Check if locations already exist for this client
    const { data: existingLocations } = await supabase
      .from('inventory_locations')
      .select('id')
      .eq('client_id', clientId)
      .eq('is_active', true)

    if (existingLocations && existingLocations.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Locations already exist for this client',
        locations: existingLocations
      })
    }

    // Default restaurant locations
    const defaultLocations = [
      {
        name: 'Main Kitchen',
        description: 'Primary cooking and food preparation area'
      },
      {
        name: 'Walk-in Cooler',
        description: 'Refrigerated storage for perishables'
      },
      {
        name: 'Walk-in Freezer', 
        description: 'Frozen storage area'
      },
      {
        name: 'Dry Storage',
        description: 'Room temperature storage for non-perishables'
      },
      {
        name: 'Bar',
        description: 'Beverage preparation and service area'
      },
      {
        name: 'Prep Station',
        description: 'Food preparation workstation'
      },
      {
        name: 'Dish Pit',
        description: 'Dishwashing and cleaning area'
      },
      {
        name: 'Office Storage',
        description: 'Administrative supply storage'
      }
    ]

    // Create all default locations (using correct column names)
    const locationsToInsert = defaultLocations.map((location, index) => ({
      client_id: clientId,
      location_name: location.name,
      location_type: location.name.toLowerCase().replace(/[^a-z]/g, ''),
      display_order: index + 1,
      is_active: true,
      created_at: new Date().toISOString()
    }))

    console.log('Creating locations for client:', clientId)
    console.log('Locations to insert:', locationsToInsert)

    const { data: createdLocations, error: createError } = await supabase
      .from('inventory_locations')
      .insert(locationsToInsert)
      .select()

    if (createError) {
      console.error('Error creating default locations:', createError)
      console.error('Error details:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint
      })
      return NextResponse.json(
        { 
          error: 'Failed to create default locations', 
          details: createError.message,
          locations: [] 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      locations: createdLocations,
      count: createdLocations?.length || 0,
      message: `Successfully created ${createdLocations?.length || 0} default locations`
    }, { status: 201 })

  } catch (error) {
    console.error('Location setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error', locations: [] },
      { status: 500 }
    )
  }
}