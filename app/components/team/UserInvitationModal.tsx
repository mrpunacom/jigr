'use client'

import { useState } from 'react'
// Removed Lucide React imports - using Tabler icons via CSS classes
import { getCardStyle, getTextStyle, getFormFieldStyle } from '@/lib/design-system'

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export type UserRole = 'STAFF' | 'SUPERVISOR' | 'MANAGER' | 'OWNER'

export interface InvitationFormData {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
  department?: string
  jobTitle?: string
  message?: string
}

interface UserInvitationModalProps {
  isOpen: boolean
  onClose: () => void
  onInvite: (invitationData: InvitationFormData) => Promise<{ success: boolean; error?: string }>
  userRole: UserRole
  organizationName: string
}

// =====================================================
// ROLE CONFIGURATION
// =====================================================

const ROLE_OPTIONS = [
  {
    value: 'STAFF' as UserRole,
    label: 'Staff',
    description: 'Upload documents and view own uploads',
    icon: '👥',
    level: 1
  },
  {
    value: 'SUPERVISOR' as UserRole,
    label: 'Supervisor',
    description: 'Shift management and basic reporting',
    icon: '🔧',
    level: 2
  },
  {
    value: 'MANAGER' as UserRole,
    label: 'Manager',
    description: 'Full operations and team management',
    icon: '⚙️',
    level: 3
  },
  {
    value: 'OWNER' as UserRole,
    label: 'Owner',
    description: 'Complete system access and billing',
    icon: '👑',
    level: 4
  }
]

const getAvailableRoles = (userRole: UserRole): typeof ROLE_OPTIONS => {
  if (userRole === 'OWNER') {
    return ROLE_OPTIONS
  }
  
  if (userRole === 'MANAGER') {
    return ROLE_OPTIONS.filter(role => ['STAFF', 'SUPERVISOR'].includes(role.value))
  }
  
  return []
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function UserInvitationModal({
  isOpen,
  onClose,
  onInvite,
  userRole,
  organizationName
}: UserInvitationModalProps) {
  const [formData, setFormData] = useState<InvitationFormData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'STAFF'
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'basic' | 'details' | 'confirm' | 'success'>('basic')

  const availableRoles = getAvailableRoles(userRole)

  // =====================================================
  // FORM HANDLERS
  // =====================================================

  const handleInputChange = (field: keyof InvitationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleNext = () => {
    if (step === 'basic') {
      if (!formData.email || !formData.firstName || !formData.lastName || !formData.role) {
        setError('Please fill in all required fields')
        return
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address')
        return
      }
      
      setStep('details')
    } else if (step === 'details') {
      setStep('confirm')
    }
  }

  const handleBack = () => {
    if (step === 'details') {
      setStep('basic')
    } else if (step === 'confirm') {
      setStep('details')
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const result = await onInvite(formData)
      
      if (result.success) {
        // Show success screen
        setStep('success')
      } else {
        setError(result.error || 'Failed to send invitation')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'STAFF'
      })
      setStep('basic')
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  const selectedRole = ROLE_OPTIONS.find(role => role.value === formData.role)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="icon-[tabler--users] w-5 h-5 text-white"></span>
            </div>
            <div>
              <h2 className={`${getTextStyle('sectionTitle')} mb-1`}>Invite Team Member</h2>
              <p className={`${getTextStyle('bodySmall')} text-white/70`}>
                Add someone to {organizationName || 'your organization'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white/60 hover:text-white transition-colors duration-200 disabled:opacity-50"
          >
            <span className="icon-[tabler--x] w-6 h-6"></span>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center space-x-2 mb-6">
          <div className={`w-8 h-1 rounded-full ${step === 'basic' ? 'bg-blue-600' : 'bg-blue-600'}`} />
          <div className={`w-8 h-1 rounded-full ${['details', 'confirm', 'success'].includes(step) ? 'bg-blue-600' : 'bg-white/20'}`} />
          <div className={`w-8 h-1 rounded-full ${['confirm', 'success'].includes(step) ? 'bg-blue-600' : 'bg-white/20'}`} />
          <div className={`w-8 h-1 rounded-full ${step === 'success' ? 'bg-green-600' : 'bg-white/20'}`} />
          <span className={`ml-3 ${getTextStyle('bodySmall')} text-white/70`}>
            {step === 'success' ? '✓ Sent!' : `Step ${step === 'basic' ? '1' : step === 'details' ? '2' : '3'} of 3`}
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/40 border border-red-500/50 rounded-lg backdrop-blur-sm">
            <p className="text-red-100 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Form Steps */}
        {step === 'basic' && (
          <div className="space-y-6">
            <h3 className={`${getTextStyle('cardTitle')} mb-4`}>Basic Information</h3>
            
            {/* Email */}
            <div>
              <label className={`block ${getTextStyle('label')} mb-2`}>
                <span className="icon-[tabler--mail] w-4 h-4 inline mr-2"></span>
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="colleague@example.com"
                className={getFormFieldStyle()}
                disabled={isSubmitting}
              />
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block ${getTextStyle('label')} mb-2`}>
                  <span className="icon-[tabler--user] w-4 h-4 inline mr-2"></span>
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="John"
                  className={getFormFieldStyle()}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className={`block ${getTextStyle('label')} mb-2`}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Smith"
                  className={getFormFieldStyle()}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Job Selection */}
            <div>
              <label className={`block ${getTextStyle('label')} mb-3`}>
                Job & Permissions * {/* Updated from Role to Job */}
              </label>
              <div className="space-y-3">
                {availableRoles.map((role) => (
                  <label
                    key={role.value}
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                      formData.role === role.value
                        ? 'border-blue-400 bg-blue-500/20 text-white'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-800/50 text-white/90 hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={formData.role === role.value}
                      onChange={(e) => handleInputChange('role', e.target.value as UserRole)}
                      className="mt-1"
                      disabled={isSubmitting}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{role.icon}</span>
                        <span className={`${getTextStyle('cardTitle')} text-base`}>{role.label}</span>
                      </div>
                      <p className={`${getTextStyle('bodySmall')} text-white/70`}>
                        {role.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-6">
            <h3 className={`${getTextStyle('cardTitle')} mb-4`}>Additional Details (Optional)</h3>
            
            {/* Phone */}
            <div>
              <label className={`block ${getTextStyle('label')} mb-2`}>
                <span className="icon-[tabler--phone] w-4 h-4 inline mr-2"></span>
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+64 21 123 456"
                className={getFormFieldStyle()}
                disabled={isSubmitting}
              />
            </div>

            {/* Department */}
            <div>
              <label className={`block ${getTextStyle('label')} mb-2`}>
                <span className="icon-[tabler--building] w-4 h-4 inline mr-2"></span>
                Department
              </label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="Kitchen, Front of House, Management"
                className={getFormFieldStyle()}
                disabled={isSubmitting}
              />
            </div>

            {/* Job Title */}
            <div>
              <label className={`block ${getTextStyle('label')} mb-2`}>
                Job Title
              </label>
              <input
                type="text"
                value={formData.jobTitle || ''}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                placeholder="Head Chef, Server, Assistant Manager"
                className={getFormFieldStyle()}
                disabled={isSubmitting}
              />
            </div>

            {/* Personal Message */}
            <div>
              <label className={`block ${getTextStyle('label')} mb-2`}>
                <span className="icon-[tabler--message-square] w-4 h-4 inline mr-2"></span>
                Personal Message
              </label>
              <textarea
                value={formData.message || ''}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Welcome to the team! Looking forward to working with you."
                rows={3}
                className={getFormFieldStyle()}
                disabled={isSubmitting}
              />
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            <h3 className={`${getTextStyle('cardTitle')} mb-4`}>Confirm Invitation</h3>
            
            <div className="bg-slate-800 rounded-xl border border-slate-600 p-6 space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-xl text-white">{selectedRole?.icon}</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold text-base">
                    {formData.firstName} {formData.lastName}
                  </h4>
                  <p className="text-slate-300 text-sm">
                    {formData.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Job:</span>
                  <p className="text-white font-medium">{selectedRole?.label}</p>
                </div>
                {formData.phone && (
                  <div>
                    <span className="text-slate-400">Phone:</span>
                    <p className="text-white font-medium">{formData.phone}</p>
                  </div>
                )}
                {formData.department && (
                  <div>
                    <span className="text-slate-400">Department:</span>
                    <p className="text-white font-medium">{formData.department}</p>
                  </div>
                )}
                {formData.jobTitle && (
                  <div>
                    <span className="text-slate-400">Job Title:</span>
                    <p className="text-white font-medium">{formData.jobTitle}</p>
                  </div>
                )}
              </div>

              {formData.message && (
                <div className="pt-4 border-t border-slate-600">
                  <span className="text-slate-400 text-sm">Personal Message:</span>
                  <p className="text-white mt-1 font-medium">{formData.message}</p>
                </div>
              )}
            </div>

            <div className="bg-slate-700 border border-slate-500 rounded-lg p-4">
              <h4 className="text-white font-semibold text-base mb-3">What happens next?</h4>
              <ul className="text-slate-200 text-sm space-y-2">
                <li>• An invitation email will be sent to {formData.email}</li>
                <li>• They&apos;ll have 7 days to accept the invitation</li>
                <li>• Once accepted, they&apos;ll join your organization as {selectedRole?.label}</li>
                <li>• You can manage their permissions anytime</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <div>
              <h3 className={`${getTextStyle('sectionTitle')} mb-3 text-green-400`}>Invitation Sent Successfully!</h3>
              <p className={`${getTextStyle('body')} text-white/80 mb-6`}>
                {formData.firstName} {formData.lastName} has been invited to join {organizationName} as {selectedRole?.label}.
              </p>
            </div>

            <div className="bg-slate-800 rounded-xl border border-green-500/30 p-6 text-left">
              <h4 className="text-white font-semibold text-base mb-3 flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                What happens next:
              </h4>
              <ul className="text-slate-200 text-sm space-y-2">
                <li>• Invitation email sent to {formData.email}</li>
                <li>• They have 7 days to accept the invitation</li>
                <li>• Once accepted, they&apos;ll appear in your team list</li>
                <li>• You&apos;ll receive a notification when they join</li>
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-8 pt-6 border-t border-white/10">
          {step === 'success' ? (
            <>
              <button
                onClick={() => {
                  // Reset form and close modal
                  setFormData({
                    email: '',
                    firstName: '',
                    lastName: '',
                    role: 'STAFF'
                  })
                  setStep('basic')
                  setError('')
                  onClose()
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Done
              </button>
              <button
                onClick={() => {
                  // Reset form for another invitation
                  setFormData({
                    email: '',
                    firstName: '',
                    lastName: '',
                    role: 'STAFF'
                  })
                  setStep('basic')
                  setError('')
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
              >
                Invite Another
              </button>
            </>
          ) : (
            <>
              {step !== 'basic' && (
                <button
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  Back
                </button>
              )}
              
              <button
                onClick={step === 'confirm' ? handleSubmit : handleNext}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Sending...
                  </div>
                ) : step === 'confirm' ? (
                  'Send Invitation'
                ) : (
                  'Next'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}