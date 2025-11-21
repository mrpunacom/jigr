# MENU Import - 1 Week Implementation Plan

**Project:** JiGR MENU Import Module  
**Timeline:** 5 days (1 week)  
**Difficulty:** MEDIUM (builds on STOCK import patterns)  
**Priority:** Start with this before RECIPES (proof of concept)

---

## 🎯 WHY MENU FIRST?

### Strategic Benefits:
1. **Quick Win** - 1 week vs 3 weeks for RECIPES
2. **Simpler Logic** - No ingredient matching, no unit conversion
3. **Tests Infrastructure** - Validates import patterns
4. **Immediate Value** - Pricing validation insights
5. **Build Confidence** - Proves system before complex work

### What Users Get:
- ✅ Import current menu pricing from spreadsheets
- ✅ Validate pricing strategy
- ✅ Identify overpriced/underpriced items
- ✅ Link menu items to recipes (when recipes exist)
- ✅ Food cost % validation (when recipe costs available)

---

## 📊 DATABASE SCHEMA

### Migration: 033_menu_import_enhancements.sql

```sql
-- Enhance existing MenuPricing table
ALTER TABLE MenuPricing 
ADD COLUMN IF NOT EXISTS import_method VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS source_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS target_food_cost_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS actual_food_cost_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS price_recommendation DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS import_notes TEXT,
ADD COLUMN IF NOT EXISTS import_confidence DECIMAL(3,2);

-- Add validation status
ALTER TABLE MenuPricing
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS validation_message TEXT;

-- Validation status values: 'pending', 'good', 'warning', 'error'

-- Comments
COMMENT ON COLUMN MenuPricing.import_method IS 'How this menu item was imported: manual, google_sheets, website_url';
COMMENT ON COLUMN MenuPricing.target_food_cost_pct IS 'Target food cost percentage (e.g., 28 = 28%)';
COMMENT ON COLUMN MenuPricing.actual_food_cost_pct IS 'Calculated actual food cost % based on recipe cost';
COMMENT ON COLUMN MenuPricing.validation_status IS 'Pricing validation: pending, good, warning, error';
```

---

## 🗂️ FILE STRUCTURE

```
app/
├── menu/
│   └── import/
│       ├── page.tsx                    # NEW - Import hub
│       ├── google/
│       │   └── select-sheet/
│       │       └── page.tsx           # NEW - Sheet selector (REUSE from STOCK)
│       ├── url/
│       │   └── page.tsx               # NEW - URL import
│       └── preview/
│           └── page.tsx               # NEW - Preview & validate

app/api/
├── menu/
│   └── import/
│       ├── google/
│       │   ├── sheets/
│       │   │   └── route.ts          # NEW - List spreadsheets
│       │   └── read/
│       │       └── route.ts          # NEW - Read sheet data
│       ├── url/
│       │   └── route.ts              # NEW - URL scraping
│       ├── analyze/
│       │   └── route.ts              # NEW - AI analysis
│       └── execute/
│           └── route.ts              # NEW - Save menu items

lib/
├── menu-import/
│   ├── menu-parser.ts                # NEW - AI menu parser
│   ├── recipe-matcher.ts             # NEW - Match items to recipes
│   ├── pricing-validator.ts          # NEW - Validate pricing
│   └── menu-scrapers/
│       ├── schema-org-menu.ts        # NEW - Schema.org menu parser
│       └── ai-html-menu.ts           # NEW - AI fallback
```

---

## 📅 DAY-BY-DAY PLAN

### DAY 1: Database & Backend Setup (6 hours)

**Morning (3 hours):**
```bash
□ Run migration 033_menu_import_enhancements.sql
□ Verify columns added
□ Test with sample data
□ Create API folder structure
```

**Afternoon (3 hours):**
```bash
□ Create lib/menu-import/menu-parser.ts
□ Implement AI parsing for menu data
□ Create lib/menu-import/pricing-validator.ts
□ Build validation logic (food cost %)
```

**Deliverable:** Database ready, core parsing logic working

---

### DAY 2: Google Sheets Import (8 hours)

**Morning (4 hours):**
```bash
□ Create API endpoint: /api/menu/import/google/sheets
□ Reuse Google OAuth from STOCK import
□ List user's spreadsheets
□ Test sheet listing
```

**Afternoon (4 hours):**
```bash
□ Create API endpoint: /api/menu/import/google/read
□ Parse menu data from sheets
□ Extract: item_name, category, price, target_food_cost_pct
□ Test with sample menu spreadsheet
```

**Deliverable:** Google Sheets import working end-to-end

---

### DAY 3: AI Analysis & Validation (8 hours)

**Morning (4 hours):**
```bash
□ Create API endpoint: /api/menu/import/analyze
□ Implement menu AI parser
□ Extract structured menu data
□ Test with various formats
```

**Afternoon (4 hours):**
```bash
□ Create lib/menu-import/recipe-matcher.ts
□ Fuzzy match menu items to existing recipes
□ Calculate actual food cost % (if recipe exists)
□ Generate validation warnings
```

**Deliverable:** AI analysis and recipe matching working

---

### DAY 4: Frontend UI (8 hours)

**Morning (4 hours):**
```bash
□ Create app/menu/import/page.tsx (Import hub)
□ Add Google Sheets import card
□ Add URL import card (Phase 2)
□ Add manual entry option
```

**Afternoon (4 hours):**
```bash
□ Create app/menu/import/preview/page.tsx
□ Build menu item table with validation
□ Color-code validation status
□ Add recipe matching dropdowns
□ Implement save functionality
```

**Deliverable:** Complete UI for menu import

---

### DAY 5: Testing & Polish (8 hours)

**Morning (4 hours):**
```bash
□ End-to-end testing
□ Test with 5 different menu formats
□ Edge cases (missing prices, no categories)
□ iPad Air compatibility test
```

**Afternoon (4 hours):**
```bash
□ Bug fixes
□ UX improvements
□ Error handling polish
□ Documentation
□ Deployment prep
```

**Deliverable:** Production-ready MENU import system

---

## 💻 CODE IMPLEMENTATION

### 1. Menu AI Parser

```typescript
// lib/menu-import/menu-parser.ts

export async function parseMenuData(rawText: string, source: string) {
  const prompt = `
You are a restaurant menu pricing expert. Extract structured menu data.

SOURCE: ${source}

RAW TEXT:
${rawText}

EXTRACT:
1. Menu item names
2. Categories (Appetizers, Entrees, Desserts, etc.)
3. Selling prices
4. Descriptions (if present)
5. Target food cost % (if mentioned)

RULES:
- Detect currency and convert to numbers
- Infer categories from context if not explicit
- Handle various price formats ($12, 12.00, twelve dollars)
- Ignore non-menu text (hours, address, etc.)

OUTPUT FORMAT (JSON only, no markdown):
{
  "items": [
    {
      "item_name": "Caesar Salad",
      "category": "Salads",
      "price": 12.00,
      "description": "Fresh romaine with grilled chicken",
      "target_food_cost_pct": 28,
      "confidence": 0.95
    }
  ],
  "detected_categories": ["Appetizers", "Salads", "Entrees", "Desserts"],
  "currency": "USD"
}
`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  const responseText = data.content[0].text;
  
  // Strip markdown if present
  const cleaned = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  return JSON.parse(cleaned);
}
```

---

### 2. Recipe Matcher

```typescript
// lib/menu-import/recipe-matcher.ts

import { createServerClient } from '@/lib/supabase/server';

export async function matchMenuItemsToRecipes(
  menuItems: any[],
  clientId: string
) {
  const supabase = createServerClient();
  
  // Fetch all recipes for this client
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, recipe_name, cost_per_portion, category_name')
    .eq('client_id', clientId);
  
  if (!recipes || recipes.length === 0) {
    return menuItems.map(item => ({
      ...item,
      recipe_id: null,
      recipe_suggestions: [],
      validation_status: 'pending',
      validation_message: 'No recipes found - add recipes to calculate food cost'
    }));
  }
  
  return menuItems.map(item => {
    const matches = findBestRecipeMatches(item.item_name, recipes);
    
    let validation = validateMenuItem(item, matches[0]);
    
    return {
      ...item,
      recipe_id: matches[0]?.id || null,
      recipe_suggestions: matches.slice(0, 5),
      actual_food_cost_pct: validation.actual_food_cost_pct,
      validation_status: validation.status,
      validation_message: validation.message
    };
  });
}

function findBestRecipeMatches(menuItemName: string, recipes: any[]) {
  const normalized = menuItemName.toLowerCase().trim();
  
  const scored = recipes.map(recipe => {
    const recipeName = recipe.recipe_name.toLowerCase().trim();
    const similarity = calculateSimilarity(normalized, recipeName);
    
    return {
      ...recipe,
      similarity
    };
  });
  
  return scored
    .filter(s => s.similarity > 0.3)
    .sort((a, b) => b.similarity - a.similarity);
}

function calculateSimilarity(str1: string, str2: string): number {
  // Exact match
  if (str1 === str2) return 1.0;
  
  // One contains the other
  if (str1.includes(str2) || str2.includes(str1)) return 0.9;
  
  // Word overlap
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  const commonWords = words1.filter(w => words2.includes(w)).length;
  const totalWords = Math.max(words1.length, words2.length);
  
  return commonWords / totalWords;
}
```

---

### 3. Pricing Validator

```typescript
// lib/menu-import/pricing-validator.ts

export function validateMenuItem(menuItem: any, matchedRecipe: any | null) {
  // No recipe match
  if (!matchedRecipe || !matchedRecipe.cost_per_portion) {
    return {
      status: 'pending',
      message: 'Select a recipe to calculate food cost',
      actual_food_cost_pct: null,
      price_recommendation: null
    };
  }
  
  // Calculate actual food cost %
  const actualPct = (matchedRecipe.cost_per_portion / menuItem.price) * 100;
  
  // Compare to target (if provided)
  if (menuItem.target_food_cost_pct) {
    if (actualPct > menuItem.target_food_cost_pct + 5) {
      // Over target by more than 5%
      const recommendedPrice = matchedRecipe.cost_per_portion / (menuItem.target_food_cost_pct / 100);
      
      return {
        status: 'error',
        message: `Food cost ${actualPct.toFixed(1)}% exceeds target ${menuItem.target_food_cost_pct}%. Consider increasing price to $${recommendedPrice.toFixed(2)}`,
        actual_food_cost_pct: actualPct,
        price_recommendation: recommendedPrice
      };
    } else if (actualPct > menuItem.target_food_cost_pct) {
      // Slightly over target
      return {
        status: 'warning',
        message: `Food cost ${actualPct.toFixed(1)}% slightly above target ${menuItem.target_food_cost_pct}%`,
        actual_food_cost_pct: actualPct,
        price_recommendation: null
      };
    } else {
      // Within target
      return {
        status: 'good',
        message: `Food cost ${actualPct.toFixed(1)}% is within target ${menuItem.target_food_cost_pct}%`,
        actual_food_cost_pct: actualPct,
        price_recommendation: null
      };
    }
  }
  
  // No target provided - use industry guidelines
  if (actualPct > 35) {
    const recommendedPrice = matchedRecipe.cost_per_portion / 0.30; // Target 30%
    return {
      status: 'error',
      message: `High food cost ${actualPct.toFixed(1)}%. Industry standard is 28-32%. Consider increasing price to $${recommendedPrice.toFixed(2)}`,
      actual_food_cost_pct: actualPct,
      price_recommendation: recommendedPrice
    };
  } else if (actualPct > 32) {
    return {
      status: 'warning',
      message: `Food cost ${actualPct.toFixed(1)}% is above ideal (28-32%)`,
      actual_food_cost_pct: actualPct,
      price_recommendation: null
    };
  } else if (actualPct < 20) {
    const recommendedPrice = matchedRecipe.cost_per_portion / 0.28; // Target 28%
    return {
      status: 'info',
      message: `Low food cost ${actualPct.toFixed(1)}%. Could reduce price to $${recommendedPrice.toFixed(2)} for better value`,
      actual_food_cost_pct: actualPct,
      price_recommendation: recommendedPrice
    };
  } else {
    return {
      status: 'good',
      message: `Food cost ${actualPct.toFixed(1)}% is within ideal range (28-32%)`,
      actual_food_cost_pct: actualPct,
      price_recommendation: null
    };
  }
}
```

---

### 4. API Endpoint - Google Sheets Read

```typescript
// app/api/menu/import/google/read/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { google } from 'googleapis';
import { getGoogleAccessToken } from '@/lib/google-auth';
import { parseMenuData } from '@/lib/menu-import/menu-parser';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { spreadsheet_id, sheet_name } = await request.json();
    
    // Get Google access token
    const accessToken = await getGoogleAccessToken(user.id, supabase);
    
    // Initialize Google Sheets API
    const sheets = google.sheets({ version: 'v4', auth: accessToken });
    
    // Read sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheet_id,
      range: `${sheet_name}!A:Z`,
    });
    
    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Sheet is empty' }, { status: 400 });
    }
    
    // Convert to text for AI parsing
    const rawText = rows.map(row => row.join('\t')).join('\n');
    
    // Parse with AI
    const parsed = await parseMenuData(rawText, 'google_sheets');
    
    return NextResponse.json({
      success: true,
      parsed: parsed.items,
      detected_categories: parsed.detected_categories,
      spreadsheet_id,
      sheet_name
    });
    
  } catch (error) {
    console.error('Menu Google Sheets read error:', error);
    return NextResponse.json(
      { error: 'Failed to read menu data' },
      { status: 500 }
    );
  }
}
```

---

### 5. API Endpoint - Save Menu

```typescript
// app/api/menu/import/execute/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { matchMenuItemsToRecipes } from '@/lib/menu-import/recipe-matcher';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get client_id
    const { data: clientUser } = await supabase
      .from('client_users')
      .select('client_id')
      .eq('user_id', user.id)
      .single();
    
    if (!clientUser) {
      return NextResponse.json({ error: 'No client' }, { status: 403 });
    }
    
    const { 
      session_id, 
      menu_items, 
      import_method,
      source_identifier 
    } = await request.json();
    
    // Match to recipes and validate
    const processedItems = await matchMenuItemsToRecipes(
      menu_items,
      clientUser.client_id
    );
    
    // Save to database
    const itemsToInsert = processedItems.map(item => ({
      client_id: clientUser.client_id,
      recipe_id: item.recipe_id,
      item_name: item.item_name,
      category: item.category,
      menu_price: item.price,
      description: item.description,
      target_food_cost_pct: item.target_food_cost_pct,
      actual_food_cost_pct: item.actual_food_cost_pct,
      validation_status: item.validation_status,
      validation_message: item.validation_message,
      import_method: import_method,
      source_name: source_identifier,
      import_confidence: item.confidence
    }));
    
    const { data: inserted, error } = await supabase
      .from('menu_pricing')
      .insert(itemsToInsert)
      .select();
    
    if (error) {
      throw error;
    }
    
    // Update session
    await supabase
      .from('recipe_import_sessions')
      .update({
        successful_imports: inserted.length,
        completed_at: new Date().toISOString()
      })
      .eq('id', session_id);
    
    return NextResponse.json({
      success: true,
      items_imported: inserted.length,
      items: inserted
    });
    
  } catch (error) {
    console.error('Menu import execute error:', error);
    return NextResponse.json(
      { error: 'Failed to save menu items' },
      { status: 500 }
    );
  }
}
```

---

### 6. Frontend - Import Hub

```typescript
// app/menu/import/page.tsx

'use client';

import { useRouter } from 'next/navigation';

export default function MenuImportHub() {
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Import Menu Pricing</h1>
        <p className="text-gray-400 text-lg">
          Add your menu items and validate pricing strategy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Sheets */}
        <ImportMethodCard
          icon="📊"
          title="Import from Google Sheets"
          description="Bulk import menu pricing from spreadsheet"
          badge="RECOMMENDED"
          badgeColor="bg-green-500"
          onClick={() => router.push('/menu/import/google')}
        />

        {/* URL Import (Phase 2) */}
        <ImportMethodCard
          icon="🌐"
          title="Import from Website"
          description="Copy menu from your restaurant website"
          badge="COMING SOON"
          badgeColor="bg-blue-500"
          onClick={() => alert('Website import coming in Phase 2!')}
          disabled
        />

        {/* Manual Entry */}
        <ImportMethodCard
          icon="✏️"
          title="Add Manually"
          description="Enter menu items one at a time"
          badge=""
          badgeColor=""
          onClick={() => router.push('/menu/new')}
        />
      </div>

      {/* Info Box */}
      <div className="mt-8 p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h3 className="font-medium mb-2">💡 What You'll Get:</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Automatic validation of menu pricing</li>
          <li>• Food cost % calculations (if recipes exist)</li>
          <li>• Identify overpriced or underpriced items</li>
          <li>• Link menu items to recipes</li>
          <li>• Price optimization recommendations</li>
        </ul>
      </div>
    </div>
  );
}

function ImportMethodCard({ icon, title, description, badge, badgeColor, onClick, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`glass-panel p-6 text-left hover:scale-105 transition-transform duration-200 relative ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {badge && (
        <span className={`absolute top-4 right-4 px-2 py-1 text-xs font-bold rounded ${badgeColor} text-white`}>
          {badge}
        </span>
      )}
      
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
      
      {!disabled && (
        <div className="mt-4 flex items-center text-blue-400 font-medium">
          Get Started
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </button>
  );
}
```

---

### 7. Frontend - Preview & Validate

```typescript
// app/menu/import/preview/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MenuImportPreview() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('menu_import_preview');
    if (data) {
      const parsed = JSON.parse(data);
      setPreviewData(parsed);
      setMenuItems(parsed.parsed || []);
    } else {
      router.push('/menu/import');
    }
  }, [router]);

  const handleRecipeChange = (index: number, recipeId: string) => {
    // Update recipe match and recalculate validation
    const updated = [...menuItems];
    updated[index].recipe_id = recipeId;
    // Re-validate pricing...
    setMenuItems(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/menu/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: previewData.session_id,
          menu_items: menuItems,
          import_method: 'google_sheets',
          source_identifier: previewData.spreadsheet_id
        })
      });
      
      if (!response.ok) throw new Error('Save failed');
      
      sessionStorage.removeItem('menu_import_preview');
      router.push('/menu');
      
    } catch (error) {
      alert('Failed to save menu');
    } finally {
      setIsSaving(false);
    }
  };

  if (!previewData) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="glass-panel p-8">
        <h1 className="text-3xl font-bold mb-2">Review Menu Pricing</h1>
        <p className="text-gray-400 mb-6">
          Verify pricing and link items to recipes
        </p>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Items"
            value={menuItems.length}
            color="blue"
          />
          <StatCard
            label="Good Pricing"
            value={menuItems.filter(i => i.validation_status === 'good').length}
            color="green"
          />
          <StatCard
            label="Warnings"
            value={menuItems.filter(i => i.validation_status === 'warning').length}
            color="yellow"
          />
          <StatCard
            label="Errors"
            value={menuItems.filter(i => i.validation_status === 'error').length}
            color="red"
          />
        </div>

        {/* Menu Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3">Item</th>
                <th className="text-left p-3">Category</th>
                <th className="text-right p-3">Price</th>
                <th className="text-left p-3">Recipe</th>
                <th className="text-right p-3">Food Cost %</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.map((item, index) => (
                <tr 
                  key={index}
                  className={`border-b border-gray-800 ${getRowClass(item.validation_status)}`}
                >
                  <td className="p-3 font-medium">{item.item_name}</td>
                  <td className="p-3 text-gray-400">{item.category}</td>
                  <td className="p-3 text-right">${item.price.toFixed(2)}</td>
                  <td className="p-3">
                    <select
                      value={item.recipe_id || ''}
                      onChange={(e) => handleRecipeChange(index, e.target.value)}
                      className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded"
                    >
                      <option value="">-- Select Recipe --</option>
                      {item.recipe_suggestions?.map((recipe: any) => (
                        <option key={recipe.id} value={recipe.id}>
                          {recipe.recipe_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    {item.actual_food_cost_pct 
                      ? `${item.actual_food_cost_pct.toFixed(1)}%`
                      : '-'}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={item.validation_status} />
                    <p className="text-xs text-gray-400 mt-1">
                      {item.validation_message}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
          >
            Back
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg font-medium"
          >
            {isSaving ? 'Saving Menu...' : `Save ${menuItems.length} Items`}
          </button>
        </div>
      </div>
    </div>
  );
}

function getRowClass(status: string) {
  switch (status) {
    case 'error': return 'bg-red-500/5';
    case 'warning': return 'bg-yellow-500/5';
    case 'good': return 'bg-green-500/5';
    default: return '';
  }
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { emoji: '⏳', text: 'Pending', color: 'bg-gray-500' },
    good: { emoji: '✅', text: 'Good', color: 'bg-green-500' },
    warning: { emoji: '⚠️', text: 'Warning', color: 'bg-yellow-500' },
    error: { emoji: '❌', text: 'Error', color: 'bg-red-500' },
  }[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.color}/20 ${config.color}`}>
      <span>{config.emoji}</span>
      <span>{config.text}</span>
    </span>
  );
}

function StatCard({ label, value, color }: any) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-75">{label}</div>
    </div>
  );
}
```

---

## ✅ TESTING CHECKLIST

### Day 5 Testing Protocol:

```bash
# Google Sheets Import
□ Create test menu spreadsheet with:
  - Headers: Item Name, Category, Price, Target Food Cost %
  - 20 sample menu items
  - Mix of categories (Appetizers, Entrees, Desserts)
  
□ Import via Google Sheets:
  - Connect OAuth
  - Select spreadsheet
  - Parse data correctly
  - AI extracts all fields
  
□ Validation Testing:
  - Items with recipes: Calculate food cost % ✅
  - Items without recipes: Show "pending" ✅
  - Overpriced items: Show error with recommendation ✅
  - Good pricing: Show success ✅
  
□ Recipe Matching:
  - Fuzzy match works for similar names ✅
  - Dropdown shows top 5 suggestions ✅
  - Manual override possible ✅
  
□ Save Flow:
  - All items save to database ✅
  - Validation status preserved ✅
  - Navigate to menu list ✅

# iPad Air Compatibility
□ Google Sheets OAuth on iPad ✅
□ Table responsive design ✅
□ Dropdowns work on touch ✅
□ Performance acceptable ✅

# Edge Cases
□ Empty spreadsheet: Show error ✅
□ Missing prices: Handle gracefully ✅
□ No recipes exist: Show pending status ✅
□ Duplicate menu items: Warn user ✅
```

---

## 📊 SUCCESS METRICS

### Week 1 Targets:
- ✅ MENU import working end-to-end
- ✅ 90%+ parsing accuracy
- ✅ Recipe matching 80%+ accurate
- ✅ Validation logic functional
- ✅ iPad Air compatible
- ✅ <30 seconds import time

### Business Metrics:
- ✅ 10× faster than manual entry
- ✅ Identifies 3-5 pricing issues per menu
- ✅ Saves restaurant owners 2+ hours
- ✅ Provides immediate pricing insights

---

## 🚀 DEPLOYMENT PLAN

### End of Week 1:

```bash
□ Code review complete
□ All tests passing
□ Documentation updated
□ Deploy to staging
□ Beta test with 3 clients
□ Collect feedback
□ Fix critical bugs
□ Deploy to production
□ Monitor for issues
```

---

## 📈 WHAT'S NEXT?

### After MENU Import (Week 2+):

**Option A: RECIPES Import** (3 weeks)
- Build on proven infrastructure
- Add Photo OCR
- Add Website scraping
- Complex ingredient matching

**Option B: Polish MENU** (1 week)
- Add URL import for menus
- Enhanced validation rules
- Pricing optimization suggestions
- Menu engineering reports

---

**LET'S BUILD THIS! Ready to start Day 1? 🚀**
