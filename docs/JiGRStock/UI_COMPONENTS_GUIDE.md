# Stock Module - UI Components Guide

**Project:** JiGR Hybrid Inventory Counting System  
**Version:** 1.0  
**Date:** November 20, 2025  
**Status:** Complete Implementation Guide  
**Target Device:** iPad Air (2013) - iOS 12 / Safari 12

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture)
2. [Design System](#design-system)
3. [Core Components](#core-components)
4. [Counting Interface Components](#counting-components)
5. [Container Management Components](#container-components)
6. [Keg Tracking Components](#keg-components)
7. [Bottle Management Components](#bottle-components)
8. [Batch Management Components](#batch-components)
9. [Anomaly Detection Components](#anomaly-components)
10. [Shared Components](#shared-components)
11. [Page Layouts](#page-layouts)
12. [Integration Patterns](#integration)
13. [iPad Air Optimization](#optimization)

---

## <a name="architecture"></a>🏗️ Architecture Overview

### Component Hierarchy

```
app/
├── stock/
│   ├── page.tsx                          # CONSOLE (Dashboard)
│   ├── count/
│   │   ├── page.tsx                      # ACTION (Main counting interface)
│   │   ├── method-selector/             # Choose counting method
│   │   ├── manual/                       # Manual count flow
│   │   ├── weight/                       # Weight-based flow
│   │   ├── bottle/                       # Bottle hybrid flow
│   │   └── keg/                          # Keg counting flow
│   ├── containers/
│   │   ├── page.tsx                      # Container management
│   │   ├── register/                     # Register new container
│   │   └── verify/                       # Container verification
│   ├── kegs/
│   │   ├── page.tsx                      # Keg dashboard
│   │   ├── receive/                      # Receive new keg
│   │   ├── tap/                          # Tap keg
│   │   └── monitor/                      # Keg monitoring
│   ├── batches/
│   │   ├── page.tsx                      # Batch dashboard
│   │   └── create/                       # Create batch
│   ├── items/
│   │   ├── page.tsx                      # Item list
│   │   ├── [id]/                         # Item details
│   │   └── new/                          # Create item
│   └── reports/
│       └── page.tsx                      # REPORTS (View/Print)
│
└── components/
    └── stock/
        ├── counting/                     # Counting components
        ├── containers/                   # Container components
        ├── kegs/                         # Keg components
        ├── bottles/                      # Bottle components
        ├── batches/                      # Batch components
        └── shared/                       # Shared components
```

### Three-Page Architecture

Following JiGR's established pattern:

1. **CONSOLE** (`/stock/page.tsx`) - Dashboard overview
2. **ACTION** (`/stock/count/page.tsx`) - Main counting interface
3. **REPORTS** (`/stock/reports/page.tsx`) - View and print

---

## <a name="design-system"></a>🎨 Design System

### JiGR Design Principles

**Glass Morphism Effects:**
```css
/* Standard glass card */
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(20px);
border: 2px solid rgba(255, 255, 255, 0.2);
border-radius: 24px;
```

**Color Palette:**
```typescript
const colors = {
  primary: {
    emerald: '#10b981',      // Success, active
    slate: '#1e293b',        // Primary background
    white: '#ffffff'         // Text, borders
  },
  status: {
    success: '#10b981',      // Good, complete
    warning: '#f59e0b',      // Needs attention
    error: '#ef4444',        // Critical, failed
    info: '#3b82f6'          // Informational
  },
  workflow: {
    unit: '#8b5cf6',         // Manual count
    weight: '#10b981',       // Weight-based
    bottle: '#f59e0b',       // Bottle hybrid
    keg: '#3b82f6',          // Keg tracking
    batch: '#ec4899'         // Batch items
  }
};
```

**Typography:**
```css
/* Headings */
h1 { font-size: 32px; font-weight: 700; }
h2 { font-size: 24px; font-weight: 600; }
h3 { font-size: 20px; font-weight: 600; }

/* Body */
body { font-size: 16px; line-height: 1.5; }

/* Small */
.text-sm { font-size: 14px; }
.text-xs { font-size: 12px; }

/* iPad Air minimum */
@media (max-width: 768px) {
  body { font-size: 16px; } /* Never smaller! */
}
```

**Spacing System (8px grid):**
```typescript
const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
};
```

**Touch Targets (iOS Guidelines):**
```css
/* Minimum touch target: 44px × 44px */
button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 24px;
}

/* Interactive elements spacing */
.touch-spacing {
  margin: 8px; /* Prevent accidental taps */
}
```

---

## <a name="core-components"></a>🎯 Core Components

### 1. StockDashboard (CONSOLE)

**Location:** `app/stock/page.tsx`

**Purpose:** Main dashboard showing inventory status, recent counts, alerts

**Features:**
- Inventory summary cards
- Recent count activity
- Anomaly alerts
- Quick action buttons
- Keg freshness warnings
- Container verification reminders

**Component Structure:**
```typescript
// app/stock/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { InventorySummaryCard } from '@/components/stock/dashboard/InventorySummaryCard';
import { RecentCountsList } from '@/components/stock/dashboard/RecentCountsList';
import { AlertsList } from '@/components/stock/dashboard/AlertsList';
import { QuickActions } from '@/components/stock/dashboard/QuickActions';

export default function StockDashboard() {
  const [summary, setSummary] = useState(null);
  const [recentCounts, setRecentCounts] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="stock-dashboard">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <InventorySummaryCard 
          title="Total Items"
          value={summary?.total_items}
          icon="📦"
        />
        <InventorySummaryCard 
          title="Counted Today"
          value={summary?.counted_today}
          icon="✅"
        />
        <InventorySummaryCard 
          title="Needs Attention"
          value={summary?.needs_attention}
          icon="⚠️"
          status="warning"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Alerts */}
      {alerts.length > 0 && (
        <AlertsList alerts={alerts} />
      )}

      {/* Recent Activity */}
      <RecentCountsList counts={recentCounts} />
    </div>
  );
}
```

**Visual Design:**
```
┌─────────────────────────────────────────────┐
│  📊 Stock Dashboard                         │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────┐  ┌───────┐  ┌───────┐         │
│  │ 📦    │  │ ✅    │  │ ⚠️     │         │
│  │ 347   │  │ 42    │  │ 3     │         │
│  │ Items │  │ Today │  │ Alerts│         │
│  └───────┘  └───────┘  └───────┘         │
│                                             │
│  ┌────────────────────────────────┐        │
│  │ 🚀 Quick Actions               │        │
│  │  [Count Inventory] [Receive]  │        │
│  └────────────────────────────────┘        │
│                                             │
│  ⚠️ Alerts (3)                              │
│  • Keg #12 - 2 days until expiry           │
│  • Container C-045 - Verification due      │
│  • Item "Flour" - Low stock                │
│                                             │
│  📋 Recent Counts                           │
│  • Chicken Breast - 12.5 kg (10 mins ago) │
│  • House Marinara - 3.2 kg (23 mins ago)  │
│  • Red Wine - 8.5 bottles (1 hour ago)    │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 2. CountingInterface (ACTION)

**Location:** `app/stock/count/page.tsx`

**Purpose:** Main interface for all counting activities

**Features:**
- Method selection (manual, weight, bottle, keg)
- Item search/selection
- Real-time count entry
- Container selection (for weight-based)
- Anomaly warnings
- Confidence scoring
- Batch submission

**Component Structure:**
```typescript
// app/stock/count/page.tsx
'use client';

import { useState } from 'react';
import { MethodSelector } from '@/components/stock/counting/MethodSelector';
import { ItemSearchSelector } from '@/components/stock/counting/ItemSearchSelector';
import { ManualCountInput } from '@/components/stock/counting/ManualCountInput';
import { WeightCountInput } from '@/components/stock/counting/WeightCountInput';
import { BottleCountInput } from '@/components/stock/counting/BottleCountInput';
import { KegCountInput } from '@/components/stock/counting/KegCountInput';
import { AnomalyAlert } from '@/components/stock/counting/AnomalyAlert';
import { CountSummary } from '@/components/stock/counting/CountSummary';

export default function CountingInterface() {
  const [countingMethod, setCountingMethod] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [countData, setCountData] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  const handleMethodSelect = (method: string) => {
    setCountingMethod(method);
  };

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
  };

  const handleCountSubmit = async (data: any) => {
    // Validate and detect anomalies
    const response = await fetch('/api/stock/count/validate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.has_anomalies) {
      setAnomalies(result.anomalies);
      // Show warning but allow override
    }
    
    // Add to batch
    setCountData([...countData, { ...data, ...result }]);
    
    // Reset for next item
    setSelectedItem(null);
  };

  const handleBatchSubmit = async () => {
    const response = await fetch('/api/stock/count/submit', {
      method: 'POST',
      body: JSON.stringify({ counts: countData })
    });
    
    if (response.ok) {
      // Success - redirect to dashboard
      router.push('/stock');
    }
  };

  return (
    <div className="counting-interface">
      {/* Step 1: Select Method */}
      {!countingMethod && (
        <MethodSelector onSelect={handleMethodSelect} />
      )}

      {/* Step 2: Select Item */}
      {countingMethod && !selectedItem && (
        <ItemSearchSelector 
          method={countingMethod}
          onSelect={handleItemSelect}
        />
      )}

      {/* Step 3: Enter Count (method-specific) */}
      {selectedItem && (
        <>
          {countingMethod === 'unit_count' && (
            <ManualCountInput 
              item={selectedItem}
              onSubmit={handleCountSubmit}
            />
          )}
          
          {countingMethod === 'container_weight' && (
            <WeightCountInput 
              item={selectedItem}
              onSubmit={handleCountSubmit}
            />
          )}
          
          {countingMethod === 'bottle_hybrid' && (
            <BottleCountInput 
              item={selectedItem}
              onSubmit={handleCountSubmit}
            />
          )}
          
          {countingMethod === 'keg_weight' && (
            <KegCountInput 
              item={selectedItem}
              onSubmit={handleCountSubmit}
            />
          )}
        </>
      )}

      {/* Anomaly Alerts */}
      {anomalies.length > 0 && (
        <AnomalyAlert anomalies={anomalies} />
      )}

      {/* Count Summary (bottom sheet) */}
      {countData.length > 0 && (
        <CountSummary 
          counts={countData}
          onSubmit={handleBatchSubmit}
        />
      )}
    </div>
  );
}
```

**Visual Design:**
```
┌─────────────────────────────────────────────┐
│  Count Inventory                            │
├─────────────────────────────────────────────┤
│                                             │
│  How are you counting?                      │
│                                             │
│  ┌────────────┐  ┌────────────┐          │
│  │ 📝 Manual  │  │ ⚖️  Weight  │          │
│  │ Count      │  │ Container  │          │
│  └────────────┘  └────────────┘          │
│                                             │
│  ┌────────────┐  ┌────────────┐          │
│  │ 🍷 Bottle  │  │ 🍺 Keg     │          │
│  │ Hybrid     │  │ Tracking   │          │
│  └────────────┘  └────────────┘          │
│                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                             │
│  📦 Counting Session (3 items)              │
│  ✅ Chicken Breast - 12.5 kg               │
│  ✅ House Marinara - 3.2 kg                │
│  ⚠️  Red Wine - 8.5 bottles (needs review) │
│                                             │
│  [Continue Counting]  [Submit All ✓]       │
│                                             │
└─────────────────────────────────────────────┘
```

---

## <a name="counting-components"></a>📊 Counting Interface Components

### 1. MethodSelector

**Purpose:** Choose counting method (manual, weight, bottle, keg)

```typescript
// components/stock/counting/MethodSelector.tsx
'use client';

interface MethodSelectorProps {
  onSelect: (method: string) => void;
}

export function MethodSelector({ onSelect }: MethodSelectorProps) {
  const methods = [
    {
      id: 'unit_count',
      name: 'Manual Count',
      icon: '📝',
      description: 'Count individual items or packs',
      color: 'purple'
    },
    {
      id: 'container_weight',
      name: 'Weight Container',
      icon: '⚖️',
      description: 'Weigh items in labeled containers',
      color: 'emerald'
    },
    {
      id: 'bottle_hybrid',
      name: 'Bottle Hybrid',
      icon: '🍷',
      description: 'Count full + weigh partial bottles',
      color: 'amber'
    },
    {
      id: 'keg_weight',
      name: 'Keg Tracking',
      icon: '🍺',
      description: 'Track keg weight and freshness',
      color: 'blue'
    }
  ];

  return (
    <div className="method-selector">
      <h2 className="text-2xl font-bold mb-6 text-white">
        How are you counting?
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.map(method => (
          <button
            key={method.id}
            onClick={() => onSelect(method.id)}
            className={`
              method-card
              bg-white/10 backdrop-blur-xl
              border-2 border-white/20
              rounded-2xl p-6
              hover:border-${method.color}-400
              hover:bg-white/20
              transition-all duration-200
              text-left
            `}
          >
            <div className="text-4xl mb-3">{method.icon}</div>
            <div className="text-xl font-semibold text-white mb-2">
              {method.name}
            </div>
            <div className="text-sm text-white/70">
              {method.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

### 2. ItemSearchSelector

**Purpose:** Search and select inventory item to count

```typescript
// components/stock/counting/ItemSearchSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/stock/shared/SearchBar';
import { ItemCard } from '@/components/stock/shared/ItemCard';

interface ItemSearchSelectorProps {
  method: string;
  onSelect: (item: any) => void;
}

export function ItemSearchSelector({ method, onSelect }: ItemSearchSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    loadItems();
  }, [method]);

  const loadItems = async () => {
    // Filter items by compatible workflow
    const response = await fetch(
      `/api/stock/items?workflow=${method}&active=true`
    );
    const data = await response.json();
    setItems(data);
    setFilteredItems(data);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(term.toLowerCase()) ||
      item.sku?.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  return (
    <div className="item-selector">
      <h2 className="text-2xl font-bold mb-4 text-white">
        What are you counting?
      </h2>
      
      <SearchBar 
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Search items..."
      />

      <div className="items-grid mt-4 space-y-3">
        {filteredItems.map(item => (
          <ItemCard 
            key={item.id}
            item={item}
            onClick={() => onSelect(item)}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center text-white/60 mt-8">
          No items found. Try different search terms.
        </div>
      )}
    </div>
  );
}
```

---

### 3. ManualCountInput

**Purpose:** Simple numeric input for manual counting

```typescript
// components/stock/counting/ManualCountInput.tsx
'use client';

import { useState } from 'react';
import { ItemHeader } from '@/components/stock/shared/ItemHeader';
import { NumericKeypad } from '@/components/stock/shared/NumericKeypad';

interface ManualCountInputProps {
  item: any;
  onSubmit: (data: any) => void;
}

export function ManualCountInput({ item, onSubmit }: ManualCountInputProps) {
  const [quantity, setQuantity] = useState<number>(0);

  const handleSubmit = () => {
    onSubmit({
      inventory_item_id: item.id,
      counting_method: 'unit_count',
      quantity: quantity,
      counted_at: new Date().toISOString()
    });
  };

  return (
    <div className="manual-count-input">
      <ItemHeader item={item} />

      {/* Current Quantity Display */}
      <div className="
        bg-white/10 backdrop-blur-xl
        border-2 border-white/20
        rounded-2xl p-8
        text-center mb-6
      ">
        <div className="text-white/70 text-sm mb-2">Quantity</div>
        <div className="text-6xl font-bold text-white">
          {quantity}
        </div>
        {item.pack_size && (
          <div className="text-white/60 text-sm mt-2">
            = {quantity * item.pack_size} {item.pack_unit || 'units'}
          </div>
        )}
      </div>

      {/* Numeric Keypad */}
      <NumericKeypad 
        value={quantity}
        onChange={setQuantity}
        allowDecimals={item.supports_partial_units}
      />

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={quantity === 0}
        className="
          w-full py-4 rounded-2xl
          bg-emerald-500 text-white font-semibold
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:bg-emerald-600
          transition-colors duration-200
        "
      >
        Add to Count ✓
      </button>
    </div>
  );
}
```

---

### 4. WeightCountInput

**Purpose:** Weight-based counting with container selection

```typescript
// components/stock/counting/WeightCountInput.tsx
'use client';

import { useState, useEffect } from 'react';
import { ItemHeader } from '@/components/stock/shared/ItemHeader';
import { ContainerSelector } from '@/components/stock/containers/ContainerSelector';
import { ScaleConnection } from '@/components/stock/hardware/ScaleConnection';

interface WeightCountInputProps {
  item: any;
  onSubmit: (data: any) => void;
}

export function WeightCountInput({ item, onSubmit }: WeightCountInputProps) {
  const [container, setContainer] = useState(null);
  const [grossWeight, setGrossWeight] = useState<number>(0);
  const [netWeight, setNetWeight] = useState<number>(0);
  const [calculatedQty, setCalculatedQty] = useState<number>(0);
  const [scaleConnected, setScaleConnected] = useState(false);

  useEffect(() => {
    if (container && grossWeight > 0) {
      const net = grossWeight - container.current_tare_weight_grams;
      setNetWeight(net);
      
      if (item.typical_unit_weight_grams > 0) {
        const qty = net / item.typical_unit_weight_grams;
        setCalculatedQty(qty);
      }
    }
  }, [container, grossWeight, item]);

  const handleSubmit = () => {
    onSubmit({
      inventory_item_id: item.id,
      counting_method: 'container_weight',
      container_instance_id: container.id,
      gross_weight_grams: grossWeight,
      tare_weight_grams: container.current_tare_weight_grams,
      net_weight_grams: netWeight,
      unit_weight_grams: item.typical_unit_weight_grams,
      calculated_quantity: calculatedQty,
      counted_at: new Date().toISOString()
    });
  };

  return (
    <div className="weight-count-input">
      <ItemHeader item={item} />

      {/* Step 1: Select Container */}
      {!container && (
        <ContainerSelector 
          onSelect={setContainer}
          itemId={item.id}
        />
      )}

      {/* Step 2: Connect Scale */}
      {container && !scaleConnected && (
        <ScaleConnection 
          onConnect={() => setScaleConnected(true)}
        />
      )}

      {/* Step 3: Weigh */}
      {container && scaleConnected && (
        <>
          {/* Weight Display */}
          <div className="
            bg-white/10 backdrop-blur-xl
            border-2 border-white/20
            rounded-2xl p-6 mb-4
          ">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-white/70 text-sm">Gross</div>
                <div className="text-2xl font-bold text-white">
                  {grossWeight}g
                </div>
              </div>
              <div>
                <div className="text-white/70 text-sm">Tare</div>
                <div className="text-2xl font-bold text-white/60">
                  -{container.current_tare_weight_grams}g
                </div>
              </div>
              <div>
                <div className="text-white/70 text-sm">Net</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {netWeight}g
                </div>
              </div>
            </div>
          </div>

          {/* Calculated Quantity */}
          <div className="
            bg-emerald-500/20 backdrop-blur-xl
            border-2 border-emerald-400/50
            rounded-2xl p-8 text-center mb-4
          ">
            <div className="text-white/70 text-sm mb-2">Calculated Quantity</div>
            <div className="text-6xl font-bold text-white">
              {calculatedQty.toFixed(2)}
            </div>
            <div className="text-white/60 text-sm mt-2">
              {item.measurement_unit}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={grossWeight === 0}
            className="
              w-full py-4 rounded-2xl
              bg-emerald-500 text-white font-semibold
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-emerald-600
              transition-colors duration-200
            "
          >
            Add to Count ✓
          </button>
        </>
      )}
    </div>
  );
}
```

---

### 5. BottleCountInput

**Purpose:** Hybrid bottle counting (full + partial)

```typescript
// components/stock/counting/BottleCountInput.tsx
'use client';

import { useState, useEffect } from 'react';
import { ItemHeader } from '@/components/stock/shared/ItemHeader';
import { NumericKeypad } from '@/components/stock/shared/NumericKeypad';

interface BottleCountInputProps {
  item: any;
  onSubmit: (data: any) => void;
}

export function BottleCountInput({ item, onSubmit }: BottleCountInputProps) {
  const [fullBottles, setFullBottles] = useState<number>(0);
  const [partialWeight, setPartialWeight] = useState<number>(0);
  const [step, setStep] = useState<'full' | 'partial'>('full');
  const [totalBottles, setTotalBottles] = useState<number>(0);

  useEffect(() => {
    if (partialWeight > 0) {
      // Calculate partial bottle equivalent
      const liquidWeight = partialWeight - item.empty_bottle_weight_grams;
      const fullLiquidWeight = item.full_bottle_weight_grams - item.empty_bottle_weight_grams;
      const partialEquivalent = liquidWeight / fullLiquidWeight;
      
      setTotalBottles(fullBottles + partialEquivalent);
    } else {
      setTotalBottles(fullBottles);
    }
  }, [fullBottles, partialWeight, item]);

  const handleSubmit = () => {
    onSubmit({
      inventory_item_id: item.id,
      counting_method: 'bottle_hybrid',
      full_bottles_count: fullBottles,
      partial_bottles_weight: partialWeight,
      partial_bottles_equivalent: totalBottles - fullBottles,
      quantity: totalBottles,
      counted_at: new Date().toISOString()
    });
  };

  return (
    <div className="bottle-count-input">
      <ItemHeader item={item} />

      {/* Step Indicator */}
      <div className="flex mb-6">
        <div className={`
          flex-1 text-center py-3 rounded-l-2xl
          ${step === 'full' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'}
        `}>
          1. Full Bottles
        </div>
        <div className={`
          flex-1 text-center py-3 rounded-r-2xl
          ${step === 'partial' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'}
        `}>
          2. Opened Bottles
        </div>
      </div>

      {/* Step 1: Full Bottles */}
      {step === 'full' && (
        <>
          <div className="
            bg-white/10 backdrop-blur-xl
            border-2 border-white/20
            rounded-2xl p-8 text-center mb-6
          ">
            <div className="text-white/70 text-sm mb-2">Full Bottles</div>
            <div className="text-6xl font-bold text-white">
              {fullBottles}
            </div>
          </div>

          <NumericKeypad 
            value={fullBottles}
            onChange={setFullBottles}
            allowDecimals={false}
          />

          <button
            onClick={() => setStep('partial')}
            className="
              w-full py-4 rounded-2xl mt-4
              bg-emerald-500 text-white font-semibold
              hover:bg-emerald-600
              transition-colors duration-200
            "
          >
            Next: Opened Bottles →
          </button>
        </>
      )}

      {/* Step 2: Partial Bottles */}
      {step === 'partial' && (
        <>
          <div className="
            bg-white/10 backdrop-blur-xl
            border-2 border-white/20
            rounded-2xl p-6 mb-4
          ">
            <div className="text-white/70 text-sm mb-3">
              Place all opened bottles on scale
            </div>
            <div className="text-4xl font-bold text-white text-center">
              {partialWeight}g
            </div>
            {partialWeight > 0 && (
              <div className="text-emerald-400 text-sm text-center mt-2">
                = {(totalBottles - fullBottles).toFixed(2)} bottles
              </div>
            )}
          </div>

          {/* Total Display */}
          <div className="
            bg-emerald-500/20 backdrop-blur-xl
            border-2 border-emerald-400/50
            rounded-2xl p-8 text-center mb-4
          ">
            <div className="text-white/70 text-sm mb-2">Total Bottles</div>
            <div className="text-6xl font-bold text-white">
              {totalBottles.toFixed(2)}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('full')}
              className="
                flex-1 py-4 rounded-2xl
                bg-white/10 text-white font-semibold
                hover:bg-white/20
                transition-colors duration-200
              "
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              className="
                flex-1 py-4 rounded-2xl
                bg-emerald-500 text-white font-semibold
                hover:bg-emerald-600
                transition-colors duration-200
              "
            >
              Add to Count ✓
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## <a name="container-components"></a>📦 Container Management Components

### 1. ContainerSelector

**Purpose:** Select or scan container for weight-based counting

```typescript
// components/stock/containers/ContainerSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { BarcodeScanner } from '@/components/stock/hardware/BarcodeScanner';

interface ContainerSelectorProps {
  onSelect: (container: any) => void;
  itemId?: string;
}

export function ContainerSelector({ onSelect, itemId }: ContainerSelectorProps) {
  const [scanMode, setScanMode] = useState(true);
  const [recentContainers, setRecentContainers] = useState([]);

  useEffect(() => {
    loadRecentContainers();
  }, [itemId]);

  const loadRecentContainers = async () => {
    const params = itemId ? `?item_id=${itemId}` : '';
    const response = await fetch(`/api/stock/containers/recent${params}`);
    const data = await response.json();
    setRecentContainers(data);
  };

  const handleScan = async (barcode: string) => {
    const response = await fetch(`/api/stock/containers/${barcode}`);
    if (response.ok) {
      const container = await response.json();
      onSelect(container);
    }
  };

  return (
    <div className="container-selector">
      <h3 className="text-xl font-semibold text-white mb-4">
        Select Container
      </h3>

      {/* Scan or Select Toggle */}
      <div className="flex mb-6">
        <button
          onClick={() => setScanMode(true)}
          className={`
            flex-1 py-3 rounded-l-2xl
            ${scanMode ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'}
          `}
        >
          📷 Scan Barcode
        </button>
        <button
          onClick={() => setScanMode(false)}
          className={`
            flex-1 py-3 rounded-r-2xl
            ${!scanMode ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'}
          `}
        >
          📋 Select from List
        </button>
      </div>

      {/* Scan Mode */}
      {scanMode && (
        <BarcodeScanner 
          onScan={handleScan}
          placeholder="Scan container barcode..."
        />
      )}

      {/* Select Mode */}
      {!scanMode && (
        <div className="space-y-3">
          {recentContainers.map(container => (
            <button
              key={container.id}
              onClick={() => onSelect(container)}
              className="
                w-full p-4 rounded-2xl
                bg-white/10 backdrop-blur-xl
                border-2 border-white/20
                hover:border-emerald-400
                text-left
                transition-all duration-200
              "
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-semibold">
                    {container.barcode}
                  </div>
                  <div className="text-white/60 text-sm">
                    {container.container_type_name} - {container.current_tare_weight_grams}g
                  </div>
                </div>
                {container.needs_verification && (
                  <div className="text-amber-400 text-sm">
                    ⚠️ Due for verification
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 2. ContainerRegistration

**Purpose:** Register new container with barcode and tare weight

```typescript
// components/stock/containers/ContainerRegistration.tsx
'use client';

import { useState } from 'react';
import { BarcodeScanner } from '@/components/stock/hardware/BarcodeScanner';
import { ContainerTypeSelector } from '@/components/stock/containers/ContainerTypeSelector';

export function ContainerRegistration() {
  const [step, setStep] = useState<'type' | 'barcode' | 'weight' | 'confirm'>('type');
  const [containerType, setContainerType] = useState(null);
  const [barcode, setBarcode] = useState('');
  const [tareWeight, setTareWeight] = useState<number>(0);

  const handleSubmit = async () => {
    const response = await fetch('/api/stock/containers', {
      method: 'POST',
      body: JSON.stringify({
        container_type_id: containerType.id,
        barcode: barcode,
        current_tare_weight_grams: tareWeight
      })
    });

    if (response.ok) {
      // Success - show QR code for printing
      const container = await response.json();
      // Navigate to print view
    }
  };

  return (
    <div className="container-registration">
      {/* Progress Steps */}
      <div className="flex mb-8">
        {['Type', 'Barcode', 'Weight', 'Confirm'].map((label, index) => (
          <div
            key={label}
            className={`
              flex-1 text-center py-2
              ${index <= ['type', 'barcode', 'weight', 'confirm'].indexOf(step)
                ? 'bg-emerald-500 text-white'
                : 'bg-white/10 text-white/60'}
              ${index === 0 ? 'rounded-l-2xl' : ''}
              ${index === 3 ? 'rounded-r-2xl' : ''}
            `}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 'type' && (
        <ContainerTypeSelector 
          onSelect={(type) => {
            setContainerType(type);
            setStep('barcode');
          }}
        />
      )}

      {step === 'barcode' && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">
            Generate or Scan Barcode
          </h3>
          <button
            onClick={async () => {
              // Generate barcode
              const response = await fetch('/api/stock/containers/generate-barcode');
              const { barcode: newBarcode } = await response.json();
              setBarcode(newBarcode);
              setStep('weight');
            }}
            className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-semibold mb-4"
          >
            Generate New Barcode
          </button>
          
          <div className="text-white/60 text-center mb-4">or</div>
          
          <BarcodeScanner 
            onScan={(scanned) => {
              setBarcode(scanned);
              setStep('weight');
            }}
          />
        </div>
      )}

      {step === 'weight' && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">
            Weigh Empty Container
          </h3>
          <div className="
            bg-white/10 backdrop-blur-xl
            border-2 border-white/20
            rounded-2xl p-8 text-center mb-6
          ">
            <div className="text-white/70 text-sm mb-2">Tare Weight</div>
            <div className="text-6xl font-bold text-white">
              {tareWeight}g
            </div>
          </div>
          
          <button
            onClick={() => setStep('confirm')}
            disabled={tareWeight === 0}
            className="
              w-full py-4 rounded-2xl
              bg-emerald-500 text-white font-semibold
              disabled:opacity-50
            "
          >
            Continue →
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">
            Confirm Container Details
          </h3>
          
          <div className="
            bg-white/10 backdrop-blur-xl
            border-2 border-white/20
            rounded-2xl p-6 mb-6
            space-y-3
          ">
            <div className="flex justify-between">
              <span className="text-white/70">Type:</span>
              <span className="text-white font-semibold">
                {containerType?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Barcode:</span>
              <span className="text-white font-mono">
                {barcode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Tare Weight:</span>
              <span className="text-white font-semibold">
                {tareWeight}g
              </span>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-semibold"
          >
            Register Container ✓
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## <a name="keg-components"></a>🍺 Keg Tracking Components

### 1. KegDashboard

**Purpose:** Overview of all kegs with freshness monitoring

```typescript
// app/stock/kegs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { KegCard } from '@/components/stock/kegs/KegCard';
import { KegFreshnessAlert } from '@/components/stock/kegs/KegFreshnessAlert';

export default function KegDashboard() {
  const [kegs, setKegs] = useState([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'warning'>('active');

  useEffect(() => {
    loadKegs();
  }, [filter]);

  const loadKegs = async () => {
    const response = await fetch(`/api/stock/kegs?status=${filter}`);
    const data = await response.json();
    setKegs(data);
  };

  const activeKegs = kegs.filter(k => k.status === 'tapped');
  const warningKegs = kegs.filter(k => k.days_until_expiry <= 2);

  return (
    <div className="keg-dashboard">
      <h1 className="text-3xl font-bold text-white mb-6">
        Keg Tracking
      </h1>

      {/* Freshness Alerts */}
      {warningKegs.length > 0 && (
        <KegFreshnessAlert kegs={warningKegs} />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{activeKegs.length}</div>
          <div className="text-white/70 text-sm">Active Kegs</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{warningKegs.length}</div>
          <div className="text-white/70 text-sm">Need Attention</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{kegs.length}</div>
          <div className="text-white/70 text-sm">Total Kegs</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex mb-6">
        <button
          onClick={() => setFilter('active')}
          className={`
            flex-1 py-3 rounded-l-2xl
            ${filter === 'active' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'}
          `}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('warning')}
          className={`
            flex-1 py-3
            ${filter === 'warning' ? 'bg-amber-500 text-white' : 'bg-white/10 text-white/60'}
          `}
        >
          Warnings
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`
            flex-1 py-3 rounded-r-2xl
            ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60'}
          `}
        >
          All
        </button>
      </div>

      {/* Keg Grid */}
      <div className="space-y-4">
        {kegs.map(keg => (
          <KegCard key={keg.id} keg={keg} onUpdate={loadKegs} />
        ))}
      </div>
    </div>
  );
}
```

---

### 2. KegCard

**Purpose:** Individual keg status display

```typescript
// components/stock/kegs/KegCard.tsx
'use client';

interface KegCardProps {
  keg: any;
  onUpdate: () => void;
}

export function KegCard({ keg, onUpdate }: KegCardProps) {
  const getFreshnessColor = () => {
    if (keg.days_until_expiry <= 1) return 'red';
    if (keg.days_until_expiry <= 2) return 'amber';
    return 'emerald';
  };

  const color = getFreshnessColor();

  return (
    <div className={`
      bg-white/10 backdrop-blur-xl
      border-2 border-${color}-400/50
      rounded-2xl p-6
    `}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white">
            {keg.item_name}
          </h3>
          <div className="text-white/60 text-sm">
            Keg #{keg.keg_number}
          </div>
        </div>
        <div className={`
          px-3 py-1 rounded-full
          bg-${color}-500/20 text-${color}-400
          text-sm font-semibold
        `}>
          {keg.status}
        </div>
      </div>

      {/* Freshness Indicator */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/70">Freshness</span>
          <span className={`text-${color}-400 font-semibold`}>
            {keg.days_until_expiry} days remaining
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full bg-${color}-500 transition-all duration-300`}
            style={{ 
              width: `${(keg.days_until_expiry / keg.keg_freshness_days) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Volume Indicator */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/70">Remaining</span>
          <span className="text-white font-semibold">
            {keg.estimated_remaining_liters}L / {keg.keg_volume_liters}L
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ 
              width: `${(keg.estimated_remaining_liters / keg.keg_volume_liters) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-white/70">Tapped</div>
          <div className="text-white">
            {new Date(keg.tapped_date).toLocaleDateString()}
          </div>
        </div>
        <div>
          <div className="text-white/70">Temperature</div>
          <div className="text-white">
            {keg.storage_temperature_celsius}°C
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => {/* Update weight */}}
          className="flex-1 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
        >
          Update Weight
        </button>
        <button
          onClick={() => {/* Mark empty */}}
          className="flex-1 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
        >
          Mark Empty
        </button>
      </div>
    </div>
  );
}
```

---

## <a name="batch-components"></a>🏭 Batch Management Components

### 1. BatchCreation

**Purpose:** Create batch-tracked items with Use By dates

```typescript
// components/stock/batches/BatchCreation.tsx
'use client';

import { useState } from 'react';
import { ItemSearchSelector } from '@/components/stock/counting/ItemSearchSelector';

export function BatchCreation() {
  const [parentItem, setParentItem] = useState(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [prepDate, setPrepDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [useByDays, setUseByDays] = useState<number>(7);

  const handleCreate = async () => {
    const response = await fetch('/api/stock/batches', {
      method: 'POST',
      body: JSON.stringify({
        parent_item_id: parentItem.id,
        prep_date: prepDate,
        quantity: quantity,
        use_by_days: useByDays
      })
    });

    if (response.ok) {
      // Success - navigate to print label
    }
  };

  return (
    <div className="batch-creation">
      <h2 className="text-2xl font-bold text-white mb-6">
        Create Batch Item
      </h2>

      {/* Step 1: Select Parent Item */}
      {!parentItem && (
        <ItemSearchSelector 
          method="batch_weight"
          onSelect={setParentItem}
        />
      )}

      {/* Step 2: Batch Details */}
      {parentItem && (
        <>
          <div className="
            bg-white/10 backdrop-blur-xl
            border-2 border-white/20
            rounded-2xl p-6 mb-6
          ">
            <div className="text-white/70 text-sm mb-2">Parent Item</div>
            <div className="text-xl font-semibold text-white">
              {parentItem.name}
            </div>
          </div>

          {/* Prep Date */}
          <div className="mb-4">
            <label className="text-white/70 text-sm block mb-2">
              Preparation Date
            </label>
            <input
              type="date"
              value={prepDate}
              onChange={(e) => setPrepDate(e.target.value)}
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/10 border-2 border-white/20
                text-white
              "
            />
          </div>

          {/* Use By Days */}
          <div className="mb-4">
            <label className="text-white/70 text-sm block mb-2">
              Use By Days
            </label>
            <input
              type="number"
              value={useByDays}
              onChange={(e) => setUseByDays(parseInt(e.target.value))}
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/10 border-2 border-white/20
                text-white
              "
            />
            <div className="text-white/60 text-sm mt-2">
              Use by: {new Date(Date.parse(prepDate) + useByDays * 86400000).toLocaleDateString()}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <label className="text-white/70 text-sm block mb-2">
              Quantity Prepared
            </label>
            <input
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value))}
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/10 border-2 border-white/20
                text-white text-2xl font-bold
              "
            />
          </div>

          {/* Preview Batch Name */}
          <div className="
            bg-emerald-500/20 backdrop-blur-xl
            border-2 border-emerald-400/50
            rounded-2xl p-6 mb-6
          ">
            <div className="text-white/70 text-sm mb-2">Batch Label</div>
            <div className="text-xl font-semibold text-white">
              {parentItem.name}-{prepDate}
            </div>
            <div className="text-emerald-400 text-sm mt-2">
              Use By: {new Date(Date.parse(prepDate) + useByDays * 86400000).toLocaleDateString()}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={quantity === 0}
            className="
              w-full py-4 rounded-2xl
              bg-emerald-500 text-white font-semibold
              disabled:opacity-50
              hover:bg-emerald-600
            "
          >
            Create Batch & Print Label ✓
          </button>
        </>
      )}
    </div>
  );
}
```

---

## <a name="anomaly-components"></a>⚠️ Anomaly Detection Components

### 1. AnomalyAlert

**Purpose:** Display anomaly warnings with override options

```typescript
// components/stock/counting/AnomalyAlert.tsx
'use client';

interface AnomalyAlertProps {
  anomalies: Array<{
    anomaly_type: string;
    severity: 'warning' | 'error';
    message: string;
    suggestion: string;
  }>;
  onOverride?: () => void;
  onRecount?: () => void;
}

export function AnomalyAlert({ anomalies, onOverride, onRecount }: AnomalyAlertProps) {
  const hasErrors = anomalies.some(a => a.severity === 'error');

  return (
    <div className={`
      backdrop-blur-xl rounded-2xl p-6 mb-6
      border-2
      ${hasErrors 
        ? 'bg-red-500/20 border-red-400/50' 
        : 'bg-amber-500/20 border-amber-400/50'}
    `}>
      <div className="flex items-start gap-3 mb-4">
        <div className="text-3xl">
          {hasErrors ? '🚨' : '⚠️'}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">
            {hasErrors ? 'Critical Issue Detected' : 'Unusual Count Detected'}
          </h3>
          <p className="text-white/80 text-sm">
            {hasErrors 
              ? 'This count has critical issues that must be resolved.'
              : 'This count is unusual compared to historical data. Please verify.'}
          </p>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="space-y-3 mb-6">
        {anomalies.map((anomaly, index) => (
          <div 
            key={index}
            className="bg-black/20 rounded-xl p-4"
          >
            <div className="font-semibold text-white mb-1">
              {anomaly.message}
            </div>
            <div className="text-white/70 text-sm">
              💡 {anomaly.suggestion}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onRecount && (
          <button
            onClick={onRecount}
            className="
              flex-1 py-3 rounded-xl
              bg-white/10 text-white font-semibold
              hover:bg-white/20
            "
          >
            🔄 Recount
          </button>
        )}
        {onOverride && !hasErrors && (
          <button
            onClick={onOverride}
            className="
              flex-1 py-3 rounded-xl
              bg-white/10 text-white font-semibold
              hover:bg-white/20
            "
          >
            ✓ Continue Anyway
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## <a name="shared-components"></a>🔧 Shared Components

### 1. NumericKeypad

**Purpose:** Touch-friendly numeric input

```typescript
// components/stock/shared/NumericKeypad.tsx
'use client';

interface NumericKeypadProps {
  value: number;
  onChange: (value: number) => void;
  allowDecimals?: boolean;
}

export function NumericKeypad({ value, onChange, allowDecimals = true }: NumericKeypadProps) {
  const handlePress = (key: string) => {
    if (key === 'C') {
      onChange(0);
    } else if (key === '←') {
      const str = value.toString();
      onChange(parseFloat(str.slice(0, -1)) || 0);
    } else if (key === '.') {
      if (allowDecimals && !value.toString().includes('.')) {
        onChange(parseFloat(value.toString() + '.'));
      }
    } else {
      onChange(parseFloat(value.toString() + key));
    }
  };

  const keys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['.', '0', '←']
  ];

  return (
    <div className="numeric-keypad mb-4">
      {keys.map((row, i) => (
        <div key={i} className="grid grid-cols-3 gap-3 mb-3">
          {row.map(key => (
            <button
              key={key}
              onClick={() => handlePress(key)}
              disabled={key === '.' && !allowDecimals}
              className="
                h-16 rounded-2xl
                bg-white/10 backdrop-blur-xl
                border-2 border-white/20
                text-white text-2xl font-semibold
                hover:bg-white/20
                active:bg-white/30
                disabled:opacity-30
                transition-all duration-150
              "
            >
              {key}
            </button>
          ))}
        </div>
      ))}
      <button
        onClick={() => handlePress('C')}
        className="
          w-full h-16 rounded-2xl
          bg-red-500/20 border-2 border-red-400/50
          text-white text-xl font-semibold
          hover:bg-red-500/30
        "
      >
        Clear
      </button>
    </div>
  );
}
```

---

### 2. SearchBar

**Purpose:** Reusable search input

```typescript
// components/stock/shared/SearchBar.tsx
'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full px-4 py-3 pl-12 rounded-2xl
          bg-white/10 backdrop-blur-xl
          border-2 border-white/20
          text-white placeholder-white/50
          focus:border-emerald-400 focus:outline-none
        "
      />
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">
        🔍
      </div>
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
        >
          ✕
        </button>
      )}
    </div>
  );
}
```

---

## <a name="optimization"></a>📱 iPad Air (2013) Optimization

### Performance Checklist

**✅ Memory Management:**
```typescript
// Lazy load heavy components
const KegDashboard = lazy(() => import('@/components/stock/kegs/KegDashboard'));

// Paginate long lists
const ITEMS_PER_PAGE = 20;

// Debounce search
const debouncedSearch = useMemo(
  () => debounce((term: string) => handleSearch(term), 300),
  []
);
```

**✅ CSS Compatibility:**
```css
/* Avoid features not in Safari 12 */
/* ❌ CSS Grid gap (use margin) */
/* ❌ backdrop-filter blur (provide fallback) */
/* ✅ Flexbox (fully supported) */
/* ✅ CSS animations (fully supported) */

/* Safe backdrop blur with fallback */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
}

/* Fallback for older Safari */
@supports not (backdrop-filter: blur(20px)) {
  .glass-card {
    background: rgba(255, 255, 255, 0.2);
  }
}
```

**✅ Touch Optimization:**
```css
/* Minimum touch targets */
button, a, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}

/* Remove tap highlight */
* {
  -webkit-tap-highlight-color: transparent;
}

/* Smooth scrolling */
.scrollable {
  -webkit-overflow-scrolling: touch;
}
```

**✅ JavaScript Features:**
```typescript
// Safe: ES6 features supported in iOS 12
const items = [...existingItems, newItem]; // Spread
const filtered = items.filter(i => i.active); // Arrow functions
const mapped = items.map(i => ({ ...i, counted: true })); // Object spread

// Avoid: Not supported in iOS 12
// ❌ Optional chaining: item?.property
// ❌ Nullish coalescing: value ?? default
// Use traditional checks instead:
const property = item && item.property;
const value = value !== null && value !== undefined ? value : default;
```

---

## 📚 Implementation Priority

### Phase 1: Core Counting (Week 1-2)
1. StockDashboard (CONSOLE)
2. CountingInterface (ACTION)
3. MethodSelector
4. ManualCountInput
5. ItemSearchSelector

### Phase 2: Weight-Based (Week 3-4)
6. WeightCountInput
7. ContainerSelector
8. ScaleConnection (hardware)
9. ContainerRegistration

### Phase 3: Bottle & Keg (Week 5-6)
10. BottleCountInput
11. KegCountInput
12. KegDashboard
13. KegCard

### Phase 4: Batch & Anomaly (Week 7-8)
14. BatchCreation
15. AnomalyAlert
16. Reports (printing)

---

## 🎯 Success Criteria

**Functional Requirements:**
- ✅ All 5 counting workflows working
- ✅ Container registration and tracking
- ✅ Keg lifecycle management
- ✅ Batch creation with Use By dates
- ✅ Anomaly detection with override

**Performance:**
- ✅ <3 second page load on iPad Air
- ✅ Smooth 60fps animations
- ✅ <1 second count submission

**User Experience:**
- ✅ No accidental taps (44px minimum)
- ✅ Clear visual feedback
- ✅ Graceful error handling
- ✅ Works offline (future enhancement)

---

**Document Status:** Complete ✅  
**Ready for Implementation:** Yes  
**Estimated Development Time:** 8-10 weeks  
**Last Updated:** November 20, 2025
