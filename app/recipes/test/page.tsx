'use client'

import { useState, useEffect, useRef } from 'react'
import { LoadingSpinner } from '../../components/LoadingSpinner'

export default function TestRecipePage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<string | null>(null)
  const componentId = useRef(Math.random().toString(36).substr(2, 9))
  const hasFetchedRef = useRef(false)
  
  // Track mounts/unmounts
  useEffect(() => {
    console.log('🧪 TEST MOUNT:', componentId.current)
    return () => {
      console.log('🧪 TEST UNMOUNT:', componentId.current)
    }
  }, [])
  
  // Simulate data fetch
  useEffect(() => {
    if (hasFetchedRef.current) {
      console.log('🧪 TEST Already fetched, skipping')
      return
    }
    
    console.log('🧪 TEST Starting fetch simulation')
    hasFetchedRef.current = true
    
    const timer = setTimeout(() => {
      console.log('🧪 TEST Setting data')
      setData('Test Recipe Data Loaded Successfully! 🎉')
      setLoading(false)
      console.log('🧪 TEST Loading set to false')
    }, 1000)
    
    return () => {
      console.log('🧪 TEST Cleanup')
      clearTimeout(timer)
      if (process.env.NODE_ENV === 'development') {
        hasFetchedRef.current = false
      }
    }
  }, [])
  
  // Log each render
  console.log('🧪 TEST RENDER:', componentId.current, { 
    loading, 
    hasData: !!data 
  })
  
  if (loading) {
    console.log('🧪 TEST Rendering loading spinner')
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <LoadingSpinner />
        <div className="mt-8 space-y-2 text-center">
          <p className="text-lg font-semibold">Test Recipe Page - Loading State</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Component ID: {componentId.current}</p>
            <p>Loading: {String(loading)}</p>
            <p>Has Data: {String(!!data)}</p>
            <p className="text-xs text-gray-400 mt-4">
              Check console for detailed logs
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  console.log('🧪 TEST Rendering data (loading finished)')
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          ✅ Test Page Success!
        </h1>
        
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <p className="font-semibold text-green-800">Data:</p>
            <p className="text-green-700">{data}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="font-semibold text-blue-800">Component Info:</p>
            <div className="text-sm text-blue-700 space-y-1">
              <p>Component ID: {componentId.current}</p>
              <p>Loading State: {String(loading)}</p>
              <p>Has Data: {String(!!data)}</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => {
            console.log('🧪 TEST Reset button clicked')
            hasFetchedRef.current = false
            setLoading(true)
            setData(null)
            // Trigger re-fetch
            setTimeout(() => {
              setData('Test Recipe Data Reloaded! 🔄')
              setLoading(false)
            }, 1000)
          }}
          className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Test Reload
        </button>
      </div>
    </div>
  )
}