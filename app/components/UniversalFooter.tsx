'use client'

import { FONT_FAMILY, FONT_SIZES, IOS_COLORS } from '@/lib/apple-design-system'
import { getVersionDisplay } from '@/lib/version'

interface UniversalFooterProps {
  className?: string
}

export function UniversalFooter({ className = '' }: UniversalFooterProps) {
  const version = getVersionDisplay('short')

  return (
    <footer 
      className={className}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.05)', // Slight background fill
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
        padding: '24px 0',
        marginTop: 'auto',
        textAlign: 'center',
      }}
    >
      <div 
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        <div 
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {/* Links Row */}
          <div 
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            <span 
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: '400',
                color: IOS_COLORS.LABEL_SECONDARY,
                cursor: 'pointer',
              }}
            >
              JiGR Heroes
            </span>
            <span 
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: '400',
                color: IOS_COLORS.LABEL_SECONDARY,
                cursor: 'pointer',
              }}
            >
              Contact Resolution
            </span>
          </div>
          
          {/* Copyright Row */}
          <div 
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.CAPTION,
              fontWeight: '400',
              color: IOS_COLORS.LABEL_SECONDARY,
              marginTop: '8px',
            }}
          >
            ©2025 | JiGR Modular Hospitality Solution
          </div>
          
          {/* Version Row */}
          <div 
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.CAPTION,
              fontWeight: '400',
              color: IOS_COLORS.LABEL_TERTIARY,
              marginTop: '4px',
            }}
          >
            Version {version}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default UniversalFooter