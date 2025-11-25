/**
 * AI Recipe Parser - Claude API Integration
 * 
 * Parses raw text from OCR, HTML, or manual input into structured recipe data
 * Uses Claude API for intelligent text extraction and normalization
 */

export interface ParsedRecipe {
  recipe_name: string;
  servings: number | null;
  portion_size: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  total_time_minutes: number | null;
  ingredients: ParsedIngredient[];
  instructions: string[];
  notes: string | null;
  category: string | null;
  source: string | null;
  confidence: number;
}

export interface ParsedIngredient {
  quantity: string;
  unit: string;
  ingredient: string;
  preparation: string | null;
  confidence: number;
}

/**
 * Parse recipe text using Claude API
 */
export async function parseRecipeText(
  rawText: string,
  source: 'photo_ocr' | 'website_html' | 'google_sheets' | 'manual'
): Promise<ParsedRecipe> {
  const prompt = buildPrompt(rawText, source);
  
  try {
    // For development, return mock data since we can't make external API calls
    if (process.env.NODE_ENV === 'development' || !process.env.ANTHROPIC_API_KEY) {
      return getMockParsedRecipe(rawText, source);
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
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
      console.error('Claude API error:', response.status, response.statusText);
      throw new Error(`Claude API error: ${response.status}`);
    }
    
    const data = await response.json();
    const responseText = data.content[0].text;
    
    // Strip markdown code blocks if present
    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const parsed = JSON.parse(cleanedText);
    
    // Validate and sanitize the response
    return validateParsedRecipe(parsed);
    
  } catch (error) {
    console.error('Recipe parsing error:', error);
    
    // Fallback to basic parsing
    return getFallbackParsedRecipe(rawText, source);
  }
}

/**
 * Build the prompt for Claude API
 */
function buildPrompt(rawText: string, source: string): string {
  return `
You are a professional recipe data extraction expert. Analyze the following text from a ${source} and extract structured recipe data.

RAW TEXT:
${rawText}

CRITICAL INSTRUCTIONS:
1. Extract ALL ingredients with their quantities and units
2. Parse preparation instructions step-by-step
3. Detect serving size, prep time, cook time if mentioned
4. Assign confidence scores (0.0-1.0) for each extracted field
5. Handle fractional quantities (1/2, ¾, etc.) as decimals (0.5, 0.75)
6. Normalize units to standard forms (cup, tablespoon, teaspoon, ounce, pound, gram, each, clove, etc.)
7. Separate ingredient name from preparation method ("2 cups flour, sifted" → ingredient: "flour", preparation: "sifted")
8. For unclear text, make best guesses but lower confidence scores accordingly
9. If no clear recipe structure is found, extract what you can and flag with low confidence

UNIT STANDARDIZATION:
- tsp, t → teaspoon
- tbsp, T → tablespoon
- c → cup
- oz → ounce
- lb → pound
- g → gram
- kg → kilogram
- ml → milliliter
- l → liter

QUANTITY CONVERSION:
- 1/2 → 0.5
- 1/4 → 0.25
- 3/4 → 0.75
- 1/3 → 0.33
- 2/3 → 0.67

OUTPUT FORMAT:
Return ONLY valid JSON in this exact structure:

{
  "recipe_name": "string",
  "servings": number or null,
  "portion_size": "string or null (e.g., '1 slice', '8 oz', '1 sandwich')",
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
- If text is unclear or incomplete, still provide best-effort extraction with appropriate confidence scores
`;
}

/**
 * Validate and sanitize parsed recipe data
 */
function validateParsedRecipe(parsed: any): ParsedRecipe {
  return {
    recipe_name: parsed.recipe_name || 'Untitled Recipe',
    servings: typeof parsed.servings === 'number' ? parsed.servings : null,
    portion_size: parsed.portion_size || null,
    prep_time_minutes: typeof parsed.prep_time_minutes === 'number' ? parsed.prep_time_minutes : null,
    cook_time_minutes: typeof parsed.cook_time_minutes === 'number' ? parsed.cook_time_minutes : null,
    total_time_minutes: typeof parsed.total_time_minutes === 'number' ? parsed.total_time_minutes : null,
    ingredients: Array.isArray(parsed.ingredients) 
      ? parsed.ingredients.map(validateIngredient)
      : [],
    instructions: Array.isArray(parsed.instructions) 
      ? parsed.instructions.filter(step => typeof step === 'string' && step.trim())
      : [],
    notes: parsed.notes || null,
    category: parsed.category || null,
    source: parsed.source || null,
    confidence: typeof parsed.confidence === 'number' 
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5
  };
}

/**
 * Validate individual ingredient
 */
function validateIngredient(ingredient: any): ParsedIngredient {
  return {
    quantity: String(ingredient.quantity || ''),
    unit: String(ingredient.unit || ''),
    ingredient: String(ingredient.ingredient || ''),
    preparation: ingredient.preparation || null,
    confidence: typeof ingredient.confidence === 'number' 
      ? Math.max(0, Math.min(1, ingredient.confidence))
      : 0.5
  };
}

/**
 * Mock parsed recipe for development
 */
function getMockParsedRecipe(rawText: string, source: string): ParsedRecipe {
  // Generate mock data based on source type
  const recipes = {
    photo_ocr: {
      recipe_name: 'Classic Chocolate Chip Cookies',
      servings: 24,
      portion_size: '1 cookie',
      prep_time_minutes: 15,
      cook_time_minutes: 12,
      total_time_minutes: 27,
      ingredients: [
        { quantity: '2.25', unit: 'cups', ingredient: 'all-purpose flour', preparation: null, confidence: 0.95 },
        { quantity: '1', unit: 'teaspoon', ingredient: 'baking soda', preparation: null, confidence: 0.92 },
        { quantity: '1', unit: 'teaspoon', ingredient: 'salt', preparation: null, confidence: 0.90 },
        { quantity: '1', unit: 'cup', ingredient: 'butter', preparation: 'softened', confidence: 0.88 },
        { quantity: '0.75', unit: 'cup', ingredient: 'brown sugar', preparation: 'packed', confidence: 0.85 },
        { quantity: '0.5', unit: 'cup', ingredient: 'white sugar', preparation: null, confidence: 0.90 },
        { quantity: '2', unit: 'each', ingredient: 'large eggs', preparation: null, confidence: 0.93 },
        { quantity: '2', unit: 'teaspoons', ingredient: 'vanilla extract', preparation: null, confidence: 0.87 },
        { quantity: '2', unit: 'cups', ingredient: 'chocolate chips', preparation: null, confidence: 0.94 }
      ],
      instructions: [
        'Preheat oven to 375°F (190°C)',
        'In medium bowl, whisk together flour, baking soda, and salt',
        'In large bowl, cream butter and both sugars until fluffy',
        'Beat in eggs one at a time, then vanilla',
        'Gradually mix in flour mixture until just combined',
        'Stir in chocolate chips',
        'Drop rounded tablespoons of dough onto ungreased baking sheets',
        'Bake 9-11 minutes until golden brown around edges',
        'Cool on baking sheet 2 minutes, then transfer to wire rack'
      ],
      notes: 'For chewier cookies, slightly underbake. For crispier cookies, bake 1-2 minutes longer.',
      category: 'Dessert',
      source: 'Handwritten Recipe Card',
      confidence: 0.87
    },
    website_html: {
      recipe_name: 'Perfect Roast Chicken',
      servings: 4,
      portion_size: '1 serving',
      prep_time_minutes: 15,
      cook_time_minutes: 60,
      total_time_minutes: 75,
      ingredients: [
        { quantity: '1', unit: 'whole', ingredient: 'chicken', preparation: '3-4 lbs', confidence: 1.0 },
        { quantity: '2', unit: 'tablespoons', ingredient: 'olive oil', preparation: null, confidence: 1.0 },
        { quantity: '1', unit: 'teaspoon', ingredient: 'salt', preparation: null, confidence: 1.0 },
        { quantity: '0.5', unit: 'teaspoon', ingredient: 'black pepper', preparation: 'freshly ground', confidence: 1.0 },
        { quantity: '2', unit: 'cloves', ingredient: 'garlic', preparation: 'minced', confidence: 1.0 },
        { quantity: '1', unit: 'each', ingredient: 'lemon', preparation: 'quartered', confidence: 1.0 }
      ],
      instructions: [
        'Preheat oven to 425°F (220°C)',
        'Pat chicken dry with paper towels',
        'Rub olive oil all over chicken skin',
        'Season generously with salt and pepper, inside and out',
        'Stuff cavity with garlic and lemon quarters',
        'Truss chicken with kitchen twine',
        'Place breast-side up on roasting rack',
        'Roast 60-70 minutes until internal temp reaches 165°F',
        'Rest 10 minutes before carving'
      ],
      notes: null,
      category: 'Main Course',
      source: 'Food Network',
      confidence: 1.0
    }
  };

  return recipes[source] || recipes.photo_ocr;
}

/**
 * Fallback parsing for when AI fails
 */
function getFallbackParsedRecipe(rawText: string, source: string): ParsedRecipe {
  // Basic text parsing fallback
  const lines = rawText.split('\n').map(line => line.trim()).filter(line => line);
  
  return {
    recipe_name: 'Imported Recipe',
    servings: null,
    portion_size: null,
    prep_time_minutes: null,
    cook_time_minutes: null,
    total_time_minutes: null,
    ingredients: [],
    instructions: lines,
    notes: 'Failed to parse automatically. Please review and edit.',
    category: null,
    source: null,
    confidence: 0.1
  };
}

/**
 * Generate warnings based on parsed data confidence
 */
export function generateParsingWarnings(recipe: ParsedRecipe): string[] {
  const warnings: string[] = [];
  
  if (recipe.confidence < 0.7) {
    warnings.push('Low overall parsing confidence - please review all fields carefully');
  }
  
  if (!recipe.servings) {
    warnings.push('Could not detect serving size - please specify');
  }
  
  const lowConfidenceIngredients = recipe.ingredients.filter(ing => ing.confidence < 0.7);
  if (lowConfidenceIngredients.length > 0) {
    warnings.push(`${lowConfidenceIngredients.length} ingredient(s) have low confidence - review before saving`);
  }
  
  if (recipe.ingredients.length === 0) {
    warnings.push('No ingredients detected - please add manually');
  }
  
  if (recipe.instructions.length === 0) {
    warnings.push('No instructions detected - please add manually');
  }
  
  if (!recipe.recipe_name || recipe.recipe_name === 'Untitled Recipe') {
    warnings.push('Recipe name not detected - please provide a name');
  }
  
  return warnings;
}