'use client'

import { StandardModuleLayout } from '@/app/components/UniversalModuleLayout'

interface StockLayoutProps {
  children: React.ReactNode
}

export default function StockLayout({ children }: StockLayoutProps) {
  return (
    <StandardModuleLayout moduleName="stock">
      {children}
    </StandardModuleLayout>
  )
}