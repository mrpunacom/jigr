'use client'

import { useState, useEffect } from 'react'

interface TestingAssignment {
  id: string
  title: string
  description: string
  assignee: string
  assigneeType: 'developer' | 'hero' | 'tester'
  pages: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  dueDate?: string
  createdBy: string
  createdAt: string
  completedAt?: string
  estimatedTime?: number // minutes
  actualTime?: number // minutes
  requirements: TestingRequirement[]
  results?: TestingResults
}

interface TestingRequirement {
  id: string
  description: string
  type: 'functional' | 'visual' | 'performance' | 'accessibility' | 'compatibility'
  completed: boolean
  notes?: string
}

interface TestingResults {
  summary: string
  issuesFound: number
  screenshotsTaken: number
  timeSpent: number
  recommendations: string[]
  completionRate: number
}

interface TestingTemplate {
  id: string
  name: string
  description: string
  pages: string[]
  requirements: TestingRequirement[]
  estimatedTime: number
  category: 'new-feature' | 'regression' | 'cross-browser' | 'mobile' | 'accessibility'
}

export const TestingAssignmentCard = () => {
  const [assignments, setAssignments] = useState<TestingAssignment[]>([])
  const [templates, setTemplates] = useState<TestingTemplate[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [newAssignment, setNewAssignment] = useState<Partial<TestingAssignment>>({
    title: '',
    description: '',
    assignee: '',
    assigneeType: 'tester',
    pages: [],
    priority: 'medium',
    status: 'pending',
    requirements: []
  })

  // Available testers and developers
  const availableTesters = [
    { id: 'steve_laird', name: 'Steve Laird', type: 'developer', expertise: ['mobile', 'safari', 'ipad'] },
    { id: 'hero_demo', name: 'Demo Hero Champion', type: 'hero', expertise: ['business-flow', 'ux', 'hospitality'] },
    { id: 'tester_1', name: 'QA Tester 1', type: 'tester', expertise: ['functional', 'regression', 'cross-browser'] },
    { id: 'tester_2', name: 'QA Tester 2', type: 'tester', expertise: ['accessibility', 'performance', 'mobile'] }
  ]

  // Load assignments from localStorage
  useEffect(() => {
    const savedAssignments = localStorage.getItem('testingAssignments')
    if (savedAssignments) {
      try {
        setAssignments(JSON.parse(savedAssignments))
      } catch (error) {
        console.warn('Failed to parse testing assignments:', error)
      }
    }

    loadTestingTemplates()
  }, [])

  // Load predefined testing templates
  const loadTestingTemplates = () => {
    const defaultTemplates: TestingTemplate[] = [
      {
        id: 'new-feature-test',
        name: 'New Feature Testing',
        description: 'Comprehensive testing for new feature releases',
        pages: ['/admin/console', '/admin/team', '/admin/settings'],
        estimatedTime: 120, // 2 hours
        category: 'new-feature',
        requirements: [
          { id: 'func-1', description: 'Verify all primary functionality works as expected', type: 'functional', completed: false },
          { id: 'func-2', description: 'Test error handling and edge cases', type: 'functional', completed: false },
          { id: 'vis-1', description: 'Check UI consistency with design system', type: 'visual', completed: false },
          { id: 'perf-1', description: 'Verify page load times are acceptable', type: 'performance', completed: false },
          { id: 'acc-1', description: 'Test keyboard navigation and screen reader compatibility', type: 'accessibility', completed: false }
        ]
      },
      {
        id: 'ipad-compatibility',
        name: 'iPad Air Compatibility Test',
        description: 'Specific testing for iPad Air with Safari 12 compatibility',
        pages: ['/', '/admin/console', '/upload/capture', '/admin/team'],
        estimatedTime: 90, // 1.5 hours
        category: 'mobile',
        requirements: [
          { id: 'comp-1', description: 'Verify touch interactions work properly', type: 'compatibility', completed: false },
          { id: 'comp-2', description: 'Test portrait and landscape orientations', type: 'compatibility', completed: false },
          { id: 'vis-2', description: 'Check glass morphism effects render correctly', type: 'visual', completed: false },
          { id: 'func-3', description: 'Test file upload and camera access', type: 'functional', completed: false },
          { id: 'perf-2', description: 'Monitor memory usage and performance', type: 'performance', completed: false }
        ]
      },
      {
        id: 'regression-test',
        name: 'Regression Testing Suite',
        description: 'Full regression test after major updates',
        pages: ['/', '/admin/console', '/upload/console', '/upload/capture', '/upload/reports', '/admin/team', '/admin/profile'],
        estimatedTime: 180, // 3 hours
        category: 'regression',
        requirements: [
          { id: 'reg-1', description: 'Verify login and authentication flow', type: 'functional', completed: false },
          { id: 'reg-2', description: 'Test all CRUD operations', type: 'functional', completed: false },
          { id: 'reg-3', description: 'Check navigation and routing', type: 'functional', completed: false },
          { id: 'reg-4', description: 'Verify data persistence and refresh', type: 'functional', completed: false },
          { id: 'vis-3', description: 'Check for visual regressions', type: 'visual', completed: false }
        ]
      },
      {
        id: 'accessibility-audit',
        name: 'Accessibility Compliance Audit',
        description: 'WCAG 2.1 AA compliance testing',
        pages: ['/', '/admin/console', '/admin/team', '/upload/capture'],
        estimatedTime: 150, // 2.5 hours
        category: 'accessibility',
        requirements: [
          { id: 'acc-2', description: 'Test with screen reader (VoiceOver on Safari)', type: 'accessibility', completed: false },
          { id: 'acc-3', description: 'Verify keyboard-only navigation', type: 'accessibility', completed: false },
          { id: 'acc-4', description: 'Check color contrast ratios', type: 'accessibility', completed: false },
          { id: 'acc-5', description: 'Verify focus indicators and skip links', type: 'accessibility', completed: false },
          { id: 'acc-6', description: 'Test with browser zoom up to 200%', type: 'accessibility', completed: false }
        ]
      },
      {
        id: 'cross-browser-test',
        name: 'Cross-Browser Compatibility',
        description: 'Test across multiple browsers and devices',
        pages: ['/', '/admin/console', '/upload/capture'],
        estimatedTime: 120, // 2 hours
        category: 'cross-browser',
        requirements: [
          { id: 'cross-1', description: 'Test on Safari 12+ (iPad Air target)', type: 'compatibility', completed: false },
          { id: 'cross-2', description: 'Test on Chrome latest (Desktop)', type: 'compatibility', completed: false },
          { id: 'cross-3', description: 'Test on Firefox latest (Desktop)', type: 'compatibility', completed: false },
          { id: 'cross-4', description: 'Test on Safari iOS (iPhone)', type: 'compatibility', completed: false },
          { id: 'cross-5', description: 'Check responsive breakpoints', type: 'visual', completed: false }
        ]
      }
    ]
    setTemplates(defaultTemplates)
  }

  // Create new assignment
  const createAssignment = () => {
    if (!newAssignment.title || !newAssignment.assignee) return

    const assignment: TestingAssignment = {
      id: `assignment-${Date.now()}`,
      title: newAssignment.title,
      description: newAssignment.description || '',
      assignee: newAssignment.assignee,
      assigneeType: newAssignment.assigneeType || 'tester',
      pages: newAssignment.pages || [],
      priority: newAssignment.priority || 'medium',
      status: 'pending',
      createdBy: 'system_admin', // Would be current user
      createdAt: new Date().toISOString(),
      estimatedTime: newAssignment.estimatedTime,
      requirements: newAssignment.requirements || []
    }

    const updatedAssignments = [assignment, ...assignments]
    setAssignments(updatedAssignments)
    localStorage.setItem('testingAssignments', JSON.stringify(updatedAssignments))

    // Reset form
    setNewAssignment({
      title: '',
      description: '',
      assignee: '',
      assigneeType: 'tester',
      pages: [],
      priority: 'medium',
      status: 'pending',
      requirements: []
    })
    setSelectedTemplate('')
    setShowCreateForm(false)
  }

  // Load template into new assignment form
  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    setNewAssignment({
      title: template.name,
      description: template.description,
      pages: [...template.pages],
      estimatedTime: template.estimatedTime,
      requirements: template.requirements.map(req => ({ ...req, id: `${req.id}-${Date.now()}` })),
      assignee: '',
      assigneeType: 'tester',
      priority: 'medium',
      status: 'pending'
    })
  }

  // Update assignment status
  const updateAssignmentStatus = (assignmentId: string, newStatus: TestingAssignment['status']) => {
    const updatedAssignments = assignments.map(assignment => {
      if (assignment.id === assignmentId) {
        const updated = { ...assignment, status: newStatus }
        if (newStatus === 'completed' && !assignment.completedAt) {
          updated.completedAt = new Date().toISOString()
        }
        return updated
      }
      return assignment
    })
    setAssignments(updatedAssignments)
    localStorage.setItem('testingAssignments', JSON.stringify(updatedAssignments))
  }

  // Delete assignment
  const deleteAssignment = (assignmentId: string) => {
    const updatedAssignments = assignments.filter(a => a.id !== assignmentId)
    setAssignments(updatedAssignments)
    localStorage.setItem('testingAssignments', JSON.stringify(updatedAssignments))
  }

  // Generate testing URL for assignment
  const generateTestingUrl = (assignment: TestingAssignment) => {
    const baseUrl = window.location.origin
    const testParams = new URLSearchParams({
      testing: 'true',
      testerId: assignment.assignee,
      assignment: assignment.id,
      priority: assignment.priority
    })
    return `${baseUrl}?${testParams.toString()}`
  }

  // Calculate assignment statistics
  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => a.status === 'pending').length,
    inProgress: assignments.filter(a => a.status === 'in_progress').length,
    completed: assignments.filter(a => a.status === 'completed').length,
    blocked: assignments.filter(a => a.status === 'blocked').length,
    completionRate: assignments.length > 0 ? Math.round((assignments.filter(a => a.status === 'completed').length / assignments.length) * 100) : 0
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#EF4444'
      case 'high': return '#F59E0B'
      case 'medium': return '#3B82F6'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981'
      case 'in_progress': return '#3B82F6'
      case 'blocked': return '#EF4444'
      case 'pending': return '#6B7280'
      default: return '#6B7280'
    }
  }

  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '20px',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>
            📋 Testing Assignments
          </h3>
          <p style={{ fontSize: '14px', opacity: 0.8, margin: 0 }}>
            Systematic testing task delegation and tracking
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {showCreateForm ? 'Cancel' : '+ New Assignment'}
        </button>
      </div>

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3B82F6' }}>{stats.total}</div>
          <div style={{ fontSize: '11px', opacity: 0.7 }}>Total</div>
        </div>
        <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6B7280' }}>{stats.pending}</div>
          <div style={{ fontSize: '11px', opacity: 0.7 }}>Pending</div>
        </div>
        <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3B82F6' }}>{stats.inProgress}</div>
          <div style={{ fontSize: '11px', opacity: 0.7 }}>In Progress</div>
        </div>
        <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10B981' }}>{stats.completed}</div>
          <div style={{ fontSize: '11px', opacity: 0.7 }}>Completed</div>
        </div>
        <div style={{ textAlign: 'center', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10B981' }}>{stats.completionRate}%</div>
          <div style={{ fontSize: '11px', opacity: 0.7 }}>Success Rate</div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0' }}>Create New Assignment</h4>
          
          {/* Template Selection */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
              Use Template (Optional)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value)
                  if (e.target.value) loadTemplate(e.target.value)
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '12px'
                }}
              >
                <option value="">Select a template...</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id} style={{ color: 'black' }}>
                    {template.name} ({template.estimatedTime}min)
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <button
                  onClick={() => {
                    setSelectedTemplate('')
                    setNewAssignment({
                      title: '',
                      description: '',
                      assignee: '',
                      assigneeType: 'tester',
                      pages: [],
                      priority: 'medium',
                      status: 'pending',
                      requirements: []
                    })
                  }}
                  style={{
                    padding: '8px',
                    backgroundColor: '#6B7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                Title *
              </label>
              <input
                type="text"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                placeholder="Enter assignment title..."
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '12px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                Priority
              </label>
              <select
                value={newAssignment.priority}
                onChange={(e) => setNewAssignment({ ...newAssignment, priority: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '12px'
                }}
              >
                <option value="low" style={{ color: 'black' }}>Low</option>
                <option value="medium" style={{ color: 'black' }}>Medium</option>
                <option value="high" style={{ color: 'black' }}>High</option>
                <option value="critical" style={{ color: 'black' }}>Critical</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                Assignee *
              </label>
              <select
                value={newAssignment.assignee}
                onChange={(e) => {
                  const tester = availableTesters.find(t => t.id === e.target.value)
                  setNewAssignment({ 
                    ...newAssignment, 
                    assignee: e.target.value,
                    assigneeType: tester?.type as any || 'tester'
                  })
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '12px'
                }}
              >
                <option value="">Select assignee...</option>
                {availableTesters.map(tester => (
                  <option key={tester.id} value={tester.id} style={{ color: 'black' }}>
                    {tester.name} ({tester.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                Estimated Time (min)
              </label>
              <input
                type="number"
                value={newAssignment.estimatedTime || ''}
                onChange={(e) => setNewAssignment({ ...newAssignment, estimatedTime: parseInt(e.target.value) || undefined })}
                placeholder="60"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
              Description
            </label>
            <textarea
              value={newAssignment.description}
              onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
              placeholder="Describe the testing requirements and objectives..."
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '12px',
                minHeight: '60px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={createAssignment}
              disabled={!newAssignment.title || !newAssignment.assignee}
              style={{
                padding: '10px 16px',
                backgroundColor: (newAssignment.title && newAssignment.assignee) ? '#10B981' : '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: (newAssignment.title && newAssignment.assignee) ? 'pointer' : 'not-allowed'
              }}
            >
              Create Assignment
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              style={{
                padding: '10px 16px',
                backgroundColor: '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <div>No testing assignments created yet</div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            Create your first assignment to start systematic testing
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {assignments.map(assignment => {
            const tester = availableTesters.find(t => t.id === assignment.assignee)
            
            return (
              <div
                key={assignment.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderLeft: `4px solid ${getPriorityColor(assignment.priority)}`,
                  borderRadius: '8px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>
                        {assignment.title}
                      </h4>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: getPriorityColor(assignment.priority),
                        color: 'white'
                      }}>
                        {assignment.priority.toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: getStatusColor(assignment.status),
                        color: 'white'
                      }}>
                        {assignment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>
                      <strong>Assignee:</strong> {tester?.name || assignment.assignee} ({assignment.assigneeType})
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>
                      {assignment.description}
                    </div>
                    {assignment.pages.length > 0 && (
                      <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>
                        <strong>Pages:</strong> {assignment.pages.join(', ')}
                      </div>
                    )}
                    {assignment.estimatedTime && (
                      <div style={{ fontSize: '11px', opacity: 0.6, marginTop: '2px' }}>
                        <strong>Estimated time:</strong> {assignment.estimatedTime} minutes
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {assignment.status === 'pending' && (
                      <button
                        onClick={() => updateAssignmentStatus(assignment.id, 'in_progress')}
                        style={{
                          fontSize: '10px',
                          padding: '4px 8px',
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Start
                      </button>
                    )}
                    {assignment.status === 'in_progress' && (
                      <button
                        onClick={() => updateAssignmentStatus(assignment.id, 'completed')}
                        style={{
                          fontSize: '10px',
                          padding: '4px 8px',
                          backgroundColor: '#10B981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Complete
                      </button>
                    )}
                    <a
                      href={generateTestingUrl(assignment)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '10px',
                        padding: '4px 8px',
                        backgroundColor: '#8B5CF6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        textDecoration: 'none'
                      }}
                    >
                      🔗 Test
                    </a>
                    <button
                      onClick={() => deleteAssignment(assignment.id)}
                      style={{
                        fontSize: '10px',
                        padding: '4px 8px',
                        backgroundColor: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Requirements Progress */}
                {assignment.requirements && assignment.requirements.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '500', marginBottom: '4px' }}>
                      Requirements ({assignment.requirements.filter(r => r.completed).length}/{assignment.requirements.length})
                    </div>
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      height: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        backgroundColor: '#10B981',
                        height: '100%',
                        width: `${(assignment.requirements.filter(r => r.completed).length / assignment.requirements.length) * 100}%`,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '8px', display: 'flex', gap: '16px' }}>
                  <span>Created: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                  {assignment.completedAt && (
                    <span>Completed: {new Date(assignment.completedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}