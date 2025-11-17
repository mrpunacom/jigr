'use client'

import { StandardModuleLayout } from '@/app/components/UniversalModuleLayout'

interface MenuLayoutProps {
  children: React.ReactNode
}

export default function MenuLayout({ children }: MenuLayoutProps) {
  return (
    <StandardModuleLayout moduleName="menu">
      {children}
    </StandardModuleLayout>
  )
}