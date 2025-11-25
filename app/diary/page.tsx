'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '../components/LoadingSpinner'

export default function DiaryPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to console as the main entry point for DIARY module
    router.replace('/diary/console')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}