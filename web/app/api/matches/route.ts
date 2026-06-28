import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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

    const all = searchParams.get('all') === 'true';

    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() + 30);

    let allMatches: any[] = [];
    let from = 0;
    const limit = 1000;
    while (true) {
      let query = supabase
        .from('matches')
        .select('*')
        .eq('competition', comp)
        .order('data', { ascending: true })
        .range(from, from + limit - 1);

      if (!all) {
        query = query.eq('status', 'SCHEDULED')
                     .lte('data', limitDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) break;

      allMatches = allMatches.concat(data);
      if (data.length < limit) break;
      from += limit;
    }

    return NextResponse.json(allMatches, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
