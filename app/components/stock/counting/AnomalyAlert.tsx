'use client';

interface AnomalyAlertProps {
  anomalies: Array<{
    type: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    suggested_action: string;
    confidence_score: number;
  }>;
  onOverride?: () => void;
  onRecount?: () => void;
}

export function AnomalyAlert({ anomalies, onOverride, onRecount }: AnomalyAlertProps) {
  if (!anomalies || anomalies.length === 0) return null;

  const hasCritical = anomalies.some(a => a.severity === 'critical');
  const hasError = anomalies.some(a => a.severity === 'error');
  const hasWarning = anomalies.some(a => a.severity === 'warning');

  const getAlertTheme = () => {
    if (hasCritical) return { bg: 'bg-red-500/20', border: 'border-red-400/50', text: 'text-red-300', icon: '🚨' };
    if (hasError) return { bg: 'bg-red-500/15', border: 'border-red-400/40', text: 'text-red-300', icon: '❌' };
    if (hasWarning) return { bg: 'bg-amber-500/20', border: 'border-amber-400/50', text: 'text-amber-300', icon: '⚠️' };
    return { bg: 'bg-blue-500/20', border: 'border-blue-400/50', text: 'text-blue-300', icon: 'ℹ️' };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'error': return 'text-red-300';
      case 'warning': return 'text-amber-300';
      case 'info': return 'text-blue-300';
      default: return 'text-white/70';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  const theme = getAlertTheme();

  return (
    <div className={`
      ${theme.bg} backdrop-blur-xl ${theme.border}
      border-2 rounded-2xl p-6
      animate-in slide-in-from-top-4 duration-300
    `}>
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl">
          {theme.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">
            {hasCritical && 'Critical Issue Detected'}
            {!hasCritical && hasError && 'Error Detected'}
            {!hasCritical && !hasError && hasWarning && 'Warning: Unusual Count'}
            {!hasCritical && !hasError && !hasWarning && 'Information'}
          </h3>
          <p className="text-white/80 text-sm">
            {hasCritical && 'This count has critical issues that must be resolved before proceeding.'}
            {!hasCritical && hasError && 'This count has errors that should be corrected.'}
            {!hasCritical && !hasError && hasWarning && 'This count is unusual compared to historical data. Please verify.'}
            {!hasCritical && !hasError && !hasWarning && 'Additional information about this count.'}
          </p>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="space-y-3 mb-6">
        {anomalies.map((anomaly, index) => (
          <div 
            key={index}
            className="bg-black/20 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="text-lg">
                {getSeverityIcon(anomaly.severity)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold ${getSeverityColor(anomaly.severity)} capitalize`}>
                    {anomaly.severity}
                  </span>
                  <span className="text-white/60 text-xs">
                    {(anomaly.confidence_score * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <div className="font-medium text-white mb-2">
                  {anomaly.message}
                </div>
                <div className="text-white/70 text-sm">
                  💡 <strong>Suggested action:</strong> {anomaly.suggested_action}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onRecount && (
          <button
            onClick={onRecount}
            className="
              flex-1 py-3 rounded-xl
              bg-white/10 text-white font-semibold
              hover:bg-white/20
              transition-colors duration-200
            "
            style={{ minHeight: '44px' }}
          >
            🔄 Recount
          </button>
        )}
        
        {onOverride && !hasCritical && (
          <button
            onClick={onOverride}
            className={`
              flex-1 py-3 rounded-xl font-semibold
              transition-colors duration-200
              ${hasError 
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
              }
            `}
            style={{ minHeight: '44px' }}
          >
            {hasError ? '⚠️ Override & Continue' : '✓ Continue Anyway'}
          </button>
        )}
        
        {hasCritical && (
          <div className="flex-1 py-3 px-4 rounded-xl bg-red-500/10 border border-red-400/30">
            <p className="text-red-300 text-sm text-center">
              Cannot proceed with critical issues
            </p>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-white/60 text-sm text-center">
          {hasCritical && 'Critical issues must be resolved before this count can be saved.'}
          {!hasCritical && hasError && 'Errors can be overridden if you are confident the count is correct.'}
          {!hasCritical && !hasError && 'Warnings are for your information and do not prevent counting.'}
        </p>
      </div>
    </div>
  );
}