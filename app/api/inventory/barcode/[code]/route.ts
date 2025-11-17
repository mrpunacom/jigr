import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { cleanBarcode, isValidBarcode } from '@/lib/utils/barcode'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Use existing supabase client
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', item: null }, 
        { status: 401 }
      )
    }

    const { code } = await params
    
    if (!code) {
      return NextResponse.json(
        { error: 'Barcode is required', item: null },
        { status: 400 }
      )
    }

    // Clean and validate barcode
    const cleanedCode = cleanBarcode(code)
    
    if (!isValidBarcode(cleanedCode)) {
      return NextResponse.json(
        { error: 'Invalid barcode format', item: null },
        { status: 400 }
      )
    }

    // Lookup item by barcode (RLS will automatically filter by client_id)
    const { data: item, error: lookupError } = await supabase
      .from('inventory_items')
      .select(`
        item_id,
        item_name,
        brand,
        barcode,
        recipe_unit,
        count_unit,
        source_type,
        category_id,
        unit_cost,
        par_level_low,
        par_level_high,
        inventory_categories (
          category_name
        ),
        created_at
      `)
      .eq('barcode', cleanedCode)
      .maybeSingle()

    if (lookupError) {
      console.error('Error looking up barcode:', lookupError)
      return NextResponse.json(
        { error: 'Database error', item: null },
        { status: 500 }
      )
    }

    // Return result (null if not found)
    return NextResponse.json({ 
      item,
      barcode: cleanedCode,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Barcode lookup error:', error)
    return NextResponse.json(
      { error: 'Internal server error', item: null },
      { status: 500 }
    )
  }
}

// Check for duplicate barcode (used when creating items)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // Use existing supabase client
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', item: null }, 
        { status: 401 }
      )
    }

    const { code } = await params
    const body = await request.json()
    const { excludeItemId } = body // Optional: exclude specific item when editing
    
    if (!code) {
      return NextResponse.json(
        { error: 'Barcode is required', item: null },
        { status: 400 }
      )
    }

    // Clean and validate barcode
    const cleanedCode = cleanBarcode(code)
    
    if (!isValidBarcode(cleanedCode)) {
      return NextResponse.json(
        { error: 'Invalid barcode format', item: null },
        { status: 400 }
      )
    }

    // Check for duplicate barcode
    let query = supabase
      .from('inventory_items')
      .select('item_id, item_name, barcode')
      .eq('barcode', cleanedCode)

    // Exclude specific item if provided (useful when editing)
    if (excludeItemId) {
      query = query.neq('item_id', excludeItemId)
    }

    const { data: existingItem, error: checkError } = await query.maybeSingle()

    if (checkError) {
      console.error('Error checking duplicate barcode:', checkError)
      return NextResponse.json(
        { error: 'Database error', item: null },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      item: existingItem,
      isDuplicate: !!existingItem,
      barcode: cleanedCode,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Duplicate check error:', error)
    return NextResponse.json(
      { error: 'Internal server error', item: null },
      { status: 500 }
    )
  }
}