'use client'

import { StandardModuleLayout } from '@/app/components/UniversalModuleLayout'

interface RecipesLayoutProps {
  children: React.ReactNode
}

export default function RecipesLayout({ children }: RecipesLayoutProps) {
  return (
    <StandardModuleLayout moduleName="recipes">
      {children}
    </StandardModuleLayout>
  )
}