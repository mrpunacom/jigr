import { ModuleCard } from './ModuleCard'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  trend?: {
    value: string
    isPositive: boolean
  }
  theme?: 'upload' | 'admin' | 'default' | 'light'
  className?: string
  onClick?: () => void
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  theme = 'light',
  className = '',
  onClick
}: MetricCardProps) {
  const isClickable = !!onClick

  return (
    <ModuleCard 
      theme={theme}
      hover={isClickable}
      onClick={onClick}
      className={`p-6 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/70">{title}</p>
            {icon && (
              <span className={`${icon} h-5 w-5 text-white/50`}></span>
            )}
          </div>
          
          <div className="mt-2">
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && (
              <p className="text-xs text-white/60 mt-1">{subtitle}</p>
            )}
          </div>

          {trend && (
            <div className="mt-3 flex items-center">
              <span className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                {trend.isPositive ? '↗' : '↘'} {trend.value}
              </span>
              <span className="text-xs text-white/60 ml-2">vs last period</span>
            </div>
          )}
        </div>
      </div>
    </ModuleCard>
  )
}

interface AlertMetricCardProps extends Omit<MetricCardProps, 'theme'> {
  alertLevel: 'success' | 'warning' | 'critical'
  count: number
}

export function AlertMetricCard({
  title,
  value,
  subtitle,
  icon,
  alertLevel,
  count,
  className = '',
  onClick
}: AlertMetricCardProps) {
  const getAlertStyles = () => {
    switch (alertLevel) {
      case 'success':
        return {
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-100',
          iconColor: 'text-green-400'
        }
      case 'warning':
        return {
          bgColor: 'bg-amber-500/20',
          textColor: 'text-amber-100',
          iconColor: 'text-amber-400'
        }
      case 'critical':
        return {
          bgColor: 'bg-red-500/20',
          textColor: 'text-red-100',
          iconColor: 'text-red-400'
        }
      default:
        return {
          bgColor: 'bg-gray-500/20',
          textColor: 'text-gray-100',
          iconColor: 'text-gray-400'
        }
    }
  }

  const { bgColor, textColor, iconColor } = getAlertStyles()
  const isClickable = !!onClick

  return (
    <div 
      className={`${bgColor} rounded-lg p-6 transition-all duration-200 ${
        isClickable ? 'cursor-pointer hover:scale-105' : ''
      } ${className}`}
      onClick={onClick}
      style={{ minHeight: '120px' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${textColor}/70`}>{title}</p>
            {icon && (
              <span className={`${icon} h-5 w-5 ${iconColor}`}></span>
            )}
          </div>
          
          <div className="mt-2">
            <p className={`text-2xl font-bold ${textColor}`}>{count}</p>
            {subtitle && (
              <p className={`text-xs ${textColor}/60 mt-1`}>{subtitle}</p>
            )}
          </div>

          {count > 0 && isClickable && (
            <div className="mt-3">
              <span className={`text-xs font-medium ${textColor}/80`}>
                Click to view details →
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}