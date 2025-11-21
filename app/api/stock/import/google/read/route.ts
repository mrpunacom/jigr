import { NextResponse } from 'next/server';
import { getAuthenticatedClientId, errorResponse, validateRequired } from '@/lib/api-utils';
import { getGoogleAccessToken } from '@/lib/google-auth';

const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

interface ReadSheetRequest {
  spreadsheet_id: string;
  sheet_name?: string;
  range?: string;
}

interface SheetInfo {
  id: number;
  name: string;
  index: number;
  rowCount: number;
  columnCount: number;
}

export async function POST(request: Request) {
  try {
    const { user_id, client_id, supabase } = await getAuthenticatedClientId();
    const body: ReadSheetRequest = await request.json();
    
    // Validate required fields
    const validationError = validateRequired(body, ['spreadsheet_id']);
    if (validationError) {
      return errorResponse(validationError, 400);
    }
    
    const { spreadsheet_id, sheet_name, range } = body;
    
    // Get valid access token
    const accessToken = await getGoogleAccessToken(user_id, supabase);
    
    // Get spreadsheet metadata (to list sheet tabs and get name)
    const metadataResponse = await fetch(
      `${SHEETS_API_URL}/${spreadsheet_id}?fields=properties.title,sheets.properties`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      console.error('Google Sheets metadata error:', errorText);
      throw new Error('Failed to fetch spreadsheet metadata');
    }
    
    const metadata = await metadataResponse.json();
    const spreadsheetName = metadata.properties?.title || 'Untitled';
    
    const sheets: SheetInfo[] = metadata.sheets.map((s: any) => ({
      id: s.properties.sheetId,
      name: s.properties.title,
      index: s.properties.index,
      rowCount: s.properties.gridProperties?.rowCount || 0,
      columnCount: s.properties.gridProperties?.columnCount || 0
    }));
    
    // If no sheet specified, return list of sheets only
    if (!sheet_name) {
      return NextResponse.json({
        spreadsheet_name: spreadsheetName,
        sheets
      });
    }
    
    // Read data from specified sheet
    const dataRange = range || `${sheet_name}!A1:ZZ1000`;
    
    const dataResponse = await fetch(
      `${SHEETS_API_URL}/${spreadsheet_id}/values/${encodeURIComponent(dataRange)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!dataResponse.ok) {
      const errorText = await dataResponse.text();
      console.error('Google Sheets data error:', errorText);
      throw new Error('Failed to fetch sheet data');
    }
    
    const data = await dataResponse.json();
    const values = data.values || [];
    
    if (values.length === 0) {
      return errorResponse('Selected sheet is empty', 400);
    }
    
    // Format as parsed spreadsheet (compatible with existing import flow)
    const parsed = {
      headers: values[0] as string[],
      rows: values.slice(1),
      rowCount: values.length - 1,
      detectedFormat: 'google_sheets' as const,
      spreadsheet_id,
      spreadsheet_name: spreadsheetName,
      sheet_name
    };
    
    return NextResponse.json({
      spreadsheet_name: spreadsheetName,
      sheets,
      parsed
    });
    
  } catch (error: any) {
    console.error('Error reading Google Sheet:', error);
    
    if (error.message.includes('not connected')) {
      return errorResponse('Google account not connected', 401);
    }
    
    return errorResponse(error.message, 500);
  }
}