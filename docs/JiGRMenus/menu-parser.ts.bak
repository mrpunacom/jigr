// lib/menu-import/menu-parser.ts
// AI-powered menu data extraction using Claude API

export interface ParsedMenuItem {
  item_name: string;
  category: string | null;
  price: number;
  description: string | null;
  target_food_cost_pct: number | null;
  confidence: number;
}

export interface ParsedMenuData {
  items: ParsedMenuItem[];
  detected_categories: string[];
  currency: string;
  total_items: number;
}

/**
 * Parse menu data from raw text using Claude AI
 * Supports various formats: spreadsheets, websites, PDFs
 */
export async function parseMenuData(
  rawText: string,
  source: 'google_sheets' | 'website_html' | 'manual'
): Promise<ParsedMenuData> {
  const prompt = buildMenuParsingPrompt(rawText, source);
  
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
    
    // Validate and normalize
    return validateParsedData(parsed);
    
  } catch (error) {
    console.error('Menu parsing error:', error);
    throw new Error('Failed to parse menu data with AI');
  }
}

/**
 * Build AI prompt based on source type
 */
function buildMenuParsingPrompt(rawText: string, source: string): string {
  return `
You are a restaurant menu pricing expert. Extract structured menu data from the following ${source} content.

SOURCE TYPE: ${source}

RAW TEXT:
${rawText}

INSTRUCTIONS:
1. Extract ALL menu items with their prices
2. Detect categories (Appetizers, Salads, Entrees, Desserts, Beverages, etc.)
3. Parse selling prices (handle various formats: $12, 12.00, "twelve dollars")
4. Extract descriptions if present
5. Detect target food cost % if mentioned (e.g., "28% target", "30% food cost")
6. Ignore non-menu content (hours, address, policies, etc.)

PRICE PARSING RULES:
- "$12" or "12.00" = 12.00
- "12" (if in price column) = 12.00
- "$12.50" = 12.50
- Handle multiple currencies (USD, NZD, etc.)

CATEGORY DETECTION:
- Look for section headers (APPETIZERS, SALADS, ENTREES, etc.)
- Infer from context if not explicit
- Use "Uncategorized" if truly unclear

CONFIDENCE SCORING:
- 0.95+: Clear structured data with explicit prices
- 0.80-0.94: Good structure, minor ambiguity
- 0.60-0.79: Requires inference, some unclear elements
- <0.60: Low confidence, flag for review

OUTPUT FORMAT (CRITICAL - JSON ONLY, NO MARKDOWN):
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

IMPORTANT:
- Output ONLY the JSON object
- Do not include markdown code blocks
- Ensure all JSON is valid
- Set confidence scores honestly
- If no prices found, return empty items array
`;
}

/**
 * Validate and normalize parsed data
 */
function validateParsedData(parsed: any): ParsedMenuData {
  if (!parsed || !Array.isArray(parsed.items)) {
    throw new Error('Invalid parsed data structure');
  }
  
  // Normalize items
  const items = parsed.items.map((item: any) => ({
    item_name: item.item_name || item.name || 'Unnamed Item',
    category: item.category || null,
    price: parseFloat(item.price) || 0,
    description: item.description || null,
    target_food_cost_pct: item.target_food_cost_pct 
      ? parseFloat(item.target_food_cost_pct) 
      : null,
    confidence: Math.min(Math.max(parseFloat(item.confidence) || 0.5, 0), 1)
  }));
  
  // Filter out items with no price
  const validItems = items.filter((item: ParsedMenuItem) => item.price > 0);
  
  return {
    items: validItems,
    detected_categories: parsed.detected_categories || [],
    currency: parsed.currency || 'USD',
    total_items: validItems.length
  };
}

/**
 * Parse menu from Google Sheets format (tab-separated values)
 * Optimized for spreadsheet data structure
 */
export async function parseMenuFromSpreadsheet(
  rows: string[][]
): Promise<ParsedMenuData> {
  // Convert rows to text format
  const rawText = rows.map(row => row.join('\t')).join('\n');
  
  return parseMenuData(rawText, 'google_sheets');
}

/**
 * Quick validation of menu data quality
 */
export function validateMenuDataQuality(data: ParsedMenuData): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  if (data.items.length === 0) {
    return {
      isValid: false,
      warnings: ['No menu items found in data']
    };
  }
  
  // Check for low confidence items
  const lowConfidenceCount = data.items.filter(
    item => item.confidence < 0.7
  ).length;
  
  if (lowConfidenceCount > 0) {
    warnings.push(
      `${lowConfidenceCount} item(s) have low confidence - please review`
    );
  }
  
  // Check for missing categories
  const uncategorizedCount = data.items.filter(
    item => !item.category
  ).length;
  
  if (uncategorizedCount > 0) {
    warnings.push(
      `${uncategorizedCount} item(s) have no category assigned`
    );
  }
  
  // Check for suspicious prices
  const suspiciouslyLowCount = data.items.filter(
    item => item.price < 5
  ).length;
  
  const suspiciouslyHighCount = data.items.filter(
    item => item.price > 100
  ).length;
  
  if (suspiciouslyLowCount > 0) {
    warnings.push(
      `${suspiciouslyLowCount} item(s) have unusually low prices (< $5)`
    );
  }
  
  if (suspiciouslyHighCount > 0) {
    warnings.push(
      `${suspiciouslyHighCount} item(s) have unusually high prices (> $100)`
    );
  }
  
  return {
    isValid: true,
    warnings
  };
}
