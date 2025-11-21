'use client'

import { useState, useEffect } from 'react'

interface NotificationRule {
  id: string
  name: string
  trigger: 'severity' | 'category' | 'frequency' | 'keyword'
  condition: string
  actions: NotificationAction[]
  enabled: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface NotificationAction {
  type: 'email' | 'slack' | 'github' | 'webhook'
  config: {
    recipient?: string
    channel?: string
    webhookUrl?: string
    template?: string
  }
}

interface FeedbackNotification {
  id: string
  testerId: string
  severity: string
  category: string
  page: string
  message: string
  deviceInfo?: string
  screenshot?: boolean
  timestamp: string
}

export const SmartNotificationSystem = () => {
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [notifications, setNotifications] = useState<FeedbackNotification[]>([])
  const [showConfig, setShowConfig] = useState(false)
  const [newRule, setNewRule] = useState<Partial<NotificationRule>>({
    name: '',
    trigger: 'severity',
    condition: '',
    actions: [],
    enabled: true,
    priority: 'medium'
  })

  // Load rules from localStorage
  useEffect(() => {
    const savedRules = localStorage.getItem('smartNotificationRules')
    if (savedRules) {
      try {
        setRules(JSON.parse(savedRules))
      } catch (error) {
        console.warn('Failed to parse notification rules:', error)
        loadDefaultRules()
      }
    } else {
      loadDefaultRules()
    }
  }, [])

  // Load default notification rules
  const loadDefaultRules = () => {
    const defaultRules: NotificationRule[] = [
      {
        id: 'critical-issues',
        name: 'Critical Issues Alert',
        trigger: 'severity',
        condition: 'critical',
        actions: [
          {
            type: 'email',
            config: {
              recipient: 'dev@jigr.app',
              template: 'critical_alert'
            }
          },
          {
            type: 'slack',
            config: {
              channel: '#dev-alerts',
              template: 'slack_critical'
            }
          }
        ],
        enabled: true,
        priority: 'critical'
      },
      {
        id: 'high-priority-bugs',
        name: 'High Priority Bugs',
        trigger: 'severity',
        condition: 'high',
        actions: [
          {
            type: 'github',
            config: {
              template: 'github_issue'
            }
          },
          {
            type: 'email',
            config: {
              recipient: 'dev@jigr.app',
              template: 'bug_alert'
            }
          }
        ],
        enabled: true,
        priority: 'high'
      },
      {
        id: 'hero-feedback',
        name: 'Hero Champion Feedback',
        trigger: 'category',
        condition: 'hero-priority',
        actions: [
          {
            type: 'email',
            config: {
              recipient: 'dev@jigr.app',
              template: 'hero_feedback'
            }
          },
          {
            type: 'slack',
            config: {
              channel: '#champion-feedback',
              template: 'hero_slack'
            }
          }
        ],
        enabled: true,
        priority: 'high'
      },
      {
        id: 'login-issues',
        name: 'Login Page Issues',
        trigger: 'keyword',
        condition: 'login,authentication,signin',
        actions: [
          {
            type: 'email',
            config: {
              recipient: 'dev@jigr.app',
              template: 'auth_issue'
            }
          }
        ],
        enabled: true,
        priority: 'high'
      },
      {
        id: 'frequent-issues',
        name: 'Frequent Issues on Same Page',
        trigger: 'frequency',
        condition: '3', // 3 or more issues on same page
        actions: [
          {
            type: 'github',
            config: {
              template: 'frequent_issue'
            }
          }
        ],
        enabled: true,
        priority: 'medium'
      }
    ]
    setRules(defaultRules)
    localStorage.setItem('smartNotificationRules', JSON.stringify(defaultRules))
  }

  // Process feedback against notification rules
  const processFeedback = (feedback: FeedbackNotification) => {
    rules.forEach(rule => {
      if (!rule.enabled) return

      let shouldTrigger = false

      switch (rule.trigger) {
        case 'severity':
          shouldTrigger = feedback.severity === rule.condition
          break
        case 'category':
          shouldTrigger = feedback.category === rule.condition
          break
        case 'keyword':
          const keywords = rule.condition.split(',').map(k => k.trim().toLowerCase())
          shouldTrigger = keywords.some(keyword => 
            feedback.message.toLowerCase().includes(keyword) ||
            feedback.page.toLowerCase().includes(keyword)
          )
          break
        case 'frequency':
          // Check if this page has received multiple feedback items recently
          const recentFeedback = notifications.filter(n => 
            n.page === feedback.page &&
            new Date(n.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          )
          shouldTrigger = recentFeedback.length >= parseInt(rule.condition)
          break
      }

      if (shouldTrigger) {
        triggerNotifications(rule, feedback)
      }
    })
  }

  // Trigger notifications based on rule
  const triggerNotifications = (rule: NotificationRule, feedback: FeedbackNotification) => {
    rule.actions.forEach(action => {
      switch (action.type) {
        case 'email':
          sendEmailNotification(action, rule, feedback)
          break
        case 'slack':
          sendSlackNotification(action, rule, feedback)
          break
        case 'github':
          createGitHubIssue(action, rule, feedback)
          break
        case 'webhook':
          sendWebhookNotification(action, rule, feedback)
          break
      }
    })
  }

  // Send email notification
  const sendEmailNotification = (action: NotificationAction, rule: NotificationRule, feedback: FeedbackNotification) => {
    const emailBody = generateEmailTemplate(action.config.template || 'default', rule, feedback)
    const subject = `[${rule.priority.toUpperCase()}] JiGR Feedback Alert: ${rule.name}`
    
    const mailtoLink = `mailto:${action.config.recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`
    
    // For demo purposes, just log the email
    console.log('📧 Email notification triggered:', {
      rule: rule.name,
      recipient: action.config.recipient,
      subject,
      feedback: feedback.id
    })
    
    // In production, this would call an email service
    // window.open(mailtoLink)
  }

  // Send Slack notification (simulated)
  const sendSlackNotification = (action: NotificationAction, rule: NotificationRule, feedback: FeedbackNotification) => {
    const slackMessage = generateSlackTemplate(action.config.template || 'default', rule, feedback)
    
    console.log('💬 Slack notification triggered:', {
      rule: rule.name,
      channel: action.config.channel,
      message: slackMessage,
      feedback: feedback.id
    })
    
    // In production, this would call Slack API
    // fetch('/api/notifications/slack', { method: 'POST', body: JSON.stringify({ channel: action.config.channel, message: slackMessage }) })
  }

  // Create GitHub issue (simulated)
  const createGitHubIssue = (action: NotificationAction, rule: NotificationRule, feedback: FeedbackNotification) => {
    const issueData = generateGitHubIssue(action.config.template || 'default', rule, feedback)
    
    console.log('🐛 GitHub issue triggered:', {
      rule: rule.name,
      title: issueData.title,
      body: issueData.body,
      labels: issueData.labels,
      feedback: feedback.id
    })
    
    // In production, this would call GitHub API
    // fetch('/api/notifications/github', { method: 'POST', body: JSON.stringify(issueData) })
  }

  // Send webhook notification
  const sendWebhookNotification = (action: NotificationAction, rule: NotificationRule, feedback: FeedbackNotification) => {
    const webhookData = {
      rule: rule.name,
      trigger: rule.trigger,
      priority: rule.priority,
      feedback,
      timestamp: new Date().toISOString()
    }
    
    console.log('🔗 Webhook notification triggered:', {
      rule: rule.name,
      url: action.config.webhookUrl,
      data: webhookData,
      feedback: feedback.id
    })
    
    // In production, this would call the webhook URL
    // fetch(action.config.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(webhookData) })
  }

  // Generate email template
  const generateEmailTemplate = (template: string, rule: NotificationRule, feedback: FeedbackNotification): string => {
    const templates = {
      critical_alert: `
🚨 CRITICAL ISSUE DETECTED

A critical issue has been reported in the JiGR application that requires immediate attention.

Issue Details:
- Tester: ${feedback.testerId}
- Page: ${feedback.page}
- Severity: ${feedback.severity.toUpperCase()}
- Category: ${feedback.category}
- Device: ${feedback.deviceInfo || 'Not specified'}
- Screenshot: ${feedback.screenshot ? 'Included' : 'Not included'}
- Time: ${new Date(feedback.timestamp).toLocaleString()}

Description:
${feedback.message}

Triggered by rule: ${rule.name}
Priority: ${rule.priority.toUpperCase()}

Please investigate and resolve this issue immediately.
      `.trim(),
      
      bug_alert: `
🐛 BUG REPORT

A high priority bug has been reported in the JiGR application.

Bug Details:
- Reporter: ${feedback.testerId}
- Location: ${feedback.page}
- Severity: ${feedback.severity}
- Category: ${feedback.category}
- Device Info: ${feedback.deviceInfo || 'Not specified'}
- Reported: ${new Date(feedback.timestamp).toLocaleString()}

Description:
${feedback.message}

This issue was automatically flagged by: ${rule.name}
      `.trim(),
      
      hero_feedback: `
🏆 HERO CHAMPION FEEDBACK

Valuable feedback has been received from a Hero Champion.

Feedback Details:
- Hero: ${feedback.testerId}
- Page: ${feedback.page}
- Priority: ${feedback.severity}
- Type: ${feedback.category}
- Device: ${feedback.deviceInfo || 'Not specified'}
- Time: ${new Date(feedback.timestamp).toLocaleString()}

Champion Feedback:
${feedback.message}

Hero Champion feedback should be prioritized for review and implementation.
      `.trim(),
      
      default: `
📝 FEEDBACK NOTIFICATION

New feedback has been received that matches your notification criteria.

Details:
- Tester: ${feedback.testerId}
- Page: ${feedback.page}
- Severity: ${feedback.severity}
- Category: ${feedback.category}
- Time: ${new Date(feedback.timestamp).toLocaleString()}

Message:
${feedback.message}

Triggered by: ${rule.name} (${rule.trigger}: ${rule.condition})
      `.trim()
    }
    
    return templates[template as keyof typeof templates] || templates.default
  }

  // Generate Slack template
  const generateSlackTemplate = (template: string, rule: NotificationRule, feedback: FeedbackNotification): string => {
    const severity = feedback.severity
    const emoji = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : severity === 'medium' ? '📝' : 'ℹ️'
    const isHero = feedback.testerId.includes('hero')
    
    return `${emoji} *${rule.name}* ${isHero ? '🏆' : ''}
*Page:* \`${feedback.page}\`
*Tester:* ${feedback.testerId}
*Severity:* ${severity.toUpperCase()}
*Device:* ${feedback.deviceInfo || 'Not specified'}
*Message:* ${feedback.message.substring(0, 200)}${feedback.message.length > 200 ? '...' : ''}
*Time:* ${new Date(feedback.timestamp).toLocaleString()}`
  }

  // Generate GitHub issue
  const generateGitHubIssue = (template: string, rule: NotificationRule, feedback: FeedbackNotification) => {
    const labels = ['feedback', feedback.severity, feedback.category]
    if (feedback.testerId.includes('hero')) labels.push('hero-champion')
    if (feedback.deviceInfo?.includes('iPad')) labels.push('ipad')
    if (feedback.deviceInfo?.includes('Safari 12')) labels.push('safari-12')
    
    const title = `[${feedback.severity.toUpperCase()}] ${feedback.category}: Issue on ${feedback.page}`
    
    const body = `
## Feedback Report

**Auto-generated issue from JiGR feedback system**

### Issue Details
- **Page:** \`${feedback.page}\`
- **Tester:** ${feedback.testerId}
- **Severity:** ${feedback.severity.toUpperCase()}
- **Category:** ${feedback.category}
- **Device Info:** ${feedback.deviceInfo || 'Not specified'}
- **Screenshot:** ${feedback.screenshot ? '✅ Included' : '❌ Not included'}
- **Reported:** ${new Date(feedback.timestamp).toLocaleString()}

### Description
${feedback.message}

### Triggered By
- **Rule:** ${rule.name}
- **Trigger:** ${rule.trigger} (${rule.condition})
- **Priority:** ${rule.priority.toUpperCase()}

### Additional Context
${feedback.deviceInfo ? `**Device Details:** ${feedback.deviceInfo}` : ''}
${feedback.screenshot ? '**Screenshot:** See attachment in original feedback' : ''}

---
*This issue was automatically created by the JiGR Smart Notification System*
    `.trim()
    
    return { title, body, labels }
  }

  // Add new rule
  const addRule = () => {
    if (!newRule.name || !newRule.condition) return
    
    const rule: NotificationRule = {
      id: `rule-${Date.now()}`,
      name: newRule.name,
      trigger: newRule.trigger || 'severity',
      condition: newRule.condition,
      actions: newRule.actions || [],
      enabled: newRule.enabled !== false,
      priority: newRule.priority || 'medium'
    }
    
    const updatedRules = [...rules, rule]
    setRules(updatedRules)
    localStorage.setItem('smartNotificationRules', JSON.stringify(updatedRules))
    
    setNewRule({
      name: '',
      trigger: 'severity',
      condition: '',
      actions: [],
      enabled: true,
      priority: 'medium'
    })
  }

  // Toggle rule enabled state
  const toggleRule = (ruleId: string) => {
    const updatedRules = rules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    )
    setRules(updatedRules)
    localStorage.setItem('smartNotificationRules', JSON.stringify(updatedRules))
  }

  // Delete rule
  const deleteRule = (ruleId: string) => {
    const updatedRules = rules.filter(rule => rule.id !== ruleId)
    setRules(updatedRules)
    localStorage.setItem('smartNotificationRules', JSON.stringify(updatedRules))
  }

  // Test notification system with sample data
  const testNotifications = () => {
    const testFeedback: FeedbackNotification = {
      id: `test-${Date.now()}`,
      testerId: 'test_user',
      severity: 'critical',
      category: 'bug',
      page: '/admin/console',
      message: 'Login authentication is completely broken and users cannot access the system',
      deviceInfo: 'iPad Air | Safari 12 | 1024x768',
      screenshot: true,
      timestamp: new Date().toISOString()
    }
    
    processFeedback(testFeedback)
    setNotifications(prev => [testFeedback, ...prev.slice(0, 9)]) // Keep last 10
  }

  // Expose the processFeedback function globally for use by other components
  useEffect(() => {
    (window as any).smartNotifications = {
      processFeedback,
      rules,
      isEnabled: rules.some(r => r.enabled)
    }
  }, [rules])

  if (!showConfig) {
    return (
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1001 }}>
        <button
          onClick={() => setShowConfig(true)}
          style={{
            background: 'rgba(139, 92, 246, 0.9)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          🔔 Smart Alerts ({rules.filter(r => r.enabled).length})
        </button>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '600px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      padding: '20px',
      overflowY: 'auto',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      backdropFilter: 'blur(10px)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      zIndex: 1001
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>
          🔔 Smart Notifications
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={testNotifications}
            style={{
              fontSize: '11px',
              padding: '4px 8px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test
          </button>
          <button
            onClick={() => setShowConfig(false)}
            style={{
              fontSize: '16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280'
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Active Rules */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', color: '#374151' }}>
          Active Rules ({rules.filter(r => r.enabled).length}/{rules.length})
        </h4>
        {rules.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#6B7280', fontStyle: 'italic' }}>
            No notification rules configured
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rules.map(rule => (
              <div
                key={rule.id}
                style={{
                  padding: '8px',
                  backgroundColor: rule.enabled ? '#F0F9FF' : '#F9FAFB',
                  border: `1px solid ${rule.enabled ? '#BAE6FD' : '#E5E7EB'}`,
                  borderRadius: '6px',
                  opacity: rule.enabled ? 1 : 0.6
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#1F2937' }}>
                      {rule.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6B7280' }}>
                      {rule.trigger}: {rule.condition} → {rule.actions.length} action(s)
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => toggleRule(rule.id)}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: rule.enabled ? '#10B981' : '#6B7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      {rule.enabled ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        backgroundColor: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      DEL
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', color: '#374151' }}>
            Recent Notifications
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
            {notifications.slice(0, 5).map(notification => (
              <div
                key={notification.id}
                style={{
                  padding: '6px',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  borderRadius: '4px',
                  fontSize: '10px'
                }}
              >
                <strong>{notification.severity.toUpperCase()}</strong> on {notification.page}
                <br />
                <span style={{ color: '#6B7280' }}>
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status */}
      <div style={{
        padding: '8px',
        backgroundColor: '#ECFDF5',
        border: '1px solid #A7F3D0',
        borderRadius: '6px',
        fontSize: '11px',
        color: '#065F46'
      }}>
        <strong>Status:</strong> Smart notification system is active
        <br />
        <strong>Integrations:</strong> Email ✅ Slack 🔧 GitHub 🔧 Webhooks 🔧
        <br />
        <strong>Note:</strong> Some integrations are in demo mode
      </div>
    </div>
  )
}