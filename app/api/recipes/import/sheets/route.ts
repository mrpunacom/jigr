/**
 * Recipe Import from Google Sheets API
 * 
 * Handles parsing recipe data from Google Sheets with intelligent
 * ingredient matching and unit conversion
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedClientId } from '@/lib/api-utils'
import { getValidTokens, readSheetData, detectDataRange } from '@/lib/google-sheets'
import { batchMatchIngredients } from '@/lib/ingredient-matcher'
import { convertUnit, batchConvertUnits } from '@/lib/unit-converter'

export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const body = await request.json()

    // Validate required parameters
    if (!body.spreadsheetId || !body.sheetName) {
      return NextResponse.json(
        { error: 'spreadsheetId and sheetName are required' },
        { status: 400 }
      )
    }

    // Get valid OAuth tokens for user
    const tokens = await getValidTokens(user_id)
    if (!tokens) {
      return NextResponse.json(
        { error: 'Google authentication required. Please reconnect your Google account.' },
        { status: 401 }
      )
    }

    console.log(`📊 Parsing recipe data from sheet: ${body.sheetName} for user ${user_id}`)

    // Detect data range or use provided range
    let dataRange = body.range
    if (!dataRange) {
      const rangeInfo = await detectDataRange(
        body.spreadsheetId,
        body.sheetName,
        tokens.access_token,
        tokens.refresh_token
      )
      dataRange = rangeInfo.range
    }

    // Read sheet data
    const sheetData = await readSheetData(
      body.spreadsheetId,
      body.sheetName,
      dataRange,
      tokens.access_token,
      tokens.refresh_token
    )

    if (!sheetData || sheetData.length === 0) {
      return NextResponse.json(
        { error: 'No data found in the selected sheet range' },
        { status: 400 }
      )
    }

    console.log(`📋 Processing ${sheetData.length} rows from spreadsheet`)

    // Parse recipe data based on sheet format
    const parseResult = await parseRecipeSheet(sheetData, body.format || 'auto')

    if (parseResult.recipes.length === 0) {
      return NextResponse.json(
        { error: 'No valid recipes found in the spreadsheet' },
        { status: 400 }
      )
    }

    // Process all recipes with ingredient matching and conversions
    const processedRecipes = await Promise.all(
      parseResult.recipes.map(recipe => processRecipeIngredients(recipe, user_id))
    )

    // Generate summary statistics
    const summary = generateRecipeImportSummary(processedRecipes)

    console.log(`✅ Processed ${processedRecipes.length} recipes with ${summary.totalIngredients} total ingredients`)

    return NextResponse.json({
      success: true,
      recipes: processedRecipes,
      summary,
      source: {
        spreadsheetId: body.spreadsheetId,
        sheetName: body.sheetName,
        range: dataRange,
        rowCount: sheetData.length,
        detectedFormat: parseResult.format
      },
      recommendations: generateSheetImportRecommendations(summary, parseResult)
    })

  } catch (error) {
    console.error('Recipe sheets parsing error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        return NextResponse.json(
          { error: 'Permission denied. Please ensure you have access to this spreadsheet.' },
          { status: 403 }
        )
      }
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Spreadsheet or sheet not found. Please check the selection.' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to parse recipe data from Google Sheets' },
      { status: 500 }
    )
  }
}

/**
 * Parse recipe data from sheet rows based on detected format
 */
async function parseRecipeSheet(rows: string[][], format: string = 'auto'): Promise<{
  recipes: any[]
  format: string
  confidence: number
}> {
  if (rows.length === 0) return { recipes: [], format: 'unknown', confidence: 0 }

  const headers = rows[0].map(h => h.toLowerCase().trim())
  const dataRows = rows.slice(1).filter(row => row.some(cell => cell && cell.trim()))

  // Detect format if auto
  const detectedFormat = format === 'auto' ? detectRecipeFormat(headers, dataRows) : format

  switch (detectedFormat) {
    case 'recipe_list':
      return parseRecipeListFormat(headers, dataRows)
    case 'ingredient_matrix':
      return parseIngredientMatrixFormat(headers, dataRows)
    case 'recipe_cards':
      return parseRecipeCardsFormat(headers, dataRows)
    default:
      return parseGenericRecipeFormat(headers, dataRows)
  }
}

/**
 * Detect the recipe sheet format
 */
function detectRecipeFormat(headers: string[], dataRows: string[][]): string {
  const headerText = headers.join(' ').toLowerCase()
  
  // Recipe list format: one row per recipe
  if (headers.includes('recipe name') || headers.includes('name')) {
    if (headers.includes('ingredients') || headers.includes('ingredient list')) {
      return 'recipe_list'
    }
  }
  
  // Ingredient matrix: recipes as columns, ingredients as rows
  if (dataRows.length > 10 && headers.length > 3) {
    const firstColumn = dataRows.map(row => row[0]?.toLowerCase() || '')
    const ingredientWords = ['flour', 'sugar', 'salt', 'oil', 'butter', 'egg', 'milk']
    const ingredientMatches = firstColumn.filter(cell => 
      ingredientWords.some(word => cell.includes(word))
    ).length
    
    if (ingredientMatches > 3) {
      return 'ingredient_matrix'
    }
  }
  
  // Recipe cards format: multiple rows per recipe
  if (headerText.includes('step') || headerText.includes('instruction')) {
    return 'recipe_cards'
  }
  
  return 'generic'
}

/**
 * Parse recipe list format (one recipe per row)
 */
function parseRecipeListFormat(headers: string[], dataRows: string[][]): {
  recipes: any[]
  format: string
  confidence: number
} {
  const recipes: any[] = []
  
  // Find column indices
  const nameIndex = findHeaderIndex(headers, ['recipe name', 'name', 'recipe'])
  const ingredientsIndex = findHeaderIndex(headers, ['ingredients', 'ingredient list', 'recipe ingredients'])
  const instructionsIndex = findHeaderIndex(headers, ['instructions', 'directions', 'method', 'steps'])
  const servingsIndex = findHeaderIndex(headers, ['servings', 'serves', 'portions', 'yield'])
  const timeIndex = findHeaderIndex(headers, ['time', 'prep time', 'cook time', 'total time'])
  
  for (const row of dataRows) {
    if (!row[nameIndex] || !row[ingredientsIndex]) continue
    
    const recipe = {
      recipe_name: row[nameIndex]?.trim(),
      servings: parseNumber(row[servingsIndex]) || 4,
      prep_time: row[timeIndex]?.trim() || null,
      instructions: parseInstructions(row[instructionsIndex] || ''),
      ingredients: parseIngredientList(row[ingredientsIndex] || ''),
      confidence: 0.9,
      source: 'google_sheets'
    }
    
    if (recipe.recipe_name && recipe.ingredients.length > 0) {
      recipes.push(recipe)
    }
  }
  
  return { recipes, format: 'recipe_list', confidence: 0.9 }
}

/**
 * Parse ingredient matrix format (ingredients as rows, recipes as columns)
 */
function parseIngredientMatrixFormat(headers: string[], dataRows: string[][]): {
  recipes: any[]
  format: string
  confidence: number
} {
  const recipes: any[] = []
  
  // Skip first column (ingredient names), treat others as recipes
  for (let colIndex = 1; colIndex < headers.length; colIndex++) {
    const recipeName = headers[colIndex]?.trim()
    if (!recipeName) continue
    
    const ingredients: any[] = []
    
    for (const row of dataRows) {
      const ingredientName = row[0]?.trim()
      const amount = row[colIndex]?.trim()
      
      if (ingredientName && amount && amount !== '0' && amount !== '-') {
        const parsed = parseIngredientAmount(amount)
        ingredients.push({
          name: ingredientName.toLowerCase(),
          amount: parsed.amount,
          unit: parsed.unit
        })
      }
    }
    
    if (ingredients.length > 0) {
      recipes.push({
        recipe_name: recipeName,
        servings: 4,
        ingredients,
        confidence: 0.8,
        source: 'google_sheets'
      })
    }
  }
  
  return { recipes, format: 'ingredient_matrix', confidence: 0.8 }
}

/**
 * Parse recipe cards format (multiple rows per recipe)
 */
function parseRecipeCardsFormat(headers: string[], dataRows: string[][]): {
  recipes: any[]
  format: string
  confidence: number
} {
  // This would handle more complex multi-row recipe formats
  // For now, fall back to generic parsing
  return parseGenericRecipeFormat(headers, dataRows)
}

/**
 * Parse generic recipe format using AI
 */
function parseGenericRecipeFormat(headers: string[], dataRows: string[][]): {
  recipes: any[]
  format: string
  confidence: number
} {
  // Convert to text and use AI parsing as fallback
  const sheetText = [headers, ...dataRows]
    .map(row => row.join('\t'))
    .join('\n')
  
  // For now, return empty - this could be enhanced with AI parsing
  return { recipes: [], format: 'generic', confidence: 0.3 }
}

/**
 * Process recipe ingredients with matching and conversions
 */
async function processRecipeIngredients(recipe: any, userId: string): Promise<any> {
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return { ...recipe, processedIngredients: [], matchingStats: {} }
  }
  
  // Match ingredients to inventory
  const ingredientNames = recipe.ingredients.map((ing: any) => ing.name)
  const ingredientMatches = await batchMatchIngredients(ingredientNames, {
    userId,
    minConfidence: 0.5,
    maxResults: 3
  })
  
  // Process each ingredient
  const processedIngredients = await Promise.all(
    recipe.ingredients.map(async (ingredient: any) => {
      const matches = ingredientMatches[ingredient.name] || []
      const bestMatch = matches[0]
      
      let convertedAmount = ingredient.amount
      let conversionNotes = null
      
      // Attempt unit conversion if we have a match
      if (bestMatch && ingredient.unit) {
        try {
          const conversion = await convertUnit(
            ingredient.amount,
            ingredient.unit,
            'g', // Standardize to grams
            userId,
            ingredient.name
          )
          
          if (conversion.success) {
            convertedAmount = conversion.converted_amount
            conversionNotes = `Converted from ${ingredient.amount} ${ingredient.unit} to ${convertedAmount.toFixed(2)} g`
          }
        } catch (conversionError) {
          console.log(`Unit conversion failed for ${ingredient.name}:`, conversionError)
        }
      }
      
      return {
        ...ingredient,
        converted_amount: convertedAmount,
        conversion_notes: conversionNotes,
        matches: matches.map(match => ({
          inventory_id: match.inventory_id,
          inventory_name: match.inventory_name,
          confidence: match.confidence,
          match_type: match.match_type
        })),
        best_match_id: bestMatch?.inventory_id || null,
        match_confidence: bestMatch?.confidence || 0
      }
    })
  )
  
  // Calculate matching stats
  const matchingStats = {
    total_ingredients: processedIngredients.length,
    matched_ingredients: processedIngredients.filter(ing => ing.best_match_id).length,
    high_confidence_matches: processedIngredients.filter(ing => ing.match_confidence > 0.8).length,
    average_confidence: processedIngredients.reduce((sum, ing) => sum + ing.match_confidence, 0) / processedIngredients.length
  }
  
  return {
    ...recipe,
    processedIngredients,
    matchingStats
  }
}

/**
 * Utility functions for parsing
 */
function findHeaderIndex(headers: string[], searchTerms: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase()
    if (searchTerms.some(term => header.includes(term))) {
      return i
    }
  }
  return -1
}

function parseNumber(value: any): number | null {
  if (!value) return null
  const num = parseFloat(String(value).replace(/[^\d.-]/g, ''))
  return isNaN(num) ? null : num
}

function parseInstructions(text: string): string[] {
  if (!text) return []
  return text
    .split(/\n|\.(?=\s[A-Z])/)
    .map(step => step.trim())
    .filter(step => step.length > 10)
}

function parseIngredientList(text: string): any[] {
  if (!text) return []
  
  return text
    .split(/\n|;|,/)
    .map(line => {
      const parsed = parseIngredientAmount(line.trim())
      return {
        name: parsed.name,
        amount: parsed.amount,
        unit: parsed.unit
      }
    })
    .filter(ing => ing.name)
}

function parseIngredientAmount(text: string): { name: string; amount: number; unit: string } {
  if (!text) return { name: '', amount: 0, unit: '' }
  
  // Try to extract amount and unit from text like "2 cups flour"
  const match = text.match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?\s+(.+)/i)
  
  if (match) {
    return {
      amount: parseFloat(match[1]),
      unit: match[2] || '',
      name: match[3].toLowerCase().trim()
    }
  }
  
  return { name: text.toLowerCase().trim(), amount: 0, unit: '' }
}

function generateRecipeImportSummary(recipes: any[]): any {
  const totalIngredients = recipes.reduce((sum, recipe) => sum + (recipe.processedIngredients?.length || 0), 0)
  const totalMatched = recipes.reduce((sum, recipe) => 
    sum + (recipe.matchingStats?.matched_ingredients || 0), 0)
  
  return {
    totalRecipes: recipes.length,
    totalIngredients,
    totalMatched,
    averageMatchRate: totalIngredients > 0 ? totalMatched / totalIngredients : 0,
    recipesWithHighMatching: recipes.filter(r => 
      (r.matchingStats?.matched_ingredients || 0) / (r.matchingStats?.total_ingredients || 1) > 0.8
    ).length
  }
}

function generateSheetImportRecommendations(summary: any, parseResult: any): string[] {
  const recommendations: string[] = []
  
  if (summary.totalRecipes === 0) {
    recommendations.push('No recipes found - check sheet format and data')
    return recommendations
  }
  
  if (summary.averageMatchRate > 0.8) {
    recommendations.push('Excellent ingredient matching across all recipes!')
  } else if (summary.averageMatchRate > 0.5) {
    recommendations.push('Good ingredient matching - review unmatched items')
  } else {
    recommendations.push('Low ingredient matching - consider adding missing inventory items')
  }
  
  recommendations.push(`Successfully processed ${summary.totalRecipes} recipe(s)`)
  recommendations.push(`${summary.recipesWithHighMatching} recipe(s) have high ingredient match rates`)
  
  if (parseResult.format === 'ingredient_matrix') {
    recommendations.push('Matrix format detected - excellent for bulk recipe management')
  }
  
  return recommendations
}

// GET endpoint to list user's spreadsheets (reuse from menu import)
export async function GET(request: NextRequest) {
  try {
    const { user_id } = await getAuthenticatedClientId()
    const { listSpreadsheets, getValidTokens } = await import('@/lib/google-sheets')

    const tokens = await getValidTokens(user_id)
    if (!tokens) {
      return NextResponse.json(
        { error: 'Google authentication required' },
        { status: 401 }
      )
    }

    const spreadsheets = await listSpreadsheets(tokens.access_token, tokens.refresh_token)

    return NextResponse.json({
      success: true,
      spreadsheets: spreadsheets.map(sheet => ({
        id: sheet.id,
        name: sheet.name,
        modifiedTime: sheet.modifiedTime,
        webViewLink: sheet.webViewLink
      }))
    })

  } catch (error) {
    console.error('Recipe spreadsheets list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spreadsheets' },
      { status: 500 }
    )
  }
}