'use client'

import { StandardModuleLayout } from '@/app/components/UniversalModuleLayout'

interface UploadLayoutProps {
  children: React.ReactNode
}

export default function UploadLayout({ children }: UploadLayoutProps) {
  return (
    <StandardModuleLayout moduleName="upload">
      {children}
    </StandardModuleLayout>
  )
}
