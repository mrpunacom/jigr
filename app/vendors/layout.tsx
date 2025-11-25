import { StandardModuleLayout } from '@/app/components/UniversalModuleLayout'

export default function VendorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <StandardModuleLayout moduleName="vendors">
      {children}
    </StandardModuleLayout>
  )
}