import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// PUT /api/admin/config/pot
// Update pot cota configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { value } = body;

    if (value === undefined) {
      return NextResponse.json({ error: 'Valor da cota não fornecido' }, { status: 400 });
    }

    // Check if configuration exists
    const { data: existing, error: selectError } = await supabase
      .from('config')
      .select('*')
      .eq('key', 'pot_value')
      .maybeSingle();

    if (selectError) throw selectError;

    let responseData;

    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('config')
        .update({
          value: value.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('key', 'pot_value')
        .select()
        .single();
      
      if (error) throw error;
      responseData = data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('config')
        .insert({
          key: 'pot_value',
          value: value.toString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      responseData = data;
    }

    return NextResponse.json(responseData, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
