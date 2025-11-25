/**
 * Menu Import Validation API
 * 
 * Validates parsed menu items for pricing, duplicates, and business rules.
 * Links menu items to existing recipes when possible.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'
import { validateMenuItems, ValidationContext } from '@/lib/menu/menu-validator'

export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    // Validate request body
    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'items array is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 Validating ${body.items.length} menu items for user ${user_id}`)

    // Get existing menu items for duplicate detection
    const { data: existingMenuItems } = await supabase
      .from('MenuPricing')
      .select('id, item_name, price, category, target_food_cost_pct')
      .eq('user_id', user_id)

    // Get existing recipes for linking
    const { data: existingRecipes } = await supabase
      .from('Recipes')
      .select('id, name, cost_per_portion, recipe_yield')
      .eq('user_id', user_id)

    // Set up validation context
    const validationContext: ValidationContext = {
      userId: user_id,
      restaurantId: client_id,
      existingMenuItems: existingMenuItems || [],
      existingRecipes: existingRecipes || []
    }

    // Validate menu items
    const validationResults = await validateMenuItems(
      body.items,
      validationContext,
      supabase
    )

    // Generate summary statistics
    const { generateValidationSummary } = await import('@/lib/menu/menu-validator')
    const summary = generateValidationSummary(validationResults)

    console.log(`✅ Validation complete: ${summary.good} good, ${summary.warnings} warnings, ${summary.errors} errors`)

    // Store validation results in session for import step
    const validationId = `menu_validation_${user_id}_${Date.now()}`
    
    // Store in temporary table or cache for import step
    const { error: storeError } = await supabase
      .from('import_sessions')
      .insert({
        session_id: validationId,
        user_id: user_id,
        import_type: 'menu',
        validation_data: {
          items: validationResults,
          summary: summary,
          source: body.source || {}
        },
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      })

    if (storeError) {
      console.error('Failed to store validation session:', storeError)
    }

    return NextResponse.json({
      success: true,
      validationId,
      results: validationResults,
      summary: {
        total: summary.total,
        good: summary.good,
        warnings: summary.warnings,
        errors: summary.errors,
        recipesLinked: summary.recipes_linked,
        avgConfidence: Math.round(summary.avg_confidence * 100),
        commonIssues: summary.common_issues
      },
      recommendations: generateRecommendations(summary, validationResults)
    })

  } catch (error) {
    console.error('Menu validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate menu items' },
      { status: 500 }
    )
  }
}

/**
 * Generate actionable recommendations based on validation results
 */
function generateRecommendations(summary: any, results: any[]): string[] {
  const recommendations: string[] = []

  // Low confidence items
  const lowConfidenceItems = results.filter(r => r.confidence < 0.7).length
  if (lowConfidenceItems > 0) {
    recommendations.push(`Review ${lowConfidenceItems} items with low confidence scores`)
  }

  // Pricing issues
  const pricingErrors = results.filter(r => 
    r.errors.some(e => e.toLowerCase().includes('price'))
  ).length
  if (pricingErrors > 0) {
    recommendations.push(`Fix pricing issues in ${pricingErrors} items`)
  }

  // High food cost warnings
  const highCostItems = results.filter(r =>
    r.warnings.some(w => w.toLowerCase().includes('food cost'))
  ).length
  if (highCostItems > 0) {
    recommendations.push(`Review food cost percentages for ${highCostItems} items`)
  }

  // Duplicate warnings
  const duplicateItems = results.filter(r =>
    r.warnings.some(w => w.toLowerCase().includes('duplicate') || w.toLowerCase().includes('similar'))
  ).length
  if (duplicateItems > 0) {
    recommendations.push(`Check for potential duplicates in ${duplicateItems} items`)
  }

  // Recipe linking opportunities
  const unlinkedItems = results.filter(r => !r.recipe_id).length
  if (unlinkedItems > summary.total * 0.3) {
    recommendations.push(`Consider creating recipes for ${unlinkedItems} unlinked menu items`)
  }

  // Overall success rate
  if (summary.errors / summary.total > 0.2) {
    recommendations.push('High error rate - consider reviewing data format and trying again')
  } else if (summary.good / summary.total > 0.8) {
    recommendations.push('High quality data - ready for import!')
  }

  return recommendations
}