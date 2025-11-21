'use client';

import { useState, useEffect } from 'react';
import { ItemHeader } from '@/app/components/stock/shared/ItemHeader';
import { NumericKeypad } from '@/app/components/stock/shared/NumericKeypad';

interface BottleCountInputProps {
  item: any;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

export function BottleCountInput({ item, onSubmit, onBack }: BottleCountInputProps) {
  const [fullBottles, setFullBottles] = useState<number>(0);
  const [partialWeight, setPartialWeight] = useState<number>(0);
  const [step, setStep] = useState<'full' | 'partial'>('full');
  const [totalBottles, setTotalBottles] = useState<number>(0);

  useEffect(() => {
    if (partialWeight > 0 && item.empty_bottle_weight_grams && item.full_bottle_weight_grams) {
      // Calculate partial bottle equivalent
      const liquidWeight = partialWeight - item.empty_bottle_weight_grams;
      const fullLiquidWeight = item.full_bottle_weight_grams - item.empty_bottle_weight_grams;
      const partialEquivalent = Math.max(0, liquidWeight / fullLiquidWeight);
      
      setTotalBottles(fullBottles + partialEquivalent);
    } else {
      setTotalBottles(fullBottles);
    }
  }, [fullBottles, partialWeight, item]);

  const handleSubmit = () => {
    onSubmit({
      inventory_item_id: item.id,
      counting_method: 'weight', // Bottle hybrid uses weight method
      full_bottles_count: fullBottles,
      partial_bottles_weight: partialWeight,
      counted_quantity: totalBottles,
      counted_at: new Date().toISOString()
    });
  };

  return (
    <div className="bottle-count-input space-y-6">
      <ItemHeader item={item} method="Bottle Hybrid" />

      {/* Step Indicator */}
      <div className="flex">
        <div className={`
          flex-1 text-center py-3 rounded-l-2xl
          ${step === 'full' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'}
        `}>
          1. Full Bottles
        </div>
        <div className={`
          flex-1 text-center py-3 rounded-r-2xl
          ${step === 'partial' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'}
        `}>
          2. Opened Bottles
        </div>
      </div>

      {/* Step 1: Full Bottles */}
      {step === 'full' && (
        <>
          <div className="
            bg-white/10 backdrop-blur-xl
            border-2 border-white/20
            rounded-2xl p-8 text-center
          ">
            <div className="text-white/70 text-sm mb-2">Full Bottles</div>
            <div className="text-6xl font-bold text-white">
              {fullBottles}
            </div>
            <div className="text-white/60 text-sm mt-2">
              Unopened {item.bottle_volume_ml}ml bottles
            </div>
          </div>

          <NumericKeypad 
            value={fullBottles}
            onChange={setFullBottles}
            allowDecimals={false}
          />

          <button
            onClick={() => setStep('partial')}
            className="
              w-full py-4 rounded-2xl
              bg-emerald-500 text-white font-semibold
              hover:bg-emerald-600
              transition-colors duration-200
            "
          >
            Next: Opened Bottles →
          </button>
        </>
      )}

      {/* Step 2: Partial Bottles */}
      {step === 'partial' && (
        <>
          {/* Manual Weight Entry (Demo) */}
          <div>
            <label className="text-white/70 text-sm block mb-2">
              Weight of all opened bottles (grams)
            </label>
            <input
              type="number"
              step="0.1"
              value={partialWeight || ''}
              onChange={(e) => setPartialWeight(parseFloat(e.target.value) || 0)}
              placeholder="Place opened bottles on scale..."
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/10 border-2 border-white/20
                text-white text-2xl font-bold
                focus:border-emerald-400 focus:outline-none
              "
            />
            <p className="text-white/60 text-sm mt-2">
              Scale integration will be available in Phase 2
            </p>
          </div>

          {/* Partial Calculation Display */}
          {partialWeight > 0 && (
            <div className="
              bg-white/10 backdrop-blur-xl
              border-2 border-white/20
              rounded-2xl p-6
            ">
              <div className="text-white/70 text-sm mb-3 text-center">
                Partial Bottle Analysis
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {partialWeight}g
                </div>
                {item.empty_bottle_weight_grams && (
                  <div className="text-emerald-400 text-sm mt-2">
                    ≈ {(totalBottles - fullBottles).toFixed(2)} bottle equivalent
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Total Display */}
          <div className="
            bg-emerald-500/20 backdrop-blur-xl
            border-2 border-emerald-400/50
            rounded-2xl p-8 text-center
          ">
            <div className="text-white/70 text-sm mb-2">Total Bottles</div>
            <div className="text-6xl font-bold text-white">
              {totalBottles.toFixed(2)}
            </div>
            <div className="text-white/60 text-sm mt-2">
              {fullBottles} full + {(totalBottles - fullBottles).toFixed(2)} partial
            </div>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            if (step === 'partial') {
              setStep('full');
            } else {
              onBack();
            }
          }}
          className="
            flex-1 py-4 rounded-2xl
            bg-white/10 text-white font-semibold
            hover:bg-white/20
            transition-colors duration-200
          "
        >
          ← Back
        </button>
        
        {step === 'partial' && (
          <button
            onClick={handleSubmit}
            className="
              flex-2 py-4 rounded-2xl
              bg-emerald-500 text-white font-semibold
              hover:bg-emerald-600
              transition-colors duration-200
            "
          >
            Add to Count ✓
          </button>
        )}
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-white/60 text-sm">
          💡 Count all unopened bottles first, then weigh all opened bottles together
        </p>
      </div>
    </div>
  );
}