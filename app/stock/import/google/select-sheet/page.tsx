'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, ExternalLink, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Spreadsheet {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
}

interface Sheet {
  id: number;
  name: string;
  rowCount: number;
  columnCount: number;
}

export default function SelectSheetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetName, setSpreadsheetName] = useState<string>('');
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [selectedSheetName, setSelectedSheetName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load spreadsheets on mount
  useEffect(() => {
    loadSpreadsheets();
  }, []);

  // Show success message
  useEffect(() => {
    if (success === 'true') {
      // Could show a toast notification here
    }
  }, [success]);

  const loadSpreadsheets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stock/import/google/sheets');
      
      if (!response.ok) {
        throw new Error('Failed to load spreadsheets');
      }
      
      const data = await response.json();
      setSpreadsheets(data.spreadsheets || []);
      
    } catch (err: any) {
      console.error('Failed to load spreadsheets:', err);
      setError(err.message || 'Failed to load your Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSpreadsheet = async (spreadsheet: Spreadsheet) => {
    setSelectedSpreadsheetId(spreadsheet.id);
    setSelectedSheetName(null);
    setSheets([]);
    setLoadingSheets(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stock/import/google/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheet_id: spreadsheet.id })
      });
      
      if (!response.ok) {
        throw new Error('Failed to load sheets');
      }
      
      const data = await response.json();
      setSpreadsheetName(data.spreadsheet_name);
      setSheets(data.sheets || []);
      
    } catch (err: any) {
      console.error('Failed to load sheets:', err);
      setError(err.message || 'Failed to load sheet tabs');
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleSelectSheet = (sheetName: string) => {
    setSelectedSheetName(sheetName);
  };

  const handleAnalyze = async () => {
    if (!selectedSpreadsheetId || !selectedSheetName) return;
    
    setAnalyzing(true);
    setError(null);
    
    try {
      // Read sheet data
      const readResponse = await fetch('/api/stock/import/google/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheet_id: selectedSpreadsheetId,
          sheet_name: selectedSheetName
        })
      });
      
      if (!readResponse.ok) {
        throw new Error('Failed to read sheet data');
      }
      
      const readData = await readResponse.json();
      
      // For now, just show success message
      // In Phase 4, this would integrate with the existing preview/analysis flow
      alert(`Successfully read sheet data!\nSpreadsheet: ${spreadsheetName}\nSheet: ${selectedSheetName}\nRows: ${readData.parsed.rowCount}\nColumns: ${readData.parsed.headers.length}\n\nAnalysis and import preview will be integrated in Phase 4.`);
      
    } catch (err: any) {
      console.error('Failed to analyze sheet:', err);
      setError(err.message || 'Failed to analyze sheet');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your Google Sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.push('/stock/import')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Select Google Sheet</h1>
            <p className="text-gray-600">
              Choose the spreadsheet and sheet tab containing your inventory
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spreadsheet List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Your Spreadsheets ({spreadsheets.length})
          </h3>
          
          {spreadsheets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No Google Sheets found</p>
              <p className="text-sm mt-2">Create a spreadsheet in Google Sheets first</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {spreadsheets.map((sheet) => (
                <button
                  key={sheet.id}
                  onClick={() => handleSelectSpreadsheet(sheet)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedSpreadsheetId === sheet.id
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-green-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{sheet.name}</div>
                      <div className="text-sm text-gray-500">
                        Modified {new Date(sheet.modifiedTime).toLocaleDateString()}
                      </div>
                    </div>
                    <a
                      href={sheet.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-700 p-1"
                      title="Open in Google Sheets"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sheet Tabs */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold mb-4">
            Sheet Tabs {sheets.length > 0 && `(${sheets.length})`}
          </h3>
          
          {loadingSheets ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading sheets...</p>
            </div>
          ) : sheets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>← Select a spreadsheet first</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {sheets.map((sheet) => (
                <button
                  key={sheet.id}
                  onClick={() => handleSelectSheet(sheet.name)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedSheetName === sheet.name
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="font-medium mb-1">{sheet.name}</div>
                  <div className="text-sm text-gray-500">
                    {sheet.rowCount.toLocaleString()} rows × {sheet.columnCount} columns
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedSpreadsheetId && selectedSheetName ? (
            <span className="text-green-600 font-medium">
              ✓ Ready to analyze: {spreadsheetName} → {selectedSheetName}
            </span>
          ) : (
            <span>Select a spreadsheet and sheet tab to continue</span>
          )}
        </div>
        
        <button
          onClick={handleAnalyze}
          disabled={!selectedSpreadsheetId || !selectedSheetName || analyzing}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 shadow-md"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            'Analyze & Import →'
          )}
        </button>
      </div>
    </div>
  );
}