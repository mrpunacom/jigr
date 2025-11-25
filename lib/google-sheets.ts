/**
 * Google Sheets API Integration
 * 
 * Handles OAuth2 authentication and Google Sheets/Drive API interactions
 * for importing data from user spreadsheets.
 */

import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

// Google API Configuration
const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
  ]
}

// OAuth2 Client Setup
export function createOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    GOOGLE_CONFIG.clientId,
    GOOGLE_CONFIG.clientSecret,
    GOOGLE_CONFIG.redirectUri
  )
}

// Generate OAuth2 Authorization URL
export function getAuthUrl(userId: string): string {
  const oauth2Client = createOAuthClient()
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_CONFIG.scopes,
    state: userId, // Pass user ID in state for callback processing
    prompt: 'consent' // Force consent to get refresh token
  })
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string): Promise<{
  access_token: string
  refresh_token?: string
  expiry_date?: number
}> {
  const oauth2Client = createOAuthClient()
  
  const { tokens } = await oauth2Client.getAccessToken({
    code,
    client_id: GOOGLE_CONFIG.clientId,
    client_secret: GOOGLE_CONFIG.clientSecret,
    redirect_uri: GOOGLE_CONFIG.redirectUri,
    grant_type: 'authorization_code'
  })
  
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date
  }
}

// Create authenticated Google Sheets client
export async function createSheetsClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = createOAuthClient()
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  })
  
  // Auto-refresh token if needed
  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      // Update stored tokens in database
      console.log('🔄 Google tokens refreshed automatically')
    }
  })
  
  return google.sheets({ version: 'v4', auth: oauth2Client })
}

// Create authenticated Google Drive client
export async function createDriveClient(accessToken: string, refreshToken?: string) {
  const oauth2Client = createOAuthClient()
  
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  })
  
  return google.drive({ version: 'v3', auth: oauth2Client })
}

// List user's spreadsheets from Google Drive
export async function listSpreadsheets(accessToken: string, refreshToken?: string) {
  try {
    const drive = await createDriveClient(accessToken, refreshToken)
    
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet'",
      fields: 'files(id, name, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: 50
    })
    
    return response.data.files || []
  } catch (error) {
    console.error('Error listing spreadsheets:', error)
    throw new Error('Failed to fetch spreadsheets from Google Drive')
  }
}

// Get spreadsheet metadata and sheets list
export async function getSpreadsheetInfo(
  spreadsheetId: string, 
  accessToken: string, 
  refreshToken?: string
) {
  try {
    const sheets = await createSheetsClient(accessToken, refreshToken)
    
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties,sheets(properties)'
    })
    
    const spreadsheet = response.data
    
    return {
      id: spreadsheetId,
      title: spreadsheet.properties?.title || 'Untitled Spreadsheet',
      sheets: spreadsheet.sheets?.map(sheet => ({
        id: sheet.properties?.sheetId,
        title: sheet.properties?.title || 'Sheet1',
        index: sheet.properties?.index,
        rowCount: sheet.properties?.gridProperties?.rowCount,
        columnCount: sheet.properties?.gridProperties?.columnCount
      })) || []
    }
  } catch (error) {
    console.error('Error getting spreadsheet info:', error)
    throw new Error('Failed to fetch spreadsheet information')
  }
}

// Read data from a specific sheet range
export async function readSheetData(
  spreadsheetId: string,
  sheetName: string,
  range?: string,
  accessToken?: string,
  refreshToken?: string
): Promise<string[][]> {
  try {
    const sheets = await createSheetsClient(accessToken!, refreshToken)
    
    // Use sheet name with optional range, default to full sheet
    const fullRange = range ? `${sheetName}!${range}` : sheetName
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: fullRange,
      valueRenderOption: 'UNFORMATTED_VALUE',
      dateTimeRenderOption: 'FORMATTED_STRING'
    })
    
    return response.data.values || []
  } catch (error) {
    console.error('Error reading sheet data:', error)
    throw new Error('Failed to read data from Google Sheets')
  }
}

// Detect data range in a sheet (find actual data boundaries)
export async function detectDataRange(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string,
  refreshToken?: string
): Promise<{
  range: string
  rowCount: number
  columnCount: number
  hasHeaders: boolean
}> {
  try {
    // Read first 100 rows to analyze data structure
    const data = await readSheetData(
      spreadsheetId, 
      sheetName, 
      'A1:ZZ100', 
      accessToken, 
      refreshToken
    )
    
    if (data.length === 0) {
      return {
        range: 'A1:A1',
        rowCount: 0,
        columnCount: 0,
        hasHeaders: false
      }
    }
    
    // Find actual data boundaries
    let maxRow = 0
    let maxCol = 0
    
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex]
      if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
        maxRow = rowIndex + 1
        maxCol = Math.max(maxCol, row.length)
      }
    }
    
    // Detect if first row contains headers (all text, different from data rows)
    const hasHeaders = data.length > 1 && 
      data[0].every(cell => typeof cell === 'string' && isNaN(Number(cell))) &&
      data[1].some(cell => typeof cell === 'number' || !isNaN(Number(cell)))
    
    const endColumn = String.fromCharCode(65 + maxCol - 1) // Convert to letter (A, B, C, etc.)
    
    return {
      range: `A1:${endColumn}${maxRow}`,
      rowCount: maxRow,
      columnCount: maxCol,
      hasHeaders
    }
  } catch (error) {
    console.error('Error detecting data range:', error)
    return {
      range: 'A1:A1',
      rowCount: 0,
      columnCount: 0,
      hasHeaders: false
    }
  }
}

// Validate Google Sheets access token
export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    const oauth2Client = createOAuthClient()
    oauth2Client.setCredentials({ access_token: accessToken })
    
    // Try to make a simple API call
    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    await drive.about.get({ fields: 'user' })
    
    return true
  } catch (error) {
    console.error('Token validation failed:', error)
    return false
  }
}

// Refresh expired access token
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expiry_date?: number
}> {
  try {
    const oauth2Client = createOAuthClient()
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    
    const { credentials } = await oauth2Client.refreshAccessToken()
    
    return {
      access_token: credentials.access_token!,
      expiry_date: credentials.expiry_date
    }
  } catch (error) {
    console.error('Token refresh failed:', error)
    throw new Error('Failed to refresh Google OAuth token')
  }
}

// Database operations for OAuth tokens
export async function saveOAuthTokens(
  userId: string,
  accessToken: string,
  refreshToken?: string,
  expiryDate?: number
) {
  const { createClient } = await import('@/lib/supabase')
  const supabase = createClient()
  
  const { error } = await supabase
    .from('google_oauth_tokens')
    .upsert({
      user_id: userId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiryDate ? new Date(expiryDate).toISOString() : null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
  
  if (error) {
    console.error('Error saving OAuth tokens:', error)
    throw new Error('Failed to save OAuth tokens')
  }
}

export async function getOAuthTokens(userId: string): Promise<{
  access_token: string
  refresh_token?: string
  expires_at?: string
} | null> {
  const { createClient } = await import('@/lib/supabase')
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('google_oauth_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}

// Helper to get valid tokens (refresh if needed)
export async function getValidTokens(userId: string): Promise<{
  access_token: string
  refresh_token?: string
} | null> {
  const tokens = await getOAuthTokens(userId)
  if (!tokens) return null
  
  // Check if token is expired
  if (tokens.expires_at) {
    const expiryTime = new Date(tokens.expires_at).getTime()
    const now = Date.now()
    
    // If token expires in less than 5 minutes, refresh it
    if (expiryTime - now < 5 * 60 * 1000) {
      if (tokens.refresh_token) {
        try {
          const refreshed = await refreshAccessToken(tokens.refresh_token)
          await saveOAuthTokens(
            userId, 
            refreshed.access_token, 
            tokens.refresh_token, 
            refreshed.expiry_date
          )
          
          return {
            access_token: refreshed.access_token,
            refresh_token: tokens.refresh_token
          }
        } catch (error) {
          console.error('Failed to refresh token:', error)
          return null
        }
      } else {
        return null // No refresh token available
      }
    }
  }
  
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token
  }
}

// Type definitions
export interface GoogleSpreadsheet {
  id: string
  name: string
  modifiedTime: string
  webViewLink: string
}

export interface GoogleSheet {
  id: number
  title: string
  index: number
  rowCount?: number
  columnCount?: number
}

export interface SpreadsheetInfo {
  id: string
  title: string
  sheets: GoogleSheet[]
}

export interface DataRange {
  range: string
  rowCount: number
  columnCount: number
  hasHeaders: boolean
}