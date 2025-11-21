/**
 * JiGR Stock Module - API Utility Functions
 * 
 * Shared utilities for authentication, validation, calculations, and error handling
 * Used by all Stock API endpoints for consistent behavior
 */

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// ============================================================================
// SUPABASE CLIENT SETUP
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// AUTHENTICATION AND CLIENT ISOLATION
// ============================================================================

/**
 * Get authenticated client ID for current user
 * Handles JWT token validation and client lookup
 * 
 * @returns Object with client_id, user_id, and supabase client
 * @throws Error if unauthorized or client not found
 */
export async function getAuthenticatedClientId() {
  try {
    // Get authorization header
    const cookieStore = cookies()
    const authToken = cookieStore.get('supabase-auth-token')?.value

    if (!authToken) {
      throw new Error('No authentication token found')
    }

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)
    
    if (authError || !user) {
      throw new Error('Invalid authentication token')
    }

    // Get client ID for this user
    const { data: clientUser, error: clientError } = await supabase
      .from('client_users')
      .select('client_id')
      .eq('user_id', user.id)
      .single()
    
    if (clientError || !clientUser) {
      throw new Error('User not associated with any client')
    }

    return {
      client_id: clientUser.client_id,
      user_id: user.id,
      supabase
    }
  } catch (error) {
    throw new Error('Unauthorized')
  }
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Standard error response with consistent format
 * 
 * @param message Error message to return
 * @param status HTTP status code (default: 500)
 * @returns NextResponse with error format
 */
export function errorResponse(message: string, status: number = 500): NextResponse {
  return NextResponse.json(
    { 
      error: message,
      success: false,
      timestamp: new Date().toISOString()
    }, 
    { status }
  )
}

/**
 * Standard success response with consistent format
 * 
 * @param data Data to return
 * @param status HTTP status code (default: 200)
 * @returns NextResponse with success format
 */
export function successResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      ...data,
      success: true,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate that required fields are present in request body
 * 
 * @param body Request body object
 * @param fields Array of required field names
 * @returns Error message if validation fails, null if success
 */
export function validateRequired(body: any, fields: string[]): string | null {
  if (!body) {
    return 'Request body is required'
  }

  for (const field of fields) {
    if (body[field] === undefined || body[field] === null) {
      return `Missing required field: ${field}`
    }
  }
  
  return null
}

/**
 * Validate that a value is a positive number
 * 
 * @param value Value to validate
 * @param fieldName Field name for error message
 * @returns Error message if invalid, null if valid
 */
export function validatePositiveNumber(value: any, fieldName: string): string | null {
  if (typeof value !== 'number' || isNaN(value) || value < 0) {
    return `${fieldName} must be a positive number`
  }
  return null
}

/**
 * Validate that a counting workflow is valid
 * 
 * @param workflow Workflow string to validate
 * @returns Error message if invalid, null if valid
 */
export function validateCountingWorkflow(workflow: string): string | null {
  const validWorkflows = ['unit_count', 'container_weight', 'bottle_hybrid', 'keg_weight', 'batch_weight']
  
  if (!validWorkflows.includes(workflow)) {
    return `Invalid counting workflow. Must be one of: ${validWorkflows.join(', ')}`
  }
  
  return null
}

// ============================================================================
// WEIGHT CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate net weight from gross and tare weights
 * Ensures result is never negative
 * 
 * @param grossWeight Total weight (container + contents)
 * @param tareWeight Empty container weight
 * @returns Net weight (contents only), minimum 0
 */
export function calculateNetWeight(grossWeight: number, tareWeight: number): number {
  return Math.max(0, grossWeight - tareWeight)
}

/**
 * Calculate quantity from net weight and unit weight
 * 
 * @param netWeight Weight of contents
 * @param unitWeight Weight per unit
 * @returns Calculated quantity, or 0 if unit weight is invalid
 */
export function calculateQuantityFromWeight(netWeight: number, unitWeight: number): number {
  if (unitWeight <= 0) {
    return 0
  }
  return netWeight / unitWeight
}

/**
 * Calculate Z-score for statistical anomaly detection
 * 
 * @param value Current measurement
 * @param mean Historical average
 * @param standardDeviation Historical standard deviation
 * @returns Z-score (number of standard deviations from mean)
 */
export function calculateZScore(value: number, mean: number, standardDeviation: number): number {
  if (standardDeviation === 0) {
    return 0
  }
  return Math.abs((value - mean) / standardDeviation)
}

/**
 * Calculate statistical measures from array of values
 * 
 * @param values Array of numerical values
 * @returns Object with mean, standardDeviation, min, max, count
 */
export function calculateStatistics(values: number[]): {
  mean: number
  standardDeviation: number
  min: number
  max: number
  count: number
} {
  if (values.length === 0) {
    return { mean: 0, standardDeviation: 0, min: 0, max: 0, count: 0 }
  }

  const count = values.length
  const sum = values.reduce((acc, val) => acc + val, 0)
  const mean = sum / count
  
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count
  const standardDeviation = Math.sqrt(variance)
  
  const min = Math.min(...values)
  const max = Math.max(...values)

  return { mean, standardDeviation, min, max, count }
}

// ============================================================================
// BOTTLE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate bottle equivalent from current weight
 * Used for wine/spirits partial bottle counting
 * 
 * @param currentWeight Current weight of bottle + contents
 * @param emptyWeight Weight of empty bottle
 * @param fullWeight Weight of full bottle + contents
 * @returns Decimal equivalent (0.0 to 1.0)
 */
export function calculateBottleEquivalent(
  currentWeight: number,
  emptyWeight: number,
  fullWeight: number
): number {
  // Validate inputs
  if (fullWeight <= emptyWeight) {
    return 0
  }

  // Calculate net weights
  const netCurrent = Math.max(0, currentWeight - emptyWeight)
  const netFull = fullWeight - emptyWeight

  // Return percentage, capped at 100%
  return Math.min(1.0, netCurrent / netFull)
}

/**
 * Calculate total bottle equivalent for hybrid counting
 * 
 * @param fullBottles Number of unopened bottles
 * @param partialBottleWeights Array of partial bottle weights
 * @param emptyBottleWeight Weight of empty bottle
 * @param fullBottleWeight Weight of full bottle
 * @returns Total equivalent bottles as decimal
 */
export function calculateTotalBottleEquivalent(
  fullBottles: number,
  partialBottleWeights: number[],
  emptyBottleWeight: number,
  fullBottleWeight: number
): number {
  let totalEquivalent = fullBottles

  // Add up partial bottles
  for (const partialWeight of partialBottleWeights) {
    const equivalent = calculateBottleEquivalent(partialWeight, emptyBottleWeight, fullBottleWeight)
    totalEquivalent += equivalent
  }

  return totalEquivalent
}

// ============================================================================
// KEG CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate remaining keg volume from weight
 * 
 * @param currentWeight Current keg weight (kg)
 * @param emptyKegWeight Weight of empty keg (kg)
 * @param kegCapacityLiters Total keg capacity (liters)
 * @param beerDensity Density of beer (kg/L, default 1.01)
 * @returns Estimated remaining liters
 */
export function calculateKegRemainingVolume(
  currentWeight: number,
  emptyKegWeight: number,
  kegCapacityLiters: number,
  beerDensity: number = 1.01
): number {
  const netWeight = Math.max(0, currentWeight - emptyKegWeight)
  const remainingLiters = netWeight / beerDensity
  
  // Cap at keg capacity
  return Math.min(remainingLiters, kegCapacityLiters)
}

/**
 * Calculate keg remaining percentage
 * 
 * @param remainingLiters Current remaining volume
 * @param kegCapacityLiters Total keg capacity
 * @returns Percentage remaining (0-100)
 */
export function calculateKegRemainingPercentage(
  remainingLiters: number,
  kegCapacityLiters: number
): number {
  if (kegCapacityLiters <= 0) return 0
  return Math.min(100, (remainingLiters / kegCapacityLiters) * 100)
}

/**
 * Determine keg freshness status based on days since tapping
 * 
 * @param daysSinceTap Days since keg was tapped
 * @param freshnessDays Maximum freshness days for this beverage
 * @returns FreshnessStatus: 'fresh', 'good', 'declining', 'expired'
 */
export function determineKegFreshnessStatus(
  daysSinceTap: number,
  freshnessDays: number
): 'fresh' | 'good' | 'declining' | 'expired' {
  if (daysSinceTap < 0) return 'fresh'
  
  const freshnessRatio = daysSinceTap / freshnessDays
  
  if (freshnessRatio <= 0.3) return 'fresh'      // 0-30% of freshness period
  if (freshnessRatio <= 0.7) return 'good'       // 30-70% of freshness period
  if (freshnessRatio <= 1.0) return 'declining'  // 70-100% of freshness period
  return 'expired'                                // Past freshness period
}

// ============================================================================
// QUERY PARAMETER PARSING HELPERS
// ============================================================================

/**
 * Safely get string query parameter
 * 
 * @param url URL object with search parameters
 * @param key Parameter key
 * @returns Parameter value or null
 */
export function getQueryParam(url: URL, key: string): string | null {
  return url.searchParams.get(key)
}

/**
 * Safely get boolean query parameter
 * 
 * @param url URL object with search parameters
 * @param key Parameter key
 * @returns Boolean value, null if not provided
 */
export function getBooleanQueryParam(url: URL, key: string): boolean | null {
  const value = url.searchParams.get(key)
  if (value === null) return null
  return value === 'true' || value === '1' || value === 'yes'
}

/**
 * Safely get number query parameter
 * 
 * @param url URL object with search parameters
 * @param key Parameter key
 * @returns Number value, null if not provided or invalid
 */
export function getNumberQueryParam(url: URL, key: string): number | null {
  const value = url.searchParams.get(key)
  if (value === null) return null
  const parsed = parseFloat(value)
  return isNaN(parsed) ? null : parsed
}

/**
 * Safely get integer query parameter
 * 
 * @param url URL object with search parameters
 * @param key Parameter key
 * @returns Integer value, null if not provided or invalid
 */
export function getIntegerQueryParam(url: URL, key: string): number | null {
  const value = url.searchParams.get(key)
  if (value === null) return null
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? null : parsed
}

// ============================================================================
// DATE AND TIME UTILITIES
// ============================================================================

/**
 * Format date to YYYY-MM-DD string
 * 
 * @param date Date object or ISO string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

/**
 * Format time to HH:MM:SS string
 * 
 * @param date Date object
 * @returns Formatted time string
 */
export function formatTime(date: Date): string {
  return date.toTimeString().split(' ')[0]
}

/**
 * Calculate days between two dates
 * 
 * @param fromDate Starting date
 * @param toDate Ending date
 * @returns Number of days difference
 */
export function calculateDaysBetween(fromDate: Date | string, toDate: Date | string): number {
  const from = typeof fromDate === 'string' ? new Date(fromDate) : fromDate
  const to = typeof toDate === 'string' ? new Date(toDate) : toDate
  
  const diffTime = Math.abs(to.getTime() - from.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// ============================================================================
// CONTAINER AND BARCODE UTILITIES
// ============================================================================

/**
 * Validate container barcode format
 * Expected format: JIGR-C-XXXXX (where X is digit)
 * 
 * @param barcode Barcode string to validate
 * @returns True if valid format
 */
export function isValidContainerBarcode(barcode: string): boolean {
  const pattern = /^JIGR-C-\d{5}$/
  return pattern.test(barcode)
}

/**
 * Extract container number from barcode
 * 
 * @param barcode Container barcode (JIGR-C-XXXXX)
 * @returns Container number or null if invalid
 */
export function extractContainerNumber(barcode: string): number | null {
  if (!isValidContainerBarcode(barcode)) {
    return null
  }
  
  const match = barcode.match(/\d{5}$/)
  return match ? parseInt(match[0], 10) : null
}

// ============================================================================
// LOGGING AND DEBUGGING UTILITIES
// ============================================================================

/**
 * Log API request for debugging
 * 
 * @param endpoint API endpoint path
 * @param method HTTP method
 * @param clientId Client ID (for filtering logs)
 * @param userId User ID
 * @param data Additional data to log
 */
export function logApiRequest(
  endpoint: string,
  method: string,
  clientId: string,
  userId?: string,
  data?: any
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${method} ${endpoint}`, {
      clientId,
      userId,
      timestamp: new Date().toISOString(),
      data
    })
  }
}

/**
 * Log anomaly detection for debugging
 * 
 * @param itemId Inventory item ID
 * @param anomalyType Type of anomaly detected
 * @param severity Severity level
 * @param details Additional details
 */
export function logAnomalyDetection(
  itemId: string,
  anomalyType: string,
  severity: string,
  details?: any
): void {
  console.warn(`[ANOMALY] ${severity.toUpperCase()}: ${anomalyType}`, {
    itemId,
    details,
    timestamp: new Date().toISOString()
  })
}