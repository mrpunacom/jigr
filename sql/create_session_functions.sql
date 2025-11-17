-- Create location count sessions table
CREATE TABLE IF NOT EXISTS location_count_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  location_id UUID NOT NULL,
  user_id UUID NOT NULL,
  session_status VARCHAR(20) CHECK (session_status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paused_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_items_count INTEGER NOT NULL DEFAULT 0,
  counted_items_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add session_id column to inventory_count table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_count' AND column_name = 'session_id') THEN
    ALTER TABLE inventory_count ADD COLUMN session_id UUID REFERENCES location_count_sessions(id);
  END IF;
END $$;

-- Function to increment counted items in a session
CREATE OR REPLACE FUNCTION increment_session_count(session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE location_count_sessions 
  SET counted_items_count = counted_items_count + 1,
      updated_at = NOW()
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get session progress
CREATE OR REPLACE FUNCTION get_session_progress(session_id UUID)
RETURNS TABLE (
  id UUID,
  total_items INTEGER,
  counted_items INTEGER,
  progress_percentage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lcs.id,
    lcs.total_items_count,
    lcs.counted_items_count,
    CASE 
      WHEN lcs.total_items_count > 0 THEN 
        ROUND((lcs.counted_items_count::FLOAT / lcs.total_items_count::FLOAT) * 100)::INTEGER
      ELSE 0
    END as progress_percentage
  FROM location_count_sessions lcs
  WHERE lcs.id = get_session_progress.session_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_location_count_sessions_client_location 
ON location_count_sessions(client_id, location_id, session_status);

CREATE INDEX IF NOT EXISTS idx_location_count_sessions_user 
ON location_count_sessions(user_id, session_status);

CREATE INDEX IF NOT EXISTS idx_inventory_count_session 
ON inventory_count(session_id);

-- Enable RLS on the new table
ALTER TABLE location_count_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sessions" ON location_count_sessions
  FOR SELECT USING (client_id::text = auth.jwt() ->> 'client_id' OR user_id = auth.uid());

CREATE POLICY "Users can create sessions" ON location_count_sessions
  FOR INSERT WITH CHECK (client_id::text = auth.jwt() ->> 'client_id' OR user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" ON location_count_sessions
  FOR UPDATE USING (client_id::text = auth.jwt() ->> 'client_id' OR user_id = auth.uid());

-- Grant permissions
GRANT ALL ON location_count_sessions TO authenticated;
GRANT ALL ON location_count_sessions TO service_role;