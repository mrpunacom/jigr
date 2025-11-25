'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '../components/LoadingSpinner'

export default function MenuPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to console as the main entry point for MENU module
    router.replace('/menu/console')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}