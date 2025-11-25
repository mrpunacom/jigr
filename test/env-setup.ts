// Test Environment Setup
// Mock environment variables for testing

process.env.NODE_ENV = 'test'

// Supabase test configuration
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Google Cloud test configuration  
process.env.GOOGLE_CLOUD_CREDENTIALS = JSON.stringify({
  type: 'service_account',
  project_id: 'test-project',
  private_key_id: 'test-key-id',
  private_key: 'test-private-key',
  client_email: 'test@test-project.iam.gserviceaccount.com',
  client_id: 'test-client-id',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
})

process.env.DOCUMENT_AI_PROCESSOR_ID = 'projects/test-project/locations/us/processors/test-processor'
process.env.GOOGLE_CLOUD_PROJECT_ID = 'test-project'

// Test-specific configuration
process.env.TEST_TIMEOUT = '30000'
process.env.ENABLE_TEST_LOGGING = 'false'

// Mock external service URLs
process.env.MOCK_AI_PROCESSING = 'true'
process.env.MOCK_DATABASE = 'true'

export {}