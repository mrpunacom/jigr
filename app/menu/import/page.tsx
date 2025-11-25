'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper';

export default function MenuImportHub() {
  const router = useRouter();

  return (
    <StandardPageWrapper moduleName="MENU" currentPage="import">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Import Menu</h1>
          <p className="text-gray-600 text-lg">
            Quickly import your menu pricing from spreadsheets and automatically validate against target food costs.
          </p>
        </div>

        {/* Development Notice */}
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-8">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>Development Mode:</strong> Menu import system ready for implementation. Database migration 033_menu.sql pending.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Banner */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-6 mb-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">2-3 hrs</div>
              <div className="text-sm text-gray-600">Time Saved</div>
              <div className="text-xs text-gray-500">vs manual entry</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">95%+</div>
              <div className="text-sm text-gray-600">Parse Accuracy</div>
              <div className="text-xs text-gray-500">menu formats supported</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">Auto</div>
              <div className="text-sm text-gray-600">Cost Validation</div>
              <div className="text-xs text-gray-500">catches pricing errors</div>
            </div>
          </div>
        </div>

        {/* Import Method */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-8 mb-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Import from Google Sheets
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Connect your menu spreadsheet and import items automatically. Our AI will parse your data, 
              validate pricing against target food costs, and link items to existing recipes when possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Features */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">✅ What's Included:</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Automatic menu item parsing from any spreadsheet format</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Price validation and food cost percentage calculations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Duplicate detection and conflict resolution</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Automatic linking to existing recipes in your library</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>Category organization and pricing insights</span>
                </li>
              </ul>
            </div>

            {/* Supported Formats */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">📋 Supported Formats:</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Standard menu lists (Item, Price, Category)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>POS system exports (Toast, Square, etc.)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Menu engineering spreadsheets with food cost %</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Custom formats - AI adapts automatically</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Multi-sheet workbooks with different sections</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => router.push('/menu/import/google')}
              className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors TouchTarget flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Connect Google Sheets
            </button>
          </div>
        </div>

        {/* Example Data Preview */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Example: What You'll See</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Menu Item</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-900">Category</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-900">Price</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-900">Target Cost %</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3">Caesar Salad</td>
                  <td className="py-2 px-3 text-gray-600">Salads</td>
                  <td className="py-2 px-3 text-right font-medium">$14.00</td>
                  <td className="py-2 px-3 text-right">28%</td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">✓ Good</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3">Margherita Pizza</td>
                  <td className="py-2 px-3 text-gray-600">Pizza</td>
                  <td className="py-2 px-3 text-right font-medium">$18.00</td>
                  <td className="py-2 px-3 text-right">25%</td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">⚠ Review</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Fish & Chips</td>
                  <td className="py-2 px-3 text-gray-600">Mains</td>
                  <td className="py-2 px-3 text-right font-medium">$22.00</td>
                  <td className="py-2 px-3 text-right">32%</td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">✓ Good</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Process Flow */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔄 How It Works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Connect</h4>
              <p className="text-xs text-gray-600">Select your Google Sheets menu spreadsheet</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Parse</h4>
              <p className="text-xs text-gray-600">AI extracts menu items, prices, and categories</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Validate</h4>
              <p className="text-xs text-gray-600">Check pricing, detect duplicates, link to recipes</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">4</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Import</h4>
              <p className="text-xs text-gray-600">Review and save to your menu library</p>
            </div>
          </div>
        </div>

        {/* Alternative Options */}
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-4">Need a different approach?</p>
          <div className="space-x-4">
            <Link 
              href="/menu/new" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add items manually →
            </Link>
            <Link 
              href="/menu" 
              className="text-gray-600 hover:text-gray-700 font-medium"
            >
              View existing menu →
            </Link>
          </div>
        </div>

        {/* Back Navigation */}
        <div className="text-center">
          <Link 
            href="/menu"
            className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Menu
          </Link>
        </div>
    </StandardPageWrapper>
  );
}