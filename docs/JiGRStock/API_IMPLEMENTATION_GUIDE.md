# JiGR Stock Module - API Endpoints (Ready for Implementation)

**For:** Claude Code AI Assistant  
**Date:** November 18, 2025  
**Status:** Ready to implement  
**Prerequisites:** Database 100% complete (21 tables, 43 functions)

---

## 📦 Quick Start for Claude Code

**What you're building:**
API endpoints for hybrid inventory counting system with 5 workflows:
- `unit_count` - Manual counting
- `container_weight` - Weight-based with containers
- `bottle_hybrid` - Wine/spirits (full + partial)
- `keg_weight` - Beer kegs
- `batch_weight` - In-house prep with batches

**Database primary key:** `inventory_items.id` (NOT `item_id`)

**Key principle:** Extend existing `/app/stock/` system, don't replace it.

---

## 📁 File 1: Shared Types

**Location:** `types/stock.ts`
```typescript
// ============================================================================
// STOCK MODULE TYPES - Complete Type Definitions
// ============================================================================

export type CountingWorkflow = 
  | 'unit_count'        // Manual counting
  | 'container_weight'  // Bulk items in containers
  | 'bottle_hybrid'     // Wine/spirits (full + partial)
  | 'keg_weight'       // Beer kegs
  | 'batch_weight';    // In-house prep with batches

export type CountingMethod = 'manual' | 'weight' | 'hybrid' | 'barcode';

export type VerificationStatus = 'current' | 'due_soon' | 'overdue';

export type KegStatus = 'full' | 'tapped' | 'empty' | 'returned';

export type FreshnessStatus = 'fresh' | 'good' | 'declining' | 'expired';

export type AnomalySeverity = 'info' | 'warning' | 'error' | 'critical';

export type AnomalyType = 
  | 'empty_container'
  | 'impossible_weight'
  | 'negative_weight'
  | 'tare_weight_error'
  | 'keg_nearly_empty'
  | 'bottle_too_light'
  | 'suspicious_increase'
  | 'outlier_weight'
  | 'container_mismatch';

// ============================================================================
// INVENTORY ITEM (Extended)
// ============================================================================

export interface InventoryItem {
  id: string;
  client_id: string;
  category_id: string;
  item_name: string;
  brand?: string;
  item_code?: string;
  barcode?: string;
  
  // Units
  recipe_unit: string;
  recipe_unit_yield?: number;
  count_unit?: string;
  count_unit_conversion?: number;
  
  // Par Levels
  par_level_low: number;
  par_level_high: number;
  
  // Storage
  storage_location?: string;
  
  // Workflow Configuration
  counting_workflow: CountingWorkflow;
  supports_weight_counting: boolean;
  typical_unit_weight_grams?: number;
  default_container_category?: string;
  requires_container: boolean;
  supports_partial_units: boolean;
  
  // Pack Configuration
  pack_size: number;
  pack_unit?: string;
  order_by_pack: boolean;
  
  // Bottle Configuration
  is_bottled_product: boolean;
  bottle_volume_ml?: number;
  bottle_shape_id?: string;
  full_bottle_weight_grams?: number;
  empty_bottle_weight_grams?: number;
  
  // Keg Configuration
  is_keg: boolean;
  keg_volume_liters?: number;
  empty_keg_weight_grams?: number;
  keg_freshness_days?: number;
  keg_storage_temp_min?: number;
  keg_storage_temp_max?: number;
  
  // Batch Configuration
  is_batch_tracked: boolean;
  batch_use_by_days?: number;
  batch_naming_pattern?: string;
  
  // Verification
  verification_frequency_months: number;
  last_verification_date?: string;
  
  // Status
  is_active: boolean;
  notes?: string;
  
  // Audit
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CONTAINER INSTANCE
// ============================================================================

export interface ContainerInstance {
  id: string;
  client_id: string;
  container_barcode: string;
  container_type_id: string;
  container_nickname?: string;
  location_id?: string;
  
  tare_weight_grams: number;
  last_weighed_date: string;
  needs_reweigh: boolean;
  
  verification_due_date?: string;
  verification_status: VerificationStatus;
  
  label_printed_date?: string;
  label_batch_number?: string;
  
  times_used: number;
  last_used_date?: string;
  
  is_active: boolean;
  retired_date?: string;
  retirement_reason?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INVENTORY COUNT
// ============================================================================

export interface InventoryCount {
  id: string;
  client_id: string;
  inventory_item_id: string;
  
  counted_quantity: number;
  count_date: string;
  count_time?: string;
  count_type: string;
  location?: string;
  counting_method: CountingMethod;
  
  counted_by_user_id: string;
  
  // Weight-based
  container_instance_id?: string;
  gross_weight_grams?: number;
  tare_weight_grams?: number;
  net_weight_grams?: number;
  unit_weight_grams?: number;
  calculated_quantity?: number;
  confidence_score?: number;
  
  // Bottle-specific
  full_bottles_count?: number;
  partial_bottles_weight?: number;
  partial_bottles_equivalent?: number;
  
  // Keg-specific
  keg_tapped_date?: string;
  keg_days_since_tap?: number;
  keg_estimated_remaining_liters?: number;
  keg_temperature_celsius?: number;
  
  // Anomalies
  has_anomalies: boolean;
  anomaly_types?: string[];
  anomaly_override: boolean;
  anomaly_notes?: string;
  
  // Device
  scale_device_id?: string;
  scale_brand?: string;
  
  notes?: string;
  
  expected_quantity?: number;
  variance_quantity?: number;
  variance_percentage?: number;
  
  is_verified: boolean;
  verified_by_user_id?: string;
  verified_at?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// KEG TRACKING
// ============================================================================

export interface KegTracking {
  id: string;
  client_id: string;
  inventory_item_id: string;
  
  keg_barcode?: string;
  keg_serial_number?: string;
  
  received_date: string;
  received_full_weight_grams?: number;
  vendor_id?: string;
  
  tapped_date?: string;
  tapped_by_user_id?: string;
  initial_tapped_weight_grams?: number;
  
  current_weight_grams?: number;
  estimated_remaining_liters?: number;
  estimated_remaining_percentage?: number;
  
  days_since_tap?: number;
  estimated_days_until_bad?: number;
  freshness_status: FreshnessStatus;
  
  storage_location?: string;
  current_temperature_celsius?: number;
  temperature_in_range: boolean;
  last_temperature_check?: string;
  
  keg_status: KegStatus;
  emptied_date?: string;
  returned_to_vendor_date?: string;
  
  low_volume_alert: boolean;
  freshness_alert: boolean;
  temperature_alert: boolean;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

export interface WeightAnomaly {
  type: AnomalyType;
  severity: AnomalySeverity;
  message: string;
  suggested_action: string;
  confidence_score: number;
}

export interface AnomalyDetectionResult {
  has_anomaly: boolean;
  anomalies: WeightAnomaly[];
  can_proceed: boolean;
  require_confirmation: boolean;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CountSubmissionRequest {
  inventory_item_id: string;
  counting_method: CountingMethod;
  
  // Manual
  counted_quantity?: number;
  
  // Weight-based
  container_instance_id?: string;
  gross_weight_grams?: number;
  tare_weight_grams?: number;
  net_weight_grams?: number;
  unit_weight_grams?: number;
  
  // Bottle hybrid
  full_bottles_count?: number;
  partial_bottles_weight?: number;
  
  // Keg
  keg_tapped_date?: string;
  keg_temperature_celsius?: number;
  
  // Device
  scale_device_id?: string;
  scale_brand?: string;
  
  // Internal (set by validation)
  anomaly_notes?: string;
  
  notes?: string;
}

export interface CountSubmissionResponse {
  count: InventoryCount;
  final_quantity: number;
  anomalies?: WeightAnomaly[];
  success: boolean;
}

export interface BatchItemRequest {
  parent_item_id: string;
  batch_date: string;
  production_quantity: number;
  use_by_days?: number;
  notes?: string;
}

export interface KegTapRequest {
  keg_tracking_id: string;
  tapped_date?: string;
  initial_weight_grams: number;
  storage_location?: string;
}

export interface KegWeighRequest {
  keg_tracking_id: string;
  current_weight_grams: number;
  temperature_celsius?: number;
}
```

---

## 📁 File 2: Shared Utilities

**Location:** `lib/api-utils.ts`
```typescript
// ============================================================================
// API UTILITY FUNCTIONS
// ============================================================================

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Get authenticated client ID for current user
 */
export async function getAuthenticatedClientId() {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  const { data: clientUser, error } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('user_id', session.user.id)
    .single();
  
  if (error || !clientUser) {
    throw new Error('Client not found');
  }
  
  return {
    client_id: clientUser.client_id,
    user_id: session.user.id,
    supabase
  };
}

/**
 * Standard error response
 */
export function errorResponse(message: string, status: number = 500) {
  return Response.json({ error: message }, { status });
}

/**
 * Standard success response
 */
export function successResponse(data: any, status: number = 200) {
  return Response.json(data, { status });
}

/**
 * Validate required fields
 */
export function validateRequired(body: any, fields: string[]): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

/**
 * Calculate net weight from gross and tare
 */
export function calculateNetWeight(
  grossWeight: number,
  tareWeight: number
): number {
  return Math.max(0, grossWeight - tareWeight);
}

/**
 * Calculate quantity from weight
 */
export function calculateQuantityFromWeight(
  netWeight: number,
  unitWeight: number
): number {
  if (unitWeight <= 0) return 0;
  return netWeight / unitWeight;
}

/**
 * Calculate bottle equivalent from weight
 */
export function calculateBottleEquivalent(
  currentWeight: number,
  emptyWeight: number,
  fullWeight: number
): number {
  if (fullWeight <= emptyWeight) return 0;
  const netCurrent = Math.max(0, currentWeight - emptyWeight);
  const netFull = fullWeight - emptyWeight;
  return Math.min(1, netCurrent / netFull);
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Parse query parameters safely
 */
export function getQueryParam(url: URL, key: string): string | null {
  return url.searchParams.get(key);
}

export function getBooleanQueryParam(url: URL, key: string): boolean | null {
  const value = url.searchParams.get(key);
  if (value === null) return null;
  return value === 'true' || value === '1';
}

export function getNumberQueryParam(url: URL, key: string): number | null {
  const value = url.searchParams.get(key);
  if (value === null) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}
```

---

## 📁 File 3: Stock Items API

**Location:** `app/api/stock/items/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { getAuthenticatedClientId, errorResponse, getBooleanQueryParam, getQueryParam } from '@/lib/api-utils';
import type { InventoryItem } from '@/types/stock';

export async function GET(request: Request) {
  try {
    const { client_id, supabase } = await getAuthenticatedClientId();
    const { searchParams } = new URL(request.url);
    
    // Filters
    const workflow = getQueryParam(searchParams, 'workflow');
    const supportsWeight = getBooleanQueryParam(searchParams, 'supports_weight');
    const isBottled = getBooleanQueryParam(searchParams, 'is_bottled');
    const isKeg = getBooleanQueryParam(searchParams, 'is_keg');
    const isBatch = getBooleanQueryParam(searchParams, 'is_batch');
    const search = getQueryParam(searchParams, 'search');
    const categoryId = getQueryParam(searchParams, 'category_id');
    
    // Build query
    let query = supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(id, name, description),
        bottle_shape:wine_bottle_shapes(shape_name, shape_category, typical_tare_weight_grams)
      `)
      .eq('client_id', client_id)
      .eq('is_active', true);
    
    // Apply filters
    if (workflow) {
      query = query.eq('counting_workflow', workflow);
    }
    
    if (supportsWeight !== null) {
      query = query.eq('supports_weight_counting', supportsWeight);
    }
    
    if (isBottled !== null) {
      query = query.eq('is_bottled_product', isBottled);
    }
    
    if (isKeg !== null) {
      query = query.eq('is_keg', isKeg);
    }
    
    if (isBatch !== null) {
      query = query.eq('is_batch_tracked', isBatch);
    }
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    if (search) {
      query = query.or(`item_name.ilike.%${search}%,brand.ilike.%${search}%,barcode.ilike.%${search}%`);
    }
    
    query = query.order('item_name', { ascending: true });
    
    const { data: items, error } = await query;
    
    if (error) {
      console.error('Error fetching items:', error);
      return errorResponse(error.message, 500);
    }
    
    // Group by workflow
    const grouped = (items as InventoryItem[]).reduce((acc, item) => {
      const wf = item.counting_workflow || 'unit_count';
      if (!acc[wf]) acc[wf] = [];
      acc[wf].push(item);
      return acc;
    }, {} as Record<string, InventoryItem[]>);
    
    return NextResponse.json({
      items,
      grouped,
      total: items.length
    });
    
  } catch (error: any) {
    console.error('GET /api/stock/items error:', error);
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}

export async function POST(request: Request) {
  try {
    const { client_id, supabase } = await getAuthenticatedClientId();
    const body = await request.json();
    
    // Validate required fields
    if (!body.item_name || !body.category_id) {
      return errorResponse('Missing required fields: item_name, category_id', 400);
    }
    
    // Build item data
    const itemData: Partial<InventoryItem> = {
      client_id,
      item_name: body.item_name,
      brand: body.brand || null,
      category_id: body.category_id,
      item_code: body.item_code || null,
      barcode: body.barcode || null,
      recipe_unit: body.recipe_unit || 'units',
      recipe_unit_yield: body.recipe_unit_yield || null,
      count_unit: body.count_unit || null,
      count_unit_conversion: body.count_unit_conversion || null,
      storage_location: body.storage_location || null,
      par_level_low: body.par_level_low || 0,
      par_level_high: body.par_level_high || 0,
      
      // Workflow
      counting_workflow: body.counting_workflow || 'unit_count',
      supports_weight_counting: body.supports_weight_counting || false,
      typical_unit_weight_grams: body.typical_unit_weight_grams || null,
      default_container_category: body.default_container_category || null,
      requires_container: body.requires_container || false,
      supports_partial_units: body.supports_partial_units || false,
      
      // Pack
      pack_size: body.pack_size || 1,
      pack_unit: body.pack_unit || null,
      order_by_pack: body.order_by_pack || false,
      
      // Bottle
      is_bottled_product: body.is_bottled_product || false,
      bottle_volume_ml: body.bottle_volume_ml || null,
      bottle_shape_id: body.bottle_shape_id || null,
      full_bottle_weight_grams: body.full_bottle_weight_grams || null,
      empty_bottle_weight_grams: body.empty_bottle_weight_grams || null,
      
      // Keg
      is_keg: body.is_keg || false,
      keg_volume_liters: body.keg_volume_liters || null,
      empty_keg_weight_grams: body.empty_keg_weight_grams || 13300,
      keg_freshness_days: body.keg_freshness_days || null,
      keg_storage_temp_min: body.keg_storage_temp_min || null,
      keg_storage_temp_max: body.keg_storage_temp_max || null,
      
      // Batch
      is_batch_tracked: body.is_batch_tracked || false,
      batch_use_by_days: body.batch_use_by_days || null,
      batch_naming_pattern: body.batch_naming_pattern || '{item_name}-{date}',
      
      // Verification
      verification_frequency_months: body.verification_frequency_months || 6,
      
      notes: body.notes || null
    };
    
    const { data: item, error } = await supabase
      .from('inventory_items')
      .insert(itemData)
      .select(`
        *,
        category:inventory_categories(id, name, description)
      `)
      .single();
    
    if (error) {
      console.error('Error creating item:', error);
      return errorResponse(error.message, 500);
    }
    
    return NextResponse.json({ item }, { status: 201 });
    
  } catch (error: any) {
    console.error('POST /api/stock/items error:', error);
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}
```

---

## 📁 File 4: Stock Items Detail API

**Location:** `app/api/stock/items/[id]/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { getAuthenticatedClientId, errorResponse } from '@/lib/api-utils';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { client_id, supabase } = await getAuthenticatedClientId();
    
    const { data: item, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:inventory_categories(id, name, description),
        bottle_shape:wine_bottle_shapes(*),
        containers:item_container_assignments(
          *,
          container:container_instances(*)
        )
      `)
      .eq('id', params.id)
      .eq('client_id', client_id)
      .single();
    
    if (error) {
      console.error('Error fetching item:', error);
      return errorResponse(error.message, 500);
    }
    
    if (!item) {
      return errorResponse('Item not found', 404);
    }
    
    // Get recent counts
    const { data: recentCounts } = await supabase
      .from('inventory_counts')
      .select('*')
      .eq('inventory_item_id', params.id)
      .order('count_date', { ascending: false })
      .limit(10);
    
    return NextResponse.json({
      item,
      recent_counts: recentCounts || []
    });
    
  } catch (error: any) {
    console.error('GET /api/stock/items/[id] error:', error);
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { client_id, supabase } = await getAuthenticatedClientId();
    const body = await request.json();
    
    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Only update fields that are provided
    const allowedFields = [
      'item_name', 'brand', 'item_code', 'barcode',
      'recipe_unit', 'recipe_unit_yield', 'count_unit', 'count_unit_conversion',
      'storage_location', 'par_level_low', 'par_level_high',
      'counting_workflow', 'supports_weight_counting', 'typical_unit_weight_grams',
      'default_container_category', 'requires_container', 'supports_partial_units',
      'pack_size', 'pack_unit', 'order_by_pack',
      'is_bottled_product', 'bottle_volume_ml', 'bottle_shape_id',
      'full_bottle_weight_grams', 'empty_bottle_weight_grams',
      'is_keg', 'keg_volume_liters', 'empty_keg_weight_grams',
      'keg_freshness_days', 'keg_storage_temp_min', 'keg_storage_temp_max',
      'is_batch_tracked', 'batch_use_by_days', 'batch_naming_pattern',
      'verification_frequency_months', 'notes'
    ];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    
    const { data: item, error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', params.id)
      .eq('client_id', client_id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating item:', error);
      return errorResponse(error.message, 500);
    }
    
    if (!item) {
      return errorResponse('Item not found', 404);
    }
    
    return NextResponse.json({ item });
    
  } catch (error: any) {
    console.error('PUT /api/stock/items/[id] error:', error);
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { client_id, supabase } = await getAuthenticatedClientId();
    
    const { error } = await supabase
      .from('inventory_items')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('client_id', client_id);
    
    if (error) {
      console.error('Error deleting item:', error);
      return errorResponse(error.message, 500);
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('DELETE /api/stock/items/[id] error:', error);
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}
```

---

## 📁 File 5: Containers API

**Location:** `app/api/stock/containers/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { getAuthenticatedClientId, errorResponse, validateRequired, formatDate } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { client_id, supabase } = await getAuthenticatedClientId();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const isActive = searchParams.get('is_active') !== 'false';
    
    let query = supabase
      .from('container_instances')
      .select(`
        *,
        container_type:container_tare_weights(*)
      `)
      .eq('client_id', client_id)
      .eq('is_active', isActive)
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('verification_status', status);
    }
    
    const { data: containers, error } = await query;
    
    if (error) {
      console.error('Error fetching containers:', error);
      return errorResponse(error.message, 500);
    }
    
    return NextResponse.json({
      containers,
      total: containers?.length || 0
    });
    
  } catch (error: any) {
    console.error('GET /api/stock/containers error:', error);
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}

export async function POST(request: Request) {
  try {
    const { client_id, supabase } = await getAuthenticatedClientId();
    const body = await request.json();
    
    const validationError = validateRequired(body, ['container_type_id', 'tare_weight_grams']);
    if (validationError) {
      return errorResponse(validationError, 400);
    }
    
    // Generate barcode
    const { data: barcodeResult, error: barcodeError } = await supabase
      .rpc('generate_container_barcode', {
        target_client_id: client_id
      });
    
    if (barcodeError) {
      console.error('Error generating barcode:', barcodeError);
      return errorResponse('Failed to generate barcode', 500);
    }
    
    const barcode = barcodeResult as string;
    
    // Calculate verification due date (6 months)
    const verificationDueDate = new Date();
    verificationDueDate.setMonth(verificationDueDate.getMonth() + 6);
    
    const { data: container, error } = await supabase
      .from('container_instances')
      .insert({
        client_id,
        container_barcode: barcode,
        container_type_id: body.container_type_id,
        container_nickname: body.container_nickname || null,
        tare_weight_grams: body.tare_weight_grams,
        last_weighed_date: formatDate(new Date()),
        verification_due_date: formatDate(verificationDueDate),
        verification_status: 'current',
        location_id: body.location_id || null
      })
      .select(`
        *,
        container_type:container_tare_weights(*)
      `)
      .single();
    
    if (error) {
      console.error('Error creating container:', error);
      return errorResponse(error.message, 500);
    }
    
    return NextResponse.json({ container }, { status: 201 });
    
  } catch (error: any) {
    console.error('POST /api/stock/containers error:', error);
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}
```

---

## 📁 File 6: Container Assignment API

**Location:** `app/api/stock/containers/assign/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { getAuthenticatedClientId, errorResponse, validateRequired } from '@/lib/api-utils';

export async function POST(request: Request) {
  try {
    const { client_id, user_id, supabase } = await getAuthenticatedClientId();
    const body = await request.json();
    
    const validationError = validateRequired(body, ['inventory_item_id', 'container_instance_id']);
    if (validationError) {
      return errorResponse(validationError, 400);
    }
    
    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('item_container_assignments')
      .select('id')
      .eq('inventory_item_id', body.inventory_item_id)
      .eq('container_instance_id', body.container_instance_id)
      .eq('is_active', true)
      .single();
    
    if (existing) {
      return errorResponse('Container already assigned to this item', 400);
    }
    
    // Create assignment
    const { data: assignment, error } = await supabase
      .from('item_container_assignments')
      .insert({
        client_id,
        inventory_item_id: body.inventory_item_id,
        container_instance_id: body.container_instance_id,
        assigned_by_user_id: user_id
      })
      .select(`
        *,
        item:inventory_items(id, item_name),
        container:container_instances(*)
      `)
      .single();
    
    if (error) {
      console.error('Error creating assignment:', error);
      return errorResponse(error.message, 500);
    }
    
    // Update container usage count
    await supabase
      .from('container_instances')
      .update({
        times_used: supabase.raw('times_used + 1'),
        last_used_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', body.container_instance_id);
    
    return NextResponse.json({ assignment }, { status: 201 });
    
  } catch (error: any) {
    console.error('POST /api/stock/containers/assign error:', error);
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}
```

---

## 📁 File 7: Count Submission API (CRITICAL)

**Location:** `app/api/stock/count/submit/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { 
  getAuthenticatedClientId, 
  errorResponse, 
  validateRequired,
  calculateNetWeight,
  calculateQuantityFromWeight,
  calculateBottleEquivalent,
  formatDate
} from '@/lib/api-utils';
import type { CountSubmissionRequest, CountSubmissionResponse } from '@/types/stock';

export async function POST(request: Request) {
  try {
    const { client_id, user_id, supabase } = await getAuthenticatedClientId();
    const body: CountSubmissionRequest = await request.json();
    
    // Validate
    const validationError = validateRequired(body, ['inventory_item_id', 'counting_method']);
    if (validationError) {
      return errorResponse(validationError, 400);
    }
    
    // Get item details
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', body.inventory_item_id)
      .eq('client_id', client_id)
      .single();
    
    if (itemError || !item) {
      return errorResponse('Item not found', 404);
    }
    
    // Validate counting method matches item workflow
    if (item.requires_container && body.counting_method !== 'weight') {
      return errorResponse('This item requires weight-based counting', 400);
    }
    
    // WEIGHT-BASED VALIDATION
    if (body.counting_method === 'weight') {
      if (!body.gross_weight_grams || !body.tare_weight_grams) {
        return errorResponse('Weight counting requires gross_weight_grams and tare_weight_grams', 400);
      }
      
      // Run anomaly detection
      const anomalyResponse = await fetch(
        new URL('/api/stock/count/validate', request.url).toString(),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inventory_item_id: body.inventory_item_id,
            container_instance_id: body.container_instance_id,
            measured_weight_grams: body.gross_weight_grams,
            tare_weight_grams: body.tare_weight_grams,
            context: 'count_submission'
          })
        }
      );
      
      const anomalyResult = await anomalyResponse.json();
      
      // Block critical anomalies
      if (!anomalyResult.can_proceed) {
        return NextResponse.json({
          error: 'Critical anomaly detected - cannot proceed',
          anomalies: anomalyResult.anomalies,
          can_proceed: false
        }, { status: 400 });
      }
      
      // Store anomalies for logging
      if (anomalyResult.has_anomaly) {
        body.anomaly_notes = anomalyResult.anomalies
          .map((a: any) => `${a.severity.toUpperCase()}: ${a.message}`)
          .join('; ');
      }
    }
    
    // CALCULATE FINAL QUANTITY
    let finalQuantity: number;
    let netWeight: number | undefined;
    let calculatedQuantity: number | undefined;
    
    if (body.counting_method === 'weight') {
      netWeight = calculateNetWeight(
        body.gross_weight_grams!,
        body.tare_weight_grams!
      );
      
      if (item.is_bottled_product && item.counting_workflow === 'bottle_hybrid') {
        // BOTTLE HYBRID: Full + Partial
        const fullBottles = body.full_bottles_count || 0;
        const partialEquivalent = body.partial_bottles_weight
          ? calculateBottleEquivalent(
              body.partial_bottles_weight,
              item.empty_bottle_weight_grams || 0,
              item.full_bottle_weight_grams || 0
            )
          : 0;
        
        finalQuantity = fullBottles + partialEquivalent;
        calculatedQuantity = finalQuantity;
        
      } else if (item.typical_unit_weight_grams) {
        // STANDARD WEIGHT-BASED
        calculatedQuantity = calculateQuantityFromWeight(
          netWeight,
          item.typical_unit_weight_grams
        );
        finalQuantity = calculatedQuantity;
        
      } else {
        // Weight provided but no unit weight - store as raw weight
        finalQuantity = netWeight / 1000; // Convert to kg
        calculatedQuantity = finalQuantity;
      }
      
    } else {
      // MANUAL COUNT
      if (body.counted_quantity === undefined) {
        return errorResponse('Manual counting requires counted_quantity', 400);
      }
      finalQuantity = body.counted_quantity;
    }
    
    // CREATE COUNT RECORD
    const countData: any = {
      client_id,
      inventory_item_id: body.inventory_item_id,
      counted_quantity: finalQuantity,
      count_date: formatDate(new Date()),
      count_time: new Date().toTimeString().split(' ')[0],
      count_type: 'regular',
      counted_by_user_id: user_id,
      counting_method: body.counting_method,
      
      // Weight data
      container_instance_id: body.container_instance_id || null,
      gross_weight_grams: body.gross_weight_grams || null,
      tare_weight_grams: body.tare_weight_grams || null,
      net_weight_grams: netWeight || null,
      unit_weight_grams: body.unit_weight_grams || item.typical_unit_weight_grams || null,
      calculated_quantity: calculatedQuantity || null,
      confidence_score: body.counting_method === 'weight' ? 0.95 : 0.80,
      
      // Bottle data
      full_bottles_count: body.full_bottles_count || null,
      partial_bottles_weight: body.partial_bottles_weight || null,
      partial_bottles_equivalent: body.counting_method === 'weight' && item.is_bottled_product
        ? (finalQuantity - (body.full_bottles_count || 0))
        : null,
      
      // Keg data
      keg_tapped_date: body.keg_tapped_date || null,
      keg_temperature_celsius: body.keg_temperature_celsius || null,
      
      // Device
      scale_device_id: body.scale_device_id || null,
      scale_brand: body.scale_brand || null,
      
      // Anomalies
      has_anomalies: !!body.anomaly_notes,
      anomaly_notes: body.anomaly_notes || null,
      
      notes: body.notes || null
    };
    
    const { data: count, error } = await supabase
      .from('inventory_counts')
      .insert(countData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating count:', error);
      return errorResponse(error.message, 500);
    }
    
    // UPDATE CONTAINER ASSIGNMENT
    if (body.container_instance_id) {
      await supabase
        .from('item_container_assignments')
        .upsert({
          client_id,
          inventory_item_id: body.inventory_item_id,
          container_instance_id: body.container_instance_id,
          last_counted_date: formatDate(new Date()),
          last_counted_quantity: finalQuantity,
          last_gross_weight_grams: body.gross_weight_grams,
          is_active: true
        }, {
          onConflict: 'inventory_item_id,container_instance_id'
        });
      
      // Update container usage
      await supabase
        .from('container_instances')
        .update({
          times_used: supabase.raw('times_used + 1'),
          last_used_date: formatDate(new Date())
        })
        .eq('id', body.container_instance_id);
    }
    
    // UPDATE KEG TRACKING
    if (item.is_keg && body.gross_weight_grams) {
      const { data: keg } = await supabase
        .from('keg_tracking')
        .select('id')
        .eq('inventory_item_id', body.inventory_item_id)
        .in('keg_status', ['full', 'tapped'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (keg) {
        await supabase.rpc('update_keg_tracking_status', {
          keg_id: keg.id,
          new_weight_grams: body.gross_weight_grams
        });
        
        if (body.keg_temperature_celsius) {
          await supabase
            .from('keg_tracking')
            .update({
              current_temperature_celsius: body.keg_temperature_celsius,
              last_temperature_check: new Date().toISOString()
            })
            .eq('id', keg.id);
        }
      }
    }
    
    const response: CountSubmissionResponse = {
      count,
      final_quantity: finalQuantity,
      success: true
    };
    
    return NextResponse.json(response, { status: 201 });
    
  } catch (error: any) {
    console.error('POST /api/stock/count/submit error:', error);
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}
```

---

## 📁 File 8: Anomaly Detection API

**Location:** `app/api/stock/count/validate/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { getAuthenticatedClientId, errorResponse } from '@/lib/api-utils';
import type { AnomalyDetectionResult, WeightAnomaly } from '@/types/stock';

export async function POST(request: Request) {
  try {
    const { client_id, supabase } = await getAuthenticatedClientId();
    const body = await request.json();
    
    const {
      inventory_item_id,
      container_instance_id,
      measured_weight_grams,
      tare_weight_grams,
      context
    } = body;
    
    const anomalies: WeightAnomaly[] = [];
    
    // Get container info if provided
    let container = null;
    if (container_instance_id) {
      const { data } = await supabase
        .from('container_instances')
        .select('*, container_type:container_tare_weights(*)')
        .eq('id', container_instance_id)
        .single();
      container = data;
    }
    
    // RULE 1: Tare Weight Error (CRITICAL)
    const effectiveTare = container?.tare_weight_grams || tare_weight_grams || 0;
    if (measured_weight_grams < effectiveTare) {
      anomalies.push({
        type: 'tare_weight_error',
        severity: 'critical',
        message: `Measured weight (${measured_weight_grams.toFixed(1)}g) is less than tare weight (${effectiveTare}g)`,
        suggested_action: 'Check if correct container was scanned. Verify scale calibration.',
        confidence_score: 1.0
      });
    }
    
    // RULE 2: Negative Weight (CRITICAL)
    if (measured_weight_grams < 0) {
      anomalies.push({
        type: 'negative_weight',
        severity: 'critical',
        message: 'Measured weight is negative',
        suggested_action: 'Recalibrate scale or check connections',
        confidence_score: 1.0
      });
    }
    
    // RULE 3: Empty Container Detection (WARNING)
    if (container) {
      const netWeight = measured_weight_grams - effectiveTare;
      if (netWeight < 10 && netWeight >= 0) {
        anomalies.push({
          type: 'empty_container',
          severity: 'warning',
          message: `Container appears empty (${netWeight.toFixed(1)}g net weight)`,
          suggested_action: 'If intentionally empty, proceed. Otherwise, check if product was forgotten.',
          confidence_score: 0.95
        });
      }
    }
    
    // RULE 4: Statistical Outlier (WARNING)
    if (inventory_item_id) {
      const { data: history } = await supabase
        .from('inventory_counts')
        .select('gross_weight_grams')
        .eq('inventory_item_id', inventory_item_id)
        .eq('counting_method', 'weight')
        .not('gross_weight_grams', 'is', null)
        .order('count_date', { ascending: false })
        .limit(20);
      
      if (history && history.length >= 5) {
        const weights = history.map(h => h.gross_weight_grams!);
        const mean = weights.reduce((sum, w) => sum + w, 0) / weights.length;
        const variance = weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weights.length;
        const stdDev = Math.sqrt(variance);
        const zScore = stdDev > 0 ? Math.abs((measured_weight_grams - mean) / stdDev) : 0;
        
        if (zScore > 3.0) {
          anomalies.push({
            type: 'outlier_weight',
            severity: 'warning',
            message: `Weight is ${zScore.toFixed(1)} standard deviations from historical average`,
            suggested_action: `Verify measurement. Historical average: ${mean.toFixed(0)}g`,
            confidence_score: 0.85
          });
        }
      }
    }
    
    // RULE 5: Impossible Weight (ERROR)
    if (container?.container_type?.max_capacity_ml) {
      // Assume max density of 1.2 kg/L for food products
      const maxPossibleNet = (container.container_type.max_capacity_ml / 1000) * 1200;
      const netWeight = measured_weight_grams - effectiveTare;
      
      if (netWeight > maxPossibleNet) {
        anomalies.push({
          type: 'impossible_weight',
          severity: 'error',
          message: `Net weight (${netWeight.toFixed(0)}g) exceeds container capacity`,
          suggested_action: 'Check if correct container type was scanned',
          confidence_score: 0.90
        });
      }
    }
    
    // Determine result
    const hasCritical = anomalies.some(a => a.severity === 'critical');
    const hasError = anomalies.some(a => a.severity === 'error');
    const hasWarning = anomalies.some(a => a.severity === 'warning');
    
    const result: AnomalyDetectionResult = {
      has_anomaly: anomalies.length > 0,
      anomalies,
      can_proceed: !hasCritical,
      require_confirmation: hasError || hasWarning
    };
    
    // Log anomaly if detected
    if (result.has_anomaly) {
      await supabase
        .from('weight_anomaly_detections')
        .insert({
          client_id,
          detection_type: context || 'count',
          inventory_item_id,
          container_instance_id,
          anomaly_type: anomalies[0].type,
          severity: anomalies[0].severity,
          measured_weight_grams,
          detection_rule: anomalies[0].type,
          confidence_score: anomalies[0].confidence_score
        });
    }
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('POST /api/stock/count/validate error:', error);
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}
```

---

## ✅ Implementation Checklist for Claude Code

### Step 1: Create Type Definitions
- [ ] Create `/types/stock.ts` with all interfaces

### Step 2: Create Utilities
- [ ] Create `/lib/api-utils.ts` with helper functions

### Step 3: Create API Routes (in order)
- [ ] Create `/app/api/stock/items/route.ts`
- [ ] Create `/app/api/stock/items/[id]/route.ts`
- [ ] Create `/app/api/stock/containers/route.ts`
- [ ] Create `/app/api/stock/containers/assign/route.ts`
- [ ] Create `/app/api/stock/count/submit/route.ts`
- [ ] Create `/app/api/stock/count/validate/route.ts`

### Step 4: Test Each Endpoint
- [ ] Test GET /api/stock/items (list filtering)
- [ ] Test POST /api/stock/items (create with workflow)
- [ ] Test GET /api/stock/items/[id] (detail view)
- [ ] Test PUT /api/stock/items/[id] (update)
- [ ] Test DELETE /api/stock/items/[id] (soft delete)
- [ ] Test POST /api/stock/containers (with barcode generation)
- [ ] Test POST /api/stock/containers/assign
- [ ] Test POST /api/stock/count/submit (all methods)
- [ ] Test POST /api/stock/count/validate (anomaly detection)

### Step 5: Verify Database Integration
- [ ] Verify RLS policies work (test with different users)
- [ ] Verify barcode generation function works
- [ ] Verify keg tracking function works
- [ ] Verify container assignment updates
- [ ] Verify anomaly detection logging

---

## 🎯 Success Criteria

✅ All endpoints return proper HTTP status codes (200, 201, 400, 401, 404, 500)  
✅ All errors handled gracefully with user-friendly messages  
✅ RLS policies enforced (users only see their client's data)  
✅ Response times < 500ms for count submission  
✅ Anomaly detection blocks critical errors  
✅ Container assignments update correctly  
✅ Keg tracking updates on weight submission  

---

## 🚨 Critical Reminders

1. **Primary Key:** Use `inventory_items.id` (NOT `item_id`)
2. **Client Isolation:** Every query MUST filter by `client_id`
3. **Anomalies:** Don't block all counts, only CRITICAL severity
4. **Container Assignment:** Flexible (not pre-assigned)
5. **Bottle Hybrid:** Calculate full + partial = total equivalent
6. **Keg Updates:** Call `update_keg_tracking_status()` function

---

**READY TO BUILD! 🚀**

These API endpoints form the foundation of the hybrid counting system.
Start with types, then utilities, then implement endpoints in order.

Good luck, Claude Code! 💪
