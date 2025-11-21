import { NextResponse } from 'next/server';
import { getAuthenticatedClientId } from '@/lib/api-utils';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly'
];

export async function GET(request: Request) {
  try {
    const { user_id } = await getAuthenticatedClientId();
    
    // Build OAuth authorization URL
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
      response_type: 'code',
      scope: SCOPES.join(' '),
      access_type: 'offline', // Request refresh token
      prompt: 'consent', // Force consent screen to ensure refresh token
      state: user_id // Pass user_id to callback
    });
    
    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    
    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
    
  } catch (error: any) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/stock/import?error=oauth_failed`
    );
  }
}