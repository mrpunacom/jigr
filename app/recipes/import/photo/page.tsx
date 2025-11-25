'use client';

import { useState, ChangeEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper';

export default function ImportRecipePhoto() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [sourceName, setSourceName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB for iPad Air)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large. Please choose a smaller image (max 10MB)');
      return;
    }

    setFileName(file.name);
    setError(null);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProcess = async () => {
    if (!image) return;

    setIsProcessing(true);
    setError(null);

    try {
      // For now, simulate the processing since Supabase is down
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock response data
      const mockResult = {
        success: true,
        session_id: 'mock-session-123',
        parsed: {
          recipe_name: 'Classic Chocolate Chip Cookies',
          servings: 24,
          portion_size: '1 cookie',
          prep_time_minutes: 15,
          cook_time_minutes: 12,
          ingredients: [
            {
              quantity: '2.25',
              unit: 'cups',
              ingredient: 'all-purpose flour',
              preparation: null,
              confidence: 0.95
            },
            {
              quantity: '1',
              unit: 'teaspoon',
              ingredient: 'baking soda',
              preparation: null,
              confidence: 0.92
            },
            {
              quantity: '1',
              unit: 'cup',
              ingredient: 'butter',
              preparation: 'softened',
              confidence: 0.88
            },
            {
              quantity: '2',
              unit: 'cups',
              ingredient: 'chocolate chips',
              preparation: null,
              confidence: 0.94
            }
          ],
          instructions: [
            'Preheat oven to 375°F (190°C)',
            'Mix flour and baking soda in a bowl',
            'Cream butter and sugars in separate bowl',
            'Add eggs and vanilla to butter mixture',
            'Gradually mix in flour mixture',
            'Stir in chocolate chips',
            'Drop rounded tablespoons on ungreased baking sheet',
            'Bake 9-11 minutes until golden brown'
          ],
          raw_ocr_text: 'Mock OCR text would appear here...',
          import_method: 'photo_ocr',
          source_name: sourceName || fileName,
          confidence: 0.91
        },
        warnings: [
          'AI extracted recipe - please verify all measurements',
          'Some ingredients may need manual review'
        ]
      };

      // Store in session storage for preview
      sessionStorage.setItem('recipe_import_preview', JSON.stringify(mockResult));
      router.push('/recipes/import/preview');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setFileName('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <StandardPageWrapper moduleName="RECIPES" currentPage="import">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Recipe from Photo</h1>
          <p className="text-gray-600">
            Photograph a recipe from a cookbook, magazine, or handwritten note. Our AI will extract the ingredients and instructions automatically.
          </p>
        </div>

        {/* Development Notice */}
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-8">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>Development Mode:</strong> This feature uses mock data for demonstration. Full OCR integration coming soon.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-8">
          {/* Camera/Upload Area */}
          <div className="mb-6">
            {image ? (
              // Show captured image
              <div className="space-y-4">
                <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={image}
                    alt="Recipe photo"
                    fill
                    className="object-contain"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{fileName}</p>
                  <button
                    onClick={clearImage}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              // Upload prompt
              <div 
                onClick={handleTakePhoto}
                className="w-full p-12 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors TouchTarget"
              >
                <div className="space-y-4">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-lg font-medium text-gray-900">Take Photo or Upload Image</p>
                    <p className="text-sm text-gray-500 mt-1">
                      PNG, JPG up to 10MB • Works best with clear, well-lit text
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment" // Uses back camera on mobile
              onChange={handleCapture}
              className="hidden"
            />
          </div>

          {/* Source Name (Optional) */}
          {image && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., 'Better Homes & Gardens, June 2023' or 'Grandma's Recipe Box'"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Help track where this recipe came from for future reference
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors TouchTarget"
            >
              Cancel
            </button>
            
            <button
              onClick={handleProcess}
              disabled={!image || isProcessing}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors TouchTarget"
            >
              {isProcessing ? (
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
                  Extracting Recipe...
                </span>
              ) : (
                'Extract Recipe Data'
              )}
            </button>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Photography Tips */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
            <h3 className="font-medium mb-2 text-blue-900">📸 Tips for Best Results:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ensure good lighting - avoid shadows</li>
              <li>• Keep camera steady and focus on text</li>
              <li>• Capture entire recipe (ingredients + instructions)</li>
              <li>• Avoid glare on glossy pages</li>
              <li>• For handwritten recipes, use clear writing</li>
              <li>• Take multiple photos if recipe spans pages</li>
            </ul>
          </div>

          {/* What Works Best */}
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
            <h3 className="font-medium mb-2 text-green-900">✅ Works Best With:</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Printed cookbooks and magazines</li>
              <li>• Recipe cards (typed or handwritten)</li>
              <li>• Printouts from websites</li>
              <li>• Clear handwritten notes</li>
              <li>• Recipe clippings</li>
              <li>• Menu cards with recipes</li>
            </ul>
          </div>
        </div>
    </StandardPageWrapper>
  );
}