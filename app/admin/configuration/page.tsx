'use client';

import React from 'react';
import { useDisplayConfiguration } from '@/hooks/UseDisplayConfiguration';
import { ConfigCardNew, ConfigCardSection, ConfigCardSkeleton, ConfigCardError } from '@/app/components/admin/ConfigCardNew';
import { getCardStyle, getTextStyle, getButtonStyle } from '@/lib/design-system';
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper';
import SecurityLegend from '@/app/components/admin/SecurityLegend';
import type { ToggleEvent } from '@/app/types/Configuration';

/**
 * Enhanced Configuration Page with useDisplayConfiguration hook
 */
export default function ConfigurationPage() {
  console.log('📋 [ConfigurationPage] Rendering configuration page');

  // Using valid Beach Bistro1 client ID from database
  const companyId = 'bd784b9b-43d3-4a03-8d31-3483ba53cc22'; // Beach Bistro1

  // Use our centralized configuration hook
  const { 
    config, 
    loading, 
    error, 
    toggleField, 
    updateField,
    resetToDefaults,
    saveConfiguration 
  } = useDisplayConfiguration(companyId);

  console.log('📋 [ConfigurationPage] Hook state:', { 
    hasConfig: !!config, 
    loading, 
    hasError: !!error,
    fieldCount: config ? Object.keys(config.fields).length : 0
  });

  /**
   * Handle toggle events from ConfigCard components
   */
  const handleToggle = async (toggleEvent: ToggleEvent) => {
    console.log('🎯 [ConfigurationPage] Toggle event received:', toggleEvent);
    
    try {
      await toggleField(toggleEvent.fieldKey);
      console.log('✅ [ConfigurationPage] Toggle completed successfully');
    } catch (err) {
      console.error('❌ [ConfigurationPage] Toggle failed:', err);
    }
  };

  /**
   * Handle manual save button click
   */
  const handleSave = async () => {
    console.log('💾 [ConfigurationPage] Manual save triggered');
    
    try {
      await saveConfiguration();
      console.log('✅ [ConfigurationPage] Manual save completed');
    } catch (err) {
      console.error('❌ [ConfigurationPage] Manual save failed:', err);
    }
  };

  /**
   * Handle reset to defaults
   */
  const handleReset = async () => {
    console.log('🔄 [ConfigurationPage] Reset to defaults triggered');
    
    const confirmed = window.confirm(
      'Are you sure you want to reset all display settings to defaults? This cannot be undone.'
    );
    
    if (confirmed) {
      try {
        await resetToDefaults();
        console.log('✅ [ConfigurationPage] Reset completed successfully');
      } catch (err) {
        console.error('❌ [ConfigurationPage] Reset failed:', err);
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <StandardPageWrapper moduleName="admin" currentPage="configuration">

        <div className="space-y-8">
          {/* Loading Skeletons */}
          <ConfigCardSection title="Mandatory Fields" description="Loading required fields...">
            {Array.from({ length: 5 }).map((_, index) => (
              <ConfigCardSkeleton key={index} />
            ))}
          </ConfigCardSection>

          <ConfigCardSection title="Optional Fields" description="Loading optional fields...">
            {Array.from({ length: 6 }).map((_, index) => (
              <ConfigCardSkeleton key={index} />
            ))}
          </ConfigCardSection>
        </div>
      </StandardPageWrapper>
    );
  }

  // Error state
  if (error) {
    return (
      <StandardPageWrapper moduleName="admin" currentPage="configuration">

        <div className="flex items-center justify-center py-12">
          <ConfigCardError 
            error={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      </StandardPageWrapper>
    );
  }

  // No configuration state (shouldn't happen with our defaults system)
  if (!config) {
    return (
      <StandardPageWrapper moduleName="admin" currentPage="configuration">

        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className={`${getTextStyle('sectionTitle', 'light')} mb-4`}>
            Configuration Not Available
          </h2>
          <p className={`${getTextStyle('body', 'light')} text-gray-600 mb-6`}>
            Unable to load display configuration. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className={`${getButtonStyle('primary')} px-6 py-3`}
          >
            Refresh Page
          </button>
        </div>
      </StandardPageWrapper>
    );
  }

  // Main render with configuration loaded
  return (
    <StandardPageWrapper moduleName="admin" currentPage="configuration">
      
      {/* Header */}

      {/* Configuration Status Summary */}
      <div className={`${getCardStyle('primary')} mb-8`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`${getTextStyle('sectionTitle', 'light')} mb-2`}>
              Display Configuration
            </h2>
            <p className={`${getTextStyle('body', 'light')} text-gray-600`}>
              Configure which fields are displayed in delivery result screens.
            </p>
          </div>

          {/* Security Legend in the middle */}
          <div className="flex-shrink-0">
            <SecurityLegend />
          </div>
          
          <div className="flex items-center gap-3">
            {/* Configuration Stats */}
            <div className="text-right text-sm text-gray-600">
              <div className="font-medium text-green-600">
                {Object.values(config.fields).filter(f => f.enabled).length} enabled
              </div>
              <div>
                {Object.keys(config.fields).length} total fields
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className={`${getButtonStyle('outline')} px-4 py-2 text-sm`}
                title="Reset all fields to default settings"
              >
                Reset to Defaults
              </button>
              
              <button
                onClick={handleSave}
                className={`${getButtonStyle('primary')} px-4 py-2 text-sm`}
                title="Save current configuration"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Configuration Sections */}
      <div className="space-y-8">
        
        {/* Mandatory Fields Section */}
        <div className={`${getCardStyle('primary')}`}>
          <h2 className={`${getTextStyle('sectionTitle', 'light')} mb-2`}>
            Mandatory Fields ({Object.values(config.fields).filter(f => f.category === 'mandatory').length})
          </h2>
          <p className={`${getTextStyle('body', 'light')} text-gray-600 mb-6`}>
            These fields are required for compliance and cannot be disabled. They will always appear in delivery results.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(config.fields)
              .filter(([_, fieldConfig]) => fieldConfig.category === 'mandatory')
              .sort(([_, a], [__, b]) => a.order - b.order)
              .map(([fieldKey, fieldConfig]) => (
                <ConfigCardNew
                  key={fieldKey}
                  fieldKey={fieldKey as any}
                  fieldConfig={fieldConfig}
                  onToggle={handleToggle}
                  showPositiveFeedback={true}
                />
              ))}
          </div>
        </div>

        {/* Optional Fields Section */}
        <div className={`${getCardStyle('primary')}`}>
          <h2 className={`${getTextStyle('sectionTitle', 'light')} mb-2`}>
            Optional Fields ({Object.values(config.fields).filter(f => f.category === 'optional').length})
          </h2>
          <p className={`${getTextStyle('body', 'light')} text-gray-600 mb-6`}>
            These fields can be enabled or disabled based on your business needs. Toggle them on/off to customize your delivery result displays.
          </p>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(config.fields)
              .filter(([_, fieldConfig]) => fieldConfig.category === 'optional')
              .sort(([_, a], [__, b]) => a.order - b.order)
              .map(([fieldKey, fieldConfig]) => (
                <ConfigCardNew
                  key={fieldKey}
                  fieldKey={fieldKey as any}
                  fieldConfig={fieldConfig}
                  onToggle={handleToggle}
                  showPositiveFeedback={true}
                />
              ))}
          </div>
        </div>

        {/* Enabled Fields Summary */}
        <div className={`${getCardStyle('primary')}`}>
          <h2 className={`${getTextStyle('sectionTitle', 'light')} mb-4`}>
            Currently Enabled Fields
          </h2>
          
          <div className="flex flex-wrap gap-2">
            {Object.entries(config.fields)
              .filter(([_, fieldConfig]) => fieldConfig.enabled)
              .sort(([_, a], [__, b]) => a.order - b.order)
              .map(([fieldKey, fieldConfig]) => (
                <span
                  key={fieldKey}
                  className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${fieldConfig.category === 'mandatory' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }
                  `}
                >
                  #{fieldConfig.order} {fieldConfig.label}
                </span>
              ))}
          </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <p>Changes are saved automatically when you toggle fields.</p>
          <p>Use "Save Configuration" to manually trigger a save.</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className={`${getButtonStyle('outline')} px-6 py-3`}
          >
            Reset All to Defaults
          </button>
          
          <button
            onClick={handleSave}
            className={`${getButtonStyle('primary')} px-6 py-3 font-semibold`}
          >
            Save Configuration
          </button>
        </div>
      </div>

    </StandardPageWrapper>
  );
}