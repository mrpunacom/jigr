'use client';

import { useState } from 'react';
import { ItemHeader } from '@/app/components/stock/shared/ItemHeader';
import { NumericKeypad } from '@/app/components/stock/shared/NumericKeypad';

interface ManualCountInputProps {
  item: any;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

export function ManualCountInput({ item, onSubmit, onBack }: ManualCountInputProps) {
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = () => {
    if (quantity === 0) return;
    
    onSubmit({
      inventory_item_id: item.id,
      counting_method: 'manual',
      counted_quantity: quantity,
      notes: notes.trim() || null,
      counted_at: new Date().toISOString()
    });
  };

  // Calculate pack equivalent if item has pack size
  const packEquivalent = item.pack_size && quantity > 0 
    ? (quantity / item.pack_size).toFixed(2)
    : null;

  const totalUnits = item.pack_size && quantity > 0
    ? quantity * item.pack_size
    : null;

  return (
    <div className="manual-count-input space-y-6">
      <ItemHeader item={item} method="Manual Count" />

      {/* Current Quantity Display */}
      <div className="
        bg-white/10 backdrop-blur-xl
        border-2 border-white/20
        rounded-2xl p-8
        text-center
      ">
        <div className="text-white/70 text-sm mb-2">Quantity</div>
        <div className="text-6xl font-bold text-white mb-2">
          {quantity}
        </div>
        <div className="text-white/60 text-lg">
          {item.recipe_unit || 'units'}
        </div>
        
        {/* Pack Conversion Display */}
        {item.pack_size && quantity > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {item.order_by_pack && packEquivalent && (
                <div>
                  <div className="text-white/60">Packs</div>
                  <div className="text-white font-semibold">
                    {packEquivalent} {item.pack_unit || 'packs'}
                  </div>
                </div>
              )}
              {totalUnits && (
                <div>
                  <div className="text-white/60">Total Units</div>
                  <div className="text-white font-semibold">
                    {totalUnits} units
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Numeric Keypad */}
      <NumericKeypad 
        value={quantity}
        onChange={setQuantity}
        allowDecimals={item.supports_partial_units}
      />

      {/* Notes Input (Optional) */}
      <div>
        <label className="text-white/70 text-sm block mb-2">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this count..."
          className="
            w-full px-4 py-3 rounded-xl
            bg-white/10 border-2 border-white/20
            text-white placeholder-white/50
            focus:border-emerald-400 focus:outline-none
            resize-none h-20
          "
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="
            flex-1 py-4 rounded-2xl
            bg-white/10 text-white font-semibold
            hover:bg-white/20
            transition-colors duration-200
          "
          style={{ minHeight: '44px' }}
        >
          ← Back
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={quantity === 0}
          className="
            flex-2 py-4 rounded-2xl
            bg-emerald-500 text-white font-semibold
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:bg-emerald-600 hover:disabled:bg-emerald-500
            transition-colors duration-200
          "
          style={{ minHeight: '44px' }}
        >
          Add to Count ✓
        </button>
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-white/60 text-sm">
          💡 {item.supports_partial_units 
            ? 'Decimal quantities are allowed for this item'
            : 'Only whole numbers allowed for this item'
          }
        </p>
      </div>
    </div>
  );
}