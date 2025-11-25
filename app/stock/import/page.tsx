'use client';

import { useState } from 'react';
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/tab-separated-values'
      ];
      
      if (!validTypes.includes(selectedFile.type) && 
          !selectedFile.name.match(/\.(xlsx?|csv|tsv)$/i)) {
        setError('Please upload an Excel (.xlsx, .xls) or CSV file');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    
    setUploading(true);
    setAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/stock/import/analyze', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze file');
      }
      
      const result = await response.json();
      // Handle analysis result - for now just show success
      alert('File analyzed successfully! Import functionality will be connected in Phase 4.');
      
    } catch (err: any) {
      setError(err.message || 'Failed to analyze file');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  // Handle Google Sheets connection
  const handleConnectGoogleSheets = () => {
    // Redirect to Google OAuth
    window.location.href = '/api/auth/google';
  };

  // Show upload interface
  return (
    <StandardPageWrapper moduleName="STOCK" currentPage="import">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <span className="icon-[tabler--file-spreadsheet] w-16 h-16 mx-auto mb-4 text-blue-600"></span>
          <h1 className="text-3xl font-bold mb-2">Import Your Inventory</h1>
          <p className="text-gray-600">
            Connect Google Sheets or upload a file
          </p>
        </div>

        {/* Google Sheets Option */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-8 h-8" viewBox="0 0 48 48">
                  <path fill="#43a047" d="M37,45H11c-1.657,0-3-1.343-3-3V6c0-1.657,1.343-3,3-3h19l10,10v29C40,43.657,38.657,45,37,45z"/>
                  <path fill="#c8e6c9" d="M40 13L30 13 30 3z"/>
                  <path fill="#2e7d32" d="M30 13L40 23 40 13z"/>
                  <path fill="#fff" d="M22 23H17V28H22V23zM31 23H26V28H31V23zM22 30H17V35H22V30zM31 30H26V35H31V30z"/>
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2 text-gray-900">
                ✨ Recommended: Connect Google Sheets
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                One-click import from your existing Google Sheets. No downloads needed!
              </p>
              <button
                onClick={handleConnectGoogleSheets}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
              >
                Connect Google Sheets →
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Or upload a file</span>
          </div>
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 mb-6 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".xlsx,.xls,.csv,.tsv"
            onChange={handleFileSelect}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <span className="icon-[tabler--upload] w-12 h-12 text-gray-400 mb-4"></span>
            <span className="text-lg font-medium text-gray-700 mb-2">
              {file ? file.name : 'Click to upload or drag and drop'}
            </span>
            <span className="text-sm text-gray-500">
              Excel (.xlsx, .xls) or CSV files supported
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <span className="icon-[tabler--alert-circle] w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"></span>
            <div className="flex-1">
              <div className="font-medium text-red-900">Error</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            How It Works
          </h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Connect Google Sheets or upload Excel/CSV</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>AI analyzes your data and detects counting methods</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Review and confirm the detected settings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Import complete - start counting!</span>
            </li>
          </ol>
        </div>

        {/* Action Button for File Upload */}
        {file && (
          <button
            onClick={handleUploadAndAnalyze}
            disabled={uploading || analyzing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                Analyze & Import →
              </>
            )}
          </button>
        )}
      </div>
    </StandardPageWrapper>
  );
}