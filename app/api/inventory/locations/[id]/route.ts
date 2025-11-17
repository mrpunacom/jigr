import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/inventory/locations/[id] - Get specific location
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', location: null }, 
        { status: 401 }
      )
    }

    const { id } = await params

    // Fetch specific location
    const { data: location, error: fetchError } = await supabase
      .from('inventory_locations')
      .select('*')
      .eq('id', id)
      .eq('client_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching location:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch location', location: null },
        { status: 500 }
      )
    }

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found', location: null },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true,
      location
    })

  } catch (error) {
    console.error('Location fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', location: null },
      { status: 500 }
    )
  }
}

// PUT /api/inventory/locations/[id] - Update location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', location: null }, 
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Location name is required', location: null },
        { status: 400 }
      )
    }

    // Check if location exists and belongs to user
    const { data: existingLocation, error: checkError } = await supabase
      .from('inventory_locations')
      .select('id')
      .eq('id', id)
      .eq('client_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (checkError || !existingLocation) {
      return NextResponse.json(
        { error: 'Location not found', location: null },
        { status: 404 }
      )
    }

    // Check for duplicate name (excluding current location)
    const { data: duplicateLocation } = await supabase
      .from('inventory_locations')
      .select('id')
      .eq('client_id', user.id)
      .eq('name', name.trim())
      .eq('is_active', true)
      .neq('id', id)
      .maybeSingle()

    if (duplicateLocation) {
      return NextResponse.json(
        { error: 'Location name already exists', location: null },
        { status: 409 }
      )
    }

    // Update location
    const { data: updatedLocation, error: updateError } = await supabase
      .from('inventory_locations')
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('client_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating location:', updateError)
      return NextResponse.json(
        { error: 'Failed to update location', location: null },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      location: updatedLocation,
      message: 'Location updated successfully'
    })

  } catch (error) {
    console.error('Location update error:', error)
    return NextResponse.json(
      { error: 'Internal server error', location: null },
      { status: 500 }
    )
  }
}

// DELETE /api/inventory/locations/[id] - Delete (deactivate) location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const { id } = await params

    // Soft delete by setting is_active = false
    const { data: deletedLocation, error: deleteError } = await supabase
      .from('inventory_locations')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('client_id', user.id)
      .select()
      .single()

    if (deleteError) {
      console.error('Error deleting location:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete location' },
        { status: 500 }
      )
    }

    if (!deletedLocation) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Location deleted successfully'
    })

  } catch (error) {
    console.error('Location deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}