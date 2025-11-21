'use client';

import { useState, useEffect } from 'react';
import { ItemHeader } from '@/app/components/stock/shared/ItemHeader';

interface WeightCountInputProps {
  item: any;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

export function WeightCountInput({ item, onSubmit, onBack }: WeightCountInputProps) {
  const [step, setStep] = useState<'container' | 'scale' | 'weigh'>('container');
  const [container, setContainer] = useState<any>(null);
  const [grossWeight, setGrossWeight] = useState<number>(0);
  const [netWeight, setNetWeight] = useState<number>(0);
  const [calculatedQty, setCalculatedQty] = useState<number>(0);

  useEffect(() => {
    if (container && grossWeight > 0) {
      const net = grossWeight - container.tare_weight_grams;
      setNetWeight(Math.max(0, net));
      
      if (item.typical_unit_weight_grams > 0) {
        const qty = net / item.typical_unit_weight_grams;
        setCalculatedQty(Math.max(0, qty));
      }
    }
  }, [container, grossWeight, item]);

  const handleSubmit = () => {
    onSubmit({
      inventory_item_id: item.id,
      counting_method: 'weight',
      container_instance_id: container?.id,
      gross_weight_grams: grossWeight,
      tare_weight_grams: container?.tare_weight_grams,
      net_weight_grams: netWeight,
      unit_weight_grams: item.typical_unit_weight_grams,
      calculated_quantity: calculatedQty,
      counted_at: new Date().toISOString()
    });
  };

  return (
    <div className="weight-count-input space-y-6">
      <ItemHeader item={item} method="Weight Container" />

      {/* Step Indicator */}
      <div className="flex mb-6">
        {['Container', 'Scale', 'Weigh'].map((label, index) => (
          <div
            key={label}
            className={`
              flex-1 text-center py-3
              ${index <= ['container', 'scale', 'weigh'].indexOf(step)
                ? 'bg-emerald-500 text-white'
                : 'bg-white/10 text-white/60'}
              ${index === 0 ? 'rounded-l-2xl' : ''}
              ${index === 2 ? 'rounded-r-2xl' : ''}
            `}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Step 1: Select Container */}
      {step === 'container' && (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-6">
            Select Container
          </h3>
          
          <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-8 mb-6">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-white/70">
              Container selection and barcode scanning will be implemented in Phase 2
            </p>
          </div>
          
          {/* Mock Container for Demo */}
          <button
            onClick={() => {
              setContainer({ 
                id: 'demo-container',
                barcode: 'JIGR-C-00001',
                tare_weight_grams: 385,
                container_type_name: '6qt Cambro'
              });
              setStep('scale');
            }}
            className="
              w-full py-4 rounded-2xl
              bg-emerald-500 text-white font-semibold
              hover:bg-emerald-600
            "
          >
            Use Demo Container (385g tare)
          </button>
        </div>
      )}

      {/* Step 2: Connect Scale */}
      {step === 'scale' && (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-6">
            Connect Scale
          </h3>
          
          <div className="bg-white/10 backdrop-blur-xl border-2 border-white/20 rounded-2xl p-8 mb-6">
            <div className="text-4xl mb-4">⚖️</div>
            <p className="text-white/70 mb-4">
              Container: {container?.barcode} ({container?.tare_weight_grams}g tare)
            </p>
            <p className="text-white/60 text-sm">
              Bluetooth scale connection will be implemented in Phase 2
            </p>
          </div>
          
          <button
            onClick={() => setStep('weigh')}
            className="
              w-full py-4 rounded-2xl
              bg-emerald-500 text-white font-semibold
              hover:bg-emerald-600
            "
          >
            Use Manual Entry (Demo)
          </button>
        </div>
      )}

      {/* Step 3: Weigh */}
      {step === 'weigh' && (
        <>
          {/* Weight Input */}
          <div>
            <label className="text-white/70 text-sm block mb-2">
              Gross Weight (container + contents)
            </label>
            <input
              type="number"
              step="0.1"
              value={grossWeight || ''}
              onChange={(e) => setGrossWeight(parseFloat(e.target.value) || 0)}
              placeholder="Enter weight in grams"
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/10 border-2 border-white/20
                text-white text-2xl font-bold
                focus:border-emerald-400 focus:outline-none
              "
            />
          </div>

          {/* Weight Display */}
          {grossWeight > 0 && (
            <div className="
              bg-white/10 backdrop-blur-xl
              border-2 border-white/20
              rounded-2xl p-6
            ">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-white/70 text-sm">Gross</div>
                  <div className="text-2xl font-bold text-white">
                    {grossWeight}g
                  </div>
                </div>
                <div>
                  <div className="text-white/70 text-sm">Tare</div>
                  <div className="text-2xl font-bold text-white/60">
                    -{container?.tare_weight_grams}g
                  </div>
                </div>
                <div>
                  <div className="text-white/70 text-sm">Net</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {netWeight.toFixed(1)}g
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calculated Quantity */}
          {calculatedQty > 0 && (
            <div className="
              bg-emerald-500/20 backdrop-blur-xl
              border-2 border-emerald-400/50
              rounded-2xl p-8 text-center
            ">
              <div className="text-white/70 text-sm mb-2">Calculated Quantity</div>
              <div className="text-6xl font-bold text-white">
                {calculatedQty.toFixed(2)}
              </div>
              <div className="text-white/60 text-sm mt-2">
                {item.recipe_unit || 'units'}
              </div>
            </div>
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            if (step === 'container') {
              onBack();
            } else if (step === 'scale') {
              setStep('container');
            } else {
              setStep('scale');
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
        
        {step === 'weigh' && (
          <button
            onClick={handleSubmit}
            disabled={grossWeight === 0 || netWeight <= 0}
            className="
              flex-2 py-4 rounded-2xl
              bg-emerald-500 text-white font-semibold
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-emerald-600 hover:disabled:bg-emerald-500
              transition-colors duration-200
            "
          >
            Add to Count ✓
          </button>
        )}
      </div>
    </div>
  );
}