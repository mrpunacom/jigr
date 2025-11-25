import { ActionCard } from './ModuleCard'

interface QuickActionButtonProps {
  title: string
  description?: string
  icon: string
  onClick: () => void
  theme?: 'upload' | 'admin' | 'default' | 'light'
  disabled?: boolean
  className?: string
  size?: 'small' | 'medium' | 'large'
}

export function QuickActionButton({
  title,
  description,
  icon,
  onClick,
  theme = 'light',
  disabled = false,
  className = '',
  size = 'medium'
}: QuickActionButtonProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: 'p-4',
          iconSize: 'h-5 w-5',
          titleSize: 'text-sm',
          descSize: 'text-xs',
          minHeight: '80px'
        }
      case 'large':
        return {
          padding: 'p-8',
          iconSize: 'h-8 w-8',
          titleSize: 'text-lg',
          descSize: 'text-sm',
          minHeight: '140px'
        }
      default: // medium
        return {
          padding: 'p-6',
          iconSize: 'h-6 w-6',
          titleSize: 'text-base',
          descSize: 'text-xs',
          minHeight: '110px'
        }
    }
  }

  const { padding, iconSize, titleSize, descSize, minHeight } = getSizeStyles()

  return (
    <ActionCard
      theme={theme}
      onClick={onClick}
      disabled={disabled}
      className={`${padding} text-center transition-transform duration-200 hover:scale-105 ${className}`}
    >
      <div className="flex flex-col items-center justify-center space-y-3" style={{ minHeight }}>
        <div className="flex items-center justify-center">
          <span className={`${icon} ${iconSize} text-white`}></span>
        </div>
        
        <div className="space-y-1">
          <h3 className={`${titleSize} font-semibold text-white`}>{title}</h3>
          {description && (
            <p className={`${descSize} text-white/70`}>{description}</p>
          )}
        </div>

        {!disabled && (
          <div className="pt-2">
            <div className="text-xs text-white/60">
              Tap to start →
            </div>
          </div>
        )}
      </div>
    </ActionCard>
  )
}

export function QuickActionGrid({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {children}
    </div>
  )
}