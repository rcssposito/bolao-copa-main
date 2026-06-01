import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/matches
// Returns matches that are SCHEDULED (available for betting), filtered by competition
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let comp = searchParams.get('competition');

    if (!comp) {
      const { data: configData } = await supabase
        .from('config')
        .select('value')
        .eq('key', 'active_competition')
        .maybeSingle();
      const activeValue = configData?.value || 'WC';
      comp = activeValue.split(',')[0].trim() || 'WC';
    } else if (comp.includes(',')) {
      comp = comp.split(',')[0].trim();
    }

    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 30);

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'SCHEDULED')
      .eq('competition', comp)
      .lte('data', limitDate.toISOString())
      .order('data', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
