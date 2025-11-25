/**
 * JiGR Stock Container Assignment API - Smart Container Assignment Logic
 * 
 * Handles automatic and manual assignment of containers to inventory items for counting
 * POST /api/stock/containers/assign - Assign container to item for counting session
 * POST /api/stock/containers/unassign - Release container after counting
 * GET /api/stock/containers/assign/recommendations - Get container recommendations for item
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getAuthenticatedClientId, 
  errorResponse, 
  successResponse,
  validateRequired,
  isValidContainerBarcode,
  logApiRequest,
  calculateDaysBetween
} from '@/lib/api-utils'
import type { ContainerInstance, InventoryItem } from '@/types/stock'

// ============================================================================
// POST /api/stock/containers/assign - Assign Container to Item for Counting
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { client_id, user_id, supabase } = await getAuthenticatedClientId()
    const body = await request.json()
    
    // Log the request for debugging
    logApiRequest('/api/stock/containers/assign', 'POST', client_id, user_id, { 
      container_barcode: body.container_barcode,
      inventory_item_id: body.inventory_item_id
    })
    
    // Validate required fields
    const validationError = validateRequired(body, ['container_barcode', 'inventory_item_id'])
    if (validationError) {
      return errorResponse(validationError, 400)
    }
    
    // Validate container barcode format
    if (!isValidContainerBarcode(body.container_barcode)) {
      return errorResponse('Invalid container barcode format. Expected: JIGR-C-XXXXX', 400)
    }
    
    // Get container details
    const { data: container, error: containerError } = await supabase
      .from('container_instances')
      .select(`
        *,
        container_type:container_tare_weights(
          id,
          container_type,
          typical_weight_grams,
          category,
          description
        )
      `)
      .eq('container_barcode', body.container_barcode)
      .eq('client_id', client_id)
      .eq('is_active', true)
      .single()
    
    if (containerError || !container) {
      if (containerError?.code === 'PGRST116') {
        return errorResponse('Container not found or inactive', 404)
      }
      return errorResponse(`Error finding container: ${containerError?.message}`, 500)
    }
    
    // Get inventory item details
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', body.inventory_item_id)
      .eq('client_id', client_id)
      .eq('is_active', true)
      .single()
    
    if (itemError || !item) {
      if (itemError?.code === 'PGRST116') {
        return errorResponse('Inventory item not found or inactive', 404)
      }
      return errorResponse(`Error finding inventory item: ${itemError?.message}`, 500)
    }
    
    // Validate that item supports weight counting
    if (!item.supports_weight_counting) {
      return errorResponse('This inventory item does not support weight-based counting', 400)
    }
    
    // Validate container category matches item requirements
    if (item.default_container_category && 
        container.container_type?.category !== item.default_container_category) {
      return errorResponse(
        `Container category '${container.container_type?.category}' does not match item requirement '${item.default_container_category}'`,
        400
      )
    }
    
    // Check if container needs re-verification
    if (container.needs_reweigh) {
      return errorResponse(
        'Container requires tare weight re-verification before use. Please verify container weight first.',
        400
      )
    }
    
    // Check verification status
    if (container.verification_status === 'overdue') {
      return errorResponse(
        'Container verification is overdue. Please re-verify tare weight before use.',
        400
      )
    }
    
    // Check if container is already in use (optional warning)
    const { data: recentUsage } = await supabase
      .from('inventory_counts')
      .select('id, count_date, inventory_item_id')
      .eq('container_instance_id', container.id)
      .eq('client_id', client_id)
      .gte('count_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .order('created_at', { ascending: false })
      .limit(1)
    
    let warningMessage = null
    if (recentUsage && recentUsage.length > 0) {
      const recentCount = recentUsage[0]
      if (recentCount.inventory_item_id !== body.inventory_item_id) {
        warningMessage = 'This container was recently used for a different item. Ensure it has been properly cleaned.'
      }
    }
    
    // Create assignment record (for tracking purposes)
    const assignmentData = {
      client_id,
      container_instance_id: container.id,
      inventory_item_id: body.inventory_item_id,
      assigned_by_user_id: user_id,
      assigned_at: new Date().toISOString(),
      session_notes: body.session_notes?.trim() || null
    }
    
    // We don't create a permanent assignment record, but we update usage tracking
    const { error: updateError } = await supabase
      .from('container_instances')
      .update({
        last_used_date: new Date().toISOString(),
        times_used: container.times_used + 1
      })
      .eq('id', container.id)
      .eq('client_id', client_id)
    
    if (updateError) {
      console.error('Error updating container usage:', updateError)
      return errorResponse('Failed to assign container', 500)
    }
    
    // Return assignment confirmation
    const response = {
      container: {
        ...container,
        container_type_name: container.container_type?.container_type,
        container_category: container.container_type?.category
      },
      item: {
        id: item.id,
        item_name: item.item_name,
        counting_workflow: item.counting_workflow,
        typical_unit_weight_grams: item.typical_unit_weight_grams
      },
      assignment: {
        assigned_at: assignmentData.assigned_at,
        assigned_by: user_id,
        session_notes: assignmentData.session_notes
      },
      message: 'Container successfully assigned for counting',
      ...(warningMessage && { warning: warningMessage })
    }
    
    return successResponse(response, 201)
    
  } catch (error: any) {
    console.error('POST /api/stock/containers/assign error:', error)
    return errorResponse(
      error.message === 'Unauthorized' ? 'Unauthorized' : 'Internal server error',
      error.message === 'Unauthorized' ? 401 : 500
    )
  }
}

// ============================================================================
// GET /api/stock/containers/assign/recommendations - Get Container Recommendations
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { client_id, user_id, supabase } = await getAuthenticatedClientId()
    const { searchParams } = new URL(request.url)
    
    const inventoryItemId = searchParams.get('inventory_item_id')
    
    // Log the request for debugging
    logApiRequest('/api/stock/containers/assign/recommendations', 'GET', client_id, user_id, {
      inventory_item_id: inventoryItemId
    })
    
    if (!inventoryItemId) {
      return errorResponse('inventory_item_id parameter is required', 400)
    }
    
    // Get inventory item details
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', inventoryItemId)
      .eq('client_id', client_id)
      .eq('is_active', true)
      .single()
    
    if (itemError || !item) {
      return errorResponse('Inventory item not found', 404)
    }
    
    // Check if item supports weight counting
    if (!item.supports_weight_counting) {
      return errorResponse('This inventory item does not support weight-based counting', 400)
    }
    
    // Build container query based on item requirements
    let containerQuery = supabase
      .from('container_instances')
      .select(`
        *,
        container_type:container_tare_weights(
          id,
          container_type,
          typical_weight_grams,
          category,
          description
        )
      `)
      .eq('client_id', client_id)
      .eq('is_active', true)
      .eq('needs_reweigh', false)
      .neq('verification_status', 'overdue')
    
    // Filter by container category if specified
    if (item.default_container_category) {
      containerQuery = containerQuery
        .eq('container_type.category', item.default_container_category)
    }
    
    // Execute query
    const { data: containers, error: containersError } = await containerQuery
      .order('last_used_date', { ascending: true, nullsFirst: true }) // Prefer least recently used
    
    if (containersError) {
      console.error('Error fetching container recommendations:', containersError)
      return errorResponse('Failed to fetch container recommendations', 500)
    }
    
    // Score and rank containers
    const scoredContainers = await Promise.all((containers || []).map(async (container) => {
      let score = 100 // Base score
      let reasons: string[] = []
      
      // Category match bonus
      if (item.default_container_category && 
          container.container_type?.category === item.default_container_category) {
        score += 20
        reasons.push('Matches required container category')
      }
      
      // Typical weight considerations
      if (item.typical_unit_weight_grams && container.container_type?.typical_weight_grams) {
        const weightRatio = item.typical_unit_weight_grams / container.container_type.typical_weight_grams
        if (weightRatio > 0.1 && weightRatio < 10) { // Reasonable weight ratio
          score += 10
          reasons.push('Good weight capacity match')
        }
      }
      
      // Usage history bonus (prefer containers not recently used for different items)
      if (container.last_used_date) {
        const daysSinceUse = calculateDaysBetween(container.last_used_date, new Date().toISOString())
        if (daysSinceUse > 1) {
          score += 5
          reasons.push('Container has been cleaned (not recently used)')
        }
      } else {
        score += 15
        reasons.push('Fresh container (never used)')
      }
      
      // Verification status bonus
      if (container.verification_status === 'current') {
        score += 10
        reasons.push('Current verification status')
      } else if (container.verification_status === 'due_soon') {
        score -= 5
        reasons.push('Verification due soon')
      }
      
      // Check recent usage for same item (bonus)
      const { data: recentUsageForItem } = await supabase
        .from('inventory_counts')
        .select('count_date')
        .eq('container_instance_id', container.id)
        .eq('inventory_item_id', inventoryItemId)
        .eq('client_id', client_id)
        .order('count_date', { ascending: false })
        .limit(1)
      
      if (recentUsageForItem && recentUsageForItem.length > 0) {
        score += 15
        reasons.push('Previously used for this same item')
      }
      
      return {
        ...container,
        container_type_name: container.container_type?.container_type,
        container_category: container.container_type?.category,
        recommendation_score: score,
        recommendation_reasons: reasons
      }
    }))
    
    // Sort by score (highest first) and limit to top 10
    const topRecommendations = scoredContainers
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, 10)
    
    // Categorize recommendations
    const excellent = topRecommendations.filter(c => c.recommendation_score >= 130)
    const good = topRecommendations.filter(c => c.recommendation_score >= 110 && c.recommendation_score < 130)
    const acceptable = topRecommendations.filter(c => c.recommendation_score < 110)
    
    return successResponse({
      item: {
        id: item.id,
        item_name: item.item_name,
        counting_workflow: item.counting_workflow,
        default_container_category: item.default_container_category,
        typical_unit_weight_grams: item.typical_unit_weight_grams
      },
      recommendations: topRecommendations,
      categorized: {
        excellent,
        good,
        acceptable
      },
      total_available: containers?.length || 0
    })
    
  } catch (error: any) {
    console.error('GET /api/stock/containers/assign/recommendations error:', error)
    return errorResponse(
      error.message === 'Unauthorized' ? 'Unauthorized' : 'Internal server error',
      error.message === 'Unauthorized' ? 401 : 500
    )
  }
}

// ============================================================================
// POST /api/stock/containers/unassign - Release Container After Counting
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const { client_id, user_id, supabase } = await getAuthenticatedClientId()
    const body = await request.json()
    
    // Log the request for debugging
    logApiRequest('/api/stock/containers/assign', 'PUT', client_id, user_id, { 
      container_barcode: body.container_barcode
    })
    
    // Validate required fields
    const validationError = validateRequired(body, ['container_barcode'])
    if (validationError) {
      return errorResponse(validationError, 400)
    }
    
    // Validate container barcode format
    if (!isValidContainerBarcode(body.container_barcode)) {
      return errorResponse('Invalid container barcode format. Expected: JIGR-C-XXXXX', 400)
    }
    
    // Get container details
    const { data: container, error: containerError } = await supabase
      .from('container_instances')
      .select('*')
      .eq('container_barcode', body.container_barcode)
      .eq('client_id', client_id)
      .single()
    
    if (containerError || !container) {
      return errorResponse('Container not found', 404)
    }
    
    // Update container to mark it as available
    const updateData: any = {}
    
    // If cleaning is required, mark container for cleaning
    if (body.requires_cleaning) {
      updateData.needs_reweigh = true // Require re-verification after cleaning
    }
    
    // Add any session notes
    if (body.session_notes) {
      updateData.session_notes = body.session_notes.trim()
    }
    
    // Only update if there's something to update
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('container_instances')
        .update(updateData)
        .eq('id', container.id)
        .eq('client_id', client_id)
      
      if (updateError) {
        console.error('Error updating container:', updateError)
        return errorResponse('Failed to release container', 500)
      }
    }
    
    const message = body.requires_cleaning ? 
      'Container released and marked for cleaning/re-verification' :
      'Container successfully released and available for reuse'
    
    return successResponse({
      message,
      container: {
        id: container.id,
        container_barcode: container.container_barcode,
        requires_cleaning: body.requires_cleaning || false,
        session_notes: body.session_notes || null
      }
    })
    
  } catch (error: any) {
    console.error('PUT /api/stock/containers/assign error:', error)
    return errorResponse(
      error.message === 'Unauthorized' ? 'Unauthorized' : 'Internal server error',
      error.message === 'Unauthorized' ? 401 : 500
    )
  }
}