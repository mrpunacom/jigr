// lib/menu-import/pricing-validator.ts
// Validate menu pricing against recipe costs and industry standards

export interface ValidationResult {
  status: 'pending' | 'good' | 'info' | 'warning' | 'error';
  message: string;
  actual_food_cost_pct: number | null;
  price_recommendation: number | null;
}

export interface MenuItem {
  item_name: string;
  price: number;
  target_food_cost_pct?: number | null;
}

export interface Recipe {
  id: string;
  recipe_name: string;
  cost_per_portion: number;
}

/**
 * Validate menu item pricing based on recipe cost
 */
export function validateMenuItem(
  menuItem: MenuItem,
  matchedRecipe: Recipe | null
): ValidationResult {
  // No recipe matched - cannot validate
  if (!matchedRecipe || !matchedRecipe.cost_per_portion) {
    return {
      status: 'pending',
      message: 'Select a recipe to calculate food cost %',
      actual_food_cost_pct: null,
      price_recommendation: null
    };
  }
  
  // Calculate actual food cost percentage
  const actualPct = (matchedRecipe.cost_per_portion / menuItem.price) * 100;
  
  // If user provided a target, validate against it
  if (menuItem.target_food_cost_pct) {
    return validateAgainstTarget(
      menuItem,
      matchedRecipe,
      actualPct,
      menuItem.target_food_cost_pct
    );
  }
  
  // Otherwise, use industry standard guidelines
  return validateAgainstIndustryStandards(
    menuItem,
    matchedRecipe,
    actualPct
  );
}

/**
 * Validate against user's target food cost %
 */
function validateAgainstTarget(
  menuItem: MenuItem,
  recipe: Recipe,
  actualPct: number,
  targetPct: number
): ValidationResult {
  const tolerance = 5; // Allow 5% variance
  
  if (actualPct > targetPct + tolerance) {
    // Way over target - ERROR
    const recommendedPrice = recipe.cost_per_portion / (targetPct / 100);
    
    return {
      status: 'error',
      message: `Food cost ${actualPct.toFixed(1)}% exceeds target ${targetPct}% by ${(actualPct - targetPct).toFixed(1)}%. Consider increasing price to $${recommendedPrice.toFixed(2)}`,
      actual_food_cost_pct: actualPct,
      price_recommendation: Math.ceil(recommendedPrice * 2) / 2 // Round to nearest $0.50
    };
  }
  
  if (actualPct > targetPct) {
    // Slightly over target - WARNING
    return {
      status: 'warning',
      message: `Food cost ${actualPct.toFixed(1)}% is ${(actualPct - targetPct).toFixed(1)}% above target ${targetPct}%`,
      actual_food_cost_pct: actualPct,
      price_recommendation: null
    };
  }
  
  if (actualPct < targetPct - 10) {
    // Way under target - might be overpriced - INFO
    const recommendedPrice = recipe.cost_per_portion / (targetPct / 100);
    
    return {
      status: 'info',
      message: `Food cost ${actualPct.toFixed(1)}% is well below target ${targetPct}%. Could reduce price to $${recommendedPrice.toFixed(2)} for better value`,
      actual_food_cost_pct: actualPct,
      price_recommendation: Math.floor(recommendedPrice * 2) / 2 // Round to nearest $0.50
    };
  }
  
  // Within acceptable range - GOOD
  return {
    status: 'good',
    message: `Food cost ${actualPct.toFixed(1)}% is within target ${targetPct}%`,
    actual_food_cost_pct: actualPct,
    price_recommendation: null
  };
}

/**
 * Validate against industry standard guidelines (28-32% ideal)
 */
function validateAgainstIndustryStandards(
  menuItem: MenuItem,
  recipe: Recipe,
  actualPct: number
): ValidationResult {
  const idealMin = 28;
  const idealMax = 32;
  const acceptableMax = 35;
  
  if (actualPct > acceptableMax) {
    // Too high - ERROR
    const recommendedPrice = recipe.cost_per_portion / 0.30; // Target 30%
    
    return {
      status: 'error',
      message: `High food cost ${actualPct.toFixed(1)}%. Industry standard is ${idealMin}-${idealMax}%. Consider increasing price to $${recommendedPrice.toFixed(2)}`,
      actual_food_cost_pct: actualPct,
      price_recommendation: Math.ceil(recommendedPrice * 2) / 2
    };
  }
  
  if (actualPct > idealMax) {
    // Above ideal but acceptable - WARNING
    return {
      status: 'warning',
      message: `Food cost ${actualPct.toFixed(1)}% is above ideal range (${idealMin}-${idealMax}%)`,
      actual_food_cost_pct: actualPct,
      price_recommendation: null
    };
  }
  
  if (actualPct < 20) {
    // Very low - might be overpriced - INFO
    const recommendedPrice = recipe.cost_per_portion / 0.28; // Target 28%
    
    return {
      status: 'info',
      message: `Low food cost ${actualPct.toFixed(1)}%. Could reduce price to $${recommendedPrice.toFixed(2)} for better perceived value`,
      actual_food_cost_pct: actualPct,
      price_recommendation: Math.floor(recommendedPrice * 2) / 2
    };
  }
  
  if (actualPct >= idealMin && actualPct <= idealMax) {
    // Perfect range - GOOD
    return {
      status: 'good',
      message: `Food cost ${actualPct.toFixed(1)}% is within ideal range (${idealMin}-${idealMax}%)`,
      actual_food_cost_pct: actualPct,
      price_recommendation: null
    };
  }
  
  // Between 20-28% - acceptable but low - INFO
  return {
    status: 'info',
    message: `Food cost ${actualPct.toFixed(1)}% is acceptable but below ideal (${idealMin}-${idealMax}%)`,
    actual_food_cost_pct: actualPct,
    price_recommendation: null
  };
}

/**
 * Batch validate multiple menu items
 */
export function validateMenuItems(
  menuItems: MenuItem[],
  recipeMap: Map<string, Recipe>
): (MenuItem & ValidationResult)[] {
  return menuItems.map(item => {
    const recipe = recipeMap.get(item.item_name.toLowerCase());
    const validation = validateMenuItem(item, recipe || null);
    
    return {
      ...item,
      ...validation
    };
  });
}

/**
 * Generate pricing statistics for a menu
 */
export interface MenuPricingStats {
  total_items: number;
  items_with_recipes: number;
  items_without_recipes: number;
  good_pricing: number;
  warnings: number;
  errors: number;
  average_food_cost_pct: number | null;
  items_above_35_pct: number;
  items_below_20_pct: number;
}

export function generateMenuStats(
  validatedItems: (MenuItem & ValidationResult)[]
): MenuPricingStats {
  const itemsWithRecipes = validatedItems.filter(
    item => item.status !== 'pending'
  );
  
  const foodCosts = itemsWithRecipes
    .map(item => item.actual_food_cost_pct)
    .filter((pct): pct is number => pct !== null);
  
  const avgFoodCost = foodCosts.length > 0
    ? foodCosts.reduce((sum, pct) => sum + pct, 0) / foodCosts.length
    : null;
  
  return {
    total_items: validatedItems.length,
    items_with_recipes: itemsWithRecipes.length,
    items_without_recipes: validatedItems.length - itemsWithRecipes.length,
    good_pricing: validatedItems.filter(item => item.status === 'good').length,
    warnings: validatedItems.filter(item => item.status === 'warning').length,
    errors: validatedItems.filter(item => item.status === 'error').length,
    average_food_cost_pct: avgFoodCost,
    items_above_35_pct: foodCosts.filter(pct => pct > 35).length,
    items_below_20_pct: foodCosts.filter(pct => pct < 20).length
  };
}

/**
 * Get pricing insights and recommendations
 */
export function getPricingInsights(
  stats: MenuPricingStats
): string[] {
  const insights: string[] = [];
  
  if (stats.items_without_recipes > 0) {
    insights.push(
      `${stats.items_without_recipes} item(s) need recipe linking to calculate food cost`
    );
  }
  
  if (stats.errors > 0) {
    insights.push(
      `${stats.errors} item(s) have critical pricing issues (food cost >35%)`
    );
  }
  
  if (stats.warnings > 0) {
    insights.push(
      `${stats.warnings} item(s) could benefit from price adjustments`
    );
  }
  
  if (stats.average_food_cost_pct !== null) {
    if (stats.average_food_cost_pct > 32) {
      insights.push(
        `Average food cost ${stats.average_food_cost_pct.toFixed(1)}% is above ideal (28-32%). Consider increasing prices across the menu.`
      );
    } else if (stats.average_food_cost_pct < 25) {
      insights.push(
        `Average food cost ${stats.average_food_cost_pct.toFixed(1)}% is quite low. Menu may be perceived as expensive.`
      );
    } else {
      insights.push(
        `Average food cost ${stats.average_food_cost_pct.toFixed(1)}% is within ideal range!`
      );
    }
  }
  
  if (stats.good_pricing === stats.items_with_recipes && stats.items_with_recipes > 0) {
    insights.push(
      `Excellent! All items with recipes have optimal pricing.`
    );
  }
  
  return insights;
}
