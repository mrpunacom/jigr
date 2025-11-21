'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { withHeroOrDevAuth } from '@/lib/dev-auth-context'
import { TestingAssignmentCard } from '@/app/components/testing/TestingAssignmentCard'
import { SmartNotificationSystem } from '@/app/components/testing/SmartNotificationSystem'

// TypeScript interfaces for architecture mapping
interface ComponentDefinition {
  name: string
  description: string
  expectedBehavior: string
  testChecklist: string[]
  isTested: boolean
  knownIssues: string[]
  lastTested: Date | null
}

interface PageDefinition {
  module: 'PUBLIC' | 'ADMIN' | 'UPLOAD' | 'DEV'
  path: string
  title: string
  description: string
  components: ComponentDefinition[]
  testStatus: TestStatus
  lastTested: Date | null
}

interface TestStatus {
  totalComponents: number
  testedComponents: number
  passedTests: number
  failedTests: number
}

function ArchitectureTestingMapPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedModule, setSelectedModule] = useState<string>('ALL')
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set())
  const [testData, setTestData] = useState<Map<string, any>>(new Map())

  // Load test data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('architecture-test-data')
    if (savedData) {
      setTestData(new Map(JSON.parse(savedData)))
    }
  }, [])

  // Save test data to localStorage
  const saveTestData = (newData: Map<string, any>) => {
    setTestData(newData)
    localStorage.setItem('architecture-test-data', JSON.stringify(Array.from(newData.entries())))
  }

  // Application architecture definition
  const applicationArchitecture: PageDefinition[] = [
    // PUBLIC Module (Authentication & Landing)
    {
      module: 'PUBLIC',
      path: '/',
      title: 'Login Page',
      description: 'Main authentication entry point with glass morphism design',
      components: [
        {
          name: 'AuthenticationForm',
          description: 'Email/password login form with Supabase integration',
          expectedBehavior: 'Validates credentials and redirects to admin console on success',
          testChecklist: ['Email validation', 'Password field security', 'Error handling', 'Loading states'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        },
        {
          name: 'GlassMorphismCard',
          description: 'Semi-transparent card with backdrop blur effect',
          expectedBehavior: 'Renders with proper transparency and blur on all devices',
          testChecklist: ['Safari 12 compatibility', 'iPad Air rendering', 'Backdrop blur effect'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        },
        {
          name: 'JiGRLogo',
          description: 'Company logo loaded from Supabase storage',
          expectedBehavior: 'Loads and displays logo with proper scaling',
          testChecklist: ['Image loading', 'Responsive scaling', 'Alt text accessibility'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        }
      ],
      testStatus: { totalComponents: 3, testedComponents: 0, passedTests: 0, failedTests: 0 },
      lastTested: null
    },
    {
      module: 'PUBLIC',
      path: '/register',
      title: 'Account Creation',
      description: 'Multi-step registration process with plan selection',
      components: [
        {
          name: 'RegistrationForm',
          description: 'Multi-step form for new user registration',
          expectedBehavior: 'Collects user info, validates email, creates account',
          testChecklist: ['Form validation', 'Email verification', 'Password strength', 'Terms acceptance'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        },
        {
          name: 'PlanSelector',
          description: 'Subscription plan selection interface',
          expectedBehavior: 'Displays available plans with pricing and features',
          testChecklist: ['Plan display', 'Selection feedback', 'Pricing accuracy'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        }
      ],
      testStatus: { totalComponents: 2, testedComponents: 0, passedTests: 0, failedTests: 0 },
      lastTested: null
    },
    {
      module: 'PUBLIC',
      path: '/company-setup',
      title: 'Company Setup',
      description: 'Initial business information and configuration',
      components: [
        {
          name: 'CompanyInformationForm',
          description: 'Business details collection form',
          expectedBehavior: 'Collects and validates company information',
          testChecklist: ['Form validation', 'Industry selection', 'Address validation', 'Logo upload'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        },
        {
          name: 'IndustryPresets',
          description: 'Pre-configured settings for different industry types',
          expectedBehavior: 'Applies relevant compliance settings based on industry',
          testChecklist: ['Preset loading', 'Configuration application', 'Customization options'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        }
      ],
      testStatus: { totalComponents: 2, testedComponents: 0, passedTests: 0, failedTests: 0 },
      lastTested: null
    },

    // ADMIN Module (Business Management)
    {
      module: 'ADMIN',
      path: '/admin/console',
      title: 'Admin Console',
      description: 'Main administrative dashboard with business overview',
      components: [
        {
          name: 'ModuleHeader',
          description: 'Navigation header with user context and menu',
          expectedBehavior: 'Displays navigation, user info, and module switching',
          testChecklist: ['Navigation links', 'User avatar', 'Responsive menu', 'Logo display'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        },
        {
          name: 'CompanyOverviewCard',
          description: 'Business information display with edit capabilities',
          expectedBehavior: 'Shows company details with inline editing options',
          testChecklist: ['Data display', 'Edit mode toggle', 'Save functionality', 'Validation'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        },
        {
          name: 'ImageUploader',
          description: 'Company logo upload component',
          expectedBehavior: 'Handles file upload to Supabase storage',
          testChecklist: ['File selection', 'Upload progress', 'Image preview', 'Error handling'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        }
      ],
      testStatus: { totalComponents: 3, testedComponents: 0, passedTests: 0, failedTests: 0 },
      lastTested: null
    },
    {
      module: 'ADMIN',
      path: '/admin/team',
      title: 'Team Management',
      description: 'User invitation and role management system',
      components: [
        {
          name: 'UserInvitationModal',
          description: 'Modal for inviting new team members',
          expectedBehavior: 'Sends email invitations with role assignment',
          testChecklist: ['Email validation', 'Role selection', 'Invitation sending', 'Error feedback'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        },
        {
          name: 'TeamMembersList',
          description: 'List of current team members with management options',
          expectedBehavior: 'Displays team with edit/remove capabilities',
          testChecklist: ['Member display', 'Role editing', 'Remove functionality', 'Status updates'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        }
      ],
      testStatus: { totalComponents: 2, testedComponents: 0, passedTests: 0, failedTests: 0 },
      lastTested: null
    },

    // UPLOAD Module (Core Application)
    {
      module: 'UPLOAD',
      path: '/upload/console',
      title: 'Upload Dashboard',
      description: 'Main application dashboard with compliance results',
      components: [
        {
          name: 'EnhancedComplianceDashboard',
          description: 'Advanced dashboard with analytics and filtering',
          expectedBehavior: 'Displays compliance data with interactive controls',
          testChecklist: ['Data loading', 'Filter functionality', 'Chart rendering', 'Export options'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        },
        {
          name: 'SimpleResultsCard',
          description: 'Individual compliance result display cards',
          expectedBehavior: 'Shows document analysis results with actions',
          testChecklist: ['Result display', 'Action buttons', 'Image preview', 'Status indicators'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        }
      ],
      testStatus: { totalComponents: 2, testedComponents: 0, passedTests: 0, failedTests: 0 },
      lastTested: null
    },
    {
      module: 'UPLOAD',
      path: '/upload/capture',
      title: 'Document Capture',
      description: 'Camera/file upload interface for documents',
      components: [
        {
          name: 'SafariCompatibleUpload',
          description: 'iPad Air optimized file upload component',
          expectedBehavior: 'Handles camera capture and file selection',
          testChecklist: ['Camera access', 'File selection', 'Image preview', 'Upload progress'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        },
        {
          name: 'ProcessingStatusCard',
          description: 'Real-time processing status indicator',
          expectedBehavior: 'Shows upload and AI processing progress',
          testChecklist: ['Progress tracking', 'Status messages', 'Error handling', 'Completion feedback'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        }
      ],
      testStatus: { totalComponents: 2, testedComponents: 0, passedTests: 0, failedTests: 0 },
      lastTested: null
    },
    {
      module: 'UPLOAD',
      path: '/upload/reports',
      title: 'Compliance Reports',
      description: 'Generate and export compliance documentation',
      components: [
        {
          name: 'ReportGenerator',
          description: 'PDF and Excel export functionality',
          expectedBehavior: 'Generates formatted compliance reports',
          testChecklist: ['PDF generation', 'Excel export', 'Date filtering', 'Custom formatting'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        },
        {
          name: 'InspectorPortal',
          description: 'Public access portal for health inspectors',
          expectedBehavior: 'Provides secure access to compliance data',
          testChecklist: ['Access control', 'Data filtering', 'Export limitations', 'Audit logging'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        }
      ],
      testStatus: { totalComponents: 2, testedComponents: 0, passedTests: 0, failedTests: 0 },
      lastTested: null
    },

    // DEV Module (Development Tools)
    {
      module: 'DEV',
      path: '/dev/architecture-testing',
      title: 'Architecture Testing Map',
      description: 'This page - comprehensive testing dashboard with dev auth protection',
      components: [
        {
          name: 'ArchitectureMapper',
          description: 'Interactive page and component mapping system',
          expectedBehavior: 'Maps all app pages with testing capabilities',
          testChecklist: ['Page discovery', 'Component listing', 'Test tracking', 'Progress reporting'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        },
        {
          name: 'TestingChecklist',
          description: 'Interactive testing checklist with persistence',
          expectedBehavior: 'Tracks testing progress across browser sessions',
          testChecklist: ['Checkbox persistence', 'Progress calculation', 'Status indicators', 'Data export'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        },
        {
          name: 'DevAuthProtection',
          description: 'Security layer requiring dev team authentication',
          expectedBehavior: 'Blocks unauthorized access, allows dev team login',
          testChecklist: ['Login requirement', 'Session management', 'Role verification', 'Access logging'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        }
      ],
      testStatus: { totalComponents: 3, testedComponents: 0, passedTests: 0, failedTests: 0 },
      lastTested: null
    },
    {
      module: 'DEV',
      path: '/style-guide',
      title: 'Design System Guide',
      description: 'Visual reference for design tokens and components',
      components: [
        {
          name: 'DesignTokenDisplay',
          description: 'Visual representation of design system tokens',
          expectedBehavior: 'Shows colors, typography, spacing in organized layout',
          testChecklist: ['Token accuracy', 'Visual consistency', 'Responsive layout', 'Copy functionality'],
          isTested: false,
          knownIssues: [],
          lastTested: null
        }
      ],
      testStatus: { totalComponents: 1, testedComponents: 0, passedTests: 0, failedTests: 0 },
      lastTested: null
    }
  ]

  // Filter pages based on search and module selection
  const filteredPages = applicationArchitecture.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesModule = selectedModule === 'ALL' || page.module === selectedModule
    return matchesSearch && matchesModule
  })

  // Toggle page expansion
  const togglePageExpansion = (pagePath: string) => {
    const newExpanded = new Set(expandedPages)
    if (newExpanded.has(pagePath)) {
      newExpanded.delete(pagePath)
    } else {
      newExpanded.add(pagePath)
    }
    setExpandedPages(newExpanded)
  }

  // Calculate overall progress
  const totalComponents = applicationArchitecture.reduce((sum, page) => sum + page.components.length, 0)
  const testedComponents = applicationArchitecture.reduce((sum, page) => 
    sum + page.components.filter(comp => testData.get(`${page.path}-${comp.name}`)?.isTested || false).length, 0
  )
  const progressPercentage = totalComponents > 0 ? Math.round((testedComponents / totalComponents) * 100) : 0

  // Generate testing URL
  const generateTestingUrl = (path: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return `${baseUrl}${path}?testing=true&testerId=architecture_review`
  }

  // Export testing report
  const exportTestingReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      totalPages: applicationArchitecture.length,
      totalComponents: totalComponents,
      testedComponents: testedComponents,
      progressPercentage: progressPercentage,
      pages: applicationArchitecture.map(page => ({
        module: page.module,
        path: page.path,
        title: page.title,
        description: page.description,
        components: page.components.map(comp => {
          const componentKey = `${page.path}-${comp.name}`
          const componentTestData = testData.get(componentKey) || comp
          return {
            name: comp.name,
            description: comp.description,
            expectedBehavior: comp.expectedBehavior,
            testChecklist: comp.testChecklist,
            isTested: componentTestData.isTested || false,
            lastTested: componentTestData.lastTested,
            knownIssues: componentTestData.knownIssues || []
          }
        })
      }))
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jigr-architecture-testing-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Mark all components as tested
  const markAllTested = () => {
    const newTestData = new Map(testData)
    applicationArchitecture.forEach(page => {
      page.components.forEach(component => {
        const componentKey = `${page.path}-${component.name}`
        newTestData.set(componentKey, {
          ...component,
          isTested: true,
          lastTested: new Date()
        })
      })
    })
    saveTestData(newTestData)
  }

  // Reset all testing data
  const resetAllTests = () => {
    if (confirm('Are you sure you want to reset all testing data? This cannot be undone.')) {
      saveTestData(new Map())
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f1419', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Dev Auth Protected Banner */}
      <div style={{
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        padding: '12px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '600'
      }}>
        🔐 DEV TEAM AUTHENTICATED - Architecture Testing Dashboard
      </div>

      {/* Header */}
      <div style={{ padding: '24px' }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '24px'
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            🏗️ JiGR Architecture Testing Map
          </h1>
          <div style={{ display: 'flex', gap: '12px', margin: '8px 0 16px 0' }}>
            <Link
              href="/dev/feedback-analytics"
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                color: '#A78BFA',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                textDecoration: 'none',
                fontWeight: '600',
                border: '1px solid rgba(139, 92, 246, 0.4)'
              }}
            >
              📊 Analytics Dashboard
            </Link>
            <Link
              href="/dev/architecture-testing"
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                color: '#4ADE80',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                textDecoration: 'none',
                fontWeight: '600',
                border: '1px solid rgba(34, 197, 94, 0.4)'
              }}
            >
              🏗️ Architecture Testing (Current)
            </Link>
          </div>
          <p style={{ fontSize: '16px', opacity: 0.8, margin: '0 0 20px 0' }}>
            Comprehensive testing dashboard for systematic QA of all pages and components
          </p>

          {/* Enhanced Integration Notice */}
          <div style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              🚀 Enhanced Testing System Integration
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              • **Feedback Widget**: Auto device detection + screenshot capture<br />
              • **Smart Notifications**: GitHub/Slack alerts for critical issues<br />
              • **Analytics Dashboard**: Real-time feedback insights and trends<br />
              • **Assignment System**: Systematic task delegation and tracking
            </div>
          </div>

          {/* Progress Overview */}
          <div style={{
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>Overall Testing Progress</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{progressPercentage}%</span>
            </div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: '#8B5CF6',
                height: '100%',
                width: `${progressPercentage}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '4px' }}>
              {testedComponents} of {totalComponents} components tested
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Search */}
            <input
              type="text"
              placeholder="Search pages and components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            />

            {/* Module Filter */}
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="ALL">All Modules</option>
              <option value="PUBLIC">Public Pages</option>
              <option value="ADMIN">Admin Module</option>
              <option value="UPLOAD">Upload Module</option>
              <option value="DEV">Dev Tools</option>
            </select>

            {/* Actions */}
            <button
              onClick={() => setExpandedPages(new Set(filteredPages.map(p => p.path)))}
              style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Expand All
            </button>
          </div>

          {/* Additional Actions Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={markAllTested}
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ✅ Mark All Tested
            </button>

            <button
              onClick={resetAllTests}
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🗑️ Reset All
            </button>

            <button
              onClick={exportTestingReport}
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📊 Export Report
            </button>

            <button
              onClick={() => setExpandedPages(new Set())}
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(156, 163, 175, 0.2)',
                border: '1px solid rgba(156, 163, 175, 0.4)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              📁 Collapse All
            </button>
          </div>
        </div>

        {/* Pages List */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredPages.map((page) => {
            const isExpanded = expandedPages.has(page.path)
            const moduleColors = {
              PUBLIC: '#10B981',
              ADMIN: '#3B82F6', 
              UPLOAD: '#F59E0B',
              DEV: '#8B5CF6'
            }

            return (
              <div
                key={page.path}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                {/* Page Header */}
                <div
                  onClick={() => togglePageExpansion(page.path)}
                  style={{
                    padding: '20px',
                    cursor: 'pointer',
                    borderLeft: `4px solid ${moduleColors[page.module]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <span style={{
                        backgroundColor: moduleColors[page.module],
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {page.module}
                      </span>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                        {page.title}
                      </h3>
                      <Link
                        href={generateTestingUrl(page.path)}
                        target="_blank"
                        style={{
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          color: '#60A5FA',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          textDecoration: 'none',
                          fontWeight: '600'
                        }}
                      >
                        🔗 Test
                      </Link>
                    </div>
                    <p style={{ fontSize: '14px', opacity: 0.7, margin: 0 }}>
                      {page.description}
                    </p>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
                      {page.path} • {page.components.length} components
                    </div>
                  </div>
                  <div style={{ fontSize: '20px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    ▶️
                  </div>
                </div>

                {/* Components List */}
                {isExpanded && (
                  <div style={{ padding: '0 20px 20px 20px' }}>
                    {page.components.map((component) => {
                      const componentKey = `${page.path}-${component.name}`
                      const componentTestData = testData.get(componentKey) || component

                      return (
                        <div
                          key={component.name}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <input
                              type="checkbox"
                              checked={componentTestData.isTested || false}
                              onChange={(e) => {
                                const newTestData = new Map(testData)
                                newTestData.set(componentKey, {
                                  ...componentTestData,
                                  isTested: e.target.checked,
                                  lastTested: e.target.checked ? new Date() : null
                                })
                                saveTestData(newTestData)
                              }}
                              style={{ marginTop: '2px' }}
                            />
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px 0' }}>
                                🧩 {component.name}
                              </h4>
                              <p style={{ fontSize: '14px', opacity: 0.8, margin: '0 0 8px 0' }}>
                                {component.description}
                              </p>
                              <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px' }}>
                                <strong>Expected:</strong> {component.expectedBehavior}
                              </div>
                              <div style={{ fontSize: '12px' }}>
                                <strong>Test Checklist:</strong>
                                <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                                  {component.testChecklist.map((item, idx) => (
                                    <li key={idx} style={{ opacity: 0.7 }}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Testing Assignments Section */}
        <div style={{ marginTop: '30px' }}>
          <TestingAssignmentCard />
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          textAlign: 'center',
          fontSize: '12px',
          opacity: 0.6
        }}>
          JiGR Enhanced Testing System • Smart Notifications • Real-time Analytics • Assignment Management • {new Date().toLocaleDateString()}
        </div>
      
        {/* Smart Notification System */}
        <SmartNotificationSystem />
      </div>
    </div>
  )
}

// Export the protected component
export default withHeroOrDevAuth(ArchitectureTestingMapPage)