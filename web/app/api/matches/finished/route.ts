import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/matches/finished
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const comp = searchParams.get('competition');

    const now = new Date().toISOString();
    let query = supabase
      .from('matches')
      .select('*')
      .or(`status.neq.SCHEDULED,data.lte.${now}`)
      .order('data', { ascending: false });

    if (comp) {
      query = query.eq('competition', comp);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
