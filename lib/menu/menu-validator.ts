/**
 * Menu Item Validation Logic
 * 
 * Validates menu items for pricing, duplicates, and business rules.
 * Links menu items to existing recipes when possible.
 */

import { createClient } from '@supabase/supabase-js';

export interface MenuItemToValidate {
  item_name: string;
  category?: string;
  price: number;
  target_food_cost_pct?: number;
  description?: string;
  confidence: number;
  raw_data?: string;
}

export interface ValidationResult {
  item_name: string;
  category?: string;
  price: number;
  target_food_cost_pct?: number;
  description?: string;
  confidence: number;
  
  // Validation results
  validation_status: 'good' | 'warning' | 'error';
  validation_message: string;
  warnings: string[];
  errors: string[];
  
  // Recipe linking
  recipe_id?: string;
  recipe_name?: string;
  actual_food_cost_pct?: number;
  
  // Recommendations
  suggested_price?: number;
  price_recommendation?: string;
}

export interface ValidationContext {
  userId: string;
  restaurantId: string;
  existingMenuItems?: any[];
  existingRecipes?: any[];
}

/**
 * Validate a batch of menu items
 */
export async function validateMenuItems(
  items: MenuItemToValidate[],
  context: ValidationContext,
  supabase?: any
): Promise<ValidationResult[]> {
  
  // Get existing data if not provided
  let existingItems = context.existingMenuItems;
  let existingRecipes = context.existingRecipes;
  
  if (supabase && (!existingItems || !existingRecipes)) {
    const [itemsResult, recipesResult] = await Promise.all([
      supabase
        .from('MenuPricing')
        .select('id, item_name, price, category')
        .eq('user_id', context.userId),
      supabase
        .from('Recipes')
        .select('id, name, cost_per_portion, recipe_yield')
        .eq('user_id', context.userId)
    ]);
    
    existingItems = itemsResult.data || [];
    existingRecipes = recipesResult.data || [];
  }
  
  // Validate each item
  return items.map(item => 
    validateSingleMenuItem(item, context, existingItems || [], existingRecipes || [])
  );
}

/**
 * Validate a single menu item
 */
function validateSingleMenuItem(
  item: MenuItemToValidate,
  context: ValidationContext,
  existingItems: any[],
  existingRecipes: any[]
): ValidationResult {
  
  const warnings: string[] = [];
  const errors: string[] = [];
  let suggestedPrice: number | undefined;
  let priceRecommendation: string | undefined;
  
  // Basic validation
  validateBasicFields(item, errors, warnings);
  
  // Price validation
  validatePricing(item, warnings, errors);
  
  // Duplicate detection
  validateDuplicates(item, existingItems, warnings);
  
  // Recipe linking and cost analysis
  const recipeMatch = findMatchingRecipe(item, existingRecipes);
  let actualFoodCostPct: number | undefined;
  
  if (recipeMatch) {
    const costAnalysis = calculateFoodCostAnalysis(item, recipeMatch);
    actualFoodCostPct = costAnalysis.actualFoodCostPct;
    
    if (costAnalysis.warning) {
      warnings.push(costAnalysis.warning);
    }
    
    if (costAnalysis.suggestedPrice) {
      suggestedPrice = costAnalysis.suggestedPrice;
      priceRecommendation = costAnalysis.recommendation;
    }
  }
  
  // Low confidence warning
  if (item.confidence < 0.6) {
    errors.push(`Low confidence (${Math.round(item.confidence * 100)}%) - please review`);
  } else if (item.confidence < 0.8) {
    warnings.push(`Medium confidence (${Math.round(item.confidence * 100)}%) - please verify`);
  }
  
  // Determine overall validation status
  let validationStatus: 'good' | 'warning' | 'error' = 'good';
  if (errors.length > 0) {
    validationStatus = 'error';
  } else if (warnings.length > 0) {
    validationStatus = 'warning';
  }
  
  return {
    item_name: item.item_name,
    category: item.category || 'Uncategorized',
    price: item.price,
    target_food_cost_pct: item.target_food_cost_pct,
    description: item.description,
    confidence: item.confidence,
    
    validation_status: validationStatus,
    validation_message: [...errors, ...warnings].join('; '),
    warnings,
    errors,
    
    recipe_id: recipeMatch?.id,
    recipe_name: recipeMatch?.name,
    actual_food_cost_pct: actualFoodCostPct,
    
    suggested_price: suggestedPrice,
    price_recommendation: priceRecommendation
  };
}

/**
 * Validate basic required fields
 */
function validateBasicFields(
  item: MenuItemToValidate,
  errors: string[],
  warnings: string[]
): void {
  
  // Required: item name
  if (!item.item_name || item.item_name.trim() === '') {
    errors.push('Item name is required');
    return;
  }
  
  // Required: valid price
  if (!item.price || isNaN(item.price) || item.price < 0) {
    errors.push('Valid price is required');
    return;
  }
  
  // Item name quality checks
  if (item.item_name.length < 3) {
    warnings.push('Very short item name - please verify');
  }
  
  if (item.item_name.length > 100) {
    warnings.push('Very long item name - consider shortening');
  }
  
  // Check for common data issues
  if (item.item_name.toLowerCase().includes('todo') || 
      item.item_name.toLowerCase().includes('tbd')) {
    warnings.push('Item name appears incomplete');
  }
}

/**
 * Validate pricing logic
 */
function validatePricing(
  item: MenuItemToValidate,
  warnings: string[],
  errors: string[]
): void {
  
  const price = item.price;
  
  // Price range validation
  if (price === 0) {
    warnings.push('Price is $0.00 - is this intentional?');
  } else if (price < 1) {
    warnings.push(`Very low price ($${price.toFixed(2)}) - please verify`);
  } else if (price < 5) {
    // Potentially valid but unusual for many restaurant items
  } else if (price > 200) {
    warnings.push(`Very high price ($${price.toFixed(2)}) - please verify`);
  }
  
  // Target food cost validation
  if (item.target_food_cost_pct !== undefined) {
    const target = item.target_food_cost_pct;
    
    if (target < 15) {
      warnings.push(`Very low target food cost (${target}%) - may be difficult to achieve`);
    } else if (target > 50) {
      warnings.push(`High target food cost (${target}%) - may impact profitability`);
    }
  }
  
  // Price precision check
  const decimalPlaces = (price.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    warnings.push('Price has more than 2 decimal places - will be rounded');
  }
}

/**
 * Check for duplicate menu items
 */
function validateDuplicates(
  item: MenuItemToValidate,
  existingItems: any[],
  warnings: string[]
): void {
  
  const itemName = item.item_name.toLowerCase().trim();
  
  // Look for exact matches
  const exactMatch = existingItems.find(existing => 
    existing.item_name.toLowerCase().trim() === itemName
  );
  
  if (exactMatch) {
    warnings.push(`Exact duplicate: "${exactMatch.item_name}" already exists ($${exactMatch.price})`);
    return;
  }
  
  // Look for similar matches
  const similarMatches = existingItems.filter(existing => {
    const existingName = existing.item_name.toLowerCase().trim();
    return calculateStringSimilarity(itemName, existingName) > 0.8;
  });
  
  if (similarMatches.length > 0) {
    const match = similarMatches[0];
    warnings.push(`Similar item: "${match.item_name}" already exists ($${match.price})`);
  }
}

/**
 * Find matching recipe for menu item
 */
function findMatchingRecipe(
  item: MenuItemToValidate,
  existingRecipes: any[]
): any | null {
  
  const itemName = item.item_name.toLowerCase().trim();
  
  // Look for exact name match
  let bestMatch = existingRecipes.find(recipe =>
    recipe.name.toLowerCase().trim() === itemName
  );
  
  if (bestMatch) {
    return bestMatch;
  }
  
  // Look for partial matches
  const partialMatches = existingRecipes
    .map(recipe => ({
      recipe,
      similarity: calculateStringSimilarity(
        itemName,
        recipe.name.toLowerCase().trim()
      )
    }))
    .filter(match => match.similarity > 0.7)
    .sort((a, b) => b.similarity - a.similarity);
  
  return partialMatches.length > 0 ? partialMatches[0].recipe : null;
}

/**
 * Calculate food cost analysis when recipe is available
 */
function calculateFoodCostAnalysis(
  item: MenuItemToValidate,
  recipe: any
): {
  actualFoodCostPct: number;
  warning?: string;
  suggestedPrice?: number;
  recommendation?: string;
} {
  
  const recipeCost = recipe.cost_per_portion || 0;
  const menuPrice = item.price;
  
  if (!recipeCost || !menuPrice) {
    return { actualFoodCostPct: 0 };
  }
  
  const actualFoodCostPct = (recipeCost / menuPrice) * 100;
  const targetFoodCostPct = item.target_food_cost_pct;
  
  let warning: string | undefined;
  let suggestedPrice: number | undefined;
  let recommendation: string | undefined;
  
  // Compare to target if available
  if (targetFoodCostPct) {
    const variance = actualFoodCostPct - targetFoodCostPct;
    
    if (Math.abs(variance) > 5) {
      if (variance > 0) {
        warning = `Food cost (${actualFoodCostPct.toFixed(1)}%) exceeds target (${targetFoodCostPct}%)`;
        suggestedPrice = recipeCost / (targetFoodCostPct / 100);
        recommendation = `Consider raising price to $${suggestedPrice.toFixed(2)} to achieve ${targetFoodCostPct}% food cost`;
      } else {
        warning = `Food cost (${actualFoodCostPct.toFixed(1)}%) is well below target (${targetFoodCostPct}%)`;
        recommendation = `Current pricing achieves better margins than target`;
      }
    }
  } else {
    // Use industry standards if no target provided
    const industryTarget = getIndustryTargetFoodCost(item.category);
    const variance = actualFoodCostPct - industryTarget;
    
    if (variance > 5) {
      warning = `Food cost (${actualFoodCostPct.toFixed(1)}%) exceeds industry standard (~${industryTarget}%)`;
      suggestedPrice = recipeCost / (industryTarget / 100);
      recommendation = `Consider raising price to $${suggestedPrice.toFixed(2)} for better margins`;
    }
  }
  
  return {
    actualFoodCostPct,
    warning,
    suggestedPrice,
    recommendation
  };
}

/**
 * Get industry target food cost by category
 */
function getIndustryTargetFoodCost(category?: string): number {
  const targets: { [key: string]: number } = {
    'appetizers': 25,
    'salads': 28,
    'soups': 30,
    'pizza': 25,
    'pasta': 30,
    'seafood': 32,
    'steaks': 35,
    'chicken': 28,
    'pork': 30,
    'beef': 32,
    'lamb': 35,
    'vegetarian': 25,
    'desserts': 22,
    'beverages': 20,
    'cocktails': 18,
    'wine': 25,
    'beer': 20
  };
  
  if (!category) {
    return 30; // General average
  }
  
  const key = category.toLowerCase();
  return targets[key] || 30;
}

/**
 * Calculate string similarity (simplified Jaro-Winkler)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  // Simple approach: count common characters
  const longer = len1 > len2 ? str1 : str2;
  const shorter = len1 > len2 ? str2 : str1;
  
  if (longer.length === 0) return 1;
  
  const matches = longer
    .split('')
    .filter((char, i) => shorter.includes(char))
    .length;
  
  return matches / longer.length;
}

/**
 * Generate validation summary statistics
 */
export function generateValidationSummary(results: ValidationResult[]): {
  total: number;
  good: number;
  warnings: number;
  errors: number;
  recipes_linked: number;
  avg_confidence: number;
  common_issues: string[];
} {
  
  const total = results.length;
  const good = results.filter(r => r.validation_status === 'good').length;
  const warnings = results.filter(r => r.validation_status === 'warning').length;
  const errors = results.filter(r => r.validation_status === 'error').length;
  const recipesLinked = results.filter(r => r.recipe_id).length;
  
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / total;
  
  // Collect common issues
  const allWarnings = results.flatMap(r => r.warnings);
  const allErrors = results.flatMap(r => r.errors);
  const issueMap: { [key: string]: number } = {};
  
  [...allWarnings, ...allErrors].forEach(issue => {
    // Extract issue type (before the dash or colon)
    const issueType = issue.split(/[-:]/)[0].trim();
    issueMap[issueType] = (issueMap[issueType] || 0) + 1;
  });
  
  const commonIssues = Object.entries(issueMap)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([issue, count]) => `${issue} (${count})`);
  
  return {
    total,
    good,
    warnings,
    errors,
    recipes_linked: recipesLinked,
    avg_confidence: avgConfidence,
    common_issues: commonIssues
  };
}

/**
 * Generate mock validation results for testing
 */
export function getMockValidationResults(): ValidationResult[] {
  return [
    {
      item_name: 'Caesar Salad',
      category: 'Salads',
      price: 14.00,
      target_food_cost_pct: 28,
      description: 'Fresh romaine lettuce with parmesan and croutons',
      confidence: 0.95,
      validation_status: 'good',
      validation_message: '',
      warnings: [],
      errors: [],
      recipe_id: 'recipe-123',
      recipe_name: 'Caesar Salad Recipe',
      actual_food_cost_pct: 26.5
    },
    {
      item_name: 'Margherita Pizza',
      category: 'Pizza',
      price: 18.00,
      target_food_cost_pct: 25,
      description: 'Fresh mozzarella, tomato sauce, basil',
      confidence: 0.92,
      validation_status: 'warning',
      validation_message: 'Food cost (31.2%) exceeds target (25%)',
      warnings: ['Food cost (31.2%) exceeds target (25%)'],
      errors: [],
      recipe_id: 'recipe-456',
      recipe_name: 'Margherita Pizza Recipe',
      actual_food_cost_pct: 31.2,
      suggested_price: 22.40,
      price_recommendation: 'Consider raising price to $22.40 to achieve 25% food cost'
    },
    {
      item_name: 'Invalid Item',
      category: 'Test',
      price: 0,
      confidence: 0.45,
      validation_status: 'error',
      validation_message: 'Price is $0.00 - is this intentional?; Low confidence (45%) - please review',
      warnings: ['Price is $0.00 - is this intentional?'],
      errors: ['Low confidence (45%) - please review']
    }
  ];
}