/**
 * Unit Conversion Engine for Recipes
 * 
 * Handles automatic conversion between different measurement units
 * with support for weight, volume, and count-based conversions
 */

import { createClient } from '@/lib/supabase'

export interface ConversionResult {
  success: boolean
  converted_amount: number
  from_unit: string
  to_unit: string
  conversion_factor: number
  conversion_type: 'direct' | 'database' | 'calculated' | 'estimated'
  confidence: number
  notes?: string
}

export interface UnitConversion {
  from_unit: string
  to_unit: string
  factor: number
  category: 'weight' | 'volume' | 'count' | 'temperature'
  notes?: string
}

// Standard conversion factors for common units
const STANDARD_CONVERSIONS: UnitConversion[] = [
  // Weight conversions (all to grams)
  { from_unit: 'kg', to_unit: 'g', factor: 1000, category: 'weight' },
  { from_unit: 'lb', to_unit: 'g', factor: 453.592, category: 'weight' },
  { from_unit: 'oz', to_unit: 'g', factor: 28.3495, category: 'weight' },
  
  // Volume conversions (all to milliliters)
  { from_unit: 'l', to_unit: 'ml', factor: 1000, category: 'volume' },
  { from_unit: 'litre', to_unit: 'ml', factor: 1000, category: 'volume' },
  { from_unit: 'cup', to_unit: 'ml', factor: 240, category: 'volume' },
  { from_unit: 'tbsp', to_unit: 'ml', factor: 15, category: 'volume' },
  { from_unit: 'tablespoon', to_unit: 'ml', factor: 15, category: 'volume' },
  { from_unit: 'tsp', to_unit: 'ml', factor: 5, category: 'volume' },
  { from_unit: 'teaspoon', to_unit: 'ml', factor: 5, category: 'volume' },
  { from_unit: 'fl oz', to_unit: 'ml', factor: 29.5735, category: 'volume' },
  { from_unit: 'pint', to_unit: 'ml', factor: 473.176, category: 'volume' },
  { from_unit: 'quart', to_unit: 'ml', factor: 946.353, category: 'volume' },
  { from_unit: 'gallon', to_unit: 'ml', factor: 3785.41, category: 'volume' },
  
  // Temperature conversions
  { from_unit: 'f', to_unit: 'c', factor: 0, category: 'temperature', notes: 'Special formula' },
  { from_unit: 'fahrenheit', to_unit: 'celsius', factor: 0, category: 'temperature', notes: 'Special formula' },
  
  // Count conversions
  { from_unit: 'dozen', to_unit: 'units', factor: 12, category: 'count' },
  { from_unit: 'pair', to_unit: 'units', factor: 2, category: 'count' }
]

/**
 * Convert amount from one unit to another
 */
export async function convertUnit(
  amount: number,
  fromUnit: string,
  toUnit: string,
  userId?: string,
  ingredientContext?: string
): Promise<ConversionResult> {
  
  const normalizedFromUnit = normalizeUnit(fromUnit)
  const normalizedToUnit = normalizeUnit(toUnit)
  
  console.log(`🔄 Converting ${amount} ${normalizedFromUnit} to ${normalizedToUnit}`)
  
  // Quick return for same units
  if (normalizedFromUnit === normalizedToUnit) {
    return {
      success: true,
      converted_amount: amount,
      from_unit: normalizedFromUnit,
      to_unit: normalizedToUnit,
      conversion_factor: 1,
      conversion_type: 'direct',
      confidence: 1.0
    }
  }
  
  // Try direct standard conversion
  const directConversion = findDirectConversion(normalizedFromUnit, normalizedToUnit)
  if (directConversion) {
    const convertedAmount = convertTemperature(amount, normalizedFromUnit, normalizedToUnit) || 
                           (amount * directConversion.factor)
    
    return {
      success: true,
      converted_amount: convertedAmount,
      from_unit: normalizedFromUnit,
      to_unit: normalizedToUnit,
      conversion_factor: directConversion.factor,
      conversion_type: 'direct',
      confidence: 1.0,
      notes: directConversion.notes
    }
  }
  
  // Try reverse conversion
  const reverseConversion = findDirectConversion(normalizedToUnit, normalizedFromUnit)
  if (reverseConversion) {
    const convertedAmount = amount / reverseConversion.factor
    
    return {
      success: true,
      converted_amount: convertedAmount,
      from_unit: normalizedFromUnit,
      to_unit: normalizedToUnit,
      conversion_factor: 1 / reverseConversion.factor,
      conversion_type: 'direct',
      confidence: 1.0
    }
  }
  
  // Try database conversion if user provided
  if (userId) {
    const dbConversion = await getDatabaseConversion(normalizedFromUnit, normalizedToUnit, userId)
    if (dbConversion) {
      return {
        success: true,
        converted_amount: amount * dbConversion.factor,
        from_unit: normalizedFromUnit,
        to_unit: normalizedToUnit,
        conversion_factor: dbConversion.factor,
        conversion_type: 'database',
        confidence: 0.9,
        notes: dbConversion.notes
      }
    }
  }
  
  // Try via intermediate unit (e.g., oz -> g -> kg)
  const intermediateConversion = findIntermediateConversion(normalizedFromUnit, normalizedToUnit)
  if (intermediateConversion) {
    const convertedAmount = amount * intermediateConversion.totalFactor
    
    return {
      success: true,
      converted_amount: convertedAmount,
      from_unit: normalizedFromUnit,
      to_unit: normalizedToUnit,
      conversion_factor: intermediateConversion.totalFactor,
      conversion_type: 'calculated',
      confidence: 0.95,
      notes: `Via ${intermediateConversion.intermediateUnit}`
    }
  }
  
  // Try ingredient-specific estimation if context provided
  if (ingredientContext && userId) {
    const estimatedConversion = await estimateConversion(
      amount, 
      normalizedFromUnit, 
      normalizedToUnit, 
      ingredientContext, 
      userId
    )
    if (estimatedConversion) {
      return estimatedConversion
    }
  }
  
  // Conversion not possible
  return {
    success: false,
    converted_amount: amount,
    from_unit: normalizedFromUnit,
    to_unit: normalizedToUnit,
    conversion_factor: 0,
    conversion_type: 'direct',
    confidence: 0,
    notes: `No conversion available from ${normalizedFromUnit} to ${normalizedToUnit}`
  }
}

/**
 * Normalize unit names to standard forms
 */
function normalizeUnit(unit: string): string {
  if (!unit || typeof unit !== 'string') return 'units'
  
  const normalized = unit.toLowerCase().trim()
  
  // Common abbreviations and variations
  const unitMappings: { [key: string]: string } = {
    // Weight
    'kilogram': 'kg',
    'kilograms': 'kg',
    'kgs': 'kg',
    'gram': 'g',
    'grams': 'g',
    'gms': 'g',
    'pound': 'lb',
    'pounds': 'lb',
    'lbs': 'lb',
    'ounce': 'oz',
    'ounces': 'oz',
    
    // Volume
    'liter': 'l',
    'liters': 'l',
    'litre': 'l',
    'litres': 'l',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'millilitre': 'ml',
    'millilitres': 'ml',
    'mls': 'ml',
    'cups': 'cup',
    'c': 'cup',
    'tablespoons': 'tbsp',
    'tablespoon': 'tbsp',
    'teaspoons': 'tsp',
    'teaspoon': 'tsp',
    't': 'tsp',
    'fluid ounce': 'fl oz',
    'fluid ounces': 'fl oz',
    'pints': 'pint',
    'quarts': 'quart',
    'gallons': 'gallon',
    
    // Temperature
    'fahrenheit': 'f',
    'celsius': 'c',
    'centigrade': 'c',
    
    // Count
    'unit': 'units',
    'each': 'units',
    'pieces': 'units',
    'piece': 'units',
    'items': 'units',
    'item': 'units'
  }
  
  return unitMappings[normalized] || normalized
}

/**
 * Find direct conversion between two units
 */
function findDirectConversion(fromUnit: string, toUnit: string): UnitConversion | null {
  return STANDARD_CONVERSIONS.find(conv => 
    conv.from_unit === fromUnit && conv.to_unit === toUnit
  ) || null
}

/**
 * Find conversion via intermediate unit (e.g., lb -> g -> kg)
 */
function findIntermediateConversion(fromUnit: string, toUnit: string): {
  totalFactor: number
  intermediateUnit: string
} | null {
  
  // Common intermediate units by category
  const intermediates = ['g', 'ml', 'units', 'c']
  
  for (const intermediate of intermediates) {
    const step1 = findDirectConversion(fromUnit, intermediate)
    const step2 = findDirectConversion(intermediate, toUnit)
    
    if (step1 && step2) {
      return {
        totalFactor: step1.factor * step2.factor,
        intermediateUnit: intermediate
      }
    }
    
    // Try reverse for step2
    const step2Reverse = findDirectConversion(toUnit, intermediate)
    if (step1 && step2Reverse) {
      return {
        totalFactor: step1.factor / step2Reverse.factor,
        intermediateUnit: intermediate
      }
    }
  }
  
  return null
}

/**
 * Get conversion from database (user-specific or ingredient-specific)
 */
async function getDatabaseConversion(
  fromUnit: string,
  toUnit: string,
  userId: string
): Promise<{ factor: number; notes?: string } | null> {
  try {
    const supabase = createClient()
    
    // Check for user-specific conversion
    const { data } = await supabase
      .from('unit_conversions')
      .select('conversion_factor, notes')
      .eq('user_id', userId)
      .eq('from_unit', fromUnit)
      .eq('to_unit', toUnit)
      .eq('is_active', true)
      .single()
    
    if (data) {
      return {
        factor: data.conversion_factor,
        notes: data.notes
      }
    }
    
    // Check for global/default conversions
    const { data: globalData } = await supabase
      .from('unit_conversions')
      .select('conversion_factor, notes')
      .is('user_id', null)
      .eq('from_unit', fromUnit)
      .eq('to_unit', toUnit)
      .eq('is_active', true)
      .single()
    
    if (globalData) {
      return {
        factor: globalData.conversion_factor,
        notes: globalData.notes
      }
    }
    
    return null
  } catch (error) {
    console.error('Database conversion lookup error:', error)
    return null
  }
}

/**
 * Estimate conversion using ingredient-specific data
 */
async function estimateConversion(
  amount: number,
  fromUnit: string,
  toUnit: string,
  ingredientName: string,
  userId: string
): Promise<ConversionResult | null> {
  try {
    // This would use ingredient density data, typical serving sizes, etc.
    // For now, return null - could be enhanced with ingredient database
    
    // Example: Convert "1 cup flour" to grams using flour density
    if (fromUnit === 'cup' && toUnit === 'g') {
      const densityMap: { [key: string]: number } = {
        'flour': 120,
        'sugar': 200,
        'rice': 180,
        'oats': 80
      }
      
      for (const [ingredient, density] of Object.entries(densityMap)) {
        if (ingredientName.toLowerCase().includes(ingredient)) {
          return {
            success: true,
            converted_amount: amount * density,
            from_unit: fromUnit,
            to_unit: toUnit,
            conversion_factor: density,
            conversion_type: 'estimated',
            confidence: 0.7,
            notes: `Estimated based on typical ${ingredient} density`
          }
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Estimation conversion error:', error)
    return null
  }
}

/**
 * Special temperature conversion
 */
function convertTemperature(amount: number, fromUnit: string, toUnit: string): number | null {
  if (fromUnit === 'f' && toUnit === 'c') {
    return (amount - 32) * 5 / 9
  }
  if (fromUnit === 'c' && toUnit === 'f') {
    return (amount * 9 / 5) + 32
  }
  return null
}

/**
 * Batch convert multiple amounts
 */
export async function batchConvertUnits(
  conversions: Array<{
    amount: number
    fromUnit: string
    toUnit: string
    ingredientContext?: string
  }>,
  userId?: string
): Promise<ConversionResult[]> {
  
  console.log(`🔄 Batch converting ${conversions.length} units`)
  
  const results = await Promise.all(
    conversions.map(conv => 
      convertUnit(conv.amount, conv.fromUnit, conv.toUnit, userId, conv.ingredientContext)
    )
  )
  
  const successCount = results.filter(r => r.success).length
  console.log(`✅ Batch conversion complete: ${successCount}/${conversions.length} successful`)
  
  return results
}

/**
 * Store custom conversion factor for user
 */
export async function storeCustomConversion(
  fromUnit: string,
  toUnit: string,
  factor: number,
  userId: string,
  notes?: string
): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const conversionData = {
      user_id: userId,
      from_unit: normalizeUnit(fromUnit),
      to_unit: normalizeUnit(toUnit),
      conversion_factor: factor,
      notes: notes || null,
      is_active: true,
      created_at: new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('unit_conversions')
      .upsert(conversionData, {
        onConflict: 'user_id,from_unit,to_unit'
      })
    
    if (error) {
      console.error('Store conversion error:', error)
      return false
    }
    
    console.log(`💾 Stored custom conversion: ${fromUnit} -> ${toUnit} (${factor}x)`)
    return true
    
  } catch (error) {
    console.error('Store custom conversion error:', error)
    return false
  }
}

/**
 * Get conversion suggestions for common unit pairs
 */
export function getConversionSuggestions(unit: string): string[] {
  const normalizedUnit = normalizeUnit(unit)
  
  const suggestions: { [key: string]: string[] } = {
    // Weight units
    'g': ['kg', 'oz', 'lb'],
    'kg': ['g', 'lb', 'oz'],
    'lb': ['kg', 'g', 'oz'],
    'oz': ['g', 'lb', 'kg'],
    
    // Volume units
    'ml': ['l', 'cup', 'fl oz', 'tbsp', 'tsp'],
    'l': ['ml', 'cup', 'fl oz', 'quart', 'gallon'],
    'cup': ['ml', 'l', 'fl oz', 'tbsp'],
    'tbsp': ['tsp', 'ml', 'cup'],
    'tsp': ['tbsp', 'ml'],
    
    // Temperature
    'c': ['f'],
    'f': ['c'],
    
    // Count
    'units': ['dozen', 'pair']
  }
  
  return suggestions[normalizedUnit] || []
}