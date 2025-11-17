import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/debug/location-client-ids - Find which client IDs exist in inventory_locations
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Querying inventory_locations for client IDs...')

    // Get all records with their client_ids (using * to avoid column name issues)
    const { data: allLocations, error: fetchError } = await supabase
      .from('inventory_locations')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching location data:', fetchError)
      return NextResponse.json(
        { 
          error: 'Failed to fetch location data', 
          details: fetchError.message,
          locations: [] 
        },
        { status: 500 }
      )
    }

    // Aggregate data by client_id
    const clientStats: Record<string, any> = {}
    const uniqueClientIds = new Set<string>()

    if (allLocations) {
      allLocations.forEach(location => {
        const clientId = location.client_id
        uniqueClientIds.add(clientId)
        
        if (!clientStats[clientId]) {
          clientStats[clientId] = {
            client_id: clientId,
            total_locations: 0,
            active_locations: 0,
            inactive_locations: 0,
            sample_locations: []
          }
        }
        
        clientStats[clientId].total_locations++
        
        if (location.is_active) {
          clientStats[clientId].active_locations++
        } else {
          clientStats[clientId].inactive_locations++
        }
        
        // Keep first 3 locations as samples
        if (clientStats[clientId].sample_locations.length < 3) {
          clientStats[clientId].sample_locations.push({
            id: location.id || location.location_id,
            name: location.name || location.location_name || 'Unknown',
            is_active: location.is_active
          })
        }
      })
    }

    console.log('📊 Location analysis complete:')
    console.log(`- Total records: ${allLocations?.length || 0}`)
    console.log(`- Unique client IDs: ${uniqueClientIds.size}`)
    console.log('- Client IDs:', Array.from(uniqueClientIds))

    return NextResponse.json({ 
      success: true,
      summary: {
        total_records: allLocations?.length || 0,
        unique_client_ids: uniqueClientIds.size,
        client_ids: Array.from(uniqueClientIds)
      },
      client_stats: Object.values(clientStats),
      raw_data: allLocations || []
    })

  } catch (error) {
    console.error('Location client ID query error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Also provide a simple SQL equivalent for reference
export async function POST(request: NextRequest) {
  const sqlQueries = {
    "basic_client_ids": `
      SELECT DISTINCT client_id, COUNT(*) as location_count
      FROM inventory_locations 
      GROUP BY client_id 
      ORDER BY location_count DESC;
    `,
    "detailed_breakdown": `
      SELECT 
        client_id,
        COUNT(*) as total_locations,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_locations,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_locations,
        MIN(created_at) as first_created,
        MAX(created_at) as last_created
      FROM inventory_locations 
      GROUP BY client_id
      ORDER BY total_locations DESC;
    `,
    "sample_data": `
      SELECT client_id, id, name, is_active, created_at
      FROM inventory_locations 
      ORDER BY created_at DESC 
      LIMIT 20;
    `
  }

  return NextResponse.json({
    message: "SQL queries for inventory_locations client analysis",
    queries: sqlQueries
  })
}