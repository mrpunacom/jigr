/**
 * Recipe Import from Photo API
 * 
 * Handles OCR-based recipe extraction from uploaded photos
 * with AI-powered ingredient matching and unit conversion
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedClientId } from '@/lib/api-utils'
import { matchIngredientToInventory, batchMatchIngredients } from '@/lib/ingredient-matcher'
import { convertUnit } from '@/lib/unit-converter'

export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const body = await request.json()

    // Validate required parameters
    if (!body.imageUrl && !body.imageData) {
      return NextResponse.json(
        { error: 'Either imageUrl or imageData is required' },
        { status: 400 }
      )
    }

    console.log(`📸 Processing recipe photo import for user ${user_id}`)

    // Process image with OCR (Google Cloud Vision API)
    let extractedText = ''
    
    if (body.imageUrl) {
      extractedText = await extractTextFromUrl(body.imageUrl)
    } else if (body.imageData) {
      extractedText = await extractTextFromBase64(body.imageData)
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text could be extracted from the image' },
        { status: 400 }
      )
    }

    console.log(`📝 Extracted ${extractedText.length} characters from image`)

    // Parse recipe using AI
    const recipeData = await parseRecipeFromText(extractedText)

    if (!recipeData.recipe_name) {
      return NextResponse.json(
        { error: 'Could not identify a recipe name from the image' },
        { status: 400 }
      )
    }

    // Match ingredients to inventory
    const ingredientMatches = await batchMatchIngredients(
      recipeData.ingredients.map(ing => ing.name),
      { userId: user_id, minConfidence: 0.5, maxResults: 3 }
    )

    // Process ingredients with matching and unit conversion
    const processedIngredients = await Promise.all(
      recipeData.ingredients.map(async (ingredient) => {
        const matches = ingredientMatches[ingredient.name] || []
        const bestMatch = matches[0] // Highest confidence match
        
        let convertedAmount = ingredient.amount
        let conversionNotes = null
        
        // Attempt unit conversion if we have a match
        if (bestMatch && ingredient.unit) {
          try {
            const conversion = await convertUnit(
              ingredient.amount,
              ingredient.unit,
              'g', // Standardize to grams for inventory
              user_id,
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
          name: ingredient.name,
          amount: ingredient.amount,
          unit: ingredient.unit,
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

    // Calculate matching statistics
    const matchingStats = {
      total_ingredients: processedIngredients.length,
      matched_ingredients: processedIngredients.filter(ing => ing.best_match_id).length,
      high_confidence_matches: processedIngredients.filter(ing => ing.match_confidence > 0.8).length,
      average_confidence: processedIngredients.reduce((sum, ing) => sum + ing.match_confidence, 0) / processedIngredients.length
    }

    console.log(`🎯 Recipe processing complete: ${matchingStats.matched_ingredients}/${matchingStats.total_ingredients} ingredients matched`)

    return NextResponse.json({
      success: true,
      recipe: {
        recipe_name: recipeData.recipe_name,
        description: recipeData.description,
        servings: recipeData.servings,
        prep_time: recipeData.prep_time,
        cook_time: recipeData.cook_time,
        instructions: recipeData.instructions,
        confidence: recipeData.confidence,
        source: 'photo_ocr'
      },
      ingredients: processedIngredients,
      matching_stats: matchingStats,
      extracted_text: extractedText, // For debugging/review
      recommendations: generatePhotoImportRecommendations(matchingStats, processedIngredients)
    })

  } catch (error) {
    console.error('Recipe photo import error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return NextResponse.json(
          { error: 'OCR service quota exceeded. Please try again later.' },
          { status: 429 }
        )
      }
      
      if (error.message.includes('format') || error.message.includes('image')) {
        return NextResponse.json(
          { error: 'Invalid image format. Please use JPG, PNG, or WEBP.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to process recipe photo' },
      { status: 500 }
    )
  }
}

/**
 * Extract text from image URL using Google Cloud Vision
 */
async function extractTextFromUrl(imageUrl: string): Promise<string> {
  try {
    // Google Cloud Vision API call
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { source: { imageUri: imageUrl } },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
          }]
        })
      }
    )

    if (!response.ok) {
      throw new Error(`OCR API error: ${response.status}`)
    }

    const result = await response.json()
    const textAnnotation = result.responses[0]?.textAnnotations[0]
    
    return textAnnotation?.description || ''
  } catch (error) {
    console.error('OCR extraction error:', error)
    throw new Error('Failed to extract text from image')
  }
}

/**
 * Extract text from base64 image data
 */
async function extractTextFromBase64(imageData: string): Promise<string> {
  try {
    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '')
    
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Data },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
          }]
        })
      }
    )

    if (!response.ok) {
      throw new Error(`OCR API error: ${response.status}`)
    }

    const result = await response.json()
    const textAnnotation = result.responses[0]?.textAnnotations[0]
    
    return textAnnotation?.description || ''
  } catch (error) {
    console.error('OCR extraction error:', error)
    throw new Error('Failed to extract text from image')
  }
}

/**
 * Parse recipe from extracted text using AI
 */
async function parseRecipeFromText(text: string): Promise<any> {
  try {
    const prompt = `Parse this recipe text into structured JSON. Extract the recipe name, ingredients with amounts and units, instructions, and timing information.

Recipe text:
${text}

Return valid JSON only in this format:
{
  "recipe_name": "Recipe Name",
  "description": "Brief description",
  "servings": 4,
  "prep_time": "15 minutes",
  "cook_time": "30 minutes",
  "ingredients": [
    {
      "name": "flour",
      "amount": 2,
      "unit": "cups"
    }
  ],
  "instructions": [
    "Step 1: Do this",
    "Step 2: Do that"
  ],
  "confidence": 0.85
}

Rules:
- Normalize ingredient names (remove adjectives like "fresh", "chopped")
- Convert fractions to decimals (1/2 → 0.5)
- Standardize units (tbsp, tsp, cups, oz, lbs)
- Estimate servings if not specified (default: 4)
- Set confidence based on text clarity and completeness`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
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
    
    if (!content) {
      throw new Error('No content received from AI')
    }

    // Parse AI response
    const cleaned = content.replace(/```json\n?|```\n?/g, '').trim()
    return JSON.parse(cleaned)

  } catch (error) {
    console.error('Recipe parsing error:', error)
    throw new Error('Failed to parse recipe from text')
  }
}

/**
 * Generate recommendations for photo import results
 */
function generatePhotoImportRecommendations(stats: any, ingredients: any[]): string[] {
  const recommendations: string[] = []

  // Matching success rate
  const matchRate = stats.matched_ingredients / stats.total_ingredients
  if (matchRate > 0.8) {
    recommendations.push('Excellent ingredient matching! Ready to save recipe.')
  } else if (matchRate > 0.5) {
    recommendations.push('Good ingredient matching. Review unmatched items before saving.')
  } else {
    recommendations.push('Low ingredient matching. Consider adding missing inventory items first.')
  }

  // Confidence warnings
  const lowConfidenceItems = ingredients.filter(ing => ing.match_confidence < 0.6 && ing.best_match_id)
  if (lowConfidenceItems.length > 0) {
    recommendations.push(`Review ${lowConfidenceItems.length} low-confidence ingredient matches`)
  }

  // Unmatched ingredients
  const unmatchedItems = ingredients.filter(ing => !ing.best_match_id)
  if (unmatchedItems.length > 0) {
    recommendations.push(`Add ${unmatchedItems.length} missing ingredients to inventory: ${unmatchedItems.slice(0, 3).map(i => i.name).join(', ')}${unmatchedItems.length > 3 ? '...' : ''}`)
  }

  // Unit conversion notes
  const convertedItems = ingredients.filter(ing => ing.conversion_notes)
  if (convertedItems.length > 0) {
    recommendations.push(`${convertedItems.length} ingredients had unit conversions applied`)
  }

  // Overall quality
  if (stats.average_confidence > 0.8) {
    recommendations.push('High quality OCR extraction - recipe data looks accurate')
  } else if (stats.average_confidence < 0.6) {
    recommendations.push('OCR quality could be improved - consider retaking photo with better lighting')
  }

  return recommendations
}