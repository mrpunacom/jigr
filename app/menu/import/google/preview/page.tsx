'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper';

// Mock menu data for development
const mockMenuData = [
  {
    item_name: 'Caesar Salad',
    category: 'Salads',
    price: 14.00,
    target_food_cost_pct: 28,
    description: 'Fresh romaine lettuce with parmesan and croutons',
    confidence: 0.95,
    validation_status: 'good',
    validation_message: '',
    actual_food_cost_pct: 26.5,
    recipe_id: 'recipe-123',
    warnings: [],
    errors: []
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
    actual_food_cost_pct: 31.2,
    recipe_id: null,
    warnings: ['Food cost (31.2%) exceeds target (25%)'],
    errors: []
  },
  {
    item_name: 'Fish & Chips',
    category: 'Mains',
    price: 22.00,
    target_food_cost_pct: 32,
    description: 'Beer-battered cod with seasoned fries',
    confidence: 0.88,
    validation_status: 'good',
    validation_message: '',
    actual_food_cost_pct: 29.8,
    recipe_id: 'recipe-456',
    warnings: [],
    errors: []
  },
  {
    item_name: 'Chocolate Cake',
    category: 'Desserts',
    price: 8.50,
    target_food_cost_pct: 22,
    description: 'Rich chocolate layer cake',
    confidence: 0.90,
    validation_status: 'good',
    validation_message: '',
    actual_food_cost_pct: 20.1,
    recipe_id: null,
    warnings: [],
    errors: []
  },
  {
    item_name: 'Invalid Item',
    category: 'Test',
    price: 0,
    target_food_cost_pct: null,
    description: '',
    confidence: 0.45,
    validation_status: 'error',
    validation_message: 'Price is $0.00 - is this intentional?; Low confidence (45%) - please review',
    actual_food_cost_pct: null,
    recipe_id: null,
    warnings: ['Price is $0.00 - is this intentional?'],
    errors: ['Low confidence (45%) - please review']
  }
];

export default function MenuImportPreview() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [source, setSource] = useState<any>(null);

  useEffect(() => {
    loadPreview();
  }, []);

  const loadPreview = async () => {
    try {
      // Get selection from sessionStorage
      const selectionData = sessionStorage.getItem('menu_import_spreadsheet');
      if (!selectionData) {
        router.push('/menu/import/google');
        return;
      }

      const sourceData = JSON.parse(selectionData);
      setSource(sourceData);

      // Simulate loading and AI parsing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For development, use mock data
      // In production, this would call the API endpoints
      setItems(mockMenuData);

    } catch (error) {
      console.error('Preview error:', error);
      alert('Failed to load preview. Please try again.');
      router.push('/menu/import/google');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);

    try {
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Filter out error items for import count
      const validItems = items.filter(item => item.validation_status !== 'error');
      
      // Success! Clear session and redirect
      sessionStorage.removeItem('menu_import_spreadsheet');
      
      alert(`Success! ${validItems.length} menu items imported. ${items.length - validItems.length} items skipped due to errors.`);
      router.push('/menu');

    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import items. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <StandardPageWrapper moduleName="MENU" currentPage="import">
        <div className="text-center py-12">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div className="text-xl text-gray-900 mb-2">Analyzing menu data...</div>
          <div className="text-gray-600">
            Parsing spreadsheet • Validating pricing • Checking for duplicates
          </div>
        </div>
      </StandardPageWrapper>
    );
  }

  const errorItems = items.filter(item => item.validation_status === 'error');
  const warningItems = items.filter(item => item.validation_status === 'warning');
  const goodItems = items.filter(item => item.validation_status === 'good');

  return (
    <StandardPageWrapper moduleName="MENU" currentPage="import">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Menu Import</h1>
          <p className="text-gray-600">
            {items.length} items detected from "{source?.spreadsheetName}" → "{source?.sheetName}"
          </p>
        </div>

        {/* Source Info */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-lg">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V5H19V19Z" />
            </svg>
            <div>
              <h3 className="font-medium text-blue-900">{source?.spreadsheetName}</h3>
              <p className="text-sm text-blue-700">Sheet: {source?.sheetName}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{items.length}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-green-700">{goodItems.length}</div>
            <div className="text-sm text-green-600">Ready to Import</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-700">{warningItems.length}</div>
            <div className="text-sm text-yellow-600">Warnings</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-red-700">{errorItems.length}</div>
            <div className="text-sm text-red-600">Errors (skipped)</div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu Items</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Food Cost
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index} className={`
                    ${item.validation_status === 'error' 
                      ? 'bg-red-50' 
                      : item.validation_status === 'warning'
                      ? 'bg-yellow-50'
                      : 'bg-white'}
                  `}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.item_name}
                        </div>
                        {item.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.description}
                          </div>
                        )}
                        {item.confidence < 0.8 && (
                          <div className="text-xs text-orange-600 mt-1">
                            Low confidence: {Math.round(item.confidence * 100)}%
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.category || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm font-medium text-gray-900">
                        ${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
                      </div>
                      {item.target_food_cost_pct && (
                        <div className="text-xs text-gray-500">
                          Target: {item.target_food_cost_pct}%
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.actual_food_cost_pct ? (
                        <div>
                          <div className={`text-sm font-medium ${
                            item.validation_status === 'warning' ? 'text-orange-700' : 'text-green-700'
                          }`}>
                            {item.actual_food_cost_pct.toFixed(1)}%
                          </div>
                          {item.recipe_id && (
                            <div className="text-xs text-blue-600">
                              ← Linked to recipe
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">—</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        item.validation_status === 'good' 
                          ? 'bg-green-100 text-green-800'
                          : item.validation_status === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.validation_status === 'good' && '✓ Good'}
                        {item.validation_status === 'warning' && '⚠ Warning'}
                        {item.validation_status === 'error' && '✗ Error'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.validation_message && (
                        <div className={`text-xs ${
                          item.validation_status === 'error' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {item.validation_message}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary & Actions */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Import Summary</h3>
              <p className="text-sm text-gray-600 mt-1">
                {goodItems.length + warningItems.length} items will be imported • {errorItems.length} items will be skipped
              </p>
              {warningItems.length > 0 && (
                <p className="text-sm text-yellow-700 mt-1">
                  ⚠ {warningItems.length} item(s) have warnings - review pricing recommendations
                </p>
              )}
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors TouchTarget"
              >
                Back to Edit
              </button>
              
              <button
                onClick={handleImport}
                disabled={importing || (goodItems.length + warningItems.length) === 0}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors TouchTarget flex items-center"
              >
                {importing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Importing...
                  </>
                ) : (
                  `Import ${goodItems.length + warningItems.length} Items`
                )}
              </button>
            </div>
          </div>
        </div>
    </StandardPageWrapper>
  );
}