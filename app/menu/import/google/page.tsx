'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper';

// Mock Google Sheets data for development
const mockSpreadsheets = [
  {
    id: 'mock-menu-sheet-1',
    name: 'Restaurant Menu Pricing 2025',
    modifiedTime: '2025-11-20T10:30:00Z',
    webViewLink: 'https://docs.google.com/spreadsheets/d/mock-menu-sheet-1'
  },
  {
    id: 'mock-menu-sheet-2', 
    name: 'POS Export - November Menu',
    modifiedTime: '2025-11-19T15:45:00Z',
    webViewLink: 'https://docs.google.com/spreadsheets/d/mock-menu-sheet-2'
  },
  {
    id: 'mock-menu-sheet-3',
    name: 'Menu Engineering Analysis',
    modifiedTime: '2025-11-18T09:15:00Z',
    webViewLink: 'https://docs.google.com/spreadsheets/d/mock-menu-sheet-3'
  }
];

const mockSheets = {
  'mock-menu-sheet-1': ['Menu Items', 'Pricing Analysis', 'Categories'],
  'mock-menu-sheet-2': ['November Menu', 'Daily Specials', 'Drink Menu'],
  'mock-menu-sheet-3': ['Food Cost Analysis', 'Menu Mix', 'Profit Margins']
};

export default function MenuImportGoogleSheets() {
  const router = useRouter();
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<any>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSpreadsheets();
  }, []);

  const loadSpreadsheets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For development, use mock data
      // In production, this would call: await listSpreadsheets();
      setSpreadsheets(mockSpreadsheets);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load spreadsheets');
    } finally {
      setLoading(false);
    }
  };

  const handleSpreadsheetSelect = async (spreadsheet: any) => {
    setSelectedSpreadsheet(spreadsheet);
    setLoading(true);
    setError(null);
    
    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For development, use mock data
      // In production, this would call: await listSheets(spreadsheet.id);
      const sheetsList = mockSheets[spreadsheet.id] || ['Sheet1'];
      setSheets(sheetsList);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleSheetSelect = (sheetName: string) => {
    setSelectedSheet(sheetName);
  };

  const handleContinue = () => {
    if (selectedSpreadsheet && selectedSheet) {
      // Store selection in sessionStorage
      sessionStorage.setItem('menu_import_spreadsheet', JSON.stringify({
        spreadsheetId: selectedSpreadsheet.id,
        spreadsheetName: selectedSpreadsheet.name,
        sheetName: selectedSheet,
        webViewLink: selectedSpreadsheet.webViewLink
      }));
      
      // Navigate to preview
      router.push('/menu/import/google/preview');
    }
  };

  const handleGoBack = () => {
    if (selectedSpreadsheet) {
      setSelectedSpreadsheet(null);
      setSheets([]);
      setSelectedSheet('');
    } else {
      router.back();
    }
  };

  return (
    <StandardPageWrapper moduleName="MENU" currentPage="import">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-gray-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {selectedSpreadsheet ? 'Select Sheet' : 'Select Spreadsheet'}
          </h1>
          <p className="text-gray-600">
            {selectedSpreadsheet 
              ? `Choose which sheet contains your menu data from "${selectedSpreadsheet.name}"`
              : 'Choose your Google Sheets menu spreadsheet to import'
            }
          </p>
        </div>

        {/* Development Notice */}
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>Development Mode:</strong> Using mock spreadsheet data. Google Sheets integration ready for backend implementation.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">
              {selectedSpreadsheet ? 'Loading sheets...' : 'Loading spreadsheets...'}
            </p>
          </div>
        )}

        {/* Spreadsheet Selection */}
        {!selectedSpreadsheet && !loading && (
          <div className="space-y-4">
            {spreadsheets.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Spreadsheets Found</h3>
                <p className="text-gray-600 mb-4">
                  Make sure you have Google Sheets with menu data in your Google Drive.
                </p>
                <button
                  onClick={loadSpreadsheets}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            ) : (
              spreadsheets.map((spreadsheet) => (
                <button
                  key={spreadsheet.id}
                  onClick={() => handleSpreadsheetSelect(spreadsheet)}
                  className="w-full p-6 bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 hover:shadow-md transition-all duration-200 text-left TouchTarget"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <svg className="w-6 h-6 text-green-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V5H19V19Z" />
                          <path d="M14,17H7V15H14V17M17,13H7V11H17V13M17,9H7V7H17V9Z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {spreadsheet.name}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Last modified: {new Date(spreadsheet.modifiedTime).toLocaleDateString()}
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Sheet Selection */}
        {selectedSpreadsheet && !loading && (
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-blue-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V5H19V19Z" />
                </svg>
                <div>
                  <h3 className="font-medium text-blue-900">{selectedSpreadsheet.name}</h3>
                  <p className="text-sm text-blue-700">Select which sheet contains your menu data:</p>
                </div>
              </div>
            </div>

            {sheets.map((sheetName) => (
              <button
                key={sheetName}
                onClick={() => handleSheetSelect(sheetName)}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left TouchTarget ${
                  selectedSheet === sheetName
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium text-gray-900">{sheetName}</span>
                  </div>
                  {selectedSheet === sheetName && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Continue Button */}
        {selectedSheet && (
          <div className="mt-8 flex gap-4">
            <button
              onClick={handleGoBack}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors TouchTarget"
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors TouchTarget"
            >
              Continue to Preview →
            </button>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 bg-gray-100 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">💡 Tips for Best Results:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Make sure your sheet has columns for item name and price</li>
            <li>• Include category information if available</li>
            <li>• Add target food cost percentage for automatic validation</li>
            <li>• First row should contain column headers</li>
          </ul>
        </div>
    </StandardPageWrapper>
  );
}