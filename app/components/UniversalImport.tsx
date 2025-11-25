'use client'

import { useState, useRef, useCallback } from 'react'

export interface ImportField {
  key: string
  label: string
  required?: boolean
  type?: 'string' | 'number' | 'email' | 'phone' | 'date' | 'boolean'
  validation?: (value: any) => string | null // Returns error message if invalid
  transform?: (value: any) => any // Transform the value before validation
}

export interface ImportConfig {
  entityName: string // e.g., "vendors", "inventory items"
  fields: ImportField[]
  maxFileSize?: number // in bytes, default 5MB
  allowedExtensions?: string[] // default ['.csv', '.xlsx', '.xls']
  sampleData?: Record<string, any>[] // Sample data for template download
}

export interface ImportResult {
  success: boolean
  data: any[]
  errors: ImportError[]
  summary: {
    total: number
    valid: number
    invalid: number
  }
}

export interface ImportError {
  row: number
  field: string
  value: any
  message: string
}

interface UniversalImportProps {
  config: ImportConfig
  onImport: (data: any[]) => Promise<boolean> // Return true if successful
  onClose: () => void
  isOpen: boolean
  className?: string
}

export function UniversalImport({ 
  config, 
  onImport, 
  onClose, 
  isOpen, 
  className = '' 
}: UniversalImportProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping' | 'processing' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [rawData, setRawData] = useState<any[]>([])
  const [mappedData, setMappedData] = useState<any[]>([])
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<ImportError[]>([])
  const [loading, setLoading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    entityName,
    fields,
    maxFileSize = 5 * 1024 * 1024, // 5MB
    allowedExtensions = ['.csv', '.xlsx', '.xls'],
    sampleData = []
  } = config

  // Reset state when modal opens/closes
  const resetState = useCallback(() => {
    setStep('upload')
    setFile(null)
    setRawData([])
    setMappedData([])
    setFieldMapping({})
    setErrors([])
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Handle file upload
  const handleFileUpload = useCallback((uploadedFile: File) => {
    // Validate file type
    const extension = '.' + uploadedFile.name.split('.').pop()?.toLowerCase()
    if (!allowedExtensions.includes(extension)) {
      alert(`Invalid file type. Allowed extensions: ${allowedExtensions.join(', ')}`)
      return
    }

    // Validate file size
    if (uploadedFile.size > maxFileSize) {
      alert(`File too large. Maximum size: ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`)
      return
    }

    setFile(uploadedFile)
    parseFile(uploadedFile)
  }, [allowedExtensions, maxFileSize])

  // Parse uploaded file
  const parseFile = async (file: File) => {
    setLoading(true)
    
    try {
      const text = await file.text()
      
      if (file.name.endsWith('.csv')) {
        // Simple CSV parsing (in production, use a proper CSV parser like Papa Parse)
        const lines = text.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
          const row: Record<string, string> = {}
          headers.forEach((header, index) => {
            row[header] = values[index] || ''
          })
          return row
        })
        
        setRawData(rows)
        
        // Auto-map fields if possible
        const autoMapping: Record<string, string> = {}
        fields.forEach(field => {
          const matchedHeader = headers.find(header => 
            header.toLowerCase() === field.label.toLowerCase() ||
            header.toLowerCase() === field.key.toLowerCase() ||
            header.toLowerCase().includes(field.key.toLowerCase())
          )
          if (matchedHeader) {
            autoMapping[field.key] = matchedHeader
          }
        })
        setFieldMapping(autoMapping)
        
        setStep(Object.keys(autoMapping).length === fields.length ? 'preview' : 'mapping')
      } else {
        // For Excel files, you'd use a library like xlsx
        alert('Excel file parsing requires additional setup. Please use CSV files for now.')
      }
    } catch (error) {
      console.error('Error parsing file:', error)
      alert('Error parsing file. Please check the file format.')
    } finally {
      setLoading(false)
    }
  }

  // Validate and process data
  const processData = useCallback(() => {
    const processedData: any[] = []
    const newErrors: ImportError[] = []

    rawData.forEach((row, rowIndex) => {
      const processedRow: any = {}
      let hasErrors = false

      fields.forEach(field => {
        const sourceColumn = fieldMapping[field.key]
        if (!sourceColumn) {
          if (field.required) {
            newErrors.push({
              row: rowIndex + 1,
              field: field.key,
              value: null,
              message: `Required field not mapped`
            })
            hasErrors = true
          }
          return
        }

        let value = row[sourceColumn]
        
        // Transform value if transformer provided
        if (field.transform) {
          value = field.transform(value)
        }

        // Type conversion
        if (field.type === 'number' && value !== '') {
          value = parseFloat(value)
          if (isNaN(value)) {
            newErrors.push({
              row: rowIndex + 1,
              field: field.key,
              value: row[sourceColumn],
              message: `Invalid number format`
            })
            hasErrors = true
            return
          }
        } else if (field.type === 'boolean' && value !== '') {
          value = ['true', '1', 'yes', 'y'].includes(value.toString().toLowerCase())
        } else if (field.type === 'date' && value !== '') {
          const date = new Date(value)
          if (isNaN(date.getTime())) {
            newErrors.push({
              row: rowIndex + 1,
              field: field.key,
              value: row[sourceColumn],
              message: `Invalid date format`
            })
            hasErrors = true
            return
          }
          value = date.toISOString().split('T')[0] // YYYY-MM-DD format
        }

        // Required field validation
        if (field.required && (value === '' || value === null || value === undefined)) {
          newErrors.push({
            row: rowIndex + 1,
            field: field.key,
            value: value,
            message: `Required field is empty`
          })
          hasErrors = true
        }

        // Custom validation
        if (field.validation && value !== '' && value !== null && value !== undefined) {
          const validationError = field.validation(value)
          if (validationError) {
            newErrors.push({
              row: rowIndex + 1,
              field: field.key,
              value: value,
              message: validationError
            })
            hasErrors = true
          }
        }

        processedRow[field.key] = value
      })

      if (!hasErrors) {
        processedData.push(processedRow)
      }
    })

    setMappedData(processedData)
    setErrors(newErrors)
    setImportResult({
      success: newErrors.length === 0,
      data: processedData,
      errors: newErrors,
      summary: {
        total: rawData.length,
        valid: processedData.length,
        invalid: newErrors.length > 0 ? rawData.length - processedData.length : 0
      }
    })
    setStep('preview')
  }, [rawData, fieldMapping, fields])

  // Execute import
  const executeImport = async () => {
    if (!importResult || importResult.data.length === 0) return

    setLoading(true)
    setStep('processing')

    try {
      const success = await onImport(importResult.data)
      if (success) {
        setStep('complete')
      } else {
        alert('Import failed. Please try again.')
        setStep('preview')
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Import failed. Please try again.')
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  // Download sample template
  const downloadTemplate = () => {
    const headers = fields.map(f => f.label).join(',')
    const sampleRows = sampleData.length > 0 
      ? sampleData.map(row => fields.map(f => row[f.key] || '').join(',')).join('\n')
      : fields.map(f => f.key === 'name' ? 'Sample Name' : '').join(',')
    
    const csvContent = `${headers}\n${sampleRows}`
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${entityName.replace(/\s+/g, '_').toLowerCase()}_template.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Import {entityName}
          </h2>
          <button
            onClick={() => {
              resetState()
              onClose()
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="icon-[tabler--x] h-6 w-6"></span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="icon-[tabler--file-text] h-16 w-16 text-gray-400 mx-auto mb-4"></span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload your {entityName} file
                </h3>
                <p className="text-gray-600 mb-6">
                  Supported formats: {allowedExtensions.join(', ')} • Max size: {(maxFileSize / 1024 / 1024).toFixed(1)}MB
                </p>
                
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={allowedExtensions.join(',')}
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                  />
                  <span className="icon-[tabler--upload] h-12 w-12 text-gray-400 mx-auto mb-4"></span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Choose File
                  </button>
                  <p className="text-sm text-gray-500 mt-2">or drag and drop your file here</p>
                </div>
              </div>

              {/* Download Template */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Need a template?</h4>
                    <p className="text-sm text-gray-600">Download a sample CSV file with the correct format</p>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <span className="icon-[tabler--download] h-4 w-4"></span>
                    <span>Download Template</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Field Mapping Step */}
          {step === 'mapping' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Map your columns</h3>
                <p className="text-gray-600">Match your file columns to the required fields</p>
              </div>

              <div className="space-y-4">
                {fields.map(field => (
                  <div key={field.key} className="flex items-center space-x-4">
                    <div className="w-48">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                    </div>
                    <select
                      value={fieldMapping[field.key] || ''}
                      onChange={(e) => setFieldMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">-- Select Column --</option>
                      {Object.keys(rawData[0] || {}).map(column => (
                        <option key={column} value={column}>{column}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={processData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && importResult && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Preview & Validate</h3>
                <div className="flex items-center space-x-6 text-sm">
                  <span className="flex items-center space-x-2">
                    <span className="icon-[tabler--circle-check] h-4 w-4 text-green-500"></span>
                    <span>{importResult.summary.valid} valid records</span>
                  </span>
                  {importResult.summary.invalid > 0 && (
                    <span className="flex items-center space-x-2">
                      <span className="icon-[tabler--circle-x] h-4 w-4 text-red-500"></span>
                      <span>{importResult.summary.invalid} invalid records</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="icon-[tabler--alert-triangle] h-5 w-5 text-red-600"></span>
                    <h4 className="font-medium text-red-800">Validation Errors</h4>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-sm text-red-700 py-1">
                        Row {error.row}, {error.field}: {error.message}
                      </div>
                    ))}
                    {errors.length > 10 && (
                      <div className="text-sm text-red-600 mt-2">
                        ... and {errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              {importResult.data.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h4 className="font-medium text-gray-900">Valid Records Preview</h4>
                  </div>
                  <div className="overflow-x-auto max-h-60">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {fields.map(field => (
                            <th key={field.key} className="px-4 py-2 text-left font-medium text-gray-700">
                              {field.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importResult.data.slice(0, 5).map((row, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            {fields.map(field => (
                              <td key={field.key} className="px-4 py-2 text-gray-600">
                                {row[field.key]?.toString() || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importResult.data.length > 5 && (
                      <div className="px-4 py-2 text-sm text-gray-500 border-t border-gray-200">
                        ... and {importResult.data.length - 5} more records
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={executeImport}
                  disabled={importResult.data.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Import {importResult.data.length} Records
                </button>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Import</h3>
              <p className="text-gray-600">Please wait while we import your {entityName}...</p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && importResult && (
            <div className="text-center py-12">
              <span className="icon-[tabler--circle-check] h-16 w-16 text-green-500 mx-auto mb-4"></span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Import Complete!</h3>
              <p className="text-gray-600 mb-6">
                Successfully imported {importResult.summary.valid} {entityName}
              </p>
              <button
                onClick={() => {
                  resetState()
                  onClose()
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}