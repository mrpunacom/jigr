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