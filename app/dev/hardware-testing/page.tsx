'use client';

import { useState } from 'react';
import { 
  Scale, 
  Camera, 
  Printer, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Smartphone 
} from 'lucide-react';

// Import our hardware components
import BluetoothScaleConnector from '@/components/hardware/BluetoothScaleConnector';
import WeightDisplay from '@/components/hardware/WeightDisplay';
import BarcodeScanner from '@/components/hardware/BarcodeScanner';
import LabelPrinter from '@/components/hardware/LabelPrinter';
import HardwareDiagnostics from '@/components/hardware/HardwareDiagnostics';
import HardwareFallback from '@/components/hardware/ManualEntryFallbacks';

export default function HardwareTestingPage() {
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [tareWeight, setTareWeight] = useState<number | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [testData, setTestData] = useState({
    itemName: 'Test Item - Frozen Chicken Breast',
    containerType: 'Food Storage Container - 2L',
    useByDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    customText: 'Handle with care - Keep refrigerated'
  });

  const handleWeightChange = (weight: number, stable: boolean) => {
    if (stable) {
      setCurrentWeight(weight);
    }
  };

  const handleBarcodeSubmit = (barcode: string, source: string) => {
    setScannedBarcode(barcode);
    setShowBarcodeScanner(false);
    console.log(`Barcode scanned from ${source}:`, barcode);
  };

  const handleManualWeight = (weight: number, isNet?: boolean) => {
    setCurrentWeight(weight);
    console.log(`Manual weight entry: ${weight}g (${isNet ? 'net' : 'gross'})`);
  };

  const handleManualBarcode = (barcode: string, source: string) => {
    setScannedBarcode(barcode);
    console.log(`Manual barcode entry from ${source}:`, barcode);
  };

  const setTare = () => {
    if (currentWeight !== null) {
      setTareWeight(currentWeight);
    }
  };

  const clearAll = () => {
    setCurrentWeight(null);
    setTareWeight(null);
    setScannedBarcode('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Hardware Integration Testing
                </h1>
                <p className="text-gray-600 mt-1">
                  Test Bluetooth scales, barcode scanners, and label printers for iPad Air 2013
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">iPad Air 2013 Compatible</span>
            </div>
          </div>

          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-5 h-5 text-gray-600" />
                <span className="font-medium">Current Weight</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {currentWeight !== null ? `${currentWeight.toFixed(1)}g` : '—'}
              </div>
              <div className="text-sm text-gray-500">
                Tare: {tareWeight !== null ? `${tareWeight.toFixed(1)}g` : '—'}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-5 h-5 text-gray-600" />
                <span className="font-medium">Scanned Barcode</span>
              </div>
              <div className="text-lg font-mono text-gray-900 break-all">
                {scannedBarcode || '—'}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 flex flex-col justify-center">
              <button
                onClick={clearAll}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
                style={{ minHeight: '48px' }}
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>

        {/* Hardware Diagnostics */}
        <div className="mb-6">
          <HardwareDiagnostics />
        </div>

        {/* Main Testing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bluetooth Scale Testing */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Scale className="w-6 h-6" />
              Bluetooth Scale Testing
            </h2>

            {/* Scale Connector */}
            <BluetoothScaleConnector
              onWeightChange={handleWeightChange}
              showConnectionButton={true}
            />

            {/* Weight Display */}
            <WeightDisplay
              weight={currentWeight}
              tare={tareWeight}
              showNet={true}
              large={true}
            />

            {/* Tare Controls */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Scale Controls</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={setTare}
                  disabled={currentWeight === null}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ minHeight: '48px' }}
                >
                  Set Tare Weight
                </button>
                <button
                  onClick={() => setTareWeight(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium"
                  style={{ minHeight: '48px' }}
                >
                  Clear Tare
                </button>
              </div>
            </div>
          </div>

          {/* Barcode Scanner Testing */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Camera className="w-6 h-6" />
              Barcode Scanner Testing
            </h2>

            {/* Scanner Controls */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Camera Scanner</h3>
              <button
                onClick={() => setShowBarcodeScanner(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                style={{ minHeight: '48px' }}
              >
                <Camera className="w-5 h-5" />
                Open Camera Scanner
              </button>
              
              {scannedBarcode && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-700 mb-1">Last Scanned:</div>
                  <div className="font-mono text-green-900 break-all">{scannedBarcode}</div>
                </div>
              )}
            </div>

            {/* Test Data Configuration */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Test Data Configuration</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={testData.itemName}
                    onChange={(e) => setTestData({...testData, itemName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ minHeight: '48px' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Container Type
                  </label>
                  <input
                    type="text"
                    value={testData.containerType}
                    onChange={(e) => setTestData({...testData, containerType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ minHeight: '48px' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Use By Date
                  </label>
                  <input
                    type="date"
                    value={testData.useByDate}
                    onChange={(e) => setTestData({...testData, useByDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ minHeight: '48px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Label Printer Testing */}
        <div className="mt-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Printer className="w-6 h-6" />
            Label Printer Testing
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Container Label */}
            <LabelPrinter
              barcode={scannedBarcode || 'JIGR-C-001234'}
              containerType={testData.containerType}
              tareWeight={tareWeight || 250}
              itemName={testData.itemName}
              useByDate={testData.useByDate}
              customText={testData.customText}
              labelType="container"
              onPrinted={() => console.log('Container label printed')}
            />

            {/* Item Label */}
            <LabelPrinter
              barcode={scannedBarcode || 'JIGR-I-567890'}
              containerType={testData.containerType}
              itemName={testData.itemName}
              useByDate={testData.useByDate}
              labelType="item"
              onPrinted={() => console.log('Item label printed')}
            />
          </div>
        </div>

        {/* Manual Entry Fallbacks */}
        <div className="mt-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6" />
            Manual Entry Fallbacks
          </h2>

          <HardwareFallback
            onWeightSubmit={handleManualWeight}
            onBarcodeSubmit={handleManualBarcode}
            showWeight={true}
            showBarcode={true}
          />
        </div>

        {/* Test Results Summary */}
        <div className="mt-6 bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Testing Summary
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">Weight Measurement</span>
              </div>
              <div className="text-sm text-gray-600">
                {currentWeight !== null ? 
                  `✓ Active: ${currentWeight.toFixed(1)}g` : 
                  '⚬ No weight data'
                }
                <br />
                {tareWeight !== null ? 
                  `✓ Tare set: ${tareWeight.toFixed(1)}g` : 
                  '⚬ No tare set'
                }
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">Barcode Scanning</span>
              </div>
              <div className="text-sm text-gray-600">
                {scannedBarcode ? 
                  `✓ Scanned: ${scannedBarcode.substring(0, 15)}...` : 
                  '⚬ No barcode scanned'
                }
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">Label Generation</span>
              </div>
              <div className="text-sm text-gray-600">
                ✓ Ready to print
                <br />
                ✓ PDF download available
              </div>
            </div>
          </div>
        </div>

        {/* iPad Air 2013 Compatibility Notes */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-800 mb-3">
            iPad Air 2013 Testing Notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <h4 className="font-semibold mb-2">✓ Verified Features:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>48px minimum touch targets</li>
                <li>Safari 12+ compatibility checks</li>
                <li>HTTPS requirement validation</li>
                <li>Manual entry fallbacks</li>
                <li>Performance optimizations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📝 Test Checklist:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Connect Bluetooth scale successfully</li>
                <li>Scan barcodes with camera</li>
                <li>Print labels to Brother/Dymo printer</li>
                <li>Test manual entry fallbacks</li>
                <li>Verify error handling works</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeSubmit}
          onClose={() => setShowBarcodeScanner(false)}
          title="Test Barcode Scanner"
          allowManualEntry={true}
          autoClose={true}
        />
      )}
    </div>
  );
}