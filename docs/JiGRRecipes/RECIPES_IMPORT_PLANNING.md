# RECIPES Import - Complete Planning & Architecture

**Project:** JiGR RECIPES Multi-Method Import System  
**Version:** 1.0  
**Date:** November 20, 2025  
**Status:** Planning Phase - Ready for Architecture Review  
**Complexity:** HIGH (Most complex module in JiGR)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Why This is Complex](#complexity)
3. [Import Methods Overview](#methods)
4. [Architecture Design](#architecture)
5. [Database Schema](#database)
6. [Import Method 1: Photo OCR](#photo-ocr)
7. [Import Method 2: Website Scraping](#website)
8. [Import Method 3: Google Sheets](#sheets)
9. [Core Challenge: Ingredient Matching](#ingredient-matching)
10. [Unit Conversion System](#unit-conversion)
11. [Recipe Costing](#costing)
12. [Implementation Roadmap](#roadmap)

---

## <a name="executive-summary"></a>📊 Executive Summary

### The Vision

Build a **multi-method recipe import system** that transforms JiGR from "yet another inventory app" into a **complete kitchen intelligence platform**.

### Three Import Methods

**1. 📸 Photo OCR** - Scan recipes from:
- Cookbooks and magazines
- Handwritten family recipes
- Printed restaurant recipes
- Recipe cards

**2. 🌐 Website Scraping** - Import from:
- AllRecipes, BBC Good Food, Food Network
- Restaurant websites
- Food blogs
- Any URL with a recipe

**3. 📊 Google Sheets** - Bulk import:
- Existing recipe databases
- Excel recipe collections
- Shared recipe spreadsheets
- 50+ recipes at once

### Why This Matters

**Business Impact:**
- **Eliminates 5-10 hours** of manual recipe entry per client
- **Enables accurate food costing** (can't cost without recipes)
- **Powers menu pricing** (links recipes to menu items)
- **Competitive differentiation** (no other hospitality app does this)

### The Challenge

This is **NOT** like importing inventory or menu pricing. Here's why:

**MENU Import:**
```
Item Name | Price | Category
Caesar Salad | $12 | Salads
```
↓ Simple mapping, done!

**RECIPE Import:**
```
Recipe: Caesar Salad (Serves 4)
Ingredients:
- 2 cups chopped romaine lettuce
- 4 oz grilled chicken breast
- 2 tbsp Caesar dressing
- 1 tbsp parmesan cheese, grated
- 1/2 cup croutons

Instructions:
1. Grill chicken...
2. Chop romaine...
```

**Must solve:**
- ❓ What is "2 cups chopped romaine"? → Link to InventoryItem "Romaine Lettuce"
- ❓ How many grams is "2 cups"? → Unit conversion
- ❓ "4 oz grilled chicken" raw or cooked? → Preparation state
- ❓ Is "Caesar dressing" bought or made? → Sub-recipe detection
- ❓ What does this recipe cost? → Calculate from ingredients
- ❓ How much per portion? → Divide by servings

---

## <a name="complexity"></a>🎯 Why This is Complex

### Complexity Comparison

**STOCK Import (Easy):**
- Parse: Item name, quantity, brand
- Validate: Is quantity positive?
- Save: One row per item
- **Complexity:** ⭐⭐☆☆☆

**MENU Import (Medium):**
- Parse: Item name, price, category
- Validate: Is price reasonable?
- Link: Match to recipes (optional)
- **Complexity:** ⭐⭐⭐☆☆

**RECIPES Import (Hard):**
- Parse: Name, ingredients (with quantities/units), instructions, yield
- Match: Each ingredient to InventoryItem (fuzzy)
- Convert: All units to standard (cups → grams)
- Calculate: Total cost, cost per portion
- Handle: Sub-recipes, optional ingredients, variations
- **Complexity:** ⭐⭐⭐⭐⭐

### The Core Challenges

**1. Ingredient Recognition**
```
Input: "2 cups chopped romaine"
Must extract:
- Quantity: 2
- Unit: cups
- Ingredient: romaine
- Preparation: chopped
- State: fresh
```

**2. Fuzzy Matching**
```
Recipe says: "romaine"
Inventory has:
- "Romaine Lettuce, Fresh" (86% match) ✓
- "Romaine Hearts, Organic" (82% match)
- "Red Lettuce, Fresh" (45% match)
→ Pick best match, ask user if unsure
```

**3. Unit Conversion**
```
Recipe: "2 cups diced onions"
Inventory: "Yellow Onions, 50lb bag"

Convert:
2 cups diced onions
= ~10.5 oz
= ~0.66 lb
→ Cost: 0.66 lb × $0.12/lb = $0.08
```

**4. Sub-Recipes**
```
Recipe: Caesar Salad
Uses: "2 tbsp Caesar Dressing"

Is Caesar Dressing:
A) Bought? → InventoryItem: "Caesar Dressing, Bottled"
B) Made? → SubRecipe: "House Caesar Dressing"

If B, need to:
- Find sub-recipe
- Calculate sub-recipe cost
- Use in parent recipe
```

**5. Preparation Yield Loss**
```
Recipe: "4 oz grilled chicken breast"
Purchase: Raw chicken breast

Cooking loss: ~25%
So need: 4 oz cooked = ~5.3 oz raw
→ Cost based on raw weight
```

---

## <a name="methods"></a>🎯 Import Methods Overview

### Method Matrix

| Method | Source | Accuracy | Speed | Use Case |
|--------|--------|----------|-------|----------|
| **Photo OCR** | Camera/Upload | 85-95% | 10-30s | Cookbooks, magazines, cards |
| **Website** | URL | 90-98% | 5-15s | Online recipes, blogs |
| **Sheets** | Spreadsheet | 95-99% | <5s | Bulk migration, existing DB |

### User Journey: Photo OCR

```
1. User: "Add Recipe" → "Scan from Photo"
2. Camera opens (or file upload)
3. Take photo of cookbook page
4. Upload to Google Document AI
5. AI extracts:
   - Recipe name
   - Ingredient list
   - Instructions
   - Yield/servings
6. Show preview with confidence scores
7. User confirms/edits
8. System:
   - Matches ingredients to inventory
   - Converts units
   - Calculates cost
9. Recipe saved!
```

### User Journey: Website URL

```
1. User: "Add Recipe" → "Import from Website"
2. Enter URL: "allrecipes.com/recipe/caesar-salad"
3. System:
   - Fetches page HTML
   - Tries Schema.org JSON-LD
   - Falls back to AI parsing
4. Extracts structured data
5. Shows preview
6. User confirms
7. Recipe saved!
```

### User Journey: Google Sheets

```
1. User: "Add Recipe" → "Import from Spreadsheet"
2. Connect Google Sheets (if not connected)
3. Select spreadsheet
4. Select sheet/tab
5. AI detects columns:
   - Recipe names
   - Ingredient lists
   - Portions
6. Preview 50 recipes
7. User confirms
8. Bulk import starts
9. Progress bar shows status
10. Done! 50 recipes imported
```

---

## <a name="architecture"></a>🏗️ Architecture Design

### High-Level Flow

```
┌─────────────────┐
│  Import Method  │
│  (Photo/Web/    │
│   Sheets)       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  AI Parser      │
│  Extract:       │
│  - Name         │
│  - Ingredients  │
│  - Instructions │
│  - Yield        │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Ingredient     │
│  Matcher        │
│  Fuzzy match to │
│  InventoryItems │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Unit Converter │
│  Convert all to │
│  standard units │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Cost           │
│  Calculator     │
│  Sum ingredient │
│  costs          │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Save Recipe    │
│  - Recipe       │
│  - Ingredients  │
│  - Instructions │
│  - Cost         │
└─────────────────┘
```

### Component Architecture

```
/app/recipes/import/
├── page.tsx                    # Import hub (choose method)
├── photo/
│   ├── page.tsx               # Photo upload/camera
│   └── preview/
│       └── page.tsx           # Preview parsed recipe
├── url/
│   ├── page.tsx               # Enter URL
│   └── preview/
│       └── page.tsx           # Preview scraped recipe
├── google/
│   ├── select-sheet/
│   │   └── page.tsx           # Select spreadsheet
│   └── preview/
│       └── page.tsx           # Preview bulk recipes

/app/api/recipes/import/
├── photo/
│   └── route.ts               # Upload & OCR
├── url/
│   └── route.ts               # Scrape website
├── sheets/
│   └── route.ts               # Parse spreadsheet
├── match-ingredients/
│   └── route.ts               # Fuzzy matching
├── convert-units/
│   └── route.ts               # Unit conversion
└── calculate-cost/
    └── route.ts               # Cost calculation

/lib/recipes/
├── ai-parser.ts               # AI prompts for parsing
├── ingredient-matcher.ts      # Fuzzy matching logic
├── unit-converter.ts          # Unit conversion
├── cost-calculator.ts         # Recipe costing
└── schema-org-parser.ts       # Parse Schema.org JSON-LD
```

---

## <a name="database"></a>🗄️ Database Schema

### New Tables Needed

**1. Recipes** (already exists, extend)
```sql
ALTER TABLE Recipes
ADD COLUMN IF NOT EXISTS import_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS source_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS original_image_url TEXT,
ADD COLUMN IF NOT EXISTS import_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS import_notes TEXT,
ADD COLUMN IF NOT EXISTS last_costed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cost_per_portion DECIMAL(10,2);

COMMENT ON COLUMN Recipes.import_method IS 'manual, photo_ocr, website_url, google_sheets';
```

**2. RecipeIngredients** (already exists, extend)
```sql
ALTER TABLE RecipeIngredients
ADD COLUMN IF NOT EXISTS original_text TEXT,
ADD COLUMN IF NOT EXISTS match_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS conversion_notes TEXT,
ADD COLUMN IF NOT EXISTS preparation_method TEXT;

COMMENT ON COLUMN RecipeIngredients.original_text IS 'Original ingredient text from source: "2 cups chopped romaine"';
COMMENT ON COLUMN RecipeIngredients.match_confidence IS 'Confidence score 0.00-1.00 for ingredient match';
```

**3. UnitConversions** (new)
```sql
CREATE TABLE UnitConversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_unit VARCHAR(50) NOT NULL,
  to_unit VARCHAR(50) NOT NULL,
  ingredient_type VARCHAR(100), -- e.g., "leafy_greens", "dense_solid"
  conversion_factor DECIMAL(10,6) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed data
INSERT INTO UnitConversions (from_unit, to_unit, ingredient_type, conversion_factor) VALUES
('cup', 'gram', 'leafy_greens', 47.0),      -- 1 cup lettuce ≈ 47g
('cup', 'gram', 'dense_liquid', 240.0),     -- 1 cup water = 240g
('tablespoon', 'gram', 'oil', 14.0),        -- 1 tbsp oil ≈ 14g
('ounce', 'gram', NULL, 28.35),             -- 1 oz = 28.35g
('pound', 'gram', NULL, 453.59);            -- 1 lb = 453.59g
```

**4. IngredientMatchCache** (new)
```sql
CREATE TABLE IngredientMatchCache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_text TEXT NOT NULL,
  matched_inventory_item_id UUID REFERENCES InventoryItems(id),
  match_confidence DECIMAL(3,2),
  manually_confirmed BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_ingredient_match_original 
ON IngredientMatchCache(original_text);

COMMENT ON TABLE IngredientMatchCache IS 'Cache ingredient matches to speed up future imports';
```

---

## <a name="photo-ocr"></a>📸 Import Method 1: Photo OCR

### Technology Stack

**Google Cloud Document AI:**
- Same technology used for delivery dockets
- Already integrated in JiGR
- 95%+ accuracy on printed text
- 85%+ accuracy on handwriting

### Implementation

**API Endpoint:** `/api/recipes/import/photo`

```typescript
// app/api/recipes/import/photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 1. Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // 2. Send to Document AI
    const client = new DocumentProcessorServiceClient();
    const [result] = await client.processDocument({
      name: process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_NAME,
      rawDocument: {
        content: base64,
        mimeType: file.type
      }
    });

    // 3. Extract text
    const text = result.document?.text || '';

    // 4. Parse with AI
    const parsed = await parseRecipeText(text);

    return NextResponse.json({
      success: true,
      recipe: parsed,
      original_text: text
    });

  } catch (error) {
    console.error('Photo OCR error:', error);
    return NextResponse.json(
      { error: 'Failed to process photo' },
      { status: 500 }
    );
  }
}

/**
 * Parse recipe text using Claude AI
 */
async function parseRecipeText(text: string) {
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
        content: `Parse this recipe text into structured JSON.

Recipe text:
${text}

Extract:
1. Recipe name (required)
2. Serving size (e.g., "Serves 4", "Makes 12 cookies")
3. Ingredients with:
   - Quantity (number, can be decimal or fraction)
   - Unit (cup, tablespoon, ounce, pound, gram, etc.)
   - Ingredient name
   - Preparation method (diced, chopped, sifted, optional)
4. Instructions (step-by-step)
5. Prep time, cook time (if mentioned)
6. Notes or tips (if present)

Rules:
- Convert fractions to decimals: 1/2 = 0.5, 1/4 = 0.25
- Standardize units: tbsp → tablespoon, oz → ounce
- Separate preparation from ingredient: "diced" is preparation, not part of name
- Mark optional ingredients
- Assign confidence score (0.0-1.0) based on clarity

Output valid JSON only:
{
  "name": "Caesar Salad",
  "servings": 4,
  "prep_time_minutes": 15,
  "cook_time_minutes": 10,
  "ingredients": [
    {
      "quantity": 2,
      "unit": "cup",
      "ingredient": "romaine lettuce",
      "preparation": "chopped",
      "optional": false,
      "original_text": "2 cups chopped romaine lettuce"
    }
  ],
  "instructions": [
    "Step 1...",
    "Step 2..."
  ],
  "notes": "Can substitute kale for romaine",
  "confidence": 0.95
}`
      }]
    })
  });

  const result = await response.json();
  const content = result.content[0].text;
  
  // Clean and parse
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}
```

### UI Component

**File:** `app/recipes/import/photo/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PhotoRecipeImport() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/recipes/import/photo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { recipe } = await response.json();

      // Store in session for preview
      sessionStorage.setItem('recipe_import_data', JSON.stringify(recipe));
      
      // Navigate to preview
      router.push('/recipes/import/photo/preview');

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to process photo. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Photograph Recipe
        </h1>

        {!preview ? (
          <>
            {/* Camera Input */}
            <label className="
              block w-full p-12 rounded-2xl
              bg-white/10 backdrop-blur-xl
              border-2 border-dashed border-white/40
              hover:border-emerald-400
              cursor-pointer
              text-center
              transition-all duration-200
            ">
              <div className="text-6xl mb-4">📸</div>
              <div className="text-white text-lg mb-2">
                Take Photo or Upload Image
              </div>
              <div className="text-white/60 text-sm">
                Cookbooks, magazines, recipe cards, or handwritten notes
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </>
        ) : (
          <>
            {/* Preview */}
            <div className="mb-6">
              <img
                src={preview}
                alt="Recipe preview"
                className="w-full rounded-2xl"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                className="
                  flex-1 py-4 rounded-2xl
                  bg-white/10 text-white font-semibold
                  hover:bg-white/20
                "
              >
                ← Retake
              </button>
              <button
                onClick={handleUpload}
                disabled={processing}
                className="
                  flex-1 py-4 rounded-2xl
                  bg-emerald-500 text-white font-semibold
                  hover:bg-emerald-600
                  disabled:opacity-50
                "
              >
                {processing ? 'Processing...' : 'Process Recipe →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## <a name="website"></a>🌐 Import Method 2: Website Scraping

### Approach: Schema.org First, AI Fallback

**Most recipe websites use Schema.org markup:**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Recipe",
  "name": "Caesar Salad",
  "recipeYield": "4 servings",
  "recipeIngredient": [
    "2 cups romaine lettuce, chopped",
    "4 oz chicken breast, grilled",
    "2 tbsp Caesar dressing"
  ],
  "recipeInstructions": [
    {
      "@type": "HowToStep",
      "text": "Grill the chicken..."
    }
  ]
}
</script>
```

**If Schema.org not present → AI scrapes HTML**

### Implementation

**API Endpoint:** `/api/recipes/import/url`

```typescript
// app/api/recipes/import/url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL required' },
        { status: 400 }
      );
    }

    // 1. Fetch page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'JiGR-Recipe-Importer/1.0'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch URL' },
        { status: 400 }
      );
    }

    const html = await response.text();

    // 2. Try Schema.org first
    let recipe = parseSchemaOrg(html);

    // 3. Fallback to AI parsing
    if (!recipe) {
      recipe = await parseWithAI(html, url);
    }

    return NextResponse.json({
      success: true,
      recipe,
      source_url: url
    });

  } catch (error) {
    console.error('URL import error:', error);
    return NextResponse.json(
      { error: 'Failed to import recipe' },
      { status: 500 }
    );
  }
}

/**
 * Parse Schema.org JSON-LD
 */
function parseSchemaOrg(html: string) {
  const $ = cheerio.load(html);
  
  // Find JSON-LD script tags
  const scripts = $('script[type="application/ld+json"]');
  
  for (let i = 0; i < scripts.length; i++) {
    try {
      const json = JSON.parse($(scripts[i]).html() || '{}');
      
      if (json['@type'] === 'Recipe') {
        return {
          name: json.name,
          servings: parseServings(json.recipeYield),
          prep_time_minutes: parseDuration(json.prepTime),
          cook_time_minutes: parseDuration(json.cookTime),
          ingredients: parseSchemaIngredients(json.recipeIngredient),
          instructions: parseSchemaInstructions(json.recipeInstructions),
          image_url: json.image,
          confidence: 0.98 // High confidence for Schema.org
        };
      }
    } catch (e) {
      // Continue to next script
    }
  }
  
  return null;
}

function parseServings(yield: any): number {
  if (typeof yield === 'number') return yield;
  if (typeof yield === 'string') {
    const match = yield.match(/\d+/);
    return match ? parseInt(match[0]) : 4;
  }
  return 4; // Default
}

function parseDuration(duration: string): number | null {
  if (!duration) return null;
  // ISO 8601 duration: PT15M = 15 minutes
  const match = duration.match(/PT(\d+)M/);
  return match ? parseInt(match[1]) : null;
}

function parseSchemaIngredients(ingredients: string[]): any[] {
  return ingredients.map(ing => ({
    original_text: ing,
    quantity: null, // Will be parsed by AI
    unit: null,
    ingredient: ing,
    preparation: null,
    optional: false
  }));
}

function parseSchemaInstructions(instructions: any): string[] {
  if (Array.isArray(instructions)) {
    return instructions.map(step => {
      if (typeof step === 'string') return step;
      if (step.text) return step.text;
      return '';
    });
  }
  if (typeof instructions === 'string') {
    return instructions.split('\n').filter(s => s.trim());
  }
  return [];
}

/**
 * Fallback: Parse with AI
 */
async function parseWithAI(html: string, url: string) {
  // Extract main content (remove nav, footer, ads)
  const $ = cheerio.load(html);
  $('nav, footer, script, style, .ad, .advertisement').remove();
  const mainContent = $('body').text();

  // Use Claude to parse
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
        content: `Extract recipe from this webpage content.

URL: ${url}

Content:
${mainContent.slice(0, 8000)} // Truncate if too long

Find and extract the recipe with:
- Name
- Servings
- Ingredients list
- Instructions

Output structured JSON only.`
      }]
    })
  });

  const result = await response.json();
  const content = result.content[0].text;
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}
```

---

## <a name="sheets"></a>📊 Import Method 3: Google Sheets

### Format Detection

**Common spreadsheet formats:**

**Format A: Column-Based**
```
Recipe Name | Serves | Ingredient 1 | Qty 1 | Unit 1 | Ingredient 2 | Qty 2 | Unit 2 ...
Caesar Salad | 4 | Romaine | 2 | cup | Chicken | 4 | oz ...
```

**Format B: Row-Based**
```
Recipe Name: Caesar Salad
Serves: 4
Ingredients:
- 2 cups romaine lettuce
- 4 oz chicken breast
Instructions:
1. Grill chicken...
```

**Format C: Structured**
```
Name | Servings | Ingredients | Instructions
Caesar Salad | 4 | "2c romaine; 4oz chicken; 2T dressing" | "Grill chicken. Chop romaine..."
```

### Implementation

**API Endpoint:** `/api/recipes/import/sheets`

```typescript
// app/api/recipes/import/sheets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { readSpreadsheet } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const { spreadsheetId, sheetName } = await request.json();

    // Fetch data
    const rows = await readSpreadsheet(accessToken, spreadsheetId, sheetName);

    // Detect format and parse
    const recipes = await parseRecipeSheet(rows);

    return NextResponse.json({
      success: true,
      recipes,
      count: recipes.length
    });

  } catch (error) {
    console.error('Sheets import error:', error);
    return NextResponse.json(
      { error: 'Failed to import recipes' },
      { status: 500 }
    );
  }
}

async function parseRecipeSheet(rows: string[][]): Promise<any[]> {
  // Convert to text for AI analysis
  const text = rows.map(row => row.join('\t')).join('\n');

  // Let AI detect format and parse
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: `Parse this recipe spreadsheet into structured JSON.

Data:
${text}

Detect the format automatically:
- Column-based (each ingredient in separate column)
- Row-based (recipe details in multiple rows)
- Structured (ingredients in single cell, separated by semicolons)

Extract ALL recipes with:
- Name
- Servings
- Ingredients (with quantity, unit, name)
- Instructions

Output valid JSON array only:
{
  "recipes": [
    {
      "name": "Caesar Salad",
      "servings": 4,
      "ingredients": [...],
      "instructions": [...]
    }
  ]
}`
      }]
    })
  });

  const result = await response.json();
  const content = result.content[0].text;
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned);
  
  return parsed.recipes || [];
}
```

---

## <a name="ingredient-matching"></a>🎯 Core Challenge: Ingredient Matching

### The Problem

```
Recipe says: "romaine"
Inventory has 500+ items

Must find best match:
✅ "Romaine Lettuce, Fresh" (95% confidence)
❌ "Red Lettuce, Fresh" (45% confidence)
```

### Solution: Multi-Stage Matching

**Stage 1: Exact Match**
```typescript
SELECT * FROM InventoryItems 
WHERE LOWER(name) = LOWER('romaine lettuce');
```

**Stage 2: Fuzzy Match (Levenshtein Distance)**
```typescript
SELECT 
  id,
  name,
  similarity(name, 'romaine lettuce') as score
FROM InventoryItems
WHERE similarity(name, 'romaine lettuce') > 0.6
ORDER BY score DESC
LIMIT 5;
```

**Stage 3: AI-Powered Match**
```typescript
// If Stages 1-2 fail, ask AI:
"Which item best matches 'romaine' from this list:
1. Romaine Lettuce, Fresh
2. Iceberg Lettuce, Fresh
3. Red Leaf Lettuce
4. Cabbage, Green
5. Kale, Curly"

→ AI picks #1 with 95% confidence
```

### Implementation

**API Endpoint:** `/api/recipes/import/match-ingredients`

```typescript
// app/api/recipes/import/match-ingredients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { ingredients } = await request.json();

    const matched = await Promise.all(
      ingredients.map(ing => matchIngredient(ing, supabase))
    );

    return NextResponse.json({
      success: true,
      matched_ingredients: matched
    });

  } catch (error) {
    console.error('Ingredient matching error:', error);
    return NextResponse.json(
      { error: 'Failed to match ingredients' },
      { status: 500 }
    );
  }
}

async function matchIngredient(ingredient: any, supabase: any) {
  const searchTerm = ingredient.ingredient;

  // Stage 1: Exact match
  const { data: exactMatch } = await supabase
    .from('InventoryItems')
    .select('*')
    .ilike('name', searchTerm)
    .limit(1);

  if (exactMatch && exactMatch.length > 0) {
    return {
      ...ingredient,
      matched_item_id: exactMatch[0].id,
      matched_item_name: exactMatch[0].name,
      match_confidence: 1.0,
      match_method: 'exact'
    };
  }

  // Stage 2: Fuzzy match (using PostgreSQL similarity)
  const { data: fuzzyMatches } = await supabase
    .rpc('fuzzy_search_inventory', {
      search_term: searchTerm,
      similarity_threshold: 0.6
    });

  if (fuzzyMatches && fuzzyMatches.length > 0) {
    return {
      ...ingredient,
      matched_item_id: fuzzyMatches[0].id,
      matched_item_name: fuzzyMatches[0].name,
      match_confidence: fuzzyMatches[0].similarity,
      match_method: 'fuzzy',
      alternatives: fuzzyMatches.slice(1, 4) // Top 3 alternatives
    };
  }

  // Stage 3: AI-powered match
  const { data: allItems } = await supabase
    .from('InventoryItems')
    .select('id, name')
    .limit(50);

  const aiMatch = await matchWithAI(searchTerm, allItems);

  return {
    ...ingredient,
    matched_item_id: aiMatch?.id || null,
    matched_item_name: aiMatch?.name || null,
    match_confidence: aiMatch?.confidence || 0,
    match_method: 'ai',
    needs_review: aiMatch?.confidence < 0.8
  };
}

async function matchWithAI(searchTerm: string, items: any[]) {
  const itemsList = items.map((item, i) => `${i + 1}. ${item.name}`).join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Match ingredient "${searchTerm}" to the best item from this list:

${itemsList}

Return JSON only:
{
  "item_number": 1,
  "confidence": 0.95,
  "reasoning": "Brief explanation"
}

If no good match, return {"item_number": null, "confidence": 0}`
      }]
    })
  });

  const result = await response.json();
  const content = result.content[0].text;
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const match = JSON.parse(cleaned);

  if (match.item_number) {
    const item = items[match.item_number - 1];
    return {
      id: item.id,
      name: item.name,
      confidence: match.confidence
    };
  }

  return null;
}
```

### Database Function

```sql
-- PostgreSQL function for fuzzy matching
CREATE OR REPLACE FUNCTION fuzzy_search_inventory(
  search_term TEXT,
  similarity_threshold FLOAT DEFAULT 0.6
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.name,
    similarity(LOWER(i.name), LOWER(search_term)) as sim
  FROM InventoryItems i
  WHERE similarity(LOWER(i.name), LOWER(search_term)) > similarity_threshold
  ORDER BY sim DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

---

## <a name="unit-conversion"></a>⚖️ Unit Conversion System

### The Challenge

```
Recipe: "2 cups diced onions"
Inventory: "Yellow Onions, 50lb bag @ $0.12/lb"

Need to convert:
2 cups → ? pounds
```

### Conversion Approach

**Step 1: Standardize unit names**
```typescript
'c' → 'cup'
'tbsp' → 'tablespoon'
'oz' → 'ounce'
'lb' → 'pound'
```

**Step 2: Look up conversion factor**
```typescript
// From database or lookup table
'cup' + 'onion' → 5.3 oz per cup
5.3 oz × 2 cups = 10.6 oz
10.6 oz ÷ 16 = 0.66 lb
```

**Step 3: Calculate cost**
```typescript
0.66 lb × $0.12/lb = $0.08
```

### Implementation

```typescript
// lib/recipes/unit-converter.ts

interface ConversionResult {
  original_quantity: number;
  original_unit: string;
  converted_quantity: number;
  converted_unit: string;
  conversion_factor: number;
}

export async function convertUnit(
  quantity: number,
  fromUnit: string,
  toUnit: string,
  ingredientType?: string
): Promise<ConversionResult> {
  
  // Normalize units
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  // Check if units are the same
  if (from === to) {
    return {
      original_quantity: quantity,
      original_unit: from,
      converted_quantity: quantity,
      converted_unit: to,
      conversion_factor: 1.0
    };
  }

  // Look up conversion factor
  const factor = await getConversionFactor(from, to, ingredientType);

  return {
    original_quantity: quantity,
    original_unit: from,
    converted_quantity: quantity * factor,
    converted_unit: to,
    conversion_factor: factor
  };
}

function normalizeUnit(unit: string): string {
  const normalized: { [key: string]: string } = {
    'c': 'cup',
    'cups': 'cup',
    'tbsp': 'tablespoon',
    'tablespoons': 'tablespoon',
    'tsp': 'teaspoon',
    'teaspoons': 'teaspoon',
    'oz': 'ounce',
    'ounces': 'ounce',
    'lb': 'pound',
    'lbs': 'pound',
    'pounds': 'pound',
    'g': 'gram',
    'grams': 'gram',
    'kg': 'kilogram',
    'ml': 'milliliter',
    'l': 'liter'
  };

  return normalized[unit.toLowerCase()] || unit.toLowerCase();
}

async function getConversionFactor(
  from: string,
  to: string,
  ingredientType?: string
): Promise<number> {
  
  // Query database for conversion
  const { data } = await supabase
    .from('UnitConversions')
    .select('conversion_factor')
    .eq('from_unit', from)
    .eq('to_unit', to)
    .eq('ingredient_type', ingredientType || null)
    .single();

  if (data) {
    return data.conversion_factor;
  }

  // Fallback: Standard conversions
  const standardConversions: { [key: string]: number } = {
    'cup_gram': 240, // 1 cup ≈ 240g (water)
    'tablespoon_gram': 15,
    'teaspoon_gram': 5,
    'ounce_gram': 28.35,
    'pound_gram': 453.59,
    'liter_milliliter': 1000
  };

  const key = `${from}_${to}`;
  return standardConversions[key] || 1.0;
}
```

---

## <a name="costing"></a>💰 Recipe Costing

### Calculation Flow

```
1. For each ingredient:
   → Get matched inventory item
   → Get item price per unit
   → Convert recipe quantity to item unit
   → Calculate cost

2. Sum all ingredient costs = Total Recipe Cost

3. Divide by servings = Cost Per Portion
```

### Implementation

```typescript
// lib/recipes/cost-calculator.ts

interface CostBreakdown {
  total_cost: number;
  cost_per_portion: number;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    unit_cost: number;
    total_cost: number;
  }>;
}

export async function calculateRecipeCost(
  recipeId: string,
  servings: number
): Promise<CostBreakdown> {
  
  // Get recipe ingredients
  const { data: ingredients } = await supabase
    .from('RecipeIngredients')
    .select(`
      *,
      inventory_item:InventoryItems(*)
    `)
    .eq('recipe_id', recipeId);

  const costs = await Promise.all(
    ingredients.map(ing => calculateIngredientCost(ing))
  );

  const totalCost = costs.reduce((sum, cost) => sum + cost.total_cost, 0);

  return {
    total_cost: totalCost,
    cost_per_portion: totalCost / servings,
    ingredients: costs
  };
}

async function calculateIngredientCost(ingredient: any) {
  const item = ingredient.inventory_item;
  
  // Convert ingredient quantity to item's unit
  const converted = await convertUnit(
    ingredient.quantity,
    ingredient.unit,
    item.unit_of_measurement,
    item.category
  );

  // Calculate cost
  const unitCost = item.average_cost_per_unit || 0;
  const totalCost = converted.converted_quantity * unitCost;

  return {
    name: item.name,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
    unit_cost: unitCost,
    total_cost: totalCost
  };
}
```

---

## <a name="roadmap"></a>🗺️ Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal:** Database + Photo OCR working

- [ ] Database migration (new columns, UnitConversions table)
- [ ] Photo OCR API endpoint
- [ ] Photo OCR UI component
- [ ] AI recipe parsing (basic)
- [ ] Preview UI

**Deliverable:** Can photograph recipe and see parsed data

---

### Phase 2: Ingredient Matching (Week 3-4)
**Goal:** Link ingredients to inventory

- [ ] Fuzzy matching PostgreSQL function
- [ ] Ingredient matching API endpoint
- [ ] AI-powered matching fallback
- [ ] Match confidence UI
- [ ] Manual override UI

**Deliverable:** Parsed recipes link to inventory items

---

### Phase 3: Unit Conversion & Costing (Week 5-6)
**Goal:** Calculate recipe costs

- [ ] Unit conversion system
- [ ] Seed UnitConversions table
- [ ] Cost calculation API
- [ ] Cost display UI
- [ ] Cost per portion

**Deliverable:** Recipes show accurate costs

---

### Phase 4: Website Scraping (Week 7-8)
**Goal:** Import from URLs

- [ ] Schema.org parser
- [ ] HTML scraping fallback
- [ ] Website URL UI
- [ ] Preview parsed recipe
- [ ] Handle common recipe sites

**Deliverable:** Can import from AllRecipes, BBC Food, etc.

---

### Phase 5: Google Sheets Bulk Import (Week 9-10)
**Goal:** Import 50+ recipes at once

- [ ] Sheet format detection
- [ ] Bulk parsing API
- [ ] Progress indicators
- [ ] Batch ingredient matching
- [ ] Bulk preview UI

**Deliverable:** Can import entire recipe database

---

### Phase 6: Polish & Optimization (Week 11-12)
**Goal:** Production-ready

- [ ] Comprehensive testing
- [ ] Error handling
- [ ] Loading states
- [ ] Mobile optimization
- [ ] Documentation

**Deliverable:** Ready for production deployment

---

## 🎯 Success Criteria

**Functional:**
- ✅ Photo OCR: 85%+ accuracy on printed text
- ✅ Website: 90%+ success rate on major sites
- ✅ Sheets: Parse 95%+ of common formats
- ✅ Ingredient matching: 80%+ automatic match rate
- ✅ Cost calculation: Within 5% of actual cost

**Performance:**
- ✅ Photo OCR: <30 seconds
- ✅ Website: <15 seconds
- ✅ Sheets: <5 seconds per recipe
- ✅ Ingredient matching: <2 seconds per ingredient

**User Experience:**
- ✅ Clear confidence scores
- ✅ Easy manual overrides
- ✅ Helpful error messages
- ✅ Progress indicators
- ✅ Works on iPad Air (2013)

---

## 💡 Next Steps

1. **Review this plan** - Feedback on architecture
2. **Prioritize phases** - Which method first?
3. **Create detailed specs** - For Phase 1
4. **Prototype** - Build proof-of-concept
5. **Test with real data** - Validate assumptions

---

**Planning Status:** Complete ✅  
**Ready for:** Architecture review & decision  
**Estimated Total Time:** 10-12 weeks  
**Complexity:** ⭐⭐⭐⭐⭐ (Highest in JiGR)

---

**This is the complete RECIPES import planning package!** 🎉
