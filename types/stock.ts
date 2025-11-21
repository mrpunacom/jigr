/**
 * JiGR Stock Module - TypeScript Type Definitions
 * 
 * Complete type definitions for the hybrid inventory counting system
 * supporting 5 counting workflows with anomaly detection and keg tracking
 */

// ============================================================================
// CORE ENUMS AND BASIC TYPES
// ============================================================================

export type CountingWorkflow = 
  | 'unit_count'        // Manual counting (traditional)
  | 'container_weight'  // Bulk items in labeled containers  
  | 'bottle_hybrid'     // Wine/spirits (full bottles + partial weighing)
  | 'keg_weight'        // Beer kegs (always weighed)
  | 'batch_weight';     // In-house prep with Use By dates

export type CountingMethod = 'manual' | 'weight' | 'hybrid' | 'barcode';

export type VerificationStatus = 'current' | 'due_soon' | 'overdue';

export type KegStatus = 'full' | 'tapped' | 'empty' | 'returned';

export type FreshnessStatus = 'fresh' | 'good' | 'declining' | 'expired';

export type AnomalySeverity = 'info' | 'warning' | 'error' | 'critical';

export type AnomalyType = 
  | 'empty_container'      // Container appears empty (< 10g net weight)
  | 'impossible_weight'    // Weight exceeds physical container capacity
  | 'negative_weight'      // Scale reading is negative
  | 'tare_weight_error'    // Measured weight less than tare weight
  | 'keg_nearly_empty'     // Keg weight suggests < 5% remaining
  | 'bottle_too_light'     // Bottle weight suggests completely empty
  | 'suspicious_increase'  // Large increase from last count (possible error)
  | 'outlier_weight'       // Statistical outlier based on history
  | 'container_mismatch';  // Container type doesn't match item requirements

// ============================================================================
// INVENTORY ITEM (Extended for Hybrid Counting)
// ============================================================================

export interface InventoryItem {
  // Core identification
  id: string;
  client_id: string;
  category_id: string;
  item_name: string;
  brand?: string;
  item_code?: string;
  barcode?: string;
  
  // Units and measurements
  recipe_unit: string;             // e.g., "kg", "liters", "units"
  recipe_unit_yield?: number;      // How many recipe units in one count unit
  count_unit?: string;             // Unit used for counting (may differ from recipe)
  count_unit_conversion?: number;  // Conversion factor: count_unit → recipe_unit
  
  // Par levels for reordering
  par_level_low: number;           // Minimum acceptable quantity
  par_level_high: number;          // Maximum target quantity
  
  // Storage information
  storage_location?: string;       // Where item is typically stored
  
  // ========================================
  // WORKFLOW CONFIGURATION (NEW FIELDS)
  // ========================================
  
  counting_workflow: CountingWorkflow;        // Which counting method to use
  supports_weight_counting: boolean;          // Can this item be weighed?
  typical_unit_weight_grams?: number;         // Weight of one unit (for calculation)
  default_container_category?: string;        // Preferred container type category
  requires_container: boolean;                // Must use container for counting
  supports_partial_units: boolean;           // Can count fractional amounts
  
  // ========================================
  // PACK CONFIGURATION (NEW FIELDS)
  // ========================================
  
  pack_size: number;               // How many units in one pack
  pack_unit?: string;              // What constitutes a "pack" (case, box, etc.)
  order_by_pack: boolean;          // Whether ordering is done by pack or individual units
  
  // ========================================
  // BOTTLE CONFIGURATION (NEW FIELDS)
  // ========================================
  
  is_bottled_product: boolean;                // Is this a wine/spirit bottle?
  bottle_volume_ml?: number;                  // Volume when full (750ml, etc.)
  bottle_shape_id?: string;                   // Reference to wine_bottle_shapes table
  full_bottle_weight_grams?: number;          // Weight of full bottle including contents
  empty_bottle_weight_grams?: number;         // Weight of empty bottle (tare)
  
  // ========================================
  // KEG CONFIGURATION (NEW FIELDS)
  // ========================================
  
  is_keg: boolean;                            // Is this a beer keg?
  keg_volume_liters?: number;                 // Keg capacity (50L, etc.)
  empty_keg_weight_grams?: number;            // Weight of empty keg (typically 13.3kg)
  keg_freshness_days?: number;                // Days keg stays fresh after tapping
  keg_storage_temp_min?: number;              // Minimum storage temperature (°C)
  keg_storage_temp_max?: number;              // Maximum storage temperature (°C)
  
  // ========================================
  // BATCH CONFIGURATION (NEW FIELDS)
  // ========================================
  
  is_batch_tracked: boolean;                  // Is this made in-house with batches?
  batch_use_by_days?: number;                 // Days until batch expires
  batch_naming_pattern?: string;              // Pattern for batch naming (e.g., "{item_name}-{date}")
  
  // ========================================
  // VERIFICATION AND MAINTENANCE
  // ========================================
  
  verification_frequency_months: number;      // How often to verify container weights
  last_verification_date?: string;            // When containers were last verified
  
  // Status and metadata
  is_active: boolean;
  notes?: string;
  
  // Audit fields
  created_at: string;
  updated_at: string;
}

// ============================================================================
// CONTAINER INSTANCE (Physical Containers)
// ============================================================================

export interface ContainerInstance {
  id: string;
  client_id: string;
  container_barcode: string;       // e.g., "JIGR-C-00001"
  container_type_id: string;       // Reference to container_tare_weights
  container_nickname?: string;     // Optional friendly name
  location_id?: string;            // Where container is stored
  
  // Weight tracking
  tare_weight_grams: number;       // Empty container weight
  last_weighed_date: string;       // When tare was last verified
  needs_reweigh: boolean;          // Flag if tare verification is needed
  
  // Verification schedule
  verification_due_date?: string;   // When next verification is due
  verification_status: VerificationStatus;  // current, due_soon, overdue
  
  // Label management
  label_printed_date?: string;      // When barcode label was printed
  label_batch_number?: string;      // Batch number of printed labels
  
  // Usage tracking
  times_used: number;              // How many times container has been used
  last_used_date?: string;         // When container was last used for counting
  
  // Lifecycle management
  is_active: boolean;              // Whether container is still in use
  retired_date?: string;           // When container was retired
  retirement_reason?: string;      // Why container was retired
  
  // Audit fields
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INVENTORY COUNT (Enhanced for Hybrid Counting)
// ============================================================================

export interface InventoryCount {
  // Core identification
  id: string;
  client_id: string;
  inventory_item_id: string;
  
  // Basic count information
  counted_quantity: number;        // Final calculated quantity
  count_date: string;              // Date of count (YYYY-MM-DD)
  count_time?: string;             // Time of count (HH:MM:SS)
  count_type: string;              // Type of count (regular, spot_check, etc.)
  location?: string;               // Where count was performed
  counting_method: CountingMethod; // How the count was performed
  
  counted_by_user_id: string;      // Who performed the count
  
  // ========================================
  // WEIGHT-BASED COUNTING DATA (NEW FIELDS)
  // ========================================
  
  container_instance_id?: string;  // Which container was used
  gross_weight_grams?: number;     // Total weight (container + contents)
  tare_weight_grams?: number;      // Container weight (empty)
  net_weight_grams?: number;       // Contents weight (gross - tare)
  unit_weight_grams?: number;      // Weight per unit (for calculation)
  calculated_quantity?: number;    // Quantity calculated from weight
  confidence_score?: number;       // How confident we are in the measurement (0-1)
  
  // ========================================
  // BOTTLE-SPECIFIC DATA (NEW FIELDS)
  // ========================================
  
  full_bottles_count?: number;          // Number of unopened bottles
  partial_bottles_weight?: number;      // Weight of opened bottles
  partial_bottles_equivalent?: number;  // Partial bottles as decimal equivalent
  
  // ========================================
  // KEG-SPECIFIC DATA (NEW FIELDS)
  // ========================================
  
  keg_tapped_date?: string;              // When keg was first tapped
  keg_days_since_tap?: number;           // Days since tapping
  keg_estimated_remaining_liters?: number; // Calculated remaining volume
  keg_temperature_celsius?: number;      // Temperature at time of measurement
  
  // ========================================
  // ANOMALY DETECTION (NEW FIELDS)
  // ========================================
  
  has_anomalies: boolean;          // Whether any anomalies were detected
  anomaly_types?: string[];        // List of anomaly types found
  anomaly_override: boolean;       // Whether user overrode anomaly warnings
  anomaly_notes?: string;          // User explanation for overriding anomalies
  
  // ========================================
  // DEVICE AND TECHNICAL DATA
  // ========================================
  
  scale_device_id?: string;        // ID of Bluetooth scale used
  scale_brand?: string;            // Brand/model of scale
  
  notes?: string;                  // General notes about the count
  
  // Variance analysis (calculated fields)
  expected_quantity?: number;      // Expected quantity based on par levels
  variance_quantity?: number;      // Difference from expected
  variance_percentage?: number;    // Percentage variance
  
  // Quality control
  is_verified: boolean;           // Whether count has been verified by supervisor
  verified_by_user_id?: string;   // Who verified the count
  verified_at?: string;           // When count was verified
  
  // Audit fields
  created_at: string;
  updated_at: string;
}

// ============================================================================
// KEG TRACKING (Complete Lifecycle Management)
// ============================================================================

export interface KegTracking {
  id: string;
  client_id: string;
  inventory_item_id: string;      // Which beer/beverage this keg contains
  
  // Keg identification
  keg_barcode?: string;           // Barcode on the keg itself
  keg_serial_number?: string;     // Brewery serial number
  
  // Reception tracking
  received_date: string;                    // When keg was delivered
  received_full_weight_grams?: number;      // Weight when received (full)
  vendor_id?: string;                       // Which vendor delivered it
  
  // Tapping tracking
  tapped_date?: string;                     // When keg was first tapped
  tapped_by_user_id?: string;               // Who tapped the keg
  initial_tapped_weight_grams?: number;     // Weight immediately after tapping
  
  // Current status
  current_weight_grams?: number;            // Most recent weight measurement
  estimated_remaining_liters?: number;      // Calculated remaining volume
  estimated_remaining_percentage?: number;  // Percentage of original volume remaining
  
  // Freshness tracking
  days_since_tap?: number;                  // Days since keg was tapped
  estimated_days_until_bad?: number;        // Days until keg goes bad
  freshness_status: FreshnessStatus;        // fresh, good, declining, expired
  
  // Environmental monitoring
  storage_location?: string;                // Where keg is stored
  current_temperature_celsius?: number;     // Current temperature
  temperature_in_range: boolean;           // Whether temperature is acceptable
  last_temperature_check?: string;         // When temperature was last checked
  
  // Lifecycle status
  keg_status: KegStatus;                   // full, tapped, empty, returned
  emptied_date?: string;                   // When keg was finished
  returned_to_vendor_date?: string;       // When empty keg was returned
  
  // Alert flags
  low_volume_alert: boolean;               // Keg is running low
  freshness_alert: boolean;               // Keg freshness is declining
  temperature_alert: boolean;             // Temperature is out of range
  
  // Audit fields
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ANOMALY DETECTION SYSTEM
// ============================================================================

export interface WeightAnomaly {
  type: AnomalyType;               // Which rule triggered
  severity: AnomalySeverity;       // How serious the issue is
  message: string;                 // Human-readable description
  suggested_action: string;        // What user should do
  confidence_score: number;        // How confident we are (0-1)
}

export interface AnomalyDetectionResult {
  has_anomaly: boolean;            // Whether any anomaly was detected
  anomalies: WeightAnomaly[];      // List of all detected anomalies
  can_proceed: boolean;            // Whether count can continue (false for critical errors)
  require_confirmation: boolean;   // Whether user must confirm before proceeding
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CountSubmissionRequest {
  inventory_item_id: string;
  counting_method: CountingMethod;
  
  // Manual counting
  counted_quantity?: number;
  
  // Weight-based counting
  container_instance_id?: string;
  gross_weight_grams?: number;
  tare_weight_grams?: number;
  net_weight_grams?: number;
  unit_weight_grams?: number;
  
  // Bottle hybrid counting
  full_bottles_count?: number;
  partial_bottles_weight?: number;
  
  // Keg counting
  keg_tapped_date?: string;
  keg_temperature_celsius?: number;
  
  // Device information
  scale_device_id?: string;
  scale_brand?: string;
  
  // Additional context
  notes?: string;
}

export interface CountSubmissionResponse {
  count: InventoryCount;           // The created count record
  final_quantity: number;          // Calculated final quantity
  anomalies?: WeightAnomaly[];     // Any anomalies detected
  success: boolean;                // Whether submission succeeded
}

export interface BatchItemRequest {
  parent_item_id: string;          // Original item this batch is made from
  batch_date: string;              // Date batch was made (YYYY-MM-DD)
  production_quantity: number;     // How much was produced
  use_by_days?: number;           // Days until batch expires (override item default)
  notes?: string;                  // Production notes
}

export interface KegTapRequest {
  keg_tracking_id: string;         // Which keg record to update
  tapped_date?: string;            // When tapped (defaults to now)
  initial_weight_grams: number;    // Weight after tapping
  storage_location?: string;       // Where keg is being stored
}

export interface KegWeighRequest {
  keg_tracking_id: string;         // Which keg to update
  current_weight_grams: number;    // New weight measurement
  temperature_celsius?: number;    // Current temperature (if available)
}

// ============================================================================
// UTILITY TYPES FOR API RESPONSES
// ============================================================================

export interface StockItemsResponse {
  items: InventoryItem[];
  grouped: Record<CountingWorkflow, InventoryItem[]>;
  total: number;
}

export interface ContainerInstancesResponse {
  containers: ContainerInstance[];
  total: number;
}

export interface ItemDetailResponse {
  item: InventoryItem;
  recent_counts: InventoryCount[];
  containers?: ContainerInstance[];
}

// ============================================================================
// FILTER AND SEARCH TYPES
// ============================================================================

export interface StockFilterOptions {
  workflow?: CountingWorkflow;
  supports_weight?: boolean;
  is_bottled?: boolean;
  is_keg?: boolean;
  is_batch?: boolean;
  search?: string;
  category_id?: string;
  location?: string;
  status?: 'active' | 'inactive' | 'all';
}

export interface ContainerFilterOptions {
  status?: VerificationStatus;
  is_active?: boolean;
  container_type_id?: string;
  location_id?: string;
  needs_verification?: boolean;
}

export interface CountHistoryOptions {
  inventory_item_id?: string;
  counting_method?: CountingMethod;
  date_from?: string;
  date_to?: string;
  has_anomalies?: boolean;
  limit?: number;
  offset?: number;
}