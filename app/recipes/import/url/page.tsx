'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper';

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
      // For now, simulate the processing since backend APIs aren't ready
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Mock response based on URL
      const mockResult = {
        success: true,
        session_id: 'mock-session-456',
        parsed: {
          recipe_name: 'Perfect Roast Chicken',
          servings: 4,
          portion_size: '1 serving',
          prep_time_minutes: 15,
          cook_time_minutes: 60,
          total_time_minutes: 75,
          ingredients: [
            {
              quantity: '1',
              unit: 'whole',
              ingredient: 'chicken',
              preparation: '3-4 lbs',
              confidence: 1.0
            },
            {
              quantity: '2',
              unit: 'tablespoons',
              ingredient: 'olive oil',
              preparation: null,
              confidence: 1.0
            },
            {
              quantity: '1',
              unit: 'teaspoon',
              ingredient: 'salt',
              preparation: null,
              confidence: 1.0
            },
            {
              quantity: '0.5',
              unit: 'teaspoon',
              ingredient: 'black pepper',
              preparation: 'freshly ground',
              confidence: 1.0
            },
            {
              quantity: '2',
              unit: 'cloves',
              ingredient: 'garlic',
              preparation: 'minced',
              confidence: 1.0
            },
            {
              quantity: '1',
              unit: 'lemon',
              ingredient: 'lemon',
              preparation: 'quartered',
              confidence: 1.0
            }
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
          category: 'Main Course',
          source: extractDomain(url),
          source_url: url,
          parse_method: 'schema_org',
          import_method: 'website_url',
          confidence: 1.0
        },
        warnings: []
      };

      // Store in session storage for preview
      sessionStorage.setItem('recipe_import_preview', JSON.stringify(mockResult));
      router.push('/recipes/import/preview');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.startsWith('http')) {
        setUrl(text);
        setError(null);
      }
    } catch (err) {
      // Clipboard access failed - ignore
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleImport();
    }
  };

  return (
    <StandardPageWrapper moduleName="RECIPES" currentPage="import">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Recipe from Website</h1>
          <p className="text-gray-600">
            Copy a recipe URL from any website. Our system works with AllRecipes, BBC Food, NYT Cooking, Food Network, and thousands more.
          </p>
        </div>

        {/* Development Notice */}
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-8">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>Development Mode:</strong> This feature uses mock data for demonstration. Full website scraping coming soon.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-8">
          {/* URL Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Recipe URL
            </label>
            
            <div className="relative">
              <input
                type="url"
                placeholder="https://www.allrecipes.com/recipe/231506/simple-macaroni-and-cheese/"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 pr-24 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
              
              <button
                onClick={handlePasteFromClipboard}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Paste
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Paste the full URL from your browser's address bar
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors TouchTarget"
            >
              Cancel
            </button>
            
            <button
              onClick={handleImport}
              disabled={!url || isLoading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors TouchTarget"
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

          {/* Quick Example */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Try it with this example:</h4>
            <button
              onClick={() => setUrl('https://www.allrecipes.com/recipe/231506/simple-macaroni-and-cheese/')}
              className="text-blue-600 hover:text-blue-700 text-sm underline"
            >
              https://www.allrecipes.com/recipe/231506/simple-macaroni-and-cheese/
            </button>
          </div>
        </div>

        {/* Information Sections */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supported Sites */}
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
            <h3 className="font-medium mb-3 text-green-900">✅ Works Best With:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
              <div>• AllRecipes.com</div>
              <div>• Food Network</div>
              <div>• BBC Good Food</div>
              <div>• NYT Cooking</div>
              <div>• Serious Eats</div>
              <div>• Bon Appétit</div>
              <div>• Epicurious</div>
              <div>• Tasty</div>
              <div>• Food & Wine</div>
              <div>• Delish</div>
              <div>• Simply Recipes</div>
              <div>• King Arthur Baking</div>
            </div>
            <p className="text-xs text-green-700 mt-3">
              Plus hundreds of other recipe websites with structured data!
            </p>
          </div>

          {/* How It Works */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
            <h3 className="font-medium mb-3 text-blue-900">💡 How It Works:</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• 1. Fetches the webpage safely</li>
              <li>• 2. Looks for structured recipe data</li>
              <li>• 3. Falls back to AI parsing if needed</li>
              <li>• 4. Extracts ingredients, instructions, timing</li>
              <li>• 5. Matches ingredients to your inventory</li>
              <li>• 6. Lets you review before saving</li>
            </ul>
          </div>

          {/* Tips */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <h3 className="font-medium mb-3 text-yellow-900">💡 Tips for Success:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Copy the full URL from your browser</li>
              <li>• Works with most popular recipe sites</li>
              <li>• Some sites may require free account access</li>
              <li>• Paywall sites may not work fully</li>
              <li>• You'll preview everything before saving</li>
            </ul>
          </div>

          {/* Copyright Notice */}
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <h3 className="font-medium mb-3 text-red-900">⚖️ Important:</h3>
            <p className="text-sm text-red-800 leading-relaxed">
              Imported recipes are for your restaurant's internal kitchen use only. 
              Do not redistribute or republish copyrighted recipes. 
              Always respect the original recipe creators and websites.
            </p>
          </div>
        </div>
    </StandardPageWrapper>
  );
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}