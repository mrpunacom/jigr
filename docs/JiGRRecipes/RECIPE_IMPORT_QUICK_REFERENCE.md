# Recipe Import Multi-Method - Claude Code Quick Reference

**Project:** JiGR Recipe Import Enhancement  
**Features:** Photo OCR + Website URL Parsing  
**Build Time:** 2-3 weeks  
**Difficulty:** Medium (Builds on existing Google Sheets infrastructure)

---

## ⚡ QUICK START

### Prerequisites (Already Done!)
✅ Google Cloud OAuth working (from STOCK import)  
✅ Google Sheets API integration  
✅ Claude API access configured  
✅ Supabase storage buckets  
✅ Document AI enabled for delivery dockets  

### New Requirements
- Document AI processor for recipes (15 min setup)
- Web scraping capability (built-in)
- Schema.org JSON-LD parser
- Fuzzy string matching algorithm

---

## 📋 IMPLEMENTATION PHASES

### PHASE 1: DATABASE (30 minutes)

```sql
-- Run migration: 032_recipe_import_enhancements.sql

ALTER TABLE Recipes 
ADD COLUMN import_method VARCHAR(50) DEFAULT 'manual',
ADD COLUMN source_url TEXT,
ADD COLUMN source_name VARCHAR(255),
ADD COLUMN original_image_url TEXT,
ADD COLUMN import_confidence DECIMAL(3,2),
ADD COLUMN import_notes TEXT,
ADD COLUMN raw_ocr_text TEXT;

CREATE TABLE recipe_import_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  import_method VARCHAR(50) NOT NULL,
  source_identifier TEXT,
  total_recipes INTEGER DEFAULT 0,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  session_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies...
```

---

### PHASE 2: PHOTO OCR (Week 1)

**File Structure:**
```
app/api/recipes/import/
├── photo/
│   └── route.ts                 # NEW - Photo upload endpoint
└── execute/
    └── route.ts                 # ENHANCE - Add recipe saving

app/recipes/import/
├── page.tsx                     # ENHANCE - Add photo card
├── photo/
│   └── page.tsx                 # NEW - Camera UI
└── preview/
    └── page.tsx                 # NEW - Preview & confirm

lib/
├── google-cloud/
│   └── document-ai.ts          # ENHANCE - Add recipe processor
├── ai/
│   └── recipe-parser.ts        # NEW - AI parsing logic
└── recipe-import/
    └── ingredient-matcher.ts    # NEW - Fuzzy matching
```

**API Endpoints:**

```typescript
POST /api/recipes/import/photo
// Body: { image: string (base64), source_name?: string }
// Returns: { parsed: Recipe, warnings: string[] }
```

**Key Functions:**

```typescript
// lib/google-cloud/document-ai.ts
export async function processRecipeImage(imageBase64: string) {
  // Extract text from photo using Document AI
  return { text: string, confidence: number }
}

// lib/ai/recipe-parser.ts
export async function parseRecipeText(rawText: string) {
  // Parse with Claude API
  return { recipe_name, servings, ingredients[], instructions[], ... }
}
```

---

### PHASE 3: WEBSITE URL (Week 2)

**File Structure:**
```
app/api/recipes/import/
└── url/
    └── route.ts                 # NEW - URL import endpoint

app/recipes/import/
└── url/
    └── page.tsx                 # NEW - URL input UI

lib/recipe-scrapers/
├── scraper.ts                   # NEW - Main scraper
├── schema-org-parser.ts         # NEW - Structured data parser
└── ai-html-parser.ts            # NEW - Fallback parser
```

**API Endpoints:**

```typescript
POST /api/recipes/import/url
// Body: { url: string }
// Returns: { parsed: Recipe, parse_method: string, warnings: string[] }
```

**Scraping Strategy:**
```
1. Fetch webpage HTML
2. Try schema.org JSON-LD extraction (70% success)
3. Fallback to AI HTML parsing (30% cases)
4. Return structured data
```

---

### PHASE 4: FUZZY MATCHING (Week 2)

**Purpose:** Link recipe ingredients to inventory items

```typescript
// lib/recipe-import/ingredient-matcher.ts

export async function matchIngredientsToInventory(
  ingredients: any[],
  clientId: string
) {
  // For each ingredient:
  // 1. Normalize text ("2 cups romaine" → "romaine")
  // 2. Compare to all inventory items
  // 3. Calculate Levenshtein distance
  // 4. Return top 5 matches with confidence scores
}
```

**Algorithm:**
- Exact match = 1.0 confidence
- Contains match = 0.9 confidence
- Levenshtein distance = scaled 0.0-0.8
- Common word boost = +0.1 per word

---

### PHASE 5: UNIFIED PREVIEW (Week 3)

**File Structure:**
```
app/recipes/import/
├── page.tsx                     # Hub with 4 import cards
└── preview/
    └── page.tsx                 # Shared preview component
```

**Preview Features:**
- ✅ Edit recipe name, servings
- ✅ Review ingredients with confidence scores
- ✅ Select inventory item matches (dropdown)
- ✅ Override low-confidence matches
- ✅ View instructions
- ✅ See source attribution
- ✅ Save to database

---

## 🛠️ MANUAL SETUP (Steve)

### Step 1: Configure Document AI Processor (15 min)

```bash
1. Go to: https://console.cloud.google.com/ai/document-ai
2. Click "Create Processor"
3. Select: "Document OCR"
4. Name: "JiGR Recipe OCR Processor"
5. Location: us (or your region)
6. Copy Processor ID

# Add to .env.local:
GOOGLE_DOCUMENT_AI_RECIPE_PROCESSOR_ID=your-processor-id
```

### Step 2: Create Storage Bucket (5 min)

```bash
# In Supabase Dashboard:
1. Go to Storage
2. Create new bucket: "recipe-imports"
3. Set to: Private
4. Enable RLS policies for user access
```

### Step 3: Verify APIs Enabled

```bash
# Already enabled from STOCK import:
✓ Document AI API
✓ Google Sheets API
✓ Google Drive API

# Nothing new needed!
```

---

## 🧪 TESTING PROTOCOL

### Photo OCR Tests:

```bash
□ Magazine recipe (glossy paper)
□ Cookbook page (matte paper)
□ Handwritten recipe card
□ Printed recipe (laser printer)
□ Low light photo
□ Angled/skewed photo
□ Multi-column layout
```

**Expected Results:**
- 85%+ accuracy on printed text
- 70%+ accuracy on handwriting
- Graceful degradation with warnings

---

### Website Scraping Tests:

```bash
□ AllRecipes.com
□ Food Network
□ BBC Good Food
□ NYT Cooking
□ Serious Eats
□ Bon Appétit
□ Personal food blog (no schema.org)
□ Paywalled recipe site
```

**Expected Results:**
- 90%+ success on major sites
- Fallback to AI parser when needed
- Clear warnings on low confidence

---

### Fuzzy Matching Tests:

```bash
□ "2 cups romaine" → "Romaine Lettuce, Fresh"
□ "1 lb ground beef" → "Ground Beef, 80/20"
□ "flour" → Multiple flour options
□ "chicken breast" → "Chicken Breast, Boneless"
□ Misspelling: "tomatoe" → "Tomato"
```

**Expected Results:**
- 80%+ automatic match rate
- Top 5 suggestions for uncertain matches
- Manual override always available

---

## 📱 IPAD AIR COMPATIBILITY

### Camera Access:
```html
<input 
  type="file" 
  accept="image/*" 
  capture="environment"  <!-- Uses back camera -->
/>
```

### Image Size Limits:
```typescript
// Max 10MB for iPad Air memory constraints
if (file.size > 10 * 1024 * 1024) {
  error = "Image too large";
}
```

### Performance:
- Resize images to 1920px max width before upload
- Use progressive loading indicators
- Show thumbnails during processing
- Cancel capability for long-running requests

---

## 🚨 ERROR HANDLING

### Common Errors & Solutions:

**1. OCR Failed**
```typescript
// Fallback: Let user type manually
// Error message: "Could not read text. Please enter manually."
```

**2. Website Blocked**
```typescript
// Some sites block scrapers
// Error message: "Cannot access this site. Try copying recipe manually."
```

**3. No Ingredients Detected**
```typescript
// AI couldn't parse
// Error message: "No ingredients found. Please review and add manually."
```

**4. Poor Image Quality**
```typescript
// Low OCR confidence (<0.5)
// Warning: "Low quality image. Please review all fields carefully."
```

---

## 💡 AI PROMPT OPTIMIZATION

### Recipe Parser Prompt Template:

```typescript
const RECIPE_PROMPT = `
You are a recipe data extraction expert.

INPUT TEXT:
${rawText}

EXTRACT:
1. Recipe name (required)
2. Serving size (e.g., "4 servings", "12 cookies")
3. Prep time, cook time (if mentioned)
4. Ingredients with:
   - Quantity (2, 1.5, 0.25)
   - Unit (cup, tablespoon, ounce, pound)
   - Ingredient name
   - Preparation method (diced, sifted)
5. Step-by-step instructions
6. Any notes/tips

RULES:
- Convert fractions to decimals (1/2 = 0.5)
- Standardize units (tbsp = tablespoon)
- Separate preparation from ingredient
- Assign confidence score (0.0-1.0)

OUTPUT: Valid JSON only, no markdown
`;
```

**Confidence Scoring:**
- Printed text + clear structure = 0.95+
- Printed text + unclear structure = 0.80-0.94
- Handwritten + legible = 0.70-0.85
- Handwritten + difficult = 0.50-0.69
- Unreadable = <0.50 (flag for review)

---

## 📊 SUCCESS METRICS

### Week 1 Targets:
- ✅ Photo OCR working end-to-end
- ✅ 85%+ OCR accuracy on printed text
- ✅ 70%+ accuracy on handwriting
- ✅ <30 seconds import time

### Week 2 Targets:
- ✅ Website scraping working
- ✅ 90%+ success rate on major sites
- ✅ Schema.org parsing functional
- ✅ AI fallback reliable

### Week 3 Targets:
- ✅ Fuzzy matching 80%+ accurate
- ✅ Preview UI polished
- ✅ End-to-end testing complete
- ✅ Ready for production

---

## 🎯 DEPLOYMENT CHECKLIST

```bash
□ Database migration applied
□ Environment variables set
□ Document AI processor created
□ Storage bucket configured
□ Photo OCR tested on device
□ Website scraping tested (20+ sites)
□ Fuzzy matching validated
□ iPad Air performance verified
□ Error handling tested
□ RLS policies working
□ Copyright notice displayed
□ Documentation updated
□ Beta test with 5 clients
□ Production deployment
```

---

## 🔗 RELATED DOCUMENTS

**Main Implementation Guide:**
- `/mnt/user-data/outputs/RECIPE_IMPORT_MULTI_METHOD_GUIDE.md`

**Google Sheets Integration:**
- `/mnt/project/1GOOGLE_SHEETS_CONVERSATION_BACKUP.md`

**Database Schema:**
- `/mnt/project/JiGR_Inventory_Recipe_Database_Schema.md`

**Stock Import:**
- Complete reference for patterns to reuse

---

## 💬 EXAMPLE CLAUDE CODE PROMPTS

**Starting Photo OCR:**
```
Using RECIPE_IMPORT_MULTI_METHOD_GUIDE.md, implement Phase 2:
Photo OCR backend (Day 1-2 tasks). Create the API endpoint and 
Google Document AI integration.
```

**Building Website Scraper:**
```
Following RECIPE_IMPORT_MULTI_METHOD_GUIDE.md Phase 3, create
the website scraping system with schema.org parser and AI fallback.
Test with AllRecipes.com and BBC Good Food.
```

**Fuzzy Matching:**
```
Implement the ingredient fuzzy matcher from Phase 4. Use Levenshtein
distance algorithm and return top 5 matches with confidence scores.
Include tests for common ingredients.
```

---

**Ready to build the most advanced recipe import system in hospitality tech! 🚀📸🌐**
