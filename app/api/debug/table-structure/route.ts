import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/debug/table-structure - Get actual table structure
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking actual table structure for inventory_locations...')

    // Try to get just the first record to see what columns exist
    const { data: sampleData, error: sampleError } = await supabase
      .from('inventory_locations')
      .select('*')
      .limit(1)

    if (sampleError) {
      console.error('Error fetching sample data:', sampleError)
      return NextResponse.json(
        { 
          error: 'Failed to fetch sample data', 
          details: sampleError.message,
          table_exists: false
        },
        { status: 500 }
      )
    }

    // Get table structure from information_schema
    const { data: columnInfo, error: columnError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'inventory_locations' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })

    if (columnError) {
      console.log('Could not get column info via RPC (normal if RPC not available)')
    }

    // Count total records
    const { count, error: countError } = await supabase
      .from('inventory_locations')
      .select('*', { count: 'exact', head: true })

    console.log('📊 Table analysis:')
    console.log(`- Total records: ${count || 0}`)
    if (sampleData && sampleData.length > 0) {
      console.log('- Available columns:', Object.keys(sampleData[0]))
      console.log('- Sample record:', sampleData[0])
    } else {
      console.log('- Table is empty, cannot determine column structure from data')
    }

    return NextResponse.json({ 
      success: true,
      table_exists: true,
      total_records: count || 0,
      sample_data: sampleData || [],
      available_columns: sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [],
      column_info: columnInfo || null,
      message: sampleData && sampleData.length > 0 
        ? 'Table structure determined from sample data'
        : 'Table exists but is empty - column structure unknown'
    })

  } catch (error) {
    console.error('Table structure query error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}