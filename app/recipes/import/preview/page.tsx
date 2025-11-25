'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper';

interface PreviewData {
  success: boolean;
  session_id: string;
  parsed: {
    recipe_name: string;
    servings: number;
    portion_size?: string;
    prep_time_minutes?: number;
    cook_time_minutes?: number;
    total_time_minutes?: number;
    ingredients: Array<{
      quantity: string;
      unit: string;
      ingredient: string;
      preparation?: string;
      confidence: number;
      inventory_item_id?: string;
      suggestions?: Array<{
        id: string;
        item_name: string;
        confidence: number;
      }>;
    }>;
    instructions: string[];
    category?: string;
    notes?: string;
    source?: string;
    source_url?: string;
    import_method: string;
    confidence: number;
  };
  warnings: string[];
}

export default function RecipeImportPreview() {
  const router = useRouter();
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState(0);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load preview data from sessionStorage
    const data = sessionStorage.getItem('recipe_import_preview');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setPreviewData(parsed);
        setRecipeName(parsed.parsed.recipe_name || '');
        setServings(parsed.parsed.servings || 0);
        setIngredients(parsed.parsed.ingredients || []);
        setInstructions(parsed.parsed.instructions || []);
      } catch (e) {
        console.error('Failed to parse preview data:', e);
        router.push('/recipes/import');
      }
    } else {
      // No preview data, redirect back
      router.push('/recipes/import');
    }
  }, [router]);

  const handleIngredientEdit = (index: number, field: string, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index);
    setIngredients(updated);
  };

  const addIngredient = () => {
    const newIngredient = {
      quantity: '',
      unit: '',
      ingredient: '',
      preparation: null,
      confidence: 1.0
    };
    setIngredients([...ingredients, newIngredient]);
  };

  const handleInstructionEdit = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const removeInstruction = (index: number) => {
    const updated = instructions.filter((_, i) => i !== index);
    setInstructions(updated);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleSave = async () => {
    if (!previewData) return;

    // Validate required fields
    if (!recipeName.trim()) {
      setError('Recipe name is required');
      return;
    }

    if (ingredients.length === 0) {
      setError('At least one ingredient is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // For now, simulate saving since backend isn't ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear session storage
      sessionStorage.removeItem('recipe_import_preview');
      
      // In real implementation, we'd save to database and get recipe ID
      // For now, redirect to recipes list
      alert('Recipe imported successfully! (Mock implementation)');
      router.push('/recipes');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
    } finally {
      setIsSaving(false);
    }
  };

  if (!previewData) {
    return (
      <StandardPageWrapper moduleName="RECIPES" currentPage="import">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Loading preview...</p>
          </div>
        </div>
      </StandardPageWrapper>
    );
  }

  const recipe = previewData.parsed;
  const warnings = previewData.warnings || [];
  const overallConfidence = recipe.confidence || 0;

  return (
    <StandardPageWrapper moduleName="RECIPES" currentPage="import">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Imported Recipe</h1>
          <p className="text-gray-600">
            Verify the extracted data and make any necessary adjustments before saving to your recipe library.
          </p>
        </div>

        {/* Import Method Badge */}
        <div className="mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {recipe.import_method === 'photo_ocr' && '📸 Photo OCR'}
            {recipe.import_method === 'website_url' && '🌐 Website Import'}
            {recipe.import_method === 'google_sheets' && '📊 Google Sheets'}
            {recipe.import_method === 'manual' && '✏️ Manual Entry'}
            {!['photo_ocr', 'website_url', 'google_sheets', 'manual'].includes(recipe.import_method) && recipe.import_method}
          </span>
          
          {overallConfidence < 0.8 && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Confidence: {Math.round(overallConfidence * 100)}%
            </span>
          )}
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium mb-2 text-yellow-900">⚠️ Please Review:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              {warnings.map((warning: string, i: number) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Recipe Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recipe Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipe Name *
                  </label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter recipe name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servings
                  </label>
                  <input
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>

              {recipe.prep_time_minutes || recipe.cook_time_minutes ? (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {recipe.prep_time_minutes && (
                    <div>
                      <span className="text-gray-500">Prep Time:</span>
                      <span className="ml-1 font-medium">{recipe.prep_time_minutes} min</span>
                    </div>
                  )}
                  {recipe.cook_time_minutes && (
                    <div>
                      <span className="text-gray-500">Cook Time:</span>
                      <span className="ml-1 font-medium">{recipe.cook_time_minutes} min</span>
                    </div>
                  )}
                  {recipe.total_time_minutes && (
                    <div>
                      <span className="text-gray-500">Total Time:</span>
                      <span className="ml-1 font-medium">{recipe.total_time_minutes} min</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Ingredients */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Ingredients</h2>
                <button
                  onClick={addIngredient}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Add Ingredient
                </button>
              </div>
              
              <div className="space-y-3">
                {ingredients.map((ing, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Qty"
                        value={ing.quantity}
                        onChange={(e) => handleIngredientEdit(index, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="Unit"
                        value={ing.unit}
                        onChange={(e) => handleIngredientEdit(index, 'unit', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Ingredient"
                        value={ing.ingredient}
                        onChange={(e) => handleIngredientEdit(index, 'ingredient', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="text"
                        placeholder="Preparation"
                        value={ing.preparation || ''}
                        onChange={(e) => handleIngredientEdit(index, 'preparation', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        onClick={() => removeIngredient(index)}
                        className="p-1 text-red-600 hover:text-red-700"
                        title="Remove ingredient"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {ing.confidence < 0.8 && (
                      <div className="col-span-12 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                        Low confidence ({Math.round(ing.confidence * 100)}%) - please verify
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Instructions</h2>
                <button
                  onClick={addInstruction}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Add Step
                </button>
              </div>
              
              <div className="space-y-3">
                {instructions.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-blue-600 font-bold text-sm mt-2 min-w-6">{index + 1}.</span>
                    <div className="flex-1">
                      <textarea
                        value={step}
                        onChange={(e) => handleInstructionEdit(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={2}
                        placeholder="Enter instruction step..."
                      />
                    </div>
                    <button
                      onClick={() => removeInstruction(index)}
                      className="p-1 text-red-600 hover:text-red-700 mt-2"
                      title="Remove step"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Source Info & Actions */}
          <div className="space-y-6">
            {/* Source Information */}
            {recipe.source && (
              <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-4">
                <h3 className="font-medium text-gray-900 mb-3">Source Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Source:</span>
                    <span className="ml-1 font-medium">{recipe.source}</span>
                  </div>
                  {recipe.source_url && (
                    <div>
                      <span className="text-gray-500">URL:</span>
                      <a
                        href={recipe.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 text-blue-600 hover:text-blue-700 text-xs break-all"
                      >
                        {recipe.source_url}
                      </a>
                    </div>
                  )}
                  {recipe.category && (
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-1 font-medium">{recipe.category}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-4">
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors TouchTarget"
                >
                  {isSaving ? 'Saving Recipe...' : 'Save Recipe'}
                </button>
                
                <button
                  onClick={() => router.back()}
                  className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors TouchTarget"
                >
                  Back to Edit
                </button>
                
                <button
                  onClick={() => router.push('/recipes/import')}
                  className="w-full px-4 py-3 text-gray-600 hover:text-gray-700 text-sm font-medium TouchTarget"
                >
                  Start Over
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 Before Saving:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Double-check all measurements</li>
                <li>• Verify ingredient names</li>
                <li>• Review cooking instructions</li>
                <li>• Adjust servings if needed</li>
              </ul>
            </div>
          </div>
        </div>
    </StandardPageWrapper>
  );
}