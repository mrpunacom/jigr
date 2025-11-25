/**
 * Intelligent Ingredient Matching System
 * 
 * Uses fuzzy search, AI, and cached results to match recipe ingredients
 * to inventory items with high accuracy and performance.
 */

import { createClient } from '@/lib/supabase'

export interface IngredientMatch {
  inventory_id: string
  inventory_name: string
  confidence: number
  match_type: 'exact' | 'fuzzy' | 'ai' | 'cached'
  unit_conversion?: {
    from_unit: string
    to_unit: string
    conversion_factor: number
  }
}

export interface MatchingOptions {
  userId: string
  minConfidence?: number
  maxResults?: number
  enableAI?: boolean
  useCache?: boolean
}

/**
 * Main ingredient matching function
 * 
 * Attempts multiple matching strategies in order of confidence:
 * 1. Cached matches (instant)
 * 2. Exact name matches
 * 3. Fuzzy string matching
 * 4. AI-powered semantic matching
 */
export async function matchIngredientToInventory(
  ingredientName: string,
  options: MatchingOptions
): Promise<IngredientMatch[]> {
  const supabase = createClient()
  const { userId, minConfidence = 0.6, maxResults = 5, enableAI = true, useCache = true } = options
  
  const normalizedName = normalizeIngredientName(ingredientName)
  console.log(`🔍 Matching ingredient: "${ingredientName}" (normalized: "${normalizedName}")`)
  
  let matches: IngredientMatch[] = []
  
  // Strategy 1: Check cache for previously matched ingredients
  if (useCache) {
    const cachedMatches = await getCachedMatches(normalizedName, userId, supabase)
    if (cachedMatches.length > 0) {
      console.log(`✅ Found ${cachedMatches.length} cached matches`)
      return cachedMatches.slice(0, maxResults)
    }
  }
  
  // Strategy 2: Exact name matches
  const exactMatches = await findExactMatches(normalizedName, userId, supabase)
  matches.push(...exactMatches)
  
  // Strategy 3: Fuzzy string matching using PostgreSQL similarity
  if (matches.length < maxResults) {
    const fuzzyMatches = await findFuzzyMatches(normalizedName, userId, supabase, minConfidence)
    matches.push(...fuzzyMatches.filter(m => !matches.find(existing => existing.inventory_id === m.inventory_id)))
  }
  
  // Strategy 4: AI-powered semantic matching (if enabled and needed)
  if (enableAI && matches.length < maxResults) {
    const aiMatches = await findAIMatches(ingredientName, normalizedName, userId, supabase, minConfidence)
    matches.push(...aiMatches.filter(m => !matches.find(existing => existing.inventory_id === m.inventory_id)))
  }
  
  // Sort by confidence and take top results
  matches.sort((a, b) => b.confidence - a.confidence)
  const topMatches = matches.slice(0, maxResults)
  
  // Cache successful matches for future use
  if (useCache && topMatches.length > 0) {
    await cacheMatches(normalizedName, topMatches, userId, supabase)
  }
  
  console.log(`🎯 Found ${topMatches.length} matches with confidence >= ${minConfidence}`)
  return topMatches
}

/**
 * Normalize ingredient names for consistent matching
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove common cooking terms
    .replace(/\b(fresh|frozen|dried|chopped|diced|sliced|minced|grated|organic|raw)\b/g, '')
    // Standardize plurals
    .replace(/ies$/, 'y')
    .replace(/ves$/, 'f')
    .replace(/s$/, '')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Get cached ingredient matches
 */
async function getCachedMatches(
  normalizedName: string,
  userId: string,
  supabase: any
): Promise<IngredientMatch[]> {
  try {
    const { data: cached } = await supabase
      .from('ingredient_match_cache')
      .select(`
        inventory_id,
        confidence,
        match_data,
        inventory_items!inner(
          id,
          item_name,
          recipe_unit,
          is_active
        )
      `)
      .eq('user_id', userId)
      .eq('ingredient_name_normalized', normalizedName)
      .eq('inventory_items.is_active', true)
      .gte('confidence', 0.6)
      .order('confidence', { ascending: false })
    
    if (!cached || cached.length === 0) return []
    
    return cached.map(item => ({
      inventory_id: item.inventory_id,
      inventory_name: item.inventory_items.item_name,
      confidence: item.confidence,
      match_type: 'cached' as const,
      unit_conversion: item.match_data?.unit_conversion
    }))
  } catch (error) {
    console.error('Cache lookup error:', error)
    return []
  }
}

/**
 * Find exact name matches in inventory
 */
async function findExactMatches(
  normalizedName: string,
  userId: string,
  supabase: any
): Promise<IngredientMatch[]> {
  try {
    const { data: items } = await supabase
      .from('inventory_items')
      .select('id, item_name, recipe_unit')
      .eq('user_id', userId)
      .eq('is_active', true)
      .or(`
        item_name.ilike.${normalizedName},
        brand.ilike.${normalizedName}
      `)
    
    if (!items) return []
    
    return items
      .filter(item => normalizeIngredientName(item.item_name) === normalizedName)
      .map(item => ({
        inventory_id: item.id,
        inventory_name: item.item_name,
        confidence: 1.0,
        match_type: 'exact' as const
      }))
  } catch (error) {
    console.error('Exact match error:', error)
    return []
  }
}

/**
 * Find fuzzy matches using PostgreSQL similarity functions
 */
async function findFuzzyMatches(
  normalizedName: string,
  userId: string,
  supabase: any,
  minConfidence: number
): Promise<IngredientMatch[]> {
  try {
    // Use PostgreSQL's similarity function with trigram matching
    const { data: items } = await supabase.rpc('fuzzy_search_inventory', {
      search_term: normalizedName,
      user_id_param: userId,
      min_similarity: minConfidence
    })
    
    if (!items) return []
    
    return items.map((item: any) => ({
      inventory_id: item.id,
      inventory_name: item.item_name,
      confidence: Math.min(item.similarity * 1.1, 0.95), // Boost fuzzy matches slightly but cap at 0.95
      match_type: 'fuzzy' as const
    }))
  } catch (error) {
    // Fallback to JavaScript-based fuzzy matching if PostgreSQL function not available
    console.log('PostgreSQL fuzzy search not available, using fallback')
    return await findJavaScriptFuzzyMatches(normalizedName, userId, supabase, minConfidence)
  }
}

/**
 * JavaScript fallback for fuzzy matching
 */
async function findJavaScriptFuzzyMatches(
  normalizedName: string,
  userId: string,
  supabase: any,
  minConfidence: number
): Promise<IngredientMatch[]> {
  try {
    const { data: items } = await supabase
      .from('inventory_items')
      .select('id, item_name, brand, recipe_unit')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (!items) return []
    
    const matches: IngredientMatch[] = []
    
    for (const item of items) {
      const itemName = normalizeIngredientName(item.item_name)
      const brandName = normalizeIngredientName(item.brand || '')
      
      // Calculate similarity with both item name and brand
      const nameSimilarity = calculateStringSimilarity(normalizedName, itemName)
      const brandSimilarity = item.brand ? calculateStringSimilarity(normalizedName, brandName) : 0
      const maxSimilarity = Math.max(nameSimilarity, brandSimilarity)
      
      if (maxSimilarity >= minConfidence) {
        matches.push({
          inventory_id: item.id,
          inventory_name: item.item_name,
          confidence: maxSimilarity * 0.9, // Slightly lower than exact matches
          match_type: 'fuzzy'
        })
      }
    }
    
    return matches.sort((a, b) => b.confidence - a.confidence)
  } catch (error) {
    console.error('JavaScript fuzzy match error:', error)
    return []
  }
}

/**
 * AI-powered semantic matching for complex ingredient names
 */
async function findAIMatches(
  originalName: string,
  normalizedName: string,
  userId: string,
  supabase: any,
  minConfidence: number
): Promise<IngredientMatch[]> {
  try {
    // Get all inventory items for AI matching
    const { data: items } = await supabase
      .from('inventory_items')
      .select('id, item_name, brand, category, recipe_unit')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (!items || items.length === 0) return []
    
    // Prepare prompt for AI matching
    const inventoryList = items.map(item => 
      `${item.id}: ${item.item_name}${item.brand ? ` (${item.brand})` : ''}`
    ).join('\n')
    
    const prompt = `Match the recipe ingredient "${originalName}" to the best inventory item(s) from this list:

${inventoryList}

Rules:
- Consider semantic meaning, not just string similarity
- Match "chicken breast" to "Chicken Breast Fillets" 
- Match "tomatoes" to "Roma Tomatoes" or "Canned Tomatoes"
- Match "flour" to "Plain Flour" or "All-Purpose Flour"
- Ignore cooking preparation terms (diced, chopped, etc.)
- Return up to 3 matches with confidence scores

Return JSON only:
{
  "matches": [
    {
      "inventory_id": "uuid",
      "confidence": 0.85,
      "reasoning": "brief explanation"
    }
  ]
}`
    
    // Call AI API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })
    
    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }
    
    const result = await response.json()
    const content = result.content[0]?.text
    
    if (!content) return []
    
    // Parse AI response
    const aiResult = JSON.parse(content.replace(/```json\n?|```\n?/g, ''))
    const matches: IngredientMatch[] = []
    
    for (const match of aiResult.matches || []) {
      if (match.confidence >= minConfidence) {
        const inventoryItem = items.find(item => item.id === match.inventory_id)
        if (inventoryItem) {
          matches.push({
            inventory_id: match.inventory_id,
            inventory_name: inventoryItem.item_name,
            confidence: Math.min(match.confidence * 0.85, 0.9), // Cap AI matches at 0.9
            match_type: 'ai'
          })
        }
      }
    }
    
    console.log(`🤖 AI found ${matches.length} matches for "${originalName}"`)
    return matches
    
  } catch (error) {
    console.error('AI matching error:', error)
    return []
  }
}

/**
 * Cache successful matches for future use
 */
async function cacheMatches(
  normalizedName: string,
  matches: IngredientMatch[],
  userId: string,
  supabase: any
): Promise<void> {
  try {
    const cacheData = matches.map(match => ({
      user_id: userId,
      ingredient_name_normalized: normalizedName,
      inventory_id: match.inventory_id,
      confidence: match.confidence,
      match_type: match.match_type,
      match_data: {
        unit_conversion: match.unit_conversion,
        cached_at: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    }))
    
    // Upsert cache entries
    const { error } = await supabase
      .from('ingredient_match_cache')
      .upsert(cacheData, {
        onConflict: 'user_id,ingredient_name_normalized,inventory_id'
      })
    
    if (error) {
      console.error('Cache storage error:', error)
    }
  } catch (error) {
    console.error('Cache matches error:', error)
  }
}

/**
 * Calculate string similarity using Jaro-Winkler algorithm
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0
  if (str1.length === 0 || str2.length === 0) return 0.0
  
  // Simple similarity calculation (could be enhanced with proper Jaro-Winkler)
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const matches = longer
    .split('')
    .filter(char => shorter.includes(char))
    .length
  
  return matches / longer.length
}

/**
 * Batch match multiple ingredients efficiently
 */
export async function batchMatchIngredients(
  ingredients: string[],
  options: MatchingOptions
): Promise<{ [ingredientName: string]: IngredientMatch[] }> {
  const results: { [key: string]: IngredientMatch[] } = {}
  
  console.log(`🔄 Batch matching ${ingredients.length} ingredients`)
  
  // Process in parallel batches to avoid overwhelming the API
  const batchSize = 5
  for (let i = 0; i < ingredients.length; i += batchSize) {
    const batch = ingredients.slice(i, i + batchSize)
    
    const batchPromises = batch.map(async ingredient => {
      const matches = await matchIngredientToInventory(ingredient, options)
      return { ingredient, matches }
    })
    
    const batchResults = await Promise.all(batchPromises)
    
    for (const { ingredient, matches } of batchResults) {
      results[ingredient] = matches
    }
  }
  
  console.log(`✅ Batch matching complete: ${Object.keys(results).length} ingredients processed`)
  return results
}

/**
 * Clear cached matches for a user (useful for data updates)
 */
export async function clearMatchCache(userId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('ingredient_match_cache')
    .delete()
    .eq('user_id', userId)
  
  if (error) {
    console.error('Cache clear error:', error)
    throw new Error('Failed to clear match cache')
  }
  
  console.log(`🗑️ Cleared ingredient match cache for user ${userId}`)
}