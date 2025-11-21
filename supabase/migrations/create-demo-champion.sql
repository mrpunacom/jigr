-- Create demo champion data for testing
-- This will set up the demo user as a champion

-- First, ensure we have a demo user in the clients table
INSERT INTO clients (id, name, business_type, business_email, phone, address, owner_name, subscription_status, subscription_tier, onboarding_status)
VALUES (
  'demo-client-id',
  'Demo Restaurant',
  'restaurant',
  'demo@example.com',
  '+64 21 123 4567',
  '123 Queen Street, Auckland, New Zealand',
  'Demo Owner',
  'active',
  'professional',
  'completed'
) 
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  business_type = EXCLUDED.business_type,
  business_email = EXCLUDED.business_email,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  owner_name = EXCLUDED.owner_name,
  subscription_status = EXCLUDED.subscription_status,
  subscription_tier = EXCLUDED.subscription_tier,
  onboarding_status = EXCLUDED.onboarding_status;

-- Now create/update the client_users record with champion enrollment
INSERT INTO client_users (user_id, client_id, role, status, champion_enrolled, created_at, updated_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
  'demo-client-id',
  'OWNER',
  'active',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (user_id, client_id) DO UPDATE SET
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  champion_enrolled = EXCLUDED.champion_enrolled,
  updated_at = NOW();