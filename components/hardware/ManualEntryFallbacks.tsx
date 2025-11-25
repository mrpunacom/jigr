'use client';

import { useState } from 'react';

// Manual Weight Entry Component
interface ManualWeightEntryProps {
  onWeightSubmit: (weight: number, isNet?: boolean) => void;
  placeholder?: string;
  showTareOption?: boolean;
  unit?: 'g' | 'kg' | 'oz' | 'lb';
}

export function ManualWeightEntry({
  onWeightSubmit,
  placeholder = "Enter weight...",
  showTareOption = false,
  unit = 'g'
}: ManualWeightEntryProps) {
  const [weight, setWeight] = useState('');
  const [tare, setTare] = useState('');
  const [isNetWeight, setIsNetWeight] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightValue = parseFloat(weight);
    const tareValue = parseFloat(tare) || 0;

    if (!isNaN(weightValue)) {
      const finalWeight = isNetWeight && tareValue > 0 
        ? weightValue + tareValue 
        : weightValue;
      onWeightSubmit(finalWeight, isNetWeight);
      setWeight('');
      setTare('');
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="icon-[tabler--scale] w-5 h-5 text-yellow-600"></span>
        <h3 className="font-medium text-yellow-800">Manual Weight Entry</h3>
        <span className="icon-[tabler--alert-circle] w-4 h-4 text-yellow-600"></span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-yellow-700 mb-1">
            Weight ({unit})
          </label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            style={{ minHeight: '48px' }} // iPad touch target
            required
          />
        </div>

        {showTareOption && (
          <>
            <div>
              <label className="block text-sm font-medium text-yellow-700 mb-1">
                Tare Weight ({unit}) - Optional
              </label>
              <input
                type="number"
                step="0.1"
                value={tare}
                onChange={(e) => setTare(e.target.value)}
                placeholder="Container weight..."
                className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                style={{ minHeight: '48px' }}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="net-weight"
                checked={isNetWeight}
                onChange={(e) => setIsNetWeight(e.target.checked)}
                className="w-4 h-4 text-yellow-600"
              />
              <label htmlFor="net-weight" className="text-sm text-yellow-700">
                Entered weight is net weight (without container)
              </label>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={!weight.trim()}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ minHeight: '48px' }}
        >
          <span className="icon-[tabler--calculator] w-4 h-4"></span>
          Submit Weight
        </button>
      </form>
      
      <p className="text-xs text-yellow-600 mt-2">
        💡 Use this when Bluetooth scale is not available
      </p>
    </div>
  );
}

// Manual Barcode Entry Component
interface ManualBarcodeEntryProps {
  onBarcodeSubmit: (barcode: string, source: string) => void;
  placeholder?: string;
  showHistory?: boolean;
}

export function ManualBarcodeEntry({
  onBarcodeSubmit,
  placeholder = "Enter barcode...",
  showHistory = true
}: ManualBarcodeEntryProps) {
  const [barcode, setBarcode] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      onBarcodeSubmit(barcode.trim(), 'Manual Entry');
      
      // Add to history (keep last 5)
      setHistory(prev => {
        const newHistory = [barcode.trim(), ...prev.slice(0, 4)];
        return newHistory.filter((item, index) => newHistory.indexOf(item) === index);
      });
      
      setBarcode('');
    }
  };

  const handleHistorySelect = (code: string) => {
    onBarcodeSubmit(code, 'History Selection');
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="icon-[tabler--camera] w-5 h-5 text-blue-600"></span>
        <h3 className="font-medium text-blue-800">Manual Barcode Entry</h3>
        <span className="icon-[tabler--alert-circle] w-4 h-4 text-blue-600"></span>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-blue-700 mb-1">
            Barcode Number
          </label>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
            style={{ minHeight: '48px' }} // iPad touch target
            autoComplete="off"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!barcode.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minHeight: '48px' }}
        >
          Submit Barcode
        </button>
      </form>

      {showHistory && history.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-blue-700 mb-2">Recent Entries:</h4>
          <div className="flex flex-wrap gap-2">
            {history.map((code, index) => (
              <button
                key={`${code}-${index}`}
                onClick={() => handleHistorySelect(code)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-mono hover:bg-blue-200 transition-colors"
                style={{ minHeight: '40px' }}
              >
                {code.length > 12 ? `${code.substring(0, 12)}...` : code}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-xs text-blue-600 mt-2">
        💡 Use this when camera scanning is not available
      </p>
    </div>
  );
}

// Hardware Status Indicator
interface HardwareStatusProps {
  bluetoothAvailable: boolean;
  bluetoothConnected: boolean;
  cameraAvailable: boolean;
  cameraActive: boolean;
  onToggleBluetooth?: () => void;
  onToggleCamera?: () => void;
}

export function HardwareStatus({
  bluetoothAvailable,
  bluetoothConnected,
  cameraAvailable,
  cameraActive,
  onToggleBluetooth,
  onToggleCamera
}: HardwareStatusProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="font-medium text-gray-800 mb-3">Hardware Status</h3>
      
      <div className="space-y-3">
        {/* Bluetooth Scale Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="icon-[tabler--scale] w-5 h-5 text-gray-600"></span>
            <div>
              <div className="font-medium text-sm">Bluetooth Scale</div>
              <div className="text-xs text-gray-500">
                {bluetoothAvailable ? (
                  bluetoothConnected ? (
                    <span className="text-green-600">✓ Connected & Active</span>
                  ) : (
                    <span className="text-yellow-600">⚬ Available - Not Connected</span>
                  )
                ) : (
                  <span className="text-red-600">✗ Not Available</span>
                )}
              </div>
            </div>
          </div>
          
          {bluetoothAvailable && onToggleBluetooth && (
            <button
              onClick={onToggleBluetooth}
              className={`px-3 py-1 rounded text-sm font-medium ${
                bluetoothConnected
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              style={{ minHeight: '36px' }}
            >
              {bluetoothConnected ? 'Disconnect' : 'Connect'}
            </button>
          )}
        </div>

        {/* Camera Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="icon-[tabler--camera] w-5 h-5 text-gray-600"></span>
            <div>
              <div className="font-medium text-sm">Camera Scanner</div>
              <div className="text-xs text-gray-500">
                {cameraAvailable ? (
                  cameraActive ? (
                    <span className="text-green-600">✓ Active & Scanning</span>
                  ) : (
                    <span className="text-yellow-600">⚬ Available - Not Active</span>
                  )
                ) : (
                  <span className="text-red-600">✗ Not Available</span>
                )}
              </div>
            </div>
          </div>
          
          {cameraAvailable && onToggleCamera && (
            <button
              onClick={onToggleCamera}
              className={`px-3 py-1 rounded text-sm font-medium ${
                cameraActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              style={{ minHeight: '36px' }}
            >
              {cameraActive ? 'Stop' : 'Start'}
            </button>
          )}
        </div>
      </div>

      {/* Fallback Notice */}
      {(!bluetoothAvailable || !cameraAvailable) && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-700">
            <strong>Manual Entry Available:</strong> When hardware is unavailable, 
            you can manually enter weights and barcodes using the fallback forms above.
          </p>
        </div>
      )}
    </div>
  );
}

// Combined Fallback Component
interface HardwareFallbackProps {
  onWeightSubmit: (weight: number, isNet?: boolean) => void;
  onBarcodeSubmit: (barcode: string, source: string) => void;
  showWeight?: boolean;
  showBarcode?: boolean;
  bluetoothStatus?: {
    available: boolean;
    connected: boolean;
    onToggle?: () => void;
  };
  cameraStatus?: {
    available: boolean;
    active: boolean;
    onToggle?: () => void;
  };
}

export default function HardwareFallback({
  onWeightSubmit,
  onBarcodeSubmit,
  showWeight = true,
  showBarcode = true,
  bluetoothStatus,
  cameraStatus
}: HardwareFallbackProps) {
  return (
    <div className="space-y-4">
      {/* Hardware Status */}
      {(bluetoothStatus || cameraStatus) && (
        <HardwareStatus
          bluetoothAvailable={bluetoothStatus?.available || false}
          bluetoothConnected={bluetoothStatus?.connected || false}
          cameraAvailable={cameraStatus?.available || false}
          cameraActive={cameraStatus?.active || false}
          onToggleBluetooth={bluetoothStatus?.onToggle}
          onToggleCamera={cameraStatus?.onToggle}
        />
      )}

      {/* Manual Entry Forms */}
      {showWeight && (
        <ManualWeightEntry
          onWeightSubmit={onWeightSubmit}
          showTareOption={true}
        />
      )}

      {showBarcode && (
        <ManualBarcodeEntry
          onBarcodeSubmit={onBarcodeSubmit}
          showHistory={true}
        />
      )}

      {/* Tips */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-2">Hardware Tips</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Ensure your device has HTTPS enabled for camera/Bluetooth access</li>
          <li>• Grant camera and Bluetooth permissions when prompted</li>
          <li>• Turn on your Bluetooth scale before connecting</li>
          <li>• Use manual entry as backup when hardware fails</li>
          <li>• iPad Air 2013: Safari 12+ required for full compatibility</li>
        </ul>
      </div>
    </div>
  );
}