'use client';

interface ItemCardProps {
  item: any;
  onClick: () => void;
  showWorkflow?: boolean;
  className?: string;
}

export function ItemCard({ 
  item, 
  onClick, 
  showWorkflow = true, 
  className = '' 
}: ItemCardProps) {
  
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
  
  const getWorkflowColor = (workflow: string) => {
    const colors = {
      unit_count: 'purple',
      container_weight: 'emerald',
      bottle_hybrid: 'amber',
      keg_weight: 'blue',
      batch_weight: 'pink'
    };
    return colors[workflow as keyof typeof colors] || 'gray';
  };

  return (
    <button
      onClick={onClick}
      className={`
        group w-full p-4 rounded-2xl
        bg-white/10 backdrop-blur-xl
        border-2 border-white/20
        hover:border-emerald-400
        hover:bg-white/20
        hover:scale-102
        transition-all duration-200
        text-left
        ${className}
      `}
      style={{ minHeight: '44px' }}
    >
      <div className="flex items-start gap-3">
        {/* Item Icon/Workflow */}
        {showWorkflow && (
          <div className="flex-shrink-0">
            <div className={`
              w-10 h-10 rounded-xl
              bg-${getWorkflowColor(item.counting_workflow)}-500/20
              border-2 border-${getWorkflowColor(item.counting_workflow)}-400/50
              flex items-center justify-center
              text-lg
            `}>
              {getWorkflowIcon(item.counting_workflow)}
            </div>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {/* Item Name */}
          <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
            {item.item_name}
          </h3>
          
          {/* Brand */}
          {item.brand && (
            <p className="text-white/60 text-sm mt-1">
              {item.brand}
            </p>
          )}
          
          {/* Metadata Row */}
          <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
            {/* Par Level */}
            {item.par_level_low && (
              <span>
                Par: {item.par_level_low}{item.recipe_unit ? ` ${item.recipe_unit}` : ''}
              </span>
            )}
            
            {/* Unit Weight (for weight-based items) */}
            {item.typical_unit_weight_grams && (
              <span>
                {item.typical_unit_weight_grams}g/unit
              </span>
            )}
            
            {/* Barcode */}
            {item.barcode && (
              <span className="font-mono">
                {item.barcode}
              </span>
            )}
          </div>
          
          {/* Special Indicators */}
          <div className="flex items-center gap-2 mt-2">
            {/* Requires Container */}
            {item.requires_container && (
              <span className="
                inline-flex px-2 py-1 rounded-full
                bg-orange-500/20 text-orange-300
                text-xs font-medium
              ">
                Needs Container
              </span>
            )}
            
            {/* Bottled Product */}
            {item.is_bottled_product && (
              <span className="
                inline-flex px-2 py-1 rounded-full
                bg-amber-500/20 text-amber-300
                text-xs font-medium
              ">
                Bottled
              </span>
            )}
            
            {/* Keg Product */}
            {item.is_keg && (
              <span className="
                inline-flex px-2 py-1 rounded-full
                bg-blue-500/20 text-blue-300
                text-xs font-medium
              ">
                Keg
              </span>
            )}
            
            {/* Batch Tracked */}
            {item.is_batch_tracked && (
              <span className="
                inline-flex px-2 py-1 rounded-full
                bg-pink-500/20 text-pink-300
                text-xs font-medium
              ">
                Batch Tracked
              </span>
            )}
          </div>
        </div>
        
        {/* Arrow Indicator */}
        <div className="flex-shrink-0 text-white/40 group-hover:text-emerald-300 transition-colors">
          →
        </div>
      </div>
    </button>
  );
}