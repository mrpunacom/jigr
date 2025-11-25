/**
 * Fuzzy Ingredient Matching
 * 
 * Matches recipe ingredients to existing inventory items using
 * string similarity algorithms and hospitality-specific normalization.
 */

export interface InventoryItem {
  id: string;
  item_name: string;
  brand?: string;
  category_name?: string;
}

export interface IngredientMatch {
  id: string;
  item_name: string;
  brand?: string;
  category_name?: string;
  confidence: number;
  match_reason: string;
}

export interface MatchedIngredient {
  quantity: string;
  unit: string;
  ingredient: string;
  preparation?: string;
  confidence: number;
  inventory_item_id?: string;
  match_confidence: number;
  suggestions: IngredientMatch[];
}

/**
 * Match recipe ingredients to inventory items
 */
export async function matchIngredientsToInventory(
  ingredients: any[],
  inventoryItems: InventoryItem[]
): Promise<MatchedIngredient[]> {
  
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

/**
 * Find best matching inventory items for an ingredient
 */
function findBestMatches(ingredientName: string, inventoryItems: InventoryItem[]): IngredientMatch[] {
  const normalized = normalizeIngredientName(ingredientName);
  
  const scored = inventoryItems.map(item => {
    const itemName = normalizeIngredientName(item.item_name);
    const score = calculateSimilarity(normalized, itemName);
    const reason = getMatchReason(normalized, itemName, score);
    
    return {
      id: item.id,
      item_name: item.item_name,
      brand: item.brand,
      category_name: item.category_name,
      confidence: score,
      match_reason: reason
    };
  });
  
  // Sort by confidence, return matches above threshold
  return scored
    .filter(s => s.confidence > 0.3) // Minimum threshold
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Normalize ingredient name for comparison
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove common cooking qualifiers
    .replace(/\b(fresh|frozen|canned|dried|chopped|diced|sliced|minced|grated|shredded|whole|ground|crushed|finely|coarsely|roughly)\b/g, '')
    // Remove size qualifiers
    .replace(/\b(large|medium|small|extra|jumbo|baby)\b/g, '')
    // Remove cooking state qualifiers
    .replace(/\b(raw|cooked|boiled|steamed|roasted|grilled|fried)\b/g, '')
    // Remove brand-specific terms
    .replace(/\b(organic|free-range|cage-free|grass-fed|wild-caught)\b/g, '')
    // Remove punctuation and extra spaces
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity between two normalized ingredient names
 */
function calculateSimilarity(ingredient1: string, ingredient2: string): number {
  // Exact match
  if (ingredient1 === ingredient2) {
    return 1.0;
  }
  
  // Substring match (high confidence)
  if (ingredient1.includes(ingredient2) || ingredient2.includes(ingredient1)) {
    return 0.95;
  }
  
  // Word-level matching
  const words1 = ingredient1.split(' ').filter(w => w.length > 2);
  const words2 = ingredient2.split(' ').filter(w => w.length > 2);
  
  // Check for exact word matches
  const commonWords = words1.filter(w => words2.includes(w));
  if (commonWords.length > 0) {
    const wordMatchRatio = commonWords.length / Math.max(words1.length, words2.length);
    return 0.85 + (wordMatchRatio * 0.1); // 0.85-0.95 range
  }
  
  // Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(ingredient1, ingredient2);
  const maxLen = Math.max(ingredient1.length, ingredient2.length);
  const similarity = 1 - (distance / maxLen);
  
  // Apply hospitality-specific boost for common ingredient variations
  const boostedSimilarity = applyHospitalityBoosts(ingredient1, ingredient2, similarity);
  
  return Math.min(boostedSimilarity, 1.0);
}

/**
 * Apply hospitality industry-specific similarity boosts
 */
function applyHospitalityBoosts(ingredient1: string, ingredient2: string, baseSimilarity: number): number {
  const pairs = [
    // Common ingredient variations
    ['tomato', 'tomatoes'],
    ['onion', 'onions'],
    ['potato', 'potatoes'],
    ['carrot', 'carrots'],
    ['bell pepper', 'pepper'],
    ['chicken breast', 'chicken'],
    ['ground beef', 'beef'],
    ['heavy cream', 'cream'],
    ['butter', 'unsalted butter'],
    ['olive oil', 'extra virgin olive oil'],
    ['all purpose flour', 'flour'],
    ['kosher salt', 'salt'],
    ['black pepper', 'pepper'],
    ['garlic clove', 'garlic'],
    ['roma tomato', 'tomato'],
    ['yellow onion', 'onion'],
    ['russet potato', 'potato'],
    
    // Protein variations
    ['salmon fillet', 'salmon'],
    ['pork chop', 'pork'],
    ['lamb chop', 'lamb'],
    ['shrimp', 'prawns'],
    ['scallop', 'sea scallop'],
    
    // Dairy variations
    ['whole milk', 'milk'],
    ['skim milk', 'milk'],
    ['cheddar cheese', 'cheese'],
    ['mozzarella cheese', 'mozzarella'],
    ['parmesan cheese', 'parmesan'],
    
    // Herb and spice variations
    ['fresh basil', 'basil'],
    ['dried oregano', 'oregano'],
    ['fresh thyme', 'thyme'],
    ['ground cumin', 'cumin'],
    ['smoked paprika', 'paprika']
  ];
  
  for (const [variant1, variant2] of pairs) {
    if ((ingredient1.includes(variant1) && ingredient2.includes(variant2)) ||
        (ingredient1.includes(variant2) && ingredient2.includes(variant1))) {
      return Math.min(baseSimilarity + 0.2, 1.0);
    }
  }
  
  return baseSimilarity;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Get human-readable explanation for match confidence
 */
function getMatchReason(ingredient1: string, ingredient2: string, confidence: number): string {
  if (confidence === 1.0) {
    return 'Exact match';
  } else if (confidence >= 0.95) {
    return 'Contains match';
  } else if (confidence >= 0.85) {
    return 'Word match';
  } else if (confidence >= 0.7) {
    return 'Similar name';
  } else if (confidence >= 0.5) {
    return 'Possible match';
  } else {
    return 'Weak match';
  }
}

/**
 * Generate mock inventory items for testing
 */
export function getMockInventoryItems(): InventoryItem[] {
  return [
    // Proteins
    { id: '1', item_name: 'Chicken Breast, Boneless', category_name: 'Poultry' },
    { id: '2', item_name: 'Ground Beef, 80/20', category_name: 'Meat' },
    { id: '3', item_name: 'Salmon Fillet, Fresh', category_name: 'Seafood' },
    { id: '4', item_name: 'Shrimp, Large, Peeled', category_name: 'Seafood' },
    
    // Vegetables
    { id: '5', item_name: 'Tomatoes, Roma', category_name: 'Vegetables', brand: 'Local Farm' },
    { id: '6', item_name: 'Onions, Yellow', category_name: 'Vegetables' },
    { id: '7', item_name: 'Bell Peppers, Red', category_name: 'Vegetables' },
    { id: '8', item_name: 'Carrots, Organic', category_name: 'Vegetables' },
    { id: '9', item_name: 'Potatoes, Russet', category_name: 'Vegetables' },
    { id: '10', item_name: 'Garlic, Fresh', category_name: 'Vegetables' },
    
    // Dairy
    { id: '11', item_name: 'Butter, Unsalted', category_name: 'Dairy', brand: 'Land O Lakes' },
    { id: '12', item_name: 'Heavy Cream', category_name: 'Dairy' },
    { id: '13', item_name: 'Milk, Whole', category_name: 'Dairy' },
    { id: '14', item_name: 'Cheese, Cheddar, Sharp', category_name: 'Dairy' },
    { id: '15', item_name: 'Parmesan Cheese, Grated', category_name: 'Dairy' },
    
    // Pantry
    { id: '16', item_name: 'All-Purpose Flour', category_name: 'Baking' },
    { id: '17', item_name: 'Sugar, White Granulated', category_name: 'Baking' },
    { id: '18', item_name: 'Brown Sugar, Light', category_name: 'Baking' },
    { id: '19', item_name: 'Olive Oil, Extra Virgin', category_name: 'Oils' },
    { id: '20', item_name: 'Salt, Kosher', category_name: 'Seasonings' },
    { id: '21', item_name: 'Black Pepper, Ground', category_name: 'Seasonings' },
    { id: '22', item_name: 'Vanilla Extract, Pure', category_name: 'Extracts' },
    
    // Herbs & Spices
    { id: '23', item_name: 'Basil, Fresh', category_name: 'Herbs' },
    { id: '24', item_name: 'Oregano, Dried', category_name: 'Spices' },
    { id: '25', item_name: 'Thyme, Fresh', category_name: 'Herbs' },
    { id: '26', item_name: 'Paprika, Smoked', category_name: 'Spices' },
    
    // Baking
    { id: '27', item_name: 'Chocolate Chips, Semi-Sweet', category_name: 'Baking' },
    { id: '28', item_name: 'Baking Soda', category_name: 'Baking' },
    { id: '29', item_name: 'Baking Powder', category_name: 'Baking' },
    { id: '30', item_name: 'Eggs, Large Grade A', category_name: 'Dairy' }
  ];
}

/**
 * Test fuzzy matching with common ingredient variations
 */
export function testIngredientMatching(): void {
  const mockInventory = getMockInventoryItems();
  const testIngredients = [
    'chicken',
    'ground beef',
    'tomato',
    'onions',
    'heavy cream',
    'flour',
    'chocolate chips',
    'fresh basil',
    'kosher salt',
    'tomatoe', // misspelling
    'chicken breast',
    'romaine lettuce' // not in inventory
  ];
  
  console.log('=== Ingredient Matching Test ===');
  
  testIngredients.forEach(ingredient => {
    const matches = findBestMatches(ingredient, mockInventory);
    console.log(`\nIngredient: "${ingredient}"`);
    
    if (matches.length > 0) {
      matches.slice(0, 3).forEach((match, index) => {
        console.log(`  ${index + 1}. ${match.item_name} (${(match.confidence * 100).toFixed(1)}% - ${match.match_reason})`);
      });
    } else {
      console.log('  No matches found');
    }
  });
}