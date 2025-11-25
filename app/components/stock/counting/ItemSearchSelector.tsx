'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '@/app/components/stock/shared/SearchBar';
import { ItemCard } from '@/app/components/stock/shared/ItemCard';

interface ItemSearchSelectorProps {
  method: string;
  onSelect: (item: any) => void;
}

export function ItemSearchSelector({ method, onSelect }: ItemSearchSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, [method]);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, items]);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Filter items by compatible counting workflow
      const response = await fetch(
        `/api/stock/items?counting_workflow=${method}&is_active=true&limit=50`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load items');
      }
      
      const data = await response.json();
      setItems(data.items || []);
      setFilteredItems(data.items || []);
      
    } catch (err) {
      console.error('Error loading items:', err);
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    if (!term.trim()) {
      setFilteredItems(items);
      return;
    }
    
    const searchLower = term.toLowerCase();
    const filtered = items.filter(item =>
      item.item_name?.toLowerCase().includes(searchLower) ||
      item.brand?.toLowerCase().includes(searchLower) ||
      item.barcode?.toLowerCase().includes(searchLower) ||
      item.item_code?.toLowerCase().includes(searchLower)
    );
    
    setFilteredItems(filtered);
  };

  const getMethodDisplay = (method: string) => {
    const methodNames = {
      unit_count: 'Manual Count',
      container_weight: 'Weight Container',
      bottle_hybrid: 'Bottle Hybrid',
      keg_weight: 'Keg Tracking'
    };
    return methodNames[method as keyof typeof methodNames] || method;
  };

  // Handle barcode scan
  const handleBarcodeScan = async (barcode: string) => {
    setBarcodeScanning(true);
    setBarcodeError(null);
    setShowBarcodeScanner(false);

    try {
      console.log('🔍 Looking up barcode:', barcode);

      // Look up item by barcode
      const response = await fetch(`/api/inventory/barcode/${encodeURIComponent(barcode)}`);
      
      if (!response.ok) {
        throw new Error('Failed to lookup barcode');
      }

      const data = await response.json();

      if (data.item) {
        console.log('✅ Found item via barcode:', data.item.item_name);
        
        // Check if the item is compatible with the selected counting method
        const isCompatible = items.some(item => item.id === data.item.item_id || item.item_id === data.item.item_id);
        
        if (isCompatible) {
          // Item is compatible, select it directly
          onSelect(data.item);
        } else {
          // Item not compatible with current method
          setBarcodeError(`Item "${data.item.item_name}" is not compatible with ${getMethodDisplay(method)} counting method.`);
        }
      } else {
        // No item found with this barcode
        setBarcodeError(`No item found with barcode "${barcode}". You may need to add this item to your inventory first.`);
      }

    } catch (err: any) {
      console.error('Error during barcode lookup:', err);
      setBarcodeError('Failed to lookup barcode. Please try again or use manual search.');
    } finally {
      setBarcodeScanning(false);
    }
  };

  // Open barcode scanner
  const openBarcodeScanner = () => {
    setBarcodeError(null);
    setShowBarcodeScanner(true);
  };

  // Close barcode scanner
  const closeBarcodeScanner = () => {
    setShowBarcodeScanner(false);
    setBarcodeScanning(false);
  };

  if (loading) {
    return (
      <div className="item-selector">
        <h2 className="text-2xl font-bold mb-4 text-white text-center">
          Loading items for {getMethodDisplay(method)}...
        </h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="item-selector">
        <h2 className="text-2xl font-bold mb-4 text-white text-center">
          What are you counting?
        </h2>
        <div className="bg-red-500/20 border-2 border-red-400/50 rounded-2xl p-6 text-center">
          <p className="text-white">{error}</p>
          <button
            onClick={loadItems}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="item-selector">
      <h2 className="text-2xl font-bold mb-2 text-white text-center">
        What are you counting?
      </h2>
      <p className="text-white/70 text-center mb-6">
        Items compatible with <strong>{getMethodDisplay(method)}</strong>
      </p>
      
      {/* Search Bar with Barcode Scanner */}
      <div className="mb-6 space-y-4">
        <SearchBar 
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name, brand, or barcode..."
        />
        
        {/* Barcode Scanner Button */}
        <div className="flex justify-center">
          <button
            onClick={openBarcodeScanner}
            disabled={barcodeScanning}
            className="
              flex items-center gap-2 px-6 py-3 rounded-2xl
              bg-gradient-to-r from-blue-500 to-purple-600
              hover:from-blue-600 hover:to-purple-700
              text-white font-medium shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
            style={{ minHeight: '52px' }}
          >
            <span className="icon-[tabler--camera] w-5 h-5"></span>
            {barcodeScanning ? 'Looking up item...' : '📷 Scan Barcode'}
          </button>
        </div>
      </div>

      {/* Barcode Error Display */}
      {barcodeError && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg flex items-start gap-3">
          <span className="icon-[tabler--alert-circle] w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"></span>
          <div className="flex-1">
            <p className="text-red-200 text-sm">{barcodeError}</p>
            <button
              onClick={() => setBarcodeError(null)}
              className="text-red-300 hover:text-red-100 text-xs underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-center">
        <p className="text-white/60 text-sm">
          {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
          {searchTerm && ` for "${searchTerm}"`}
        </p>
      </div>

      {/* Items Grid */}
      <div className="items-grid space-y-3 max-h-96 overflow-y-auto">
        {filteredItems.map(item => (
          <ItemCard 
            key={item.id}
            item={item}
            onClick={() => onSelect(item)}
            showWorkflow={false}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchTerm ? 'No items found' : 'No items available'}
          </h3>
          <p className="text-white/60 mb-4">
            {searchTerm 
              ? `No items match "${searchTerm}" for ${getMethodDisplay(method)}`
              : `No items are configured for ${getMethodDisplay(method)}`
            }
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="
                px-4 py-2 rounded-xl
                bg-white/10 text-white
                hover:bg-white/20
                transition-colors duration-200
              "
            >
              Clear Search
            </button>
          )}
        </div>
      )}
      
      {/* Load More (if needed) */}
      {items.length >= 50 && (
        <div className="text-center mt-4">
          <p className="text-white/60 text-sm">
            Showing first 50 items. Use search to find specific items.
          </p>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {/* {showBarcodeScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={closeBarcodeScanner}
          title="Scan Item Barcode"
          subtitle="Scan to instantly find and select your item"
        />
      )} */}
    </div>
  );
}