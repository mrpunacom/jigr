/**
 * Barcode utility functions for cleaning, validation, and formatting
 */

/**
 * Clean barcode by removing unwanted characters
 */
export function cleanBarcode(barcode: string): string {
  if (!barcode) return ''
  
  // Remove whitespace and convert to uppercase
  return barcode.trim().toUpperCase()
}

/**
 * Validate if a barcode has a valid format
 */
export function isValidBarcode(barcode: string): boolean {
  if (!barcode || typeof barcode !== 'string') {
    return false
  }

  const cleaned = cleanBarcode(barcode)
  
  // Basic validation - at least 4 characters, alphanumeric
  if (cleaned.length < 4) {
    return false
  }

  // Check for valid characters (alphanumeric, dashes, underscores)
  const validPattern = /^[A-Z0-9\-_]+$/
  return validPattern.test(cleaned)
}

/**
 * Format barcode for display
 */
export function formatBarcode(barcode: string): string {
  if (!barcode) return ''
  return cleanBarcode(barcode)
}

/**
 * Validate barcode format and return validation result
 */
export function validateBarcodeFormat(barcode: string): {
  isValid: boolean
  error?: string
  cleaned: string
} {
  if (!barcode || typeof barcode !== 'string') {
    return {
      isValid: false,
      error: 'Barcode is required',
      cleaned: ''
    }
  }

  const cleaned = cleanBarcode(barcode)
  
  if (cleaned.length < 4) {
    return {
      isValid: false,
      error: 'Barcode must be at least 4 characters long',
      cleaned
    }
  }

  if (cleaned.length > 128) {
    return {
      isValid: false,
      error: 'Barcode cannot be longer than 128 characters',
      cleaned
    }
  }

  const validPattern = /^[A-Z0-9\-_]+$/
  if (!validPattern.test(cleaned)) {
    return {
      isValid: false,
      error: 'Barcode can only contain letters, numbers, dashes, and underscores',
      cleaned
    }
  }

  return {
    isValid: true,
    cleaned
  }
}

/**
 * Generate a random barcode (for testing purposes)
 */
export function generateRandomBarcode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return result
}