/**
 * Barcode Lookup and Product Identification API
 * 
 * Handles barcode scanning and product identification including:
 * - UPC/EAN barcode lookup from multiple databases
 * - Product information retrieval and enrichment
 * - Local barcode database management
 * - Fuzzy matching for product identification
 * - Integration with existing inventory items
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/barcode/lookup - Look up product by barcode
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    // Using imported supabase client
    const { searchParams } = new URL(request.url)

    // Query parameters
    const barcodeParam = searchParams.get('barcode')
    const enrichProduct = searchParams.get('enrich_product') !== 'false'
    const checkInventory = searchParams.get('check_inventory') !== 'false'
    const includeAlternatives = searchParams.get('include_alternatives') !== 'false'

    if (!barcodeParam) {
      return NextResponse.json(
        { error: 'Barcode parameter is required' },
        { status: 400 }
      )
    }
    
    // TypeScript-safe barcode value (guaranteed to be string after null check)
    const barcode: string = barcodeParam

    // Validate barcode format
    const validationResult = validateBarcode(barcode)
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: `Invalid barcode: ${validationResult.reason}` },
        { status: 400 }
      )
    }

    console.log(`🔍 Looking up barcode: ${barcode} for user ${user_id}`)

    // Check local barcode database first
    const localResult = await lookupLocalBarcode({
      barcode,
      userId: user_id,
      supabase
    })

    let productData = localResult.product
    let dataSource = localResult.found ? 'local_database' : null

    // If not found locally, query external APIs
    if (!localResult.found) {
      const externalResult = await lookupExternalBarcode(barcode)
      if (externalResult.found) {
        productData = externalResult.product
        dataSource = externalResult.source

        // Store in local database for future use
        await storeLocalBarcode({
          barcode,
          productData,
          source: dataSource,
          userId: user_id,
          supabase
        })
      }
    }

    // Check if product matches existing inventory
    let inventoryMatches = []
    if (checkInventory && productData) {
      inventoryMatches = await findInventoryMatches({
        productData,
        userId: user_id,
        supabase
      })
    }

    // Enrich product data if requested
    if (enrichProduct && productData) {
      productData = await enrichProductData(productData, dataSource)
    }

    // Find alternative products if requested
    let alternatives = []
    if (includeAlternatives && productData) {
      alternatives = await findAlternativeProducts({
        productData,
        userId: user_id,
        supabase
      })
    }

    return NextResponse.json({
      barcode: {
        code: barcode,
        format: validationResult.format,
        isValid: true
      },
      product: productData,
      dataSource,
      found: !!productData,
      inventoryMatches,
      alternatives: alternatives.slice(0, 10), // Limit alternatives
      lookupTime: new Date().toISOString()
    })

  } catch (error) {
    console.error('Barcode lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/barcode/lookup/batch - Batch barcode lookup
export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    // Using imported supabase client
    const body = await request.json()

    const { barcodes, enrich_products = false, check_inventory = true } = body

    if (!Array.isArray(barcodes) || barcodes.length === 0) {
      return NextResponse.json(
        { error: 'Barcodes array is required' },
        { status: 400 }
      )
    }

    if (barcodes.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 barcodes per batch request' },
        { status: 400 }
      )
    }

    console.log(`🔍 Batch lookup for ${barcodes.length} barcodes - user ${user_id}`)

    const results = []
    const errors = []

    for (const barcode of barcodes) {
      try {
        // Validate barcode
        const validationResult = validateBarcode(barcode)
        if (!validationResult.isValid) {
          errors.push({
            barcode,
            error: `Invalid barcode: ${validationResult.reason}`
          })
          continue
        }

        // Lookup barcode
        const localResult = await lookupLocalBarcode({
          barcode,
          userId: user_id,
          supabase
        })

        let productData = localResult.product
        let dataSource = localResult.found ? 'local_database' : null

        if (!localResult.found) {
          const externalResult = await lookupExternalBarcode(barcode)
          if (externalResult.found) {
            productData = externalResult.product
            dataSource = externalResult.source

            // Store for future use
            await storeLocalBarcode({
              barcode,
              productData,
              source: dataSource,
              userId: user_id,
              supabase
            })
          }
        }

        // Check inventory matches
        let inventoryMatches = []
        if (check_inventory && productData) {
          inventoryMatches = await findInventoryMatches({
            productData,
            userId: user_id,
            supabase
          })
        }

        // Enrich if requested
        if (enrich_products && productData) {
          productData = await enrichProductData(productData, dataSource)
        }

        results.push({
          barcode: {
            code: barcode,
            format: validationResult.format
          },
          product: productData,
          dataSource,
          found: !!productData,
          inventoryMatches
        })

      } catch (error) {
        errors.push({
          barcode,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      totalRequested: barcodes.length,
      successfulLookups: results.filter(r => r.found).length,
      results,
      errors,
      lookupTime: new Date().toISOString()
    })

  } catch (error) {
    console.error('Batch barcode lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Validate barcode format and checksum
 */
function validateBarcode(barcode: string): { isValid: boolean; format?: string; reason?: string } {
  // Remove any spaces or hyphens
  const cleanBarcode = barcode.replace(/[\s-]/g, '')
  
  // Check if it's all digits
  if (!/^\d+$/.test(cleanBarcode)) {
    return { isValid: false, reason: 'Barcode must contain only digits' }
  }

  const length = cleanBarcode.length

  // UPC-A (12 digits)
  if (length === 12) {
    if (validateUPCAChecksum(cleanBarcode)) {
      return { isValid: true, format: 'UPC-A' }
    }
    return { isValid: false, reason: 'Invalid UPC-A checksum' }
  }

  // EAN-13 (13 digits)
  if (length === 13) {
    if (validateEAN13Checksum(cleanBarcode)) {
      return { isValid: true, format: 'EAN-13' }
    }
    return { isValid: false, reason: 'Invalid EAN-13 checksum' }
  }

  // EAN-8 (8 digits)
  if (length === 8) {
    if (validateEAN8Checksum(cleanBarcode)) {
      return { isValid: true, format: 'EAN-8' }
    }
    return { isValid: false, reason: 'Invalid EAN-8 checksum' }
  }

  // UPC-E (6 or 8 digits)
  if (length === 6 || length === 8) {
    return { isValid: true, format: 'UPC-E' }
  }

  return { isValid: false, reason: `Unsupported barcode length: ${length} digits` }
}

/**
 * Validate UPC-A checksum
 */
function validateUPCAChecksum(barcode: string): boolean {
  const digits = barcode.split('').map(Number)
  const checkDigit = digits.pop()
  
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1)
  }
  
  const calculatedCheck = (10 - (sum % 10)) % 10
  return calculatedCheck === checkDigit
}

/**
 * Validate EAN-13 checksum
 */
function validateEAN13Checksum(barcode: string): boolean {
  const digits = barcode.split('').map(Number)
  const checkDigit = digits.pop()
  
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3)
  }
  
  const calculatedCheck = (10 - (sum % 10)) % 10
  return calculatedCheck === checkDigit
}

/**
 * Validate EAN-8 checksum
 */
function validateEAN8Checksum(barcode: string): boolean {
  const digits = barcode.split('').map(Number)
  const checkDigit = digits.pop()
  
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 3 : 1)
  }
  
  const calculatedCheck = (10 - (sum % 10)) % 10
  return calculatedCheck === checkDigit
}

/**
 * Look up barcode in local database
 */
async function lookupLocalBarcode(params: {
  barcode: string
  userId: string
  supabase: any
}): Promise<{ found: boolean; product?: any }> {
  const { barcode, userId, supabase } = params

  try {
    const { data: localProduct, error } = await supabase
      .from('barcode_products')
      .select(`
        id,
        barcode,
        product_name,
        brand,
        category,
        description,
        size_info,
        unit_of_measurement,
        nutritional_info,
        allergen_info,
        product_images,
        last_updated,
        data_source,
        confidence_score,
        is_verified
      `)
      .eq('barcode', barcode)
      .single()

    if (error || !localProduct) {
      return { found: false }
    }

    // Update last accessed timestamp
    await supabase
      .from('barcode_products')
      .update({ last_accessed: new Date().toISOString() })
      .eq('id', localProduct.id)

    return {
      found: true,
      product: {
        id: localProduct.id,
        name: localProduct.product_name,
        brand: localProduct.brand,
        category: localProduct.category,
        description: localProduct.description,
        size: localProduct.size_info,
        unit: localProduct.unit_of_measurement,
        nutritionalInfo: localProduct.nutritional_info,
        allergens: localProduct.allergen_info,
        images: localProduct.product_images || [],
        lastUpdated: localProduct.last_updated,
        dataSource: localProduct.data_source,
        confidenceScore: localProduct.confidence_score,
        isVerified: localProduct.is_verified
      }
    }

  } catch (error) {
    console.error('Local barcode lookup error:', error)
    return { found: false }
  }
}

/**
 * Look up barcode in external APIs
 */
async function lookupExternalBarcode(barcode: string): Promise<{ found: boolean; product?: any; source?: string }> {
  try {
    // Try multiple external APIs in order of preference
    
    // 1. Try UPC Database (free API with good coverage)
    const upcResult = await lookupUPCDatabase(barcode)
    if (upcResult.found) {
      return upcResult
    }

    // 2. Try Open Food Facts (great for food products)
    const offResult = await lookupOpenFoodFacts(barcode)
    if (offResult.found) {
      return offResult
    }

    // 3. Try Barcode Spider (backup option)
    const bsResult = await lookupBarcodeSpider(barcode)
    if (bsResult.found) {
      return bsResult
    }

    return { found: false }

  } catch (error) {
    console.error('External barcode lookup error:', error)
    return { found: false }
  }
}

/**
 * Lookup using UPC Database API
 */
async function lookupUPCDatabase(barcode: string): Promise<{ found: boolean; product?: any; source?: string }> {
  try {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`)
    
    if (!response.ok) {
      return { found: false }
    }

    const data = await response.json()
    
    if (data.code !== 'OK' || !data.items || data.items.length === 0) {
      return { found: false }
    }

    const item = data.items[0]
    
    return {
      found: true,
      source: 'upc_database',
      product: {
        name: item.title,
        brand: item.brand,
        category: item.category,
        description: item.description,
        size: item.size,
        unit: parseUnitFromSize(item.size),
        images: item.images || [],
        upc: item.upc,
        ean: item.ean,
        confidenceScore: 0.8 // UPC Database generally reliable
      }
    }

  } catch (error) {
    console.error('UPC Database lookup error:', error)
    return { found: false }
  }
}

/**
 * Lookup using Open Food Facts API
 */
async function lookupOpenFoodFacts(barcode: string): Promise<{ found: boolean; product?: any; source?: string }> {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    
    if (!response.ok) {
      return { found: false }
    }

    const data = await response.json()
    
    if (data.status !== 1 || !data.product) {
      return { found: false }
    }

    const product = data.product
    
    return {
      found: true,
      source: 'open_food_facts',
      product: {
        name: product.product_name || product.product_name_en,
        brand: product.brands,
        category: product.categories_tags?.join(', '),
        description: product.generic_name,
        size: product.quantity,
        unit: parseUnitFromSize(product.quantity),
        nutritionalInfo: {
          energyKcal: product.nutriments?.['energy-kcal'],
          fat: product.nutriments?.fat,
          saturatedFat: product.nutriments?.['saturated-fat'],
          carbohydrates: product.nutriments?.carbohydrates,
          sugars: product.nutriments?.sugars,
          fiber: product.nutriments?.fiber,
          proteins: product.nutriments?.proteins,
          salt: product.nutriments?.salt,
          sodium: product.nutriments?.sodium
        },
        allergens: product.allergens_tags,
        images: [
          product.image_url,
          product.image_front_url,
          product.image_ingredients_url,
          product.image_nutrition_url
        ].filter(Boolean),
        confidenceScore: 0.9 // Open Food Facts very reliable for food items
      }
    }

  } catch (error) {
    console.error('Open Food Facts lookup error:', error)
    return { found: false }
  }
}

/**
 * Lookup using Barcode Spider API (fallback)
 */
async function lookupBarcodeSpider(barcode: string): Promise<{ found: boolean; product?: any; source?: string }> {
  try {
    // This would require an API key for Barcode Spider
    // For now, return not found as it's a paid service
    return { found: false }

  } catch (error) {
    console.error('Barcode Spider lookup error:', error)
    return { found: false }
  }
}

/**
 * Store barcode product in local database
 */
async function storeLocalBarcode(params: {
  barcode: string
  productData: any
  source: string
  userId: string
  supabase: any
}): Promise<void> {
  const { barcode, productData, source, userId, supabase } = params

  try {
    const { error } = await supabase
      .from('barcode_products')
      .insert({
        barcode,
        product_name: productData.name,
        brand: productData.brand,
        category: productData.category,
        description: productData.description,
        size_info: productData.size,
        unit_of_measurement: productData.unit,
        nutritional_info: productData.nutritionalInfo,
        allergen_info: productData.allergens,
        product_images: productData.images,
        data_source: source,
        confidence_score: productData.confidenceScore || 0.5,
        is_verified: false,
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString()
      })

    if (error) {
      console.error('Error storing barcode product:', error)
    } else {
      console.log(`📱 Stored barcode ${barcode} in local database`)
    }

  } catch (error) {
    console.error('Store local barcode error:', error)
  }
}

/**
 * Find matching inventory items
 */
async function findInventoryMatches(params: {
  productData: any
  userId: string
  supabase: any
}): Promise<any[]> {
  const { productData, userId, supabase } = params

  try {
    // Search for similar items in inventory using fuzzy matching
    const searchTerms = [
      productData.name,
      productData.brand,
      `${productData.brand} ${productData.name}`.trim()
    ].filter(Boolean)

    const matches = []

    for (const searchTerm of searchTerms) {
      const { data: items } = await supabase
        .from('inventory_items')
        .select(`
          id,
          item_name,
          current_quantity,
          unit_of_measurement,
          cost_per_unit,
          category,
          barcode
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .ilike('item_name', `%${searchTerm}%`)
        .limit(5)

      if (items) {
        matches.push(...items.map(item => ({
          ...item,
          matchScore: calculateMatchScore(productData, item),
          matchReason: 'name_similarity'
        })))
      }
    }

    // Remove duplicates and sort by match score
    const uniqueMatches = matches.reduce((acc: any[], match: any) => {
      if (!acc.find(m => m.id === match.id)) {
        acc.push(match)
      }
      return acc
    }, [])

    return uniqueMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5) // Top 5 matches

  } catch (error) {
    console.error('Find inventory matches error:', error)
    return []
  }
}

/**
 * Calculate match score between product and inventory item
 */
function calculateMatchScore(productData: any, inventoryItem: any): number {
  let score = 0

  // Name similarity
  const productName = productData.name?.toLowerCase() || ''
  const itemName = inventoryItem.item_name?.toLowerCase() || ''
  
  if (productName && itemName) {
    const similarity = calculateStringSimilarity(productName, itemName)
    score += similarity * 0.6 // 60% weight
  }

  // Brand similarity
  if (productData.brand && itemName.includes(productData.brand.toLowerCase())) {
    score += 0.3 // 30% weight
  }

  // Unit similarity
  if (productData.unit && inventoryItem.unit_of_measurement) {
    if (productData.unit.toLowerCase() === inventoryItem.unit_of_measurement.toLowerCase()) {
      score += 0.1 // 10% weight
    }
  }

  return Math.min(1, score) // Cap at 1.0
}

/**
 * Calculate string similarity (simple Jaccard similarity)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(' ').filter(word => word.length > 2))
  const set2 = new Set(str2.split(' ').filter(word => word.length > 2))
  
  const intersection = new Set([...set1].filter(word => set2.has(word)))
  const union = new Set([...set1, ...set2])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

/**
 * Find alternative products
 */
async function findAlternativeProducts(params: {
  productData: any
  userId: string
  supabase: any
}): Promise<any[]> {
  const { productData, userId, supabase } = params

  try {
    // Find similar products from barcode database
    const { data: alternatives } = await supabase
      .from('barcode_products')
      .select('*')
      .neq('barcode', productData.barcode || '')
      .ilike('category', `%${productData.category || ''}%`)
      .limit(10)

    return (alternatives || []).map(alt => ({
      barcode: alt.barcode,
      name: alt.product_name,
      brand: alt.brand,
      category: alt.category,
      size: alt.size_info,
      dataSource: alt.data_source
    }))

  } catch (error) {
    console.error('Find alternatives error:', error)
    return []
  }
}

/**
 * Enrich product data with additional information
 */
async function enrichProductData(productData: any, source?: string): Promise<any> {
  try {
    // Add computed fields
    const enrichedData = {
      ...productData,
      enriched: true,
      enrichedAt: new Date().toISOString()
    }

    // Parse size information for better unit extraction
    if (productData.size && !productData.unit) {
      enrichedData.unit = parseUnitFromSize(productData.size)
      enrichedData.estimatedQuantity = parseQuantityFromSize(productData.size)
    }

    // Categorize product if not already categorized
    if (!enrichedData.category) {
      enrichedData.category = categorizeProduct(enrichedData.name, enrichedData.description)
    }

    // Add nutritional scoring if nutritional info exists
    if (enrichedData.nutritionalInfo) {
      enrichedData.nutritionalScore = calculateNutritionalScore(enrichedData.nutritionalInfo)
    }

    return enrichedData

  } catch (error) {
    console.error('Enrich product data error:', error)
    return productData
  }
}

/**
 * Parse unit from size string
 */
function parseUnitFromSize(sizeString?: string): string {
  if (!sizeString) return 'each'

  const size = sizeString.toLowerCase()
  
  if (size.includes('oz') || size.includes('ounce')) return 'oz'
  if (size.includes('lb') || size.includes('pound')) return 'lb'
  if (size.includes('kg') || size.includes('kilogram')) return 'kg'
  if (size.includes('g') && !size.includes('kg')) return 'g'
  if (size.includes('ml') || size.includes('milliliter')) return 'ml'
  if (size.includes('l') && !size.includes('ml')) return 'l'
  if (size.includes('gal') || size.includes('gallon')) return 'gal'
  if (size.includes('qt') || size.includes('quart')) return 'qt'
  if (size.includes('pt') || size.includes('pint')) return 'pt'
  if (size.includes('cup')) return 'cup'
  if (size.includes('pack') || size.includes('count')) return 'pack'
  
  return 'each'
}

/**
 * Parse quantity from size string
 */
function parseQuantityFromSize(sizeString?: string): number {
  if (!sizeString) return 1

  const matches = sizeString.match(/(\d+(?:\.\d+)?)/);
  return matches ? parseFloat(matches[1]) : 1
}

/**
 * Categorize product based on name and description
 */
function categorizeProduct(name?: string, description?: string): string {
  const text = `${name || ''} ${description || ''}`.toLowerCase()
  
  if (text.includes('meat') || text.includes('chicken') || text.includes('beef') || text.includes('pork')) {
    return 'meat_poultry'
  }
  if (text.includes('vegetable') || text.includes('produce') || text.includes('lettuce') || text.includes('tomato')) {
    return 'produce'
  }
  if (text.includes('dairy') || text.includes('milk') || text.includes('cheese') || text.includes('butter')) {
    return 'dairy'
  }
  if (text.includes('bread') || text.includes('flour') || text.includes('grain') || text.includes('pasta')) {
    return 'grains_bakery'
  }
  if (text.includes('sauce') || text.includes('spice') || text.includes('seasoning') || text.includes('oil')) {
    return 'condiments_spices'
  }
  if (text.includes('beverage') || text.includes('drink') || text.includes('juice') || text.includes('soda')) {
    return 'beverages'
  }
  
  return 'general'
}

/**
 * Calculate basic nutritional score
 */
function calculateNutritionalScore(nutritionalInfo: any): number {
  if (!nutritionalInfo) return 0

  let score = 50 // Base score
  
  // Positive factors
  if (nutritionalInfo.proteins > 5) score += 10
  if (nutritionalInfo.fiber > 3) score += 10
  
  // Negative factors
  if (nutritionalInfo.sugars > 10) score -= 10
  if (nutritionalInfo.saturatedFat > 5) score -= 10
  if (nutritionalInfo.sodium > 500) score -= 10
  
  return Math.max(0, Math.min(100, score))
}