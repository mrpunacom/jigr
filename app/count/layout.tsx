'use client'

import { StandardModuleLayout } from '@/app/components/UniversalModuleLayout'

interface CountLayoutProps {
  children: React.ReactNode
}

export default function CountLayout({ children }: CountLayoutProps) {
  return (
    <StandardModuleLayout moduleName="count">
      {children}
    </StandardModuleLayout>
  )
}