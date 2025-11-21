'use client';

import { useState } from 'react';
import { ItemHeader } from '@/app/components/stock/shared/ItemHeader';

interface KegCountInputProps {
  item: any;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

export function KegCountInput({ item, onSubmit, onBack }: KegCountInputProps) {
  const [grossWeight, setGrossWeight] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(4);
  const [tappedDate, setTappedDate] = useState<string>('');

  const emptyKegWeight = item.empty_keg_weight_grams || 13300; // Standard 50L keg
  const kegCapacity = item.keg_volume_liters || 50;
  const netWeight = Math.max(0, grossWeight - emptyKegWeight);
  const remainingLiters = netWeight / 1010; // Beer density ~1.01 kg/L
  const remainingPercent = (remainingLiters / kegCapacity) * 100;

  // Calculate freshness status
  const daysSinceTap = tappedDate 
    ? Math.floor((new Date().getTime() - new Date(tappedDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const freshnessStatus = (() => {
    const freshnessDays = item.keg_freshness_days || 14;
    if (daysSinceTap === 0) return 'fresh';
    if (daysSinceTap <= freshnessDays * 0.3) return 'fresh';
    if (daysSinceTap <= freshnessDays * 0.7) return 'good';
    if (daysSinceTap <= freshnessDays) return 'declining';
    return 'expired';
  })();

  const getFreshnessColor = () => {
    switch (freshnessStatus) {
      case 'fresh': return 'emerald';
      case 'good': return 'blue';
      case 'declining': return 'amber';
      case 'expired': return 'red';
      default: return 'gray';
    }
  };

  const handleSubmit = () => {
    onSubmit({
      inventory_item_id: item.id,
      counting_method: 'weight',
      gross_weight_grams: grossWeight,
      keg_tapped_date: tappedDate || null,
      keg_temperature_celsius: temperature,
      counted_quantity: remainingLiters,
      counted_at: new Date().toISOString()
    });
  };

  return (
    <div className="keg-count-input space-y-6">
      <ItemHeader item={item} method="Keg Tracking" />

      {/* Weight Input */}
      <div>
        <label className="text-white/70 text-sm block mb-2">
          Current Keg Weight (kg)
        </label>
        <input
          type="number"
          step="0.1"
          value={grossWeight || ''}
          onChange={(e) => setGrossWeight(parseFloat(e.target.value) || 0)}
          placeholder="Weigh the entire keg..."
          className="
            w-full px-4 py-3 rounded-xl
            bg-white/10 border-2 border-white/20
            text-white text-2xl font-bold
            focus:border-emerald-400 focus:outline-none
          "
        />
        <p className="text-white/60 text-sm mt-2">
          Place entire keg on scale. Include keg weight.
        </p>
      </div>

      {/* Weight Breakdown */}
      {grossWeight > 0 && (
        <div className="
          bg-white/10 backdrop-blur-xl
          border-2 border-white/20
          rounded-2xl p-6
        ">
          <h4 className="text-white font-semibold mb-4 text-center">Weight Analysis</h4>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-white/70">Total Weight</div>
              <div className="text-white font-bold text-lg">
                {grossWeight}kg
              </div>
            </div>
            <div>
              <div className="text-white/70">Empty Keg</div>
              <div className="text-white/60 font-bold text-lg">
                -{(emptyKegWeight / 1000).toFixed(1)}kg
              </div>
            </div>
            <div>
              <div className="text-white/70">Beer Weight</div>
              <div className="text-emerald-400 font-bold text-lg">
                {(netWeight / 1000).toFixed(1)}kg
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remaining Volume Display */}
      {remainingLiters > 0 && (
        <div className="
          bg-blue-500/20 backdrop-blur-xl
          border-2 border-blue-400/50
          rounded-2xl p-8 text-center
        ">
          <div className="text-white/70 text-sm mb-2">Remaining Volume</div>
          <div className="text-6xl font-bold text-white mb-2">
            {remainingLiters.toFixed(1)}L
          </div>
          <div className="text-blue-300 text-lg">
            {remainingPercent.toFixed(1)}% of {kegCapacity}L capacity
          </div>
          
          {/* Volume Bar */}
          <div className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-400 transition-all duration-300"
              style={{ width: `${Math.min(100, remainingPercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Tapped Date (Optional) */}
      <div>
        <label className="text-white/70 text-sm block mb-2">
          Tapped Date (optional)
        </label>
        <input
          type="date"
          value={tappedDate}
          onChange={(e) => setTappedDate(e.target.value)}
          className="
            w-full px-4 py-3 rounded-xl
            bg-white/10 border-2 border-white/20
            text-white
            focus:border-emerald-400 focus:outline-none
          "
        />
        {tappedDate && (
          <p className="text-white/60 text-sm mt-2">
            {daysSinceTap} days since tapping
          </p>
        )}
      </div>

      {/* Freshness Status */}
      {tappedDate && (
        <div className={`
          bg-${getFreshnessColor()}-500/20 backdrop-blur-xl
          border-2 border-${getFreshnessColor()}-400/50
          rounded-2xl p-4
        `}>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-white/70 text-sm">Freshness Status</div>
              <div className={`text-${getFreshnessColor()}-300 font-semibold capitalize`}>
                {freshnessStatus}
              </div>
            </div>
            <div className="text-2xl">
              {freshnessStatus === 'fresh' && '🟢'}
              {freshnessStatus === 'good' && '🔵'}
              {freshnessStatus === 'declining' && '🟡'}
              {freshnessStatus === 'expired' && '🔴'}
            </div>
          </div>
        </div>
      )}

      {/* Temperature Input */}
      <div>
        <label className="text-white/70 text-sm block mb-2">
          Storage Temperature (°C)
        </label>
        <input
          type="number"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value) || 4)}
          className="
            w-full px-4 py-3 rounded-xl
            bg-white/10 border-2 border-white/20
            text-white
            focus:border-emerald-400 focus:outline-none
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
        >
          ← Back
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={grossWeight === 0}
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
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-white/60 text-sm">
          💡 Weigh the entire keg including the container. 
          {remainingPercent < 10 && remainingLiters > 0 && (
            <span className="text-amber-400"> ⚠️ Keg is running low!</span>
          )}
        </p>
      </div>
    </div>
  );
}