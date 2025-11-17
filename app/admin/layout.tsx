'use client'

import { StandardModuleLayout } from '@/app/components/UniversalModuleLayout'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <StandardModuleLayout moduleName="admin">
      {children}
    </StandardModuleLayout>
  )
}