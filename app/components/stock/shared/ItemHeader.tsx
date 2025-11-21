'use client';

interface ItemHeaderProps {
  item: any;
  method?: string;
  className?: string;
}

export function ItemHeader({ item, method, className = '' }: ItemHeaderProps) {
  const getWorkflowIcon = (workflow: string) => {
    const icons = {
      unit_count: '📝',
      container_weight: '⚖️',
      bottle_hybrid: '🍷',
      keg_weight: '🍺',
      batch_weight: '👨‍🍳'
    };
    return icons[workflow as keyof typeof icons] || '📦';
  };

  return (
    <div className={`item-header ${className}`}>
      {/* Method Badge */}
      {method && (
        <div className="flex justify-center mb-4">
          <div className="
            inline-flex items-center gap-2
            px-4 py-2 rounded-full
            bg-emerald-500/20 border-2 border-emerald-400/50
            text-emerald-300 text-sm font-medium
          ">
            {getWorkflowIcon(item.counting_workflow)}
            {method}
          </div>
        </div>
      )}
      
      {/* Item Info Card */}
      <div className="
        bg-white/5 backdrop-blur-xl
        border-2 border-white/10
        rounded-2xl p-6 mb-6
      ">
        <div className="text-center">
          {/* Item Name */}
          <h3 className="text-2xl font-bold text-white mb-2">
            {item.item_name}
          </h3>
          
          {/* Brand */}
          {item.brand && (
            <p className="text-white/70 text-lg mb-3">
              {item.brand}
            </p>
          )}
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            {/* Par Level */}
            {item.par_level_low && (
              <div>
                <div className="text-white/60">Par Level</div>
                <div className="text-white font-semibold">
                  {item.par_level_low} {item.recipe_unit || 'units'}
                </div>
              </div>
            )}
            
            {/* Category */}
            {item.category_name && (
              <div>
                <div className="text-white/60">Category</div>
                <div className="text-white font-semibold">
                  {item.category_name}
                </div>
              </div>
            )}
            
            {/* Unit Weight (for weight-based) */}
            {item.typical_unit_weight_grams && (
              <div>
                <div className="text-white/60">Unit Weight</div>
                <div className="text-white font-semibold">
                  {item.typical_unit_weight_grams}g
                </div>
              </div>
            )}
            
            {/* Pack Size */}
            {item.pack_size && item.pack_size > 1 && (
              <div>
                <div className="text-white/60">Pack Size</div>
                <div className="text-white font-semibold">
                  {item.pack_size} {item.pack_unit || 'per pack'}
                </div>
              </div>
            )}
            
            {/* Bottle Info */}
            {item.is_bottled_product && item.bottle_volume_ml && (
              <div>
                <div className="text-white/60">Bottle Size</div>
                <div className="text-white font-semibold">
                  {item.bottle_volume_ml}ml
                </div>
              </div>
            )}
            
            {/* Keg Info */}
            {item.is_keg && item.keg_volume_liters && (
              <div>
                <div className="text-white/60">Keg Size</div>
                <div className="text-white font-semibold">
                  {item.keg_volume_liters}L
                </div>
              </div>
            )}
          </div>
          
          {/* Special Indicators */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {item.requires_container && (
              <span className="
                inline-flex px-3 py-1 rounded-full
                bg-orange-500/20 text-orange-300
                text-xs font-medium
              ">
                Requires Container
              </span>
            )}
            
            {item.supports_partial_units && (
              <span className="
                inline-flex px-3 py-1 rounded-full
                bg-blue-500/20 text-blue-300
                text-xs font-medium
              ">
                Allows Decimals
              </span>
            )}
            
            {item.is_batch_tracked && (
              <span className="
                inline-flex px-3 py-1 rounded-full
                bg-pink-500/20 text-pink-300
                text-xs font-medium
              ">
                Batch Tracked
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}