/**
 * JiGR Stock Containers API - Container Instance Management
 * 
 * Handles CRUD operations for physical container instances used in weight-based counting
 * GET /api/stock/containers - List containers with filtering and status
 * POST /api/stock/containers - Create new container with barcode generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getAuthenticatedClientId, 
  errorResponse, 
  successResponse,
  validateRequired,
  validatePositiveNumber,
  getQueryParam,
  getBooleanQueryParam,
  isValidContainerBarcode,
  logApiRequest
} from '@/lib/api-utils'
import type { ContainerInstance, ContainerInstancesResponse, VerificationStatus } from '@/types/stock'

// ============================================================================
// GET /api/stock/containers - List Containers with Status Filtering
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { client_id, user_id, supabase } = await getAuthenticatedClientId()
    const { searchParams } = new URL(request.url)
    
    // Log the request for debugging
    logApiRequest('/api/stock/containers', 'GET', client_id, user_id)
    
    // Parse query parameters for filtering
    const status = searchParams.get('status') as VerificationStatus | null
    const isActive = searchParams.get('is_active') === 'true'
    const containerTypeId = searchParams.get('container_type_id')
    const locationId = searchParams.get('location_id')
    const needsVerification = searchParams.get('needs_verification') === 'true'
    const search = searchParams.get('search')
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    
    // Sorting parameters
    const sortBy = searchParams.get('sortBy') || 'container_barcode'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    
    // Build the base query with container type relations
    let query = supabase
      .from('container_instances')
      .select(`
        *,
        container_type:container_tare_weights(
          id,
          container_type,
          typical_weight_grams,
          category,
          description
        ),
        location:storage_locations(
          id,
          location_name,
          location_code
        )
      `, { count: 'exact' })
      .eq('client_id', client_id)
    
    // Apply active/inactive filter
    if (isActive !== null) {
      query = query.eq('is_active', isActive)
    }
    
    // Apply verification status filter
    if (status) {
      query = query.eq('verification_status', status)
    }
    
    // Apply container type filter
    if (containerTypeId) {
      query = query.eq('container_type_id', containerTypeId)
    }
    
    // Apply location filter
    if (locationId) {
      query = query.eq('location_id', locationId)
    }
    
    // Apply needs verification filter
    if (needsVerification !== null) {
      query = query.eq('needs_reweigh', needsVerification)
    }
    
    // Apply search filter (barcode, nickname)
    if (search) {
      query = query.or(`
        container_barcode.ilike.%${search}%,
        container_nickname.ilike.%${search}%
      `)
    }
    
    // Apply sorting
    const sortColumn = sortBy === 'barcode' ? 'container_barcode' : 
                      sortBy === 'type' ? 'container_type_id' :
                      sortBy === 'location' ? 'location_id' :
                      sortBy === 'last_used' ? 'last_used_date' :
                      sortBy === 'last_verified' ? 'last_weighed_date' : 'container_barcode'
    
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' })
    
    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
    
    // Execute the query
    const { data, error, count } = await query
    
    if (error) {
      console.error('Error fetching containers:', error)
      return errorResponse(`Failed to fetch containers: ${error.message}`, 500)
    }
    
    // Process the data to include computed fields
    const processedContainers = data?.map(container => {
      // Calculate verification status based on due dates
      let computedStatus: VerificationStatus = 'current'
      
      if (container.verification_due_date) {
        const dueDate = new Date(container.verification_due_date)
        const now = new Date()
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysUntilDue < 0) {
          computedStatus = 'overdue'
        } else if (daysUntilDue <= 30) {
          computedStatus = 'due_soon'
        }
      }
      
      return {
        ...container,
        container_type_name: container.container_type?.container_type,
        container_category: container.container_type?.category,
        location_name: container.location?.location_name,
        computed_verification_status: computedStatus,
        days_until_verification: container.verification_due_date ? 
          Math.ceil((new Date(container.verification_due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
      }
    }) || []
    
    // Group containers by status for frontend convenience
    const groupedByStatus: Record<VerificationStatus | 'all', ContainerInstance[]> = {
      current: [],
      due_soon: [],
      overdue: [],
      all: processedContainers as ContainerInstance[]
    }
    
    processedContainers.forEach((container) => {
      const status = container.computed_verification_status as VerificationStatus
      if (groupedByStatus[status]) {
        groupedByStatus[status].push(container as ContainerInstance)
      }
    })
    
    // Return enhanced response
    return successResponse({
      containers: processedContainers,
      grouped: groupedByStatus,
      pagination: {
        page,
        pageSize,
        totalItems: count || processedContainers.length,
        totalPages: Math.ceil((count || processedContainers.length) / pageSize)
      },
      total: processedContainers.length
    })
    
  } catch (error: any) {
    console.error('GET /api/stock/containers error:', error)
    return errorResponse(
      error.message === 'Unauthorized' ? 'Unauthorized' : 'Internal server error',
      error.message === 'Unauthorized' ? 401 : 500
    )
  }
}

// ============================================================================
// POST /api/stock/containers - Create New Container with Barcode Generation
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { client_id, user_id, supabase } = await getAuthenticatedClientId()
    const body = await request.json()
    
    // Log the request for debugging
    logApiRequest('/api/stock/containers', 'POST', client_id, user_id, { 
      container_type_id: body.container_type_id 
    })
    
    // Validate required fields
    const validationError = validateRequired(body, ['container_type_id', 'tare_weight_grams'])
    if (validationError) {
      return errorResponse(validationError, 400)
    }
    
    // Validate numeric fields
    const tareWeightError = validatePositiveNumber(body.tare_weight_grams, 'tare_weight_grams')
    if (tareWeightError) {
      return errorResponse(tareWeightError, 400)
    }
    
    if (body.verification_frequency_months !== undefined) {
      const frequencyError = validatePositiveNumber(body.verification_frequency_months, 'verification_frequency_months')
      if (frequencyError) {
        return errorResponse(frequencyError, 400)
      }
    }
    
    // Check if container type exists and belongs to client
    const { data: containerType, error: typeError } = await supabase
      .from('container_tare_weights')
      .select('*')
      .eq('id', body.container_type_id)
      .eq('client_id', client_id)
      .single()
    
    if (typeError || !containerType) {
      return errorResponse('Container type not found', 400)
    }
    
    // Generate next container barcode
    // Find the highest existing container number for this client
    const { data: existingContainers, error: existingError } = await supabase
      .from('container_instances')
      .select('container_barcode')
      .eq('client_id', client_id)
      .like('container_barcode', 'JIGR-C-%')
      .order('container_barcode', { ascending: false })
      .limit(1)
    
    if (existingError) {
      console.error('Error checking existing containers:', existingError)
      return errorResponse('Error generating barcode', 500)
    }
    
    // Extract the highest number and increment
    let nextNumber = 1
    if (existingContainers && existingContainers.length > 0) {
      const lastBarcode = existingContainers[0].container_barcode
      const lastNumberMatch = lastBarcode.match(/JIGR-C-(\d{5})$/)
      if (lastNumberMatch) {
        nextNumber = parseInt(lastNumberMatch[1], 10) + 1
      }
    }
    
    // Format as 5-digit number with leading zeros
    const containerBarcode = `JIGR-C-${nextNumber.toString().padStart(5, '0')}`
    
    // Check if barcode already exists (safety check)
    const { data: duplicateBarcode } = await supabase
      .from('container_instances')
      .select('id')
      .eq('client_id', client_id)
      .eq('container_barcode', containerBarcode)
      .single()
    
    if (duplicateBarcode) {
      return errorResponse('Generated barcode already exists, please try again', 500)
    }
    
    // Calculate verification due date
    const verificationMonths = body.verification_frequency_months || 6
    const verificationDueDate = new Date()
    verificationDueDate.setMonth(verificationDueDate.getMonth() + verificationMonths)
    
    // Determine initial verification status
    let verificationStatus: VerificationStatus = 'current'
    const daysUntilDue = Math.ceil((verificationDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue <= 30) {
      verificationStatus = 'due_soon'
    }
    
    // Build container data
    const containerData: Partial<ContainerInstance> = {
      client_id,
      container_barcode: containerBarcode,
      container_type_id: body.container_type_id,
      container_nickname: body.container_nickname?.trim() || null,
      location_id: body.location_id || null,
      
      // Weight tracking
      tare_weight_grams: body.tare_weight_grams,
      last_weighed_date: new Date().toISOString(),
      needs_reweigh: false,
      
      // Verification schedule
      verification_due_date: verificationDueDate.toISOString(),
      verification_status: verificationStatus,
      
      // Usage tracking
      times_used: 0,
      
      // Lifecycle management
      is_active: true
    }
    
    // Create the container
    const { data: container, error } = await supabase
      .from('container_instances')
      .insert(containerData)
      .select(`
        *,
        container_type:container_tare_weights(
          id,
          container_type,
          typical_weight_grams,
          category,
          description
        ),
        location:storage_locations(
          id,
          location_name,
          location_code
        )
      `)
      .single()
    
    if (error) {
      console.error('Error creating container:', error)
      if (error.code === '23505') { // Unique constraint violation
        return errorResponse('Container with this barcode already exists', 400)
      }
      return errorResponse(`Failed to create container: ${error.message}`, 500)
    }
    
    // Process response data
    const processedContainer = {
      ...container,
      container_type_name: container.container_type?.container_type,
      container_category: container.container_type?.category,
      location_name: container.location?.location_name,
      computed_verification_status: verificationStatus,
      days_until_verification: daysUntilDue
    }
    
    return successResponse({ 
      container: processedContainer as ContainerInstance,
      message: `Container created successfully with barcode ${containerBarcode}`
    }, 201)
    
  } catch (error: any) {
    console.error('POST /api/stock/containers error:', error)
    return errorResponse(
      error.message === 'Unauthorized' ? 'Unauthorized' : 'Internal server error',
      error.message === 'Unauthorized' ? 401 : 500
    )
  }
}