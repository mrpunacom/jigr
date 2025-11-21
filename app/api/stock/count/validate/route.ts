import { NextResponse } from 'next/server';
import { getAuthenticatedClientId, errorResponse } from '@/lib/api-utils';
import type { AnomalyDetectionResult, WeightAnomaly } from '@/types/stock';

export async function POST(request: Request) {
  try {
    const { client_id, supabase } = await getAuthenticatedClientId();
    const body = await request.json();
    
    const {
      inventory_item_id,
      container_instance_id,
      measured_weight_grams,
      tare_weight_grams,
      context
    } = body;
    
    const anomalies: WeightAnomaly[] = [];
    
    // Get container info if provided
    let container = null;
    if (container_instance_id) {
      const { data } = await supabase
        .from('container_instances')
        .select('*, container_type:container_tare_weights(*)')
        .eq('id', container_instance_id)
        .single();
      container = data;
    }
    
    // RULE 1: Tare Weight Error (CRITICAL)
    const effectiveTare = container?.tare_weight_grams || tare_weight_grams || 0;
    if (measured_weight_grams < effectiveTare) {
      anomalies.push({
        type: 'tare_weight_error',
        severity: 'critical',
        message: `Measured weight (${measured_weight_grams.toFixed(1)}g) is less than tare weight (${effectiveTare}g)`,
        suggested_action: 'Check if correct container was scanned. Verify scale calibration.',
        confidence_score: 1.0
      });
    }
    
    // RULE 2: Negative Weight (CRITICAL)
    if (measured_weight_grams < 0) {
      anomalies.push({
        type: 'negative_weight',
        severity: 'critical',
        message: 'Measured weight is negative',
        suggested_action: 'Recalibrate scale or check connections',
        confidence_score: 1.0
      });
    }
    
    // RULE 3: Empty Container Detection (WARNING)
    if (container) {
      const netWeight = measured_weight_grams - effectiveTare;
      if (netWeight < 10 && netWeight >= 0) {
        anomalies.push({
          type: 'empty_container',
          severity: 'warning',
          message: `Container appears empty (${netWeight.toFixed(1)}g net weight)`,
          suggested_action: 'If intentionally empty, proceed. Otherwise, check if product was forgotten.',
          confidence_score: 0.95
        });
      }
    }
    
    // RULE 4: Statistical Outlier (WARNING)
    if (inventory_item_id) {
      const { data: history } = await supabase
        .from('inventory_counts')
        .select('gross_weight_grams')
        .eq('inventory_item_id', inventory_item_id)
        .eq('counting_method', 'weight')
        .not('gross_weight_grams', 'is', null)
        .order('count_date', { ascending: false })
        .limit(20);
      
      if (history && history.length >= 5) {
        const weights = history.map(h => h.gross_weight_grams!);
        const mean = weights.reduce((sum, w) => sum + w, 0) / weights.length;
        const variance = weights.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / weights.length;
        const stdDev = Math.sqrt(variance);
        const zScore = stdDev > 0 ? Math.abs((measured_weight_grams - mean) / stdDev) : 0;
        
        if (zScore > 3.0) {
          anomalies.push({
            type: 'outlier_weight',
            severity: 'warning',
            message: `Weight is ${zScore.toFixed(1)} standard deviations from historical average`,
            suggested_action: `Verify measurement. Historical average: ${mean.toFixed(0)}g`,
            confidence_score: 0.85
          });
        }
      }
    }
    
    // RULE 5: Impossible Weight (ERROR)
    if (container?.container_type?.max_capacity_ml) {
      // Assume max density of 1.2 kg/L for food products
      const maxPossibleNet = (container.container_type.max_capacity_ml / 1000) * 1200;
      const netWeight = measured_weight_grams - effectiveTare;
      
      if (netWeight > maxPossibleNet) {
        anomalies.push({
          type: 'impossible_weight',
          severity: 'error',
          message: `Net weight (${netWeight.toFixed(0)}g) exceeds container capacity`,
          suggested_action: 'Check if correct container type was scanned',
          confidence_score: 0.90
        });
      }
    }
    
    // Determine result
    const hasCritical = anomalies.some(a => a.severity === 'critical');
    const hasError = anomalies.some(a => a.severity === 'error');
    const hasWarning = anomalies.some(a => a.severity === 'warning');
    
    const result: AnomalyDetectionResult = {
      has_anomaly: anomalies.length > 0,
      anomalies,
      can_proceed: !hasCritical,
      require_confirmation: hasError || hasWarning
    };
    
    // Log anomaly if detected
    if (result.has_anomaly) {
      await supabase
        .from('weight_anomaly_detections')
        .insert({
          client_id,
          detection_type: context || 'count',
          inventory_item_id,
          container_instance_id,
          anomaly_type: anomalies[0].type,
          severity: anomalies[0].severity,
          measured_weight_grams,
          detection_rule: anomalies[0].type,
          confidence_score: anomalies[0].confidence_score
        });
    }
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('POST /api/stock/count/validate error:', error);
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}