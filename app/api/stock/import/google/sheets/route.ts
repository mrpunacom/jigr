import { NextResponse } from 'next/server';
import { getAuthenticatedClientId, errorResponse } from '@/lib/api-utils';
import { getGoogleAccessToken } from '@/lib/google-auth';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';

interface GoogleSpreadsheet {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
}

export async function GET(request: Request) {
  try {
    const { user_id, supabase } = await getAuthenticatedClientId();
    
    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getGoogleAccessToken(user_id, supabase);
    
    // List spreadsheets from Google Drive
    const response = await fetch(
      `${DRIVE_API_URL}/files?` +
      new URLSearchParams({
        q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
        fields: 'files(id,name,modifiedTime,webViewLink)',
        orderBy: 'modifiedTime desc',
        pageSize: '50'
      }),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Drive API error:', errorText);
      throw new Error('Failed to fetch spreadsheets from Google Drive');
    }
    
    const data = await response.json();
    const spreadsheets: GoogleSpreadsheet[] = data.files || [];
    
    return NextResponse.json({
      spreadsheets,
      total: spreadsheets.length
    });
    
  } catch (error: any) {
    console.error('Error fetching Google Sheets:', error);
    
    // Provide helpful error messages
    if (error.message.includes('not connected')) {
      return errorResponse('Google account not connected', 401);
    }
    
    return errorResponse(error.message, 500);
  }
}