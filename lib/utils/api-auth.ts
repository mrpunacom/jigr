import { NextRequest } from 'next/server'

export interface ApiErrors {
  UNAUTHORIZED: string
  FORBIDDEN: string
  BAD_REQUEST: string
  NOT_FOUND: string
  INTERNAL_SERVER_ERROR: string
  VALIDATION_ERROR: string
}

export const ApiErrors: ApiErrors = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  BAD_REQUEST: 'Bad request',
  NOT_FOUND: 'Resource not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error'
}

/**
 * Extract client ID from authenticated user or request headers
 */
export async function extractClientId(request: NextRequest, user?: any): Promise<string | null> {
  try {
    // If user is provided, try to get client_id from user metadata or id
    if (user) {
      return user.client_id || user.id || null
    }

    // Try to extract from authorization header
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // In a real implementation, you would decode the JWT token here
      // For now, return null to indicate no client_id found
      return null
    }

    return null
  } catch (error) {
    console.error('Error extracting client ID:', error)
    return null
  }
}

/**
 * Extract both client ID and user ID from authenticated user or request headers
 */
export async function extractUserAndClientId(request: NextRequest, user?: any): Promise<{
  clientId: string | null
  userId: string | null
}> {
  try {
    // If user is provided, try to get both IDs
    if (user) {
      const clientId = user.client_id || user.id || null
      const userId = user.id || null
      return { clientId, userId }
    }

    // Try to extract from authorization header
    const authHeader = request.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // In a real implementation, you would decode the JWT token here
      // For now, return null values
      return { clientId: null, userId: null }
    }

    return { clientId: null, userId: null }
  } catch (error) {
    console.error('Error extracting user and client ID:', error)
    return { clientId: null, userId: null }
  }
}

/**
 * Validate that user has access to a specific client_id
 */
export function validateClientAccess(userClientId: string | null, requestedClientId: string | null): boolean {
  if (!userClientId || !requestedClientId) {
    return false
  }
  
  return userClientId === requestedClientId
}