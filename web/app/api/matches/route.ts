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
      comp = configData?.value || 'WC';
    }

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'SCHEDULED')
      .eq('competition', comp)
      .order('data', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
