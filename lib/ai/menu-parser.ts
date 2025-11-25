/**
 * AI Menu Parser
 * 
 * Parses raw spreadsheet data into structured menu items using Claude AI.
 * Handles various menu formats and provides validation feedback.
 */

export interface RawMenuData {
  rows: string[][];
  source?: {
    spreadsheetId: string;
    sheetName: string;
  };
}

export interface ParsedMenuItem {
  item_name: string;
  category?: string;
  price: number;
  target_food_cost_pct?: number;
  description?: string;
  confidence: number;
  raw_data?: string;
}

export interface MenuParseResult {
  items: ParsedMenuItem[];
  total_detected: number;
  parse_confidence: number;
  warnings: string[];
  errors: string[];
}

/**
 * Parse raw spreadsheet data into menu items using AI
 */
export async function parseMenuData(data: RawMenuData): Promise<MenuParseResult> {
  try {
    // Convert rows to text for AI analysis
    const rawText = data.rows
      .map(row => row.join('\t'))
      .join('\n')
      .trim();

    if (!rawText) {
      throw new Error('No data provided for parsing');
    }

    // Call Claude AI to parse menu data
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
          content: generateMenuParsingPrompt(rawText)
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const result = await response.json();
    const content = result.content[0]?.text;
    
    if (!content) {
      throw new Error('No content received from AI');
    }

    // Parse AI response
    const parsed = parseAIResponse(content);
    
    // Validate and enhance parsed items
    const processedItems = await processMenuItems(parsed.items);
    
    return {
      items: processedItems,
      total_detected: processedItems.length,
      parse_confidence: calculateOverallConfidence(processedItems),
      warnings: parsed.warnings || [],
      errors: parsed.errors || []
    };

  } catch (error) {
    console.error('Menu parsing error:', error);
    throw new Error(`Failed to parse menu data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate AI prompt for menu parsing
 */
function generateMenuParsingPrompt(rawText: string): string {
  return `Parse this restaurant menu pricing data into structured JSON.

Raw spreadsheet data:
${rawText}

Your task:
1. Identify the column headers automatically (item name, price, category, etc.)
2. Extract menu items with their details
3. Handle various price formats ($12.00, 12, $12, etc.)
4. Infer categories from section headers if not in explicit columns
5. Assign confidence scores based on data quality
6. Include any descriptions or notes found

Rules:
- Skip header rows and empty rows
- Convert all prices to decimal numbers (remove $, commas)
- Normalize item names (proper capitalization)
- Detect section headers as category indicators
- Flag items with missing or invalid prices
- Assign confidence: 1.0 = perfect, 0.8+ = good, 0.6+ = acceptable, <0.6 = review needed

Output valid JSON only in this exact format:
{
  "items": [
    {
      "item_name": "Caesar Salad",
      "category": "Salads",
      "price": 14.00,
      "target_food_cost_pct": 28,
      "description": "Fresh romaine lettuce with parmesan and croutons",
      "confidence": 0.95,
      "raw_data": "Caesar Salad | $14.00 | Salads"
    }
  ],
  "warnings": ["Any parsing warnings"],
  "errors": ["Any parsing errors"]
}

Important:
- Return valid JSON only, no markdown formatting
- Include all detected menu items
- Set confidence < 0.6 for questionable items
- Include raw_data field showing original spreadsheet content for each item
- Add warnings for unusual prices, missing data, or parsing issues`;
}

/**
 * Parse AI response into structured data
 */
function parseAIResponse(content: string): any {
  try {
    // Remove markdown code blocks if present
    const cleaned = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    return JSON.parse(cleaned);
  } catch (error) {
    // Try to extract JSON from response if it's wrapped in text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        // If that fails too, throw original error
      }
    }
    
    throw new Error('Failed to parse AI response as JSON');
  }
}

/**
 * Process and validate parsed menu items
 */
async function processMenuItems(items: any[]): Promise<ParsedMenuItem[]> {
  return items.map(item => ({
    item_name: normalizeItemName(item.item_name || ''),
    category: normalizeCategory(item.category),
    price: parsePrice(item.price),
    target_food_cost_pct: parsePercentage(item.target_food_cost_pct),
    description: item.description?.trim() || undefined,
    confidence: Math.max(0, Math.min(1, parseFloat(item.confidence) || 0)),
    raw_data: item.raw_data || undefined
  }));
}

/**
 * Normalize menu item name
 */
function normalizeItemName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    // Capitalize first letter of each word
    .replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
    // Handle common abbreviations
    .replace(/\bBbq\b/g, 'BBQ')
    .replace(/\bDiy\b/g, 'DIY')
    .replace(/\bNy\b/g, 'NY')
    .replace(/\bLa\b/g, 'LA');
}

/**
 * Normalize category name
 */
function normalizeCategory(category?: string): string | undefined {
  if (!category || typeof category !== 'string') {
    return undefined;
  }

  const normalized = category
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );

  // Map common category variations
  const categoryMap: { [key: string]: string } = {
    'Appetizer': 'Appetizers',
    'App': 'Appetizers',
    'Starter': 'Appetizers',
    'Entree': 'Entrees',
    'Main': 'Entrees',
    'Main Course': 'Entrees',
    'Side': 'Sides',
    'Side Dish': 'Sides',
    'Dessert': 'Desserts',
    'Sweet': 'Desserts',
    'Beverage': 'Beverages',
    'Drink': 'Beverages',
    'Wine': 'Wine & Spirits',
    'Beer': 'Beer',
    'Cocktail': 'Cocktails',
    'Soup': 'Soups',
    'Salad': 'Salads'
  };

  return categoryMap[normalized] || normalized;
}

/**
 * Parse price string into number
 */
function parsePrice(price: any): number {
  if (typeof price === 'number') {
    return Math.max(0, price);
  }
  
  if (typeof price === 'string') {
    // Remove currency symbols, commas, and spaces
    const cleaned = price
      .replace(/[$£€¥₹,\s]/g, '')
      .replace(/[^\d.]/g, '');
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  }
  
  return 0;
}

/**
 * Parse percentage string into number
 */
function parsePercentage(percentage: any): number | undefined {
  if (typeof percentage === 'number') {
    return Math.max(0, Math.min(100, percentage));
  }
  
  if (typeof percentage === 'string') {
    const cleaned = percentage.replace(/[%\s]/g, '');
    const parsed = parseFloat(cleaned);
    
    if (isNaN(parsed)) {
      return undefined;
    }
    
    // Convert to percentage if it looks like a decimal (0.28 -> 28)
    if (parsed <= 1) {
      return Math.round(parsed * 100);
    }
    
    return Math.max(0, Math.min(100, parsed));
  }
  
  return undefined;
}

/**
 * Calculate overall confidence for the parse result
 */
function calculateOverallConfidence(items: ParsedMenuItem[]): number {
  if (items.length === 0) {
    return 0;
  }
  
  const totalConfidence = items.reduce((sum, item) => sum + item.confidence, 0);
  return totalConfidence / items.length;
}

/**
 * Detect menu format from raw data
 */
export function detectMenuFormat(rows: string[][]): {
  format: 'simple' | 'detailed' | 'pos_export' | 'menu_engineering' | 'unknown';
  confidence: number;
  detected_columns: string[];
  suggestions: string[];
} {
  if (rows.length === 0) {
    return {
      format: 'unknown',
      confidence: 0,
      detected_columns: [],
      suggestions: ['No data provided']
    };
  }

  // Analyze first few rows for column headers
  const headerRow = rows[0];
  const sampleRows = rows.slice(1, 4);
  
  const detectedColumns: string[] = [];
  const suggestions: string[] = [];
  
  // Look for common column patterns
  const columnPatterns = {
    name: /^(item|name|product|dish|menu)/i,
    price: /^(price|cost|amount|\$)/i,
    category: /^(category|type|section|group)/i,
    description: /^(desc|description|notes|details)/i,
    food_cost: /^(food.?cost|cost.?%|margin)/i
  };
  
  headerRow.forEach((header, index) => {
    for (const [type, pattern] of Object.entries(columnPatterns)) {
      if (pattern.test(header)) {
        detectedColumns.push(`${type}: column ${index + 1} (${header})`);
      }
    }
  });
  
  // Analyze data quality
  let priceDetected = false;
  let nameDetected = false;
  
  sampleRows.forEach(row => {
    row.forEach(cell => {
      // Check for price patterns
      if (/\$?\d+\.?\d*/.test(cell)) {
        priceDetected = true;
      }
      // Check for menu item names
      if (cell.length > 3 && /[a-zA-Z]/.test(cell)) {
        nameDetected = true;
      }
    });
  });
  
  // Determine format
  let format: 'simple' | 'detailed' | 'pos_export' | 'menu_engineering' | 'unknown' = 'unknown';
  let confidence = 0;
  
  if (detectedColumns.length >= 2 && priceDetected && nameDetected) {
    if (detectedColumns.some(col => col.includes('food_cost'))) {
      format = 'menu_engineering';
      confidence = 0.9;
    } else if (detectedColumns.length >= 4) {
      format = 'detailed';
      confidence = 0.85;
    } else if (headerRow.some(h => /pos|export|system/i.test(h))) {
      format = 'pos_export';
      confidence = 0.8;
    } else {
      format = 'simple';
      confidence = 0.7;
    }
  } else {
    suggestions.push('Consider adding clear column headers');
    suggestions.push('Ensure price and item name columns are present');
  }
  
  if (!priceDetected) {
    suggestions.push('No price data detected - check price column format');
  }
  
  if (!nameDetected) {
    suggestions.push('No menu item names detected - check item name column');
  }
  
  return {
    format,
    confidence,
    detected_columns: detectedColumns,
    suggestions
  };
}

/**
 * Generate mock menu data for testing
 */
export function getMockMenuData(): RawMenuData {
  return {
    rows: [
      ['Item Name', 'Category', 'Price', 'Target Cost %', 'Description'],
      ['Caesar Salad', 'Salads', '$14.00', '28', 'Fresh romaine lettuce with parmesan and croutons'],
      ['Margherita Pizza', 'Pizza', '$18.00', '25', 'Fresh mozzarella, tomato sauce, basil'],
      ['Fish & Chips', 'Mains', '$22.00', '32', 'Beer-battered cod with seasoned fries'],
      ['Chocolate Cake', 'Desserts', '$8.50', '22', 'Rich chocolate layer cake'],
      ['', '', '', '', ''], // Empty row to test skipping
      ['-- Beverages --', '', '', '', ''], // Section header
      ['Craft Beer', 'Beverages', '$7.00', '', 'Local IPA on tap'],
      ['House Wine', 'Beverages', '$9.00', '', 'Red or white by the glass']
    ],
    source: {
      spreadsheetId: 'mock-menu-data',
      sheetName: 'Restaurant Menu'
    }
  };
}

/**
 * Test menu parsing with various formats
 */
export async function testMenuParsing(): Promise<void> {
  console.log('=== Menu Parsing Test ===');
  
  const testData = getMockMenuData();
  
  try {
    // Test format detection
    const formatInfo = detectMenuFormat(testData.rows);
    console.log('Format Detection:');
    console.log(`  Format: ${formatInfo.format} (${formatInfo.confidence * 100}% confidence)`);
    console.log(`  Detected columns: ${formatInfo.detected_columns.join(', ')}`);
    
    // Note: Actual parsing test requires API key
    console.log('\nParsing test requires ANTHROPIC_API_KEY environment variable');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}