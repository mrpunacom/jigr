'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ImportMethod {
  id: 'photo' | 'url' | 'sheets' | 'manual'
  name: string
  description: string
  icon: React.ComponentType<any>
  supported: boolean
}

interface RecipeData {
  name: string
  description?: string
  servings?: number
  prep_time?: number
  cook_time?: number
  total_time?: number
  ingredients: Array<{
    name: string
    quantity: number
    unit: string
    notes?: string
    cost?: number
  }>
  instructions: Array<{
    step: number
    instruction: string
    time?: number
  }>
  nutrition?: {
    calories?: number
    protein?: number
    fat?: number
    carbohydrates?: number
  }
  category?: string
  cuisine?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  source?: string
  notes?: string
}

interface ImportResult {
  status: 'success' | 'error' | 'processing'
  data?: RecipeData
  error?: string
  confidence?: number
  processing_time?: number
}

interface UniversalRecipeImporterProps {
  onComplete?: (recipe: RecipeData) => void
  onCancel?: () => void
  className?: string
}

export function UniversalRecipeImporter({ 
  onComplete, 
  onCancel, 
  className = '' 
}: UniversalRecipeImporterProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [urlValue, setUrlValue] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const importMethods: ImportMethod[] = [
    {
      id: 'photo',
      name: 'Photo Upload',
      description: 'Import from recipe photo or screenshot',
      icon: () => <span className="icon-[tabler--camera] h-12 w-12 text-blue-600 mx-auto mb-4"></span>,
      supported: true
    },
    {
      id: 'url', 
      name: 'Website URL',
      description: 'Extract from recipe websites',
      icon: () => <span className="icon-[tabler--link] h-12 w-12 text-blue-600 mx-auto mb-4"></span>,
      supported: true
    },
    {
      id: 'sheets',
      name: 'Google Sheets',
      description: 'Import from spreadsheet',
      icon: () => <span className="icon-[tabler--table] h-12 w-12 text-blue-600 mx-auto mb-4"></span>,
      supported: true
    },
    {
      id: 'manual',
      name: 'Manual Entry',
      description: 'Create from scratch',
      icon: () => <span className="icon-[tabler--file-text] h-12 w-12 text-blue-600 mx-auto mb-4"></span>,
      supported: true
    }
  ]

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method)
    setResult(null)
    
    // Auto-focus inputs
    if (method === 'url') {
      setTimeout(() => urlInputRef.current?.focus(), 100)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      setResult({ status: 'error', error: 'Please select a valid image file' })
      return
    }

    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('enhance_extraction', 'true')
      formData.append('include_nutrition', 'true')

      const response = await fetch('/api/recipes/import/photo', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      setResult({
        status: 'success',
        data: data.recipe,
        confidence: data.confidence,
        processing_time: data.processing_time
      })

    } catch (error) {
      console.error('Photo import failed:', error)
      setResult({
        status: 'error',
        error: 'Failed to process recipe photo. Please try again or use a clearer image.'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUrlImport = async () => {
    if (!urlValue.trim()) {
      setResult({ status: 'error', error: 'Please enter a valid URL' })
      return
    }

    // Basic URL validation
    try {
      new URL(urlValue)
    } catch {
      setResult({ status: 'error', error: 'Please enter a valid URL' })
      return
    }

    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/recipes/import/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          url: urlValue,
          extract_nutrition: true,
          match_ingredients: true
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      setResult({
        status: 'success',
        data: data.recipe,
        confidence: data.confidence,
        processing_time: data.processing_time
      })

    } catch (error) {
      console.error('URL import failed:', error)
      setResult({
        status: 'error',
        error: 'Failed to extract recipe from URL. Please check the URL and try again.'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSheetsImport = async () => {
    // Navigate to Google Sheets integration
    router.push('/recipes/import/sheets')
  }

  const handleManualEntry = () => {
    // Navigate to manual recipe creation
    router.push('/recipes/new')
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handlePhotoUpload(file)
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(false)
    
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handlePhotoUpload(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setDragActive(false)
  }

  const handleAcceptRecipe = () => {
    if (result?.data && onComplete) {
      onComplete(result.data)
    }
  }

  const handleEditRecipe = () => {
    if (result?.data) {
      // Navigate to recipe editor with imported data
      const recipeData = encodeURIComponent(JSON.stringify(result.data))
      router.push(`/recipes/edit?import_data=${recipeData}`)
    }
  }

  const retryImport = () => {
    setResult(null)
    if (selectedMethod === 'url' && urlValue) {
      handleUrlImport()
    }
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Recipe</h1>
        <p className="text-gray-600">Choose your preferred import method</p>
      </div>

      {/* Method Selection */}
      {!selectedMethod && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {importMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              disabled={!method.supported}
              className={`p-6 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors 
                ${method.supported 
                  ? 'hover:bg-blue-50 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed bg-gray-50'
                }`}
            >
              <method.icon />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.name}</h3>
              <p className="text-sm text-gray-600">{method.description}</p>
              {!method.supported && (
                <p className="text-xs text-amber-600 mt-2 font-medium">Coming Soon</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Selected Method Interface */}
      {selectedMethod && (
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          {/* Method Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {(() => {
                const method = importMethods.find(m => m.id === selectedMethod)
                if (!method) return null
                const IconComponent = method.icon
                return (
                  <>
                    {method.id === 'photo' && <span className="icon-[tabler--camera] h-6 w-6 text-blue-600"></span>}
                    {method.id === 'url' && <span className="icon-[tabler--link] h-6 w-6 text-blue-600"></span>}
                    {method.id === 'sheets' && <span className="icon-[tabler--table] h-6 w-6 text-blue-600"></span>}
                    {method.id === 'manual' && <span className="icon-[tabler--file-text] h-6 w-6 text-blue-600"></span>}
                    <h2 className="text-xl font-semibold text-gray-900">{method.name}</h2>
                  </>
                )
              })()}
            </div>
            <button
              onClick={() => {
                setSelectedMethod(null)
                setResult(null)
                setUrlValue('')
              }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <span className="icon-[tabler--x] h-5 w-5"></span>
            </button>
          </div>

          {/* Photo Upload Interface */}
          {selectedMethod === 'photo' && (
            <div>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
                  ${dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                  }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <span className="icon-[tabler--camera] h-12 w-12 text-gray-400 mx-auto mb-4"></span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Recipe Photo
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop an image here, or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Choose Image'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: JPEG, PNG, WebP. Max size: 10MB.
              </p>
            </div>
          )}

          {/* URL Import Interface */}
          {selectedMethod === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Website URL
              </label>
              <div className="flex space-x-2">
                <input
                  ref={urlInputRef}
                  type="url"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  placeholder="https://www.example.com/recipe"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleUrlImport()}
                  disabled={isProcessing}
                />
                <button
                  onClick={handleUrlImport}
                  disabled={isProcessing || !urlValue.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Importing...' : 'Import'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Supports most recipe websites including AllRecipes, Food Network, etc.
              </p>
            </div>
          )}

          {/* Google Sheets Interface */}
          {selectedMethod === 'sheets' && (
            <div className="text-center">
              <span className="icon-[tabler--table] h-16 w-16 text-blue-600 mx-auto mb-4"></span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Import from Google Sheets
              </h3>
              <p className="text-gray-600 mb-6">
                Connect your Google account and select a spreadsheet with recipe data
              </p>
              <button
                onClick={handleSheetsImport}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Connect Google Sheets
              </button>
            </div>
          )}

          {/* Manual Entry Interface */}
          {selectedMethod === 'manual' && (
            <div className="text-center">
              <span className="icon-[tabler--file-text] h-16 w-16 text-blue-600 mx-auto mb-4"></span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Create Recipe Manually
              </h3>
              <p className="text-gray-600 mb-6">
                Use our recipe builder to enter ingredients and instructions
              </p>
              <button
                onClick={handleManualEntry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Start Recipe Builder
              </button>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="icon-[tabler--loader-2] h-5 w-5 text-blue-600 animate-spin"></span>
                <div>
                  <p className="text-blue-900 font-medium">Processing Recipe</p>
                  <p className="text-blue-700 text-sm">
                    {selectedMethod === 'photo' 
                      ? 'Extracting text and analyzing ingredients...'
                      : 'Fetching and parsing recipe data...'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mt-6">
              {result.status === 'success' && result.data && (
                <div className="border border-green-200 bg-green-50 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="icon-[tabler--check] h-5 w-5 text-green-600"></span>
                      <h3 className="font-semibold text-green-900">Recipe Imported Successfully!</h3>
                    </div>
                    {result.confidence && (
                      <span className="text-sm text-green-700">
                        Confidence: {(result.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {/* Recipe Preview */}
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{result.data.name}</h4>
                    {result.data.description && (
                      <p className="text-gray-600 text-sm mb-3">{result.data.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      {result.data.servings && (
                        <div>
                          <span className="text-gray-500">Servings:</span>
                          <span className="ml-1 font-medium">{result.data.servings}</span>
                        </div>
                      )}
                      {result.data.prep_time && (
                        <div>
                          <span className="text-gray-500">Prep:</span>
                          <span className="ml-1 font-medium">{result.data.prep_time} min</span>
                        </div>
                      )}
                      {result.data.cook_time && (
                        <div>
                          <span className="text-gray-500">Cook:</span>
                          <span className="ml-1 font-medium">{result.data.cook_time} min</span>
                        </div>
                      )}
                      {result.data.total_time && (
                        <div>
                          <span className="text-gray-500">Total:</span>
                          <span className="ml-1 font-medium">{result.data.total_time} min</span>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">
                          Ingredients ({result.data.ingredients.length})
                        </h5>
                        <div className="space-y-1 text-sm">
                          {result.data.ingredients.slice(0, 5).map((ingredient, index) => (
                            <div key={index} className="text-gray-700">
                              {ingredient.quantity} {ingredient.unit} {ingredient.name}
                            </div>
                          ))}
                          {result.data.ingredients.length > 5 && (
                            <div className="text-gray-500 italic">
                              +{result.data.ingredients.length - 5} more ingredients
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">
                          Instructions ({result.data.instructions.length})
                        </h5>
                        <div className="space-y-1 text-sm">
                          {result.data.instructions.slice(0, 3).map((instruction, index) => (
                            <div key={index} className="text-gray-700">
                              {index + 1}. {instruction.instruction.substring(0, 80)}
                              {instruction.instruction.length > 80 && '...'}
                            </div>
                          ))}
                          {result.data.instructions.length > 3 && (
                            <div className="text-gray-500 italic">
                              +{result.data.instructions.length - 3} more steps
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={handleAcceptRecipe}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <span className="icon-[tabler--check] h-4 w-4"></span>
                      <span>Accept Recipe</span>
                    </button>
                    
                    <button
                      onClick={handleEditRecipe}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <span className="icon-[tabler--edit] h-4 w-4"></span>
                      <span>Edit & Review</span>
                    </button>
                  </div>
                </div>
              )}

              {result.status === 'error' && (
                <div className="border border-red-200 bg-red-50 rounded-lg p-6">
                  <div className="flex items-start space-x-2 mb-4">
                    <span className="icon-[tabler--alert-triangle] h-5 w-5 text-red-600 mt-0.5"></span>
                    <div>
                      <h3 className="font-semibold text-red-900">Import Failed</h3>
                      <p className="text-red-700 text-sm mt-1">{result.error}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={retryImport}
                      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <span className="icon-[tabler--refresh] h-4 w-4"></span>
                      <span>Try Again</span>
                    </button>
                    
                    <button
                      onClick={() => setSelectedMethod(null)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Choose Different Method
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cancel Button */}
      {onCancel && (
        <div className="mt-6 text-center">
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 underline"
          >
            Cancel Import
          </button>
        </div>
      )}
    </div>
  )
}