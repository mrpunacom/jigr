/**
 * Menu Import from Google Sheets API
 * 
 * Handles parsing Google Sheets data into structured menu items
 * with AI-powered data extraction and validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedClientId } from '@/lib/api-utils'
import { getValidTokens, readSheetData, detectDataRange } from '@/lib/google-sheets'
import { parseMenuData } from '@/lib/ai/menu-parser'

export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const body = await request.json()

    // Validate required parameters
    if (!body.spreadsheetId || !body.sheetName) {
      return NextResponse.json(
        { error: 'spreadsheetId and sheetName are required' },
        { status: 400 }
      )
    }

    // Get valid OAuth tokens for user
    const tokens = await getValidTokens(user_id)
    if (!tokens) {
      return NextResponse.json(
        { error: 'Google authentication required. Please reconnect your Google account.' },
        { status: 401 }
      )
    }

    console.log(`🔍 Parsing menu data from sheet: ${body.sheetName} for user ${user_id}`)

    // Detect data range or use provided range
    let dataRange = body.range
    if (!dataRange) {
      const rangeInfo = await detectDataRange(
        body.spreadsheetId,
        body.sheetName,
        tokens.access_token,
        tokens.refresh_token
      )
      dataRange = rangeInfo.range
    }

    // Read sheet data
    const sheetData = await readSheetData(
      body.spreadsheetId,
      body.sheetName,
      dataRange,
      tokens.access_token,
      tokens.refresh_token
    )

    if (!sheetData || sheetData.length === 0) {
      return NextResponse.json(
        { error: 'No data found in the selected sheet range' },
        { status: 400 }
      )
    }

    // Parse menu data using AI
    const parseResult = await parseMenuData({
      rows: sheetData,
      source: {
        spreadsheetId: body.spreadsheetId,
        sheetName: body.sheetName
      }
    })

    // Log parsing results
    console.log(`✅ Parsed ${parseResult.items.length} menu items with ${parseResult.parse_confidence * 100}% confidence`)

    if (parseResult.errors.length > 0) {
      console.log(`⚠️ Parsing errors: ${parseResult.errors.join(', ')}`)
    }

    return NextResponse.json({
      success: true,
      data: parseResult,
      source: {
        spreadsheetId: body.spreadsheetId,
        sheetName: body.sheetName,
        range: dataRange,
        rowCount: sheetData.length
      }
    })

  } catch (error) {
    console.error('Menu sheets parsing error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        return NextResponse.json(
          { error: 'Permission denied. Please ensure you have access to this spreadsheet.' },
          { status: 403 }
        )
      }
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Spreadsheet or sheet not found. Please check the selection.' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to parse menu data from Google Sheets' },
      { status: 500 }
    )
  }
}

// GET endpoint to list user's spreadsheets
export async function GET(request: NextRequest) {
  try {
    const { user_id } = await getAuthenticatedClientId()
    const { listSpreadsheets, getValidTokens } = await import('@/lib/google-sheets')

    // Get valid OAuth tokens for user
    const tokens = await getValidTokens(user_id)
    if (!tokens) {
      return NextResponse.json(
        { error: 'Google authentication required' },
        { status: 401 }
      )
    }

    // List user's spreadsheets
    const spreadsheets = await listSpreadsheets(tokens.access_token, tokens.refresh_token)

    return NextResponse.json({
      success: true,
      spreadsheets: spreadsheets.map(sheet => ({
        id: sheet.id,
        name: sheet.name,
        modifiedTime: sheet.modifiedTime,
        webViewLink: sheet.webViewLink
      }))
    })

  } catch (error) {
    console.error('Menu spreadsheets list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spreadsheets' },
      { status: 500 }
    )
  }
}