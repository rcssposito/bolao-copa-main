import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/matches/finished
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const comp = searchParams.get('competition');

    const now = new Date().toISOString();
    let allMatches: any[] = [];
    let from = 0;
    const limit = 1000;
    while (true) {
      let query = supabase
        .from('matches')
        .select('*')
        .or(`status.neq.SCHEDULED,data.lte.${now}`)
        .order('data', { ascending: false })
        .range(from, from + limit - 1);

      if (comp) {
        query = query.eq('competition', comp);
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
