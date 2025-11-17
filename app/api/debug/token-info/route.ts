import { NextRequest, NextResponse } from 'next/server'

// GET /api/debug/token-info - Decode JWT token to see what's inside
export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization) {
      return NextResponse.json(
        { error: 'No authorization header provided' },
        { status: 400 }
      )
    }

    const token = authorization.replace('Bearer ', '')
    
    try {
      // Parse JWT token (header.payload.signature)
      const [header, payload, signature] = token.split('.')
      
      const decodedHeader = JSON.parse(atob(header))
      const decodedPayload = JSON.parse(atob(payload))
      
      console.log('🔍 JWT Token Analysis:')
      console.log('- Header:', decodedHeader)
      console.log('- Payload keys:', Object.keys(decodedPayload))
      console.log('- Full payload:', decodedPayload)
      
      // Look for client_id in various places
      const possibleClientIds = {
        'payload.sub': decodedPayload.sub,
        'payload.client_id': decodedPayload.client_id,
        'payload.app_metadata.client_id': decodedPayload.app_metadata?.client_id,
        'payload.user_metadata.client_id': decodedPayload.user_metadata?.client_id,
        'payload.aud': decodedPayload.aud,
        'payload.org_id': decodedPayload.org_id,
        'payload.company_id': decodedPayload.company_id,
        'payload.tenant_id': decodedPayload.tenant_id
      }
      
      return NextResponse.json({
        success: true,
        token_header: decodedHeader,
        token_payload: decodedPayload,
        possible_client_ids: possibleClientIds,
        current_logic_uses: decodedPayload.sub,
        should_probably_use: decodedPayload.app_metadata?.client_id || decodedPayload.user_metadata?.client_id || decodedPayload.sub
      })
      
    } catch (e) {
      return NextResponse.json(
        { error: 'Failed to decode JWT token', details: e instanceof Error ? e.message : 'Unknown error' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Token info error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}