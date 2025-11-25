// lib/menu-import/recipe-matcher.ts
// Fuzzy matching to link menu items to existing recipes

export interface RecipeMatch {
  id: string;
  recipe_name: string;
  cost_per_portion: number;
  category_name?: string | null;
  similarity: number;
}

export interface MatchedMenuItem {
  item_name: string;
  recipe_id: string | null;
  recipe_suggestions: RecipeMatch[];
  match_confidence: number;
}

/**
 * Match menu items to existing recipes using fuzzy matching
 */
export function matchMenuItemsToRecipes(
  menuItems: any[],
  recipes: any[]
): MatchedMenuItem[] {
  if (!recipes || recipes.length === 0) {
    return menuItems.map(item => ({
      item_name: item.item_name,
      recipe_id: null,
      recipe_suggestions: [],
      match_confidence: 0
    }));
  }
  
  return menuItems.map(item => {
    const matches = findBestRecipeMatches(item.item_name, recipes);
    
    return {
      item_name: item.item_name,
      recipe_id: matches[0]?.id || null,
      recipe_suggestions: matches.slice(0, 5), // Top 5 matches
      match_confidence: matches[0]?.similarity || 0
    };
  });
}

/**
 * Find best recipe matches for a menu item name
 */
function findBestRecipeMatches(
  menuItemName: string,
  recipes: any[]
): RecipeMatch[] {
  const normalized = normalizeText(menuItemName);
  
  const scored = recipes.map(recipe => {
    const recipeName = normalizeText(recipe.recipe_name);
    const similarity = calculateSimilarity(normalized, recipeName);
    
    return {
      id: recipe.id,
      recipe_name: recipe.recipe_name,
      cost_per_portion: recipe.cost_per_portion || 0,
      category_name: recipe.category_name,
      similarity
    };
  });
  
  // Filter out low-confidence matches and sort by similarity
  return scored
    .filter(match => match.similarity > 0.3) // 30% threshold
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Remove common size/portion indicators
    .replace(/\b(small|medium|large|half|full|portion)\b/g, '')
    // Remove common descriptors
    .replace(/\b(fresh|grilled|fried|baked|roasted|steamed)\b/g, '')
    // Remove punctuation
    .replace(/[^\w\s]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity between two strings
 * Returns value between 0 (no match) and 1 (perfect match)
 */
function calculateSimilarity(str1: string, str2: string): number {
  // Exact match
  if (str1 === str2) {
    return 1.0;
  }
  
  // One contains the other
  if (str1.includes(str2)) {
    return 0.95;
  }
  
  if (str2.includes(str1)) {
    return 0.95;
  }
  
  // Calculate word overlap
  const words1 = str1.split(' ').filter(w => w.length > 0);
  const words2 = str2.split(' ').filter(w => w.length > 0);
  
  const commonWords = words1.filter(w => words2.includes(w));
  const totalUniqueWords = new Set([...words1, ...words2]).size;
  
  const wordOverlap = commonWords.length / totalUniqueWords;
  
  // If significant word overlap, return good score
  if (wordOverlap > 0.5) {
    return 0.7 + (wordOverlap * 0.2); // 0.7-0.9 range
  }
  
  // Fall back to Levenshtein distance for remaining cases
  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  
  if (maxLen === 0) return 0;
  
  const similarity = 1 - (distance / maxLen);
  
  // Boost score if there are common words
  const wordBoost = commonWords.length * 0.05;
  
  return Math.min(similarity + wordBoost, 1.0);
}

/**
 * Calculate Levenshtein distance between two strings
 * (minimum number of single-character edits needed to change one string into the other)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create 2D array
  const matrix: number[][] = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(0));
  
  // Initialize first column and row
  for (let i = 0; i <= len1; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[j][0] = j;
  }
  
  // Fill in the rest of the matrix
  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      if (str2[j - 1] === str1[i - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[len2][len1];
}

/**
 * Validate match quality and generate warnings
 */
export function validateMatchQuality(
  matches: MatchedMenuItem[]
): {
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  noMatch: number;
  warnings: string[];
} {
  const highConfidence = matches.filter(m => m.match_confidence > 0.8).length;
  const mediumConfidence = matches.filter(
    m => m.match_confidence > 0.5 && m.match_confidence <= 0.8
  ).length;
  const lowConfidence = matches.filter(
    m => m.match_confidence > 0 && m.match_confidence <= 0.5
  ).length;
  const noMatch = matches.filter(m => m.match_confidence === 0).length;
  
  const warnings: string[] = [];
  
  if (noMatch > 0) {
    warnings.push(
      `${noMatch} menu item(s) have no matching recipes - add recipes or link manually`
    );
  }
  
  if (lowConfidence > 0) {
    warnings.push(
      `${lowConfidence} menu item(s) have low-confidence matches - please review`
    );
  }
  
  if (mediumConfidence > 0) {
    warnings.push(
      `${mediumConfidence} menu item(s) have medium-confidence matches - verify correctness`
    );
  }
  
  return {
    highConfidence,
    mediumConfidence,
    lowConfidence,
    noMatch,
    warnings
  };
}

/**
 * Generate match report for debugging/logging
 */
export function generateMatchReport(
  matches: MatchedMenuItem[]
): string {
  const quality = validateMatchQuality(matches);
  
  let report = '=== Recipe Matching Report ===\n\n';
  report += `Total Menu Items: ${matches.length}\n`;
  report += `High Confidence Matches (>80%): ${quality.highConfidence}\n`;
  report += `Medium Confidence Matches (50-80%): ${quality.mediumConfidence}\n`;
  report += `Low Confidence Matches (<50%): ${quality.lowConfidence}\n`;
  report += `No Matches Found: ${quality.noMatch}\n\n`;
  
  if (quality.warnings.length > 0) {
    report += 'Warnings:\n';
    quality.warnings.forEach(warning => {
      report += `- ${warning}\n`;
    });
  }
  
  return report;
}
