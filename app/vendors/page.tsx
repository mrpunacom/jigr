'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VendorsPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to console page
    router.replace('/vendors/console')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to Vendors Console...</p>
      </div>
    </div>
  )
}