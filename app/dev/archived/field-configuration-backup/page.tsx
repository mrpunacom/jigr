'use client';

import React, { useState, useEffect } from 'react';
import { getCardStyle, getTextStyle, getButtonStyle } from '@/lib/design-system';
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper';

interface FieldDefinition {
  key: string;
  label: string;
  description: string;
  category: 'mandatory' | 'optional';
  order: number;
  defaultValue: any;
  enabled: boolean;
  validation?: {
    required?: boolean;
    type?: 'string' | 'number' | 'date' | 'boolean';
    minLength?: number;
    maxLength?: number;
  };
}

interface FieldConfigurationData {
  mandatoryFields: FieldDefinition[];
  optionalFields: FieldDefinition[];
}

export default function FieldConfigurationPage() {
  const [config, setConfig] = useState<FieldConfigurationData>({
    mandatoryFields: [],
    optionalFields: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [isNewField, setIsNewField] = useState(false);

  // Load current field configuration
  useEffect(() => {
    loadCurrentConfiguration();
  }, []);

  const loadCurrentConfiguration = async () => {
    try {
      // For now, load from the hardcoded definitions
      // Later we'll load from database
      const response = await fetch('/api/config/fields');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        // Fallback to current hardcoded config
        setConfig(getCurrentHardcodedConfig());
      }
    } catch (error) {
      console.error('Failed to load field configuration:', error);
      setConfig(getCurrentHardcodedConfig());
    } finally {
      setLoading(false);
    }
  };

  const getCurrentHardcodedConfig = (): FieldConfigurationData => {
    return {
      mandatoryFields: [
        {
          key: 'supplier',
          label: 'Supplier',
          description: 'Name of the delivery supplier - required for compliance tracking',
          category: 'mandatory',
          order: 1,
          defaultValue: '',
          enabled: true,
          validation: { required: true, type: 'string', minLength: 1 }
        },
        {
          key: 'deliveryDate',
          label: 'Delivery Date',
          description: 'Date when the delivery was received - required for compliance',
          category: 'mandatory',
          order: 2,
          defaultValue: null,
          enabled: true,
          validation: { required: true, type: 'date' }
        },
        {
          key: 'handwrittenNotes',
          label: 'Handwritten Notes',
          description: 'Any handwritten notes on delivery documentation',
          category: 'mandatory',
          order: 3,
          defaultValue: '',
          enabled: true,
          validation: { required: true, type: 'string' }
        },
        {
          key: 'temperature',
          label: 'Temperature',
          description: 'Delivery temperature reading - critical for food safety',
          category: 'mandatory',
          order: 4,
          defaultValue: null,
          enabled: true,
          validation: { required: true, type: 'number' }
        },
        {
          key: 'productClassification',
          label: 'Product Classification',
          description: 'Type of product delivered - required for proper handling',
          category: 'mandatory',
          order: 5,
          defaultValue: 'general',
          enabled: true,
          validation: { required: true, type: 'string' }
        }
      ],
      optionalFields: [
        {
          key: 'invoiceNumber',
          label: 'Invoice Number',
          description: 'Invoice or reference number for this delivery',
          category: 'optional',
          order: 6,
          defaultValue: '',
          enabled: true,
          validation: { required: false, type: 'string' }
        },
        {
          key: 'items',
          label: 'Items',
          description: 'List of items included in this delivery',
          category: 'optional',
          order: 7,
          defaultValue: [],
          enabled: true,
          validation: { required: false, type: 'string' }
        },
        {
          key: 'unitSize',
          label: 'Unit Size',
          description: 'Size or quantity per unit delivered',
          category: 'optional',
          order: 8,
          defaultValue: '',
          enabled: false,
          validation: { required: false, type: 'string' }
        },
        {
          key: 'unitPrice',
          label: 'Unit Price',
          description: 'Price per unit for cost tracking',
          category: 'optional',
          order: 9,
          defaultValue: 0,
          enabled: false,
          validation: { required: false, type: 'number' }
        },
        {
          key: 'sku',
          label: 'SKU',
          description: 'Stock Keeping Unit identifier',
          category: 'optional',
          order: 10,
          defaultValue: '',
          enabled: false,
          validation: { required: false, type: 'string' }
        },
        {
          key: 'tax',
          label: 'Tax',
          description: 'Tax amount or percentage applied',
          category: 'optional',
          order: 11,
          defaultValue: 0,
          enabled: false,
          validation: { required: false, type: 'number' }
        }
      ]
    };
  };

  const handleSaveConfiguration = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/config/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        alert('✅ Field configuration saved successfully!');
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('❌ Failed to save configuration. Check console for details.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditField = (field: FieldDefinition) => {
    setEditingField({ ...field });
    setIsNewField(false);
  };

  const handleAddField = (category: 'mandatory' | 'optional') => {
    const newOrder = Math.max(
      ...config.mandatoryFields.map(f => f.order),
      ...config.optionalFields.map(f => f.order)
    ) + 1;

    setEditingField({
      key: '',
      label: '',
      description: '',
      category,
      order: newOrder,
      defaultValue: '',
      enabled: category === 'mandatory',
      validation: { required: category === 'mandatory', type: 'string' }
    });
    setIsNewField(true);
  };

  const handleSaveField = () => {
    if (!editingField) return;

    const updatedConfig = { ...config };
    
    if (isNewField) {
      // Add new field
      if (editingField.category === 'mandatory') {
        updatedConfig.mandatoryFields.push(editingField);
      } else {
        updatedConfig.optionalFields.push(editingField);
      }
    } else {
      // Update existing field
      const targetArray = editingField.category === 'mandatory' 
        ? updatedConfig.mandatoryFields 
        : updatedConfig.optionalFields;
      
      const index = targetArray.findIndex(f => f.key === editingField.key);
      if (index >= 0) {
        targetArray[index] = editingField;
      }
    }

    setConfig(updatedConfig);
    setEditingField(null);
    setIsNewField(false);
  };

  const handleDeleteField = (fieldKey: string, category: 'mandatory' | 'optional') => {
    if (!confirm(`Are you sure you want to delete the field "${fieldKey}"?`)) return;

    const updatedConfig = { ...config };
    if (category === 'mandatory') {
      updatedConfig.mandatoryFields = updatedConfig.mandatoryFields.filter(f => f.key !== fieldKey);
    } else {
      updatedConfig.optionalFields = updatedConfig.optionalFields.filter(f => f.key !== fieldKey);
    }
    setConfig(updatedConfig);
  };

  const moveField = (fieldKey: string, direction: 'up' | 'down', category: 'mandatory' | 'optional') => {
    const updatedConfig = { ...config };
    const targetArray = category === 'mandatory' ? updatedConfig.mandatoryFields : updatedConfig.optionalFields;
    
    const index = targetArray.findIndex(f => f.key === fieldKey);
    if (index < 0) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= targetArray.length) return;

    // Swap the fields
    [targetArray[index], targetArray[newIndex]] = [targetArray[newIndex], targetArray[index]];
    
    // Update order numbers
    targetArray.forEach((field, idx) => {
      field.order = idx + (category === 'mandatory' ? 1 : 6);
    });

    setConfig(updatedConfig);
  };

  // const moduleConfig = getModuleConfig('dev');

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pt-16 pb-8 h-screen overflow-y-auto">
        <div className="mb-6">
          {/* {moduleConfig && (
            <ModuleHeader module={moduleConfig} currentPage="field-configuration" />
          )} */}
        </div>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className={`${getTextStyle('sectionTitle', 'light')} mb-4`}>Loading Field Configuration</h2>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/backgrounds/CafeBackdrop.jpg)'
      }}
    >
      <div className="min-h-screen bg-black bg-opacity-40">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pt-16 pb-8 h-screen overflow-y-auto">
      
      {/* Header */}
      <div className="mb-6">
        {/* {moduleConfig && (
          <ModuleHeader module={moduleConfig} currentPage="field-configuration" />
        )} */}
      </div>

      {/* Page Header */}
      <div className={`${getCardStyle('primary')} mb-8`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              🔧 Field Configuration Manager
            </h1>
            <p className="text-gray-200">
              Configure the fields that appear in delivery result screens. Drag to reorder, click to edit.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => loadCurrentConfiguration()}
              className={`${getButtonStyle('outline')} px-4 py-2`}
              disabled={loading}
            >
              🔄 Reload
            </button>
            <button
              onClick={handleSaveConfiguration}
              className={`${getButtonStyle('primary')} px-6 py-2 font-semibold`}
              disabled={saving}
            >
              {saving ? '💾 Saving...' : '💾 Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Mandatory Fields */}
        <div className={`${getCardStyle('primary')}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                🔒 Mandatory Fields ({config.mandatoryFields.length})
              </h2>
              <p className="text-gray-200 text-sm">
                Required fields that cannot be disabled by users
              </p>
            </div>
            <button
              onClick={() => handleAddField('mandatory')}
              className={`${getButtonStyle('outline')} px-3 py-1 text-sm`}
            >
              + Add Field
            </button>
          </div>

          <div className="space-y-3">
            {config.mandatoryFields
              .sort((a, b) => a.order - b.order)
              .map((field, index) => (
                <FieldCard
                  key={field.key}
                  field={field}
                  index={index}
                  total={config.mandatoryFields.length}
                  onEdit={() => handleEditField(field)}
                  onDelete={() => handleDeleteField(field.key, 'mandatory')}
                  onMove={(direction) => moveField(field.key, direction, 'mandatory')}
                  onUpdateConfig={setConfig}
                  config={config}
                />
              ))}
          </div>
        </div>

        {/* Optional Fields */}
        <div className={`${getCardStyle('primary')}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                ⚙️ Optional Fields ({config.optionalFields.length})
              </h2>
              <p className="text-gray-200 text-sm">
                Fields that users can enable/disable as needed
              </p>
            </div>
            <button
              onClick={() => handleAddField('optional')}
              className={`${getButtonStyle('outline')} px-3 py-1 text-sm`}
            >
              + Add Field
            </button>
          </div>

          <div className="space-y-3">
            {config.optionalFields
              .sort((a, b) => a.order - b.order)
              .map((field, index) => (
                <FieldCard
                  key={field.key}
                  field={field}
                  index={index}
                  total={config.optionalFields.length}
                  onEdit={() => handleEditField(field)}
                  onDelete={() => handleDeleteField(field.key, 'optional')}
                  onMove={(direction) => moveField(field.key, direction, 'optional')}
                  onUpdateConfig={setConfig}
                  config={config}
                />
              ))}
          </div>
        </div>

      </div>

      {/* Field Editor Modal */}
      {editingField && (
        <FieldEditorModal
          field={editingField}
          isNew={isNewField}
          onSave={handleSaveField}
          onCancel={() => {
            setEditingField(null);
            setIsNewField(false);
          }}
          onChange={setEditingField}
        />
      )}

        </div>
      </div>
    </div>
  );
}

// Field Card Component
interface FieldCardProps {
  field: FieldDefinition;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onUpdateConfig: (config: FieldConfigurationData) => void;
  config: FieldConfigurationData;
}

function FieldCard({ field, index, total, onEdit, onDelete, onMove, onUpdateConfig, config }: FieldCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
              #{field.order}
            </span>
            <span className="font-medium text-gray-900">{field.label}</span>
            <span className="text-xs text-gray-500">({field.key})</span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.enabled}
                  onChange={(e) => {
                    const updatedField = { ...field, enabled: e.target.checked };
                    const updatedConfig = { ...config };
                    
                    if (field.category === 'mandatory') {
                      const fieldIndex = updatedConfig.mandatoryFields.findIndex(f => f.key === field.key);
                      if (fieldIndex >= 0) updatedConfig.mandatoryFields[fieldIndex] = updatedField;
                    } else {
                      const fieldIndex = updatedConfig.optionalFields.findIndex(f => f.key === field.key);
                      if (fieldIndex >= 0) updatedConfig.optionalFields[fieldIndex] = updatedField;
                    }
                    
                    onUpdateConfig(updatedConfig);
                  }}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className={`text-xs px-2 py-1 rounded ${
                  field.enabled 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {field.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-2">{field.description}</p>
          
          {/* Basic info always visible */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <span>Type: {field.validation?.type || 'string'}</span>
            <span>Default: {JSON.stringify(field.defaultValue)}</span>
            {field.validation?.required && <span className="text-orange-600">Required</span>}
          </div>

          {/* Expanded details */}
          {expanded && (
            <div className="mt-3 p-3 bg-gray-50 rounded border">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Field Details</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-medium text-gray-600">Key:</span>
                  <span className="ml-1 font-mono text-blue-600">{field.key}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Category:</span>
                  <span className="ml-1 capitalize">{field.category}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Order:</span>
                  <span className="ml-1">{field.order}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Enabled:</span>
                  <span className="ml-1">{field.enabled ? 'Yes' : 'No'}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-600">Default Value:</span>
                  <span className="ml-1 font-mono text-sm bg-white px-2 py-1 rounded border">
                    {field.defaultValue === null ? 'null' : JSON.stringify(field.defaultValue)}
                  </span>
                </div>
                {field.validation && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Validation:</span>
                    <div className="ml-1 mt-1 text-xs bg-white p-2 rounded border font-mono">
                      {JSON.stringify(field.validation, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-purple-100 rounded"
            title={expanded ? "Collapse details" : "Expand details"}
          >
            <img 
              src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/expand.png" 
              alt={expanded ? "Collapse" : "Expand"}
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
          <button
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
            title="Move up"
          >
            <img 
              src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/up.png" 
              alt="Move up"
              className="w-4 h-4"
            />
          </button>
          <button
            onClick={() => onMove('down')}
            disabled={index === total - 1}
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
            title="Move down"
          >
            <img 
              src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/down.png" 
              alt="Move down"
              className="w-4 h-4"
            />
          </button>
          <button
            onClick={onEdit}
            className="p-1 hover:bg-blue-100 rounded"
            title="Edit field"
          >
            <img 
              src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/edit.png" 
              alt="Edit field"
              className="w-4 h-4"
            />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-100 rounded"
            title="Delete field"
          >
            <img 
              src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/delete.png" 
              alt="Delete field"
              className="w-4 h-4"
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// Field Editor Modal Component
interface FieldEditorModalProps {
  field: FieldDefinition;
  isNew: boolean;
  onSave: () => void;
  onCancel: () => void;
  onChange: (field: FieldDefinition) => void;
}

function FieldEditorModal({ field, isNew, onSave, onCancel, onChange }: FieldEditorModalProps) {
  const updateField = (updates: Partial<FieldDefinition>) => {
    onChange({ ...field, ...updates });
  };

  const updateValidation = (updates: Partial<FieldDefinition['validation']>) => {
    onChange({
      ...field,
      validation: { ...field.validation, ...updates }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className={`${getTextStyle('sectionTitle', 'light')} mb-6`}>
            {isNew ? '🆕 Add New Field' : '✏️ Edit Field'}
          </h2>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Key *
                </label>
                <input
                  type="text"
                  value={field.key}
                  onChange={(e) => updateField({ key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. supplierName"
                  disabled={!isNew}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Label *
                </label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField({ label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Supplier Name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={field.description}
                onChange={(e) => updateField({ description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Describe what this field is used for..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={field.category}
                  onChange={(e) => updateField({ category: e.target.value as 'mandatory' | 'optional' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="mandatory">Mandatory</option>
                  <option value="optional">Optional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Type
                </label>
                <select
                  value={field.validation?.type || 'string'}
                  onChange={(e) => updateValidation({ type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="string">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">True/False</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order
                </label>
                <input
                  type="number"
                  value={field.order}
                  onChange={(e) => updateField({ order: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={field.enabled}
                  onChange={(e) => updateField({ enabled: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enabled by default</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={field.validation?.required || false}
                  onChange={(e) => updateValidation({ required: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Required field</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Value
              </label>
              <input
                type="text"
                value={typeof field.defaultValue === 'string' ? field.defaultValue : JSON.stringify(field.defaultValue)}
                onChange={(e) => {
                  try {
                    const value = e.target.value === '' ? '' : JSON.parse(e.target.value);
                    updateField({ defaultValue: value });
                  } catch {
                    updateField({ defaultValue: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Leave empty for null, or enter JSON value"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={onCancel}
              className={`${getButtonStyle('outline')} px-4 py-2`}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className={`${getButtonStyle('primary')} px-6 py-2 font-semibold`}
              disabled={!field.key || !field.label || !field.description}
            >
              {isNew ? 'Add Field' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}