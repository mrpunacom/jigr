import { NextRequest, NextResponse } from 'next/server'

interface OfflineSyncRequest {
  barcode: string
  timestamp: number
  workflowType: 'inventory_count' | 'stock_update' | 'receiving' | 'lookup'
  metadata?: {
    quantity?: number
    location?: string
    notes?: string
    coordinates?: { latitude: number; longitude: number }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: OfflineSyncRequest = await request.json()
    
    // Validate required fields
    if (!body.barcode || !body.timestamp || !body.workflowType) {
      return NextResponse.json(
        { error: 'Missing required fields: barcode, timestamp, workflowType' },
        { status: 400 }
      )
    }

    // Here you would typically:
    // 1. Store the offline scan in your database
    // 2. Optionally trigger any workflow-specific logic
    // 3. Log the sync event for audit purposes

    console.log(`📱 Offline sync received:`, {
      barcode: body.barcode,
      workflowType: body.workflowType,
      timestamp: new Date(body.timestamp).toISOString(),
      location: body.metadata?.coordinates ? 
        `${body.metadata.coordinates.latitude.toFixed(4)}, ${body.metadata.coordinates.longitude.toFixed(4)}` : 
        'Unknown'
    })

    // Simulate database storage
    const syncResult = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      barcode: body.barcode,
      timestamp: body.timestamp,
      workflowType: body.workflowType,
      metadata: body.metadata,
      syncedAt: new Date().toISOString(),
      status: 'synced'
    }

    // Optional: Attempt to lookup the product for additional context
    let productInfo = null
    try {
      // This would be a call to your existing barcode lookup API
      const lookupResponse = await fetch(
        `${request.nextUrl.origin}/api/barcode/lookup?barcode=${body.barcode}&check_inventory=true`,
        { headers: { 'User-Agent': 'offline-sync' } }
      )
      
      if (lookupResponse.ok) {
        const lookupData = await lookupResponse.json()
        productInfo = lookupData.product
      }
    } catch (error) {
      console.warn('Product lookup failed during offline sync:', error)
    }

    return NextResponse.json({
      success: true,
      syncResult,
      productInfo,
      message: 'Offline scan synced successfully'
    })

  } catch (error) {
    console.error('Offline sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync offline scan' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}