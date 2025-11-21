import { useState, useCallback, useRef, useEffect } from 'react';

interface ScaleReading {
  weight: number;        // Weight in grams
  unit: 'g' | 'kg' | 'oz' | 'lb';
  stable: boolean;       // Is reading stable?
  timestamp: number;
}

interface UseBluetoothScaleReturn {
  isConnected: boolean;
  isConnecting: boolean;
  currentWeight: ScaleReading | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  tare: () => Promise<void>;
  deviceName: string | null;
}

// Common BLE scale service/characteristic UUIDs
const SCALE_SERVICE_UUID = '0000181d-0000-1000-8000-00805f9b34fb'; // Weight Scale Service
const WEIGHT_CHARACTERISTIC_UUID = '00002a9d-0000-1000-8000-00805f9b34fb'; // Weight Measurement

export function useBluetoothScale(): UseBluetoothScaleReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentWeight, setCurrentWeight] = useState<ScaleReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  
  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  // Check if Web Bluetooth is supported
  const isBluetoothSupported = useCallback(() => {
    if (!navigator.bluetooth) {
      setError('Web Bluetooth is not supported on this device');
      return false;
    }
    return true;
  }, []);

  // Connect to Bluetooth scale
  const connect = useCallback(async () => {
    if (!isBluetoothSupported()) return;

    try {
      setIsConnecting(true);
      setError(null);

      // Request device
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [SCALE_SERVICE_UUID] },
          { namePrefix: 'Scale' },
          { namePrefix: 'Dymo' },
          { namePrefix: 'Escali' }
        ],
        optionalServices: [SCALE_SERVICE_UUID]
      });

      deviceRef.current = device;
      setDeviceName(device.name || 'Unknown Scale');

      // Handle disconnection
      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setCurrentWeight(null);
        console.log('Scale disconnected');
      });

      // Connect to GATT server
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      // Get weight service
      const service = await server.getPrimaryService(SCALE_SERVICE_UUID);
      
      // Get weight characteristic
      const characteristic = await service.getCharacteristic(WEIGHT_CHARACTERISTIC_UUID);
      characteristicRef.current = characteristic;

      // Start notifications
      await characteristic.startNotifications();
      
      // Handle weight updates
      characteristic.addEventListener('characteristicvaluechanged', (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const value = target.value;
        
        if (value) {
          const reading = parseWeightValue(value);
          setCurrentWeight(reading);
        }
      });

      setIsConnected(true);
      setIsConnecting(false);

    } catch (err: any) {
      console.error('Bluetooth connection error:', err);
      setError(err.message || 'Failed to connect to scale');
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, [isBluetoothSupported]);

  // Disconnect from scale
  const disconnect = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    deviceRef.current = null;
    characteristicRef.current = null;
    setIsConnected(false);
    setCurrentWeight(null);
    setDeviceName(null);
  }, []);

  // Tare (zero) the scale
  const tare = useCallback(async () => {
    // Note: Tare function depends on scale model
    // Some scales have a tare characteristic, others require button press
    if (!characteristicRef.current) {
      setError('Scale not connected');
      return;
    }

    try {
      // Try to find tare characteristic (0x2A9E is common)
      const service = characteristicRef.current.service;
      const tareCharacteristic = await service.getCharacteristic('00002a9e-0000-1000-8000-00805f9b34fb');
      
      // Send tare command (usually writing 0x01)
      await tareCharacteristic.writeValue(new Uint8Array([0x01]));
      
      // Wait for scale to stabilize
      setTimeout(() => {
        setCurrentWeight(prev => prev ? { ...prev, weight: 0, stable: true } : null);
      }, 500);

    } catch (err) {
      // Tare characteristic not available - user must press button on scale
      setError('Please press the tare button on your scale');
      console.log('Tare command not supported, manual tare required');
    }
  }, []);

  // Parse weight value from DataView
  function parseWeightValue(dataView: DataView): ScaleReading {
    // BLE Weight Measurement format (simplified)
    // Byte 0: Flags
    // Bytes 1-2: Weight value (uint16, little-endian)
    // Byte 3: Unit
    
    const flags = dataView.getUint8(0);
    const weightRaw = dataView.getUint16(1, true); // little-endian
    
    // Parse unit from flags
    let unit: 'g' | 'kg' | 'oz' | 'lb' = 'g';
    const unitCode = (flags >> 0) & 0x03;
    switch (unitCode) {
      case 0: unit = 'g'; break;
      case 1: unit = 'kg'; break;
      case 2: unit = 'oz'; break;
      case 3: unit = 'lb'; break;
    }

    // Convert to grams if necessary
    let weightInGrams = weightRaw;
    if (unit === 'kg') weightInGrams = weightRaw * 1000;
    if (unit === 'oz') weightInGrams = weightRaw * 28.35;
    if (unit === 'lb') weightInGrams = weightRaw * 453.6;

    // Check if reading is stable (bit 4 of flags)
    const stable = (flags & 0x10) !== 0;

    return {
      weight: weightInGrams,
      unit,
      stable,
      timestamp: Date.now()
    };
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    currentWeight,
    error,
    connect,
    disconnect,
    tare,
    deviceName
  };
}