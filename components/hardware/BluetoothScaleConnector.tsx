'use client';

import { useBluetoothScale } from '@/hooks/useBluetoothScale';
import { useEffect } from 'react';

interface BluetoothScaleConnectorProps {
  onWeightChange?: (weight: number, stable: boolean) => void;
  autoConnect?: boolean;
  showConnectionButton?: boolean;
}

export default function BluetoothScaleConnector({
  onWeightChange,
  autoConnect = false,
  showConnectionButton = true
}: BluetoothScaleConnectorProps) {
  const {
    isConnected,
    isConnecting,
    currentWeight,
    error,
    connect,
    disconnect,
    tare,
    deviceName
  } = useBluetoothScale();

  // Call parent callback when weight changes
  useEffect(() => {
    if (currentWeight && onWeightChange) {
      onWeightChange(currentWeight.weight, currentWeight.stable);
    }
  }, [currentWeight, onWeightChange]);

  return (
    <div className="bg-white rounded-lg border p-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-gray-300'
          }`} />
          <span className="font-medium">
            {isConnected ? `Connected: ${deviceName}` : 'Scale Not Connected'}
          </span>
        </div>
        
        {showConnectionButton && (
          <button
            onClick={isConnected ? disconnect : connect}
            disabled={isConnecting}
            className={`px-4 py-2 rounded-md font-medium ${
              isConnected
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ minHeight: '48px' }} // iPad Air 2013 touch target
          >
            {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect Scale'}
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Weight Display */}
      {isConnected && currentWeight && (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <div className="text-5xl font-bold mb-2">
            {currentWeight.weight.toFixed(1)}
            <span className="text-2xl ml-2 text-gray-600">g</span>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm">
            {currentWeight.stable ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-green-700 font-medium">Stable</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                <span className="text-yellow-700 font-medium">Stabilizing...</span>
              </>
            )}
          </div>

          {/* Tare Button */}
          <button
            onClick={tare}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
            style={{ minHeight: '48px' }} // iPad Air 2013 touch target
          >
            Tare (Zero Scale)
          </button>
        </div>
      )}

      {/* Connection Instructions */}
      {!isConnected && !error && (
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
          <p className="font-medium mb-2">How to connect:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Turn on your Bluetooth scale</li>
            <li>Make sure Bluetooth is enabled on your device</li>
            <li>Click "Connect Scale" button</li>
            <li>Select your scale from the list</li>
          </ol>
        </div>
      )}
    </div>
  );
}