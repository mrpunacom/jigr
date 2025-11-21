'use client';

interface MethodSelectorProps {
  onSelect: (method: string) => void;
}

export function MethodSelector({ onSelect }: MethodSelectorProps) {
  const methods = [
    {
      id: 'unit_count',
      name: 'Manual Count',
      icon: '📝',
      description: 'Count individual items or packs',
      color: 'purple',
      example: 'Cases, bottles, units'
    },
    {
      id: 'container_weight',
      name: 'Weight Container',
      icon: '⚖️',
      description: 'Weigh items in labeled containers',
      color: 'emerald',
      example: 'Flour, rice, bulk ingredients'
    },
    {
      id: 'bottle_hybrid',
      name: 'Bottle Hybrid',
      icon: '🍷',
      description: 'Count full + weigh partial bottles',
      color: 'amber',
      example: 'Wine, spirits, liqueurs'
    },
    {
      id: 'keg_weight',
      name: 'Keg Tracking',
      icon: '🍺',
      description: 'Track keg weight and freshness',
      color: 'blue',
      example: 'Beer kegs, beverage kegs'
    }
  ];

  return (
    <div className="method-selector">
      <h2 className="text-2xl font-bold mb-2 text-white text-center">
        How are you counting?
      </h2>
      <p className="text-white/70 text-center mb-8">
        Choose the counting method that matches your inventory type
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.map(method => (
          <button
            key={method.id}
            onClick={() => onSelect(method.id)}
            className={`
              group relative overflow-hidden
              bg-white/10 backdrop-blur-xl
              border-2 border-white/20
              rounded-2xl p-6
              hover:border-${method.color}-400
              hover:bg-white/20
              hover:scale-105
              transition-all duration-300
              text-left
              min-h-[160px]
            `}
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            {/* Background Gradient */}
            <div className={`
              absolute inset-0 opacity-0 group-hover:opacity-20
              bg-gradient-to-br from-${method.color}-400 to-${method.color}-600
              transition-opacity duration-300
            `} />
            
            <div className="relative z-10">
              {/* Icon */}
              <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                {method.icon}
              </div>
              
              {/* Method Name */}
              <h3 className="text-xl font-semibold text-white mb-2">
                {method.name}
              </h3>
              
              {/* Description */}
              <p className="text-sm text-white/70 mb-3">
                {method.description}
              </p>
              
              {/* Example */}
              <p className="text-xs text-white/50 italic">
                e.g., {method.example}
              </p>
            </div>
            
            {/* Hover indicator */}
            <div className={`
              absolute bottom-0 left-0 right-0 h-1
              bg-${method.color}-400
              transform scale-x-0 group-hover:scale-x-100
              transition-transform duration-300
              origin-left
            `} />
          </button>
        ))}
      </div>
      
      {/* Help Text */}
      <div className="mt-8 text-center">
        <p className="text-white/60 text-sm">
          💡 Not sure which method? Choose <strong>Manual Count</strong> for most items, 
          or <strong>Weight Container</strong> for bulk ingredients.
        </p>
      </div>
    </div>
  );
}