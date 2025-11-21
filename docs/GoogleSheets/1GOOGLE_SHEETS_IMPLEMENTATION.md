# Google Sheets Integration - Complete Implementation Guide

**For:** Claude Code  
**Date:** November 19, 2025  
**Status:** Ready to implement  
**Estimated Time:** 4-6 hours

---

## 📋 Implementation Checklist
```
Phase 1: Setup (30 mins)
- [ ] Google Cloud Project setup
- [ ] Database migration
- [ ] Environment variables

Phase 2: Backend APIs (2 hours)
- [ ] OAuth initiation endpoint
- [ ] OAuth callback handler
- [ ] Google auth helper functions
- [ ] List spreadsheets API
- [ ] Read sheet data API

Phase 3: UI Components (2 hours)
- [ ] Update import page with Google option
- [ ] Sheet selector page
- [ ] Integration with existing preview

Phase 4: Testing (1 hour)
- [ ] OAuth flow testing
- [ ] Sheet reading testing
- [ ] End-to-end import test

Phase 5: Optional - Live Sync (1 hour)
- [ ] Sync scheduler
- [ ] Sync settings UI
```

---

## 🔧 PHASE 1: SETUP

### Step 1.1: Google Cloud Console Setup

**Instructions for Steve (manual setup required):**
```
1. Go to: https://console.cloud.google.com

2. Create New Project:
   - Name: "JiGR-Production"
   - Click "Create"

3. Enable APIs:
   - Go to "APIs & Services" → "Library"
   - Search "Google Sheets API" → Enable
   - Search "Google Drive API" → Enable

4. Create OAuth Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Configure consent screen if prompted:
     - User type: External
     - App name: "JiGR Stock Management"
     - User support email: your@email.com
     - Developer contact: your@email.com
     - Scopes: Add "Google Sheets API" and "Google Drive API" read-only
   
   - Application type: Web application
   - Name: "JiGR Stock Import"
   
   - Authorized JavaScript origins:
     Production: https://app.jigr.app
     Development: http://localhost:3000
   
   - Authorized redirect URIs:
     Production: https://app.jigr.app/api/auth/google/callback
     Development: http://localhost:3000/api/auth/google/callback
   
   - Click "Create"
   - Copy the Client ID and Client Secret

5. Download JSON (optional):
   - Click the download button
   - Save as google-oauth-credentials.json (DON'T commit to git!)
```

### Step 1.2: Environment Variables

Add to `.env.local`:
```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Google API Scopes (space-separated)
GOOGLE_SCOPES=https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly

# App URL (for OAuth redirect)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Production: NEXT_PUBLIC_APP_URL=https://app.jigr.app
```

### Step 1.3: Database Migration

Create file: `supabase/migrations/031_google_oauth_tokens.sql`
```sql
-- ============================================================================
-- GOOGLE OAUTH TOKENS TABLE
-- Stores Google account connections and sync settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_oauth_tokens (
  -- Primary key
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- OAuth tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL,
  
  -- Connection metadata
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  
  -- Sync configuration
  sync_enabled BOOLEAN NOT NULL DEFAULT false,
  sync_frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'manual'
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  
  -- Linked spreadsheet info
  linked_spreadsheet_id TEXT,
  linked_spreadsheet_name TEXT,
  linked_sheet_name TEXT,
  linked_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only access their own tokens
CREATE POLICY "Users can view their own Google tokens"
  ON google_oauth_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google tokens"
  ON google_oauth_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google tokens"
  ON google_oauth_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google tokens"
  ON google_oauth_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_google_oauth_tokens_user_id ON google_oauth_tokens(user_id);
CREATE INDEX idx_google_oauth_tokens_sync_enabled ON google_oauth_tokens(sync_enabled) WHERE sync_enabled = true;
CREATE INDEX idx_google_oauth_tokens_next_sync ON google_oauth_tokens(next_sync_at) WHERE sync_enabled = true;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE TRIGGER update_google_oauth_tokens_updated_at
  BEFORE UPDATE ON google_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- IMPORT SESSIONS UPDATE
-- Add google_sheets source tracking
-- ============================================================================

-- Add columns to track Google Sheets imports
ALTER TABLE import_sessions
  ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'file_upload',
  ADD COLUMN IF NOT EXISTS google_spreadsheet_id TEXT,
  ADD COLUMN IF NOT EXISTS google_sheet_name TEXT;

-- Add to inventory_items to track source
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS google_spreadsheet_id TEXT,
  ADD COLUMN IF NOT EXISTS google_sheet_row_number INTEGER;

COMMENT ON COLUMN inventory_items.import_source IS 'How item was created: manual, file_upload, google_sheets';
COMMENT ON COLUMN inventory_items.google_spreadsheet_id IS 'Google Sheets ID if imported from Sheets';
COMMENT ON COLUMN inventory_items.google_sheet_row_number IS 'Row number in Google Sheet (for sync)';
```

**Run migration:**
```bash
# Local development
supabase migration up

# Production (after testing locally)
# Migrations run automatically on deployment
```

---

## 🔌 PHASE 2: BACKEND APIS

### Step 2.1: Google Auth Helper Functions

Create file: `lib/google-auth.ts`
```typescript
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
```

### Step 2.2: OAuth Initiation Endpoint

Create file: `app/api/auth/google/route.ts`
```typescript
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
```

### Step 2.3: OAuth Callback Handler

Create file: `app/api/auth/google/callback/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // user_id from initiation
    const error = searchParams.get('error');
    
    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/stock/import?error=access_denied`
      );
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/stock/import?error=invalid_callback`
      );
    }
    
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('Failed to exchange code for tokens');
    }
    
    const tokens = await tokenResponse.json();
    
    // Validate we got a refresh token
    if (!tokens.refresh_token) {
      console.error('No refresh token received - user may have already connected');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/stock/import?error=no_refresh_token`
      );
    }
    
    // Store tokens in database
    const supabase = createRouteHandlerClient({ cookies });
    
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    
    const { error: dbError } = await supabase
      .from('google_oauth_tokens')
      .upsert({
        user_id: state,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type || 'Bearer',
        expires_at: expiresAt.toISOString(),
        scope: tokens.scope,
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (dbError) {
      console.error('Database error storing tokens:', dbError);
      throw new Error('Failed to store OAuth tokens');
    }
    
    // Success! Redirect to sheet selector
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/stock/import/google/select-sheet?success=true`
    );
    
  } catch (error: any) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/stock/import?error=token_exchange_failed`
    );
  }
}
```

### Step 2.4: List Spreadsheets API

Create file: `app/api/stock/import/google/sheets/route.ts`
```typescript
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
```

### Step 2.5: Read Sheet Data API

Create file: `app/api/stock/import/google/read/route.ts`
```typescript
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
```

---

## 🎨 PHASE 3: UI COMPONENTS

### Step 3.1: Update Import Page

Update file: `app/stock/import/page.tsx`

Add Google Sheets button before file upload:
```typescript
'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import ImportPreview from '@/components/stock/import/ImportPreview';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/tab-separated-values'
      ];
      
      if (!validTypes.includes(selectedFile.type) && 
          !selectedFile.name.match(/\.(xlsx?|csv|tsv)$/i)) {
        setError('Please upload an Excel (.xlsx, .xls) or CSV file');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    
    setUploading(true);
    setAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/stock/import/analyze', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze file');
      }
      
      const result = await response.json();
      setAnalysisResult(result);
      
    } catch (err: any) {
      setError(err.message || 'Failed to analyze file');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleConfirmImport = async (mappings: any) => {
    // Existing import logic...
  };

  // NEW: Handle Google Sheets connection
  const handleConnectGoogleSheets = () => {
    // Redirect to Google OAuth
    window.location.href = '/api/auth/google';
  };

  // If we have analysis results, show preview
  if (analysisResult) {
    return (
      <ImportPreview
        parsed={analysisResult.parsed}
        analysis={analysisResult.analysis}
        onConfirm={handleConfirmImport}
        onCancel={() => {
          setAnalysisResult(null);
          setFile(null);
        }}
      />
    );
  }

  // Show upload interface
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-3xl font-bold mb-2">Import Your Inventory</h1>
          <p className="text-gray-600">
            Connect Google Sheets or upload a file
          </p>
        </div>

        {/* NEW: Google Sheets Option */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-8 h-8" viewBox="0 0 48 48">
                  <path fill="#43a047" d="M37,45H11c-1.657,0-3-1.343-3-3V6c0-1.657,1.343-3,3-3h19l10,10v29C40,43.657,38.657,45,37,45z"/>
                  <path fill="#c8e6c9" d="M40 13L30 13 30 3z"/>
                  <path fill="#2e7d32" d="M30 13L40 23 40 13z"/>
                  <path fill="#fff" d="M22 23H17V28H22V23zM31 23H26V28H31V23zM22 30H17V35H22V30zM31 30H26V35H31V30z"/>
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2 text-gray-900">
                ✨ Recommended: Connect Google Sheets
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                One-click import from your existing Google Sheets. No downloads needed!
              </p>
              <button
                onClick={handleConnectGoogleSheets}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
              >
                Connect Google Sheets →
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Or upload a file</span>
          </div>
        </div>

        {/* Existing File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 mb-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".xlsx,.xls,.csv,.tsv"
            onChange={handleFileSelect}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <span className="text-lg font-medium text-gray-700 mb-2">
              {file ? file.name : 'Click to upload or drag and drop'}
            </span>
            <span className="text-sm text-gray-500">
              Excel (.xlsx, .xls) or CSV files supported
            </span>
          </label>
        </div>

        {/* Rest of existing code... */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-red-900">Error</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            How It Works
          </h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Connect Google Sheets or upload Excel/CSV</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>AI analyzes your data and detects counting methods</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Review and confirm the detected settings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Import complete - start counting!</span>
            </li>
          </ol>
        </div>

        {/* Action Button for File Upload */}
        {file && (
          <button
            onClick={handleUploadAndAnalyze}
            disabled={uploading || analyzing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                Analyze & Import →
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
```

### Step 3.2: Sheet Selector Page

Create file: `app/stock/import/google/select-sheet/page.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, ExternalLink, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Spreadsheet {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
}

interface Sheet {
  id: number;
  name: string;
  rowCount: number;
  columnCount: number;
}

export default function SelectSheetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetName, setSpreadsheetName] = useState<string>('');
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load spreadsheets on mount
  useEffect(() => {
    loadSpreadsheets();
  }, []);

  // Show success message
  useEffect(() => {
    if (success === 'true') {
      // Could show a toast notification here
    }
  }, [success]);

  const loadSpreadsheets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stock/import/google/sheets');
      
      if (!response.ok) {
        throw new Error('Failed to load spreadsheets');
      }
      
      const data = await response.json();
      setSpreadsheets(data.spreadsheets || []);
      
    } catch (err: any) {
      console.error('Failed to load spreadsheets:', err);
      setError(err.message || 'Failed to load your Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSpreadsheet = async (spreadsheet: Spreadsheet) => {
    setSelectedSpreadsheetId(spreadsheet.id);
    setSelectedSheetName(null);
    setSheets([]);
    setLoadingSheets(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stock/import/google/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheet_id: spreadsheet.id })
      });
      
      if (!response.ok) {
        throw new Error('Failed to load sheets');
      }
      
      const data = await response.json();
      setSpreadsheetName(data.spreadsheet_name);
      setSheets(data.sheets || []);
      
    } catch (err: any) {
      console.error('Failed to load sheets:', err);
      setError(err.message || 'Failed to load sheet tabs');
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleSelectSheet = (sheetName: string) => {
    setSelectedSheetName(sheetName);
  };

  const handleAnalyze = async () => {
    if (!selectedSpreadsheetId || !selectedSheetName) return;
    
    setAnalyzing(true);
    setError(null);
    
    try {
      // Read sheet data
      const readResponse = await fetch('/api/stock/import/google/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheet_id: selectedSpreadsheetId,
          sheet_name: selectedSheetName
        })
      });
      
      if (!readResponse.ok) {
        throw new Error('Failed to read sheet data');
      }
      
      const readData = await readResponse.json();
      
      // Analyze with AI (reuse existing analyze endpoint)
      const analyzeResponse = await fetch('/api/stock/import/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsed: readData.parsed,
          source: 'google_sheets'
        })
      });
      
      if (!analyzeResponse.ok) {
        throw new Error('Failed to analyze sheet');
      }
      
      const analysis = await analyzeResponse.json();
      
      // Store in session storage for preview page
      sessionStorage.setItem('import_analysis', JSON.stringify({
        parsed: readData.parsed,
        analysis: analysis.analysis,
        source: 'google_sheets',
        spreadsheet_id: selectedSpreadsheetId,
        spreadsheet_name: spreadsheetName,
        sheet_name: selectedSheetName
      }));
      
      // Redirect to preview (reuse existing preview page)
      router.push('/stock/import/preview');
      
    } catch (err: any) {
      console.error('Failed to analyze sheet:', err);
      setError(err.message || 'Failed to analyze sheet');
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your Google Sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.push('/stock/import')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Select Google Sheet</h1>
            <p className="text-gray-600">
              Choose the spreadsheet and sheet tab containing your inventory
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spreadsheet List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Your Spreadsheets ({spreadsheets.length})
          </h3>
          
          {spreadsheets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No Google Sheets found</p>
              <p className="text-sm mt-2">Create a spreadsheet in Google Sheets first</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {spreadsheets.map((sheet) => (
                <button
                  key={sheet.id}
                  onClick={() => handleSelectSpreadsheet(sheet)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedSpreadsheetId === sheet.id
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-green-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{sheet.name}</div>
                      <div className="text-sm text-gray-500">
                        Modified {new Date(sheet.modifiedTime).toLocaleDateString()}
                      </div>
                    </div>
                    
                      href={sheet.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-700 p-1"
                      title="Open in Google Sheets"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sheet Tabs */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold mb-4">
            Sheet Tabs {sheets.length > 0 && `(${sheets.length})`}
          </h3>
          
          {loadingSheets ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading sheets...</p>
            </div>
          ) : sheets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>← Select a spreadsheet first</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {sheets.map((sheet) => (
                <button
                  key={sheet.id}
                  onClick={() => handleSelectSheet(sheet.name)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedSheetName === sheet.name
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="font-medium mb-1">{sheet.name}</div>
                  <div className="text-sm text-gray-500">
                    {sheet.rowCount.toLocaleString()} rows × {sheet.columnCount} columns
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedSpreadsheetId && selectedSheetName ? (
            <span className="text-green-600 font-medium">
              ✓ Ready to analyze: {spreadsheetName} → {selectedSheetName}
            </span>
          ) : (
            <span>Select a spreadsheet and sheet tab to continue</span>
          )}
        </div>
        
        <button
          onClick={handleAnalyze}
          disabled={!selectedSpreadsheetId || !selectedSheetName || analyzing}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 shadow-md"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            'Analyze & Import →'
          )}
        </button>
      </div>
    </div>
  );
}
```

---

## ✅ PHASE 4: TESTING

### Test Checklist
```markdown
## OAuth Flow Testing
- [ ] Click "Connect Google Sheets" button
- [ ] Google OAuth popup appears
- [ ] Grant permissions (Sheets + Drive read-only)
- [ ] Redirects back to JiGR successfully
- [ ] Token stored in database
- [ ] Can see list of spreadsheets

## Spreadsheet Listing
- [ ] Shows user's Google Sheets
- [ ] Sorted by modified date (newest first)
- [ ] Shows modification date
- [ ] "Open in Google Sheets" link works
- [ ] Handles empty list gracefully

## Sheet Selection
- [ ] Clicking spreadsheet loads sheet tabs
- [ ] Shows all tabs in spreadsheet
- [ ] Shows row/column counts
- [ ] Can select specific sheet tab
- [ ] Selected items highlighted

## Data Reading
- [ ] Can read sheet data
- [ ] Headers detected correctly
- [ ] Data rows loaded
- [ ] Empty sheets handled gracefully
- [ ] Large sheets (1000+ rows) work

## AI Analysis
- [ ] Analysis works same as file upload
- [ ] Workflow detection accurate
- [ ] Column mappings correct
- [ ] Quality issues flagged
- [ ] Preview page shows correctly

## Import Execution
- [ ] Can complete import from Google Sheet
- [ ] Items created with correct workflows
- [ ] Source tracked (google_sheets)
- [ ] Spreadsheet ID stored
- [ ] Sheet row numbers tracked

## Error Handling
- [ ] Token refresh works automatically
- [ ] Expired tokens handled
- [ ] Missing permissions handled
- [ ] Network errors shown clearly
- [ ] Empty spreadsheet errors handled
```

### Manual Testing Script
```bash
# 1. Test OAuth Connection
# Open: http://localhost:3000/stock/import
# Click: "Connect Google Sheets"
# Grant: Permissions in Google popup
# Verify: Redirects to sheet selector

# 2. Test Spreadsheet Listing
# Verify: Can see your Google Sheets
# Click: A spreadsheet
# Verify: Sheet tabs load

# 3. Test Sheet Reading
# Click: A sheet tab
# Click: "Analyze & Import"
# Verify: AI analysis runs
# Verify: Preview shows correctly

# 4. Test Import
# Review: Mappings and workflows
# Click: "Import N Items"
# Verify: Items imported successfully
# Check: Database has google_spreadsheet_id

# 5. Test Token Refresh
# Wait 59 minutes (or manually expire token in DB)
# Try: Listing spreadsheets again
# Verify: Token refreshes automatically
```

---

## 🚀 PHASE 5: DEPLOYMENT

### Environment Variables (Production)

Add to Vercel/Netlify:
```bash
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret
NEXT_PUBLIC_APP_URL=https://app.jigr.app
```

### Google Cloud Console (Production)

Update OAuth redirect URIs:
```
https://app.jigr.app/api/auth/google/callback
```

### Database Migration
```bash
# Production migration runs automatically on deployment
# Or manually run:
supabase db push
```

---

## 📊 Success Metrics

**Technical:**
- ✅ OAuth flow completes in < 10 seconds
- ✅ Spreadsheet list loads in < 2 seconds
- ✅ Sheet data reads in < 3 seconds
- ✅ Token refresh automatic and transparent
- ✅ Zero token storage vulnerabilities

**User Experience:**
- ✅ 90%+ users prefer Google Sheets over file upload
- ✅ Import time reduced from 5 mins to 2 mins
- ✅ 95%+ workflow detection accuracy
- ✅ < 5% user support requests

---

## 🎯 READY TO BUILD!

**Implementation Order:**
1. Database migration first
2. Backend APIs (auth → list → read)
3. UI components
4. Testing
5. Deploy!

**Estimated Timeline:** 4-6 hours

Let Claude Code start with Phase 1 (Setup) and work through systematically! 🚀