# JiGR Stock Module - Master Implementation Guide

**Version:** 1.0  
**Date:** November 18, 2025  
**Target:** Claude Code AI Assistant  
**Database Status:** ✅ 100% Complete (21 tables, 43 functions, 6 views)

---

## 🎯 Mission Statement

Build a complete hybrid inventory counting system for New Zealand hospitality businesses that supports:

1. **Weight-Based Counting** - Bluetooth scales with barcode-labeled containers (2-3 second counts)
2. **Manual Counting** - Traditional count entry for individual items
3. **Bottle Hybrid** - Count full bottles, weigh partial bottles
4. **Keg Tracking** - Complete keg lifecycle with freshness monitoring
5. **Batch Management** - In-house prep items with Use By dates

---

## 🏗️ System Architecture

### Technology Stack
```
Frontend:  Next.js 14 (App Router), React 18, TypeScript, TailwindCSS
Backend:   Supabase (PostgreSQL + RLS)
Hardware:  Web Bluetooth API, Camera Barcode Scanner
AI:        Anthropic Claude API (for bottle lookup)
Target:    iPad Air (2013) - Safari 12 compatible
```

### Existing System Integration
```
✅ You already have: /app/stock/ with items, batches, vendors
✅ You already have: inventory_items table with standard fields
✅ Database extended: 25+ new fields added for hybrid counting
✅ Build approach: Enhance existing, don't replace
```

---

## 📊 Database Schema Overview

### Core Tables (Extended)

#### **inventory_items** (EXISTING - ENHANCED)
```typescript
interface InventoryItem {
  // Existing fields
  id: string;
  client_id: string;
  item_name: string;
  brand?: string;
  category_id: string;
  par_level_low: number;
  par_level_high: number;
  recipe_unit: string;
  barcode?: string;
  
  // NEW: Workflow Configuration
  counting_workflow: 'unit_count' | 'container_weight' | 'bottle_hybrid' | 'keg_weight' | 'batch_weight';
  supports_weight_counting: boolean;
  typical_unit_weight_grams?: number;
  default_container_category?: string;
  requires_container: boolean;
  supports_partial_units: boolean;
  
  // NEW: Pack Configuration
  pack_size: number;
  pack_unit?: string;
  order_by_pack: boolean;
  
  // NEW: Bottle Configuration
  is_bottled_product: boolean;
  bottle_volume_ml?: number;
  bottle_shape_id?: string;
  full_bottle_weight_grams?: number;
  empty_bottle_weight_grams?: number;
  
  // NEW: Keg Configuration
  is_keg: boolean;
  keg_volume_liters?: number;
  empty_keg_weight_grams?: number;
  keg_freshness_days?: number;
  keg_storage_temp_min?: number;
  keg_storage_temp_max?: number;
  
  // NEW: Batch Configuration
  is_batch_tracked: boolean;
  batch_use_by_days?: number;
  batch_naming_pattern?: string;
  
  // NEW: Verification
  verification_frequency_months: number;
  last_verification_date?: Date;
}
```

#### **inventory_counts** (EXISTING - ENHANCED)
```typescript
interface InventoryCount {
  id: string;
  client_id: string;
  inventory_item_id: string;
  
  // Basic count
  counted_quantity: number;
  count_date: Date;
  counting_method: 'manual' | 'weight' | 'hybrid';
  counted_by_user_id: string;
  
  // NEW: Weight-Based Counting
  container_instance_id?: string;
  gross_weight_grams?: number;
  tare_weight_grams?: number;
  net_weight_grams?: number;
  unit_weight_grams?: number;
  calculated_quantity?: number;
  confidence_score?: number;
  
  // NEW: Bottle Counting
  full_bottles_count?: number;
  partial_bottles_weight?: number;
  partial_bottles_equivalent?: number;
  
  // NEW: Keg Tracking
  keg_tapped_date?: Date;
  keg_days_since_tap?: number;
  keg_estimated_remaining_liters?: number;
  keg_temperature_celsius?: number;
  
  // NEW: Quality Control
  has_anomalies: boolean;
  anomaly_types?: string[];
  anomaly_override: boolean;
  anomaly_notes?: string;
  
  // Device info
  scale_device_id?: string;
  scale_brand?: string;
  notes?: string;
}
```

### New Tables

#### **container_instances**
```typescript
interface ContainerInstance {
  id: string;
  client_id: string;
  container_barcode: string; // JIGR-C-00001
  container_type_id: string;
  
  container_nickname?: string;
  tare_weight_grams: number;
  last_weighed_date: Date;
  
  verification_due_date?: Date;
  verification_status: 'current' | 'due_soon' | 'overdue';
  
  label_printed_date?: Date;
  times_used: number;
  is_active: boolean;
}
```

#### **keg_tracking**
```typescript
interface KegTracking {
  id: string;
  client_id: string;
  inventory_item_id: string;
  
  keg_barcode?: string;
  received_date: Date;
  received_full_weight_grams?: number;
  
  tapped_date?: Date;
  initial_tapped_weight_grams?: number;
  
  current_weight_grams?: number;
  estimated_remaining_liters?: number;
  estimated_remaining_percentage?: number;
  
  days_since_tap?: number;
  freshness_status: 'fresh' | 'good' | 'declining' | 'expired';
  
  storage_location?: string;
  current_temperature_celsius?: number;
  temperature_in_range: boolean;
  
  keg_status: 'full' | 'tapped' | 'empty' | 'returned';
  
  low_volume_alert: boolean;
  freshness_alert: boolean;
  temperature_alert: boolean;
}
```

#### **item_container_assignments**
```typescript
interface ItemContainerAssignment {
  id: string;
  client_id: string;
  inventory_item_id: string;
  container_instance_id: string;
  
  assigned_date: Date;
  last_counted_date?: Date;
  last_counted_quantity?: number;
  last_gross_weight_grams?: number;
  
  is_active: boolean;
}
```

---

## 🎨 Counting Workflows Explained

### 1. **unit_count** - Traditional Manual Counting
```
Use Case: Unopened beer cases, canned goods, individual items
Process:  User manually enters quantity
Example:  "12 cases of Speights 24pk" → Enter: 12
```

### 2. **container_weight** - Bulk Kitchen Items
```
Use Case: Flour, sugar, prep ingredients in labeled containers
Process:  Scan container barcode → Weigh → Calculate quantity
Example:  Flour in cambro JIGR-C-00045
          Gross: 6500g, Tare: 385g, Net: 6115g
          Unit weight: 1000g/kg → Quantity: 6.12kg
```

### 3. **bottle_hybrid** - Wine & Spirits
```
Use Case: Wine and spirit bottles (full or partial)
Process:  
  - Full bottles: Manual count
  - Opened bottles: Weigh to determine remaining volume
Example:  
  Full bottles: 8
  Opened bottle: 380g remaining / 750ml bottle
  → Equivalent: 0.51 bottles
  Total: 8.51 bottles
```

### 4. **keg_weight** - Beer Kegs
```
Use Case: Beer kegs (always weighed)
Process:  Weigh keg → Calculate remaining beer
Example:  
  Current weight: 45kg
  Empty keg: 13.3kg
  Net beer: 31.7kg ÷ 1.01 (beer density) = 31.4L remaining
  Keg tapped 12 days ago → Status: "good" (freshness)
```

### 5. **batch_weight** - In-House Prep
```
Use Case: House-made sauces, stocks, prep items
Process:  Create batch item with date → Store in containers → Count
Example:  
  "Marinara-2024-11-18" 
  Use by: 7 days (expires 2024-11-25)
  Containers: 2x hotel pans
  Total weight → Quantity in liters
```

---

## 📱 User Experience Flow

### Scenario 1: Kitchen Count (Weight-Based)
```
1. User opens Count page
2. Selects item: "All-Purpose Flour"
3. System detects: counting_workflow = 'container_weight'
4. UI shows: "Scan Container & Weigh" button
5. User scans container barcode: JIGR-C-00012
6. System loads: Tare weight = 385g (6qt cambro)
7. User places on scale
8. Scale reads: 4520g gross weight
9. System calculates:
   - Net: 4520g - 385g = 4135g
   - Quantity: 4135g ÷ 1000g/unit = 4.14kg
10. System checks anomalies: ✓ No issues
11. Count saved: 4.14kg flour in JIGR-C-00012
```

### Scenario 2: Bar Count (Bottle Hybrid)
```
1. User opens Count page
2. Selects item: "Cloudy Bay Sauvignon Blanc 750ml"
3. System detects: counting_workflow = 'bottle_hybrid'
4. UI shows two options:
   - "Count Full Bottles" (manual)
   - "Weigh Partial Bottles" (scale)
5. User counts: 6 full bottles
6. User weighs opened bottle: 620g
7. System calculates partial:
   - Full bottle: 1235g (750ml + 485g bottle)
   - Current: 620g
   - Partial: (620 - 485) / (1235 - 485) = 18% = 0.18 bottles
8. Total: 6 + 0.18 = 6.18 bottles
9. Count saved
```

### Scenario 3: Keg Count
```
1. User opens Keg Dashboard
2. Sees list of tapped kegs with status
3. Selects: "Heineken 50L Keg"
4. System shows:
   - Tapped: 15 days ago
   - Last weight: 28kg
   - Estimated remaining: 14.5L (29%)
   - Freshness: "Good" (30 days freshness window)
5. User weighs keg: 22kg (decreased 6kg)
6. System updates:
   - Remaining: 8.6L (17%)
   - Status: LOW VOLUME ALERT
   - Freshness: Still "Good" (15 days remaining)
7. System suggests: "Order replacement keg"
```

---

## 🎯 Implementation Priorities

### Phase 1: Core API Endpoints (Week 1-2)
```
✅ Enhanced stock items API (workflow support)
✅ Unified count submission API
✅ Container management API
✅ Weight validation API (anomaly detection)
```

### Phase 2: UI Components (Week 3-4)
```
✅ Item form with workflow selector
✅ Unified count page (auto-detects method)
✅ Container management interface
✅ Keg tracking dashboard
```

### Phase 3: Hardware Integration (Week 5-6)
```
✅ Bluetooth scale connector
✅ Camera barcode scanner
✅ Label printer interface
```

### Phase 4: Polish & Test (Week 7-8)
```
✅ iPad Air 2013 compatibility testing
✅ End-to-end testing
✅ Performance optimization
✅ User acceptance testing
```

---

## 🔧 Development Guidelines

### Code Style
```typescript
// PascalCase for components and types
interface ContainerInstance { ... }
export default function CountPage() { ... }

// camelCase for variables and functions
const containerBarcode = 'JIGR-C-00001';
function calculateNetWeight() { ... }

// Use explicit types
const weight: number = 4520;
const item: InventoryItem = { ... };
```

### Error Handling
```typescript
try {
  const response = await fetch('/api/stock/count/submit', {
    method: 'POST',
    body: JSON.stringify(countData)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const result = await response.json();
  return result;
} catch (error) {
  console.error('Count submission failed:', error);
  toast.error('Failed to save count. Please try again.');
  return null;
}
```

### iPad Air 2013 Compatibility
```css
/* ❌ Don't use: */
background-attachment: fixed; /* Not supported in iOS 12 */
position: sticky; /* Buggy in Safari 12 */
gap: 1rem; /* Use margin instead */

/* ✅ Use instead: */
transform: translateZ(0); /* GPU acceleration */
-webkit-overflow-scrolling: touch; /* Smooth scrolling */
display: flex; margin: 0.5rem; /* Instead of gap */
```

### Testing Requirements
```typescript
// Every API endpoint must have:
1. Success case test
2. Error case test
3. Authentication test
4. RLS policy test

// Every UI component must have:
1. Render test
2. User interaction test
3. Error state test
4. Loading state test
```

---

## 📚 Database Functions Available

### Container Functions
```sql
-- Generate unique barcode for new container
SELECT generate_container_barcode('client-id');
-- Returns: 'JIGR-C-00001'

-- Copy standard containers to new client
SELECT copy_standard_containers_to_client('client-id');
-- Returns: number of containers copied
```

### Verification Functions
```sql
-- Calculate when container needs verification
SELECT calculate_verification_due_date('container-id', 6);
-- Returns: DATE (6 months from last verification)

-- Update all container verification statuses
SELECT update_container_verification_status();
-- Updates: 'current', 'due_soon', 'overdue'
```

### Keg Functions
```sql
-- Update keg status based on new weight
SELECT update_keg_tracking_status('keg-id', 45000.0);
-- Updates: remaining_liters, freshness_status, alerts
```

### Batch Functions
```sql
-- Create a new batch item
SELECT create_batch_item(
  'parent-item-id',
  '2024-11-18'::DATE,
  5.0,  -- quantity
  7,    -- use_by_days
  'user-id'
);
-- Returns: new batch item UUID

-- Get active batches needing count
SELECT * FROM get_active_batch_items('client-id');
-- Returns: items with urgency ('critical', 'warning', 'good')
```

### Statistics Functions
```sql
-- Calculate weight statistics for anomaly detection
SELECT * FROM calculate_weight_statistics('client-id', 'item-id', 90);
-- Returns: mean, std_dev, min, max, sample_count

-- Calculate z-score
SELECT calculate_z_score(4520.0, 4200.0, 300.0);
-- Returns: 1.07 (within 3 std devs = not anomaly)
```

### Vendor Functions
```sql
-- Compare prices across vendors
SELECT * FROM get_vendor_price_comparison('client-id', 'item-id');
-- Returns: vendors sorted by price with rank
```

---

## 🎨 UI Design System

### Color Palette
```typescript
const workflowColors = {
  unit_count: '#3B82F6',      // Blue
  container_weight: '#F97316', // Orange
  bottle_hybrid: '#8B5CF6',    // Purple
  keg_weight: '#EAB308',       // Yellow
  batch_weight: '#10B981'      // Green
};

const statusColors = {
  current: '#10B981',   // Green
  due_soon: '#F59E0B',  // Amber
  overdue: '#EF4444',   // Red
  critical: '#DC2626',  // Dark red
  warning: '#F59E0B',   // Amber
  good: '#10B981'       // Green
};
```

### Icons
```typescript
const workflowIcons = {
  unit_count: '🔢',
  container_weight: '⚖️',
  bottle_hybrid: '🍷',
  keg_weight: '🛢️',
  batch_weight: '👨‍🍳'
};
```

---

## ✅ Success Criteria

### API Layer
- [ ] All endpoints return proper HTTP status codes
- [ ] All errors are handled gracefully with user-friendly messages
- [ ] RLS policies enforced (users only see their client's data)
- [ ] All database functions called correctly
- [ ] Response times < 500ms for count submission

### UI Layer
- [ ] All workflows render correctly
- [ ] Workflow auto-detection works
- [ ] Forms validate input properly
- [ ] Loading states show during API calls
- [ ] Error messages display clearly
- [ ] Works on iPad Air 2013 Safari 12

### Hardware Integration
- [ ] Bluetooth scale connects reliably
- [ ] Weight readings display in real-time
- [ ] Barcode scanner captures codes accurately
- [ ] Label printer generates correct barcodes

### User Experience
- [ ] Count submission takes < 5 seconds
- [ ] No confusion about which counting method to use
- [ ] Anomaly alerts are clear and actionable
- [ ] Users can override anomalies with notes

---

## 🚨 Critical Reminders

1. **Primary Key**: `inventory_items.id` (not `item_id`)
2. **Safari 12**: No `background-attachment: fixed`, no modern CSS grid features
3. **RLS**: Every query must be client-scoped via `client_users` table
4. **Anomalies**: Don't block counts completely, allow override with notes
5. **Container Assignment**: Flexible (scan any container), not pre-assigned
6. **Batch Items**: Create separate inventory items with date suffix
7. **Kegs**: Always track tapped date, freshness is critical
8. **Bottles**: Support both full count AND partial weighing

---

## 📞 Need Help?

If you encounter issues:
1. Check database schema matches expected structure
2. Verify RLS policies are working (test with different users)
3. Test API endpoints in isolation before UI
4. Use browser console for debugging (iPad Safari Remote Debugging)
5. Check existing `/app/stock/` code for patterns to follow

---

**READY TO BUILD! 🚀**

This system will revolutionize how NZ hospitality businesses manage inventory.
Start with Phase 1 (API endpoints) and work through systematically.

Good luck, Claude Code! 💪