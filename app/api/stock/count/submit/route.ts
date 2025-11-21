import { NextResponse } from 'next/server';
import { 
  getAuthenticatedClientId, 
  errorResponse, 
  validateRequired,
  calculateNetWeight,
  calculateQuantityFromWeight,
  calculateBottleEquivalent,
  formatDate
} from '@/lib/api-utils';
import type { CountSubmissionRequest, CountSubmissionResponse } from '@/types/stock';

export async function POST(request: Request) {
  try {
    const { client_id, user_id, supabase } = await getAuthenticatedClientId();
    const body: CountSubmissionRequest = await request.json();
    
    // Validate
    const validationError = validateRequired(body, ['inventory_item_id', 'counting_method']);
    if (validationError) {
      return errorResponse(validationError, 400);
    }
    
    // Get item details
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', body.inventory_item_id)
      .eq('client_id', client_id)
      .single();
    
    if (itemError || !item) {
      return errorResponse('Item not found', 404);
    }
    
    // Validate counting method matches item workflow
    if (item.requires_container && body.counting_method !== 'weight') {
      return errorResponse('This item requires weight-based counting', 400);
    }
    
    // WEIGHT-BASED VALIDATION
    if (body.counting_method === 'weight') {
      if (!body.gross_weight_grams || !body.tare_weight_grams) {
        return errorResponse('Weight counting requires gross_weight_grams and tare_weight_grams', 400);
      }
      
      // Run anomaly detection
      const anomalyResponse = await fetch(
        new URL('/api/stock/count/validate', request.url).toString(),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inventory_item_id: body.inventory_item_id,
            container_instance_id: body.container_instance_id,
            measured_weight_grams: body.gross_weight_grams,
            tare_weight_grams: body.tare_weight_grams,
            context: 'count_submission'
          })
        }
      );
      
      const anomalyResult = await anomalyResponse.json();
      
      // Block critical anomalies
      if (!anomalyResult.can_proceed) {
        return NextResponse.json({
          error: 'Critical anomaly detected - cannot proceed',
          anomalies: anomalyResult.anomalies,
          can_proceed: false
        }, { status: 400 });
      }
      
      // Store anomalies for logging
      if (anomalyResult.has_anomaly) {
        body.anomaly_notes = anomalyResult.anomalies
          .map((a: any) => `${a.severity.toUpperCase()}: ${a.message}`)
          .join('; ');
      }
    }
    
    // CALCULATE FINAL QUANTITY
    let finalQuantity: number;
    let netWeight: number | undefined;
    let calculatedQuantity: number | undefined;
    
    if (body.counting_method === 'weight') {
      netWeight = calculateNetWeight(
        body.gross_weight_grams!,
        body.tare_weight_grams!
      );
      
      if (item.is_bottled_product && item.counting_workflow === 'bottle_hybrid') {
        // BOTTLE HYBRID: Full + Partial
        const fullBottles = body.full_bottles_count || 0;
        const partialEquivalent = body.partial_bottles_weight
          ? calculateBottleEquivalent(
              body.partial_bottles_weight,
              item.empty_bottle_weight_grams || 0,
              item.full_bottle_weight_grams || 0
            )
          : 0;
        
        finalQuantity = fullBottles + partialEquivalent;
        calculatedQuantity = finalQuantity;
        
      } else if (item.typical_unit_weight_grams) {
        // STANDARD WEIGHT-BASED
        calculatedQuantity = calculateQuantityFromWeight(
          netWeight,
          item.typical_unit_weight_grams
        );
        finalQuantity = calculatedQuantity;
        
      } else {
        // Weight provided but no unit weight - store as raw weight
        finalQuantity = netWeight / 1000; // Convert to kg
        calculatedQuantity = finalQuantity;
      }
      
    } else {
      // MANUAL COUNT
      if (body.counted_quantity === undefined) {
        return errorResponse('Manual counting requires counted_quantity', 400);
      }
      finalQuantity = body.counted_quantity;
    }
    
    // CREATE COUNT RECORD
    const countData: any = {
      client_id,
      inventory_item_id: body.inventory_item_id,
      counted_quantity: finalQuantity,
      count_date: formatDate(new Date()),
      count_time: new Date().toTimeString().split(' ')[0],
      count_type: 'regular',
      counted_by_user_id: user_id,
      counting_method: body.counting_method,
      
      // Weight data
      container_instance_id: body.container_instance_id || null,
      gross_weight_grams: body.gross_weight_grams || null,
      tare_weight_grams: body.tare_weight_grams || null,
      net_weight_grams: netWeight || null,
      unit_weight_grams: body.unit_weight_grams || item.typical_unit_weight_grams || null,
      calculated_quantity: calculatedQuantity || null,
      confidence_score: body.counting_method === 'weight' ? 0.95 : 0.80,
      
      // Bottle data
      full_bottles_count: body.full_bottles_count || null,
      partial_bottles_weight: body.partial_bottles_weight || null,
      partial_bottles_equivalent: body.counting_method === 'weight' && item.is_bottled_product
        ? (finalQuantity - (body.full_bottles_count || 0))
        : null,
      
      // Keg data
      keg_tapped_date: body.keg_tapped_date || null,
      keg_temperature_celsius: body.keg_temperature_celsius || null,
      
      // Device
      scale_device_id: body.scale_device_id || null,
      scale_brand: body.scale_brand || null,
      
      // Anomalies
      has_anomalies: !!body.anomaly_notes,
      anomaly_notes: body.anomaly_notes || null,
      
      notes: body.notes || null
    };
    
    const { data: count, error } = await supabase
      .from('inventory_counts')
      .insert(countData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating count:', error);
      return errorResponse(error.message, 500);
    }
    
    // UPDATE CONTAINER ASSIGNMENT
    if (body.container_instance_id) {
      await supabase
        .from('item_container_assignments')
        .upsert({
          client_id,
          inventory_item_id: body.inventory_item_id,
          container_instance_id: body.container_instance_id,
          last_counted_date: formatDate(new Date()),
          last_counted_quantity: finalQuantity,
          last_gross_weight_grams: body.gross_weight_grams,
          is_active: true
        }, {
          onConflict: 'inventory_item_id,container_instance_id'
        });
      
      // Update container usage
      await supabase
        .from('container_instances')
        .update({
          times_used: supabase.raw('times_used + 1'),
          last_used_date: formatDate(new Date())
        })
        .eq('id', body.container_instance_id);
    }
    
    // UPDATE KEG TRACKING
    if (item.is_keg && body.gross_weight_grams) {
      const { data: keg } = await supabase
        .from('keg_tracking')
        .select('id')
        .eq('inventory_item_id', body.inventory_item_id)
        .in('keg_status', ['full', 'tapped'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (keg) {
        await supabase.rpc('update_keg_tracking_status', {
          keg_id: keg.id,
          new_weight_grams: body.gross_weight_grams
        });
        
        // Add temperature if provided
        if (body.keg_temperature_celsius) {
          await supabase
            .from('keg_tracking')
            .update({
              current_temperature_celsius: body.keg_temperature_celsius,
              last_temperature_check: new Date().toISOString()
            })
            .eq('id', keg.id);
        }
      }
    }
    
    const response: CountSubmissionResponse = {
      count,
      final_quantity: finalQuantity,
      success: true
    };
    
    return NextResponse.json(response, { status: 201 });
    
  } catch (error: any) {
    console.error('POST /api/stock/count/submit error:', error);
    return errorResponse(error.message, error.message === 'Unauthorized' ? 401 : 500);
  }
}