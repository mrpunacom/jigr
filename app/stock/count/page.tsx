'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getModuleConfig } from '@/lib/module-config';
import { ModuleHeader } from '@/app/components/ModuleHeader';
import { ResponsiveLayout } from '@/app/components/ResponsiveLayout';
import { ModuleCard } from '@/app/components/ModuleCard';
import { MethodSelector } from '@/app/components/stock/counting/MethodSelector';
import { ItemSearchSelector } from '@/app/components/stock/counting/ItemSearchSelector';
import { ManualCountInput } from '@/app/components/stock/counting/ManualCountInput';
import { WeightCountInput } from '@/app/components/stock/counting/WeightCountInput';
import { BottleCountInput } from '@/app/components/stock/counting/BottleCountInput';
import { KegCountInput } from '@/app/components/stock/counting/KegCountInput';
import { AnomalyAlert } from '@/app/components/stock/counting/AnomalyAlert';
import { CountSummary } from '@/app/components/stock/counting/CountSummary';

export default function CountingInterface() {
  const router = useRouter();
  const [countingMethod, setCountingMethod] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [countData, setCountData] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stockModule = getModuleConfig('stock');

  const handleMethodSelect = (method: string) => {
    setCountingMethod(method);
    setSelectedItem(null); // Reset item when changing method
  };

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
  };

  const handleCountSubmit = async (data: any) => {
    try {
      // First, validate and detect anomalies
      const validateResponse = await fetch('/api/stock/count/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const validationResult = await validateResponse.json();
      
      // Check for critical anomalies
      if (!validationResult.can_proceed) {
        setAnomalies(validationResult.anomalies);
        return; // Don't proceed with count
      }
      
      // Show warnings but allow to proceed
      if (validationResult.has_anomaly) {
        setAnomalies(validationResult.anomalies);
      } else {
        setAnomalies([]);
      }
      
      // Add to count batch
      const countEntry = {
        ...data,
        item: selectedItem,
        timestamp: new Date().toISOString(),
        anomalies: validationResult.anomalies || []
      };
      
      setCountData(prev => [...prev, countEntry]);
      
      // Reset for next item
      setSelectedItem(null);
      
    } catch (error) {
      console.error('Error submitting count:', error);
      // Show error to user
    }
  };

  const handleBatchSubmit = async () => {
    if (countData.length === 0) return;
    
    setIsSubmitting(true);
    
    try {
      // Submit each count individually
      const results = await Promise.all(
        countData.map(async (count) => {
          const response = await fetch('/api/stock/count/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(count)
          });
          
          if (!response.ok) {
            throw new Error(`Failed to submit count for ${count.item.item_name}`);
          }
          
          return response.json();
        })
      );
      
      // Success - redirect to dashboard with success message
      router.push('/stock?success=count_submitted');
      
    } catch (error) {
      console.error('Error submitting batch:', error);
      // Show error to user
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearAnomalies = () => {
    setAnomalies([]);
  };

  const handleStartOver = () => {
    setCountingMethod(null);
    setSelectedItem(null);
    setCountData([]);
    setAnomalies([]);
  };

  return (
    <ResponsiveLayout>
      <ModuleHeader module={stockModule!} currentPage="action" />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Count Inventory
            </h1>
            <p className="text-white/70">
              Select your counting method and start recording inventory
            </p>
          </div>

          {/* Main Content Area */}
          <div className="space-y-6">
            {/* Step 1: Method Selection */}
            {!countingMethod && (
              <ModuleCard theme="light" className="p-6">
                <MethodSelector onSelect={handleMethodSelect} />
              </ModuleCard>
            )}

            {/* Step 2: Item Selection */}
            {countingMethod && !selectedItem && (
              <ModuleCard theme="light" className="p-6">
                <ItemSearchSelector 
                  method={countingMethod}
                  onSelect={handleItemSelect}
                />
                
                {/* Back Button */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={() => setCountingMethod(null)}
                    className="
                      px-4 py-2 rounded-xl
                      bg-white/10 text-white
                      hover:bg-white/20
                      transition-colors duration-200
                    "
                  >
                    ← Change Method
                  </button>
                </div>
              </ModuleCard>
            )}

            {/* Step 3: Count Entry (method-specific) */}
            {selectedItem && (
              <ModuleCard theme="light" className="p-6">
                {countingMethod === 'unit_count' && (
                  <ManualCountInput 
                    item={selectedItem}
                    onSubmit={handleCountSubmit}
                    onBack={() => setSelectedItem(null)}
                  />
                )}
                
                {countingMethod === 'container_weight' && (
                  <WeightCountInput 
                    item={selectedItem}
                    onSubmit={handleCountSubmit}
                    onBack={() => setSelectedItem(null)}
                  />
                )}
                
                {countingMethod === 'bottle_hybrid' && (
                  <BottleCountInput 
                    item={selectedItem}
                    onSubmit={handleCountSubmit}
                    onBack={() => setSelectedItem(null)}
                  />
                )}
                
                {countingMethod === 'keg_weight' && (
                  <KegCountInput 
                    item={selectedItem}
                    onSubmit={handleCountSubmit}
                    onBack={() => setSelectedItem(null)}
                  />
                )}
              </ModuleCard>
            )}

            {/* Anomaly Alerts */}
            {anomalies.length > 0 && (
              <AnomalyAlert 
                anomalies={anomalies}
                onOverride={handleClearAnomalies}
                onRecount={() => setSelectedItem(null)}
              />
            )}

            {/* Count Summary (sticky bottom) */}
            {countData.length > 0 && (
              <div className="sticky bottom-4">
                <CountSummary 
                  counts={countData}
                  onSubmit={handleBatchSubmit}
                  onClear={() => setCountData([])}
                  isSubmitting={isSubmitting}
                />
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex justify-center gap-3 pb-8">
              {(countingMethod || countData.length > 0) && (
                <button
                  onClick={handleStartOver}
                  className="
                    px-6 py-3 rounded-xl
                    bg-white/10 text-white
                    hover:bg-white/20
                    transition-colors duration-200
                  "
                >
                  Start Over
                </button>
              )}
              
              <button
                onClick={() => router.push('/stock')}
                className="
                  px-6 py-3 rounded-xl
                  bg-white/10 text-white
                  hover:bg-white/20
                  transition-colors duration-200
                "
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>
    </ResponsiveLayout>
  );
}