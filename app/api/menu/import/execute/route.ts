/**
 * Menu Import Execution API
 * 
 * Executes validated menu import by saving items to the database
 * and handling any conflicts or updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const body = await request.json()

    // Validate request body
    if (!body.validationId && !body.items) {
      return NextResponse.json(
        { error: 'Either validationId or items array is required' },
        { status: 400 }
      )
    }

    let itemsToImport = body.items
    let validationData = null

    // If validationId provided, retrieve from session
    if (body.validationId) {
      const { data: session } = await supabase
        .from('import_sessions')
        .select('validation_data')
        .eq('session_id', body.validationId)
        .eq('user_id', user_id)
        .eq('import_type', 'menu')
        .single()

      if (!session) {
        return NextResponse.json(
          { error: 'Validation session not found or expired' },
          { status: 404 }
        )
      }

      validationData = session.validation_data
      itemsToImport = validationData.items
    }

    // Filter out items with errors unless forced
    const importableItems = body.force ? itemsToImport : 
      itemsToImport.filter((item: any) => item.validation_status !== 'error')

    console.log(`📥 Importing ${importableItems.length} menu items for user ${user_id}`)

    const results = {
      imported: [] as any[],
      updated: [] as any[],
      skipped: [] as any[],
      errors: [] as any[]
    }

    // Process each item
    for (const item of importableItems) {
      try {
        // Check if item already exists
        const { data: existingItem } = await supabase
          .from('MenuPricing')
          .select('id, price, target_food_cost_pct')
          .eq('user_id', user_id)
          .eq('item_name', item.item_name)
          .single()

        const menuItemData = {
          user_id,
          item_name: item.item_name,
          category: item.category || 'Uncategorized',
          price: item.price,
          target_food_cost_pct: item.target_food_cost_pct,
          description: item.description,
          recipe_id: item.recipe_id,
          actual_food_cost_pct: item.actual_food_cost_pct,
          import_confidence: item.confidence,
          import_source: 'google_sheets',
          import_notes: item.validation_message || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        if (existingItem) {
          // Update existing item
          const updateData = {
            ...menuItemData,
            updated_at: new Date().toISOString()
          }
          delete updateData.created_at

          const { data: updatedItem, error: updateError } = await supabase
            .from('MenuPricing')
            .update(updateData)
            .eq('id', existingItem.id)
            .select()
            .single()

          if (updateError) {
            results.errors.push({
              item: item.item_name,
              error: updateError.message
            })
          } else {
            results.updated.push({
              ...updatedItem,
              previousPrice: existingItem.price,
              priceChange: updatedItem.price - existingItem.price
            })
          }
        } else {
          // Create new item
          const { data: newItem, error: insertError } = await supabase
            .from('MenuPricing')
            .insert(menuItemData)
            .select()
            .single()

          if (insertError) {
            results.errors.push({
              item: item.item_name,
              error: insertError.message
            })
          } else {
            results.imported.push(newItem)
          }
        }

      } catch (itemError) {
        console.error(`Error processing item ${item.item_name}:`, itemError)
        results.errors.push({
          item: item.item_name,
          error: itemError instanceof Error ? itemError.message : 'Unknown error'
        })
      }
    }

    // Clean up validation session if used
    if (body.validationId) {
      await supabase
        .from('import_sessions')
        .delete()
        .eq('session_id', body.validationId)
        .eq('user_id', user_id)
    }

    // Log import summary
    console.log(`✅ Menu import complete: ${results.imported.length} new, ${results.updated.length} updated, ${results.errors.length} errors`)

    // Create import audit log
    const auditData = {
      user_id,
      import_type: 'menu',
      source_type: 'google_sheets',
      items_processed: importableItems.length,
      items_imported: results.imported.length,
      items_updated: results.updated.length,
      items_failed: results.errors.length,
      validation_summary: validationData?.summary || null,
      import_metadata: {
        source: validationData?.source || body.source || {},
        force_import: body.force || false,
        timestamp: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    }

    const { error: auditError } = await supabase
      .from('import_audit_log')
      .insert(auditData)

    if (auditError) {
      console.error('Failed to create audit log:', auditError)
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: importableItems.length,
        imported: results.imported.length,
        updated: results.updated.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      results,
      recommendations: generatePostImportRecommendations(results)
    })

  } catch (error) {
    console.error('Menu import execution error:', error)
    return NextResponse.json(
      { error: 'Failed to execute menu import' },
      { status: 500 }
    )
  }
}

/**
 * Generate recommendations after import completion
 */
function generatePostImportRecommendations(results: any): string[] {
  const recommendations: string[] = []

  if (results.imported.length > 0) {
    recommendations.push(`Successfully imported ${results.imported.length} new menu items`)
  }

  if (results.updated.length > 0) {
    recommendations.push(`Updated ${results.updated.length} existing menu items`)
    
    // Check for significant price changes
    const significantChanges = results.updated.filter((item: any) => 
      Math.abs(item.priceChange || 0) > item.price * 0.1 // More than 10% change
    ).length
    
    if (significantChanges > 0) {
      recommendations.push(`${significantChanges} items had significant price changes - review pricing strategy`)
    }
  }

  if (results.errors.length > 0) {
    recommendations.push(`${results.errors.length} items failed to import - check error details`)
  }

  // Success rate recommendations
  const successRate = (results.imported.length + results.updated.length) / 
    (results.imported.length + results.updated.length + results.errors.length)

  if (successRate >= 0.9) {
    recommendations.push('Excellent import success rate! Consider setting up regular imports.')
  } else if (successRate < 0.7) {
    recommendations.push('Consider reviewing data format to improve import success rate')
  }

  if (results.imported.length > 0 || results.updated.length > 0) {
    recommendations.push('Navigate to Menu Pricing to review and optimize your menu')
    recommendations.push('Consider running Menu Engineering analysis for profitability insights')
  }

  return recommendations
}