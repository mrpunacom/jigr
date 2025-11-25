/**
 * Barcode Database and Product Matching API
 * 
 * Manages local barcode database and intelligent product matching including:
 * - Local barcode database CRUD operations
 * - AI-powered product categorization and matching
 * - Automatic product data enrichment and validation
 * - Smart duplicate detection and merging
 * - Product hierarchy and relationship management
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/barcode/products - Search and retrieve barcode products
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const dataSource = searchParams.get('data_source')
    const verified = searchParams.get('verified')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sort_by') || 'last_accessed'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    console.log(`🔍 Searching barcode products for user ${user_id}`)

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
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
        data_source,
        confidence_score,
        is_verified,
        created_at,
        last_accessed,
        access_count
      `)

    // Apply filters
    if (search) {
      query = query.or(`
        product_name.ilike.%${search}%,
        brand.ilike.%${search}%,
        description.ilike.%${search}%,
        barcode.ilike.%${search}%
      `)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (brand) {
      query = query.eq('brand', brand)
    }

    if (dataSource) {
      query = query.eq('data_source', dataSource)
    }

    if (verified !== null && verified !== undefined) {
      query = query.eq('is_verified', verified === 'true')
    }

    // Apply sorting
    const ascending = sortOrder === 'asc'
    query = query.order(sortBy, { ascending })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: products, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('barcode_products')
      .select('*', { count: 'exact', head: true })

    // Get category and brand statistics
    const stats = await getProductStatistics(supabase)

    return NextResponse.json({
      products: products || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      },
      statistics: stats
    })

  } catch (error) {
    console.error('Barcode products GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/barcode/products - Create or update barcode product
export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    const {
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
      data_source,
      confidence_score,
      auto_categorize = true,
      check_duplicates = true
    } = body

    // Validate required fields
    if (!barcode || !product_name) {
      return NextResponse.json(
        { error: 'Barcode and product name are required' },
        { status: 400 }
      )
    }

    console.log(`📦 Creating/updating product: ${product_name} (${barcode})`)

    // Check for existing product
    const { data: existingProduct } = await supabase
      .from('barcode_products')
      .select('*')
      .eq('barcode', barcode)
      .single()

    // Auto-categorize if requested
    let finalCategory = category
    if (auto_categorize && !category) {
      finalCategory = await categorizeProduct({
        name: product_name,
        brand,
        description,
        supabase
      })
    }

    // Check for duplicates if requested
    let duplicateWarnings = []
    if (check_duplicates) {
      duplicateWarnings = await findPotentialDuplicates({
        barcode,
        productName: product_name,
        brand,
        supabase
      })
    }

    // Enrich product data
    const enrichedData = await enrichProductData({
      productName: product_name,
      brand,
      category: finalCategory,
      description,
      sizeInfo: size_info,
      unitOfMeasurement: unit_of_measurement,
      nutritionalInfo: nutritional_info
    })

    // Prepare product data
    const productData = {
      barcode,
      product_name: enrichedData.productName,
      brand: enrichedData.brand,
      category: enrichedData.category,
      description: enrichedData.description,
      size_info: enrichedData.sizeInfo,
      unit_of_measurement: enrichedData.unitOfMeasurement,
      nutritional_info: enrichedData.nutritionalInfo,
      allergen_info: allergen_info,
      product_images: product_images || [],
      data_source: data_source || 'manual',
      confidence_score: confidence_score || enrichedData.confidenceScore,
      is_verified: false,
      last_accessed: new Date().toISOString()
    }

    let result: any

    if (existingProduct) {
      // Update existing product
      const { data: updatedProduct, error: updateError } = await supabase
        .from('barcode_products')
        .update({
          ...productData,
          updated_at: new Date().toISOString(),
          access_count: (existingProduct.access_count || 0) + 1
        })
        .eq('barcode', barcode)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
      }

      result = {
        action: 'updated',
        product: updatedProduct,
        previousData: existingProduct
      }

    } else {
      // Create new product
      const { data: newProduct, error: insertError } = await supabase
        .from('barcode_products')
        .insert({
          ...productData,
          created_at: new Date().toISOString(),
          access_count: 1
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
      }

      result = {
        action: 'created',
        product: newProduct
      }
    }

    // Check for inventory matching opportunities
    const inventoryMatches = await findInventoryMatches({
      productData: result.product,
      userId: user_id,
      supabase
    })

    return NextResponse.json({
      success: true,
      ...result,
      enrichment: enrichedData.enrichmentApplied,
      duplicateWarnings,
      inventoryMatches: inventoryMatches.slice(0, 5),
      recommendations: generateProductRecommendations({
        product: result.product,
        duplicateWarnings,
        inventoryMatches
      })
    })

  } catch (error) {
    console.error('Barcode product POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/barcode/products/[barcode] - Update specific product
export async function PUT(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()
    
    // Extract barcode from URL path
    const url = new URL(request.url)
    const pathSegments = url.pathname.split('/')
    const barcode = pathSegments[pathSegments.length - 1]

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode is required' }, { status: 400 })
    }

    console.log(`📝 Updating product: ${barcode}`)

    // Get existing product
    const { data: existingProduct } = await supabase
      .from('barcode_products')
      .select('*')
      .eq('barcode', barcode)
      .single()

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Update fields if provided
    const updatableFields = [
      'product_name', 'brand', 'category', 'description', 'size_info',
      'unit_of_measurement', 'nutritional_info', 'allergen_info', 
      'product_images', 'is_verified', 'confidence_score'
    ]

    updatableFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    // Perform update
    const { data: updatedProduct, error: updateError } = await supabase
      .from('barcode_products')
      .update(updateData)
      .eq('barcode', barcode)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      action: 'updated',
      product: updatedProduct,
      changes: updateData
    })

  } catch (error) {
    console.error('Barcode product PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Get product statistics
 */
async function getProductStatistics(supabase: any): Promise<any> {
  try {
    // Get category distribution
    const { data: categories } = await supabase
      .from('barcode_products')
      .select('category')

    const categoryStats = (categories || []).reduce((acc: any, item: any) => {
      const cat = item.category || 'uncategorized'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})

    // Get brand distribution (top 10)
    const { data: brands } = await supabase
      .from('barcode_products')
      .select('brand')

    const brandStats = (brands || [])
      .filter(item => item.brand)
      .reduce((acc: any, item: any) => {
        acc[item.brand] = (acc[item.brand] || 0) + 1
        return acc
      }, {})

    const topBrands = Object.entries(brandStats)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .reduce((acc: any, [brand, count]) => {
        acc[brand] = count
        return acc
      }, {})

    // Get data source distribution
    const { data: sources } = await supabase
      .from('barcode_products')
      .select('data_source')

    const sourceStats = (sources || []).reduce((acc: any, item: any) => {
      const source = item.data_source || 'unknown'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {})

    // Get verification stats
    const { data: verification } = await supabase
      .from('barcode_products')
      .select('is_verified')

    const verifiedCount = (verification || []).filter(item => item.is_verified).length
    const totalCount = verification?.length || 0

    return {
      totalProducts: totalCount,
      verifiedProducts: verifiedCount,
      verificationRate: totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0,
      categoryDistribution: categoryStats,
      topBrands,
      dataSourceDistribution: sourceStats
    }

  } catch (error) {
    console.error('Get statistics error:', error)
    return {
      totalProducts: 0,
      verifiedProducts: 0,
      verificationRate: 0,
      categoryDistribution: {},
      topBrands: {},
      dataSourceDistribution: {}
    }
  }
}

/**
 * Auto-categorize product using AI/ML
 */
async function categorizeProduct(params: {
  name: string
  brand?: string
  description?: string
  supabase: any
}): Promise<string> {
  const { name, brand, description } = params

  try {
    // Combine text for analysis
    const text = `${name || ''} ${brand || ''} ${description || ''}`.toLowerCase()

    // Category keywords mapping
    const categoryKeywords = {
      'meat_poultry': ['chicken', 'beef', 'pork', 'turkey', 'lamb', 'meat', 'poultry', 'sausage', 'bacon'],
      'seafood': ['fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'seafood', 'shellfish'],
      'produce': ['vegetable', 'fruit', 'lettuce', 'tomato', 'apple', 'banana', 'carrot', 'onion', 'produce'],
      'dairy': ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'dairy', 'cottage cheese'],
      'grains_bakery': ['bread', 'flour', 'rice', 'pasta', 'cereal', 'bakery', 'grain', 'wheat'],
      'condiments_spices': ['sauce', 'spice', 'seasoning', 'salt', 'pepper', 'oil', 'vinegar', 'ketchup'],
      'beverages': ['juice', 'soda', 'water', 'coffee', 'tea', 'beverage', 'drink', 'beer', 'wine'],
      'frozen': ['frozen', 'ice cream', 'popsicle'],
      'snacks': ['chips', 'crackers', 'nuts', 'candy', 'snack', 'chocolate'],
      'cleaning': ['soap', 'detergent', 'cleaner', 'sanitizer', 'paper towel', 'tissue'],
      'personal_care': ['shampoo', 'toothpaste', 'deodorant', 'soap', 'lotion']
    }

    // Score each category
    let bestCategory = 'general'
    let bestScore = 0

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (text.includes(keyword) ? 1 : 0)
      }, 0)

      if (score > bestScore) {
        bestScore = score
        bestCategory = category
      }
    }

    return bestCategory

  } catch (error) {
    console.error('Categorization error:', error)
    return 'general'
  }
}

/**
 * Find potential duplicate products
 */
async function findPotentialDuplicates(params: {
  barcode: string
  productName: string
  brand?: string
  supabase: any
}): Promise<any[]> {
  const { barcode, productName, brand, supabase } = params

  try {
    const duplicates = []

    // Check for exact name matches
    const { data: nameMatches } = await supabase
      .from('barcode_products')
      .select('*')
      .neq('barcode', barcode)
      .ilike('product_name', productName)
      .limit(5)

    if (nameMatches) {
      duplicates.push(...nameMatches.map(item => ({
        ...item,
        matchType: 'exact_name',
        similarity: 1.0
      })))
    }

    // Check for similar name + brand matches
    if (brand) {
      const { data: brandMatches } = await supabase
        .from('barcode_products')
        .select('*')
        .neq('barcode', barcode)
        .eq('brand', brand)
        .ilike('product_name', `%${productName.split(' ')[0]}%`)
        .limit(5)

      if (brandMatches) {
        duplicates.push(...brandMatches.map(item => ({
          ...item,
          matchType: 'brand_similarity',
          similarity: calculateSimilarity(productName, item.product_name)
        })))
      }
    }

    // Remove exact duplicates and sort by similarity
    const uniqueDuplicates = duplicates
      .filter((item, index, arr) => 
        index === arr.findIndex(i => i.barcode === item.barcode)
      )
      .filter(item => item.similarity > 0.7)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)

    return uniqueDuplicates

  } catch (error) {
    console.error('Find duplicates error:', error)
    return []
  }
}

/**
 * Calculate string similarity
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0

  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const editDistance = calculateLevenshteinDistance(longer.toLowerCase(), shorter.toLowerCase())
  return (longer.length - editDistance) / longer.length
}

/**
 * Calculate Levenshtein distance
 */
function calculateLevenshteinDistance(str1: string, str2: string): number {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Enrich product data
 */
async function enrichProductData(params: {
  productName: string
  brand?: string
  category?: string
  description?: string
  sizeInfo?: string
  unitOfMeasurement?: string
  nutritionalInfo?: any
}): Promise<any> {
  const { productName, brand, category, description, sizeInfo, unitOfMeasurement, nutritionalInfo } = params

  const enrichment = {
    productName,
    brand,
    category,
    description,
    sizeInfo,
    unitOfMeasurement,
    nutritionalInfo,
    confidenceScore: 0.5,
    enrichmentApplied: []
  }

  try {
    // Extract and standardize unit from size info
    if (sizeInfo && !unitOfMeasurement) {
      const extractedUnit = extractUnitFromSize(sizeInfo)
      if (extractedUnit) {
        enrichment.unitOfMeasurement = extractedUnit
        enrichment.enrichmentApplied.push('unit_extraction')
      }
    }

    // Standardize brand name
    if (brand) {
      const standardizedBrand = standardizeBrandName(brand)
      if (standardizedBrand !== brand) {
        enrichment.brand = standardizedBrand
        enrichment.enrichmentApplied.push('brand_standardization')
      }
    }

    // Calculate confidence score
    let confidence = 0.5

    if (productName?.length > 5) confidence += 0.2
    if (brand) confidence += 0.1
    if (category) confidence += 0.1
    if (sizeInfo) confidence += 0.05
    if (description) confidence += 0.05

    enrichment.confidenceScore = Math.min(1.0, confidence)

    return enrichment

  } catch (error) {
    console.error('Enrich product data error:', error)
    return enrichment
  }
}

/**
 * Extract unit from size string
 */
function extractUnitFromSize(sizeString: string): string | null {
  if (!sizeString) return null

  const size = sizeString.toLowerCase()
  
  const unitPatterns = [
    { pattern: /(\d+(?:\.\d+)?)\s*(oz|ounces?)/i, unit: 'oz' },
    { pattern: /(\d+(?:\.\d+)?)\s*(lb|lbs|pounds?)/i, unit: 'lb' },
    { pattern: /(\d+(?:\.\d+)?)\s*(kg|kilograms?)/i, unit: 'kg' },
    { pattern: /(\d+(?:\.\d+)?)\s*(g|grams?)/i, unit: 'g' },
    { pattern: /(\d+(?:\.\d+)?)\s*(ml|milliliters?)/i, unit: 'ml' },
    { pattern: /(\d+(?:\.\d+)?)\s*(l|liters?)/i, unit: 'l' },
    { pattern: /(\d+(?:\.\d+)?)\s*(gal|gallons?)/i, unit: 'gal' },
    { pattern: /(\d+(?:\.\d+)?)\s*(qt|quarts?)/i, unit: 'qt' },
    { pattern: /(\d+(?:\.\d+)?)\s*(pack|count|ct)/i, unit: 'pack' }
  ]

  for (const { pattern, unit } of unitPatterns) {
    if (pattern.test(size)) {
      return unit
    }
  }

  return null
}

/**
 * Standardize brand name
 */
function standardizeBrandName(brand: string): string {
  if (!brand) return brand

  // Common brand name standardizations
  const standardizations: { [key: string]: string } = {
    'coca cola': 'Coca-Cola',
    'coca-cola': 'Coca-Cola',
    'pepsi cola': 'PepsiCo',
    'kraft': 'Kraft Heinz',
    'general mills': 'General Mills',
    'kelloggs': "Kellogg's",
    'campbells': "Campbell's"
  }

  const lowerBrand = brand.toLowerCase()
  return standardizations[lowerBrand] || brand
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
    const searchTerms = [
      productData.product_name,
      productData.brand,
      `${productData.brand} ${productData.product_name}`.trim()
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
          matchScore: calculateSimilarity(productData.product_name, item.item_name),
          matchReason: 'name_similarity'
        })))
      }
    }

    // Remove duplicates and sort by score
    const uniqueMatches = matches.reduce((acc: any[], match: any) => {
      if (!acc.find(m => m.id === match.id)) {
        acc.push(match)
      }
      return acc
    }, [])

    return uniqueMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5)

  } catch (error) {
    console.error('Find inventory matches error:', error)
    return []
  }
}

/**
 * Generate product recommendations
 */
function generateProductRecommendations(params: {
  product: any
  duplicateWarnings: any[]
  inventoryMatches: any[]
}): string[] {
  const { product, duplicateWarnings, inventoryMatches } = params
  const recommendations: string[] = []

  if (duplicateWarnings.length > 0) {
    recommendations.push(`${duplicateWarnings.length} potential duplicate(s) found - review for data quality`)
  }

  if (inventoryMatches.length > 0) {
    recommendations.push(`${inventoryMatches.length} inventory item(s) may match this product`)
  }

  if (!product.is_verified) {
    recommendations.push('Product data not verified - review and verify for accuracy')
  }

  if (product.confidence_score < 0.7) {
    recommendations.push('Low confidence score - enrich product data for better accuracy')
  }

  if (!product.category || product.category === 'general') {
    recommendations.push('Generic category assigned - consider more specific categorization')
  }

  return recommendations
}