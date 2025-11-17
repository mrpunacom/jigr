/**
 * Location count session utility functions
 */

export interface LocationCountSession {
  id: string
  location_id: string
  user_id: string
  client_id: string
  session_name: string
  status: 'active' | 'paused' | 'completed'
  start_time: string
  end_time?: string
  last_activity: string
  total_items?: number
  counted_items?: number
  metadata?: Record<string, any>
}

export interface SessionItem {
  id: string
  session_id: string
  item_id: string
  barcode?: string
  item_name: string
  expected_quantity?: number
  actual_quantity?: number
  counted_at?: string
  notes?: string
}

/**
 * Generate a session name based on location and timestamp
 */
export function generateSessionName(locationName: string): string {
  const timestamp = new Date().toLocaleString('en-NZ', {
    timeZone: 'Pacific/Auckland',
    day: '2-digit',
    month: '2-digit', 
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(/[/,]/g, '').replace(' ', '-')
  
  return `${locationName} Count ${timestamp}`
}

/**
 * Calculate session completion percentage
 */
export function calculateCompletionPercentage(session: LocationCountSession): number {
  if (!session.total_items || session.total_items === 0) {
    return 0
  }
  
  return Math.round(((session.counted_items || 0) / session.total_items) * 100)
}

/**
 * Format session duration
 */
export function formatSessionDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : new Date()
  
  const diffMs = end.getTime() - start.getTime()
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  
  return `${minutes}m`
}

/**
 * Validate session data
 */
export function validateSessionData(data: Partial<LocationCountSession>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!data.location_id) {
    errors.push('Location ID is required')
  }
  
  if (!data.user_id) {
    errors.push('User ID is required')
  }
  
  if (!data.client_id) {
    errors.push('Client ID is required')
  }
  
  if (!data.session_name || data.session_name.trim().length === 0) {
    errors.push('Session name is required')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}