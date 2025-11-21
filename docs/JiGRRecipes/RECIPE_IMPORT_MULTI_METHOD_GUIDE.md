# JiGR Recipe Import - Multi-Method Implementation Guide

**Project:** Recipe Import Enhancement  
**Features:** Google Sheets + Photo OCR + Website URL + Manual Entry  
**Date:** November 20, 2025  
**Status:** Ready for Development

---

## 🎯 Executive Summary

Transform recipe onboarding with **4 complete import methods** that eliminate the biggest barrier to adoption: getting existing recipes into the system.

### The Problem:
- Restaurants have 50+ recipes across multiple formats
- Manual entry takes 10+ hours
- Users abandon during onboarding
- Data entry errors are common

### The Solution:
1. **Google Sheets Import** - Bulk migrate from spreadsheets (✅ DONE!)
2. **Photo OCR** - Scan cookbooks, magazines, handwritten recipes
3. **Website URL** - Copy from AllRecipes, BBC Food, etc.
4. **Manual Entry** - Traditional form input

### Business Impact:
- ⚡ 20 hours → 30 minutes (40× faster onboarding)
- 🎯 Covers 100% of recipe sources
- 🚀 NO competitor has this capability
- 💰 Premium feature for higher tiers

---

## 📸 PHOTO OCR IMPLEMENTATION

### Architecture Overview

```
User takes photo → Upload to storage → Google Document AI (OCR) 
→ Extract raw text → Claude API (parse structure) → Preview with confidence 
→ Fuzzy match ingredients → User confirms → Save to database
```

### Step 1: Google Cloud Setup

**Configure Document AI Processor:**

```bash
# 1. Go to Google Cloud Console
# 2. Navigate to Document AI
# 3. Create new processor:
#    - Type: "Document OCR"
#    - Name: "JiGR Recipe OCR Processor"
#    - Location: us (or your region)
```

**Get Processor ID:**
```bash
# Format: projects/PROJECT_ID/locations/LOCATION/processors/PROCESSOR_ID
# Example: projects/jigr-prod/locations/us/processors/abc123def456

# Add to .env.local:
GOOGLE_DOCUMENT_AI_RECIPE_PROCESSOR_ID=abc123def456
```

**Enable Required APIs:**
```bash
# Already enabled for delivery dockets, but verify:
# - Document AI API ✓
# - Cloud Storage API ✓
```

---

### Step 2: Database Schema

```sql
-- Migration: 032_recipe_import_enhancements.sql

-- Add import tracking columns to Recipes table
ALTER TABLE Recipes 
ADD COLUMN IF NOT EXISTS import_method VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS source_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS original_image_url TEXT,
ADD COLUMN IF NOT EXISTS import_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS import_notes TEXT,
ADD COLUMN IF NOT EXISTS raw_ocr_text TEXT;

-- Create import sessions table for tracking
CREATE TABLE IF NOT EXISTS recipe_import_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  import_method VARCHAR(50) NOT NULL, -- 'google_sheets' | 'photo_ocr' | 'website_url' | 'manual'
  source_identifier TEXT, -- URL, spreadsheet_id, or filename
  
  total_recipes INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  
  session_metadata JSONB, -- Store method-specific data
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies
ALTER TABLE recipe_import_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import sessions"
  ON recipe_import_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own import sessions"
  ON recipe_import_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_recipe_import_sessions_user ON recipe_import_sessions(user_id);
CREATE INDEX idx_recipe_import_sessions_client ON recipe_import_sessions(client_id);
CREATE INDEX idx_recipe_import_sessions_created ON recipe_import_sessions(created_at DESC);

-- Comments
COMMENT ON COLUMN Recipes.import_method IS 'How this recipe was imported: manual, google_sheets, photo_ocr, website_url';
COMMENT ON COLUMN Recipes.import_confidence IS 'AI confidence score (0.00-1.00) for parsed data accuracy';
```

---

### Step 3: Backend - Photo OCR API

```typescript
// app/api/recipes/import/photo/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { processRecipeImage } from '@/lib/google-cloud/document-ai';
import { parseRecipeText } from '@/lib/ai/recipe-parser';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's client_id
    const { data: clientUser } = await supabase
      .from('client_users')
      .select('client_id')
      .eq('user_id', user.id)
      .single();
    
    if (!clientUser) {
      return NextResponse.json({ error: 'No client association' }, { status: 403 });
    }
    
    // Parse request body
    const { image, source_name } = await request.json();
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }
    
    // Step 1: Upload to Supabase Storage for record keeping
    const imageBuffer = Buffer.from(image.split(',')[1], 'base64');
    const filename = `recipe-photos/${user.id}/${Date.now()}.jpg`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recipe-imports')
      .upload(filename, imageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to store image' }, { status: 500 });
    }
    
    // Step 2: Process with Google Document AI (OCR)
    const ocrResult = await processRecipeImage(image);
    
    // Step 3: Parse with Claude AI
    const parsedRecipe = await parseRecipeText(ocrResult.text, 'photo_ocr');
    
    // Step 4: Create import session
    const { data: session } = await supabase
      .from('recipe_import_sessions')
      .insert({
        user_id: user.id,
        client_id: clientUser.client_id,
        import_method: 'photo_ocr',
        source_identifier: filename,
        total_recipes: 1,
        session_metadata: {
          source_name,
          ocr_confidence: ocrResult.confidence,
          storage_path: filename
        }
      })
      .select()
      .single();
    
    // Return parsed data for preview
    return NextResponse.json({
      success: true,
      session_id: session.id,
      parsed: {
        ...parsedRecipe,
        raw_ocr_text: ocrResult.text,
        import_method: 'photo_ocr',
        source_name,
        original_image_url: uploadData.path
      },
      warnings: generateWarnings(parsedRecipe)
    });
    
  } catch (error) {
    console.error('Recipe photo import error:', error);
    return NextResponse.json(
      { error: 'Failed to process recipe photo' },
      { status: 500 }
    );
  }
}

function generateWarnings(recipe: any): string[] {
  const warnings: string[] = [];
  
  if (recipe.confidence < 0.8) {
    warnings.push('Low confidence OCR - please review all fields carefully');
  }
  
  if (!recipe.servings || recipe.servings === 0) {
    warnings.push('Could not detect serving size - please specify');
  }
  
  const lowConfidenceIngredients = recipe.ingredients?.filter(
    (ing: any) => ing.confidence < 0.7
  );
  
  if (lowConfidenceIngredients?.length > 0) {
    warnings.push(
      `${lowConfidenceIngredients.length} ingredient(s) have low confidence - review before saving`
    );
  }
  
  return warnings;
}
```

---

### Step 4: Google Document AI Integration

```typescript
// lib/google-cloud/document-ai.ts (ENHANCE EXISTING FILE)

import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

const documentAIClient = new DocumentProcessorServiceClient({
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS || '{}')
});

// Add to existing file:
export async function processRecipeImage(imageBase64: string) {
  const processorId = process.env.GOOGLE_DOCUMENT_AI_RECIPE_PROCESSOR_ID;
  
  if (!processorId) {
    throw new Error('Recipe processor not configured');
  }
  
  const name = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/us/processors/${processorId}`;
  
  // Remove data URL prefix if present
  const base64Data = imageBase64.includes(',') 
    ? imageBase64.split(',')[1] 
    : imageBase64;
  
  const request = {
    name,
    rawDocument: {
      content: base64Data,
      mimeType: 'image/jpeg',
    },
  };
  
  try {
    const [response] = await documentAIClient.processDocument(request);
    
    return {
      text: response.document?.text || '',
      confidence: response.document?.pages?.[0]?.image?.quality?.score || 0,
      pages: response.document?.pages?.length || 1
    };
    
  } catch (error) {
    console.error('Document AI error:', error);
    throw new Error('OCR processing failed');
  }
}
```

---

### Step 5: AI Recipe Parser

```typescript
// lib/ai/recipe-parser.ts (NEW FILE)

export async function parseRecipeText(
  rawText: string,
  source: 'photo_ocr' | 'website_html' | 'google_sheets'
) {
  const prompt = buildPrompt(rawText, source);
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const responseText = data.content[0].text;
    
    // Strip markdown code blocks if present
    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    return JSON.parse(cleanedText);
    
  } catch (error) {
    console.error('Recipe parsing error:', error);
    throw new Error('Failed to parse recipe data');
  }
}

function buildPrompt(rawText: string, source: string): string {
  return `
You are a recipe data extraction expert. Analyze the following text from a ${source} and extract structured recipe data.

RAW TEXT:
${rawText}

CRITICAL INSTRUCTIONS:
1. Extract ALL ingredients with their quantities and units
2. Parse preparation instructions step-by-step
3. Detect serving size, prep time, cook time if mentioned
4. Assign confidence scores (0.0-1.0) for each extracted field
5. Handle fractional quantities (1/2, ¾, etc.) as decimals
6. Normalize units to standard forms (cups, tablespoons, teaspoons, ounces, pounds, grams)
7. Separate ingredient name from preparation method ("2 cups flour, sifted" → ingredient: "flour", preparation: "sifted")

OUTPUT FORMAT:
Return ONLY valid JSON in this exact structure:

{
  "recipe_name": "string",
  "servings": number,
  "portion_size": "string (e.g., '1 slice', '8 oz', '1 sandwich')",
  "prep_time_minutes": number or null,
  "cook_time_minutes": number or null,
  "total_time_minutes": number or null,
  "ingredients": [
    {
      "quantity": "string (e.g., '2', '1.5', '0.25')",
      "unit": "string (standardized: cup, tablespoon, teaspoon, ounce, pound, gram, each, etc.)",
      "ingredient": "string (base ingredient name only)",
      "preparation": "string or null (e.g., 'diced', 'sifted', 'melted')",
      "confidence": number (0.0-1.0)
    }
  ],
  "instructions": [
    "step 1 text",
    "step 2 text"
  ],
  "notes": "string or null (any additional notes, tips, variations)",
  "category": "string or null (appetizer, entree, dessert, etc.)",
  "source": "string or null (cookbook name, website, magazine if detected)",
  "confidence": number (overall confidence 0.0-1.0)
}

IMPORTANT: 
- Output ONLY the JSON object, no other text
- Do not include markdown code blocks
- Ensure all JSON is valid and properly escaped
- Set confidence scores honestly based on text clarity
`;
}
```

---

### Step 6: Frontend UI - Photo Upload

```typescript
// app/recipes/import/photo/page.tsx (NEW FILE)

'use client';

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ImportRecipePhoto() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [sourceName, setSourceName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB for iPad Air)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large. Please choose a smaller image (max 10MB)');
      return;
    }

    setFileName(file.name);
    setError(null);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!image) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/recipes/import/photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image,
          source_name: sourceName || fileName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      const result = await response.json();

      // Navigate to preview page with parsed data
      sessionStorage.setItem('recipe_import_preview', JSON.stringify(result));
      router.push('/recipes/import/preview');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="glass-panel p-8">
        <h1 className="text-3xl font-bold mb-2">Import Recipe from Photo</h1>
        <p className="text-gray-400 mb-8">
          Photograph a recipe from a cookbook, magazine, or handwritten note
        </p>

        {/* Camera/Upload Input */}
        <div className="mb-6">
          <label
            htmlFor="photo-upload"
            className="block w-full p-12 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-blue-500 transition-colors"
          >
            {image ? (
              <div className="space-y-4">
                <div className="relative w-full h-96">
                  <Image
                    src={image}
                    alt="Recipe photo"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
                <p className="text-sm text-gray-400">{fileName}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p className="text-lg font-medium">Take Photo or Upload Image</p>
                  <p className="text-sm text-gray-400 mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>
            )}
          </label>
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCapture}
            className="hidden"
          />
        </div>

        {/* Source Name (Optional) */}
        {image && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Source Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., 'Better Homes & Gardens, June 2023'"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Help track where this recipe came from
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Process Button */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleProcess}
            disabled={!image || isProcessing}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Extracting Recipe...
              </span>
            ) : (
              'Extract Recipe Data'
            )}
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h3 className="font-medium mb-2">📸 Tips for Best Results:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Ensure good lighting</li>
            <li>• Keep camera steady and focus on text</li>
            <li>• Capture entire recipe (ingredients + instructions)</li>
            <li>• Avoid shadows and glare</li>
            <li>• For handwritten recipes, use clear writing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
```

---

## 🌐 WEBSITE URL IMPLEMENTATION

### Architecture Overview

```
User pastes URL → Fetch webpage → Check for schema.org markup 
→ If found: Parse JSON-LD → If not: AI parse HTML 
→ Preview with confidence → Fuzzy match ingredients 
→ User confirms → Save to database
```

### Step 1: Website Scraper API

```typescript
// app/api/recipes/import/url/route.ts (NEW FILE)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { scrapeRecipeFromURL } from '@/lib/recipe-scrapers/scraper';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's client_id
    const { data: clientUser } = await supabase
      .from('client_users')
      .select('client_id')
      .eq('user_id', user.id)
      .single();
    
    if (!clientUser) {
      return NextResponse.json({ error: 'No client association' }, { status: 403 });
    }
    
    // Parse request
    const { url } = await request.json();
    
    if (!url || !isValidURL(url)) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }
    
    // Scrape recipe from website
    const parsedRecipe = await scrapeRecipeFromURL(url);
    
    // Create import session
    const { data: session } = await supabase
      .from('recipe_import_sessions')
      .insert({
        user_id: user.id,
        client_id: clientUser.client_id,
        import_method: 'website_url',
        source_identifier: url,
        total_recipes: 1,
        session_metadata: {
          url,
          parse_method: parsedRecipe.parse_method
        }
      })
      .select()
      .single();
    
    return NextResponse.json({
      success: true,
      session_id: session.id,
      parsed: {
        ...parsedRecipe,
        import_method: 'website_url',
        source_url: url
      },
      warnings: generateWarnings(parsedRecipe)
    });
    
  } catch (error) {
    console.error('Recipe URL import error:', error);
    return NextResponse.json(
      { error: 'Failed to import recipe from URL' },
      { status: 500 }
    );
  }
}

function isValidURL(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

function generateWarnings(recipe: any): string[] {
  const warnings: string[] = [];
  
  if (recipe.parse_method === 'ai_fallback') {
    warnings.push('Website does not have structured data - parsed with AI (lower confidence)');
  }
  
  if (recipe.confidence < 0.8) {
    warnings.push('Low confidence parsing - please review all fields');
  }
  
  if (!recipe.servings) {
    warnings.push('Could not detect serving size - please specify');
  }
  
  return warnings;
}
```

---

### Step 2: Recipe Scraper Library

```typescript
// lib/recipe-scrapers/scraper.ts (NEW FILE)

import { parseSchemaOrgRecipe } from './schema-org-parser';
import { parseRecipeWithAI } from './ai-html-parser';

export async function scrapeRecipeFromURL(url: string) {
  try {
    // Fetch webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JiGR-RecipeBot/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Strategy 1: Try schema.org structured data (fast, accurate)
    const schemaRecipe = await parseSchemaOrgRecipe(html, url);
    if (schemaRecipe) {
      return {
        ...schemaRecipe,
        parse_method: 'schema_org',
        confidence: 1.0
      };
    }
    
    // Strategy 2: Fallback to AI parsing (slower, less accurate)
    const aiRecipe = await parseRecipeWithAI(html, url);
    return {
      ...aiRecipe,
      parse_method: 'ai_fallback',
      confidence: aiRecipe.confidence || 0.75
    };
    
  } catch (error) {
    console.error('Recipe scraping error:', error);
    throw new Error('Failed to scrape recipe from URL');
  }
}
```

---

### Step 3: Schema.org Parser

```typescript
// lib/recipe-scrapers/schema-org-parser.ts (NEW FILE)

export async function parseSchemaOrgRecipe(html: string, url: string) {
  try {
    // Extract JSON-LD script tags
    const jsonLdMatches = html.match(
      /<script type="application\/ld\+json">(.*?)<\/script>/gs
    );
    
    if (!jsonLdMatches) {
      return null;
    }
    
    // Parse each JSON-LD block
    for (const match of jsonLdMatches) {
      const jsonText = match
        .replace(/<script type="application\/ld\+json">/g, '')
        .replace(/<\/script>/g, '')
        .trim();
      
      try {
        const schema = JSON.parse(jsonText);
        
        // Check if it's a Recipe schema
        if (isRecipeSchema(schema)) {
          return extractRecipeData(schema, url);
        }
        
      } catch (parseError) {
        // Invalid JSON, try next block
        continue;
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Schema.org parsing error:', error);
    return null;
  }
}

function isRecipeSchema(schema: any): boolean {
  if (!schema) return false;
  
  const type = Array.isArray(schema['@type']) 
    ? schema['@type'] 
    : [schema['@type']];
  
  return type.includes('Recipe');
}

function extractRecipeData(schema: any, url: string) {
  return {
    recipe_name: schema.name,
    servings: parseYield(schema.recipeYield),
    portion_size: typeof schema.recipeYield === 'string' 
      ? schema.recipeYield 
      : null,
    prep_time_minutes: parseISO8601Duration(schema.prepTime),
    cook_time_minutes: parseISO8601Duration(schema.cookTime),
    total_time_minutes: parseISO8601Duration(schema.totalTime),
    ingredients: parseIngredients(schema.recipeIngredient),
    instructions: parseInstructions(schema.recipeInstructions),
    category: schema.recipeCategory || null,
    notes: schema.description || null,
    source: extractDomain(url),
    source_url: url,
    original_image_url: parseImage(schema.image),
    confidence: 1.0
  };
}

function parseYield(recipeYield: any): number | null {
  if (!recipeYield) return null;
  
  if (typeof recipeYield === 'number') {
    return recipeYield;
  }
  
  if (typeof recipeYield === 'string') {
    const match = recipeYield.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }
  
  return null;
}

function parseISO8601Duration(duration: string | undefined): number | null {
  if (!duration) return null;
  
  // Parse ISO 8601 duration (e.g., "PT30M", "PT1H30M")
  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  
  return hours * 60 + minutes;
}

function parseIngredients(ingredients: any): any[] {
  if (!ingredients) return [];
  
  // Schema.org ingredients are typically strings
  return ingredients.map((ing: string) => {
    // Basic parsing - AI will refine later
    return {
      raw_text: ing,
      quantity: null,
      unit: null,
      ingredient: ing,
      preparation: null,
      confidence: 0.9
    };
  });
}

function parseInstructions(instructions: any): string[] {
  if (!instructions) return [];
  
  // Instructions can be string, array of strings, or array of HowToStep objects
  if (typeof instructions === 'string') {
    return instructions.split(/\n+/).filter(s => s.trim());
  }
  
  if (Array.isArray(instructions)) {
    return instructions.map(inst => {
      if (typeof inst === 'string') return inst;
      if (inst['@type'] === 'HowToStep') return inst.text;
      return JSON.stringify(inst);
    });
  }
  
  return [];
}

function parseImage(image: any): string | null {
  if (!image) return null;
  
  if (typeof image === 'string') return image;
  
  if (Array.isArray(image) && image.length > 0) {
    return typeof image[0] === 'string' ? image[0] : image[0].url;
  }
  
  if (typeof image === 'object' && image.url) {
    return image.url;
  }
  
  return null;
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}
```

---

### Step 4: AI HTML Fallback Parser

```typescript
// lib/recipe-scrapers/ai-html-parser.ts (NEW FILE)

import { parseRecipeText } from '@/lib/ai/recipe-parser';

export async function parseRecipeWithAI(html: string, url: string) {
  // Strip HTML tags, keep text content
  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
    .replace(/<[^>]+>/g, ' ') // Remove all HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Limit text size to avoid token limits
  const truncatedText = text.slice(0, 15000);
  
  // Use existing AI parser with website context
  const parsed = await parseRecipeText(truncatedText, 'website_html');
  
  return {
    ...parsed,
    source_url: url,
    source: extractDomain(url)
  };
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}
```

---

### Step 5: Frontend UI - URL Input

```typescript
// app/recipes/import/url/page.tsx (NEW FILE)

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportRecipeURL() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!url) return;

    // Validate URL
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recipes/import/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('Failed to import recipe');
      }

      const result = await response.json();

      // Navigate to preview
      sessionStorage.setItem('recipe_import_preview', JSON.stringify(result));
      router.push('/recipes/import/preview');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="glass-panel p-8">
        <h1 className="text-3xl font-bold mb-2">Import Recipe from Website</h1>
        <p className="text-gray-400 mb-8">
          Copy a recipe from any website - works with AllRecipes, BBC Food, NYT Cooking, and more
        </p>

        {/* URL Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Recipe URL
          </label>
          <input
            type="url"
            placeholder="https://www.allrecipes.com/recipe/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleImport()}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-lg"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!url || isLoading}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Importing Recipe...
              </span>
            ) : (
              'Import Recipe'
            )}
          </button>
        </div>

        {/* Supported Sites */}
        <div className="mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <h3 className="font-medium mb-2">✅ Works Best With:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
            <div>• AllRecipes.com</div>
            <div>• Food Network</div>
            <div>• BBC Good Food</div>
            <div>• NYT Cooking</div>
            <div>• Serious Eats</div>
            <div>• Bon Appétit</div>
            <div>• Epicurious</div>
            <div>• Tasty</div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Many other recipe websites also supported!
          </p>
        </div>

        {/* Tips */}
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h3 className="font-medium mb-2">💡 Tips:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Copy the full URL from your browser</li>
            <li>• Works with most popular recipe websites</li>
            <li>• Recipe data is extracted automatically</li>
            <li>• You'll preview before saving</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔄 UNIFIED IMPORT HUB

### Import Selection Page

```typescript
// app/recipes/import/page.tsx (ENHANCED)

'use client';

import { useRouter } from 'next/navigation';

export default function RecipeImportHub() {
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Import Recipes</h1>
        <p className="text-gray-400 text-lg">
          Choose how you'd like to add recipes to JiGR
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Sheets Import */}
        <ImportCard
          icon="📊"
          title="Import from Google Sheets"
          description="Bulk import 50+ recipes from your spreadsheet"
          badge="FASTEST"
          badgeColor="bg-green-500"
          onClick={() => router.push('/recipes/import/google')}
        />

        {/* Photo OCR Import */}
        <ImportCard
          icon="📸"
          title="Photograph Recipe"
          description="Scan from cookbook, magazine, or handwritten note"
          badge="NEW"
          badgeColor="bg-blue-500"
          onClick={() => router.push('/recipes/import/photo')}
        />

        {/* Website URL Import */}
        <ImportCard
          icon="🌐"
          title="Import from Website"
          description="Copy recipe from AllRecipes, BBC Food, and more"
          badge="EASY"
          badgeColor="bg-purple-500"
          onClick={() => router.push('/recipes/import/url')}
        />

        {/* Manual Entry */}
        <ImportCard
          icon="✏️"
          title="Create Manually"
          description="Enter recipe details by hand"
          badge=""
          badgeColor=""
          onClick={() => router.push('/recipes/new')}
        />
      </div>

      {/* Copyright Notice */}
      <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <h3 className="font-medium mb-2 flex items-center gap-2">
          ⚖️ Copyright & Usage Notice
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          Only import recipes for personal or business use in your restaurant. 
          Do not redistribute copyrighted recipes. Respect original recipe creators. 
          When importing from websites or publications, recipes are for your internal 
          kitchen use only.
        </p>
      </div>
    </div>
  );
}

// Import Card Component
function ImportCard({
  icon,
  title,
  description,
  badge,
  badgeColor,
  onClick
}: {
  icon: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-panel p-6 text-left hover:scale-105 transition-transform duration-200 relative"
    >
      {badge && (
        <span className={`absolute top-4 right-4 px-2 py-1 text-xs font-bold rounded ${badgeColor} text-white`}>
          {badge}
        </span>
      )}
      
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
      
      <div className="mt-4 flex items-center text-blue-400 font-medium">
        Get Started
        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
```

---

## 🔗 INGREDIENT FUZZY MATCHING

### Core Matching Logic

```typescript
// lib/recipe-import/ingredient-matcher.ts (NEW FILE)

import { createServerClient } from '@/lib/supabase/server';

export async function matchIngredientsToInventory(
  ingredients: any[],
  clientId: string
) {
  const supabase = createServerClient();
  
  // Fetch all inventory items for this client
  const { data: inventoryItems } = await supabase
    .from('inventory_items')
    .select('id, item_name, brand, category_name')
    .eq('client_id', clientId);
  
  if (!inventoryItems) {
    return ingredients.map(ing => ({
      ...ing,
      inventory_item_id: null,
      match_confidence: 0,
      suggestions: []
    }));
  }
  
  // Match each ingredient
  return ingredients.map(ingredient => {
    const matches = findBestMatches(ingredient.ingredient, inventoryItems);
    
    return {
      ...ingredient,
      inventory_item_id: matches[0]?.id || null,
      match_confidence: matches[0]?.confidence || 0,
      suggestions: matches.slice(0, 5) // Top 5 suggestions
    };
  });
}

function findBestMatches(ingredientName: string, inventoryItems: any[]) {
  const normalized = normalizeIngredientName(ingredientName);
  
  const scored = inventoryItems.map(item => {
    const itemName = normalizeIngredientName(item.item_name);
    const score = calculateSimilarity(normalized, itemName);
    
    return {
      id: item.id,
      item_name: item.item_name,
      brand: item.brand,
      category_name: item.category_name,
      confidence: score
    };
  });
  
  // Sort by confidence, return top matches
  return scored
    .filter(s => s.confidence > 0.3) // Threshold
    .sort((a, b) => b.confidence - a.confidence);
}

function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove common qualifiers
    .replace(/\b(fresh|frozen|canned|dried|chopped|diced|sliced|minced)\b/g, '')
    // Remove punctuation
    .replace(/[^\w\s]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
  // Exact match
  if (str1 === str2) return 1.0;
  
  // Contains match
  if (str1.includes(str2) || str2.includes(str1)) {
    return 0.9;
  }
  
  // Levenshtein distance
  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  const similarity = 1 - distance / maxLen;
  
  // Boost score for common root words
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  const commonWords = words1.filter(w => words2.includes(w)).length;
  const wordBoost = commonWords * 0.1;
  
  return Math.min(similarity + wordBoost, 1.0);
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}
```

---

## 🎨 SHARED PREVIEW COMPONENT

```typescript
// app/recipes/import/preview/page.tsx (NEW FILE)

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RecipeImportPreview() {
  const router = useRouter();
  const [previewData, setPreviewData] = useState<any>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load preview data from sessionStorage
    const data = sessionStorage.getItem('recipe_import_preview');
    if (data) {
      const parsed = JSON.parse(data);
      setPreviewData(parsed);
      setIngredients(parsed.parsed.ingredients || []);
    } else {
      // No preview data, redirect back
      router.push('/recipes/import');
    }
  }, [router]);

  const handleIngredientMatchChange = (index: number, inventoryItemId: string) => {
    const updated = [...ingredients];
    updated[index].inventory_item_id = inventoryItemId;
    setIngredients(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Save recipe to database
      const response = await fetch('/api/recipes/import/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: previewData.session_id,
          recipe: previewData.parsed,
          ingredients: ingredients
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save recipe');
      }
      
      const result = await response.json();
      
      // Clear session storage
      sessionStorage.removeItem('recipe_import_preview');
      
      // Navigate to recipe detail
      router.push(`/recipes/${result.recipe_id}`);
      
    } catch (error) {
      alert('Failed to save recipe');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!previewData) {
    return <div>Loading...</div>;
  }

  const recipe = previewData.parsed;
  const warnings = previewData.warnings || [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="glass-panel p-8">
        <h1 className="text-3xl font-bold mb-2">Review Imported Recipe</h1>
        <p className="text-gray-400 mb-6">
          Verify the extracted data before saving
        </p>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg">
            <h3 className="font-medium mb-2">⚠️ Please Review:</h3>
            <ul className="text-sm text-yellow-200 space-y-1">
              {warnings.map((warning: string, i: number) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Recipe Details */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2">Recipe Name</label>
            <input
              type="text"
              value={recipe.recipe_name}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Servings</label>
            <input
              type="number"
              value={recipe.servings}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            />
          </div>
        </div>

        {/* Ingredients with Matching */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Ingredients</h2>
          <div className="space-y-3">
            {ingredients.map((ing, index) => (
              <div
                key={index}
                className="grid grid-cols-3 gap-4 p-4 bg-gray-800/50 rounded-lg"
              >
                <div>
                  <p className="text-sm text-gray-400">Recipe Calls For:</p>
                  <p className="font-medium">
                    {ing.quantity} {ing.unit} {ing.ingredient}
                  </p>
                  {ing.confidence < 0.8 && (
                    <span className="text-xs text-yellow-500">
                      Low confidence
                    </span>
                  )}
                </div>
                
                <div className="col-span-2">
                  <p className="text-sm text-gray-400 mb-2">
                    Match to Inventory Item:
                  </p>
                  <select
                    value={ing.inventory_item_id || ''}
                    onChange={(e) =>
                      handleIngredientMatchChange(index, e.target.value)
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  >
                    <option value="">-- Select Item --</option>
                    {ing.suggestions?.map((sug: any) => (
                      <option key={sug.id} value={sug.id}>
                        {sug.item_name} ({(sug.confidence * 100).toFixed(0)}%
                        match)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Instructions</h2>
          <ol className="space-y-2">
            {recipe.instructions?.map((step: string, i: number) => (
              <li key={i} className="flex gap-3">
                <span className="text-blue-400 font-bold">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Source Info */}
        {recipe.source && (
          <div className="mb-8 p-4 bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-400">Source:</p>
            <p className="font-medium">{recipe.source}</p>
            {recipe.source_url && (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 text-sm hover:underline"
              >
                {recipe.source_url}
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {isSaving ? 'Saving Recipe...' : 'Save Recipe'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Photo OCR (Week 1)

**Day 1: Setup**
```bash
□ Enable Document AI processor for recipes
□ Run database migration 032
□ Test OAuth credentials
□ Verify Supabase storage bucket
```

**Day 2-3: Backend**
```bash
□ Create /api/recipes/import/photo endpoint
□ Implement processRecipeImage() function
□ Create AI recipe parser
□ Test with sample photos
```

**Day 4-5: Frontend**
```bash
□ Create photo upload UI
□ Implement camera capture for iPad
□ Build preview component
□ Test end-to-end flow
```

---

### Phase 2: Website URL (Week 2)

**Day 1-2: Scrapers**
```bash
□ Create schema.org parser
□ Implement AI fallback parser
□ Test with 20+ recipe websites
□ Handle edge cases
```

**Day 3: API**
```bash
□ Create /api/recipes/import/url endpoint
□ Integrate scrapers
□ Test error handling
```

**Day 4-5: Frontend**
```bash
□ Create URL input UI
□ Test with various websites
□ Polish UX
```

---

### Phase 3: Integration (Week 3)

**Day 1-2: Fuzzy Matching**
```bash
□ Implement ingredient matcher
□ Build suggestions UI
□ Test matching accuracy
□ Add manual override
```

**Day 3-4: Preview & Save**
```bash
□ Create unified preview component
□ Implement save endpoint
□ Test cost calculations
□ Verify database writes
```

**Day 5: Testing**
```bash
□ End-to-end testing all methods
□ iPad Air compatibility check
□ Performance optimization
□ Bug fixes
```

---

## 🎯 SUCCESS METRICS

### Technical Metrics:
- ✅ Photo OCR accuracy > 85%
- ✅ Website scraping success rate > 90%
- ✅ Ingredient matching accuracy > 80%
- ✅ Import speed < 30 seconds per recipe
- ✅ iPad Air performance stable

### Business Metrics:
- ✅ 40× faster onboarding (20 hrs → 30 min)
- ✅ 90%+ user completion rate
- ✅ <5% support tickets for imports
- ✅ Competitive differentiator established

---

## 🚀 LAUNCH PLAN

### Week 1: Soft Launch
- Release to 5 beta clients
- Gather feedback
- Monitor error rates
- Quick iterations

### Week 2: Feature Polish
- Fix reported bugs
- Improve AI accuracy
- Enhance UX based on feedback
- Add missing edge cases

### Week 3: Production Launch
- Deploy to all clients
- Marketing announcement
- Documentation update
- Monitor scaling

---

**Ready to revolutionize recipe onboarding! 🎉📸🌐**
