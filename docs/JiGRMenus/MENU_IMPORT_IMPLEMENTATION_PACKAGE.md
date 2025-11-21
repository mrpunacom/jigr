# MENU Import - Complete Implementation Package

**Project:** JiGR MENU Import Module  
**Target:** Claude Code Implementation  
**Timeline:** 2-3 weeks  
**Difficulty:** MEDIUM  
**Status:** Ready for Implementation

---

## 📋 Quick Start Guide

### What You're Building

A **Google Sheets import system** for restaurant menu pricing that:
- Imports menu items, prices, and categories from spreadsheets
- Validates pricing against target food cost percentages
- Links menu items to existing recipes (when available)
- Provides instant pricing insights
- Supports 95%+ of restaurant menu formats

### Why This Matters

**Business Impact:**
- Eliminates 2-3 hours of manual menu data entry
- Validates pricing strategy automatically
- Catches pricing errors before they cost money
- Enables seamless client onboarding

### Implementation Scope

**Estimated Time:** 1-2 weeks  
**Files to Create:** 8-10 files  
**API Endpoints:** 3 endpoints  
**Database Changes:** 1 migration  
**Complexity:** Medium (builds on Stock import patterns)

---

## 🗄️ STEP 1: Database Migration (30 minutes)

### Migration File: `034_menu_import_enhancements.sql`

```sql
-- Enhance MenuPricing table for import functionality
ALTER TABLE MenuPricing 
ADD COLUMN IF NOT EXISTS import_method VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS source_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS target_food_cost_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS actual_food_cost_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS price_recommendation DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS import_notes TEXT,
ADD COLUMN IF NOT EXISTS import_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS validation_message TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_pricing_import_method 
ON MenuPricing(import_method);

CREATE INDEX IF NOT EXISTS idx_menu_pricing_validation_status 
ON MenuPricing(validation_status);

-- Comments for clarity
COMMENT ON COLUMN MenuPricing.import_method IS 'How this menu item was imported: manual, google_sheets, website_url';
COMMENT ON COLUMN MenuPricing.target_food_cost_pct IS 'Target food cost percentage (e.g., 28 = 28%)';
COMMENT ON COLUMN MenuPricing.actual_food_cost_pct IS 'Calculated actual food cost % based on recipe cost';
COMMENT ON COLUMN MenuPricing.validation_status IS 'Pricing validation: pending, good, warning, error';
COMMENT ON COLUMN MenuPricing.import_confidence IS 'AI confidence score 0.00-1.00 for imported data';
```

### Test Migration

```sql
-- Verify new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'menupricing' 
AND column_name IN (
  'import_method',
  'target_food_cost_pct',
  'validation_status'
);

-- Should return 3 rows
```

---

## 🔌 STEP 2: API Endpoints (3-4 days)

### Endpoint 1: Parse Google Sheet

**File:** `app/api/menu/import/sheets/route.ts`

**Purpose:** Fetch and parse menu data from Google Sheets

**Implementation:**

```typescript
// app/api/menu/import/sheets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getGoogleAccessToken } from '@/lib/google-auth';
import { readSpreadsheet } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get request body
    const { spreadsheetId, sheetName } = await request.json();
    
    if (!spreadsheetId || !sheetName) {
      return NextResponse.json(
        { error: 'spreadsheetId and sheetName required' },
        { status: 400 }
      );
    }

    // 3. Get Google access token
    const accessToken = await getGoogleAccessToken(user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Sheets not connected' },
        { status: 401 }
      );
    }

    // 4. Read spreadsheet data
    const data = await readSpreadsheet(accessToken, spreadsheetId, sheetName);
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No data found in spreadsheet' },
        { status: 404 }
      );
    }

    // 5. Parse menu items using AI
    const parsedItems = await parseMenuData(data);

    // 6. Return parsed data
    return NextResponse.json({
      success: true,
      items: parsedItems,
      source: {
        spreadsheetId,
        sheetName,
        rowCount: data.length
      }
    });

  } catch (error) {
    console.error('Menu import error:', error);
    return NextResponse.json(
      { error: 'Failed to import menu data' },
      { status: 500 }
    );
  }
}

/**
 * Parse raw spreadsheet data into menu items
 */
async function parseMenuData(rows: any[][]): Promise<any[]> {
  // Convert rows to text for AI analysis
  const rawText = rows.map(row => row.join('\t')).join('\n');

  // Call AI to parse menu data
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Parse this menu pricing data into structured JSON.

Raw data:
${rawText}

Extract:
1. Item name (required)
2. Category (if present)
3. Price (required, convert to decimal)
4. Target food cost % (if present)
5. Description (if present)

Rules:
- Detect column headers automatically
- Handle various price formats ($12.00, 12, $12)
- Infer categories from section headers if not explicit
- Assign confidence score (0.0-1.0)

Output valid JSON only:
{
  "items": [
    {
      "item_name": "Caesar Salad",
      "category": "Salads",
      "price": 12.00,
      "target_food_cost_pct": 28,
      "description": "Fresh romaine lettuce...",
      "confidence": 0.95
    }
  ]
}`
      }]
    })
  });

  const result = await response.json();
  const content = result.content[0].text;
  
  // Parse AI response
  let parsed;
  try {
    // Remove markdown code blocks if present
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Failed to parse AI response');
  }

  return parsed.items || [];
}
```

**Test:**
```bash
curl -X POST http://localhost:3000/api/menu/import/sheets \
  -H "Content-Type: application/json" \
  -d '{
    "spreadsheetId": "your-sheet-id",
    "sheetName": "Menu Pricing"
  }'
```

---

### Endpoint 2: Validate Menu Items

**File:** `app/api/menu/import/validate/route.ts`

**Purpose:** Validate pricing and detect issues before saving

```typescript
// app/api/menu/import/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await request.json();
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items array required' },
        { status: 400 }
      );
    }

    // Validate each item
    const validatedItems = await Promise.all(
      items.map(item => validateMenuItem(item, supabase, user.id))
    );

    return NextResponse.json({
      success: true,
      items: validatedItems
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate menu items' },
      { status: 500 }
    );
  }
}

/**
 * Validate individual menu item
 */
async function validateMenuItem(item: any, supabase: any, userId: string) {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Required fields
  if (!item.item_name || item.item_name.trim() === '') {
    errors.push('Item name is required');
  }
  
  if (!item.price || isNaN(parseFloat(item.price))) {
    errors.push('Valid price is required');
  }

  // Price range validation
  const price = parseFloat(item.price);
  if (price < 0) {
    errors.push('Price cannot be negative');
  }
  if (price === 0) {
    warnings.push('Price is $0.00 - is this intentional?');
  }
  if (price < 1) {
    warnings.push(`Very low price ($${price.toFixed(2)}) - please verify`);
  }
  if (price > 200) {
    warnings.push(`Very high price ($${price.toFixed(2)}) - please verify`);
  }

  // Check for duplicates
  const { data: existingItems } = await supabase
    .from('MenuPricing')
    .select('id, item_name, price')
    .eq('user_id', userId)
    .ilike('item_name', item.item_name);

  if (existingItems && existingItems.length > 0) {
    warnings.push(`Similar item "${existingItems[0].item_name}" already exists ($${existingItems[0].price})`);
  }

  // Try to match to recipe (if recipes exist)
  const { data: recipes } = await supabase
    .from('Recipes')
    .select('id, name, cost_per_portion')
    .eq('user_id', userId)
    .ilike('name', `%${item.item_name}%`)
    .limit(1);

  let actual_food_cost_pct = null;
  let recipe_id = null;

  if (recipes && recipes.length > 0) {
    recipe_id = recipes[0].id;
    const recipeCost = recipes[0].cost_per_portion;
    if (recipeCost && price) {
      actual_food_cost_pct = (recipeCost / price) * 100;
      
      // Compare to target
      if (item.target_food_cost_pct) {
        const target = parseFloat(item.target_food_cost_pct);
        if (actual_food_cost_pct > target + 5) {
          warnings.push(
            `Food cost (${actual_food_cost_pct.toFixed(1)}%) exceeds target (${target}%)`
          );
        }
      }
    }
  }

  // Determine validation status
  let validation_status = 'good';
  if (errors.length > 0) {
    validation_status = 'error';
  } else if (warnings.length > 0) {
    validation_status = 'warning';
  }

  return {
    ...item,
    recipe_id,
    actual_food_cost_pct,
    validation_status,
    validation_message: [...errors, ...warnings].join('; '),
    warnings,
    errors
  };
}
```

---

### Endpoint 3: Save Menu Items

**File:** `app/api/menu/import/execute/route.ts`

**Purpose:** Save validated menu items to database

```typescript
// app/api/menu/import/execute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get restaurant_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('restaurant_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.restaurant_id) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const { items, source } = await request.json();
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items to import' },
        { status: 400 }
      );
    }

    // Prepare items for insertion
    const menuItems = items
      .filter(item => item.validation_status !== 'error') // Skip errors
      .map(item => ({
        restaurant_id: profile.restaurant_id,
        user_id: user.id,
        item_name: item.item_name,
        category: item.category || 'Uncategorized',
        price: parseFloat(item.price),
        description: item.description || null,
        recipe_id: item.recipe_id || null,
        target_food_cost_pct: item.target_food_cost_pct || null,
        actual_food_cost_pct: item.actual_food_cost_pct || null,
        import_method: 'google_sheets',
        source_url: source?.spreadsheetId || null,
        source_name: source?.sheetName || null,
        import_confidence: item.confidence || null,
        validation_status: item.validation_status || 'pending',
        validation_message: item.validation_message || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

    // Insert items
    const { data: insertedItems, error: insertError } = await supabase
      .from('MenuPricing')
      .insert(menuItems)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save menu items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imported_count: insertedItems.length,
      skipped_count: items.length - insertedItems.length,
      items: insertedItems
    });

  } catch (error) {
    console.error('Execute import error:', error);
    return NextResponse.json(
      { error: 'Failed to import menu items' },
      { status: 500 }
    );
  }
}
```

---

## 🎨 STEP 3: UI Components (5-7 days)

### Component 1: Import Hub

**File:** `app/menu/import/page.tsx`

```typescript
// app/menu/import/page.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function MenuImportHub() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">
          Import Menu
        </h1>
        <p className="text-white/60 mb-8">
          Quickly import your menu pricing from spreadsheets
        </p>

        {/* Import Method Card */}
        <button
          onClick={() => router.push('/menu/import/google')}
          className="
            w-full p-6 rounded-2xl
            bg-white/10 backdrop-blur-xl
            border-2 border-white/20
            hover:border-emerald-400 hover:bg-white/20
            transition-all duration-200
            text-left
          "
        >
          <div className="flex items-center gap-4">
            <div className="text-5xl">📊</div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-1">
                Import from Google Sheets
              </h2>
              <p className="text-white/60 text-sm">
                Connect your menu spreadsheet and import items automatically
              </p>
            </div>
            <div className="text-white/40">→</div>
          </div>
        </button>

        {/* Manual Entry Option */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/menu/new')}
            className="text-white/60 hover:text-white text-sm"
          >
            Or add items manually →
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### Component 2: Sheet Selector

**File:** `app/menu/import/google/select-sheet/page.tsx`

**Note:** This component can be **copied from Stock import** with minimal changes!

```typescript
// app/menu/import/google/select-sheet/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { listSpreadsheets, listSheets } from '@/lib/google-sheets';

export default function SelectSheet() {
  const router = useRouter();
  const [spreadsheets, setSpreadsheets] = useState([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpreadsheets();
  }, []);

  const loadSpreadsheets = async () => {
    try {
      const data = await listSpreadsheets();
      setSpreadsheets(data);
    } catch (error) {
      console.error('Error loading spreadsheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpreadsheetSelect = async (spreadsheet: any) => {
    setSelectedSpreadsheet(spreadsheet);
    setLoading(true);
    
    try {
      const sheetsList = await listSheets(spreadsheet.id);
      setSheets(sheetsList);
    } catch (error) {
      console.error('Error loading sheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedSpreadsheet && selectedSheet) {
      // Store selection in sessionStorage
      sessionStorage.setItem('menu_import_spreadsheet', JSON.stringify({
        spreadsheetId: selectedSpreadsheet.id,
        spreadsheetName: selectedSpreadsheet.name,
        sheetName: selectedSheet
      }));
      
      // Navigate to preview
      router.push('/menu/import/google/preview');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Select Spreadsheet
        </h1>

        {/* Spreadsheet Selection */}
        {!selectedSpreadsheet && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-white/60 text-center py-8">
                Loading spreadsheets...
              </div>
            ) : (
              spreadsheets.map((sheet: any) => (
                <button
                  key={sheet.id}
                  onClick={() => handleSpreadsheetSelect(sheet)}
                  className="
                    w-full p-4 rounded-2xl
                    bg-white/10 backdrop-blur-xl
                    border-2 border-white/20
                    hover:border-emerald-400
                    text-left transition-all duration-200
                  "
                >
                  <div className="text-white font-semibold">
                    {sheet.name}
                  </div>
                  <div className="text-white/60 text-sm">
                    {sheet.modifiedTime && new Date(sheet.modifiedTime).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Sheet Selection */}
        {selectedSpreadsheet && !selectedSheet && (
          <>
            <button
              onClick={() => setSelectedSpreadsheet(null)}
              className="text-white/60 hover:text-white mb-4"
            >
              ← Back to spreadsheets
            </button>
            
            <div className="space-y-3">
              {loading ? (
                <div className="text-white/60 text-center py-8">
                  Loading sheets...
                </div>
              ) : (
                sheets.map((sheet: string) => (
                  <button
                    key={sheet}
                    onClick={() => setSelectedSheet(sheet)}
                    className="
                      w-full p-4 rounded-2xl
                      bg-white/10 backdrop-blur-xl
                      border-2 border-white/20
                      hover:border-emerald-400
                      text-left transition-all duration-200
                    "
                  >
                    <div className="text-white font-semibold">
                      {sheet}
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {/* Continue Button */}
        {selectedSheet && (
          <button
            onClick={handleContinue}
            className="
              w-full mt-6 py-4 rounded-2xl
              bg-emerald-500 text-white font-semibold
              hover:bg-emerald-600
              transition-colors duration-200
            "
          >
            Continue to Preview →
          </button>
        )}
      </div>
    </div>
  );
}
```

---

### Component 3: Preview & Confirm

**File:** `app/menu/import/google/preview/page.tsx`

```typescript
// app/menu/import/google/preview/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MenuImportPreview() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadPreview();
  }, []);

  const loadPreview = async () => {
    try {
      // Get selection from sessionStorage
      const selectionData = sessionStorage.getItem('menu_import_spreadsheet');
      if (!selectionData) {
        router.push('/menu/import/google/select-sheet');
        return;
      }

      const { spreadsheetId, sheetName } = JSON.parse(selectionData);

      // Fetch and parse sheet data
      const response = await fetch('/api/menu/import/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId, sheetName })
      });

      if (!response.ok) {
        throw new Error('Failed to load sheet data');
      }

      const { items: parsedItems } = await response.json();

      // Validate items
      const validateResponse = await fetch('/api/menu/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: parsedItems })
      });

      if (!validateResponse.ok) {
        throw new Error('Failed to validate items');
      }

      const { items: validatedItems } = await validateResponse.json();
      setItems(validatedItems);

    } catch (error) {
      console.error('Preview error:', error);
      alert('Failed to load preview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);

    try {
      const selectionData = sessionStorage.getItem('menu_import_spreadsheet');
      const source = JSON.parse(selectionData);

      const response = await fetch('/api/menu/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, source })
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const { imported_count } = await response.json();

      // Success! Clear session and redirect
      sessionStorage.removeItem('menu_import_spreadsheet');
      
      alert(`Success! ${imported_count} menu items imported.`);
      router.push('/menu');

    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import items. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto text-center text-white py-12">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-xl">Analyzing menu data...</div>
        </div>
      </div>
    );
  }

  const errorItems = items.filter((i: any) => i.validation_status === 'error');
  const warningItems = items.filter((i: any) => i.validation_status === 'warning');
  const goodItems = items.filter((i: any) => i.validation_status === 'good');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">
          Review Import
        </h1>
        <p className="text-white/60 mb-8">
          {items.length} items detected - review before importing
        </p>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-emerald-500/20 backdrop-blur-xl border-2 border-emerald-400/50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{goodItems.length}</div>
            <div className="text-emerald-400 text-sm">Ready to Import</div>
          </div>
          <div className="bg-amber-500/20 backdrop-blur-xl border-2 border-amber-400/50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{warningItems.length}</div>
            <div className="text-amber-400 text-sm">Warnings</div>
          </div>
          <div className="bg-red-500/20 backdrop-blur-xl border-2 border-red-400/50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{errorItems.length}</div>
            <div className="text-red-400 text-sm">Errors (skipped)</div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3 mb-6">
          {items.map((item: any, index: number) => (
            <div
              key={index}
              className={`
                p-4 rounded-2xl backdrop-blur-xl border-2
                ${item.validation_status === 'error' 
                  ? 'bg-red-500/10 border-red-400/50' 
                  : item.validation_status === 'warning'
                  ? 'bg-amber-500/10 border-amber-400/50'
                  : 'bg-white/10 border-white/20'}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-white font-semibold">
                    {item.item_name}
                  </div>
                  {item.category && (
                    <div className="text-white/60 text-sm">
                      {item.category}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">
                    ${parseFloat(item.price).toFixed(2)}
                  </div>
                  {item.target_food_cost_pct && (
                    <div className="text-white/60 text-sm">
                      Target: {item.target_food_cost_pct}%
                    </div>
                  )}
                </div>
              </div>
              
              {item.validation_message && (
                <div className={`
                  text-sm mt-2
                  ${item.validation_status === 'error' ? 'text-red-400' : 'text-amber-400'}
                `}>
                  ⚠️ {item.validation_message}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
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
            onClick={handleImport}
            disabled={importing || goodItems.length === 0}
            className="
              flex-1 py-4 rounded-2xl
              bg-emerald-500 text-white font-semibold
              hover:bg-emerald-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
            "
          >
            {importing ? 'Importing...' : `Import ${goodItems.length} Items ✓`}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🧪 STEP 4: Testing (2-3 days)

### Test Checklist

Use the comprehensive testing protocol from `TESTING_PROTOCOL.md`:

**Critical Tests:**
- [ ] OAuth connection works
- [ ] Can select spreadsheet and sheet
- [ ] Data parses correctly (simple menu)
- [ ] Data parses correctly (complex menu)
- [ ] Validation catches invalid prices
- [ ] Validation detects duplicates
- [ ] Import saves to database correctly
- [ ] RLS enforced (can't see other restaurant's items)

**Test Data:**
Use scenarios from `TEST_MENU_DATA.md`:
- 3-item simple menu (happy path)
- 30-item full restaurant menu
- Edge cases (invalid prices, duplicates, etc.)

---

## 📦 STEP 5: Deployment (1 day)

### Deployment Checklist

**Pre-Deployment:**
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Database migration tested in staging
- [ ] API endpoints tested
- [ ] UI tested on iPad Air (2013)

**Deployment Steps:**

1. **Deploy Database Migration**
```sql
-- Run in production
\i 034_menu_import_enhancements.sql
-- Verify
SELECT * FROM MenuPricing LIMIT 1;
```

2. **Deploy Application Code**
```bash
git add .
git commit -m "feat: Menu import from Google Sheets"
git push origin main
# Netlify auto-deploys
```

3. **Monitor for 24 Hours**
- Check error logs
- Monitor API response times
- Watch for user feedback
- Track import success rate

---

## 📚 Reference Documents

**Complete Documentation Package:**

1. **MENU_IMPORT_1_WEEK_PLAN.md** - Original planning document
2. **TEST_MENU_DATA.md** - Sample test data
3. **TESTING_PROTOCOL.md** - 25 comprehensive test cases
4. **DAY_3_COMPLETE_MENU_IMPORT.md** - Design completion summary
5. **error-handler.ts** - Error handling utilities
6. **Toast.tsx** - Success/error notifications
7. **LoadingState.tsx** - Loading UI components

---

## 🎯 Success Criteria

**Functional Requirements:**
- ✅ Import menu from Google Sheets
- ✅ Parse 95%+ of menu formats correctly
- ✅ Validate pricing automatically
- ✅ Detect duplicates and errors
- ✅ Link to recipes when available
- ✅ Calculate actual food cost %

**Performance:**
- ✅ <5 seconds to parse 30-item menu
- ✅ <2 seconds to save to database
- ✅ Works smoothly on iPad Air (2013)

**User Experience:**
- ✅ Clear error messages
- ✅ Helpful validation warnings
- ✅ Simple 3-step flow
- ✅ No dead ends

---

## 💡 Implementation Tips

### Reuse from Stock Import

**These components can be copied with minimal changes:**
- OAuth connection flow
- Google Sheets API integration
- Sheet selector UI
- Loading states
- Error handling

**Only menu-specific parts are new:**
- AI parsing prompt (menu vs stock)
- Validation rules (pricing vs workflow)
- Data fields (price, food cost % vs quantity)

### AI Parsing Tips

**For best results:**
- Include example output in prompt
- Handle both explicit columns and inferred categories
- Support multiple price formats ($12.00, 12, $12)
- Assign confidence scores
- Return structured JSON

### Testing Strategy

**Priority order:**
1. Happy path first (simple 3-item menu)
2. Complex real-world menu (30+ items)
3. Edge cases (errors, duplicates)
4. Performance (large menus)
5. iPad Air compatibility

---

## 🚀 Quick Start Commands

**For Claude Code:**

```bash
# Start implementation
"Using MENU_IMPORT_IMPLEMENTATION_PACKAGE.md, implement the MENU import system. Start with the database migration (Step 1)."

# Next step
"Database migration complete. Implement Step 2: API endpoints, starting with /api/menu/import/sheets"

# Continue
"API endpoints complete. Implement Step 3: UI components, starting with the import hub."

# Final
"Implementation complete. Help me run through the testing protocol from TESTING_PROTOCOL.md"
```

---

## ⏱️ Timeline

**Week 1:**
- Day 1: Database migration + API endpoint 1-2
- Day 2: API endpoint 3 + Start UI
- Day 3: Complete UI components
- Day 4: Integration testing
- Day 5: Bug fixes

**Week 2:**
- Day 1-2: Comprehensive testing
- Day 3: Polish and refinement
- Day 4: Staging deployment
- Day 5: Production deployment + monitoring

**Total:** 2 weeks (flexible based on complexity)

---

## 🎉 You're Ready!

This package contains everything needed to implement the MENU import system:
- ✅ Complete database schema
- ✅ API endpoint specifications with full code
- ✅ UI component designs with full code
- ✅ Testing protocol
- ✅ Deployment checklist

**Hand this to Claude Code and you're good to go!** 🚀

---

**Package Status:** Complete ✅  
**Last Updated:** November 20, 2025  
**Ready for Implementation:** YES
