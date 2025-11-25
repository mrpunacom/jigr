/**
 * Recipe Import from URL API
 * 
 * Handles recipe extraction from websites with AI-powered parsing
 * and intelligent ingredient matching to inventory
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
    if (!body.url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(body.url)
    } catch (urlError) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    console.log(`🌐 Processing recipe URL import: ${body.url} for user ${user_id}`)

    // Fetch and extract content from URL
    const websiteContent = await fetchWebsiteContent(body.url)
    
    if (!websiteContent || websiteContent.length < 100) {
      return NextResponse.json(
        { error: 'Could not extract sufficient content from the URL' },
        { status: 400 }
      )
    }

    console.log(`📄 Extracted ${websiteContent.length} characters from website`)

    // Parse recipe using AI with website-specific prompts
    const recipeData = await parseRecipeFromWebsite(websiteContent, body.url)

    if (!recipeData.recipe_name) {
      return NextResponse.json(
        { error: 'Could not identify a recipe on this webpage' },
        { status: 400 }
      )
    }

    // Match ingredients to inventory
    const ingredientMatches = await batchMatchIngredients(
      recipeData.ingredients.map((ing: any) => ing.name),
      { userId: user_id, minConfidence: 0.5, maxResults: 3 }
    )

    // Process ingredients with matching and unit conversion
    const processedIngredients = await Promise.all(
      recipeData.ingredients.map(async (ingredient: any) => {
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
          preparation: ingredient.preparation || null,
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

    console.log(`🎯 Recipe URL processing complete: ${matchingStats.matched_ingredients}/${matchingStats.total_ingredients} ingredients matched`)

    return NextResponse.json({
      success: true,
      recipe: {
        recipe_name: recipeData.recipe_name,
        description: recipeData.description,
        servings: recipeData.servings,
        prep_time: recipeData.prep_time,
        cook_time: recipeData.cook_time,
        total_time: recipeData.total_time,
        difficulty: recipeData.difficulty,
        cuisine: recipeData.cuisine,
        instructions: recipeData.instructions,
        notes: recipeData.notes,
        confidence: recipeData.confidence,
        source: 'website_url',
        source_url: body.url,
        author: recipeData.author,
        website_name: recipeData.website_name
      },
      ingredients: processedIngredients,
      matching_stats: matchingStats,
      recommendations: generateUrlImportRecommendations(matchingStats, processedIngredients, body.url)
    })

  } catch (error) {
    console.error('Recipe URL import error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('network')) {
        return NextResponse.json(
          { error: 'Website took too long to respond. Please try again.' },
          { status: 408 }
        )
      }
      
      if (error.message.includes('blocked') || error.message.includes('403')) {
        return NextResponse.json(
          { error: 'Website blocked access. This site may not allow recipe scraping.' },
          { status: 403 }
        )
      }
      
      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json(
          { error: 'Recipe page not found. Please check the URL.' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to import recipe from URL' },
      { status: 500 }
    )
  }
}

/**
 * Fetch and extract content from website URL
 */
async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    // First try direct fetch
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'JiGRApp Recipe Importer 1.0 (https://jigr.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000 // 15 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    
    // Extract meaningful content from HTML
    const cleanedContent = extractRecipeContent(html)
    
    return cleanedContent
  } catch (error) {
    console.error('Website fetch error:', error)
    throw new Error(`Failed to fetch website content: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Extract recipe-relevant content from HTML
 */
function extractRecipeContent(html: string): string {
  try {
    // Remove script and style tags
    let content = html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<noscript[^>]*>.*?<\/noscript>/gis, '')
    
    // Look for structured data (JSON-LD)
    const jsonLdMatch = content.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis)
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[0].replace(/<script[^>]*>|<\/script>/gi, ''))
        if (jsonData['@type'] === 'Recipe' || jsonData.recipeIngredient) {
          return JSON.stringify(jsonData, null, 2)
        }
      } catch (jsonError) {
        // Continue with HTML parsing if JSON-LD fails
      }
    }
    
    // Extract content from likely recipe containers
    const recipeSelectors = [
      'recipe',
      'recipe-card',
      'recipe-content',
      'ingredients',
      'instructions',
      'directions',
      'method',
      'preparation'
    ]
    
    let extractedText = ''
    
    // Simple HTML tag removal for content extraction
    content = content.replace(/<[^>]+>/g, ' ')
    
    // Clean up whitespace
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim()
    
    // Look for recipe-specific patterns
    const recipePatterns = [
      /ingredients?:?\s*[\n\r]?(.*?)(?:instructions?|directions?|method|preparation)/is,
      /(?:instructions?|directions?|method|preparation):?\s*[\n\r]?(.*?)(?:notes?|tips?|$)/is
    ]
    
    for (const pattern of recipePatterns) {
      const match = content.match(pattern)
      if (match) {
        extractedText += match[0] + '\n\n'
      }
    }
    
    // If no specific patterns found, return first portion of content
    if (extractedText.length < 100) {
      extractedText = content.substring(0, 3000)
    }
    
    return extractedText
  } catch (error) {
    console.error('Content extraction error:', error)
    return html.substring(0, 2000) // Fallback to raw HTML snippet
  }
}

/**
 * Parse recipe from website content using AI
 */
async function parseRecipeFromWebsite(content: string, url: string): Promise<any> {
  try {
    const websiteName = new URL(url).hostname.replace('www.', '')
    
    const prompt = `Parse this recipe content from ${websiteName} into structured JSON. The content may include HTML, JSON-LD structured data, or plain text.

Website content:
${content}

Extract and return valid JSON only in this format:
{
  "recipe_name": "Recipe Name",
  "description": "Brief description",
  "servings": 4,
  "prep_time": "15 minutes",
  "cook_time": "30 minutes", 
  "total_time": "45 minutes",
  "difficulty": "Easy",
  "cuisine": "Italian",
  "author": "Chef Name",
  "website_name": "${websiteName}",
  "ingredients": [
    {
      "name": "flour",
      "amount": 2,
      "unit": "cups",
      "preparation": "sifted"
    }
  ],
  "instructions": [
    "Step 1: Do this",
    "Step 2: Do that"
  ],
  "notes": "Additional tips or notes",
  "confidence": 0.85
}

Rules:
- Extract from JSON-LD structured data if present (highest priority)
- Normalize ingredient names (remove adjectives like "fresh", "organic")
- Convert fractions to decimals (1/2 → 0.5) 
- Standardize units (tbsp, tsp, cups, oz, lbs)
- Separate ingredient name from preparation (e.g., "diced tomatoes" → name: "tomatoes", preparation: "diced")
- Estimate servings if not specified
- Clean and number instruction steps
- Set confidence based on data quality and completeness`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
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
    const content_response = result.content[0]?.text
    
    if (!content_response) {
      throw new Error('No content received from AI')
    }

    // Parse AI response
    const cleaned = content_response.replace(/```json\n?|```\n?/g, '').trim()
    const parsedData = JSON.parse(cleaned)
    
    // Validate essential fields
    if (!parsedData.recipe_name || !parsedData.ingredients || parsedData.ingredients.length === 0) {
      throw new Error('Invalid recipe data - missing name or ingredients')
    }
    
    return parsedData

  } catch (error) {
    console.error('Website recipe parsing error:', error)
    throw new Error('Failed to parse recipe from website content')
  }
}

/**
 * Generate recommendations for URL import results
 */
function generateUrlImportRecommendations(stats: any, ingredients: any[], url: string): string[] {
  const recommendations: string[] = []
  const websiteName = new URL(url).hostname.replace('www.', '')

  // Matching success rate
  const matchRate = stats.matched_ingredients / stats.total_ingredients
  if (matchRate > 0.8) {
    recommendations.push('Excellent ingredient matching! Ready to save recipe.')
  } else if (matchRate > 0.5) {
    recommendations.push('Good ingredient matching. Review unmatched items before saving.')
  } else {
    recommendations.push('Low ingredient matching. Consider adding missing inventory items first.')
  }

  // Website-specific recommendations
  if (websiteName.includes('allrecipes') || websiteName.includes('foodnetwork')) {
    recommendations.push('Popular recipe site detected - data quality should be high')
  } else if (websiteName.includes('blog') || websiteName.includes('wordpress')) {
    recommendations.push('Blog site detected - review extracted data for accuracy')
  }

  // Confidence warnings
  const lowConfidenceItems = ingredients.filter(ing => ing.match_confidence < 0.6 && ing.best_match_id)
  if (lowConfidenceItems.length > 0) {
    recommendations.push(`Review ${lowConfidenceItems.length} low-confidence ingredient matches`)
  }

  // Unmatched ingredients
  const unmatchedItems = ingredients.filter(ing => !ing.best_match_id)
  if (unmatchedItems.length > 0) {
    const unmatchedNames = unmatchedItems.slice(0, 3).map(i => i.name).join(', ')
    recommendations.push(`Add ${unmatchedItems.length} missing ingredients to inventory: ${unmatchedNames}${unmatchedItems.length > 3 ? '...' : ''}`)
  }

  // Preparation notes
  const withPreparation = ingredients.filter(ing => ing.preparation)
  if (withPreparation.length > 0) {
    recommendations.push(`${withPreparation.length} ingredients include preparation notes`)
  }

  // Unit conversion notes
  const convertedItems = ingredients.filter(ing => ing.conversion_notes)
  if (convertedItems.length > 0) {
    recommendations.push(`${convertedItems.length} ingredients had unit conversions applied`)
  }

  // Source attribution
  recommendations.push(`Remember to credit ${websiteName} as the recipe source`)

  return recommendations
}