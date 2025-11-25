'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getUserClient } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'

interface FeedbackNote {
  note: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'bug' | 'ui' | 'ux' | 'performance' | 'suggestion' | 'champion-suggestion' | 'champion-evaluation' | 'champion-priority'
  deviceInfo?: string
  screenshot?: string
  browserInfo?: string
  viewportSize?: string
}

interface AllNotes {
  [path: string]: FeedbackNote[]
}

export const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [severity, setSeverity] = useState<FeedbackNote['severity']>('medium')
  const [category, setCategory] = useState<FeedbackNote['category']>('suggestion')
  const [allNotes, setAllNotes] = useState<AllNotes>({})
  const [isTester, setIsTester] = useState(false)
  const [isHero, setIsHero] = useState(false)
  const [testerId, setTesterId] = useState('')
  const [userClient, setUserClient] = useState<any>(null)
  const [deviceInfo, setDeviceInfo] = useState('')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [takingScreenshot, setTakingScreenshot] = useState(false)
  const [includeScreenshot, setIncludeScreenshot] = useState(false)
  const pathname = usePathname()
  
  // Detect device and browser information
  const detectDeviceInfo = () => {
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    const language = navigator.language
    const viewport = `${window.innerWidth}x${window.innerHeight}`
    const screen = `${window.screen.width}x${window.screen.height}`
    const devicePixelRatio = window.devicePixelRatio
    const online = navigator.onLine
    
    // Detect device type
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const deviceType = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop'
    
    // Detect browser
    let browserName = 'Unknown'
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserName = 'Safari'
    } else if (userAgent.includes('Chrome')) {
      browserName = 'Chrome'
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox'
    } else if (userAgent.includes('Edge')) {
      browserName = 'Edge'
    }
    
    // Check for Safari 12 specifically (iPad Air 2013 target)
    const safariVersion = userAgent.match(/Version\/(\d+\.\d+)/)
    const isSafari12 = safariVersion && parseFloat(safariVersion[1]) <= 12
    
    return {
      deviceType,
      platform,
      browser: browserName,
      safariVersion: isSafari12 ? `Safari ${safariVersion?.[1] || 'Unknown'}` : null,
      viewport,
      screen,
      devicePixelRatio,
      language,
      online,
      userAgent: userAgent.substring(0, 100) + '...' // Truncate for storage
    }
  }

  useEffect(() => {
    const checkAccess = async () => {
      // Check if in testing mode via URL parameter
      const params = new URLSearchParams(window.location.search)
      const testMode = params.get('testing') === 'true'
      const testerIdParam = params.get('testerId') || 'anonymous'
      
      // Detect device information
      const deviceData = detectDeviceInfo()
      const deviceInfoString = `${deviceData.deviceType} | ${deviceData.browser} | ${deviceData.viewport} | ${deviceData.platform}${deviceData.safariVersion ? ` | ${deviceData.safariVersion}` : ''}`
      setDeviceInfo(deviceInfoString)
      
      // Check if user is a Hero (automatic access)
      let heroMode = false
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const clientInfo = await getUserClient(session.user.id)
          if (clientInfo?.champion_enrolled) {
            heroMode = true
            setIsHero(true)
            setUserClient(clientInfo)
            setTesterId(`hero_${clientInfo.name.replace(/\s+/g, '_').toLowerCase()}`)
          }
        }
      } catch (error) {
        console.log('Hero check failed:', error)
      }
      
      // Enable testing if either URL parameter OR Hero status
      const hasAccess = testMode || heroMode
      setIsTester(hasAccess)
      
      if (!heroMode) {
        setTesterId(testerIdParam)
      }
      
      if (hasAccess) {
        // Load saved notes from localStorage
        const storageKey = heroMode ? `HeroFeedbackNotes_${testerId}` : `TesterFeedbackNotes_${testerId}`
        const savedNotes = localStorage.getItem(storageKey)
        if (savedNotes) {
          try {
            setAllNotes(JSON.parse(savedNotes))
          } catch (error) {
            console.warn('Failed to parse saved feedback notes:', error)
          }
        }
      }
    }
    
    checkAccess()
  }, [])
  
  // Don't render if not in testing mode
  if (!isTester) return null
  
  // Take screenshot using html2canvas-like functionality
  const takeScreenshot = async () => {
    setTakingScreenshot(true)
    try {
      // Try to use the newer Screen Capture API if available
      if ('getDisplayMedia' in navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        })
        
        const video = document.createElement('video')
        video.srcObject = stream
        video.play()
        
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(video, 0, 0)
          
          const dataURL = canvas.toDataURL('image/jpeg', 0.7)
          setScreenshot(dataURL)
          setIncludeScreenshot(true)
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop())
        }
      } else {
        // Fallback: Create a simple page screenshot indicator
        const canvas = document.createElement('canvas')
        canvas.width = 400
        canvas.height = 300
        const ctx = canvas.getContext('2d')
        
        if (ctx) {
          // Create a simple screenshot placeholder
          ctx.fillStyle = '#f3f4f6'
          ctx.fillRect(0, 0, 400, 300)
          ctx.fillStyle = '#374151'
          ctx.font = '16px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('Screenshot capture', 200, 140)
          ctx.fillText('not available on this device', 200, 160)
          ctx.fillText(`Page: ${pathname}`, 200, 190)
          ctx.fillText(`Time: ${new Date().toLocaleTimeString()}`, 200, 210)
          
          setScreenshot(canvas.toDataURL('image/jpeg', 0.7))
          setIncludeScreenshot(true)
        }
      }
    } catch (error) {
      console.warn('Screenshot capture failed:', error)
      // Create error placeholder
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 200
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        ctx.fillStyle = '#fef2f2'
        ctx.fillRect(0, 0, 400, 200)
        ctx.fillStyle = '#dc2626'
        ctx.font = '14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Screenshot failed', 200, 90)
        ctx.fillText('Manual description recommended', 200, 110)
        
        setScreenshot(canvas.toDataURL('image/jpeg', 0.7))
      }
    } finally {
      setTakingScreenshot(false)
    }
  }

  const saveNote = () => {
    if (!notes.trim()) return
    
    const deviceData = detectDeviceInfo()
    
    const newNote: FeedbackNote = {
      note: notes.trim(),
      timestamp: new Date().toISOString(),
      severity,
      category,
      deviceInfo,
      screenshot: includeScreenshot && screenshot ? screenshot : undefined,
      browserInfo: JSON.stringify({
        browser: deviceData.browser,
        viewport: deviceData.viewport,
        screen: deviceData.screen,
        devicePixelRatio: deviceData.devicePixelRatio,
        language: deviceData.language,
        online: deviceData.online
      }),
      viewportSize: deviceData.viewport
    }
    
    const updatedNotes = {
      ...allNotes,
      [pathname]: [...(allNotes[pathname] || []), newNote]
    }
    
    setAllNotes(updatedNotes)
    const storageKey = isHero ? `HeroFeedbackNotes_${testerId}` : `TesterFeedbackNotes_${testerId}`
    localStorage.setItem(storageKey, JSON.stringify(updatedNotes))
    setNotes('')
    setScreenshot(null)
    setIncludeScreenshot(false)
    setIsOpen(false)
    
    // Show confirmation
    const confirmationEl = document.createElement('div')
    confirmationEl.textContent = '✅ Note saved!'
    confirmationEl.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      background: #10B981;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `
    document.body.appendChild(confirmationEl)
    setTimeout(() => document.body.removeChild(confirmationEl), 2000)
  }
  
  const sendAllFeedback = () => {
    const totalNotes = Object.values(allNotes).reduce((sum, pageNotes) => sum + pageNotes.length, 0)
    
    if (totalNotes === 0) {
      alert('No feedback notes to send. Add some notes first!')
      return
    }
    
    const feedbackData = {
      testerId: testerId,
      device: 'iPad Air Safari 12', // Legacy field
      deviceInfo: deviceInfo, // Enhanced device detection
      timestamp: new Date().toISOString(),
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.11.1',
      totalPages: Object.keys(allNotes).length,
      totalNotes: totalNotes,
      feedback: allNotes,
      enhancedFeedback: {
        hasScreenshots: Object.values(allNotes).flat().some(note => note.screenshot),
        totalScreenshots: Object.values(allNotes).flat().filter(note => note.screenshot).length,
        deviceTypes: [...new Set(Object.values(allNotes).flat().map(note => note.deviceInfo).filter(Boolean))],
        viewportSizes: [...new Set(Object.values(allNotes).flat().map(note => note.viewportSize).filter(Boolean))]
      }
    }
    
    const subject = isHero 
      ? `🏆 HERO FEEDBACK - ${feedbackData.testerId} (${totalNotes} notes)` 
      : `JiGR Testing Feedback - ${feedbackData.testerId} (${totalNotes} notes)`
    const body = `
JiGR Hospitality Compliance Platform - ${isHero ? 'Hero' : 'Tester'} Feedback Report

=== FEEDBACK SUMMARY ===
Tester ID: ${feedbackData.testerId}
Device: ${feedbackData.device}
Detailed Device Info: ${feedbackData.deviceInfo || 'Not available'}
App Version: ${feedbackData.appVersion}
Testing Date: ${new Date(feedbackData.timestamp).toLocaleDateString('en-NZ')}
Total Pages Reviewed: ${feedbackData.totalPages}
Total Notes: ${feedbackData.totalNotes}

=== DETAILED FEEDBACK ===

${Object.entries(allNotes).map(([path, pageNotes]) => `
PAGE: ${path}
${pageNotes.map((note, index) => `
  Note ${index + 1}:
  Category: ${note.category.toUpperCase()}
  Severity: ${note.severity.toUpperCase()}
  Time: ${new Date(note.timestamp).toLocaleString('en-NZ')}
  Device: ${note.deviceInfo || 'Not specified'}
  Viewport: ${note.viewportSize || 'Not specified'}
  Screenshot: ${note.screenshot ? 'Included' : 'Not included'}
  Feedback: ${note.note}
`).join('\n')}
`).join('\n')}

=== RAW DATA (for processing) ===
${JSON.stringify(feedbackData, null, 2)}

---
Generated by JiGR Testing Feedback System
    `.trim()
    
    // Create mailto link
    const mailtoLink = `mailto:dev@jigr.app?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    
    // Open email client
    window.location.href = mailtoLink
  }
  
  const clearAllNotes = () => {
    if (!confirm('Are you sure you want to clear all your feedback notes? This cannot be undone.')) {
      return
    }
    
    setAllNotes({})
    const storageKey = isHero ? `HeroFeedbackNotes_${testerId}` : `TesterFeedbackNotes_${testerId}`
    localStorage.removeItem(storageKey)
    setIsOpen(false)
    
    // Show confirmation
    const confirmationEl = document.createElement('div')
    confirmationEl.textContent = '🗑️ All notes cleared!'
    confirmationEl.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      background: #EF4444;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `
    document.body.appendChild(confirmationEl)
    setTimeout(() => document.body.removeChild(confirmationEl), 2000)
  }
  
  const pageNotesCount = allNotes[pathname]?.length || 0
  const totalNotesCount = Object.values(allNotes).reduce((sum, pageNotes) => sum + pageNotes.length, 0)
  
  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          cursor: 'pointer',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
{isHero ? '🏆 Hero Feedback' : '📝 Testing Feedback'}
        {totalNotesCount > 0 && (
          <span style={{
            background: '#EF4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {totalNotesCount}
          </span>
        )}
      </button>
      
      {/* Feedback Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          right: '0',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          padding: '20px',
          width: '320px',
          maxHeight: '500px',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(10px)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ 
              margin: '0 0 4px 0', 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#1F2937' 
            }}>
              {isHero ? '🏆 Hero Feedback' : 'Page Feedback'}
            </h3>
            <p style={{ 
              margin: '0', 
              fontSize: '12px', 
              color: '#6B7280',
              wordBreak: 'break-all'
            }}>
              {pathname}
            </p>
            <p style={{ 
              margin: '4px 0 0 0', 
              fontSize: '12px', 
              color: '#6B7280'
            }}>
              Tester: {testerId} | Notes on this page: {pageNotesCount}
            </p>
          </div>
          
          {/* Note Input */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe any issues, suggestions, or observations about this page..."
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
              minHeight: '80px',
              marginBottom: '12px',
              fontFamily: 'inherit'
            }}
          />
          
          {/* Category and Severity */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackNote['category'])}
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'inherit'
              }}
            >
              <option value="suggestion">Suggestion</option>
              <option value="bug">Bug</option>
              <option value="ui">UI Issue</option>
              <option value="ux">UX Issue</option>
              <option value="performance">Performance</option>
              {isHero && (
                <>
                  <option value="hero-suggestion">🏆 Hero Feature Request</option>
                  <option value="hero-evaluation">🏆 Evaluation Feedback</option>
                  <option value="hero-priority">🏆 Priority Issue</option>
                </>
              )}
            </select>
            
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as FeedbackNote['severity'])}
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'inherit'
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          {/* Device Info Display */}
          <div style={{ 
            fontSize: '11px', 
            color: '#6B7280', 
            marginBottom: '12px',
            padding: '8px',
            backgroundColor: '#F9FAFB',
            borderRadius: '6px',
            border: '1px solid #E5E7EB'
          }}>
            📱 Device: {deviceInfo}
          </div>
          
          {/* Screenshot Section */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input
                type="checkbox"
                id="includeScreenshot"
                checked={includeScreenshot}
                onChange={(e) => setIncludeScreenshot(e.target.checked)}
                style={{ margin: 0 }}
              />
              <label htmlFor="includeScreenshot" style={{ 
                fontSize: '12px', 
                fontWeight: '500',
                cursor: 'pointer',
                color: '#374151'
              }}>
                📸 Include Screenshot
              </label>
              {!screenshot && (
                <button
                  onClick={takeScreenshot}
                  disabled={takingScreenshot}
                  style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    backgroundColor: takingScreenshot ? '#9CA3AF' : '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: takingScreenshot ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  {takingScreenshot ? '📸 Capturing...' : '📸 Capture'}
                </button>
              )}
            </div>
            
            {/* Screenshot Preview */}
            {screenshot && includeScreenshot && (
              <div style={{
                marginTop: '8px',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <img
                  src={screenshot}
                  alt="Screenshot preview"
                  style={{
                    width: '100%',
                    maxHeight: '120px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  padding: '6px',
                  backgroundColor: '#F9FAFB',
                  fontSize: '10px',
                  color: '#6B7280',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>Screenshot captured</span>
                  <button
                    onClick={() => {
                      setScreenshot(null)
                      setIncludeScreenshot(false)
                    }}
                    style={{
                      fontSize: '10px',
                      color: '#EF4444',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={saveNote}
              disabled={!notes.trim()}
              style={{
                flex: 1,
                background: notes.trim() ? '#10B981' : '#9CA3AF',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: notes.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit'
              }}
            >
              Save Note
            </button>
            
            <button
              onClick={sendAllFeedback}
              disabled={totalNotesCount === 0}
              style={{
                flex: 1,
                background: totalNotesCount > 0 ? '#3B82F6' : '#9CA3AF',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: totalNotesCount > 0 ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit'
              }}
            >
              Send All ({totalNotesCount})
            </button>
          </div>
          
          {/* Clear Notes Button */}
          {totalNotesCount > 0 && (
            <button
              onClick={clearAllNotes}
              style={{
                width: '100%',
                background: '#EF4444',
                color: 'white',
                border: 'none',
                padding: '8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '16px',
                fontFamily: 'inherit'
              }}
            >
              Clear All Notes
            </button>
          )}
          
          {/* Show existing notes for this page */}
          {pageNotesCount > 0 && (
            <div style={{
              borderTop: '1px solid #E5E7EB',
              paddingTop: '12px'
            }}>
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '12px',
                fontWeight: '600',
                color: '#1F2937'
              }}>
                Notes for this page:
              </p>
              {allNotes[pathname]?.map((note, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: '12px',
                    marginBottom: '8px',
                    padding: '8px',
                    background: '#F3F4F6',
                    borderRadius: '6px',
                    borderLeft: `3px solid ${
                      note.severity === 'critical' ? '#EF4444' :
                      note.severity === 'high' ? '#F59E0B' :
                      note.severity === 'medium' ? '#3B82F6' : '#10B981'
                    }`
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '4px'
                  }}>
                    <span style={{ 
                      fontWeight: '500',
                      color: '#1F2937',
                      fontSize: '11px'
                    }}>
                      {note.category.toUpperCase()} - {note.severity.toUpperCase()}
                    </span>
                    <span style={{ 
                      color: '#6B7280',
                      fontSize: '10px'
                    }}>
                      {new Date(note.timestamp).toLocaleTimeString('en-NZ', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div style={{ color: '#1F2937' }}>
                    {note.note}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}