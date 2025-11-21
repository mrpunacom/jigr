'use client';

import { useState } from 'react';

interface CountSummaryProps {
  counts: Array<{
    item: any;
    counted_quantity?: number;
    final_quantity?: number;
    counting_method: string;
    timestamp: string;
    anomalies?: any[];
  }>;
  onSubmit: () => void;
  onClear: () => void;
  isSubmitting?: boolean;
}

export function CountSummary({ counts, onSubmit, onClear, isSubmitting = false }: CountSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (counts.length === 0) return null;

  const getMethodIcon = (method: string) => {
    const icons = {
      manual: '📝',
      weight: '⚖️',
      hybrid: '🍷'
    };
    return icons[method as keyof typeof icons] || '📦';
  };

  const getMethodName = (method: string) => {
    const names = {
      manual: 'Manual',
      weight: 'Weight',
      hybrid: 'Hybrid'
    };
    return names[method as keyof typeof names] || method;
  };

  const hasAnomalies = counts.some(count => count.anomalies && count.anomalies.length > 0);
  const totalItems = counts.length;
  const totalQuantity = counts.reduce((sum, count) => sum + (count.counted_quantity || count.final_quantity || 0), 0);

  return (
    <div className="count-summary">
      {/* Compact Summary Bar */}
      <div 
        className={`
          bg-emerald-500/20 backdrop-blur-xl
          border-2 border-emerald-400/50
          rounded-2xl p-4 mb-4
          cursor-pointer hover:bg-emerald-500/25
          transition-all duration-200
          ${hasAnomalies ? 'border-amber-400/50 bg-amber-500/20' : ''}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📦</div>
            <div>
              <div className="text-white font-semibold">
                Count Session ({totalItems} item{totalItems !== 1 ? 's' : ''})
              </div>
              <div className="text-white/70 text-sm">
                {totalQuantity.toFixed(2)} total units
                {hasAnomalies && <span className="text-amber-300 ml-2">⚠️ Has warnings</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              {isExpanded ? '▼' : '▲'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="
          bg-white/10 backdrop-blur-xl
          border-2 border-white/20
          rounded-2xl p-6 mb-4
          space-y-4
          animate-in slide-in-from-top-4 duration-300
        ">
          <h4 className="text-lg font-semibold text-white mb-4">Count Details</h4>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {counts.map((count, index) => (
              <div 
                key={index}
                className="
                  bg-black/20 rounded-xl p-4
                  border border-white/10
                "
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {getMethodIcon(count.counting_method)}
                      </span>
                      <span className="font-semibold text-white">
                        {count.item.item_name}
                      </span>
                      <span className="text-xs text-white/60 px-2 py-1 bg-white/10 rounded-full">
                        {getMethodName(count.counting_method)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-white/70">
                      <span>
                        <strong>{(count.counted_quantity || count.final_quantity || 0).toFixed(2)}</strong> {count.item.recipe_unit || 'units'}
                      </span>
                      <span>
                        {new Date(count.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Anomaly Indicators */}
                    {count.anomalies && count.anomalies.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-amber-400">⚠️</span>
                          <span className="text-amber-300">
                            {count.anomalies.length} warning{count.anomalies.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => {
                      // TODO: Implement remove individual count
                      console.log('Remove count:', index);
                    }}
                    className="
                      p-2 text-white/40 hover:text-red-400
                      hover:bg-red-500/20 rounded-lg
                      transition-colors duration-200
                    "
                    style={{ minHeight: '44px', minWidth: '44px' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onClear}
          disabled={isSubmitting}
          className="
            flex-1 py-4 rounded-2xl
            bg-white/10 text-white font-semibold
            hover:bg-white/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
          "
          style={{ minHeight: '44px' }}
        >
          Clear All
        </button>
        
        <button
          onClick={onSubmit}
          disabled={isSubmitting || counts.length === 0}
          className="
            flex-2 py-4 rounded-2xl
            bg-emerald-500 text-white font-semibold
            hover:bg-emerald-600
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-200
            relative overflow-hidden
          "
          style={{ minHeight: '44px' }}
        >
          {isSubmitting && (
            <div className="absolute inset-0 bg-emerald-600/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            </div>
          )}
          
          <span className={isSubmitting ? 'invisible' : ''}>
            Submit All Counts ({totalItems}) ✓
          </span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 text-center">
        <p className="text-white/60 text-sm">
          {totalItems} item{totalItems !== 1 ? 's' : ''} • {totalQuantity.toFixed(2)} total units
          {hasAnomalies && (
            <span className="text-amber-300"> • Contains warnings</span>
          )}
        </p>
      </div>
    </div>
  );
}