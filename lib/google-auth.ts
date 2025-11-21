// ============================================================================
// GOOGLE OAUTH HELPER FUNCTIONS
// Handles token refresh and management
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface GoogleTokenData {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
}

/**
 * Get valid Google access token for user
 * Automatically refreshes if expired
 */
export async function getGoogleAccessToken(
  userId: string,
  supabase: SupabaseClient
): Promise<string> {
  // Get stored tokens
  const { data: tokenData, error } = await supabase
    .from('google_oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error || !tokenData) {
    throw new Error('Google account not connected. Please connect in Settings.');
  }
  
  // Check if token is still valid (with 5 minute buffer)
  const expiresAt = new Date(tokenData.expires_at);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes
  
  if (expiresAt.getTime() - now.getTime() > bufferMs) {
    // Token still valid
    return tokenData.access_token;
  }
  
  // Token expired or about to expire - refresh it
  console.log('Refreshing Google access token for user:', userId);
  
  const refreshResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokenData.refresh_token,
      grant_type: 'refresh_token'
    })
  });
  
  if (!refreshResponse.ok) {
    const errorText = await refreshResponse.text();
    console.error('Token refresh failed:', errorText);
    throw new Error('Failed to refresh Google access token. Please reconnect your account.');
  }
  
  const newTokens = await refreshResponse.json();
  
  // Update stored tokens
  const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
  
  await supabase
    .from('google_oauth_tokens')
    .update({
      access_token: newTokens.access_token,
      expires_at: newExpiresAt.toISOString(),
      last_used_at: new Date().toISOString()
    })
    .eq('user_id', userId);
  
  return newTokens.access_token;
}

/**
 * Check if user has connected Google account
 */
export async function isGoogleAccountConnected(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data } = await supabase
    .from('google_oauth_tokens')
    .select('user_id')
    .eq('user_id', userId)
    .single();
  
  return !!data;
}

/**
 * Disconnect Google account
 */
export async function disconnectGoogleAccount(
  userId: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from('google_oauth_tokens')
    .delete()
    .eq('user_id', userId);
}

/**
 * Get Google account connection info
 */
export async function getGoogleAccountInfo(
  userId: string,
  supabase: SupabaseClient
): Promise<{
  connected: boolean;
  connectedAt?: string;
  syncEnabled?: boolean;
  linkedSpreadsheet?: {
    id: string;
    name: string;
    sheetName: string;
  };
} | null> {
  const { data } = await supabase
    .from('google_oauth_tokens')
    .select('connected_at, sync_enabled, linked_spreadsheet_id, linked_spreadsheet_name, linked_sheet_name')
    .eq('user_id', userId)
    .single();
  
  if (!data) {
    return { connected: false };
  }
  
  return {
    connected: true,
    connectedAt: data.connected_at,
    syncEnabled: data.sync_enabled,
    linkedSpreadsheet: data.linked_spreadsheet_id ? {
      id: data.linked_spreadsheet_id,
      name: data.linked_spreadsheet_name,
      sheetName: data.linked_sheet_name
    } : undefined
  };
}