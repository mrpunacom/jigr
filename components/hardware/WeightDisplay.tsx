'use client';

interface WeightDisplayProps {
  weight: number | null;
  tare: number | null;
  showNet?: boolean;
  large?: boolean;
  unit?: 'g' | 'kg' | 'oz' | 'lb';
}

export default function WeightDisplay({
  weight,
  tare,
  showNet = true,
  large = false,
  unit = 'g'
}: WeightDisplayProps) {
  const netWeight = weight !== null && tare !== null ? weight - tare : null;

  // Convert weight to display unit
  const formatWeight = (weightInGrams: number | null): string => {
    if (weightInGrams === null) return '—';
    
    let displayWeight: number;
    let displayUnit: string;
    
    switch (unit) {
      case 'kg':
        displayWeight = weightInGrams / 1000;
        displayUnit = 'kg';
        break;
      case 'oz':
        displayWeight = weightInGrams / 28.35;
        displayUnit = 'oz';
        break;
      case 'lb':
        displayWeight = weightInGrams / 453.6;
        displayUnit = 'lb';
        break;
      default:
        displayWeight = weightInGrams;
        displayUnit = 'g';
    }
    
    return displayWeight.toFixed(unit === 'g' ? 1 : 2);
  };

  return (
    <div className={`bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 ${
      large ? 'min-h-[200px]' : ''
    }`}>
      {/* Gross Weight */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-1">Gross Weight</div>
        <div className={`font-bold text-gray-900 ${large ? 'text-4xl' : 'text-2xl'}`}>
          {weight !== null ? (
            <>
              {formatWeight(weight)}
              <span className={`${large ? 'text-xl' : 'text-base'} ml-2 text-gray-600`}>
                {unit}
              </span>
            </>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </div>

      {/* Tare Weight */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-1">Tare Weight</div>
        <div className={`font-bold text-gray-700 ${large ? 'text-2xl' : 'text-xl'}`}>
          {tare !== null ? (
            <>
              {formatWeight(tare)}
              <span className={`${large ? 'text-base' : 'text-sm'} ml-2 text-gray-500`}>
                {unit}
              </span>
            </>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </div>

      {/* Net Weight */}
      {showNet && (
        <div className="pt-4 border-t border-orange-200">
          <div className="text-sm text-gray-600 mb-1">Net Weight</div>
          <div className={`font-bold text-orange-700 ${large ? 'text-3xl' : 'text-xl'}`}>
            {netWeight !== null ? (
              <>
                {formatWeight(netWeight)}
                <span className={`${large ? 'text-lg' : 'text-base'} ml-2`}>
                  {unit}
                </span>
              </>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        </div>
      )}

      {/* Weight Status Indicators */}
      <div className="mt-4 flex justify-between text-xs text-gray-500">
        <span>Real-time weight monitoring</span>
        {weight !== null && tare !== null && (
          <span className="text-orange-600 font-medium">
            Active Scale Connected
          </span>
        )}
      </div>
    </div>
  );
}